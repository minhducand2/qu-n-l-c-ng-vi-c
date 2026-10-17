'use client';

import { useEffect, useState } from 'react';
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
  progress?: number;
  assignedTo?: string | null;
};

type Member = {
  userId: string;
  displayName: string | null;
  departmentName: string | null;
};

type DirectoryState = {
  workspaceId: string;
  members: Member[];
  error: string;
};

type Period = 'all' | 'week' | 'month';
type Cell = string | number;
type Sheet = { name: string; rows: Cell[][] };

const completed = 'Ho\u00e0n th\u00e0nh';
const cancelled = '\u0110\u00e3 h\u1ee7y';
const waiting = 'Ch\u1edd duy\u1ec7t';
const unknownDept = 'Ch\u01b0a x\u00e1c \u0111\u1ecbnh ph\u00f2ng ban';
const unassigned = 'Ch\u01b0a ph\u00e2n c\u00f4ng';

const alertNames: Record<SharedTaskAlert, string> = {
  overdue: 'Qu\u00e1 h\u1ea1n',
  soon: 'S\u1eafp h\u1ea1n',
  pending: 'Ch\u1edd duy\u1ec7t',
  'missing-owner': 'Thi\u1ebfu ng\u01b0\u1eddi nh\u1eadn',
  'missing-due': 'Thi\u1ebfu h\u1ea1n ch\u00f3t',
};

function xmlEscape(value: Cell): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function createWorkbook(sheets: Sheet[]): string {
  const xmlSheets = sheets.map((sheet) => {
    const rows = sheet.rows.map((row, index) =>
      '<Row>' + row.map((value) => {
        const type = typeof value === 'number' &&
          Number.isFinite(value) ? 'Number' : 'String';
        return '<Cell' + (index === 0 ? ' ss:StyleID="Header"' : '') +
          '><Data ss:Type="' + type + '">' +
          xmlEscape(value) + '</Data></Cell>';
      }).join('') + '</Row>'
    ).join('');

    return '<Worksheet ss:Name="' + xmlEscape(sheet.name) +
      '"><Table>' + rows + '</Table></Worksheet>';
  }).join('');

  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<?mso-application progid="Excel.Sheet"?>' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
    'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
    '<Styles><Style ss:ID="Header"><Font ss:Bold="1"/>' +
    '<Interior ss:Color="#DCEEEA" ss:Pattern="Solid"/>' +
    '</Style></Styles>' + xmlSheets + '</Workbook>';
}

function weekStart(day: string): string {
  const date = new Date(day + 'T12:00:00Z');
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

function inPeriod(task: Task, period: Period, today: string): boolean {
  if (period === 'all') return true;
  if (!task.due) return false;
  if (period === 'month') return task.due.slice(0, 7) === today.slice(0, 7);

  const start = weekStart(today);
  const endDate = new Date(start + 'T12:00:00Z');
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const end = endDate.toISOString().slice(0, 10);

  return task.due >= start && task.due <= end;
}

function countSummary(tasks: Task[], today: string) {
  const live = tasks.filter(
    (task) => task.status !== completed && task.status !== cancelled
  );

  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === completed).length,
    active: live.length,
    overdue: live.filter((task) => task.due && task.due < today).length,
    pending: live.filter((task) => task.status === waiting).length,
    missingOwner: live.filter((task) => !task.assignedTo).length,
    missingDue: live.filter((task) => !task.due).length,
  };
}

function buildSheets(
  tasks: Task[],
  members: Member[],
  workspaceId: string,
  period: Period,
  today: string,
): Sheet[] {
  const byId = new Map(members.map((m) => [m.userId, m]));

  const ownerName = (task: Task) => {
    if (!task.assignedTo) return unassigned;
    return byId.get(task.assignedTo)?.displayName?.trim() ||
      task.assignedTo;
  };

  const departmentName = (task: Task) => {
    if (!task.assignedTo) return unassigned;
    return byId.get(task.assignedTo)?.departmentName?.trim() || unknownDept;
  };

  const summary = countSummary(tasks, today);
  const periodName = period === 'all'
    ? 'T\u1ea5t c\u1ea3'
    : period === 'week' ? 'Tu\u1ea7n n\u00e0y' : 'Th\u00e1ng n\u00e0y';

  const overview: Cell[][] = [
    ['Ch\u1ec9 ti\u00eau', 'Gi\u00e1 tr\u1ecb'],
    ['T\u1ed5 ch\u1ee9c (ID)', workspaceId],
    ['Ng\u00e0y xu\u1ea5t', today],
    ['K\u1ef3 b\u00e1o c\u00e1o', periodName],
    ['C\u01a1 s\u1edf l\u1ecdc', period === 'all'
      ? 'Kh\u00f4ng l\u1ecdc h\u1ea1n ch\u00f3t'
      : 'H\u1ea1n ch\u00f3t c\u00f4ng vi\u1ec7c'],
    ['Ph\u1ea1m vi', 'Ch\u1ec9 c\u00f4ng vi\u1ec7c t\u00e0i kho\u1ea3n c\u00f3 quy\u1ec1n xem'],
    ['Gi\u1edbi h\u1ea1n ngu\u1ed3n', 'API hi\u1ec7n t\u1ea1i t\u1ed1i \u0111a 1000 c\u00f4ng vi\u1ec7c'],
    ['T\u1ed5ng c\u00f4ng vi\u1ec7c', summary.total],
    ['Ho\u00e0n th\u00e0nh', summary.completed],
    ['\u0110ang m\u1edf', summary.active],
    ['Qu\u00e1 h\u1ea1n', summary.overdue],
    ['Ch\u1edd duy\u1ec7t', summary.pending],
    ['Thi\u1ebfu ng\u01b0\u1eddi nh\u1eadn', summary.missingOwner],
    ['Thi\u1ebfu h\u1ea1n ch\u00f3t', summary.missingDue],
  ];

  const groups = (keyOf: (task: Task) => string) => {
    const groupsMap = new Map<string, Task[]>();

    for (const task of tasks) {
      const key = keyOf(task);
      const group = groupsMap.get(key) || [];
      group.push(task);
      groupsMap.set(key, group);
    }

    return [...groupsMap.entries()]
      .map(([key, items]) => ({ key, ...countSummary(items, today) }))
      .sort((a, b) => b.overdue - a.overdue || b.total - a.total)
      .map((group): Cell[] => [
        group.key, group.total, group.completed,
        group.active, group.overdue, group.pending,
      ]);
  };

  const departments: Cell[][] = [
    ['Ph\u00f2ng ban', 'T\u1ed5ng', 'Ho\u00e0n th\u00e0nh',
      '\u0110ang m\u1edf', 'Qu\u00e1 h\u1ea1n', 'Ch\u1edd duy\u1ec7t'],
    ...groups(departmentName),
  ];

  const people: Cell[][] = [
    ['Nh\u00e2n s\u1ef1', 'T\u1ed5ng', 'Ho\u00e0n th\u00e0nh',
      '\u0110ang m\u1edf', 'Qu\u00e1 h\u1ea1n', 'Ch\u1edd duy\u1ec7t'],
    ...groups((task) => task.assignedTo
      ? ownerName(task) + ' [' + task.assignedTo + ']'
      : unassigned),
  ];

  const details: Cell[][] = [
    ['ID', 'T\u00ean c\u00f4ng vi\u1ec7c', 'Tr\u1ea1ng th\u00e1i',
      'Ng\u01b0\u1eddi nh\u1eadn', 'Ph\u00f2ng ban', 'H\u1ea1n ch\u00f3t',
      'Ti\u1ebfn \u0111\u1ed9 (%)'],
    ...tasks.map((task): Cell[] => [
      task.id, task.title, task.status, ownerName(task),
      departmentName(task), task.due || '', task.progress ?? 0,
    ]),
  ];

  const warnings: Cell[][] = [
    ['ID', 'T\u00ean c\u00f4ng vi\u1ec7c', 'C\u1ea3nh b\u00e1o',
      'Tr\u1ea1ng th\u00e1i', 'Ng\u01b0\u1eddi nh\u1eadn',
      'H\u1ea1n ch\u00f3t'],
  ];

  for (const task of tasks) {
    const alerts = getSharedTaskAlerts(task, today);
    if (!alerts.length) continue;

    warnings.push([
      task.id,
      task.title,
      alerts.map((alert) => alertNames[alert]).join('; '),
      task.status,
      ownerName(task),
      task.due || '',
    ]);
  }

  return [
    { name: 'Tong quan', rows: overview },
    { name: 'Phong ban', rows: departments },
    { name: 'Nhan su', rows: people },
    { name: 'Cong viec', rows: details },
    { name: 'Canh bao', rows: warnings },
  ];
}

export default function OrganizationReport({
  workspaceId,
  tasks,
}: {
  workspaceId: string;
  tasks: Task[];
}) {
  const [period, setPeriod] = useState<Period>('all');
  const [directory, setDirectory] = useState<DirectoryState | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    void fetch(
      '/api/workspaces/' + encodeURIComponent(workspaceId) + '/directory',
      { credentials: 'same-origin', cache: 'no-store' },
    ).then(async (response) => {
      if (!response.ok) throw Error('HTTP ' + response.status);
      return response.json() as Promise<{ members: Member[] }>;
    }).then((body) => {
      if (!active) return;
      setDirectory({
        workspaceId,
        members: Array.isArray(body.members) ? body.members : [],
        error: '',
      });
    }).catch((error: unknown) => {
      if (!active) return;
      setDirectory({
        workspaceId,
        members: [],
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return () => { active = false; };
  }, [workspaceId]);

  const today = localDay();
  const selectedTasks = tasks.filter((task) => inPeriod(task, period, today));
  const isReady = directory?.workspaceId === workspaceId &&
    !directory.error;

  function downloadReport() {
    if (!directory || directory.workspaceId !== workspaceId ||
      directory.error) return;

    try {
      const sheets = buildSheets(
        selectedTasks, directory.members, workspaceId, period, today,
      );
      const content = createWorkbook(sheets);
      const blob = new Blob(
        ['\uFEFF', content],
        { type: 'application/vnd.ms-excel;charset=utf-8' },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = 'TEAM360_BaoCao_' +
        period + '_' + today + '.xml';

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);

      setNotice('?\u00e3 t\u1ea1o t\u1ec7p b\u00e1o c\u00e1o Excel XML.');
    } catch (error) {
      setNotice(
        'Xu\u1ea5t b\u00e1o c\u00e1o th\u1ea5t b\u1ea1i: ' +
        (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  return (
    <section style={{
      borderTop: '1px solid #e2e8f0',
      paddingTop: 22,
      marginTop: 22,
    }}>
      <h3 style={{ margin: '0 0 8px' }}>
        {'B\u00e1o c\u00e1o \u0111i\u1ec1u h\u00e0nh'}
      </h3>

      <p className="muted" style={{ fontSize: 12 }}>
        {'Xu\u1ea5t b\u00e1o c\u00e1o 5 trang t\u00ednh, ch\u1ec9 s\u1eed d\u1ee5ng d\u1eef li\u1ec7u c\u00f3 quy\u1ec1n xem.'}
      </p>

      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'end',
        margin: '14px 0',
      }}>
        <label style={{ display: 'grid', gap: 6 }}>
          {'K\u1ef3 b\u00e1o c\u00e1o'}
          <select
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value as Period);
              setNotice('');
            }}
          >
            <option value="all">{'T\u1ea5t c\u1ea3'}</option>
            <option value="week">{'Tu\u1ea7n n\u00e0y'}</option>
            <option value="month">{'Th\u00e1ng n\u00e0y'}</option>
          </select>
        </label>

        <button
          type="button"
          className="btn primary"
          disabled={!isReady}
          onClick={downloadReport}
        >
          {'Xu\u1ea5t b\u00e1o c\u00e1o Excel'}
        </button>
      </div>

      <p className="muted" style={{ fontSize: 12 }}>
        {selectedTasks.length}
        {' c\u00f4ng vi\u1ec7c trong ph\u1ea1m vi b\u00e1o c\u00e1o.'}
        {period !== 'all'
          ? ' K\u1ef3 l\u1ecdc d\u1ef1a tr\u00ean h\u1ea1n ch\u00f3t.'
          : ''}
      </p>

      {directory?.workspaceId === workspaceId && directory.error && (
        <p role="alert">
          {'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh b\u1ea1: '}
          {directory.error}
        </p>
      )}

      {!isReady && directory?.workspaceId !== workspaceId && (
        <p className="muted">{'\u0110ang t\u1ea3i danh b\u1ea1...'}</p>
      )}

      {notice && <p role="status" aria-live="polite">{notice}</p>}

      <p className="muted" style={{ fontSize: 11, marginTop: 12 }}>
        {'T\u1ec7p .xml m\u1edf \u0111\u01b0\u1ee3c trong Excel; kh\u00f4ng ph\u1ea3i .xlsx. B\u00e1o c\u00e1o kh\u00f4ng bao g\u1ed3m c\u00f4ng vi\u1ec7c b\u1ecb gi\u1edbi h\u1ea1n quy\u1ec1n xem ho\u1eb7c v\u01b0\u1ee3t gi\u1edbi h\u1ea1n API.'}
      </p>
    </section>
  );
}
