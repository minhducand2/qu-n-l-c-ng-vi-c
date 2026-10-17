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

export default function OrganizationAlertCenter({
  workspaceId,
  tasks,
}: {
  workspaceId: string;
  tasks: Task[];
}) {
  const [filter, setFilter] = useState<SharedTaskAlert | 'all'>('all');
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

      {visible.length === 0 ? (
        <p className="muted" style={{ padding: '14px 0' }}>
          {'Kh\u00f4ng c\u00f3 c\u00f4ng vi\u1ec7c trong nh\u00f3m n\u00e0y.'}
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10, maxHeight: 460, overflowY: 'auto' }}>
          {visible.map(({ task, alerts }) => (
            <a
              key={task.id}
              href={detailUrl(task.id)}
              style={{
                display: 'block',
                padding: 14,
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 8,
              }}>
                <strong style={{ overflowWrap: 'anywhere' }}>
                  {task.title}
                </strong>
                <span className="muted" style={{ fontSize: 12 }}>
                  {task.due || '--'}  {task.progress ?? 0}%
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
