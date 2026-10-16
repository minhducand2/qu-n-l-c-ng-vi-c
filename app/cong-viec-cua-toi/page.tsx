'use client';
import { useEffect, useMemo, useState } from 'react';

type MyTask = {
 id:string; title:string; description?:string; workspaceName:string; workspaceId:string;
 status:string; due?:string; progress:number; assigned:boolean; created:boolean;
 awaitingReview:boolean; updatedAt?:string;
};
type Tab = 'assigned'|'created'|'review'|'alerts';
const tabs: Array<{id:Tab;label:string}> = [
 {id:'assigned',label:'Việc được giao'}, {id:'created',label:'Việc tôi tạo'},
 {id:'review',label:'Chờ tôi phê duyệt'}, {id:'alerts',label:'Cảnh báo của tôi'}
];
const dayVN = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const addDays = (day:string, n:number) => { const d = new Date(`${day}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10); };
const ended = (status:string) => status==='Hoàn thành'||status==='Đã hủy';
const alertType = (t:MyTask, today:string) => {
 if(ended(t.status))return '';
 if(t.awaitingReview)return 'Chờ duyệt';
 if(t.due && t.due<today)return 'Quá hạn';
 if(t.due && t.due<=addDays(today,3))return 'Sắp hạn';
 if(!t.due)return 'Thiếu hạn';
 return '';
};
const dateText = (day?:string) => day?day.split('-').reverse().join('/'):'Chưa có hạn';
export default function MyWorkPage() {
 const [tasks,setTasks]=useState<MyTask[]>([]);
 const [workspaceCount,setWorkspaceCount]=useState(0);
 const [tab,setTab]=useState<Tab>('assigned');
 const [query,setQuery]=useState('');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const today=dayVN();
 async function load() {
  setLoading(true);setError('');
  try {
   const res=await fetch('/api/my-shared-tasks',{cache:'no-store',credentials:'same-origin'});
   const data=await res.json() as {tasks?:MyTask[];workspaceCount?:number;error?:string};
   if(!res.ok)throw Error(data.error||`Lỗi HTTP ${res.status}`);
   setTasks(Array.isArray(data.tasks)?data.tasks:[]);
   setWorkspaceCount(data.workspaceCount??0);
  }catch(e){setError(e instanceof Error?e.message:'Không thể tải dữ liệu.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 const groups=useMemo(()=>({
  assigned:tasks.filter(t=>t.assigned),
  created:tasks.filter(t=>t.created),
  review:tasks.filter(t=>t.awaitingReview),
  alerts:tasks.filter(t=>t.assigned && !!alertType(t,today))
 }),[tasks,today]);
 const visible=groups[tab].filter(t=>`${t.title} ${t.description||''} ${t.workspaceName}`.toLocaleLowerCase('vi-VN').includes(query.toLocaleLowerCase('vi-VN')));
 return <main style={{maxWidth:1160,margin:'0 auto',padding:'28px 20px 64px',fontFamily:'system-ui,sans-serif',color:'#1e293b'}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
   <a href="/" style={{color:'#087f72',textDecoration:'none'}}>← Quay lại TEAM360</a>
   <button type="button" onClick={()=>void load()} disabled={loading} style={{padding:'10px 16px',border:'1px solid #d7e0e7',borderRadius:8,background:'white',cursor:'pointer'}}>↻ Làm mới</button>
  </div>
  <h1 style={{fontSize:28,marginBottom:6}}>Công việc của tôi</h1>
  <p style={{color:'#64748b',marginTop:0}}>Nhiệm vụ chung theo tài khoản đang đăng nhập, được kiểm tra quyền ở máy chủ. Không bao gồm công việc cá nhân.</p>
  <p style={{color:'#64748b',fontSize:13}}>{workspaceCount} tổ chức đang tham gia · {tasks.length} công việc liên quan</p>
  {error&&<div role="alert" style={{padding:14,background:'#fff1f2',color:'#b91c1c',borderRadius:8,marginBottom:16}}>{error}</div>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,margin:'24px 0'}}>
   {tabs.map(item=><button key={item.id} onClick={()=>{setTab(item.id);setQuery('');}} style={{background:tab===item.id?'#e6f5f0':'#fff',border:tab===item.id?'1px solid #0a8a76':'1px solid #dfe5ea',borderRadius:12,padding:16,textAlign:'left',cursor:'pointer'}}><span style={{display:'block',fontSize:13,color:'#64748b'}}>{item.label}</span><strong style={{fontSize:26}}>{groups[item.id].length}</strong></button>)}
  </div>
  <section style={{border:'1px solid #e1e7eb',background:'white',borderRadius:12,overflow:'hidden'}}>
   <div style={{padding:18,display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
    <h2 style={{margin:0,fontSize:18}}>{tabs.find(t=>t.id===tab)?.label} ({visible.length})</h2>
    <input aria-label="Tìm kiếm công việc của tôi" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm công việc, tổ chức..." style={{padding:'10px 12px',border:'1px solid #dbe3e9',borderRadius:8,minWidth:220}}/>
   </div>
   {loading?<p style={{padding:20}}>Đang tải...</p>:visible.length===0?<p style={{padding:20,color:'#64748b'}}>Chưa có công việc trong mục này.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:720,textAlign:'left'}}><thead style={{background:'#f8fafc'}}><tr>{['Công việc','Tổ chức','Trạng thái','Hạn chót','Tiến độ','Cảnh báo'].map(h=><th key={h} style={{padding:12,fontSize:13,color:'#64748b'}}>{h}</th>)}</tr></thead><tbody>
    {visible.map(t=><tr key={`${t.workspaceId}:${t.id}`} style={{borderTop:'1px solid #edf1f4'}}><td style={{padding:12,fontWeight:600}}>{t.title}</td><td style={{padding:12}}>{t.workspaceName}</td><td style={{padding:12}}>{t.status}</td><td style={{padding:12}}>{dateText(t.due)}</td><td style={{padding:12}}>{t.progress}%</td><td style={{padding:12,color:alertType(t,today)==='Quá hạn'?'#b91c1c':'#9a6700'}}>{alertType(t,today)||'—'}</td></tr>)}
   </tbody></table></div>}
  </section>
  <p style={{marginTop:20,fontSize:13,color:'#64748b'}}>Để cập nhật, trình duyệt hoặc phê duyệt công việc, mở mục <b>Công việc chung</b> trong TEAM360 và chọn tổ chức tương ứng. Bản này chưa mở chi tiết trực tiếp từ bảng cá nhân.</p>
 </main>;
}
