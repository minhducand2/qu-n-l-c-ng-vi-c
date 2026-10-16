'use client';
import { useCallback, useEffect, useState } from 'react';

type Workspace = { id: string; name: string; role: string };
type Person = {
  userId: string;
  role: string;
  status: string;
  displayName: string | null;
  departmentName: string | null;
  accountClaimedAt: string | null;
};
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    credentials: 'same-origin',
    ...init,
  });
  const body: unknown = await response.json();
  if (!response.ok) throw Error((body as { error?: string }).error || `Lỗi API ${response.status}`);
  return body as T;
}
export default function DirectoryPage() {
  const [spaces, setSpaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState('');
  const [departments, setDepartments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const workspace = spaces.find((w) => w.id === workspaceId);
  const load = useCallback(async (id: string) => {
    const data = await request<{ members: Person[] }>(
      `/api/workspaces/${encodeURIComponent(id)}/directory`,
    );
    setPeople(data.members || []);
    setDepartments(
      Object.fromEntries((data.members || []).map((p) => [p.userId, p.departmentName || ''])),
    );
  }, []);
  useEffect(() => {
    let active = true;
    void request<{ workspaces: Workspace[] }>('/api/workspaces')
      .then((d) => {
        if (!active) return;
        const list = d.workspaces || [];
        setSpaces(list);
        setWorkspaceId(list[0]?.id || '');
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Không tải được tổ chức.');
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!workspaceId) {
      setPeople([]);
      return;
    }
    void load(workspaceId).catch((e) =>
      setError(e instanceof Error ? e.message : 'Không tải được danh bạ.'),
    );
  }, [workspaceId, load]);
  const submit = async (kind: 'claim' | 'department', userId?: string) => {
    if (!workspaceId || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data =
        kind === 'claim'
          ? { displayName: name }
          : { userId, departmentName: departments[userId || ''] || '' };
      await request(`/api/workspaces/${encodeURIComponent(workspaceId)}/directory`, {
        method: kind === 'claim' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await load(workspaceId);
      setNotice(
        kind === 'claim'
          ? 'Đã xác nhận tên hiển thị của tài khoản đang đăng nhập.'
          : 'Đã cập nhật nhãn phòng ban.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không lưu được dữ liệu.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '36px auto',
        padding: 20,
        fontFamily: 'system-ui, sans-serif',
        color: '#1e293b',
      }}
    >
      <p>
        <a href="/" style={{ color: '#087e74' }}>
          ← Trở lại TEAM360
        </a>
      </p>
      <h1>Danh bạ nhân sự theo tổ chức</h1>
      <p style={{ color: '#64748b' }}>
        Mỗi người tự xác nhận tên hiển thị bằng tài khoản đang đăng nhập. Admin chỉ gán nhãn phòng
        ban; chưa liên kết dữ liệu nhân sự từ Excel.
      </p>
      <label>
        Chọn tổ chức{' '}
        <select
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
          style={{ padding: 10, minWidth: 240 }}
        >
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.role}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" style={{ color: '#b91c1c' }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ color: '#047857' }}>
          {notice}
        </p>
      )}
      <section
        style={{
          padding: 20,
          marginTop: 20,
          border: '1px solid #dbe4eb',
          borderRadius: 12,
          background: '#fff',
        }}
      >
        <h2>Tự xác nhận tên hiển thị</h2>
        <p style={{ color: '#64748b' }}>
          Thao tác này chỉ cập nhật hồ sơ của chính tài khoản đang đăng nhập, không cấp quyền mới.
        </p>
        <input
          aria-label="Tên hiển thị của tôi"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên hiển thị"
          style={{ padding: 10, minWidth: 250 }}
        />{' '}
        <button
          disabled={busy || !workspaceId || !name.trim()}
          onClick={() => void submit('claim')}
          style={{
            padding: 11,
            background: '#078675',
            color: '#fff',
            border: 0,
            borderRadius: 6,
          }}
        >
          Xác nhận hồ sơ của tôi
        </button>
      </section>
      <section
        style={{
          padding: 20,
          marginTop: 20,
          border: '1px solid #dbe4eb',
          borderRadius: 12,
          background: '#fff',
        }}
      >
        <h2>Thành viên đang hoạt động ({people.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Tên hiển thị</th>
                <th>Vai trò</th>
                <th>Phòng ban (nhãn)</th>
                <th>Xác nhận</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.userId} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 10 }}>{p.userId}</td>
                  <td style={{ padding: 10 }}>{p.displayName || 'Chưa tự xác nhận'}</td>
                  <td style={{ padding: 10 }}>{p.role}</td>
                  <td style={{ padding: 10 }}>
                    {workspace?.role === 'admin' && p.accountClaimedAt ? (
                      <>
                        <input
                          aria-label={`Phòng ban của ${p.userId}`}
                          value={departments[p.userId] || ''}
                          maxLength={120}
                          onChange={(e) =>
                            setDepartments((d) => ({
                              ...d,
                              [p.userId]: e.target.value,
                            }))
                          }
                          style={{ padding: 7, maxWidth: 160 }}
                        />{' '}
                        <button disabled={busy} onClick={() => void submit('department', p.userId)}>
                          Lưu
                        </button>
                      </>
                    ) : (
                      p.departmentName || '—'
                    )}
                  </td>
                  <td style={{ padding: 10 }}>
                    {p.accountClaimedAt ? 'Đã tự xác nhận' : 'Chưa xác nhận'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
