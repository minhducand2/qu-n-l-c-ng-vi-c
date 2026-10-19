'use client';

import { useEffect, useState } from 'react';

type Member = { userId: string; displayName: string | null };
type Issuance = {
  id: string;
  document_number: string;
  issued_by: string;
  issued_at: string;
  status: string;
  approved_draft_version: number;
};
type Item = {
  id: string;
  assignee_id: string;
  description: string;
  due_date: string | null;
  status: string;
  updated_at: string;
};
type Audit = {
  id: string;
  action: string;
  actor_id: string;
  created_at: string;
  note?: string | null;
};
type Props = {
  workspaceId: string;
  taskId: string;
  draftId: string;
  approved: boolean;
  draftVersion: number;
  workflowVersion: number;
  members: Member[];
};

async function api<T>(url: string, method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method, credentials: 'same-origin', cache: 'no-store',
    ...(method === 'GET' ? {} : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(data.error || 'HTTP ' + response.status));
  return data as T;
}

const labels: Record<string, string> = {
  pending: 'Chưa thực hiện',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

// TEAM360_V52H_PANEL
export default function DirectiveIssuancePanel({ workspaceId, taskId, draftId,
  approved, draftVersion, workflowVersion, members }: Props) {
  const [issuance, setIssuance] = useState<Issuance | null>(null);
  const [issueEvents, setIssueEvents] = useState<Audit[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [documentNumber, setDocumentNumber] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState(false);
  const qs = (values: Record<string, string>) => new URLSearchParams(values).toString();
  const named = (id: string) => members.find(x => x.userId === id)?.displayName?.trim() || id;

  async function refresh(): Promise<void> {
    const result = await api<{ issuance: Issuance | null; events: Audit[] }>(
      '/api/directive-issuances?' + qs({ workspaceId, taskId, draftId }));
    setIssuance(result.issuance);
    setIssueEvents(result.events || []);
    if (result.issuance) {
      const list = await api<{ items: Item[] }>(
        '/api/directive-executions?' + qs({ workspaceId, issuanceId: result.issuance.id }));
      setItems(list.items || []);
    } else {
      setItems([]);
    }
    setLoadError(false);
  }

  useEffect(() => {
    let active = true;
    // Keep data from another draft out of the current view.
    setIssuance(null);
    setItems([]);
    setIssueEvents([]);
    setNotice('');
    setLoadError(false);
    if (!approved) return;
    setLoading(true);
    void (async () => {
      try {
        const result = await api<{ issuance: Issuance | null; events: Audit[] }>(
          '/api/directive-issuances?' + qs({ workspaceId, taskId, draftId }));
        if (!active) return;
        setIssuance(result.issuance);
        setIssueEvents(result.events || []);
        if (result.issuance) {
          const list = await api<{ items: Item[] }>(
            '/api/directive-executions?' + qs({ workspaceId, issuanceId: result.issuance.id }));
          if (active) setItems(list.items || []);
        }
      } catch (error) {
        if (active) { setLoadError(true); setNotice(error instanceof Error ? error.message : String(error)); }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [workspaceId, taskId, draftId, approved]);

  async function doIssue() {
    if (busy || !approved || issuance || loading || loadError || !documentNumber.trim()) return;
    if (!window.confirm('Ghi nhận ban hành nội bộ số ' + documentNumber.trim() + '? Không gửi văn bản ra ngoài.')) return;
    setBusy(true); setNotice('Đang ghi nhận ban hành...');
    try {
      await api('/api/directive-issuances', 'POST', {
        workspaceId, taskId, draftId, documentNumber: documentNumber.trim(),
        approvedDraftVersion: draftVersion, approvedWorkflowVersion: workflowVersion,
      });
      await refresh();
      setNotice('Đã ghi nhận ban hành nội bộ và cập nhật sổ.');
    } catch (error) { setNotice(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }

  async function doAssign() {
    if (busy || !issuance || !assigneeId || !description.trim()) return;
    if (!window.confirm('Giao nhiệm vụ này trên D1 cho ' + named(assigneeId) + '?')) return;
    setBusy(true); setNotice('Đang giao nhiệm vụ...');
    try {
      await api('/api/directive-executions', 'POST', {
        workspaceId, issuanceId: issuance.id, assigneeId,
        description: description.trim(), dueDate: dueDate || null,
      });
      await refresh();
      setDescription(''); setDueDate('');
      setNotice('Đã giao nhiệm vụ và ghi nhật ký.');
    } catch (error) { setNotice(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }

  async function changeStatus(item: Item, status: 'in_progress' | 'completed' | 'cancelled') {
    if (busy || !issuance) return;
    if (!window.confirm('Chuyển nhiệm vụ sang "' + labels[status] + '"?')) return;
    setBusy(true); setNotice('Đang cập nhật...');
    try {
      await api('/api/directive-executions', 'PATCH', {
        workspaceId, issuanceId: issuance.id, itemId: item.id, status,
        note: notes[item.id] || '',
      });
      await refresh();
      setNotice('Đã cập nhật trạng thái và nhật ký.');
    } catch (error) { setNotice(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }

  const completed = items.filter(x => x.status === 'completed').length;
  return (
    <section style={{ border: '1px solid #93c5fd', borderRadius: 12, padding: 14,
      display: 'grid', gap: 12 }}>
      <strong>{'Sổ ban hành và theo dõi thực hiện V5.2'}</strong>
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        {'Chỉ ghi nhận nội bộ trên D1; không gửi email, Zalo hoặc ký số.'}
      </p>
      {!approved ? (
        <p className="muted">{'Chỉ dự thảo đã phê duyệt mới được ghi nhận ban hành.'}</p>
      ) : (
        <>
          {loading && <p>{'Đang tải sổ ban hành...'}</p>}
          {loadError && <button type="button" className="btn secondary compact"
            onClick={() => void refresh().then(() => setNotice('Đã tải lại.')).catch(error => setNotice(String(error)))}>
            {'Thử tải lại'}
          </button>}
          {!loading && !loadError && !issuance && (
            <div style={{ display: 'grid', gap: 8 }}>
              <label>{'Số văn bản ban hành nội bộ'}
                <input value={documentNumber} maxLength={100}
                  onChange={e => setDocumentNumber(e.target.value)}
                  placeholder="VD: 001/2026" style={{ display: 'block', padding: 8, maxWidth: 360, width: '100%' }}/>
              </label>
              <button type="button" className="btn primary" disabled={busy || !documentNumber.trim()}
                onClick={() => void doIssue()}>{'Ghi nhận ban hành'}</button>
            </div>
          )}
          {issuance && !loading && (
            <>
              <p style={{ margin: 0 }}>
                <strong>{'Số ' + issuance.document_number}</strong>
                {' · ' + labels[issuance.status] || issuance.status}
                {' · ' + issuance.issued_at}
                {' · ' + named(issuance.issued_by)}
              </p>
              <p style={{ margin: 0 }}>{'Nhiệm vụ hoàn thành: ' + completed + '/' + items.length}</p>
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 12, display: 'grid', gap: 8 }}>
                <strong>{'Giao nhiệm vụ thực hiện'}</strong>
                <label>{'Người nhận'}
                  <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                    style={{ display: 'block', padding: 8, maxWidth: 390, width: '100%' }}>
                    <option value="">{'-- Chọn thành viên --'}</option>
                    {members.map(m => <option key={m.userId} value={m.userId}>
                      {(m.displayName?.trim() || m.userId) + ' (' + m.userId + ')'}
                    </option>)}
                  </select>
                </label>
                <label>{'Nội dung nhiệm vụ'}
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                    maxLength={5000} style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}/>
                </label>
                <label>{'Hạn chót (nếu có)'}
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    style={{ display: 'block', padding: 8 }}/>
                </label>
                <button type="button" className="btn primary"
                  disabled={busy || !assigneeId || !description.trim()}
                  onClick={() => void doAssign()}>{'Giao nhiệm vụ'}</button>
                <p className="muted" style={{ margin: 0, fontSize: 11 }}>
                  {'API sẽ kiểm tra vai trò lãnh đạo và tư cách thành viên trước khi ghi.'}
                </p>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <strong>{'Danh sách thực hiện (' + items.length + ')'}</strong>
                {items.length === 0 && <p className="muted">{'Chưa có nhiệm vụ hoặc không có nhiệm vụ được phép xem.'}</p>}
                {items.map(item => (
                  <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8,
                    padding: 10, display: 'grid', gap: 7 }}>
                    <strong>{item.description}</strong>
                    <span style={{ fontSize: 12 }}>
                      {named(item.assignee_id) + ' · ' + (labels[item.status] || item.status) +
                        ' · Hạn: ' + (item.due_date || 'Chưa đặt')}
                    </span>
                    {(item.status === 'pending' || item.status === 'in_progress') && (
                      <>
                        <input placeholder="Ghi chú cập nhật (tùy chọn)" maxLength={2000}
                          value={notes[item.id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}/>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {item.status === 'pending' && <button type="button" className="btn secondary compact"
                            disabled={busy} onClick={() => void changeStatus(item, 'in_progress')}>
                            {'Bắt đầu thực hiện'}</button>}
                          {item.status === 'in_progress' && <button type="button" className="btn primary"
                            disabled={busy} onClick={() => void changeStatus(item, 'completed')}>
                            {'Hoàn thành'}</button>}
                          <button type="button" className="btn secondary compact" disabled={busy}
                            onClick={() => void changeStatus(item, 'cancelled')}>
                            {'Hủy nhiệm vụ (lãnh đạo)'}</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <details>
                <summary>{'Nhật ký ban hành (' + issueEvents.length + ')'}</summary>
                {issueEvents.map(e => <p key={e.id} style={{ fontSize: 12 }}>
                  {e.action + ' · ' + named(e.actor_id) + ' · ' + e.created_at}
                </p>)}
              </details>
              <button type="button" className="btn secondary compact" disabled={busy}
                onClick={() => void refresh().then(() => setNotice('Đã tải lại dữ liệu.')).catch(error => setNotice(String(error)))}>
                {'Tải lại sổ và tiến độ'}</button>
            </>
          )}
        </>
      )}
      {notice && <p role="status" style={{ background: '#f1f5f9', padding: 10,
        borderRadius: 8, fontSize: 12, margin: 0 }}>{notice}</p>}
    </section>
  );
}
