// V5.1L: execute actual TypeScript GET/POST handler with controlled identity and isolated SQLite.
// Run from TEAM360 project root: node .\test_v51l_route.cjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');

const root = process.cwd();
const apiPath = path.join(root, 'app/api/directive-approvals/route.ts');
const migration7 = path.join(root, 'drizzle/0007_directive_approvals.sql');
const migration8 = path.join(root, 'drizzle/0008_directive_edit_guard.sql');
for (const file of [apiPath, migration7, migration8]) {
  if (!fs.existsSync(file)) throw Error('STOP: Missing ' + file);
}
const apiText = fs.readFileSync(apiPath, 'utf8');
if (!apiText.includes('TEAM360_APPROVAL_GUARD_V51I')) throw Error('STOP: Expected V5.1I API');
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
db.exec(`
CREATE TABLE memberships(workspace_id TEXT NOT NULL,user_id TEXT NOT NULL,status TEXT NOT NULL,role TEXT NOT NULL,PRIMARY KEY(workspace_id,user_id));
CREATE TABLE shared_tasks(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,assigned_to TEXT,created_by TEXT NOT NULL,archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE directive_drafts(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,task_id TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',version INTEGER NOT NULL,created_by TEXT NOT NULL);
`);
db.exec(fs.readFileSync(migration7, 'utf8'));
db.exec(fs.readFileSync(migration8, 'utf8'));
const WS = 'ws_test_v51l', TASK='task_test_v51l', DRAFT='dir_test_v51l';
const author='usr_author_test', reviewer='usr_reviewer_test', other='usr_other_test', member='usr_member_test';
for (const [id,role] of [[author,'admin'],[reviewer,'leader'],[other,'leader'],[member,'member']]) {
  db.prepare('INSERT INTO memberships(workspace_id,user_id,status,role) VALUES(?,?,?,?)').run(WS,id,'active',role);
}
db.prepare('INSERT INTO shared_tasks(id,workspace_id,assigned_to,created_by,archived) VALUES(?,?,?,?,0)').run(TASK,WS,member,author);
db.prepare('INSERT INTO directive_drafts(id,workspace_id,task_id,title,body,status,version,created_by) VALUES(?,?,?,?,?,?,?,?)').run(DRAFT,WS,TASK,'Test','Draft v1','draft',1,author);

const driver = {
  prepare(sql) {
    return {bind(...args) {
      const prepared = db.prepare(sql);
      return {
        async first() { return prepared.get(...args) || null; },
        async all() { return { results: prepared.all(...args) }; },
        async run() {const r=prepared.run(...args); return {success:true,meta:{changes:Number(r.changes)}};},
        _syncRun() {const r=prepared.run(...args);return {success:true,meta:{changes:Number(r.changes)}};}
      };
    }};
  },
  async batch(statements) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const results=statements.map(q=>q._syncRun());
      db.exec('COMMIT');
      return results;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
};
let currentId=null;
const mockedImports = {
  'cloudflare:workers': {env:{DB:driver}},
  '../../chatgpt-auth': {getChatGPTUser:async()=>currentId?{userId:currentId}:null},
  '../../../lib/auth-api': {
    validWriteOrigin(req) {
      const origin=req.headers.get('origin');
      const site=req.headers.get('sec-fetch-site');
      return Boolean(origin && origin!=='null' && site!=='cross-site' && new URL(origin).origin===new URL(req.url).origin);
    },
    isJsonRequest(req) {return /^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||'');}
  }
};
const transpiled=ts.transpileModule(apiText,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleObj={exports:{}};
vm.runInNewContext(transpiled, {
  exports:moduleObj.exports,module:moduleObj,require(id) {
    if (!(id in mockedImports)) throw Error('Unexpected import: '+id);
    return mockedImports[id];
  },Request,Response,URL,crypto:globalThis.crypto,console,Date,Set,String,Object,Array,Number,JSON,Error
}, {filename:apiPath,timeout:5000});
const handler=moduleObj.exports;
const endpoint='http://127.0.0.1:5173/api/directive-approvals';
const params=new URLSearchParams({workspaceId:WS,taskId:TASK,draftId:DRAFT});
const count=()=>Number(db.prepare('SELECT COUNT(*) as n FROM directive_approval_events').get().n);
const state=()=>db.prepare('SELECT status,workflow_version,submitted_version,reviewer_id FROM directive_approvals WHERE draft_id=?').get(DRAFT);
let passed=0;
async function call(method, actor, body, origin=endpoint) {
  currentId=actor;
  const req=new Request(method==='GET'?endpoint+'?'+params:endpoint, {
    method,headers:method==='GET'?{}:{'Content-Type':'application/json','Origin':origin},
    ...(method==='GET'?{}:{body:JSON.stringify(body)})
  });
  const response=await handler[method](req);
  const content=await response.json();
  return {status:response.status,body:content};
}
function verify(label, condition) {assert.ok(condition,label);passed++;console.log('PASS:',label);}
const common=(action,draftVersion=1,workflowVersion=1,extra={})=>({workspaceId:WS,taskId:TASK,draftId:DRAFT,action,draftVersion,workflowVersion,...extra});
(async()=>{
  let r=await call('GET',null);verify('anonymous GET denied (401)',r.status===401);
  r=await call('POST',null,common('submit',1,1,{reviewerId:reviewer}));verify('anonymous POST denied (401)',r.status===401);
  r=await call('POST',author,common('submit',1,1,{reviewerId:reviewer}),'https://evil.example');verify('cross-origin POST denied (403)',r.status===403);
  r=await call('GET',author);verify('author GET allowed, canSubmit',r.status===200&&r.body.permissions.canSubmit===true);
  r=await call('POST',author,common('submit',1,1,{reviewerId:author}));verify('self reviewer rejected',r.status===400&&count()===0);
  r=await call('POST',author,common('submit',1,1,{reviewerId:member}));verify('nonleader reviewer rejected',r.status===400&&count()===0);
  r=await call('POST',author,common('submit',1,1,{reviewerId:reviewer}));verify('valid submit + history',r.status===200&&state().status==='submitted'&&count()===1);
  r=await call('POST',author,common('approve'));verify('author cannot approve',r.status===403&&count()===1);
  r=await call('POST',other,common('approve'));verify('unassigned leader cannot approve',r.status===403&&count()===1);
  r=await call('POST',member,common('approve'));verify('member cannot approve',r.status===403&&count()===1);
  r=await call('POST',reviewer,common('reject',1,1,{reason:''}));verify('reject requires reason',r.status===400&&count()===1);
  r=await call('POST',reviewer,common('reject',1,1,{reason:'Needs revision'}));verify('reviewer rejection audited',r.status===200&&state().status==='rejected'&&count()===2);
  r=await call('POST',author,common('resubmit',1,2,{reviewerId:reviewer}));verify('resubmit without draft changes denied',r.status===409&&count()===2);
  db.prepare('UPDATE directive_drafts SET body=?,version=version+1 WHERE id=?').run('Draft v2',DRAFT);
  r=await call('POST',author,common('resubmit',2,2,{reviewerId:reviewer}));verify('edited draft resubmitted + audited',r.status===200&&state().status==='submitted'&&count()===3);
  r=await call('POST',reviewer,common('approve',2,1));verify('stale workflow denied',r.status===409&&count()===3);
  db.prepare('UPDATE memberships SET role=? WHERE workspace_id=? AND user_id=?').run('member',WS,reviewer);
  r=await call('POST',reviewer,common('approve',2,3));verify('demoted reviewer denied',r.status===403&&count()===3);
  db.prepare('UPDATE memberships SET role=? WHERE workspace_id=? AND user_id=?').run('leader',WS,reviewer);
  r=await call('POST',reviewer,common('approve',2,3));verify('valid approval audited',r.status===200&&state().status==='approved'&&count()===4);
  r=await call('GET',author);verify('approved status + 4 events read back',r.status===200&&r.body.approval.status==='approved'&&r.body.events.length===4);
  verify('foreign keys intact',db.prepare('PRAGMA foreign_key_check').all().length===0);
  console.log('V5.1L HANDLER ISOLATED PASS:',passed,'checks');
  console.log('SOURCE D1: NOT OPENED; MEMORY DB ONLY');
  console.log('NOTE: Session identity and Cloudflare D1 bindings mocked; NOT full browser login / real Cloudflare worker E2E');
})().catch(e=>{console.error('V5.1L FAILED:',e);process.exitCode=1;}).finally(()=>db.close());
