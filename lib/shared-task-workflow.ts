export type SharedRole = 'admin'|'leader'|'manager'|'member'|'viewer';
type TaskLike = {status:string;due?:string;assignedTo?:string|null;result?:string;progress?:number;[key:string]:unknown};
export function canTransition(role:SharedRole,from:string,to:string):boolean {
  if(from===to)return true;
  if(to==='Hoàn thành')return false; // only approve action
  if(from==='Chờ duyệt')return false; // approve/reject explicitly
  if(role==='viewer')return false;
  if(role==='member' && (to==='Đã hủy'||to==='Chờ duyệt'&&from==='Đã hủy'))return false;
  return true;
}
export function applyReviewDecision<T extends TaskLike>(task:T,action:'approve'|'reject',reason:unknown,actor:string,now:string):T {
  if(task.status!=='Chờ duyệt')throw Error('Công việc không ở trạng thái Chờ duyệt.');
  if(action==='reject'&&(typeof reason!=='string'||!reason.trim()))throw Error('Cần nêu lý do trả lại công việc.');
  if(action==='approve'&&(!task.result||!task.result.trim()))throw Error('Cần có kết quả trước khi duyệt.');
  return {...task,status:action==='approve'?'Hoàn thành':'Đang thực hiện',progress:action==='approve'?100:task.progress,completedAt:action==='approve'?now:null,submittedAt:null,reviewedAt:now,reviewedBy:actor,reviewAction:action,reviewReason:typeof reason==='string'?reason.trim():''};
}
export function assessSharedTask(task:TaskLike,today:string,remindDays=3):'completed'|'cancelled'|'pending'|'overdue'|'soon'|'missing-owner'|'missing-due'|'normal'{
 if(task.status==='Hoàn thành')return 'completed';
 if(task.status==='Đã hủy')return 'cancelled';
 if(task.status==='Chờ duyệt')return 'pending';
 if(!task.assignedTo)return 'missing-owner';
 if(!task.due)return 'missing-due';
 if(task.due<today)return 'overdue';
 const diff=Math.round((Date.parse(task.due+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);
 return diff>=0&&diff<=remindDays?'soon':'normal';
}

export type SharedTaskAlert =
  | 'pending'
  | 'overdue'
  | 'soon'
  | 'missing-owner'
  | 'missing-due';

export function getSharedTaskAlerts(
  task: TaskLike,
  today: string,
  remindDays = 3,
): SharedTaskAlert[] {
  if (
    task.status === 'Ho?n th?nh' ||
    task.status === '?? h?y'
  ) {
    return [];
  }

  const alerts: SharedTaskAlert[] = [];

  if (task.status === 'Ch? duy?t') {
    alerts.push('pending');
  }

  if (!task.assignedTo) {
    alerts.push('missing-owner');
  }

  if (!task.due) {
    alerts.push('missing-due');
  } else if (task.due < today) {
    alerts.push('overdue');
  } else {
    const start = Date.parse(today + 'T00:00:00Z');
    const end = Date.parse(task.due + 'T00:00:00Z');
    const diff = Math.round((end - start) / 86400000);

    if (Number.isFinite(diff) && diff >= 0 && diff <= remindDays) {
      alerts.push('soon');
    }
  }

  return alerts;
}
