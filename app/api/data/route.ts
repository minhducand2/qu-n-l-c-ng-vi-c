import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initial} from '../../../lib/initial';
import {validateTask} from '../../../lib/domain';
const response=(x:any,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store'}});
const db=()=>env.DB as D1Database;
const kinds=['task','department','person','plan','comment','message','settings'];
export async function GET(){const u=await getChatGPTUser();if(!u)return response({error:'Vui lòng đăng nhập.'},401);
try{const exists=await db().prepare('SELECT key FROM records WHERE key=?').bind(u.userId+':initialized').first();
if(!exists){const now=new Date().toISOString();await db().batch([...initial().map((x:any)=>db().prepare('INSERT OR IGNORE INTO records (key,owner,kind,data,version,updated) VALUES (?,?,?,?,1,?)').bind(u.userId+':'+x.id,u.userId,x.kind,JSON.stringify(x),now)),db().prepare('INSERT OR IGNORE INTO records (key,owner,kind,data,version,updated) VALUES (?,?,?,?,1,?)').bind(u.userId+':initialized',u.userId,'internal','{}',now)]);}
const rows=await db().prepare("SELECT data,version,updated FROM records WHERE owner=? AND kind!='internal' ORDER BY updated DESC LIMIT 10000").bind(u.userId).all();return response({records:rows.results.map((r:any)=>({...JSON.parse(r.data),version:r.version,updated:r.updated})),user:{name:u.displayName,email:u.email}});
}catch{return response({error:'Không thể tải dữ liệu. Vui lòng thử lại.'},500);}}
export async function POST(req:Request){const u=await getChatGPTUser();if(!u)return response({error:'Vui lòng đăng nhập.'},401);
if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return response({error:'Nguồn yêu cầu không hợp lệ.'},403);
try{const body:any=await req.json();const {action}=body;const x=body.record;
if(!x||typeof x.id!=='string'||!/^[\w-]{1,100}$/.test(x.id)||!kinds.includes(x.kind))return response({error:'Dữ liệu không hợp lệ.'},400);
if(JSON.stringify(x).length>100000)return response({error:'Nội dung quá lớn.'},400);
const key=u.userId+':'+x.id;const old:any=await db().prepare('SELECT data,version FROM records WHERE key=? AND owner=?').bind(key,u.userId).first();
if(old&&old.version!==x.version)return response({error:'Dữ liệu đã thay đổi. Đóng cửa sổ và tải lại trước khi sửa.'},409);
const before=old?JSON.parse(old.data):null;if(before&&before.kind!==x.kind)return response({error:'Không được đổi loại bản ghi.'},400);
if(['comment','message'].includes(x.kind)&&old)return response({error:'Tin đã gửi được giữ trong lịch sử.'},400);
if(action==='delete'){if(!old)return response({error:'Không tìm thấy bản ghi.'},404);if(!['task','department','person','plan'].includes(x.kind))return response({error:'Không hỗ trợ xóa bản ghi này.'},400);
const references=await db().prepare("SELECT data FROM records WHERE owner=? AND kind='task'").bind(u.userId).all();
if(x.kind!=='task'&&references.results.some((r:any)=>{const t=JSON.parse(r.data);return !t.archived&&(t.department===x.id||t.owner===x.id||t.plan===x.id)}))return response({error:'Đang có công việc sử dụng mục này. Hãy bàn giao hoặc lưu trữ công việc trước.'},400);x.archived=true;
}else if(action!=='save')return response({error:'Thao tác không hỗ trợ.'},400);
if(x.kind==='task'){validateTask(x);if(before?.due!==x.due&&before&&!body.reason?.trim())return response({error:'Cần lý do thay đổi hạn chót.'},400);
if(x.status==='Hoàn thành'&&before?.status!=='Hoàn thành'){x.completedAt=new Date().toISOString();x.progress=100;}
if(before?.status==='Hoàn thành'&&x.status!=='Hoàn thành')x.completedAt=null;
x.originalDue=before?.originalDue||before?.due||x.due||'';
for(const [field,kind] of [['department','department'],['owner','person'],['plan','plan']])if(x[field]){const linked:any=await db().prepare('SELECT data FROM records WHERE key=? AND owner=? AND kind=?').bind(u.userId+':'+x[field],u.userId,kind).first();if(!linked||JSON.parse(linked.data).archived)throw Error('Phòng ban, nhân sự hoặc kế hoạch không còn hợp lệ.');}}
if(['department','person','plan'].includes(x.kind)&&!x.name?.trim())throw Error('Vui lòng nhập tên.');
if(['comment','message'].includes(x.kind)){if(!x.text?.trim()||x.text.length>10000)throw Error('Nội dung cần có từ 1 đến 10.000 ký tự.');x.author=u.displayName;if(x.kind==='comment'&&!await db().prepare("SELECT key FROM records WHERE key=? AND owner=? AND kind='task'").bind(u.userId+':'+x.taskId,u.userId).first())throw Error('Không tìm thấy công việc.');}
const now=new Date().toISOString();delete x.version;delete x.updated;const next=old?old.version+1:1;
const operation=crypto.randomUUID();x._operation=operation;
const write=old?db().prepare('UPDATE records SET data=?,version=?,updated=? WHERE key=? AND owner=? AND version=?').bind(JSON.stringify(x),next,now,key,u.userId,old.version):db().prepare('INSERT OR IGNORE INTO records (key,owner,kind,data,version,updated) VALUES (?,?,?,?,1,?)').bind(key,u.userId,x.kind,JSON.stringify(x),now);
const audit={id:crypto.randomUUID(),kind:'audit',entityId:x.id,title:x.title||x.name||'Trao đổi',action:action==='delete'?'Lưu trữ':old?'Cập nhật':'Tạo mới',author:u.displayName,reason:body.reason||'',before,after:x};
const auditWrite=db().prepare("INSERT INTO records (key,owner,kind,data,version,updated) SELECT ?,?,?,?,1,? WHERE EXISTS (SELECT 1 FROM records WHERE key=? AND owner=? AND json_extract(data,'$._operation')=?)").bind(u.userId+':'+audit.id,u.userId,'audit',JSON.stringify(audit),now,key,u.userId,operation);
const results=await db().batch([write,auditWrite]);if(results[0].meta.changes!==1)return response({error:'Có thay đổi đồng thời. Vui lòng tải lại.'},409);
return response({record:{...x,version:next,updated:now}});
}catch(e){return response({error:e instanceof Error?e.message:'Không thể lưu dữ liệu.'},400);}}
