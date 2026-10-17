from pathlib import Path
from datetime import datetime

root=Path.cwd()
ui=root/'app/organization-command-center.tsx'
api=root/'app/api/directive-approvals/route.ts'
if not ui.is_file() or not api.is_file(): raise SystemExit('STOP: TEAM360 files missing')
s=ui.read_text(encoding='utf-8-sig'); a=api.read_text(encoding='utf-8-sig')
if 'TEAM360_APPROVAL_UI_V51F' not in s or 'TEAM360_APPROVAL_READ_GUARD_V51F' not in a: raise SystemExit('STOP: V5.1F not installed')
if 'TEAM360_APPROVAL_POLISH_V51I' in s or 'TEAM360_APPROVAL_GUARD_V51I' in a: raise SystemExit('STOP: V5.1I already installed')
def swap(content,old,new,label):
 n=content.count(old)
 if n!=1: raise SystemExit(f'STOP: {label}: expected 1 anchor, got {n}')
 return content.replace(old,new,1)

# Restore corrupted Vietnamese API messages. All replacement literals use Unicode escapes,
# because passing raw Vietnamese through Windows PowerShell can be lossy.
messages={
'Vui l?ng ??ng nh?p.':'Vui l\\u00f2ng \\u0111\\u0103ng nh\\u1eadp.',
'ID kh?ng h?p l?.':'ID kh\\u00f4ng h\\u1ee3p l\\u1ec7.',
'Kh?ng c? quy?n.':'Kh\\u00f4ng c\\u00f3 quy\\u1ec1n.',
'Kh?ng c? quy?n xem quy tr?nh.':'Kh\\u00f4ng c\\u00f3 quy\\u1ec1n xem quy tr\\u00ecnh.',
'Kh?ng t?i ???c quy tr?nh.':'Kh\\u00f4ng t\\u1ea3i \\u0111\\u01b0\\u1ee3c quy tr\\u00ecnh.',
'Ngu?n y?u c?u kh?ng h?p l?.':'Ngu\\u1ed3n y\\u00eau c\\u1ea7u kh\\u00f4ng h\\u1ee3p l\\u1ec7.',
'Y?u c?u kh?ng h?p l?.':'Y\\u00eau c\\u1ea7u kh\\u00f4ng h\\u1ee3p l\\u1ec7.',
'Ng??i duy?t kh?ng h?p l?.':'Ng\\u01b0\\u1eddi duy\\u1ec7t kh\\u00f4ng h\\u1ee3p l\\u1ec7.',
'Phi?n b?n quy tr?nh kh?ng h?p l?.':'Phi\\u00ean b\\u1ea3n quy tr\\u00ecnh kh\\u00f4ng h\\u1ee3p l\\u1ec7.',
'L? do kh?ng h?p l?.':'L\\u00fd do kh\\u00f4ng h\\u1ee3p l\\u1ec7.',
'T? ch?i ph?i c? l? do.':'T\\u1eeb ch\\u1ed1i ph\\u1ea3i c\\u00f3 l\\u00fd do.',
'N?i dung d? th?o ?? thay ??i. H?y t?i l?i.':'N\\u1ed9i dung d\\u1ef1 th\\u1ea3o \\u0111\\u00e3 thay \\u0111\\u1ed5i. H\\u00e3y t\\u1ea3i l\\u1ea1i.',
'Kh?ng c? quy?n tr?nh duy?t.':'Kh\\u00f4ng c\\u00f3 quy\\u1ec1n tr\\u00ecnh duy\\u1ec7t.',
'Ng??i duy?t ph?i l? l?nh ??o h?p l? v? ??c l?p.':'Ng\\u01b0\\u1eddi duy\\u1ec7t ph\\u1ea3i l\\u00e0 l\\u00e3nh \\u0111\\u1ea1o h\\u1ee3p l\\u1ec7 v\\u00e0 \\u0111\\u1ed9c l\\u1eadp.',
'D? th?o kh?ng ? tr?ng th?i ch? duy?t.':'D\\u1ef1 th\\u1ea3o kh\\u00f4ng \\u1edf tr\\u1ea1ng th\\u00e1i ch\\u1edd duy\\u1ec7t.',
'Kh?ng c? quy?n quy?t ??nh.':'Kh\\u00f4ng c\\u00f3 quy\\u1ec1n quy\\u1ebft \\u0111\\u1ecbnh.',
'Phi?n b?n tr?nh duy?t ?? thay ??i.':'Phi\\u00ean b\\u1ea3n tr\\u00ecnh duy\\u1ec7t \\u0111\\u00e3 thay \\u0111\\u1ed5i.',
'Quy tr?nh ?? t?n t?i.':'Quy tr\\u00ecnh \\u0111\\u00e3 t\\u1ed3n t\\u1ea1i.',
'Quy tr?nh ?? thay ??i.':'Quy tr\\u00ecnh \\u0111\\u00e3 thay \\u0111\\u1ed5i.',
'Ch? tr?nh l?i b?n b? t? ch?i.':'Ch\\u1ec9 tr\\u00ecnh l\\u1ea1i b\\u1ea3n b\\u1ecb t\\u1eeb ch\\u1ed1i.',
'H?y ch?nh s?a v? l?u phi?n b?n m?i tr??c khi tr?nh l?i.':'H\\u00e3y ch\\u1ec9nh s\\u1eeda v\\u00e0 l\\u01b0u phi\\u00ean b\\u1ea3n m\\u1edbi tr\\u01b0\\u1edbc khi tr\\u00ecnh l\\u1ea1i.',
'Quy tr?nh c? th? ?? thay ??i. H?y t?i l?i tr??c khi thao t?c.':'Quy tr\\u00ecnh c\\u00f3 th\\u1ec3 \\u0111\\u00e3 thay \\u0111\\u1ed5i. H\\u00e3y t\\u1ea3i l\\u1ea1i tr\\u01b0\\u1edbc khi thao t\\u00e1c.',
'Kh?ng x?c minh ???c k?t qu?.':'Kh\\u00f4ng x\\u00e1c minh \\u0111\\u01b0\\u1ee3c k\\u1ebft qu\\u1ea3.',
'?? ghi nh?n thao t?c quy tr?nh.':'\\u0110\\u00e3 ghi nh\\u1eadn thao t\\u00e1c quy tr\\u00ecnh.',
'Kh?ng th?c hi?n ???c thao t?c. H?y t?i l?i tr?ng th?i.':'Kh\\u00f4ng th\\u1ef1c hi\\u1ec7n \\u0111\\u01b0\\u1ee3c thao t\\u00e1c. H\\u00e3y t\\u1ea3i l\\u1ea1i tr\\u1ea1ng th\\u00e1i.',
}
for old,new in messages.items():
 if old not in a: raise SystemExit('STOP: missing API message '+old)
 a=a.replace(old,new)
# Handle the changing of the assigned reviewer's membership before the decision UPDATE.
old='''          "AND submitted_version=? " +
          "AND EXISTS (SELECT 1 FROM directive_drafts " +'''
new='''          "AND submitted_version=? " +
          "AND (?='resubmit' OR EXISTS (" +
          "SELECT 1 FROM memberships m WHERE m.workspace_id=? " +
          "AND m.user_id=directive_approvals.reviewer_id " +
          "AND m.status='active' AND m.role IN ('admin','leader')" +
          ")) " +
          "AND EXISTS (SELECT 1 FROM directive_drafts " +'''
a=swap(a,old,new,'atomic reviewer membership guard')
old='''          approval.submitted_version,
          draftId,
          draftVersion,
        ),'''
new='''          approval.submitted_version,
          action,
          workspaceId,
          draftId,
          draftVersion,
        ),'''
a=swap(a,old,new,'guard parameters')
a=swap(a,'// TEAM360_APPROVAL_READ_GUARD_V51F','// TEAM360_APPROVAL_READ_GUARD_V51F\n// TEAM360_APPROVAL_GUARD_V51I','api version')

# Make audit history readable, preserving IDs for traceability.
old="""                        ' | ' + event.actor_id + ' | ' + event.created_at}"""
new="""                        ' | ' + (byId.get(event.actor_id)?.displayName ||
                          event.actor_id) + ' | ' + event.created_at}"""
s=swap(s,old,new,'audit actor name')
old="""                            {member.displayName || member.userId}"""
new="""                            {(member.displayName?.trim() || member.userId) +
                              ' (' + member.userId + ')'}"""
s=swap(s,old,new,'reviewer options')
old="""                    {byId.get(workflow.reviewer_id)?.displayName || workflow.reviewer_id}"""
new="""                    {(byId.get(workflow.reviewer_id)?.displayName?.trim() ||
                      workflow.reviewer_id) + ' (' + workflow.reviewer_id + ')'}"""
s=swap(s,old,new,'reviewer identity')
s=swap(s,'// TEAM360_APPROVAL_UI_V51F','// TEAM360_APPROVAL_UI_V51F\n  // TEAM360_APPROVAL_POLISH_V51I','ui version')

backup=root/'backups'/'v51i'; backup.mkdir(parents=True,exist_ok=True)
stamp=datetime.now().strftime('%Y%m%d-%H%M%S-%f')
for path in (ui,api):
 backupfile=backup/(path.stem+'-'+stamp+path.suffix+'.bak')
 backupfile.write_text(path.read_text(encoding='utf-8-sig'),encoding='utf-8')
 print('BACKUP:',backupfile)
ui.write_text(s,encoding='utf-8')
api.write_text(a,encoding='utf-8')
print('V5.1I PATCH APPLIED: readable reviewer identity, audit history, Vietnamese API messages, atomic reviewer membership guard')
print('D1 DATA: UNCHANGED. Run pnpm.cmd exec tsc --noEmit')
