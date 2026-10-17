'use client';

import { useState } from 'react';
import {
  getSharedTaskAlerts,
  type SharedTaskAlert,
} from '../lib/shared-task-workflow';
import { localDay } from '../lib/domain';

type Task = {
  id: string;
  title: string;
  status: string;
  due?: string;
  assignedTo?: string | null;
  progress?: number;
};

const filters: Array<{
  key: SharedTaskAlert;
  label: string;
  background: string;
  color: string;
}> = [
  {
    key: 'overdue',
    label: 'Qu\u00e1 h\u1ea1n',
    background: '#fee2e2',
    color: '#b91c1c',
  },
  {
    key: 'soon',
    label: 'S\u1eafp h\u1ea1n',
    background: '#fef3c7',
    color: '#92400e',
  },
  {
    key: 'pending',
    label: 'Ch\u1edd duy\u1ec7t',
    background: '#dbeafe',
    color: '#1d4ed8',
  },
  {
    key: 'missing-owner',
    label: 'Thi\u1ebfu ng\u01b0\u1eddi nh\u1eadn',
    background: '#f1f5f9',
    color: '#475569',
  },
  {
    key: 'missing-due',
    label: 'Thi\u1ebfu h\u1ea1n ch\u00f3t',
    background: '#f1f5f9',
    color: '#475569',
  },
];


// TEAM360_REMINDER_V42
function reminderText(
  task: Task,
  alerts: SharedTaskAlert[],
  channel: 'zalo' | 'email',
): string {
  const reasons: Record<SharedTaskAlert, string> = {
    overdue: 'C\u00f4ng vi\u1ec7c \u0111\u00e3 qu\u00e1 h\u1ea1n.',
    soon: 'C\u00f4ng vi\u1ec7c s\u1eafp \u0111\u1ebfn h\u1ea1n.',
    pending: 'C\u00f4ng vi\u1ec7c \u0111ang ch\u1edd ph\u00ea duy\u1ec7t.',
    'missing-owner': 'C\u00f4ng vi\u1ec7c ch\u01b0a c\u00f3 ng\u01b0\u1eddi nh\u1eadn.',
    'missing-due': 'C\u00f4ng vi\u1ec7c ch\u01b0a c\u00f3 h\u1ea1n ch\u00f3t.',
  };

  const title = task.title.trim() || task.id;
  const issues = alerts.map((alert) => '- ' + reasons[alert]).join('\n');
  const due = task.due
    ? '\nH\u1ea1n ch\u00f3t: ' + task.due.split('-').reverse().join('/')
    : '';
  const progress = '\nTi\u1ebfn \u0111\u1ed9: ' +
    (task.progress ?? 0) + '%';

  const request = alerts.includes('missing-owner') ||
    alerts.includes('missing-due')
      ? 'Vui l\u00f2ng b\u1ed5 sung th\u00f4ng tin c\u00f2n thi\u1ebfu v\u00e0 c\u1eadp nh\u1eadt t\u00ecnh tr\u1ea1ng x\u1eed l\u00fd.'
      : alerts.includes('pending')
        ? 'Vui l\u00f2ng ki\u1ec3m tra k\u1ebft qu\u1ea3 v\u00e0 th\u1ef1c hi\u1ec7n b\u01b0\u1edbc ph\u00ea duy\u1ec7t theo th\u1ea9m quy\u1ec1n.'
        : 'Vui l\u00f2ng ki\u1ec3m tra, c\u1eadp nh\u1eadt ti\u1ebfn \u0111\u1ed9 v\u00e0 th\u00f4ng tin th\u1eddi gian x\u1eed l\u00fd d\u1ef1 ki\u1ebfn.';

  if (channel === 'email') {
    return [
      'Ti\u00eau \u0111\u1ec1: Nh\u1eafc x\u1eed l\u00fd c\u00f4ng vi\u1ec7c - ' + title,
      '',
      'K\u00ednh g\u1eedi Anh/Ch\u1ecb,',
      '',
      'Hi\u1ec7n c\u00f4ng vi\u1ec7c "' + title +
        '" c\u00f3 nh\u1eefng n\u1ed9i dung c\u1ea7n l\u01b0u \u00fd:',
      issues,
      due.trim(),
      progress.trim(),
      '',
      request,
      '',
      'Tr\u00e2n tr\u1ecdng.',
    ].filter((line) => line !== '').join('\n');
  }

  return [
    'Anh/Ch\u1ecb vui l\u00f2ng l\u01b0u \u00fd c\u00f4ng vi\u1ec7c:',
    title,
    issues,
    due.trim(),
    progress.trim(),
    request,
    'C\u1ea3m \u01a1n Anh/Ch\u1ecb!',
  ].filter((line) => line !== '').join('\n');
}

export default function OrganizationAlertCenter({
  workspaceId,
  tasks,
}: {
  workspaceId: string;
  tasks: Task[];
}) {
  const [filter, setFilter] = useState<SharedTaskAlert | 'all'>('all');

  const [copyNotice, setCopyNotice] = useState('');

  async function copyReminder(
    task: Task,
    alerts: SharedTaskAlert[],
    channel: 'zalo' | 'email',
  ) {
    if (alerts.length === 0) return;

    try {
      await navigator.clipboard.writeText(
        reminderText(task, alerts, channel)
      );
      setCopyNotice(
        channel === 'zalo'
          ? '\u0110\u00e3 sao ch\u00e9p n\u1ed9i dung Zalo.'
          : '\u0110\u00e3 sao ch\u00e9p n\u1ed9i dung email.'
      );
    } catch {
      setCopyNotice(
        'Kh\u00f4ng th\u1ec3 sao ch\u00e9p. Vui l\u00f2ng ki\u1ec3m tra quy\u1ec1n clipboard.'
      );
    }
  }

  const today = localDay();

  const records = tasks.map((task) => ({
    task,
    alerts: getSharedTaskAlerts(task, today),
  }));

  const counts = Object.fromEntries(
    filters.map(({ key }) => [
      key,
      records.filter((item) => item.alerts.includes(key)).length,
    ]),
  );

  const visible = records
    .filter(
      (item) =>
        item.alerts.length > 0 &&
        (filter === 'all' || item.alerts.includes(filter)),
    )
    .sort((a, b) => {
      const order: SharedTaskAlert[] = [
        'overdue',
        'pending',
        'soon',
        'missing-owner',
        'missing-due',
      ];
      const rank = (item: typeof a) =>
        Math.min(...item.alerts.map((key) => order.indexOf(key)));

      return rank(a) - rank(b) ||
        (a.task.due || '9999-12-31').localeCompare(
          b.task.due || '9999-12-31',
        ) ||
        a.task.id.localeCompare(b.task.id);
    });

  const detailUrl = (id: string) =>
    '/?view=shared-tasks&workspaceId=' +
    encodeURIComponent(workspaceId) +
    '&taskId=' +
    encodeURIComponent(id);

  return (
    <section
      aria-label="Trung tam canh bao dieu hanh"
      style={{
        borderTop: '1px solid #e2e8f0',
        paddingTop: 22,
        marginTop: 22,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 19 }}>
            {'Trung t\u00e2m c\u1ea3nh b\u00e1o'}
          </h3>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
            {'M\u1ed9t c\u00f4ng vi\u1ec7c c\u00f3 th\u1ec3 c\u00f3 nhi\u1ec1u c\u1ea3nh b\u00e1o.'}
          </p>
        </div>
        <button
          type="button"
          className="btn secondary compact"
          onClick={() => setFilter('all')}
        >
          {'Xem t\u1ea5t c\u1ea3'}
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))',
        gap: 10,
        marginBottom: 18,
      }}>
        {filters.map(({ key, label, background, color }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() =>
              setFilter((current) => current === key ? 'all' : key)
            }
            style={{
              minWidth: 0,
              minHeight: 88,
              padding: 14,
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: 12,
              border: filter === key
                ? '2px solid #0d9488'
                : '1px solid #e2e8f0',
              background: filter === key ? background : '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ color, fontSize: 12 }}>{label}</span>
            <strong style={{ fontSize: 26 }}>{counts[key]}</strong>
          </button>
        ))}
      </div>

      <div aria-live="polite" className="muted"
        style={{ marginBottom: 12, fontSize: 12 }}>
        {'Hi\u1ec3n th\u1ecb'} {visible.length}
        {' c\u00f4ng vi\u1ec7c c\u1ea7n quan t\u00e2m'}
      </div>


      {copyNotice && (
        <p role="status" aria-live="polite"
          style={{ fontSize: 12, color: '#0f766e' }}>
          {copyNotice}
        </p>
      )}
      {visible.length === 0 ? (
        <p className="muted" style={{ padding: '14px 0' }}>
          {'Kh\u00f4ng c\u00f3 c\u00f4ng vi\u1ec7c trong nh\u00f3m n\u00e0y.'}
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10, maxHeight: 460, overflowY: 'auto' }}>
          {visible.map(({ task, alerts }) => (
            <div
              key={task.id}
              style={{
                padding: 14,
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                <strong style={{ overflowWrap: 'anywhere' }}>
                  {task.title}
                </strong>
                <span className="muted" style={{ fontSize: 12 }}>
                  {task.due || '--'}  {task.progress ?? 0}%
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}>
                {alerts.map((key) => {
                  const info = filters.find((f) => f.key === key);
                  return (
                    <span
                      key={key}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: info?.background,
                        color: info?.color,
                      }}
                    >
                      {info?.label}
                    </span>
                  );
                })}
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
              }}>
                <a
                  className="btn secondary compact"
                  href={detailUrl(task.id)}
                  style={{ textDecoration: 'none' }}
                >
                  {'Chi ti\u1ebft'}
                </a>
                <button
                  type="button"
                  className="btn secondary compact"
                  onClick={() => void copyReminder(task, alerts, 'zalo')}
                >
                  {'Sao ch\u00e9p Zalo'}
                </button>
                <button
                  type="button"
                  className="btn secondary compact"
                  onClick={() => void copyReminder(task, alerts, 'email')}
                >
                  {'Sao ch\u00e9p email'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
