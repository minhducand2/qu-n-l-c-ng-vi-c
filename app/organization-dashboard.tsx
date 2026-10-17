'use client';

import { useEffect, useState } from 'react';
import OrganizationCommandCenter from './organization-command-center';
import OrganizationReport from './organization-report';
import OrganizationAlertCenter from './organization-alert-center';
import OrganizationAnalytics from './organization-analytics';

type Space = {
  id: string;
  name: string;
  role: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  due?: string;
  progress?: number;
  assignedTo?: string | null;
};

type Result<T> = { data: T; workspaceId: string };

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${response.status}`;
    throw Error(message);
  }
  return body as T;
}

const completed = '\u0048o\u00e0n th\u00e0nh';
const cancelled = '\u0110\u00e3 h\u1ee7y';
const waiting = 'Ch\u1edd duy\u1ec7t';
const running = '\u0110ang th\u1ef1c hi\u1ec7n';

function todayVN() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(day: string, amount: number) {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export default function OrganizationDashboard() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selected, setSelected] = useState('');
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [spacesError, setSpacesError] = useState('');
  const [result, setResult] = useState<Result<Task[]> | null>(null);
  const [taskError, setTaskError] = useState<{
    workspaceId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void fetchData<{ workspaces: Space[] }>('/api/workspaces')
      .then((body) => {
        if (!active) return;
        const list = body.workspaces || [];
        setSpaces(list);
        setSelected(list[0]?.id || '');
      })
      .catch((error: unknown) => {
        if (active) setSpacesError(
          error instanceof Error ? error.message : String(error)
        );
      })
      .finally(() => {
        if (active) setSpacesLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    const workspaceId = selected;
    void fetchData<{ tasks: Task[] }>(
      '/api/shared-tasks?workspaceId=' + encodeURIComponent(workspaceId)
    )
      .then((body) => {
        if (!active) return;
        setResult({
          workspaceId,
          data: Array.isArray(body.tasks) ? body.tasks : [],
        });
        setTaskError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setTaskError({
          workspaceId,
          message: error instanceof Error ? error.message : String(error),
        });
      });
    return () => { active = false; };
  }, [selected]);

  // Never display tasks belonging to a previously selected organization.
  const ready = !!selected &&
    result?.workspaceId === selected &&
    taskError?.workspaceId !== selected;

  const tasks = ready ? result.data : [];
  const today = todayVN();
  const soonDate = addDays(today, 3);
  const active = tasks.filter(
    (t) => t.status !== completed && t.status !== cancelled
  );
  const done = tasks.filter((t) => t.status === completed);
  const late = active.filter((t) => t.due && t.due < today);
  const soon = active.filter(
    (t) => t.due && t.due >= today && t.due <= soonDate
  );
  const pending = active.filter((t) => t.status === waiting);

  const stats = [
    ['T\u1ed5ng c\u00f4ng vi\u1ec7c', tasks.length],
    ['\u0110ang th\u1ef1c hi\u1ec7n',
      tasks.filter((t) => t.status === running).length],
    ['Ho\u00e0n th\u00e0nh', done.length],
    ['Qu\u00e1 h\u1ea1n', late.length],
    ['S\u1eafp h\u1ea1n', soon.length],
    ['Ch\u1edd duy\u1ec7t', pending.length],
  ] as const;

  const important = active
    .map((task) => ({
      task,
      rank: task.due && task.due < today
        ? 0
        : task.status === waiting
          ? 1
          : task.due && task.due >= today && task.due <= soonDate
            ? 2
            : 3,
    }))
    .filter((item) => item.rank < 3)
    .sort((a, b) =>
      a.rank - b.rank ||
      (a.task.due || '9999-12-31').localeCompare(
        b.task.due || '9999-12-31'
      )
    )
    .slice(0, 5);

  const detailUrl = (id: string) =>
    '/?view=shared-tasks&workspaceId=' +
    encodeURIComponent(selected) +
    '&taskId=' + encodeURIComponent(id);

  return (
    <section className="panel" style={{
      padding: 20, marginBottom: 20, minWidth: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        flexWrap: 'wrap',
        marginBottom: 18,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            {'\u0110i\u1ec1u h\u00e0nh t\u1ed5 ch\u1ee9c'}
          </h2>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            {'D\u1eef li\u1ec7u c\u00f4ng vi\u1ec7c chung theo quy\u1ec1n truy c\u1eadp'}
          </p>
        </div>
        <select
          aria-label="Chon to chuc"
          value={selected}
          disabled={spacesLoading || spaces.length === 0}
          onChange={(e) => setSelected(e.target.value)}
          style={{ minWidth: 200, maxWidth: '100%' }}
        >
          {spaces.length === 0 && (
            <option value="">
              {'Ch\u01b0a c\u00f3 t\u1ed5 ch\u1ee9c'}
            </option>
          )}
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name} ({space.role})
            </option>
          ))}
        </select>
      </div>

      {spacesError && <p role="alert">{spacesError}</p>}
      {taskError?.workspaceId === selected && (
        <p role="alert" style={{ color: '#b91c1c' }}>
          {taskError.message}
        </p>
      )}

      {spacesLoading || (selected && !ready &&
        taskError?.workspaceId !== selected) ? (
        <p className="muted">{'\u0110ang t\u1ea3i d\u1eef li\u1ec7u...'}</p>
      ) : !selected || !ready ? (
        <p className="muted">
          {'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u t\u1ed5 ch\u1ee9c \u0111\u1ec3 hi\u1ec3n th\u1ecb.'}
        </p>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
            gap: 12,
            marginBottom: 20,
          }}>
            {stats.map(([label, value]) => (
              <div key={label} style={{
                minWidth: 0,
                minHeight: 88,
                padding: 14,
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 8,
              }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  {label}
                </span>
                <strong style={{ fontSize: 26 }}>{value}</strong>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 9,
            }}>
              <strong>{'T\u1ef7 l\u1ec7 ho\u00e0n th\u00e0nh'}</strong>
              <strong>
                {tasks.length
                  ? Math.round(done.length / tasks.length * 100)
                  : 0}%
              </strong>
            </div>
            <div style={{
              height: 11,
              borderRadius: 99,
              background: '#e2e8f0',
              overflow: 'hidden',
            }}>
              <div style={{
                width: (tasks.length
                  ? done.length / tasks.length * 100
                  : 0) + '%',
                height: '100%',
                background: '#0d9488',
              }} />
            </div>
          </div>

          <OrganizationCommandCenter
            key={selected}
            workspaceId={selected}
            tasks={tasks}
          />
          <OrganizationAlertCenter
            key={selected}
            workspaceId={selected}
            tasks={tasks}
          />
          <OrganizationReport
            key={selected}
            workspaceId={selected}
            tasks={tasks}
          />
          <OrganizationAnalytics key={selected} workspaceId={selected} tasks={tasks} />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 12,
          }}>
            <strong>{'C\u00f4ng vi\u1ec7c c\u1ea7n quan t\u00e2m'}</strong>
            <a
              href={'/?view=shared-tasks&workspaceId=' +
                encodeURIComponent(selected)}
              style={{ color: '#0f766e', fontSize: 13 }}
            >
              {'Xem c\u00f4ng vi\u1ec7c chung'}
            </a>
          </div>

          {important.length === 0 ? (
            <p className="muted">
              {'Ch\u01b0a c\u00f3 c\u00f4ng vi\u1ec7c c\u1ea7n can thi\u1ec7p.'}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {important.map(({ task, rank }) => (
                <a
                  key={task.id}
                  href={detailUrl(task.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{
                    fontWeight: 600,
                    overflowWrap: 'anywhere',
                  }}>
                    {task.title}
                  </span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: rank === 0 ? '#b91c1c' :
                      rank === 1 ? '#1d4ed8' : '#92400e',
                  }}>
                    {rank === 0 ? 'Qu\u00e1 h\u1ea1n' :
                      rank === 1 ? 'Ch\u1edd duy\u1ec7t' :
                        'S\u1eafp h\u1ea1n'}
                  </span>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
