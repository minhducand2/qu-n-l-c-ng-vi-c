'use client';

import { useEffect, useState } from 'react';

type Task = {
  id: string;
  title?: string;
  status: string;
  due?: string;
  assignedTo?: string | null;
};

type Person = {
  userId: string;
  displayName: string | null;
  departmentName: string | null;
};

type Summary = {
  name: string;
  total: number;
  completed: number;
  overdue: number;
  active: number;
};

const done = 'Ho\u00e0n th\u00e0nh';
const cancelled = '\u0110\u00e3 h\u1ee7y';

function todayVN() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function add(summary: Summary, task: Task, today: string) {
  summary.total += 1;
  if (task.status === done) summary.completed += 1;
  if (task.status !== done && task.status !== cancelled) {
    summary.active += 1;
    if (task.due && task.due < today) summary.overdue += 1;
  }
}

function makeSummary(name: string): Summary {
  return { name, total: 0, completed: 0, overdue: 0, active: 0 };
}

export default function OrganizationAnalytics({
  workspaceId,
  tasks,
}: {
  workspaceId: string;
  tasks: Task[];
}) {
  const [directory, setDirectory] = useState<{
    workspaceId: string;
    members: Person[];
  } | null>(null);
  const [error, setError] = useState('');
  const [department, setDepartment] = useState('');
  const [personFilter, setPersonFilter] = useState('');

  useEffect(() => {
    let live = true;
    const id = workspaceId;

    void fetch(
      '/api/workspaces/' + encodeURIComponent(id) + '/directory',
      { credentials: 'same-origin', cache: 'no-store' },
    ).then(async (response) => {
      if (!response.ok) throw Error('Directory HTTP ' + response.status);
      return response.json() as Promise<{ members: Person[] }>;
    }).then((body) => {
      if (live) setDirectory({
        workspaceId: id,
        members: Array.isArray(body.members) ? body.members : [],
      });
    }).catch((e: unknown) => {
      if (live) setError(e instanceof Error ? e.message : String(e));
    });

    return () => { live = false; };
  }, [workspaceId]);

  if (directory?.workspaceId !== workspaceId) {
    return <p className="muted">Loading staff analytics...</p>;
  }

  if (error) return <p role="alert">{error}</p>;

  const members = directory.members;
  const byId = new Map(members.map((m) => [m.userId, m]));
  const today = todayVN();
  const departments = new Map<string, Summary>();
  const people = new Map<string, Summary>();
  const unassigned = makeSummary('Unassigned');

  for (const member of members) {
    const name = member.displayName?.trim() || member.userId;
    people.set(member.userId, makeSummary(name));
  }

  for (const task of tasks) {
    if (!task.assignedTo) {
      add(unassigned, task, today);
      continue;
    }

    const member = byId.get(task.assignedTo);
    const dept = member?.departmentName?.trim() ||
      'Ch\u01b0a x\u00e1c \u0111\u1ecbnh ph\u00f2ng ban';

    if (!departments.has(dept)) {
      departments.set(dept, makeSummary(dept));
    }

    add(departments.get(dept)!, task, today);

    if (!people.has(task.assignedTo)) {
      people.set(task.assignedTo, makeSummary(task.assignedTo));
    }

    add(people.get(task.assignedTo)!, task, today);
  }

  const departmentRows = [...departments.values()]
    .sort((a, b) => b.overdue - a.overdue || b.total - a.total);
  const selectedTasks = tasks.filter((task) => {
    if (!department) return true;
    if (!task.assignedTo) return false;
    const member = byId.get(task.assignedTo);
    return (member?.departmentName?.trim() ||
      'Ch\u01b0a x\u00e1c \u0111\u1ecbnh ph\u00f2ng ban') === department;
  });
  const selectedPeople = new Map<string, Summary>();

  for (const task of selectedTasks) {
    if (!task.assignedTo) continue;
    const member = byId.get(task.assignedTo);
    const name = member?.displayName?.trim() || task.assignedTo;

    if (!selectedPeople.has(task.assignedTo)) {
      selectedPeople.set(task.assignedTo, makeSummary(name));
    }
    add(selectedPeople.get(task.assignedTo)!, task, today);
  }

  const personRows = [...selectedPeople.entries()].map(([id, summary]) => ({ ...summary, id }))
    .sort((a, b) => b.overdue - a.overdue || b.total - a.total);

  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = {
    padding: '10px 12px',
    borderTop: '1px solid #e2e8f0',
  };

  return (
    <div style={{
      borderTop: '1px solid #e2e8f0',
      paddingTop: 20,
      marginTop: 20,
      marginBottom: 22,
    }}>
      <h3 style={{ margin: '0 0 8px' }}>
        {'Hi\u1ec7u su\u1ea5t ph\u00f2ng ban & nh\u00e2n s\u1ef1'}
      </h3>
      <p className="muted" style={{ fontSize: 12 }}>
        {'Th\u1ed1ng k\u00ea theo ng\u01b0\u1eddi nh\u1eadn ch\u00ednh, ch\u1ec9 g\u1ed3m c\u00f4ng vi\u1ec7c c\u00f3 quy\u1ec1n xem.'}
      </p>

      <label style={{ display: 'grid', gap: 6, maxWidth: 320, marginBottom: 16 }}>
        {'L\u1ecdc ph\u00f2ng ban'}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">{'T\u1ea5t c\u1ea3 ph\u00f2ng ban'}</option>
          {departmentRows.map((item) => (
            <option key={item.name} value={item.name}>{item.name}</option>
          ))}
        </select>
      </label>


      {/* TEAM360_ORG_V3 */}
      <div style={{
        display: 'grid',
        gap: 12,
        margin: '18px 0 24px',
      }}>
        <strong>{'Bi\u1ec3u \u0111\u1ed3 kh\u1ed1i l\u01b0\u1ee3ng ph\u00f2ng ban'}</strong>
        {departmentRows
          .filter((item) => !department || item.name === department)
          .map((item) => (
            <div key={item.name} style={{ display: 'grid', gap: 6 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                fontSize: 13,
              }}>
                <strong>{item.name}</strong>
                <span className="muted">
                  {item.total} {'vi\u1ec7c'} 
                  {item.completed} {'ho\u00e0n th\u00e0nh'} 
                  {item.overdue} {'qu\u00e1 h\u1ea1n'}
                </span>
              </div>
              <div style={{
                height: 12,
                background: '#e2e8f0',
                borderRadius: 99,
                overflow: 'hidden',
                display: 'flex',
              }}>
                <div style={{
                  width: (item.total
                    ? item.completed / item.total * 100 : 0) + '%',
                  background: '#0d9488',
                }} />
                <div style={{
                  width: (item.total
                    ? item.overdue / item.total * 100 : 0) + '%',
                  background: '#ef4444',
                }} />
              </div>
            </div>
          ))}
      </div>
      <h4>{'Th\u1ed1ng k\u00ea ph\u00f2ng ban'}</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Ph\u00f2ng ban', 'T\u1ed5ng', 'Ho\u00e0n th\u00e0nh', 'Qu\u00e1 h\u1ea1n', '\u0110ang m\u1edf'].map((x) => (
                <th style={th} key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departmentRows
              .filter((item) => !department || item.name === department)
              .map((item) => (
                <tr key={item.name}>
                  <td style={td}>{item.name}</td>
                  <td style={td}>{item.total}</td>
                  <td style={td}>{item.completed}</td>
                  <td style={td}>{item.overdue}</td>
                  <td style={td}>{item.active}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h4 style={{ marginTop: 22 }}>{'Kh\u1ed1i l\u01b0\u1ee3ng nh\u00e2n s\u1ef1'}</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nh\u00e2n s\u1ef1', 'T\u1ed5ng', 'Ho\u00e0n th\u00e0nh', 'Qu\u00e1 h\u1ea1n', '\u0110ang m\u1edf'].map((x) => (
                <th style={th} key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {personRows.map((item) => (
              <tr key={item.name}>
                <td style={td}>{item.name}</td>
                <td style={td}>{item.total}</td>
                <td style={td}>{item.completed}</td>
                <td style={td}>{item.overdue}</td>
                <td style={td}>{item.active}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      <div style={{
        marginTop: 22,
        padding: 16,
        border: '1px solid #e2e8f0',
        borderRadius: 12,
      }}>
        <h4 style={{ marginTop: 0 }}>
          {'\u0110i\u1ec3m ngh\u1ebdn & tra c\u1ee9u nh\u00e2n s\u1ef1'}
        </h4>
        <p className="muted" style={{ fontSize: 12 }}>
          {'\u01afu ti\u00ean ng\u01b0\u1eddi c\u00f3 vi\u1ec7c qu\u00e1 h\u1ea1n; s\u1ed1 li\u1ec7u kh\u00f4ng ph\u1ea3i \u0111\u00e1nh gi\u00e1 n\u0103ng l\u1ef1c.'}
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {personRows
            .filter((item) => item.overdue > 0 || item.active >= 5)
            .slice(0, 5)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPersonFilter(item.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  textAlign: 'left',
                  padding: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 9,
                  background: personFilter === item.id
                    ? '#ecfdf5' : 'white',
                  cursor: 'pointer',
                }}
              >
                <strong>{item.name}</strong>
                <span>
                  {item.active} {'\u0111ang m\u1edf'} 
                  {item.overdue} {'qu\u00e1 h\u1ea1n'}
                </span>
              </button>
            ))}
        </div>

        <label style={{
          display: 'grid',
          gap: 6,
          marginTop: 16,
          maxWidth: 360,
        }}>
          {'Xem c\u00f4ng vi\u1ec7c c\u1ee7a nh\u00e2n s\u1ef1'}
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
          >
            <option value="">{'Ch\u1ecdn nh\u00e2n s\u1ef1'}</option>
            {personRows.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        {personFilter && (
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            {selectedTasks
              .filter((task) => task.assignedTo === personFilter)
              .map((task) => (
                <a
                  key={task.id}
                  href={
                    '/?view=shared-tasks&workspaceId=' +
                    encodeURIComponent(workspaceId) +
                    '&taskId=' + encodeURIComponent(task.id)
                  }
                  style={{
                    padding: 12,
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{task.title || task.id}</span>
                  <span className="muted">
                    {task.status}  {task.due || '--'}
                  </span>
                </a>
              ))}
          </div>
        )}
      </div>
      <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
        {'C\u00f4ng vi\u1ec7c ch\u01b0a ph\u00e2n c\u00f4ng: '}{unassigned.total}
      </p>
    </div>
  );
}
