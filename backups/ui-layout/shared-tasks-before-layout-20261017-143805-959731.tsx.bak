'use client';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, RefreshCw, Users, Save, X, AlertTriangle } from 'lucide-react';
import { statuses, priorities, validateTask, localDay } from '../lib/domain';
import { assessSharedTask, getSharedTaskAlerts } from '../lib/shared-task-workflow';

type Organization = { id: string; name: string; role: string; status: string };
type Member = {
  userId: string;
  role: string;
  status: string;
  displayName: string | null;
  departmentName: string | null;
  accountClaimedAt: string | null;
};
type Task = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start: string;
  due: string;
  progress: number;
  result: string;
  cancelReason: string;
  assignedTo: string | null;
  version: number;
  createdBy?: string;
  updatedAt?: string;
};
type ApiError = { error?: string };
const newTask = (): Task => ({
  id: crypto.randomUUID(),
  workspaceId: '',
  title: '',
  description: '',
  status: 'Chưa bắt đầu',
  priority: 'Trung bình',
  start: '',
  due: '',
  progress: 0,
  result: '',
  cancelReason: '',
  assignedTo: null,
  version: 0,
});
const request = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
  const data: unknown = await response.json();
  if (!response.ok) throw Error((data as ApiError).error || `API trả về ${response.status}`);
  return data as T;
};

export default function SharedTasksPanel() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [editing, setEditing] = useState<Task | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [deepLink, setDeepLink] = useState<{ workspaceId: string; taskId: string } | null>(null);
  const [loadedWorkspace, setLoadedWorkspace] = useState('');
  const selected = organizations.find((x) => x.id === workspaceId);
  const canCreate = selected?.role === 'admin' || selected?.role === 'leader';
  const canAssign = selected?.role === 'admin' || selected?.role === 'leader';
  const canReview = selected?.role === 'admin' || selected?.role === 'leader';
  // Read the last server-loaded task, not unsaved form changes.
  const storedTask = editing?.version ? tasks.find((t) => t.id === editing.id) : undefined;
  const isStoredPending = storedTask?.status === 'Chờ duyệt';
  const counts = tasks.reduce(
    (acc, t) => {
      const today = localDay();
      const state = assessSharedTask(t, today);
      const alerts = getSharedTaskAlerts(t, today);

      if (state === 'completed' || state === 'cancelled' || state === 'normal') {
        acc[state] = (acc[state] || 0) + 1;
      }

      for (const alert of alerts) {
        acc[alert] = (acc[alert] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );
  const visibleTasks = tasks.filter(
    (t) =>
      (!taskSearch ||
        [
          t.title,
          t.description,
          t.assignedTo || '',
          members.find((m) => m.userId === t.assignedTo)?.displayName || '',
        ]
          .join(' ')
          .toLocaleLowerCase('vi-VN')
          .includes(taskSearch.toLocaleLowerCase('vi-VN'))) &&
      (!taskStatus || t.status === taskStatus),
  );
  const memberLabel = (id: string | null) => {
    if (!id) return 'Chưa giao';
    const m = members.find((x) => x.userId === id);
    return m
      ? `${m.displayName?.trim() || m.userId}${m.departmentName?.trim() ? ' · ' + m.departmentName : ''} (${m.role})`
      : id + ' (không còn trong danh bạ active)';
  };
  // URL is only navigation intent. Never trust it as authorization.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get('workspaceId'),
      t = params.get('taskId');
    if (w && t && params.get('view') === 'shared-tasks') setDeepLink({ workspaceId: w, taskId: t });
  }, []);
  const refreshTasks = useCallback(async (id: string) => {
    const data = await request<{ tasks: Task[] }>(
      `/api/shared-tasks?workspaceId=${encodeURIComponent(id)}`,
    );
    setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    setLoadedWorkspace(id);
  }, []);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const data = await request<{ workspaces: Organization[] }>('/api/workspaces');
        if (!live) return;
        const list = Array.isArray(data.workspaces) ? data.workspaces : [];
        setOrganizations(list);
        setWorkspaceId((x) => {
          const params = new URLSearchParams(window.location.search);
          const requested =
            params.get('view') === 'shared-tasks' ? params.get('workspaceId') : null;
          return requested && list.some((w) => w.id === requested)
            ? requested
            : list.some((w) => w.id === x)
              ? x
              : list[0]?.id || '';
        });
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : 'Không tải được tổ chức.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    let live = true;
    setTasks([]);
    setLoadedWorkspace('');
    setMembers([]);
    setEditing(null);
    setError('');
    if (!workspaceId) return;
    void (async () => {
      try {
        await refreshTasks(workspaceId);
        const data = await request<{ members: Member[] }>(
          `/api/workspaces/${encodeURIComponent(workspaceId)}/directory`,
        );
        if (live)
          setMembers(
            Array.isArray(data.members) ? data.members.filter((m) => m.status === 'active') : [],
          );
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : 'Không tải được công việc chung.');
      }
    })();
    return () => {
      live = false;
    };
  }, [workspaceId, refreshTasks]);
  // Open only after tasks were returned by the authorized API.
  useEffect(() => {
    if (!deepLink || workspaceId !== deepLink.workspaceId || loadedWorkspace !== workspaceId)
      return;
    const task = tasks.find((t) => t.id === deepLink.taskId);
    if (!task) {
      setError('Không tìm thấy công việc hoặc tài khoản không có quyền xem nhiệm vụ này.');
      setDeepLink(null);
      window.history.replaceState(window.history.state, '', window.location.pathname);
      return;
    }
    setEditing({ ...task });
    setReason('');
    setError('');
    setTaskSearch('');
    setTaskStatus('');
    setDeepLink(null);
    window.history.replaceState(window.history.state, '', window.location.pathname);
  }, [deepLink, workspaceId, tasks, loadedWorkspace]);
  const change = <K extends keyof Task>(key: K, value: Task[K]) =>
    setEditing((t) => (t ? { ...t, [key]: value } : t));
  const editExisting = (task: Task) => {
    setError('');
    setMessage('');
    setReason('');
    setEditing({ ...task });
  };
  const create = () => {
    setError('');
    setMessage('');
    setReason('');
    setEditing({ ...newTask(), workspaceId });
  };
  async function submitTask() {
    if (!editing || busy || !storedTask || isStoredPending) return;
    if (!storedTask.result?.trim()) {
      setError('Hãy lưu phần Kết quả / Bằng chứng trước, rồi nhấn Trình duyệt.');
      return;
    }
    if (
      !window.confirm(
        'Gửi công việc này sang Chờ duyệt? Các thay đổi chưa lưu trong biểu mẫu sẽ không được gửi.',
      )
    )
      return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await request('/api/shared-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, action: 'submit', task: storedTask }),
      });
      await refreshTasks(workspaceId);
      setEditing(null);
      setMessage('Đã trình duyệt công việc.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể trình duyệt công việc.');
    } finally {
      setBusy(false);
    }
  }
  async function reviewTask(action: 'approve' | 'reject') {
    if (!editing || busy || !canReview || !isStoredPending || !storedTask) return;
    const explanation =
      action === 'reject' ? window.prompt('Lý do trả lại công việc (bắt buộc):', '') : '';
    if (action === 'reject' && !explanation?.trim()) return;
    if (action === 'approve' && !window.confirm('Xác nhận phê duyệt hoàn thành công việc?')) return;
    setBusy(true);
    setError('');
    try {
      await request('/api/shared-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, action, task: storedTask, reason: explanation || '' }),
      });
      await refreshTasks(workspaceId);
      setEditing(null);
      setMessage(action === 'approve' ? 'Đã phê duyệt hoàn thành.' : 'Đã trả lại công việc.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể xử lý phê duyệt.');
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || !selected || busy) return;
    setError('');
    setMessage('');
    try {
      validateTask(editing);
      const action = editing.version ? 'update' : 'create';
      setBusy(true);
      await request<{ task: Task }>('/api/shared-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          action,
          task: editing,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      });
      await refreshTasks(workspaceId);
      setMessage(action === 'create' ? 'Đã tạo công việc chung.' : 'Đã cập nhật công việc chung.');
      setEditing(null);
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu công việc.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="panel">
        <div
          className="settings-body"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'end',
            justifyContent: 'space-between',
          }}
        >
          <label className="field" style={{ minWidth: 240, flex: '1 1 260px' }}>
            Tổ chức
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              disabled={loading}
            >
              {!organizations.length && <option value="">Chưa có tổ chức</option>}
              {organizations.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {w.role}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a
              href="/cong-viec-cua-toi"
              className="btn secondary"
              style={{ textDecoration: 'none' }}
            >
              Công việc của tôi
            </a>
            <button
              className="btn secondary"
              disabled={!workspaceId}
              onClick={() => {
                setError('');
                void refreshTasks(workspaceId).catch((e) =>
                  setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu'),
                );
              }}
            >
              <RefreshCw size={16} />
              Làm mới
            </button>
            {canCreate && (
              <button className="btn primary" onClick={create}>
                <Plus size={16} />
                Tạo công việc chung
              </button>
            )}
          </div>
        </div>
      </section>
      {error && (
        <div className="notice error" role="alert">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      {!!workspaceId && (
        <section className="panel">
          <div className="settings-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              ['Chờ duyệt', 'pending'],
              ['Quá hạn', 'overdue'],
              ['Sắp hạn', 'soon'],
              ['Thiếu người nhận', 'missing-owner'],
              ['Thiếu hạn', 'missing-due'],
              ['Hoàn thành', 'completed'],
            ].map(([label, key]) => (
              <div key={key} style={{ minWidth: 115 }}>
                <div className="muted">{label}</div>
                <strong style={{ fontSize: 22 }}>{counts[key] || 0}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Công việc chung ({tasks.length})</h2>
            <p>Dữ liệu tổ chức tách biệt hoàn toàn với công việc cá nhân.</p>
          </div>
          <Users size={20} />
        </div>
        {!!workspaceId && (
          <div
            className="settings-body"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}
          >
            <input
              aria-label="Tìm công việc chung"
              style={{ flex: '1 1 240px', minWidth: 140 }}
              placeholder="Tìm tên việc, mô tả hoặc tên người nhận..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
            <select
              aria-label="Lọc trạng thái công việc chung"
              style={{ flex: '0 1 200px' }}
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {(taskSearch || taskStatus) && (
              <button
                type="button"
                className="btn secondary compact"
                onClick={() => {
                  setTaskSearch('');
                  setTaskStatus('');
                }}
              >
                Xóa lọc
              </button>
            )}
            <span className="muted" aria-live="polite">
              Hiển thị {visibleTasks.length}/{tasks.length}
            </span>
          </div>
        )}
        {!workspaceId ? (
          <div className="settings-body">
            <p>Hãy tạo hoặc chọn một tổ chức trong mục Quản lý tổ chức.</p>
          </div>
        ) : visibleTasks.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên công việc</th>
                  <th>Người nhận</th>
                  <th>Trạng thái</th>
                  <th>Hạn chót</th>
                  <th>Tiến độ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.title}</strong>
                    </td>
                    <td>{memberLabel(t.assignedTo)}</td>
                    <td>
                      {t.status}
                      {getSharedTaskAlerts(t, localDay()).map((alert) => (
                        <span
                          key={alert}
                          style={{
                            display: 'inline-block',
                            marginLeft: 6,
                            marginTop: 3,
                            padding: '2px 7px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background:
                              alert === 'overdue' ? '#fee2e2' :
                              alert === 'soon' ? '#fef3c7' :
                              alert === 'pending' ? '#dbeafe' : '#f1f5f9',
                            color:
                              alert === 'overdue' ? '#b91c1c' :
                              alert === 'soon' ? '#92400e' :
                              alert === 'pending' ? '#1d4ed8' : '#475569',
                          }}
                        >
                          {{
                            'overdue': 'Quá hạn',
                            'soon': 'Sắp hạn',
                            'pending': 'Chờ duyệt',
                            'missing-owner': 'Thiếu người nhận',
                            'missing-due': 'Thiếu hạn',
                          }[alert]}
                        </span>
                      ))}
                    </td>
                    <td>{t.due ? t.due.split('-').reverse().join('/') : 'Chưa có'}</td>
                    <td>{t.progress}%</td>
                    <td>
                      <button className="btn secondary compact" onClick={() => editExisting(t)}>
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="settings-body">
            <p>
              {tasks.length
                ? 'Không có công việc phù hợp bộ lọc.'
                : 'Chưa có công việc chung trong tổ chức này.'}
            </p>
          </div>
        )}
      </section>
      {editing && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 12,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <section
            className="catalog-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Công việc chung"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: 'min(820px, calc(100dvh - 24px))',
              maxHeight: 'calc(100dvh - 24px)',
              minHeight: 0,
              overflow: 'hidden',
              width: 'min(100%, 560px)',
              margin: 0,
              boxSizing: 'border-box',
            }}
          >
            <div className="modal-heading" style={{ flex: '0 0 auto' }}>
              <h2>{editing.version ? 'Cập nhật công việc' : 'Tạo công việc chung'}</h2>
              <button
                className="icon-btn"
                aria-label="Đóng"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={save}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                height: 0,
                flex: '1 1 auto',
                overflow: 'hidden',
              }}
            >
              <div
                className="modal-body"
                style={{
                  display: 'grid',
                  gap: 12,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  maxHeight: 'none',
                  height: 0,
                  minHeight: 0,
                  flex: '1 1 auto',
                  overscrollBehavior: 'contain',
                  paddingBottom: 24,
                }}
              >
                <label className="field">
                  Tên công việc *
                  <input
                    required
                    maxLength={1000}
                    value={editing.title}
                    onChange={(e) => change('title', e.target.value)}
                  />
                </label>
                <label className="field">
                  Mô tả
                  <textarea
                    rows={3}
                    value={editing.description || ''}
                    onChange={(e) => change('description', e.target.value)}
                  />
                </label>
                <div className="form-grid">
                  <label className="field">
                    Trạng thái
                    <select
                      value={editing.status}
                      onChange={(e) => change('status', e.target.value)}
                    >
                      {statuses
                        .filter(
                          (s) =>
                            !['Chờ duyệt', 'Hoàn thành'].includes(s) || s === storedTask?.status,
                        )
                        .filter((s) => !isStoredPending || s === 'Chờ duyệt')
                        .map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="field">
                    Ưu tiên
                    <select
                      value={editing.priority}
                      onChange={(e) => change('priority', e.target.value)}
                    >
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Ngày bắt đầu
                    <input
                      type="date"
                      value={editing.start || ''}
                      onChange={(e) => change('start', e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Hạn chót
                    <input
                      type="date"
                      value={editing.due || ''}
                      onChange={(e) => change('due', e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Tiến độ (%)
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editing.progress}
                      onChange={(e) => change('progress', Number(e.target.value))}
                    />
                  </label>
                  <label className="field">
                    Người phụ trách
                    {canAssign &&
                    (!editing.version || !isStoredPending) &&
                    editing.status !== 'Hoàn thành' ? (
                      <select
                        value={editing.assignedTo || ''}
                        onChange={(e) => change('assignedTo', e.target.value || null)}
                      >
                        <option value="">Chưa giao</option>
                        {editing.assignedTo &&
                          !members.some((m) => m.userId === editing.assignedTo) && (
                            <option value={editing.assignedTo}>
                              Tài khoản không còn hoạt động: {editing.assignedTo}
                            </option>
                          )}
                        {members.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {memberLabel(m.userId)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input value={memberLabel(editing.assignedTo)} readOnly />
                    )}
                  </label>
                </div>
                <label className="field">
                  Kết quả / Bằng chứng
                  <textarea
                    rows={2}
                    value={editing.result || ''}
                    onChange={(e) => change('result', e.target.value)}
                  />
                </label>
                {editing.status === 'Đã hủy' && (
                  <label className="field">
                    Lý do hủy
                    <textarea
                      value={editing.cancelReason || ''}
                      onChange={(e) => change('cancelReason', e.target.value)}
                    />
                  </label>
                )}
                {editing.version > 0 && (
                  <label className="field">
                    Lý do thay đổi hạn chót (nếu đổi hạn)
                    <input value={reason} onChange={(e) => setReason(e.target.value)} />
                  </label>
                )}
                <p className="help">
                  Quy trình: Lưu kết quả trước, sau đó nhấn Trình duyệt. Phê duyệt/Trả lại chỉ hiện
                  khi server đã lưu trạng thái Chờ duyệt.
                </p>
                <p className="help">
                  Lưu ý: chỉ thành viên active được giao việc; API quyết định quyền cuối cùng. Bản
                  local chỉ có tài khoản giả lập.
                </p>
              </div>
              <div
                className="modal-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  flex: '0 0 auto',
                  minHeight: 68,
                  margin: 0,
                  padding: '12px 20px',
                  boxSizing: 'border-box',
                  background: '#fff',
                  borderTop: '1px solid #e5e7eb',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setEditing(null)}
                  disabled={busy}
                >
                  Hủy
                </button>
                {editing.version > 0 &&
                  !isStoredPending &&
                  storedTask &&
                  !['Hoàn thành', 'Đã hủy'].includes(storedTask.status) && (
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => void submitTask()}
                    >
                      Trình duyệt
                    </button>
                  )}
                {canReview && isStoredPending && (
                  <>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => void reviewTask('reject')}
                    >
                      Trả lại
                    </button>
                    <button
                      type="button"
                      className="btn primary"
                      disabled={busy}
                      onClick={() => void reviewTask('approve')}
                    >
                      Phê duyệt
                    </button>
                  </>
                )}
                <button type="submit" className="btn primary" disabled={busy || isStoredPending}>
                  <Save size={16} />
                  {busy ? 'Đang lưu...' : 'Lưu công việc'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
