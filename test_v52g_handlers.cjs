// TEAM360 V5.2G: execute REAL GET/POST/PATCH TypeScript handlers against in-memory SQLite.
// Place this file in project root; run: node .\test_v52g_handlers.cjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const root = process.cwd();
const issPath = path.join(root,'app/api/directive-issuances/route.ts');
const exePath = path.join(root,'app/api/directive-executions/route.ts');
const migPath = path.join(root,'drizzle/0009_directive_issuance.sql');
for(const p of [issPath,exePath,migPath]) if(!fs.existsSync(p)) throw Error('STOP: file missing: '+p);
const issSource=fs.readFileSync(issPath,'utf8');
const exeSource=fs.readFileSync(exePath,'utf8');
if(!issSource.includes('TEAM360_V52C_ISSUANCES') || !exeSource.includes('TEAM360_V52E_ASSIGNEE_ACCESS')) throw Error('STOP: V5.2C/V5.2E API version mismatch');
if(!exeSource.includes('AND updated_at=?),?,?,?,?)')) throw Error('STOP: V5.2D audit fix not detected');
const db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
db.exec(`
CREATE TABLE memberships(workspace_id TEXT NOT NULL,user_id TEXT NOT NULL,status TEXT NOT NULL,role TEXT NOT NULL,PRIMARY KEY(workspace_id,user_id));
CREATE TABLE shared_tasks(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,assigned_to TEXT,created_by TEXT NOT NULL,archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE directive_drafts(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,task_id TEXT NOT NULL,version INTEGER NOT NULL,created_by TEXT NOT NULL);
CREATE TABLE directive_approvals(draft_id TEXT PRIMARY KEY,status TEXT NOT NULL,workflow_version INTEGER NOT NULL,submitted_version INTEGER NOT NULL);
`);
db.exec(fs.readFileSync(migPath,'utf8'));
const WS='ws_test_v52g',TASK='task_v52g',DRAFT='dir_v52g';
const ADMIN='usr_admin_v52g', LEADER='usr_leader_v52g', A='usr_assignee_a',B='usr_assignee_b', OUT='usr_outsider', REV='usr_revoked';
for(const [id,role,status] of [[ADMIN,'admin','active'],[LEADER,'leader','active'],[A,'member','active'],[B,'member','active'],[OUT,'member','active'],[REV,'member','inactive']]) {
 db.prepare('INSERT INTO memberships VALUES (?,?,?,?)').run(WS,id,status,role);
}
db.prepare('INSERT INTO shared_tasks VALUES (?,?,?,?,0)').run(TASK,WS,null,ADMIN);
db.prepare('INSERT INTO directive_drafts VALUES (?,?,?,?,?)').run(DRAFT,WS,TASK,1,ADMIN);
db.prepare('INSERT INTO directive_approvals VALUES (?,?,?,?)').run(DRAFT,'submitted',2,1);
const driver={
 prepare(sql){return {bind(...args){const q=db.prepare(sql);return {
  async first(){return q.get(...args)||null;},async all(){return {results:q.all(...args)};},
  async run(){const r=q.run(...args);return {success:true,meta:{changes:Number(r.changes)}};},
  _syncRun(){const r=q.run(...args);return {success:true,meta:{changes:Number(r.changes)}};}
 };}};},
 async batch(queries){db.exec('BEGIN IMMEDIATE');try{const out=queries.map(q=>q._syncRun());db.exec('COMMIT');return out;}catch(err){db.exec('ROLLBACK');throw err;}}
};
let actor=null;
const mocks={
 'cloudflare:workers':{env:{DB:driver}},
 '../../chatgpt-auth':{getChatGPTUser:async()=>actor?{userId:actor}:null},
 '../../../lib/auth-api':{
  validWriteOrigin(req){let origin=req.headers.get('origin');return Boolean(origin && origin!=='null'&&new URL(origin).origin===new URL(req.url).origin);},
  isJsonRequest(req){return /^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||'');}
 }
};
function load(source,file){
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const out={exports:{}};
 vm.runInNewContext(js,{exports:out.exports,module:out,require(id){if(!(id in mocks)) throw Error('Unexpected import '+id);return mocks[id];},Request,Response,URL,crypto:globalThis.crypto,Date,JSON,Array,Object,String,Number,Error,Set,console},{filename:file,timeout:5000});
 return out.exports;
}
const iss=load(issSource,issPath),exe=load(exeSource,exePath);
const origin='http://127.0.0.1:5173';
async function call(handlers,method,user,query,body,overrideOrigin=origin){
 actor=user;
 const url=origin+'/api/fixture'+(query?'?'+new URLSearchParams(query):'');
 const req=new Request(url,{method,headers:method==='GET'?{}:{'Content-Type':'application/json','Origin':overrideOrigin},...(method==='GET'?{}:{body:JSON.stringify(body)})});
 const res=await handlers[method](req);return {status:res.status,body:await res.json()};
}
let total=0;function check(name,condition){assert.ok(condition,name);total++;console.log('PASS:',name);}
const ic={workspaceId:WS,taskId:TASK,draftId:DRAFT};
const publish=(num='QD-001')=>({...ic,approvedWorkflowVersion:2,approvedDraftVersion:1,documentNumber:num});
const all=(tbl)=>Number(db.prepare('SELECT COUNT(*) n FROM '+tbl).get().n);
(async()=>{
 let r=await call(iss,'GET',null,ic);check('anonymous issuance GET rejected',r.status===401);
 r=await call(iss,'POST',null,null,publish());check('anonymous issuance POST rejected',r.status===401);
 r=await call(iss,'POST',ADMIN,null,publish(),'https://invalid.example');check('cross-origin issuance rejected',r.status===403);
 r=await call(iss,'POST',ADMIN,null,publish());check('unapproved issuance rejected',r.status===409&&all('directive_issuances')===0);
 db.prepare("UPDATE directive_approvals SET status='approved'").run();
 r=await call(iss,'POST',A,null,publish());check('member cannot issue',r.status===403);
 r=await call(iss,'POST',ADMIN,null,publish());check('approved directive issued with audit',r.status===201&&all('directive_issuances')===1&&all('directive_issuance_events')===1);
 const issuanceId=r.body.id;
 r=await call(iss,'POST',ADMIN,null,publish('QD-002'));check('duplicate issue rejected',r.status===409&&all('directive_issuances')===1&&all('directive_issuance_events')===1);
 r=await call(iss,'GET',ADMIN,ic);check('leader can read issued record',r.status===200&&r.body.issuance.id===issuanceId&&r.body.events.length===1);
 r=await call(iss,'GET',OUT,ic);check('unrelated member cannot read source draft',r.status===403);
 const ec={workspaceId:WS,issuanceId};
 r=await call(exe,'POST',OUT,null,{...ec,assigneeId:A,description:'Test'});check('member cannot assign',r.status===403);
 r=await call(exe,'POST',ADMIN,null,{...ec,assigneeId:REV,description:'Test'});check('inactive assignee rejected',r.status===400);
 r=await call(exe,'POST',ADMIN,null,{...ec,assigneeId:A,description:'A works',dueDate:'2026-11-01'});
 check('leader assignment A + audit',r.status===201&&all('directive_execution_items')===1&&all('directive_execution_events')===1);
 const itemA=r.body.id;
 r=await call(exe,'POST',ADMIN,null,{...ec,assigneeId:B,description:'B works'});
 check('leader assignment B + audit',r.status===201&&all('directive_execution_items')===2&&all('directive_execution_events')===2);
 const itemB=r.body.id;
 r=await call(exe,'GET',A,ec);check('assignee A sees only own item without original task access',r.status===200&&r.body.items.length===1&&r.body.items[0].id===itemA);
 r=await call(exe,'GET',B,ec);check('assignee B sees only own item',r.status===200&&r.body.items.length===1&&r.body.items[0].id===itemB);
 r=await call(exe,'GET',OUT,ec);check('unassigned active member sees no items',r.status===200&&r.body.items.length===0);
 r=await call(exe,'GET',ADMIN,ec);check('leader sees all assigned items',r.status===200&&r.body.items.length===2);
 const patch=(itemId,status,note='')=>({...ec,itemId,status,note});
 r=await call(exe,'PATCH',OUT,null,patch(itemA,'in_progress'));check('unassigned member cannot change item',r.status===403&&all('directive_execution_events')===2);
 r=await call(exe,'PATCH',A,null,patch(itemA,'cancelled'));check('assignee cannot cancel',r.status===409&&all('directive_execution_events')===2);
 r=await call(exe,'PATCH',A,null,patch(itemA,'in_progress','Started'));
 check('assignee starts own item + audit',r.status===200&&all('directive_execution_events')===3);
 r=await call(exe,'PATCH',A,null,patch(itemA,'in_progress'));check('invalid repeated progress rejected',r.status===409&&all('directive_execution_events')===3);
 db.prepare("UPDATE memberships SET status='inactive' WHERE workspace_id=? AND user_id=?").run(WS,A);
 r=await call(exe,'PATCH',A,null,patch(itemA,'completed'));check('revoked assignee cannot complete',r.status===403&&all('directive_execution_events')===3);
 db.prepare("UPDATE memberships SET status='active' WHERE workspace_id=? AND user_id=?").run(WS,A);
 r=await call(exe,'PATCH',A,null,patch(itemA,'completed','Done'));
 check('assignee completion and audit persist',r.status===200&&all('directive_execution_events')===4&&db.prepare('SELECT status FROM directive_execution_items WHERE id=?').get(itemA).status==='completed');
 r=await call(exe,'PATCH',ADMIN,null,patch(itemB,'cancelled','Withdrawn'));
 check('leader cancellation audited',r.status===200&&all('directive_execution_events')===5);
 r=await call(exe,'PATCH',B,null,patch(itemB,'in_progress'));check('cancelled item cannot reopen via PATCH',r.status===409&&all('directive_execution_events')===5);
 check('foreign keys intact',db.prepare('PRAGMA foreign_key_check').all().length===0);
 console.log('V5.2G HANDLER ISOLATED PASS:',total,'checks');
 console.log('SOURCE D1: NOT OPENED; MEMORY DATABASE ONLY');
 console.log('NOTE: Identity and D1 bindings mocked; real Cloudflare login/worker E2E not tested.');
})().catch(err=>{console.error('V5.2G FAILED:',err);process.exitCode=1;}).finally(()=>db.close());
