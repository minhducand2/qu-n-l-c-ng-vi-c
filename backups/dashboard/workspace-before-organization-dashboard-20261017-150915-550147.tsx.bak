'use client';
import { useEffect, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import {
  LayoutDashboard,
  ListTodo,
  Columns3,
  CalendarDays,
  Building2,
  Users,
  MessageSquare,
  FolderOpen,
  BarChart3,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  X,
  Download,
  Upload,
  Trash2,
  Copy,
  Send,
  Paperclip,
  ShieldCheck,
  History,
  Archive,
  RefreshCw,
  Menu,
  CheckCircle2,
  Flag,
  FileText,
  ArrowRight,
  SlidersHorizontal,
  Target,
  LogOut,
} from 'lucide-react';
import { statuses, priorities, overdue, dateText, localDay, validateTask } from '../lib/domain';
import SharedTasksPanel from './shared-tasks-panel';
type Row = Record<string, any>;
const nav = [
  ['overview', 'Tổng quan', LayoutDashboard],
  ['tasks', 'Công việc', ListTodo],
  ['board', 'Bảng Kanban', Columns3],
  ['calendar', 'Lịch công việc', CalendarDays],
  ['plans', 'Kế hoạch', Target],
  ['approvals', 'Phê duyệt', ShieldCheck],
  ['departments', 'Phòng ban', Building2],
  ['people', 'Nhân sự', Users],
  ['organizations', 'Quản lý tổ chức', Building2],
  ['shared-tasks', 'Công việc chung', Users],
  ['chat', 'Trao đổi', MessageSquare],
  ['files', 'Tài liệu', FolderOpen],
  ['reports', 'Báo cáo', BarChart3],
  ['history', 'Nhật ký', History],
] as const;
const fmtTime = (v: string) =>
  v
    ? new Date(v).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      })
    : '';
const statusClass = (s: string) =>
  s === 'Hoàn thành'
    ? 'green'
    : s === 'Đang thực hiện'
      ? 'blue'
      : ['Chờ duyệt', 'Xem xét'].includes(s)
        ? 'amber'
        : s === 'Đã hủy'
          ? 'red'
          : 'gray';
const initials = (v: string) =>
  v
    .split(' ')
    .slice(-2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();
const blankTask = (): Row => ({
  id: crypto.randomUUID(),
  kind: 'task',
  code: 'CV-' + crypto.randomUUID().slice(0, 6).toUpperCase(),
  title: '',
  description: '',
  department: '',
  owner: '',
  plan: '',
  type: '',
  status: 'Chưa bắt đầu',
  priority: 'Trung bình',
  start: '',
  due: '',
  progress: 0,
  result: '',
  cancelReason: '',
  checklist: [],
  review: false,
  archived: false,
});
function Empty({
  text = 'Chưa có dữ liệu',
  sub = 'Các nội dung mới sẽ xuất hiện tại đây.',
}: {
  text?: string;
  sub?: string;
}) {
  return (
    <div className="empty">
      <FolderOpen size={32} />
      <h3>{text}</h3>
      <p>{sub}</p>
    </div>
  );
}
function Tag({ children, color = 'gray' }: { children: any; color?: string }) {
  return (
    <span className={'tag ' + color}>
      <i />
      {children}
    </span>
  );
}
type OrganizationItem = {
  id: string;
  name: string;
  role: string;
  status: string;
  joined_at: string;
};
type OrganizationMember = {
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
};
const organizationRoles = ['admin', 'leader', 'manager', 'member', 'viewer'] as const;
function OrganizationManager() {
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [selected, setSelected] = useState('');
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [name, setName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [memberRole, setMemberRole] = useState<string>('member');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function callApi(url: string, method: string, body: unknown) {
    const r = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = (await r.json()) as {
      error?: string;
      workspace?: { id: string };
    };
    if (!r.ok) throw Error(result.error || 'Yêu cầu thất bại.');
    return result;
  }
  async function loadOrganizations() {
    setLoading(true);
    try {
      const r = await fetch('/api/workspaces', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = (await r.json()) as {
        error?: string;
        workspaces?: OrganizationItem[];
      };
      if (!r.ok) throw Error(data.error || 'Không thể tải tổ chức.');
      const list: OrganizationItem[] = Array.isArray(data.workspaces) ? data.workspaces : [];
      setItems(list);
      setSelected((previous) =>
        list.some((x) => x.id === previous) ? previous : list[0]?.id || '',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải tổ chức.');
    } finally {
      setLoading(false);
    }
  }
  async function loadMembers(id: string) {
    if (!id) {
      setMembers([]);
      return;
    }
    try {
      const r = await fetch('/api/workspaces/' + encodeURIComponent(id) + '/members', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = (await r.json()) as {
        error?: string;
        members?: OrganizationMember[];
      };
      if (!r.ok) throw Error(data.error || 'Không thể tải thành viên.');
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (e) {
      setMembers([]);
      setError(e instanceof Error ? e.message : 'Không thể tải thành viên.');
    }
  }
  useEffect(() => {
    void loadOrganizations();
  }, []);
  useEffect(() => {
    void loadMembers(selected);
  }, [selected]);
  async function createOrganization(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await callApi('/api/workspaces', 'POST', {
        name: name.trim(),
      });
      if (!result.workspace?.id) throw Error('API không trả về ID tổ chức.');
      setName('');
      await loadOrganizations();
      setSelected(result.workspace.id);
      setMessage('Đã tạo tổ chức thành công.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tạo tổ chức.');
    } finally {
      setBusy(false);
    }
  }
  async function addMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await callApi('/api/workspaces/' + encodeURIComponent(selected) + '/members', 'POST', {
        userId: memberId.trim(),
        role: memberRole,
      });
      setMemberId('');
      await loadMembers(selected);
      setMessage('Đã cấp quyền cho ID tài khoản.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể thêm thành viên.');
    } finally {
      setBusy(false);
    }
  }
  async function updateMember(member: OrganizationMember, role: string, status: string) {
    if (busy || !selected) return;
    if (!confirm('Xác nhận cập nhật quyền thành viên này?')) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await callApi('/api/workspaces/' + encodeURIComponent(selected) + '/members', 'PATCH', {
        userId: member.userId,
        role,
        status,
      });
      await loadMembers(selected);
      setMessage('Đã cập nhật quyền thành viên.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể cập nhật thành viên.');
    } finally {
      setBusy(false);
    }
  }
  const current = items.find((x) => x.id === selected);
  return (
    <div className="settings-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Tổ chức của tôi</h2>
            <p>Chọn tổ chức để quản lý thành viên.</p>
          </div>
          <button
            className="btn secondary compact"
            disabled={loading}
            onClick={() => void loadOrganizations()}
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
        <div className="settings-body">
          {loading ? (
            <p>Đang tải tổ chức...</p>
          ) : items.length ? (
            <div className="archive-list">
              {items.map((item) => (
                <div key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>Vai trò: {item.role} · Đang hoạt động</small>
                  </div>
                  <button
                    className="btn secondary compact"
                    disabled={busy}
                    onClick={() => setSelected(item.id)}
                  >
                    {selected === item.id ? 'Đang chọn' : 'Quản lý'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>Chưa có tổ chức.</p>
          )}
          <p className="help">Dữ liệu công việc cá nhân hiện chưa được chia sẻ sang tổ chức.</p>
          {current && (
            <>
              <hr />
              <h3>Thành viên — {current.name}</h3>
              {current.role !== 'admin' ? (
                <p className="help">Chỉ admin được quản lý thành viên.</p>
              ) : (
                <>
                  <form onSubmit={addMember}>
                    <label className="field">
                      ID tài khoản đã xác thực
                      <input
                        required
                        maxLength={200}
                        value={memberId}
                        onChange={(e) => setMemberId(e.target.value)}
                        placeholder="ID do hệ thống xác thực cung cấp"
                      />
                    </label>
                    <label className="field">
                      Vai trò
                      <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                        {organizationRoles.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="btn primary" disabled={busy || !memberId.trim()}>
                      <Plus size={16} />
                      Thêm thành viên
                    </button>
                  </form>
                  <p className="help">
                    Chưa hỗ trợ mời bằng email. Chỉ nhập ID tài khoản đã được xác minh; danh mục
                    Nhân sự không phải tài khoản đăng nhập.
                  </p>
                  <div className="archive-list">
                    {members.map((m) => (
                      <div key={m.userId}>
                        <div>
                          <strong>{m.userId}</strong>
                          <small>
                            {m.role} · {m.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                          </small>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <select
                            aria-label={'Vai trò của ' + m.userId}
                            value={m.role}
                            disabled={busy}
                            onChange={(e) => void updateMember(m, e.target.value, m.status)}
                          >
                            {organizationRoles.map((x) => (
                              <option value={x} key={x}>
                                {x}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn secondary compact"
                            disabled={busy}
                            onClick={() =>
                              void updateMember(
                                m,
                                m.role,
                                m.status === 'active' ? 'suspended' : 'active',
                              )
                            }
                          >
                            {m.status === 'active' ? 'Khóa' : 'Kích hoạt'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Tạo tổ chức</h2>
          <Building2 size={19} />
        </div>
        <form className="settings-body" onSubmit={createOrganization}>
          <label className="field">
            Tên tổ chức <span>*</span>
            <input
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Văn phòng điều hành"
            />
          </label>
          <button className="btn primary" disabled={busy || name.trim().length < 2}>
            <Plus size={16} />
            Tạo tổ chức
          </button>
          {error && (
            <p className="red-text" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <hr />
          <h3>Phạm vi tính năng</h3>
          <p className="help">
            Thêm thành viên hiện chỉ cấp membership. Chưa có chia sẻ công việc, mời qua email hay
            đăng nhập nhiều tài khoản trên local.
          </p>
        </form>
      </section>
    </div>
  );
}
export default function Workspace({ userName }: { userName: string }) {
  const [rows, setRows] = useState<Row[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [toast, setToast] = useState(''),
    [page, setPage] = useState('overview'),
    [search, setSearch] = useState(''),
    [dept, setDept] = useState(''),
    [status, setStatus] = useState(''),
    [priority, setPriority] = useState(''),
    [onlyReview, setOnlyReview] = useState(false),
    [onlyLate, setOnlyLate] = useState(false),
    [edit, setEdit] = useState<Row | null>(null),
    [tab, setTab] = useState('detail'),
    [saving, setSaving] = useState(false),
    [note, setNote] = useState(''),
    [reason, setReason] = useState(''),
    [catalog, setCatalog] = useState<Row | null>(null),
    [notifications, setNotifications] = useState(false),
    [sidebar, setSidebar] = useState(false),
    [chat, setChat] = useState(''),
    [channel, setChannel] = useState('general'),
    [month, setMonth] = useState(() => new Date(localDay() + 'T12:00:00')),
    [importRows, setImportRows] = useState<Row[] | null>(null),
    [importError, setImportError] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  // Deep link from "Công việc của tôi"; actual task access is checked by the API.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('view') === 'shared-tasks' &&
      params.get('workspaceId') &&
      params.get('taskId')
    ) {
      setPage('shared-tasks');
    }
  }, []);

  async function refresh(silent = false) {
    if (!silent) setLoading(true);
    try {
      const r = await fetch('/api/data');
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      setRows(d.records);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể kết nối.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    const timer = setInterval(() => refresh(true), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEdit(null);
        setCatalog(null);
        setNotifications(false);
        setSidebar(false);
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
  const tasks = rows.filter((x) => x.kind === 'task' && !x.archived),
    departments = rows.filter((x) => x.kind === 'department' && !x.archived),
    people = rows.filter((x) => x.kind === 'person' && !x.archived),
    plans = rows.filter((x) => x.kind === 'plan' && !x.archived),
    prefs = rows.find((x) => x.kind === 'settings') || {
      id: 'prefs',
      kind: 'settings',
      remindDays: 3,
    };
  const today = localDay();
  const department = (id: string) => departments.find((x) => x.id === id),
    person = (id: string) => people.find((x) => x.id === id);
  const filtered = tasks.filter(
    (t) =>
      (!search ||
        [t.title, t.code, t.description, person(t.owner)?.name]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!dept || t.department === dept) &&
      (!status || t.status === status) &&
      (!priority || t.priority === priority) &&
      (!onlyReview || t.review) &&
      (!onlyLate || overdue(t)),
  );
  const late = tasks.filter((t) => overdue(t)),
    done = tasks.filter((t) => t.status === 'Hoàn thành'),
    open = tasks.filter((t) => !['Hoàn thành', 'Đã hủy'].includes(t.status)),
    review = tasks.filter((t) => t.review),
    pending = tasks.filter((t) => t.status === 'Chờ duyệt');
  const soon = open.filter(
    (t) =>
      t.due &&
      t.due >= today &&
      (Date.parse(t.due) - Date.parse(today)) / 86400000 <= Number(prefs.remindDays || 3),
  );
  const alerts = [
    ...late.map((t) => ({ task: t, text: 'Đã qua hạn · ' + dateText(t.due) })),
    ...soon.map((t) => ({ task: t, text: 'Sắp đến hạn · ' + dateText(t.due) })),
  ];

  const interventions = tasks
    .filter((t) => !['Hoàn thành', 'Đã hủy'].includes(t.status))
    .map((t) => ({
      task: t,
      level: overdue(t)
        ? 0
        : t.status === 'Chờ duyệt'
          ? 1
          : soon.some((s) => s.id === t.id)
            ? 2
            : -1,
    }))
    .filter((item) => item.level >= 0)
    .sort((a, b) =>
      a.level - b.level ||
      String(a.task.due || '9999-12-31').localeCompare(
        String(b.task.due || '9999-12-31')
      )
    )
    .slice(0, 8);

  async function save(record: Row, action = 'save', why = '') {
    setSaving(true);
    try {
      const r = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record, action, reason: why }),
      });
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      setRows((prev) => [d.record, ...prev.filter((x) => x.id !== d.record.id)]);
      setToast(action === 'delete' ? 'Đã chuyển vào lưu trữ' : 'Đã lưu thay đổi');
      await refresh(true);
      return d.record as Row;
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Không thể lưu.');
      return null;
    } finally {
      setSaving(false);
    }
  }
  function go(p: string) {
    setPage(p);
    setSidebar(false);
    setSearch('');
    setDept('');
    setStatus('');
    setPriority('');
    setOnlyLate(false);
    setOnlyReview(false);
  }
  function openTask(t: Row) {
    setEdit(structuredClone(t));
    setTab('detail');
    setNote('');
    setReason('');
  }
  async function submitTask() {
    if (!edit) return;
    try {
      validateTask(edit);
    } catch (e) {
      setToast((e as Error).message);
      return;
    }
    const result = await save(edit, 'save', reason);
    if (result) setEdit(null);
  }
  async function archive(x: Row) {
    if (!confirm('Chuyển mục này vào lưu trữ? Bạn có thể khôi phục trong Cài đặt.')) return;
    if (await save(x, 'delete')) {
      setEdit(null);
      setCatalog(null);
    }
  }
  async function upload(file: File, taskId = '') {
    setSaving(true);
    try {
      const f = new FormData();
      f.set('file', file);
      f.set('taskId', taskId);
      const r = await fetch('/api/files', { method: 'POST', body: f });
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      await refresh(true);
      setToast('Đã tải tệp lên');
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function download(name: string, body: string, type: string) {
    const u = URL.createObjectURL(new Blob([body], { type }));
    const a = document.createElement('a');
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  function exportCSV() {
    const safe = (x: any) => {
      let s = String(x ?? '');
      if (/^[=+@-]/.test(s)) s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
    const data = [
      [
        'Mã',
        'Công việc',
        'Phòng ban',
        'Người phụ trách',
        'Trạng thái',
        'Ưu tiên',
        'Bắt đầu',
        'Hạn chót',
        'Tiến độ (%)',
        'Cần xác minh',
      ],
      ...filtered.map((t) => [
        t.code,
        t.title,
        department(t.department)?.name,
        person(t.owner)?.name,
        t.status,
        t.priority,
        t.start,
        t.due,
        t.progress,
        t.review ? 'Có' : 'Không',
      ]),
    ];
    download(
      'TEAM360-cong-viec.csv',
      '\uFEFF' + data.map((r) => r.map(safe).join(',')).join('\r\n'),
      'text/csv;charset=utf-8',
    );
    setToast('Đã xuất danh sách theo bộ lọc hiện tại');
  }
  async function importFile(file: File) {
    try {
      const raw = JSON.parse(await file.text());
      const list = Array.isArray(raw) ? raw : raw.records;
      if (!Array.isArray(list) || list.length > 500) throw Error('Chọn JSON tối đa 500 công việc.');
      const listTasks = list.filter((r: Row) => r.kind === 'task');
      if (!listTasks.length) throw Error('File chưa có công việc.');
      listTasks.forEach(validateTask);
      setImportRows(listTasks);
      setImportError('');
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  async function doImport() {
    if (!importRows) return;
    let count = 0;
    for (const t of importRows) {
      if (rows.some((r) => r.id === t.id)) continue;
      const fresh = { ...t, version: undefined, kind: 'task' };
      if (!(await save(fresh))) {
        setImportError(
          'Đã nhập ' +
            count +
            ' việc. Một dòng không hợp lệ; hãy kiểm tra phòng ban/nhân sự và thử lại.',
        );
        return;
      }
      count++;
    }
    setToast('Đã nhập ' + count + ' công việc; bỏ qua ID đã tồn tại.');
    setImportRows(null);
  }
  const title =
    page === 'settings' ? 'Cài đặt' : nav.find((x) => x[0] === page)?.[1] || 'Tổng quan';
  function TaskTable({ list = filtered }: { list?: Row[] }) {
    return list.length ? (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Công việc</th>
              <th>Phòng ban</th>
              <th>Người phụ trách</th>
              <th>Trạng thái</th>
              <th>Hạn chót</th>
              <th>Tiến độ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr
                key={t.id}
                onClick={() => openTask(t)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openTask(t)}
              >
                <td className="task-title">
                  <small>
                    {t.code}
                    {t.review && <span className="review-dot" title="Cần xác minh dữ liệu" />}
                  </small>
                  <strong>{t.title}</strong>
                </td>
                <td>
                  <span className="dept-pill" style={{ color: department(t.department)?.color }}>
                    {department(t.department)?.name || 'Chưa chọn'}
                  </span>
                </td>
                <td>
                  {person(t.owner) ? (
                    <span className="person">
                      <b className="avatar mini">{initials(person(t.owner)!.name)}</b>
                      {person(t.owner)!.name}
                    </span>
                  ) : (
                    <span className="muted">Chưa phân công</span>
                  )}
                </td>
                <td>
                  <Tag color={statusClass(t.status)}>{t.status}</Tag>
                </td>
                <td className={overdue(t) ? 'red-text' : ''}>
                  {t.due ? dateText(t.due) : <span className="muted">Chưa có hạn</span>}
                  {overdue(t) && <small>Quá hạn {t.review ? '· cần xác minh' : ''}</small>}
                </td>
                <td>
                  <div className="progress-cell">
                    <span>{t.progress}%</span>
                    <div className="progress">
                      <i style={{ width: t.progress + '%' }} />
                    </div>
                  </div>
                </td>
                <td>
                  <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <Empty text="Không có công việc phù hợp" sub="Thay đổi bộ lọc hoặc tạo công việc mới." />
    );
  }
  function Filters() {
    return (
      <div className="filters">
        <div className="search small">
          <Search size={16} />
          <input
            aria-label="Tìm công việc"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã công việc..."
          />
        </div>
        <select aria-label="Lọc phòng ban" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">Tất cả phòng ban</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Lọc ưu tiên"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">Mọi ưu tiên</option>
          {priorities.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button
          className={'filter-toggle ' + (onlyReview ? 'selected' : '')}
          onClick={() => setOnlyReview(!onlyReview)}
        >
          <SlidersHorizontal size={15} />
          Cần xác minh
        </button>
        {(dept || status || priority || search || onlyLate || onlyReview) && (
          <button
            className="text-btn"
            onClick={() => {
              setDept('');
              setStatus('');
              setPriority('');
              setSearch('');
              setOnlyLate(false);
              setOnlyReview(false);
            }}
          >
            Xóa lọc
          </button>
        )}
      </div>
    );
  }
  function FileList({ list }: { list: Row[] }) {
    return list.length ? (
      <div className="file-list">
        {list.map((f) => (
          <a key={f.id} href={'/api/files?id=' + f.id} className="file-row">
            <span className="file-icon">
              <FileText size={23} />
            </span>
            <div>
              <strong>{f.name}</strong>
              <small>
                {(f.size / 1024).toFixed(0)} KB · {f.author} · {fmtTime(f.updated)}
              </small>
            </div>
            <Download size={18} />
          </a>
        ))}
      </div>
    ) : (
      <Empty text="Chưa có tài liệu" sub="Tải tài liệu lên để lưu cùng công việc." />
    );
  }
  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (sidebar ? 'mobile-open' : '')}>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            go('overview');
          }}
        >
          <span className="brand-icon">
            <Columns3 size={23} />
          </span>
          <b>
            TEAM<span>360</span>
          </b>
          <small>WORKSPACE</small>
        </a>
        <div className="workspace-label">
          <span className="workspace-icon">ĐH</span>
          <div>
            <strong>Không gian điều hành</strong>
            <small>Quản lý tập trung</small>
          </div>
          <ChevronRight size={14} />
        </div>
        <span className="nav-label">KHÔNG GIAN LÀM VIỆC</span>
        <nav>
          {nav.map(([id, label, Icon], i) => (
            <div key={id}>
              {i === 6 && <span className="nav-label section-label">TỔ CHỨC & PHỐI HỢP</span>}
              <button
                className={page === id ? 'nav-item active' : 'nav-item'}
                onClick={() => go(id)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {id === 'tasks' && <small>{tasks.length}</small>}
                {id === 'approvals' && pending.length > 0 && <small>{pending.length}</small>}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="private-box">
            <ShieldCheck size={18} />
            <div>
              <strong>Không gian riêng tư</strong>
              <small>Chỉ tài khoản của bạn truy cập</small>
            </div>
          </div>
          <button
            className={'nav-item ' + (page === 'settings' ? 'active' : '')}
            onClick={() => go('settings')}
          >
            <Settings size={18} />
            Cài đặt
          </button>
          <div className="profile">
            <span className="avatar">{initials(userName)}</span>
            <div>
              <strong>{userName.split('@')[0]}</strong>
              <small>Chủ không gian</small>
            </div>
            <button
              type="button"
              className="icon-btn"
              title="Đăng xuất"
              aria-label="Đăng xuất"
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/logout', {
                    method: 'POST', credentials: 'same-origin',
                  });
                  if (!response.ok) throw new Error('Đăng xuất thất bại');
                  window.location.assign('/login');
                } catch {
                  setToast('Không thể đăng xuất. Vui lòng thử lại.');
                }
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      {sidebar && <div className="sidebar-shade" onClick={() => setSidebar(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-btn hamburger"
            onClick={() => setSidebar(!sidebar)}
            aria-label="Mở danh mục"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            Không gian làm việc <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <div className="search global-search">
              <Search size={16} />
              <input
                aria-label="Tìm kiếm"
                placeholder="Tìm kiếm công việc..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage('tasks');
                }}
              />
              <kbd>⌕</kbd>
            </div>
            <button
              className="icon-btn bell"
              aria-label="Thông báo"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={20} />
              {alerts.length > 0 && <i />}
            </button>
            <span className="avatar small-avatar">{initials(userName)}</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                TEAM360 / {page === 'overview' ? 'ĐIỀU HÀNH TẬP TRUNG' : title.toUpperCase()}
              </div>
              <h1>{page === 'overview' ? 'Tổng quan công việc' : title}</h1>
              <p>
                {page === 'overview'
                  ? 'Nắm bắt tiến độ, kết nối đội ngũ và tập trung vào điều quan trọng.'
                  : page === 'chat'
                    ? 'Lưu trao đổi trong không gian riêng tư. Chưa mở truy cập nhiều tài khoản.'
                    : page === 'people'
                      ? 'Danh mục từ dữ liệu gốc. Phòng ban và tài khoản cần được xác nhận.'
                      : page === 'shared-tasks'
                        ? 'Giao việc, theo dõi và phê duyệt trong tổ chức đã chọn.'
                        : 'Quản lý thông tin và theo dõi mọi thay đổi trong cùng một không gian.'}
              </p>
            </div>
            {page !== 'shared-tasks' && (
              <div className="heading-actions">
                <button className="btn secondary" onClick={exportCSV}>
                  <Download size={16} />
                  <span>Xuất báo cáo</span>
                </button>
                <button className="btn primary" onClick={() => openTask(blankTask())}>
                  <Plus size={18} />
                  Tạo công việc
                </button>
              </div>
            )}
          </div>
          {error && (
            <div className="notice error">
              <AlertTriangle size={18} />
              {error}
              <button onClick={() => refresh()}>Thử lại</button>
            </div>
          )}
          {loading ? (
            <div className="loading">
              <RefreshCw className="spin" size={25} />
              <span>Đang tải không gian làm việc...</span>
            </div>
          ) : (
            <>
              {page === 'overview' && (
                <>
                  <div className="overview-date">
                    <span>
                      <span className="live-dot" />
                      Dữ liệu hiện tại
                    </span>
                    <span>
                      <CalendarDays size={15} />
                      {new Date(today + 'T12:00:00').toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="stats-grid">
                    {[
                      {
                        label: 'Tổng công việc',
                        value: tasks.length,
                        icon: ListTodo,
                        color: 'teal',
                        sub: 'Trong không gian của bạn',
                        action: () => go('tasks'),
                      },
                      {
                        label: 'Đang thực hiện',
                        value: tasks.filter((t) => t.status === 'Đang thực hiện').length,
                        icon: Clock,
                        color: 'blue',
                        sub: 'Công việc đang triển khai',
                        action: () => {
                          go('tasks');
                          setStatus('Đang thực hiện');
                        },
                      },
                      {
                        label: 'Đã hoàn thành',
                        value: done.length,
                        icon: CheckCircle2,
                        color: 'green',
                        sub: tasks.length
                          ? 'Trên ' + tasks.length + ' công việc ghi nhận'
                          : 'Chưa có dữ liệu',
                        action: () => {
                          go('tasks');
                          setStatus('Hoàn thành');
                        },
                      },
                      {
                        label: 'Qua hạn theo dữ liệu',
                        value: late.length,
                        icon: Flag,
                        color: 'orange',
                        sub: late.some((t) => t.review)
                          ? 'Có dữ liệu cần xác minh'
                          : 'Cần ưu tiên xử lý',
                        action: () => {
                          go('tasks');
                          setOnlyLate(true);
                        },
                      },
                      {
                        label: 'Sắp hết hạn',
                        value: soon.length,
                        icon: Clock,
                        color: 'orange',
                        sub: 'Trong ngưỡng nhắc hạn',
                        action: () => go('tasks'),
                      },
                      {
                        label: 'Chờ phê duyệt',
                        value: pending.length,
                        icon: ShieldCheck,
                        color: 'blue',
                        sub: 'Cần xem xét kết quả',
                        action: () => go('approvals'),
                      },
                    ].map((s) => (
                      <button key={s.label} className="stat-card" onClick={s.action}>
                        <div>
                          <span>{s.label}</span>
                          <span className={'stat-icon ' + s.color}>
                            <s.icon size={19} />
                          </span>
                        </div>
                        <strong>{s.value.toString().padStart(2, '0')}</strong>
                        <small>
                          {s.sub}
                          <ArrowUpRight size={15} />
                        </small>
                      </button>
                    ))}
                  </div>
                  <section
                    className="panel"
                    style={{ padding: 22, marginBottom: 20 }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                      marginBottom: 14,
                    }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 18 }}>
                          Tỷ lệ hoàn thành
                        </h2>
                        <p className="muted" style={{ margin: '6px 0 0' }}>
                          {done.length}/{tasks.length} công việc
                          trong không gian của bạn
                        </p>
                      </div>
                      <strong style={{
                        fontSize: 30,
                        color: '#0d9488',
                      }}>
                        {tasks.length
                          ? Math.round(done.length / tasks.length * 100)
                          : 0}%
                      </strong>
                    </div>
                    <div
                      role="progressbar"
                      aria-label="Ty le hoan thanh cong viec"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={
                        tasks.length
                          ? Math.round(done.length / tasks.length * 100)
                          : 0
                      }
                      style={{
                        height: 12,
                        borderRadius: 999,
                        background: '#e2e8f0',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{
                        height: '100%',
                        width: (tasks.length
                          ? done.length / tasks.length * 100
                          : 0) + '%',
                        background: '#0d9488',
                        borderRadius: 999,
                        transition: 'width 250ms ease',
                      }} />
                    </div>
                  </section>
                  <section
                    className="panel"
                    aria-label="Danh sach can can thiep"
                    style={{ padding: 22, marginBottom: 20 }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                      marginBottom: 18,
                    }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 19 }}>
                          Công việc cần can thiệp
                        </h2>
                        <p className="muted" style={{ margin: '6px 0 0' }}>
                          Tối đa 8 công việc ưu tiên trong không gian của bạn
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn secondary compact"
                        onClick={() => go('tasks')}
                      >
                        Xem tất cả <ArrowRight size={16} />
                      </button>
                    </div>

                    {interventions.length === 0 ? (
                      <div style={{
                        padding: '25px 12px',
                        textAlign: 'center',
                        color: '#64748b',
                      }}>
                        Không có công việc cần can thiệp.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {interventions.map(({ task, level }) => (
                          <div
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 14,
                              flexWrap: 'wrap',
                              padding: '13px 15px',
                              border: '1px solid #e2e8f0',
                              borderRadius: 10,
                              background: '#ffffff',
                            }}
                          >
                            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flexWrap: 'wrap',
                                marginBottom: 6,
                              }}>
                                <strong style={{ overflowWrap: 'anywhere' }}>
                                  {task.title}
                                </strong>
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  background: level === 0
                                    ? '#fee2e2'
                                    : level === 1
                                      ? '#dbeafe'
                                      : '#fef3c7',
                                  color: level === 0
                                    ? '#b91c1c'
                                    : level === 1
                                      ? '#1d4ed8'
                                      : '#92400e',
                                }}>
                                  {level === 0
                                    ? 'Quá hạn'
                                    : level === 1
                                      ? 'Chờ duyệt'
                                      : 'Sắp hạn'}
                                </span>
                              </div>
                              <div className="muted" style={{ fontSize: 12 }}>
                                Hạn: {dateText(task.due)}
                                {' · '}
                                Tiến độ: {task.progress ?? 0}%
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn secondary compact"
                              onClick={() => openTask(task)}
                            >
                              Chi tiết <ArrowRight size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                  {review.length > 0 && (
                    <div className="notice">
                      <span className="notice-icon">
                        <AlertTriangle size={19} />
                      </span>
                      <div>
                        <strong>{review.length} công việc cần xác minh dữ liệu</strong>
                        <p>
                          Kiểm tra ngày tháng, người phụ trách và trạng thái từ bảng Excel trước khi
                          đánh giá hiệu suất.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          go('tasks');
                          setOnlyReview(true);
                        }}
                      >
                        Kiểm tra ngay <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                  <div className="dashboard-grid">
                    <section className="panel distribution">
                      <div className="panel-heading">
                        <div>
                          <h2>Phân bổ công việc</h2>
                          <p>Theo phòng chủ trì</p>
                        </div>
                        <button className="text-btn" onClick={() => go('reports')}>
                          Chi tiết <ArrowUpRight size={15} />
                        </button>
                      </div>
                      <div className="bar-chart">
                        {departments.map((d) => {
                          const count = tasks.filter((t) => t.department === d.id).length;
                          return (
                            <button
                              className="bar-row"
                              key={d.id}
                              onClick={() => {
                                go('tasks');
                                setDept(d.id);
                              }}
                            >
                              <span>{d.name}</span>
                              <div className="bar-track">
                                <i
                                  style={{
                                    width: (count / Math.max(1, tasks.length)) * 100 + '%',
                                    background: d.color,
                                  }}
                                />
                              </div>
                              <b>{count}</b>
                            </button>
                          );
                        })}
                      </div>
                      <div className="chart-foot">
                        <span className="dot teal-bg" />
                        Số nhiệm vụ chủ trì <span>Không đếm lặp người phối hợp</span>
                      </div>
                    </section>
                    <section className="panel status-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Trạng thái thực hiện</h2>
                          <p>Ảnh chụp dữ liệu hiện tại</p>
                        </div>
                        <Columns3 size={18} />
                      </div>
                      <div className="status-content">
                        <div
                          className="donut"
                          style={{
                            background: tasks.length
                              ? `conic-gradient(#16846b 0 ${(done.length / tasks.length) * 100}%,#e8eef0 0 100%)`
                              : '#e8eef0',
                          }}
                        >
                          <div>
                            <strong>{tasks.length}</strong>
                            <small>CÔNG VIỆC</small>
                          </div>
                        </div>
                        <div className="status-legend">
                          {[
                            'Chưa bắt đầu',
                            'Đang thực hiện',
                            'Xem xét',
                            'Hoàn thành',
                            'Chưa xác định',
                          ].map((s, i) => (
                            <div key={s}>
                              <span className={'legend-dot l' + i} />
                              <span>{s}</span>
                              <b>{tasks.filter((t) => t.status === s).length}</b>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="chart-foot">
                        {review.length > 0
                          ? 'Chưa đủ dữ liệu xác minh để kết luận hiệu suất.'
                          : 'Tỷ lệ thể hiện trạng thái công việc, không phải năng suất cá nhân.'}
                      </div>
                    </section>
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>
                          Công việc cần chú ý <span className="count-badge">{tasks.length}</span>
                        </h2>
                        <p>Ưu tiên kiểm tra dữ liệu và phân công trách nhiệm</p>
                      </div>
                      <button className="text-btn" onClick={() => go('tasks')}>
                        Xem tất cả <ArrowRight size={16} />
                      </button>
                    </div>
                    <TaskTable
                      list={[...tasks]
                        .sort((a, b) => Number(overdue(b)) - Number(overdue(a)))
                        .slice(0, 5)}
                    />
                    <div className="panel-footer">
                      <span>
                        <span className="review-dot" />
                        Dấu vàng: dữ liệu cần xác minh
                      </span>
                      <span>
                        {tasks.length} công việc · {departments.length} phòng ban
                      </span>
                    </div>
                  </section>
                  <div className="bottom-grid">
                    <section className="panel quick-panel">
                      <div>
                        <span className="quick-icon">
                          <Target size={25} />
                        </span>
                        <h2>
                          Một kế hoạch rõ ràng.
                          <br />
                          Một đội ngũ cùng tiến.
                        </h2>
                        <p>
                          Sắp xếp công việc theo kế hoạch để theo dõi các đầu ra trong cùng một nơi.
                        </p>
                        <button className="text-btn" onClick={() => go('plans')}>
                          Quản lý kế hoạch <ArrowRight size={16} />
                        </button>
                      </div>
                      <div className="abstract-art">
                        <span />
                        <span />
                        <span />
                        <i />
                        <b>
                          <Check size={27} />
                        </b>
                      </div>
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Hoạt động gần đây</h2>
                        <button className="text-btn" onClick={() => go('history')}>
                          Xem thêm
                        </button>
                      </div>
                      <div className="activity-list">
                        {rows
                          .filter((x) => x.kind === 'audit')
                          .slice(0, 3)
                          .map((a) => (
                            <div key={a.id}>
                              <span className="activity-dot" />
                              <div>
                                <strong>
                                  {a.action}: {a.title}
                                </strong>
                                <small>
                                  {a.author} · {fmtTime(a.updated)}
                                </small>
                              </div>
                            </div>
                          ))}
                        {!rows.some((x) => x.kind === 'audit') && (
                          <div>
                            <span className="activity-dot" />
                            <div>
                              <strong>Dữ liệu gốc đã sẵn sàng để rà soát</strong>
                              <small>3 công việc, 5 phòng ban và 34 tên nhân sự từ Excel</small>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </>
              )}
              {['tasks', 'board', 'approvals'].includes(page) && (
                <section className={'panel ' + (page === 'board' ? 'board-panel' : '')}>
                  <div className="panel-heading">
                    <div className="view-tabs">
                      <button
                        className={page === 'tasks' ? 'active' : ''}
                        onClick={() => setPage('tasks')}
                      >
                        <ListTodo size={16} />
                        Danh sách
                      </button>
                      <button
                        className={page === 'board' ? 'active' : ''}
                        onClick={() => setPage('board')}
                      >
                        <Columns3 size={16} />
                        Kanban
                      </button>
                      <button
                        className={page === 'approvals' ? 'active' : ''}
                        onClick={() => setPage('approvals')}
                      >
                        <ShieldCheck size={16} />
                        Chờ duyệt <b>{pending.length}</b>
                      </button>
                    </div>
                    <button
                      className="btn secondary compact"
                      onClick={() => importRef.current?.click()}
                    >
                      <Upload size={15} />
                      Nhập JSON
                    </button>
                  </div>
                  <Filters />
                  {page === 'board' ? (
                    <div className="kanban">
                      {statuses
                        .filter((s) => s !== 'Đã hủy')
                        .map((s) => (
                          <div className="kanban-column" key={s}>
                            <h3>
                              <span className={'status-mark ' + statusClass(s)} />
                              {s}
                              <small>{filtered.filter((t) => t.status === s).length}</small>
                            </h3>
                            {filtered
                              .filter((t) => t.status === s)
                              .map((t) => (
                                <button
                                  className="kanban-card"
                                  key={t.id}
                                  onClick={() => openTask(t)}
                                >
                                  <div>
                                    <small>{t.code}</small>
                                    {t.review && <AlertTriangle size={15} className="amber-text" />}
                                  </div>
                                  <strong>{t.title}</strong>
                                  <span className="dept-pill">
                                    {department(t.department)?.name || 'Chưa chọn phòng'}
                                  </span>
                                  <div className="progress">
                                    <i style={{ width: t.progress + '%' }} />
                                  </div>
                                  <footer>
                                    <span className={overdue(t) ? 'red-text' : ''}>
                                      <CalendarDays size={13} />
                                      {dateText(t.due)}
                                    </span>
                                    <span className="avatar mini">
                                      {person(t.owner) ? initials(person(t.owner)!.name) : '?'}
                                    </span>
                                  </footer>
                                </button>
                              ))}
                            <button
                              className="add-column"
                              onClick={() => openTask({ ...blankTask(), status: s })}
                            >
                              <Plus size={15} />
                              Thêm công việc
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <TaskTable
                      list={
                        page === 'approvals'
                          ? filtered.filter((t) => t.status === 'Chờ duyệt')
                          : filtered
                      }
                    />
                  )}
                  <div className="panel-footer">
                    {page === 'approvals'
                      ? 'Bản riêng tư: chủ không gian ghi nhận quyết định duyệt; chưa có luồng nhiều tài khoản.'
                      : filtered.length + ' công việc phù hợp bộ lọc'}
                  </div>
                </section>
              )}
              {page === 'calendar' && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Lịch hạn hoàn thành</h2>
                      <p>Công việc chưa có hạn được hiển thị riêng bên dưới</p>
                    </div>
                    <div className="calendar-controls">
                      <button
                        className="icon-btn"
                        onClick={() =>
                          setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
                        }
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <strong>
                        Tháng {month.getMonth() + 1}, {month.getFullYear()}
                      </strong>
                      <button
                        className="icon-btn"
                        onClick={() =>
                          setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
                        }
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button
                        className="btn secondary compact"
                        onClick={() => setMonth(new Date(today + 'T12:00:00'))}
                      >
                        Hôm nay
                      </button>
                    </div>
                  </div>
                  <div className="calendar-grid">
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map((x) => (
                      <div className="calendar-weekday" key={x}>
                        {x}
                      </div>
                    ))}
                    {Array.from({ length: 42 }, (_, i) => {
                      const date = new Date(month.getFullYear(), month.getMonth(), 1);
                      date.setDate(1 - ((date.getDay() + 6) % 7) + i);
                      const day = [
                        date.getFullYear(),
                        String(date.getMonth() + 1).padStart(2, '0'),
                        String(date.getDate()).padStart(2, '0'),
                      ].join('-');
                      return (
                        <div
                          key={day}
                          className={
                            'calendar-day ' +
                            (date.getMonth() !== month.getMonth() ? 'outside ' : '') +
                            (day === today ? 'today' : '')
                          }
                        >
                          <span>{date.getDate()}</span>
                          {tasks
                            .filter((t) => t.due === day)
                            .map((t) => (
                              <button key={t.id} onClick={() => openTask(t)} title={t.title}>
                                {t.title}
                              </button>
                            ))}
                        </div>
                      );
                    })}
                  </div>
                  <div className="panel-heading">
                    <h2>Chưa có hạn ({tasks.filter((t) => !t.due).length})</h2>
                  </div>
                  <TaskTable list={tasks.filter((t) => !t.due)} />
                </section>
              )}
              {page === 'plans' && (
                <>
                  <div className="section-toolbar">
                    <span>{plans.length} kế hoạch</span>
                    <button
                      className="btn secondary"
                      onClick={() =>
                        setCatalog({
                          id: crypto.randomUUID(),
                          kind: 'plan',
                          name: '',
                          department: '',
                          description: '',
                          review: false,
                        })
                      }
                    >
                      <Plus size={16} />
                      Thêm kế hoạch
                    </button>
                  </div>
                  <div className="catalog-grid">
                    {plans.map((p) => (
                      <section className="panel catalog-card" key={p.id}>
                        <div className="catalog-top">
                          <span className="catalog-icon">
                            <Target size={23} />
                          </span>
                          <button
                            className="icon-btn"
                            aria-label="Sửa kế hoạch"
                            onClick={() => setCatalog({ ...p })}
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                        <h2>{p.name}</h2>
                        <p>{p.description || 'Chưa có mô tả'}</p>
                        {p.review && <Tag color="amber">Cần xác nhận</Tag>}
                        <footer>
                          <span>
                            {tasks.filter((t) => t.plan === p.id).length} công việc được liên kết
                          </span>
                          <button
                            className="text-btn"
                            onClick={() =>
                              openTask({
                                ...blankTask(),
                                plan: p.id,
                                department: p.department,
                              })
                            }
                          >
                            <Plus size={15} />
                            Giao việc
                          </button>
                        </footer>
                      </section>
                    ))}
                  </div>
                  {!plans.length && <Empty />}
                </>
              )}
              {page === 'departments' && (
                <>
                  <div className="section-toolbar">
                    <span>{departments.length} phòng ban hoạt động</span>
                    <button
                      className="btn secondary"
                      onClick={() =>
                        setCatalog({
                          id: crypto.randomUUID(),
                          kind: 'department',
                          name: '',
                          fullName: '',
                          color: '#16846b',
                          active: true,
                        })
                      }
                    >
                      <Plus size={16} />
                      Thêm phòng ban
                    </button>
                  </div>
                  <div className="catalog-grid">
                    {departments.map((d) => (
                      <section className="panel catalog-card" key={d.id}>
                        <div className="catalog-top">
                          <span
                            className="catalog-icon"
                            style={{
                              color: d.color,
                              background: d.color + '15',
                            }}
                          >
                            <Building2 size={24} />
                          </span>
                          <button
                            className="icon-btn"
                            aria-label="Sửa phòng ban"
                            onClick={() => setCatalog({ ...d })}
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                        <h2>{d.name}</h2>
                        <p>{d.fullName}</p>
                        <div className="department-stats">
                          <div>
                            <strong>{tasks.filter((t) => t.department === d.id).length}</strong>
                            <span>Công việc</span>
                          </div>
                          <div>
                            <strong>{people.filter((p) => p.department === d.id).length}</strong>
                            <span>Nhân sự đã gán</span>
                          </div>
                          <div>
                            <strong>
                              {
                                tasks.filter(
                                  (t) => t.department === d.id && t.status === 'Hoàn thành',
                                ).length
                              }
                            </strong>
                            <span>Hoàn thành</span>
                          </div>
                        </div>
                        <footer>
                          <span>
                            <span className="live-dot" />
                            Đang hoạt động
                          </span>
                          <button
                            className="text-btn"
                            onClick={() => {
                              go('tasks');
                              setDept(d.id);
                            }}
                          >
                            Xem công việc <ArrowRight size={16} />
                          </button>
                        </footer>
                      </section>
                    ))}
                  </div>
                </>
              )}
              {page === 'people' && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        Danh sách nhân sự <span className="count-badge">{people.length}</span>
                      </h2>
                      <p>Danh mục nhân sự không đồng nghĩa với tài khoản truy cập.</p>
                    </div>
                    <button
                      className="btn secondary"
                      onClick={() =>
                        setCatalog({
                          id: crypto.randomUUID(),
                          kind: 'person',
                          name: '',
                          department: '',
                          position: '',
                          email: '',
                          active: true,
                        })
                      }
                    >
                      <Plus size={16} />
                      Thêm nhân sự
                    </button>
                  </div>
                  <div className="filters">
                    <div className="search">
                      <Search size={16} />
                      <input
                        placeholder="Tìm tên nhân sự..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select value={dept} onChange={(e) => setDept(e.target.value)}>
                      <option value="">Tất cả phòng ban</option>
                      <option value="unassigned">Chưa xác định phòng</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Họ và tên</th>
                          <th>Phòng ban</th>
                          <th>Chức danh</th>
                          <th>Email liên hệ</th>
                          <th>Công việc phụ trách</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {people
                          .filter(
                            (p) =>
                              p.name.toLowerCase().includes(search.toLowerCase()) &&
                              (!dept ||
                                (dept === 'unassigned' ? !p.department : p.department === dept)),
                          )
                          .map((p) => (
                            <tr key={p.id} onClick={() => setCatalog({ ...p })}>
                              <td>
                                <span className="person">
                                  <span className="avatar">{initials(p.name)}</span>
                                  <strong>{p.name}</strong>
                                </span>
                              </td>
                              <td>
                                {department(p.department)?.name || (
                                  <span className="muted">Chưa xác định</span>
                                )}
                              </td>
                              <td>{p.position || '—'}</td>
                              <td>{p.email || '—'}</td>
                              <td>{tasks.filter((t) => t.owner === p.id).length}</td>
                              <td>
                                <ChevronRight size={16} />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              {page === 'chat' && (
                <section className="panel chat-layout">
                  <aside>
                    <h2>Kênh trao đổi</h2>
                    {[{ id: 'general', name: 'Trao đổi chung' }, ...departments].map((d) => (
                      <button
                        className={channel === d.id ? 'active' : ''}
                        key={d.id}
                        onClick={() => setChannel(d.id)}
                      >
                        <span>#</span>
                        {d.name}
                      </button>
                    ))}
                    <div className="chat-info">
                      <ShieldCheck size={18} />
                      <p>
                        Tin nhắn được lưu trên máy chủ trong không gian của bạn. Chưa có thành viên
                        khác truy cập.
                      </p>
                    </div>
                  </aside>
                  <div className="chat-main">
                    <div className="panel-heading">
                      <h2>
                        # {channel === 'general' ? 'Trao đổi chung' : department(channel)?.name}
                      </h2>
                      <Tag color="green">Riêng tư</Tag>
                    </div>
                    <div className="messages">
                      {rows
                        .filter((r) => r.kind === 'message' && r.channel === channel)
                        .reverse()
                        .map((m) => (
                          <div className="message" key={m.id}>
                            <span className="avatar">{initials(m.author)}</span>
                            <div>
                              <strong>
                                {m.author}
                                <small>{fmtTime(m.updated)}</small>
                              </strong>
                              <p>{m.text}</p>
                            </div>
                          </div>
                        ))}
                      {!rows.some((r) => r.kind === 'message' && r.channel === channel) && (
                        <Empty
                          text="Bắt đầu một trao đổi"
                          sub="Ghi lại ý tưởng, cập nhật hoặc thông tin cần phối hợp."
                        />
                      )}
                    </div>
                    <form
                      className="composer"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (
                          await save({
                            id: crypto.randomUUID(),
                            kind: 'message',
                            channel,
                            text: chat,
                          })
                        )
                          setChat('');
                      }}
                    >
                      <textarea
                        placeholder="Nhập nội dung trao đổi..."
                        value={chat}
                        onChange={(e) => setChat(e.target.value)}
                        maxLength={10000}
                      />
                      <button className="btn primary" disabled={saving || !chat.trim()}>
                        <Send size={17} />
                        Gửi
                      </button>
                    </form>
                  </div>
                </section>
              )}
              {page === 'files' && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Tài liệu trong không gian</h2>
                      <p>PDF, Word, Excel, CSV, văn bản và hình ảnh · Tối đa 10 MB/tệp</p>
                    </div>
                    <label className="btn primary">
                      <Upload size={16} />
                      Tải tài liệu
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
                        disabled={saving}
                        onChange={(e) => {
                          if (e.target.files?.[0]) upload(e.target.files[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <FileList list={rows.filter((r) => r.kind === 'file')} />
                </section>
              )}
              {page === 'reports' && (
                <>
                  <div className="notice">
                    <ShieldCheck size={21} />
                    <div>
                      <strong>Báo cáo từ dữ liệu hiện tại</strong>
                      <p>
                        Đếm nhiệm vụ một lần theo phòng chủ trì. Các công việc cần xác minh được
                        tách rõ; chưa có dữ liệu lịch sử để đánh giá năng suất.
                      </p>
                    </div>
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Tổng hợp theo phòng ban</h2>
                      <button className="btn secondary" onClick={() => window.print()}>
                        <FileText size={16} />
                        In / lưu PDF
                      </button>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Phòng ban</th>
                            <th>Tổng việc</th>
                            <th>Đang mở</th>
                            <th>Hoàn thành</th>
                            <th>Qua hạn*</th>
                            <th>Cần xác minh</th>
                            <th>Hoàn thành / tổng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...departments, { id: '', name: 'Chưa chọn phòng' }].map((d) => {
                            const all = tasks.filter((t) => (t.department || '') === d.id),
                              complete = all.filter((t) => t.status === 'Hoàn thành').length;
                            return (
                              <tr key={d.id}>
                                <td>
                                  <strong>{d.name}</strong>
                                </td>
                                <td>{all.length}</td>
                                <td>
                                  {
                                    all.filter((t) => !['Hoàn thành', 'Đã hủy'].includes(t.status))
                                      .length
                                  }
                                </td>
                                <td>{complete}</td>
                                <td>{all.filter((t) => overdue(t)).length}</td>
                                <td>{all.filter((t) => t.review).length}</td>
                                <td>
                                  {all.length
                                    ? Math.round((complete / all.length) * 100) + '%'
                                    : 'Chưa có dữ liệu'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="panel-footer">
                      * Qua hạn tính từ hạn chót theo múi giờ Việt Nam; dữ liệu chưa xác minh có thể
                      sai năm.
                    </div>
                  </section>
                  <div className="dashboard-grid report-bottom">
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Chất lượng dữ liệu</h2>
                      </div>
                      <div className="quality-list">
                        {[
                          ['Chưa có người phụ trách', tasks.filter((t) => !t.owner).length],
                          ['Chưa có hạn chót', tasks.filter((t) => !t.due).length],
                          [
                            'Trạng thái chưa xác định',
                            tasks.filter((t) => t.status === 'Chưa xác định').length,
                          ],
                          ['Đang chờ xác minh', review.length],
                        ].map(([label, value]) => (
                          <div key={String(label)}>
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Định nghĩa chỉ số</h2>
                      </div>
                      <div className="definitions">
                        <p>
                          <strong>Đang mở:</strong> chưa hoàn thành, chưa hủy và chưa lưu trữ.
                        </p>
                        <p>
                          <strong>Qua hạn:</strong> việc đang mở có hạn chót trước ngày hiện tại.
                        </p>
                        <p>
                          <strong>Hoàn thành / tổng:</strong> số việc hoàn thành chia tổng số việc
                          chưa lưu trữ, bao gồm việc đã hủy; đây là tỷ lệ trạng thái, không phải KPI
                          năng suất.
                        </p>
                        <p>
                          <strong>Cần xác minh:</strong> chưa được người quản lý xác nhận dữ liệu
                          nguồn.
                        </p>
                      </div>
                    </section>
                  </div>
                </>
              )}
              {page === 'history' && (
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Lịch sử thay đổi</h2>
                    <Tag>Không sửa trực tiếp</Tag>
                  </div>
                  {rows.filter((r) => r.kind === 'audit').length ? (
                    <div className="audit-list">
                      {rows
                        .filter((r) => r.kind === 'audit')
                        .map((a) => (
                          <div key={a.id}>
                            <span className="activity-dot" />
                            <div>
                              <strong>
                                {a.action} · {a.title}
                              </strong>
                              <p>
                                {a.author} · {fmtTime(a.updated)}
                                {a.reason && ' · Lý do: ' + a.reason}
                              </p>
                              <details>
                                <summary>Xem nội dung thay đổi</summary>
                                <pre>
                                  {JSON.stringify({ truoc: a.before, sau: a.after }, null, 2)}
                                </pre>
                              </details>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <Empty
                      text="Chưa có thay đổi"
                      sub="Mỗi lần tạo, sửa hoặc lưu trữ sẽ được ghi nhận tại đây."
                    />
                  )}
                </section>
              )}
              {page === 'organizations' && <OrganizationManager />}
              {page === 'shared-tasks' && <SharedTasksPanel />}
              {page === 'settings' && (
                <div className="settings-grid">
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Thông báo & dữ liệu</h2>
                    </div>
                    <div className="settings-body">
                      <label>
                        Nhắc công việc trước hạn (ngày)
                        <input
                          type="number"
                          min="0"
                          max="30"
                          defaultValue={prefs.remindDays}
                          onBlur={(e) => {
                            const n = Math.max(0, Math.min(30, Number(e.target.value)));
                            if (n !== prefs.remindDays) save({ ...prefs, remindDays: n });
                          }}
                        />
                      </label>
                      <p className="help">
                        Cảnh báo trong ứng dụng được tính khi mở và tự cập nhật mỗi 30 giây.
                        Email/push khi đóng ứng dụng chưa được cấu hình.
                      </p>
                      <hr />
                      <h3>Xuất dữ liệu</h3>
                      <p>
                        Tải toàn bộ bản ghi dạng JSON để lưu đối chiếu. Tệp đính kèm cần tải riêng ở
                        mục Tài liệu.
                      </p>
                      <button
                        className="btn secondary"
                        onClick={() =>
                          download(
                            'TEAM360-du-lieu.json',
                            JSON.stringify(
                              {
                                exportedAt: new Date().toISOString(),
                                records: rows,
                              },
                              null,
                              2,
                            ),
                            'application/json',
                          )
                        }
                      >
                        <Download size={16} />
                        Xuất JSON
                      </button>
                      <button className="btn secondary" onClick={() => importRef.current?.click()}>
                        <Upload size={16} />
                        Nhập công việc JSON
                      </button>
                      <hr />
                      <h3>Phạm vi phiên bản hiện tại</h3>
                      <p>
                        Dữ liệu lưu bền vững trên máy chủ, gắn với tài khoản đăng nhập của bạn. Bản
                        này chưa có chia sẻ nhiều tài khoản, quyền theo phòng, chat đa người, nhắc
                        email tự động, AI, công việc định kỳ hoặc phụ thuộc Gantt.
                      </p>
                      <p>
                        Không thay đổi dữ liệu gốc chưa được xác nhận. Dùng chế độ “Cần xác minh” để
                        rà soát trước khi đánh giá.
                      </p>
                    </div>
                  </section>
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Lưu trữ</h2>
                      <Archive size={19} />
                    </div>
                    {rows.filter((r) => r.archived).length ? (
                      <div className="archive-list">
                        {rows
                          .filter((r) => r.archived)
                          .map((r) => (
                            <div key={r.id}>
                              <div>
                                <strong>{r.title || r.name}</strong>
                                <small>
                                  {r.kind === 'task'
                                    ? 'Công việc'
                                    : r.kind === 'person'
                                      ? 'Nhân sự'
                                      : r.kind === 'plan'
                                        ? 'Kế hoạch'
                                        : 'Phòng ban'}
                                </small>
                              </div>
                              <button
                                className="btn secondary compact"
                                disabled={saving}
                                onClick={() => save({ ...r, archived: false })}
                              >
                                Khôi phục
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <Empty
                        text="Chưa có mục lưu trữ"
                        sub="Công việc và danh mục được xóa mềm để có thể khôi phục."
                      />
                    )}
                  </section>
                </div>
              )}
            </>
          )}
          <footer className="main-footer">
            <span>
              TEAM360 <i>·</i> Không gian điều hành công việc
            </span>
            <span>
              <span className="live-dot" />
              {error ? 'Chưa kết nối' : 'Lưu trữ trên máy chủ'} <i>·</i> Giờ Việt Nam
            </span>
          </footer>
        </main>
      </div>
      <input
        ref={importRef}
        type="file"
        accept=".json"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) importFile(e.target.files[0]);
          e.target.value = '';
        }}
      />
      {notifications && (
        <>
          <div className="popover-shade" onClick={() => setNotifications(false)} />
          <section className="notification-panel panel">
            <div className="panel-heading">
              <h2>Thông báo công việc</h2>
              <button
                className="icon-btn"
                onClick={() => setNotifications(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            {alerts.length ? (
              alerts.map((a) => (
                <button
                  className="notification"
                  key={a.task.id}
                  onClick={() => {
                    setNotifications(false);
                    openTask(a.task);
                  }}
                >
                  <span className="notification-icon">
                    <Clock size={19} />
                  </span>
                  <div>
                    <strong>{a.task.title}</strong>
                    <small>{a.text}</small>
                    {a.task.review && <small className="amber-text">Dữ liệu cần xác minh</small>}
                  </div>
                </button>
              ))
            ) : (
              <Empty
                text="Không có cảnh báo hạn"
                sub="Các công việc sắp đến hạn sẽ xuất hiện tại đây."
              />
            )}
          </section>
        </>
      )}
      {edit && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setEdit(null);
          }}
        >
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết công việc"
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">{edit.version ? edit.code : 'TẠO CÔNG VIỆC'}</span>
                <h2>{edit.version ? 'Chi tiết công việc' : 'Công việc mới'}</h2>
              </div>
              <div>
                {edit.version && (
                  <>
                    <button
                      className="icon-btn"
                      title="Sao chép"
                      onClick={() => {
                        setEdit({
                          ...edit,
                          id: crypto.randomUUID(),
                          code: blankTask().code,
                          version: undefined,
                          title: edit.title + ' (bản sao)',
                          completedAt: null,
                          status: 'Chưa bắt đầu',
                          progress: 0,
                        });
                        setTab('detail');
                      }}
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      className="icon-btn danger"
                      title="Lưu trữ"
                      disabled={saving}
                      onClick={() => archive(edit)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button className="icon-btn" onClick={() => setEdit(null)} aria-label="Đóng">
                  <X size={21} />
                </button>
              </div>
            </div>
            <div className="modal-tabs">
              {[
                ['detail', 'Thông tin'],
                ['comments', 'Trao đổi'],
                ['files', 'Tài liệu'],
                ['audit', 'Lịch sử'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={tab === id ? 'active' : ''}
                  disabled={!edit.version && id !== 'detail'}
                  onClick={() => setTab(id)}
                >
                  {label}
                  {id === 'comments' && (
                    <small>
                      {rows.filter((r) => r.kind === 'comment' && r.taskId === edit.id).length}
                    </small>
                  )}
                </button>
              ))}
            </div>
            <div className="modal-body">
              {tab === 'detail' && (
                <>
                  <label className="field full">
                    Tên công việc <span>*</span>
                    <textarea
                      className="title-input"
                      value={edit.title}
                      onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                      placeholder="Cần thực hiện điều gì?"
                      rows={2}
                    />
                  </label>
                  {edit.review && (
                    <div className="notice compact-notice">
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Cần xác minh dữ liệu gốc</strong>
                        <p>{edit.reviewNote || 'Kiểm tra thông tin trước khi sử dụng.'}</p>
                      </div>
                    </div>
                  )}
                  <div className="form-grid">
                    <label className="field">
                      Phòng chủ trì
                      <select
                        value={edit.department}
                        onChange={(e) => setEdit({ ...edit, department: e.target.value })}
                      >
                        <option value="">Chưa chọn</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Người chịu trách nhiệm
                      <select
                        value={edit.owner}
                        onChange={(e) => setEdit({ ...edit, owner: e.target.value })}
                      >
                        <option value="">Chưa phân công</option>
                        {people.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Trạng thái
                      <select
                        value={edit.status}
                        onChange={(e) => setEdit({ ...edit, status: e.target.value })}
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Mức độ ưu tiên
                      <select
                        value={edit.priority}
                        onChange={(e) => setEdit({ ...edit, priority: e.target.value })}
                      >
                        {priorities.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Ngày bắt đầu
                      <input
                        type="date"
                        value={edit.start || ''}
                        onChange={(e) => setEdit({ ...edit, start: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Hạn hoàn thành
                      <input
                        type="date"
                        value={edit.due || ''}
                        onChange={(e) => setEdit({ ...edit, due: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Kế hoạch
                      <select
                        value={edit.plan || ''}
                        onChange={(e) => setEdit({ ...edit, plan: e.target.value })}
                      >
                        <option value="">Không gắn kế hoạch</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Loại công việc
                      <input
                        value={edit.type || ''}
                        onChange={(e) => setEdit({ ...edit, type: e.target.value })}
                        placeholder="Ví dụ: Báo cáo, kế hoạch"
                      />
                    </label>
                  </div>
                  {edit.version && (
                    <label className="field">
                      Lý do thay đổi hạn (bắt buộc nếu đổi hạn)
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Nêu lý do hoặc quyết định gia hạn"
                      />
                    </label>
                  )}
                  <label className="field">
                    Mô tả / Nội dung chỉ đạo
                    <textarea
                      rows={4}
                      value={edit.description || ''}
                      onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                    />
                  </label>
                  <div className="field">
                    <div className="row-between">
                      <span>Tiến độ thực hiện</span>
                      <strong>{edit.progress}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={edit.progress}
                      onChange={(e) => setEdit({ ...edit, progress: Number(e.target.value) })}
                    />
                  </div>
                  <div className="checklist">
                    <div className="row-between">
                      <h3>Danh sách kiểm tra</h3>
                      <button
                        className="text-btn"
                        onClick={() =>
                          setEdit({
                            ...edit,
                            checklist: [
                              ...(edit.checklist || []),
                              {
                                id: crypto.randomUUID(),
                                text: '',
                                done: false,
                              },
                            ],
                          })
                        }
                      >
                        <Plus size={15} />
                        Thêm mục
                      </button>
                    </div>
                    {(edit.checklist || []).map((c: Row, i: number) => (
                      <div key={c.id}>
                        <input
                          type="checkbox"
                          checked={c.done}
                          onChange={(e) =>
                            setEdit({
                              ...edit,
                              checklist: edit.checklist.map((x: Row, n: number) =>
                                n === i ? { ...x, done: e.target.checked } : x,
                              ),
                            })
                          }
                        />
                        <input
                          placeholder="Nội dung cần hoàn tất"
                          value={c.text}
                          onChange={(e) =>
                            setEdit({
                              ...edit,
                              checklist: edit.checklist.map((x: Row, n: number) =>
                                n === i ? { ...x, text: e.target.value } : x,
                              ),
                            })
                          }
                        />
                        <button
                          className="icon-btn"
                          onClick={() =>
                            setEdit({
                              ...edit,
                              checklist: edit.checklist.filter((_: any, n: number) => n !== i),
                            })
                          }
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="field">
                    Kết quả / Bằng chứng hoàn thành
                    <textarea
                      value={edit.result || ''}
                      rows={3}
                      onChange={(e) => setEdit({ ...edit, result: e.target.value })}
                      placeholder="Bắt buộc khi trình duyệt hoặc hoàn thành"
                    />
                  </label>
                  {edit.status === 'Đã hủy' && (
                    <label className="field">
                      Lý do hủy
                      <textarea
                        value={edit.cancelReason || ''}
                        onChange={(e) => setEdit({ ...edit, cancelReason: e.target.value })}
                      />
                    </label>
                  )}
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!edit.review}
                      onChange={(e) => setEdit({ ...edit, review: !e.target.checked })}
                    />
                    Thông tin công việc đã được kiểm tra và xác nhận
                  </label>
                  {edit.source && (
                    <p className="source-note">
                      <FileText size={14} />
                      Nguồn: {edit.source}
                    </p>
                  )}
                </>
              )}
              {tab === 'comments' && (
                <>
                  <div className="comments">
                    {rows
                      .filter((r) => r.kind === 'comment' && r.taskId === edit.id)
                      .reverse()
                      .map((c) => (
                        <div className="message" key={c.id}>
                          <span className="avatar">{initials(c.author)}</span>
                          <div>
                            <strong>
                              {c.author}
                              <small>{fmtTime(c.updated)}</small>
                            </strong>
                            <p>{c.text}</p>
                          </div>
                        </div>
                      ))}
                    {!rows.some((r) => r.kind === 'comment' && r.taskId === edit.id) && (
                      <Empty
                        text="Chưa có trao đổi"
                        sub="Ghi chú tiến độ hoặc thông tin cần phối hợp tại đây."
                      />
                    )}
                  </div>
                  <form
                    className="composer"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        await save({
                          id: crypto.randomUUID(),
                          kind: 'comment',
                          taskId: edit.id,
                          text: note,
                        })
                      )
                        setNote('');
                    }}
                  >
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Viết bình luận..."
                    />
                    <button className="btn primary" disabled={saving || !note.trim()}>
                      <Send size={16} />
                      Gửi
                    </button>
                  </form>
                </>
              )}
              {tab === 'files' && (
                <>
                  <label className="upload-zone">
                    <Upload size={25} />
                    <strong>Chọn tệp để đính kèm</strong>
                    <span>Tối đa 10 MB · PDF, Word, Excel, văn bản, hình ảnh</span>
                    <input
                      type="file"
                      hidden
                      disabled={saving}
                      accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => {
                        if (e.target.files?.[0]) upload(e.target.files[0], edit.id);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <FileList list={rows.filter((r) => r.kind === 'file' && r.taskId === edit.id)} />
                </>
              )}
              {tab === 'audit' && (
                <div className="audit-list">
                  {rows
                    .filter((r) => r.kind === 'audit' && r.entityId === edit.id)
                    .map((a) => (
                      <div key={a.id}>
                        <span className="activity-dot" />
                        <div>
                          <strong>
                            {a.action} bởi {a.author}
                          </strong>
                          <p>
                            {fmtTime(a.updated)} {a.reason && '· ' + a.reason}
                          </p>
                          <details>
                            <summary>Xem chi tiết</summary>
                            <pre>{JSON.stringify({ truoc: a.before, sau: a.after }, null, 2)}</pre>
                          </details>
                        </div>
                      </div>
                    ))}
                  {!rows.some((r) => r.kind === 'audit' && r.entityId === edit.id) && (
                    <Empty text="Chưa có thay đổi sau khi nhập" />
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <span>
                {edit.version ? 'Phiên bản ' + edit.version : 'Lưu vào không gian riêng tư'}
              </span>
              <div>
                <button className="btn secondary" onClick={() => setEdit(null)}>
                  Đóng
                </button>
                {tab === 'detail' && (
                  <button className="btn primary" disabled={saving} onClick={submitTask}>
                    {saving ? <RefreshCw size={16} className="spin" /> : <Check size={17} />}
                    Lưu công việc
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
      {catalog && (
        <div className="modal-backdrop">
          <section
            className="catalog-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Sửa danh mục"
          >
            <div className="modal-heading">
              <h2>
                {catalog.version ? 'Chỉnh sửa' : 'Thêm'}{' '}
                {catalog.kind === 'person'
                  ? 'nhân sự'
                  : catalog.kind === 'plan'
                    ? 'kế hoạch'
                    : 'phòng ban'}
              </h2>
              <button className="icon-btn" onClick={() => setCatalog(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <label className="field">
                Tên <span>*</span>
                <input
                  value={catalog.name}
                  onChange={(e) => setCatalog({ ...catalog, name: e.target.value })}
                />
              </label>
              {catalog.kind === 'department' ? (
                <>
                  <label className="field">
                    Tên đầy đủ
                    <input
                      value={catalog.fullName || ''}
                      onChange={(e) => setCatalog({ ...catalog, fullName: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    Màu đại diện
                    <input
                      type="color"
                      value={catalog.color || '#16846b'}
                      onChange={(e) => setCatalog({ ...catalog, color: e.target.value })}
                    />
                  </label>
                </>
              ) : (
                <label className="field">
                  Phòng ban
                  <select
                    value={catalog.department || ''}
                    onChange={(e) => setCatalog({ ...catalog, department: e.target.value })}
                  >
                    <option value="">Chưa xác định</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {catalog.kind === 'person' && (
                <>
                  <label className="field">
                    Chức danh
                    <input
                      value={catalog.position || ''}
                      onChange={(e) => setCatalog({ ...catalog, position: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    Email liên hệ
                    <input
                      type="email"
                      value={catalog.email || ''}
                      onChange={(e) => setCatalog({ ...catalog, email: e.target.value })}
                    />
                  </label>
                  <p className="help">Lưu email không gửi lời mời và không cấp quyền truy cập.</p>
                </>
              )}
              {catalog.kind === 'plan' && (
                <>
                  <label className="field">
                    Mô tả
                    <textarea
                      rows={4}
                      value={catalog.description || ''}
                      onChange={(e) => setCatalog({ ...catalog, description: e.target.value })}
                    />
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!catalog.review}
                      onChange={(e) => setCatalog({ ...catalog, review: !e.target.checked })}
                    />
                    Đã xác nhận kế hoạch và năm áp dụng
                  </label>
                </>
              )}
            </div>
            <div className="modal-footer">
              {catalog.version ? (
                <button
                  className="btn danger-btn"
                  disabled={saving}
                  onClick={() => archive(catalog)}
                >
                  <Trash2 size={16} />
                  Lưu trữ
                </button>
              ) : (
                <span />
              )}
              <button
                className="btn primary"
                disabled={saving || !catalog.name.trim()}
                onClick={async () => {
                  if (await save(catalog)) setCatalog(null);
                }}
              >
                <Check size={17} />
                Lưu thay đổi
              </button>
            </div>
          </section>
        </div>
      )}
      {importRows && (
        <div className="modal-backdrop">
          <section className="catalog-modal">
            <div className="modal-heading">
              <h2>Xem trước dữ liệu nhập</h2>
              <button className="icon-btn" onClick={() => setImportRows(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                {importRows.length} công việc trong file. ID đã có sẽ được bỏ qua để tránh trùng.
              </p>
              <p>
                Phòng ban và người phụ trách phải đã tồn tại trong không gian này. Nhập JSON công
                việc không khôi phục tệp đính kèm.
              </p>
              {importRows.map((t) => (
                <div className="import-row" key={t.id}>
                  <span>{t.title}</span>
                  <Tag color={rows.some((r) => r.id === t.id) ? 'gray' : 'green'}>
                    {rows.some((r) => r.id === t.id) ? 'Bỏ qua' : 'Tạo mới'}
                  </Tag>
                </div>
              ))}
              {importError && <p className="red-text">{importError}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setImportRows(null)}>
                Hủy
              </button>
              <button className="btn primary" disabled={saving} onClick={doImport}>
                Xác nhận nhập
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
          <button onClick={() => setToast('')} aria-label="Đóng thông báo">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
