'use client';

type Task = {
  id: string;
  title: string;
  status: string;
  due?: string;
  assignedTo?: string | null;
  progress?: number;
};

type Period = 'all' | 'week' | 'month' | 'custom';

const DONE = 'Ho\u00e0n th\u00e0nh';
const CANCELLED = '\u0110\u00e3 h\u1ee7y';
const WAITING = 'Ch\u1edd duy\u1ec7t';

function dateUTC(day: string): number {
  return Date.parse(day + 'T12:00:00Z');
}

function shiftDay(day: string, offset: number): string {
  const value = new Date(dateUTC(day));
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((dateUTC(b) - dateUTC(a)) / 86400000);
}

function previousRange(
  period: Period,
  today: string,
  from: string,
  to: string,
): { from: string; to: string } | null {
  if (period === 'all') return null;

  if (period === 'custom') {
    if (!from || !to || from > to) return null;
    const length = daysBetween(from, to) + 1;
    return {
      from: shiftDay(from, -length),
      to: shiftDay(from, -1),
    };
  }

  if (period === 'week') {
    const dayOfWeek = new Date(dateUTC(today)).getUTCDay();
    const monday = shiftDay(today, -((dayOfWeek + 6) % 7));
    return {
      from: shiftDay(monday, -7),
      to: shiftDay(monday, -1),
    };
  }

  const [year, month] = today.split('-').map(Number);
  const firstCurrentMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstPreviousMonth = new Date(
    Date.UTC(firstCurrentMonth.getUTCFullYear(),
      firstCurrentMonth.getUTCMonth() - 1, 1)
  );
  const previousLastDay = new Date(
    Date.UTC(year, month - 1, 0)
  );

  return {
    from: firstPreviousMonth.toISOString().slice(0, 10),
    to: previousLastDay.toISOString().slice(0, 10),
  };
}

function isActive(task: Task): boolean {
  return task.status !== DONE && task.status !== CANCELLED;
}

function overdueDays(task: Task, today: string): number {
  if (!isActive(task) || !task.due || task.due >= today) return 0;
  return Math.max(0, daysBetween(task.due, today));
}

function formatDay(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  return day.slice(8) + '/' + day.slice(5, 7) + '/' + day.slice(0, 4);
}

function taskUrl(workspaceId: string, taskId: string): string {
  return '/?view=shared-tasks&workspaceId=' +
    encodeURIComponent(workspaceId) +
    '&taskId=' + encodeURIComponent(taskId);
}

export default function OrganizationReportInsights({
  workspaceId,
  allTasks,
  selectedTasks,
  period,
  dateFrom,
  dateTo,
  today,
}: {
  workspaceId: string;
  allTasks: Task[];
  selectedTasks: Task[];
  period: Period;
  dateFrom: string;
  dateTo: string;
  today: string;
}) {
  // TEAM360_REPORT_V47
  const previous = previousRange(period, today, dateFrom, dateTo);

  const priorTasks = previous
    ? allTasks.filter(task =>
        Boolean(task.due) &&
        task.due! >= previous.from &&
        task.due! <= previous.to
      )
    : [];

  const currentCount = selectedTasks.length;
  const priorCount = priorTasks.length;
  const difference = currentCount - priorCount;

  const currentDone = selectedTasks.filter(t => t.status === DONE).length;
  const previousDone = priorTasks.filter(t => t.status === DONE).length;

  const currentRate = currentCount
    ? currentDone / currentCount * 100 : 0;
  const previousRate = priorCount
    ? previousDone / priorCount * 100 : 0;

  const overdue = selectedTasks
    .map(task => ({ task, days: overdueDays(task, today) }))
    .filter(item => item.days > 0);

  const buckets = [
    { label: '1\u20133 ng\u00e0y', min: 1, max: 3 },
    { label: '4\u20137 ng\u00e0y', min: 4, max: 7 },
    { label: '8\u201314 ng\u00e0y', min: 8, max: 14 },
    { label: 'Tr\u00ean 14 ng\u00e0y', min: 15, max: Infinity },
  ].map(bucket => ({
    ...bucket,
    count: overdue.filter(
      item => item.days >= bucket.min && item.days <= bucket.max
    ).length,
  }));

  const maxBucket = Math.max(1, ...buckets.map(b => b.count));

  const priorities = selectedTasks
    .filter(isActive)
    .map(task => {
      const days = overdueDays(task, today);
      const waiting = task.status === WAITING;
      return {
        task,
        days,
        waiting,
        rank: days > 0 ? 0 : waiting ? 1 : 2,
      };
    })
    .filter(item => item.rank < 2)
    .sort((a, b) =>
      a.rank - b.rank ||
      b.days - a.days ||
      a.task.id.localeCompare(b.task.id)
    )
    .slice(0, 10);

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#64748b',
  };

  return (
    <section style={{
      marginTop: 24,
      paddingTop: 20,
      borderTop: '1px solid #e2e8f0',
      display: 'grid',
      gap: 22,
    }}>
      <div>
        <h3 style={{ margin: '0 0 6px' }}>
          {'Ph\u00e2n t\u00edch \u0111i\u1ec1u h\u00e0nh chuy\u00ean s\u00e2u'}
        </h3>
        <p style={labelStyle}>
          {'Ch\u1ec9 s\u1eed d\u1ee5ng c\u00f4ng vi\u1ec7c t\u00e0i kho\u1ea3n \u0111\u01b0\u1ee3c ph\u00e9p xem.'}
        </p>
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px' }}>
          {'1. So s\u00e1nh hai k\u1ef3 theo h\u1ea1n ch\u00f3t'}
        </h4>
        {!previous ? (
          <p style={labelStyle}>
            {'Ch\u1ecdn Tu\u1ea7n n\u00e0y, Th\u00e1ng n\u00e0y ho\u1eb7c Kho\u1ea3ng ng\u00e0y \u0111\u1ec3 xem so s\u00e1nh.'}
          </p>
        ) : (
          <>
            <p style={labelStyle}>
              {'K\u1ef3 tr\u01b0\u1edbc: '}
              {formatDay(previous.from)}
              {' \u2013 '}
              {formatDay(previous.to)}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
              gap: 12,
              marginTop: 12,
            }}>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 14,
              }}>
                <div style={labelStyle}>{'S\u1ed1 vi\u1ec7c theo h\u1ea1n ch\u00f3t'}</div>
                <strong style={{ fontSize: 24 }}>{currentCount}</strong>
                <div style={labelStyle}>
                  {'K\u1ef3 tr\u01b0\u1edbc: '}{priorCount}
                  {' \u00b7 Ch\u00eanh l\u1ec7ch: '}
                  {difference > 0 ? '+' : ''}{difference}
                </div>
              </div>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 14,
              }}>
                <div style={labelStyle}>{'T\u1ef7 l\u1ec7 \u0111\u00e3 ho\u00e0n th\u00e0nh'}</div>
                <strong style={{ fontSize: 24 }}>
                  {currentRate.toFixed(1)}%
                </strong>
                <div style={labelStyle}>
                  {'K\u1ef3 tr\u01b0\u1edbc: '}
                  {previousRate.toFixed(1)}%
                  {' \u00b7 Ch\u00eanh l\u1ec7ch: '}
                  {(currentRate - previousRate > 0 ? '+' : '') +
                    (currentRate - previousRate).toFixed(1)}
                  {' \u0111i\u1ec3m %'}
                </div>
              </div>
            </div>
            <p style={{ ...labelStyle, marginTop: 10 }}>
              {'L\u01b0u \u00fd: \u0110\u00e2y l\u00e0 so s\u00e1nh hai nh\u00f3m c\u00f4ng vi\u1ec7c c\u00f3 h\u1ea1n ch\u00f3t kh\u00e1c nhau, theo tr\u1ea1ng th\u00e1i hi\u1ec7n t\u1ea1i; kh\u00f4ng ph\u1ea3i l\u1ecbch s\u1eed hi\u1ec7u su\u1ea5t t\u1ea1i hai th\u1eddi \u0111i\u1ec3m.'}
            </p>
          </>
        )}
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px' }}>
          {'2. Tu\u1ed5i n\u1ee3 c\u00f4ng vi\u1ec7c qu\u00e1 h\u1ea1n'}
        </h4>
        <div style={{ display: 'grid', gap: 12 }}>
          {buckets.map(bucket => (
            <div key={bucket.label}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                marginBottom: 5,
              }}>
                <span>{bucket.label}</span>
                <strong>{bucket.count} {'vi\u1ec7c'}</strong>
              </div>
              <div style={{
                height: 13,
                borderRadius: 8,
                background: '#e2e8f0',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: bucket.count / maxBucket * 100 + '%',
                  background: bucket.min >= 15 ? '#b91c1c'
                    : bucket.min >= 8 ? '#ef4444'
                    : bucket.min >= 4 ? '#f59e0b'
                    : '#fbbf24',
                }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 10px' }}>
          {'3. C\u00f4ng vi\u1ec7c c\u1ea7n \u01b0u ti\u00ean x\u1eed l\u00fd'}
        </h4>
        {priorities.length === 0 ? (
          <p style={labelStyle}>
            {'Kh\u00f4ng c\u00f3 vi\u1ec7c qu\u00e1 h\u1ea1n ho\u1eb7c ch\u1edd duy\u1ec7t trong k\u1ef3.'}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 9 }}>
            {priorities.map(({ task, days, waiting }) => (
              <a
                key={task.id}
                href={taskUrl(workspaceId, task.id)}
                style={{
                  padding: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 9,
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ overflowWrap: 'anywhere' }}>
                  <strong>{task.title || task.id}</strong>
                  <span style={{
                    display: 'block',
                    fontSize: 12,
                    color: '#64748b',
                    marginTop: 4,
                  }}>
                    {'H\u1ea1n: '}{formatDay(task.due || '') || '--'}
                    {' \u00b7 '}{task.status}
                  </span>
                </span>
                <span style={{
                  fontSize: 12,
                  borderRadius: 7,
                  padding: '5px 9px',
                  background: days > 0 ? '#fee2e2' : '#dbeafe',
                  color: days > 0 ? '#b91c1c' : '#1d4ed8',
                  fontWeight: 600,
                }}>
                  {days > 0
                    ? 'Qu\u00e1 h\u1ea1n ' + days + ' ng\u00e0y'
                    : waiting ? 'Ch\u1edd duy\u1ec7t' : ''}
                </span>
              </a>
            ))}
          </div>
        )}
        <p style={{ ...labelStyle, marginTop: 10 }}>
          {'Hi\u1ec3n th\u1ecb t\u1ed1i \u0111a 10 vi\u1ec7c \u01b0u ti\u00ean. Nh\u1ea5n v\u00e0o c\u00f4ng vi\u1ec7c \u0111\u1ec3 m\u1edf chi ti\u1ebft.'}
        </p>
      </div>
    </section>
  );
}
