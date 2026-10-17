from pathlib import Path
from datetime import datetime

root=Path.cwd()
p=root/'app/organization-command-center.tsx'
api=root/'app/api/directive-approvals/route.ts'
assert p.is_file() and api.is_file(), 'STOP: run from TEAM360 project root'
s=p.read_text(encoding='utf-8-sig'); a=api.read_text(encoding='utf-8-sig')
assert 'TEAM360_D1_AUTOLOAD_V501' in s and 'TEAM360_APPROVAL_ATOMIC_V51D' in a, 'STOP: unexpected file versions'
assert 'TEAM360_APPROVAL_UI_V51F' not in s and 'TEAM360_APPROVAL_READ_GUARD_V51F' not in a, 'STOP: already installed'

def replace_once(text,old,new,label):
    count=text.count(old)
    if count!=1: raise RuntimeError(f'STOP: {label} anchor count {count}')
    return text.replace(old,new,1)

# API: decision rights are checked server side. Expose reader capabilities, not user ids.
a=replace_once(a,"// TEAM360_APPROVAL_ATOMIC_V51D", "// TEAM360_APPROVAL_ATOMIC_V51D\n// TEAM360_APPROVAL_READ_GUARD_V51F",'api marker')
a=replace_once(a,"""    return reply({
      approval: ctx.approval,
      events: events.results || [],
    });""","""    return reply({
      approval: ctx.approval,
      events: events.results || [],
      permissions: {
        canSubmit: canEdit(ctx.member.role, user.userId, ctx.task) &&
          (leaders.has(ctx.member.role) ||
            ctx.draft.created_by === user.userId),
        canDecide: leaders.has(ctx.member.role) &&
          ctx.approval?.status === 'submitted' &&
          ctx.approval.reviewer_id === user.userId &&
          ctx.draft.created_by !== user.userId,
      },
    });""",'api read permissions')

# UI state added alongside D1 state.
state="""
  // TEAM360_APPROVAL_UI_V51F
  type ApprovalState = {
    draft_id: string;
    status: 'submitted' | 'approved' | 'rejected';
    submitted_version: number;
    reviewer_id: string;
    workflow_version: number;
    decision_reason: string | null;
    decided_at: string | null;
  };
  type ApprovalEvent = {
    id: string;
    workflow_version: number;
    action: 'submit' | 'approve' | 'reject' | 'resubmit';
    actor_id: string;
    reviewer_id: string;
    reason: string | null;
    created_at: string;
  };
  type ApprovalSnapshot = {
    draftId: string;
    approval: ApprovalState | null;
    events: ApprovalEvent[];
    permissions: { canSubmit: boolean; canDecide: boolean };
  };
  const [approvalCache, setApprovalCache] =
    useState<Record<string, ApprovalSnapshot>>({});
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [approvalNotice, setApprovalNotice] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
"""
s=replace_once(s,"  const [serverNotice, setServerNotice] = useState('');", "  const [serverNotice, setServerNotice] = useState('');\n"+state,'state')

# Add dedicated fetch hook; request uses common helper. Aborts response-setting on selection switch.
fetcher="""
  // Workflow data is scoped to the exact persisted draft id.
  const currentRemoteId = serverDrafts[draftKey]?.id || '';
  useEffect(() => {
    if (!selectedId || !currentRemoteId) return;
    let active = true;
    const key = workspaceId + ':' + selectedId;
    const id = currentRemoteId;
    setApprovalLoading(true);
    setApprovalNotice('');
    const url = '/api/directive-approvals?' +
      new URLSearchParams({ workspaceId, taskId: selectedId, draftId: id });
    void draftRequest<{
      approval: ApprovalState | null;
      events: ApprovalEvent[];
      permissions: { canSubmit: boolean; canDecide: boolean };
    }>(url).then(data => {
      if (!active) return;
      setApprovalCache(curr => ({ ...curr, [key]: {
        draftId: id,
        approval: data.approval,
        events: data.events || [],
        permissions: data.permissions || { canSubmit: false, canDecide: false },
      } }));
    }).catch(error => {
      if (active) setApprovalNotice(
        'Kh\\u00f4ng t\\u1ea3i \\u0111\\u01b0\\u1ee3c quy tr\\u00ecnh: ' +
        (error instanceof Error ? error.message : String(error))
      );
    }).finally(() => { if (active) setApprovalLoading(false); });
    return () => { active = false; };
  }, [workspaceId, selectedId, currentRemoteId]);

  async function takeApprovalAction(
    action: 'submit' | 'approve' | 'reject' | 'resubmit',
  ) {
    if (!selected || serverBusy || approvalBusy) return;
    const remote = serverDrafts[draftKey];
    const state = approvalCache[draftKey];
    if (!remote || !state || state.draftId !== remote.id) return;
    if (draft !== remote.body) {
      setApprovalNotice('H\\u00e3y l\\u01b0u n\\u1ed9i dung l\\u00ean D1 tr\\u01b0\\u1edbc khi thao t\\u00e1c.');
      return;
    }
    if ((action === 'submit' || action === 'resubmit') && !reviewerId) {
      setApprovalNotice('H\\u00e3y ch\\u1ecdn ng\\u01b0\\u1eddi duy\\u1ec7t.');
      return;
    }
    if (action === 'reject' && !rejectReason.trim()) {
      setApprovalNotice('C\\u1ea7n nh\\u1eadp l\\u00fd do t\\u1eeb ch\\u1ed1i.');
      return;
    }
    const messages = {
      submit: 'Tr\\u00ecnh duy\\u1ec7t b\\u1ea3n hi\\u1ec7n t\\u1ea1i?',
      resubmit: 'Tr\\u00ecnh l\\u1ea1i b\\u1ea3n hi\\u1ec7n t\\u1ea1i?',
      approve: 'X\\u00e1c nh\\u1eadn ph\\u00ea duy\\u1ec7t b\\u1ea3n n\\u00e0y?',
      reject: 'X\\u00e1c nh\\u1eadn t\\u1eeb ch\\u1ed1i b\\u1ea3n n\\u00e0y?',
    };
    if (!window.confirm(messages[action])) return;
    setApprovalBusy(true);
    setApprovalNotice('\\u0110ang th\\u1ef1c hi\\u1ec7n...');
    try {
      const payload: Record<string, unknown> = {
        workspaceId,
        taskId: selected.task.id,
        draftId: remote.id,
        action,
        draftVersion: remote.version,
      };
      if (action !== 'submit') {
        payload.workflowVersion = state.approval?.workflow_version;
      }
      if (action === 'submit' || action === 'resubmit') {
        payload.reviewerId = reviewerId;
      }
      if (action === 'reject') payload.reason = rejectReason.trim();
      await draftRequest('/api/directive-approvals', 'POST', payload);
      const url = '/api/directive-approvals?' +
        new URLSearchParams({ workspaceId, taskId: selected.task.id, draftId: remote.id });
      const updated = await draftRequest<{
        approval: ApprovalState | null;
        events: ApprovalEvent[];
        permissions: { canSubmit: boolean; canDecide: boolean };
      }>(url);
      setApprovalCache(curr => ({ ...curr, [draftKey]: {
        draftId: remote.id,
        approval: updated.approval,
        events: updated.events || [],
        permissions: updated.permissions || { canSubmit: false, canDecide: false },
      } }));
      setRejectReason('');
      setApprovalNotice('\\u0110\\u00e3 ghi nh\\u1eadn thao t\\u00e1c v\\u00e0 t\\u1ea3i l\\u1ea1i nh\\u1eadt k\\u00fd.');
    } catch (error) {
      setApprovalNotice('L\\u1ed7i quy tr\\u00ecnh: ' +
        (error instanceof Error ? error.message : String(error)) +
        '. H\\u00e3y t\\u1ea3i l\\u1ea1i tr\\u01b0\\u1edbc khi th\\u1eed l\\u1ea1i.');
    } finally {
      setApprovalBusy(false);
    }
  }

"""
s=replace_once(s,"  async function loadServerDraft() {",fetcher+"  async function loadServerDraft() {",'methods')
# Current state derived before the JSX.
derived="""
  const approvalSnapshot = approvalCache[draftKey];
  const activeApproval = approvalSnapshot?.draftId === currentRemoteId
    ? approvalSnapshot : undefined;
  const workflow = activeApproval?.approval;
  const editLocked = workflow?.status === 'submitted' ||
    workflow?.status === 'approved';
  const workflowReady = Boolean(currentRemoteId && activeApproval && !approvalLoading);
  const submitReady = workflowReady && !serverBusy && !approvalBusy &&
    !hasUnsavedChanges && activeApproval?.permissions.canSubmit;
  const workflowLabel = !workflow ? 'Ch\\u01b0a tr\\u00ecnh duy\\u1ec7t' :
    workflow.status === 'submitted' ? 'Ch\\u1edd ph\\u00ea duy\\u1ec7t' :
      workflow.status === 'approved' ? '\\u0110\\u00e3 ph\\u00ea duy\\u1ec7t' :
        '\\u0110\\u00e3 t\\u1eeb ch\\u1ed1i';
"""
s=replace_once(s,'  const controlStyle: React.CSSProperties = {',derived+'\n  const controlStyle: React.CSSProperties = {','derived')
# UI block placed just before D1 save panel.
ui="""
          <div style={{
            border: '1px solid #a5b4fc', borderRadius: 12, padding: 14,
            display: 'grid', gap: 10,
          }}>
            <strong>{'Quy tr\\u00ecnh ph\\u00ea duy\\u1ec7t V5.1'}</strong>
            {!currentRemoteId ? (
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                {'L\\u01b0u d\\u1ef1 th\\u1ea3o l\\u00ean D1 tr\\u01b0\\u1edbc khi tr\\u00ecnh duy\\u1ec7t.'}
              </p>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 13 }}>
                  <strong>{workflowLabel}</strong>
                  {workflow && ' | L\\u01b0\\u1ee3t ' + workflow.workflow_version}
                  {approvalLoading && ' | \\u0110ang t\\u1ea3i...'}
                </p>
                {workflow?.reviewer_id && (
                  <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                    {'Ng\\u01b0\\u1eddi duy\\u1ec7t: '}
                    {byId.get(workflow.reviewer_id)?.displayName || workflow.reviewer_id}
                  </p>
                )}
                {workflow?.decision_reason && (
                  <p style={{ margin: 0, fontSize: 12 }}>
                    {'L\\u00fd do: ' + workflow.decision_reason}
                  </p>
                )}
                {(!workflow || workflow.status === 'rejected') &&
                  activeApproval?.permissions.canSubmit && (
                  <>
                    <label style={{ display: 'grid', gap: 4 }}>
                      {'Ch\\u1ecdn ng\\u01b0\\u1eddi duy\\u1ec7t (admin/leader)'}
                      <select value={reviewerId}
                        onChange={event => setReviewerId(event.target.value)}>
                        <option value="">{'-- Ch\\u1ecdn --'}</option>
                        {members.map(member => (
                          <option key={member.userId} value={member.userId}>
                            {member.displayName || member.userId}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="muted" style={{ margin: 0, fontSize: 11 }}>
                      {'API s\\u1ebd ki\\u1ec3m tra vai tr\\u00f2, t\\u00e0i kho\\u1ea3n v\\u00e0 t\\u00ednh \\u0111\\u1ed9c l\\u1eadp c\\u1ee7a ng\\u01b0\\u1eddi duy\\u1ec7t.'}
                    </p>
                    <button type="button" className="btn primary"
                      disabled={!submitReady || !reviewerId ||
                        (workflow?.status === 'rejected' &&
                          remoteDraft?.version === workflow.submitted_version)}
                      onClick={() => void takeApprovalAction(
                        workflow?.status === 'rejected' ? 'resubmit' : 'submit'
                      )}>
                      {workflow?.status === 'rejected' ? 'Tr\\u00ecnh l\\u1ea1i' : 'Tr\\u00ecnh duy\\u1ec7t'}
                    </button>
                  </>
                )}
                {workflow?.status === 'submitted' &&
                  activeApproval?.permissions.canDecide && (
                    <>
                      <label style={{ display: 'grid', gap: 4 }}>
                        {'L\\u00fd do t\\u1eeb ch\\u1ed1i'}
                        <textarea rows={3} value={rejectReason}
                          onChange={event => setRejectReason(event.target.value)} />
                      </label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" className="btn primary"
                          disabled={!workflowReady || approvalBusy || serverBusy}
                          onClick={() => void takeApprovalAction('approve')}>
                          {'Ph\\u00ea duy\\u1ec7t'}
                        </button>
                        <button type="button" className="btn secondary compact"
                          disabled={!workflowReady || approvalBusy || serverBusy ||
                            !rejectReason.trim()}
                          onClick={() => void takeApprovalAction('reject')}>
                          {'T\\u1eeb ch\\u1ed1i'}
                        </button>
                      </div>
                    </>
                  )}
                <details>
                  <summary>{'Nh\\u1eadt k\\u00fd ph\\u00ea duy\\u1ec7t (' +
                    (activeApproval?.events.length || 0) + ')'}</summary>
                  {(activeApproval?.events || []).map(event => (
                    <p key={event.id} style={{ fontSize: 12, margin: '7px 0' }}>
                      {'#' + event.workflow_version + ' | ' + event.action +
                        ' | ' + event.actor_id + ' | ' + event.created_at}
                      {event.reason && ' | ' + event.reason}
                    </p>
                  ))}
                </details>
              </>
            )}
            {approvalNotice && <p role="status" style={{
              fontSize: 12, margin: 0, padding: 8, background: '#f1f5f9',
            }}>{approvalNotice}</p>}
          </div>

"""
s=replace_once(s,"          <div style={{\n            border: '1px solid #99f6e4',",ui+"          <div style={{\n            border: '1px solid #99f6e4',",'UI panel')
# Apply read-only lock to all persisted edit routes and local text manipulation controls.
s=replace_once(s,'    if (!selected || !draft.trim()) return;\n\n    const history', '    if (!selected || !draft.trim() || editLocked) return;\n\n    const history', 'local save')
s=replace_once(s,'    if (!selected) return;\n\n    setEditedDrafts(current => ({','    if (!selected || editLocked) return;\n\n    setEditedDrafts(current => ({','restore')
s=replace_once(s,'  function resetDraft() {\n    if (!selected) return;', '  function resetDraft() {\n    if (!selected || editLocked) return;','reset')
s=replace_once(s,'    if (serverBusy) {\n      setServerNotice',"    if (editLocked) {\n      setServerNotice('D\\u1ef1 th\\u1ea3o \\u0111ang kh\\u00f3a b\\u1edfi quy tr\\u00ecnh duy\\u1ec7t.');\n      return;\n    }\n\n    if (serverBusy) {\n      setServerNotice",'server save')
s=replace_once(s,'disabled={serverBusy || !draft.trim()}','disabled={serverBusy || approvalBusy || editLocked || !draft.trim()}', 'save button')
s=replace_once(s,'onClick={() => void loadServerDraft()}','onClick={() => void loadServerDraft()}', 'load unaffected')
s=replace_once(s,'onClick={() => {\n                          setEditedDrafts(items => ({','disabled={editLocked}\n                        onClick={() => {\n                          setEditedDrafts(items => ({','server history restore')
s=replace_once(s,'          <textarea\n            rows={15}', '          <textarea\n            readOnly={editLocked}\n            rows={15}', 'main editor')
s=replace_once(s,'              disabled={!draft.trim()}\n            >\n              {\'L\\u01b0u phi\\u00ean b\\u1ea3n\'}','              disabled={!draft.trim() || editLocked}\n            >\n              {\'L\\u01b0u phi\\u00ean b\\u1ea3n\'}','local save button')
s=replace_once(s,'              onClick={resetDraft}\n            >', '              onClick={resetDraft}\n              disabled={editLocked}\n            >', 'local reset button')
s=replace_once(s,'onClick={() => restoreVersion(\n                        version.text,', 'disabled={editLocked}\n                      onClick={() => restoreVersion(\n                          version.text,','local history restore button')
# set read-only when locked, but manual reload D1 remains enabled; recommended after conflict.

backupdir=root/'backups'/'v51f'; backupdir.mkdir(parents=True,exist_ok=True)
stamp=datetime.now().strftime('%Y%m%d-%H%M%S-%f')
for srcfile,original in [(p,p.read_text(encoding='utf-8-sig')),(api,api.read_text(encoding='utf-8-sig'))]:
    dest=backupdir/(srcfile.stem+'-'+stamp+srcfile.suffix+'.bak')
    dest.write_text(original,encoding='utf-8')
    print('BACKUP:',dest)
p.write_text(s,encoding='utf-8')
api.write_text(a,encoding='utf-8')
print('V5.1F PATCH APPLIED: UI, READ PERMISSIONS, WORKFLOW ACTIONS, HISTORY')
print('NO DATABASE CHANGES; RUN pnpm.cmd exec tsc --noEmit')
