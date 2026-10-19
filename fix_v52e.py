from pathlib import Path
from datetime import datetime

p = Path('app/api/directive-executions/route.ts')
if not p.is_file():
    raise SystemExit('STOP: API NOT FOUND')
src = p.read_text(encoding='utf-8-sig')
if 'TEAM360_V52E_ASSIGNEE_ACCESS' in src:
    raise SystemExit('STOP: ALREADY PATCHED')
if 'TEAM360_V52C_EXECUTIONS' not in src:
    raise SystemExit('STOP: UNEXPECTED FILE')

old_get = """    if (!member || !iss || !await taskAccess(db, workspaceId, iss.task_id, user.userId, member.role))
      return respond({ error: 'Không có quyền truy cập.' }, 403);"""
new_get = """    if (!member || !iss)
      return respond({ error: 'Không có quyền truy cập.' }, 403);
    // Assignees may read only their own execution items, not the source task.
    const canSeeTask = await taskAccess(db, workspaceId, iss.task_id, user.userId, member.role);"""
old_items = """    const items = isLeader(member.role) ? (rows.results||[]) :
      (rows.results||[]).filter(row => row.assignee_id === user.userId);"""
new_items = """    const items = isLeader(member.role) && canSeeTask ? (rows.results||[]) :
      (rows.results||[]).filter(row => row.assignee_id === user.userId);"""
old_sql = """        'AND (? = assignee_id OR EXISTS (SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? ' +
        "AND status='active' AND role IN ('admin','leader')))"
      ).bind(status,now,itemId,issuanceId,item.status,issuanceId,workspaceId,user.userId,workspaceId,user.userId),"""
new_sql = """        'AND EXISTS (SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? AND status=\'active\') ' +
        'AND ((assignee_id=? AND ? <> \'cancelled\') OR EXISTS ' +
        '(SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? ' +
        "AND status='active' AND role IN ('admin','leader')))"
      ).bind(status,now,itemId,issuanceId,item.status,issuanceId,workspaceId,
        workspaceId,user.userId,user.userId,status,workspaceId,user.userId),"""
# Avoid Python quoting mistakes by using JS double-quoted strings for SQL containing single quotes.
new_sql = """        \"AND EXISTS (SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? AND status='active') \" +
        \"AND ((assignee_id=? AND ? <> 'cancelled') OR EXISTS \" +
        \"(SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? \" +
        \"AND status='active' AND role IN ('admin','leader')))\"
      ).bind(status,now,itemId,issuanceId,item.status,issuanceId,workspaceId,
        workspaceId,user.userId,user.userId,status,workspaceId,user.userId),"""
checks = {'GET guard':old_get, 'GET filtering':old_items, 'PATCH atomic guard':old_sql,
          'audit fix':"AND updated_at=?),?,?,?,?)"}
for name,anchor in checks.items():
    count=src.count(anchor)
    print(name, 'OK' if (count==1 if name!='audit fix' else count>=1) else f'FAILED ({count})')
    if (count!=1 if name!='audit fix' else count<1):
        raise SystemExit('STOP: SOURCE DIFFERS; NOTHING WRITTEN')
new=src.replace(old_get,new_get,1).replace(old_items,new_items,1).replace(old_sql,new_sql,1)
new=new.replace('// TEAM360_V52C_EXECUTIONS','// TEAM360_V52C_EXECUTIONS\n// TEAM360_V52E_ASSIGNEE_ACCESS',1)
assert new.count('TEAM360_V52E_ASSIGNEE_ACCESS')==1
backdir=Path('backups/v52e');backdir.mkdir(parents=True,exist_ok=True)
backup=backdir/('directive-executions-before-v52e-'+datetime.now().strftime('%Y%m%d-%H%M%S-%f')+'.ts.bak')
backup.write_text(src,encoding='utf-8')
p.write_text(new,encoding='utf-8')
print('BACKUP:',backup)
print('ASSIGNEE READ FILTER: INSTALLED')
print('PATCH ACTIVE MEMBERSHIP + CANCEL AUTH: INSTALLED')
print('DATABASE: UNCHANGED')
print('V5.2E PATCH APPLIED')
