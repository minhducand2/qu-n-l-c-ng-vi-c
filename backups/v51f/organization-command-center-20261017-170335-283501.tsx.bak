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
  assignedTo?: string | null;
  progress?: number;
};

type Member = {
  userId: string;
  displayName: string | null;
  departmentName: string | null;
};

type Directory = {
  workspaceId: string;
  members: Member[];
  error: string;
};

type Entry = {
  task: Task;
  alerts: SharedTaskAlert[];
  level: 'high' | 'review' | 'information' | 'soon';
};

const missingDept = 'Ch\u01b0a x\u00e1c \u0111\u1ecbnh ph\u00f2ng ban';
const unassigned = 'Ch\u01b0a ph\u00e2n c\u00f4ng';

const alertLabels: Record<SharedTaskAlert, string> = {
  overdue: 'Qu\u00e1 h\u1ea1n',
  soon: 'S\u1eafp h\u1ea1n',
  pending: 'Ch\u1edd duy\u1ec7t',
  'missing-owner': 'Thi\u1ebfu ng\u01b0\u1eddi nh\u1eadn',
  'missing-due': 'Thi\u1ebfu h\u1ea1n ch\u00f3t',
};

const levelLabels = {
  high: '\u01afu ti\u00ean cao',
  review: 'Ch\u1edd ph\u00ea duy\u1ec7t',
  information: 'Thi\u1ebfu th\u00f4ng tin',
  soon: 'S\u1eafp h\u1ea1n',
};

function getLevel(alerts: SharedTaskAlert[]): Entry['level'] {
  if (alerts.includes('overdue')) return 'high';
  if (alerts.includes('pending')) return 'review';
  if (alerts.includes('soon')) return 'soon';
  return 'information';
}

function formatDay(day?: string): string {
  if (!day) return 'Ch\u01b0a c\u00f3';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  return day.slice(8) + '/' + day.slice(5, 7) + '/' + day.slice(0, 4);
}

function makeDirective(
  entry: Entry,
  owner: string,
  department: string,
  purpose: 'update' | 'resolve' | 'coordinate',
): string {
  const task = entry.task;

  const requests = {
    update:
      '\u0110\u1ec1 ngh\u1ecb ki\u1ec3m tra, c\u1eadp nh\u1eadt ti\u1ebfn \u0111\u1ed9, kh\u00f3 kh\u0103n v\u01b0\u1edbng m\u1eafc v\u00e0 th\u1eddi gian d\u1ef1 ki\u1ebfn x\u1eed l\u00fd.',
    resolve:
      '\u0110\u1ec1 ngh\u1ecb \u01b0u ti\u00ean x\u1eed l\u00fd c\u00e1c n\u1ed9i dung t\u1ed3n \u0111\u1ecdng v\u00e0 ph\u1ea3n h\u1ed3i ph\u01b0\u01a1ng \u00e1n, m\u1ed1c th\u1eddi gian d\u1ef1 ki\u1ebfn.',
    coordinate:
      '\u0110\u1ec1 ngh\u1ecb r\u00e0 so\u00e1t ph\u1ea7n vi\u1ec7c li\u00ean quan, l\u00e0m r\u00f5 \u0111\u1ea7u m\u1ed1i ph\u1ee5 tr\u00e1ch v\u00e0 c\u00e1c n\u1ed9i dung c\u1ea7n ph\u1ed1i h\u1ee3p.',
  };

  const issues = entry.alerts
    .map(key => '- ' + alertLabels[key])
    .join('\n');

  return [
    'D\u1ef0 TH\u1ea2O N\u1ed8I DUNG CH\u1ec8 \u0110\u1ea0O',
    '',
    'K\u00ednh g\u1eedi b\u1ed9 ph\u1eadn, c\u00e1 nh\u00e2n li\u00ean quan,',
    '',
    'C\u00f4ng vi\u1ec7c: ' + (task.title || task.id),
    'M\u00e3 c\u00f4ng vi\u1ec7c: ' + task.id,
    'Ph\u00f2ng ban: ' + department,
    'Ng\u01b0\u1eddi nh\u1eadn ch\u00ednh: ' + owner,
    'Tr\u1ea1ng th\u00e1i: ' + task.status,
    'H\u1ea1n ch\u00f3t: ' + formatDay(task.due),
    'Ti\u1ebfn \u0111\u1ed9: ' + (task.progress ?? 0) + '%',
    '',
    'N\u1ed9i dung c\u1ea7n l\u01b0u \u00fd:',
    issues,
    '',
    requests[purpose],
    '',
    'Tr\u00e2n tr\u1ecdng.',
  ].join('\n');
}

export default function OrganizationCommandCenter({
  workspaceId,
  tasks,
}: {
  workspaceId: string;
  tasks: Task[];
}) {
  // TEAM360_COMMAND_V48
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [level, setLevel] = useState('all');
  const [department, setDepartment] = useState('all');
  const [person, setPerson] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [purpose, setPurpose] =
    useState<'update' | 'resolve' | 'coordinate'>('update');
  const [notice, setNotice] = useState('');

  // TEAM360_D1_DRAFT_V50
  type ServerDraft = {
    id: string;
    workspace_id: string;
    task_id: string;
    title: string;
    body: string;
    version: number;
    status: string;
    updated_at: string;
  };

  type ServerVersion = {
    version: number;
    title: string;
    body: string;
    edited_by: string;
    edited_at: string;
  };

  const [serverDrafts, setServerDrafts] =
    useState<Record<string, ServerDraft>>({});

  const [serverVersions, setServerVersions] =
    useState<Record<string, ServerVersion[]>>({});

  const [serverBusy, setServerBusy] = useState(false);
  const [serverNotice, setServerNotice] = useState('');

  // TEAM360_D1_AUTOLOAD_V501
  type AutoLoadStatus = {
    key: string;
    status: 'loading' | 'ready' | 'empty' | 'error';
    message?: string;
  };

  const [autoLoad, setAutoLoad] =
    useState<AutoLoadStatus | null>(null);




  // TEAM360_DRAFT_V49
  // Local component state only: no server writes and no cross-session storage.
  type DraftVersion = {
    text: string;
    savedAt: string;
    revision: number;
  };

  const [editedDrafts, setEditedDrafts] =
    useState<Record<string, string>>({});

  const [draftVersions, setDraftVersions] =
    useState<Record<string, DraftVersion[]>>({});


  useEffect(() => {
    let active = true;

    void fetch(
      '/api/workspaces/' + encodeURIComponent(workspaceId) + '/directory',
      { credentials: 'same-origin', cache: 'no-store' },
    )
      .then(async response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json() as Promise<{ members: Member[] }>;
      })
      .then(body => {
        if (!active) return;
        setDirectory({
          workspaceId,
          members: Array.isArray(body.members) ? body.members : [],
          error: '',
        });
      })
      .catch((error: unknown) => {
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
  const entries: Entry[] = tasks
    .map(task => {
      const alerts = getSharedTaskAlerts(task, today);
      return { task, alerts, level: getLevel(alerts) };
    })
    .filter(entry => entry.alerts.length > 0);

  const members = directory?.workspaceId === workspaceId
    ? directory.members : [];

  const byId = new Map(members.map(member => [member.userId, member]));

  const ownerName = (task: Task) =>
    task.assignedTo
      ? byId.get(task.assignedTo)?.displayName?.trim() || task.assignedTo
      : unassigned;

  const departmentName = (task: Task) =>
    !task.assignedTo
      ? unassigned
      : byId.get(task.assignedTo)?.departmentName?.trim() || missingDept;

  const departments = [...new Set(
    entries.map(entry => departmentName(entry.task)),
  )].sort();

  const owners = [...new Map(
    entries.map(entry => [
      entry.task.assignedTo || '',
      ownerName(entry.task),
    ]),
  ).entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi'));

  const visible = entries
    .filter(entry =>
      (level === 'all' || entry.level === level) &&
      (department === 'all' ||
        departmentName(entry.task) === department) &&
      (person === 'all' ||
        (entry.task.assignedTo || '') === person),
    )
    .sort((a, b) => {
      const rank = { high: 0, review: 1, soon: 2, information: 3 };
      return rank[a.level] - rank[b.level] ||
        (a.task.due || '9999-12-31').localeCompare(
          b.task.due || '9999-12-31'
        ) || a.task.id.localeCompare(b.task.id);
    });

  const selected = visible.find(entry => entry.task.id === selectedId);
  const draftKey = selected
    ? workspaceId + ':' + selected.task.id
    : '';

  const generatedDraft = selected
    ? makeDirective(
        selected,
        ownerName(selected.task),
        departmentName(selected.task),
        purpose,
      )
    : '';

  const draft = selected
    ? (editedDrafts[draftKey] ?? generatedDraft)
    : '';

  const versions = draftVersions[draftKey] || [];

  const detailUrl = (id: string) =>
    '/?view=shared-tasks&workspaceId=' +
    encodeURIComponent(workspaceId) +
    '&taskId=' + encodeURIComponent(id);


  function saveVersion() {
    if (!selected || !draft.trim()) return;

    const history = draftVersions[draftKey] || [];
    const latest = history[0];

    if (latest?.text === draft) {
      setNotice('N\u1ed9i dung kh\u00f4ng thay \u0111\u1ed5i so v\u1edbi b\u1ea3n l\u01b0u g\u1ea7n nh\u1ea5t.');
      return;
    }

    const nextVersion = {
      text: draft,
      savedAt: new Date().toLocaleString('vi-VN'),
      revision: (latest?.revision || 0) + 1,
    };

    setDraftVersions(current => ({
      ...current,
      [draftKey]: [nextVersion, ...(current[draftKey] || [])].slice(0, 20),
    }));

    setNotice('\u0110\u00e3 l\u01b0u phi\u00ean b\u1ea3n ' +
      nextVersion.revision + ' trong phi\u00ean l\u00e0m vi\u1ec7c.');
  }

  function restoreVersion(text: string, revision: number) {
    if (!selected) return;

    setEditedDrafts(current => ({
      ...current,
      [draftKey]: text,
    }));

    setNotice('\u0110\u00e3 kh\u00f4i ph\u1ee5c n\u1ed9i dung phi\u00ean b\u1ea3n ' +
      revision + '. Ch\u01b0a ghi \u0111\u00e8 l\u1ecbch s\u1eed.');
  }

  function resetDraft() {
    if (!selected) return;

    setEditedDrafts(current => {
      const next = { ...current };
      delete next[draftKey];
      return next;
    });

    setNotice('\u0110\u00e3 n\u1ea1p l\u1ea1i m\u1eabu ch\u1ec9 \u0111\u1ea1o. C\u00e1c phi\u00ean b\u1ea3n \u0111\u00e3 l\u01b0u v\u1eabn gi\u1eef nguy\u00ean.');
  }

  function downloadDraft() {
    if (!selected || !draft.trim()) return;

    const content = new Blob(
      ['\uFEFF', draft],
      { type: 'text/plain;charset=utf-8' }
    );

    const url = URL.createObjectURL(content);
    const link = document.createElement('a');

    link.href = url;
    link.download =
      'DuThaoChiDao_' +
      selected.task.id.replace(/[^a-zA-Z0-9_-]/g, '_') +
      '.txt';

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    setNotice('\u0110\u00e3 t\u1ea1o t\u1ec7p d\u1ef1 th\u1ea3o TXT.');
  }


  function draftApiUrl(taskId: string, draftId?: string) {
    const params = new URLSearchParams({
      workspaceId,
      taskId,
    });

    if (draftId) params.set('draftId', draftId);

    return '/api/directive-drafts?' + params.toString();
  }

  async function draftRequest<T>(
    url: string,
    method: 'GET' | 'POST' | 'PATCH' = 'GET',
    payload?: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(method === 'GET' ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      const error = data && typeof data === 'object' &&
        'error' in data
        ? String((data as { error: unknown }).error)
        : 'HTTP ' + response.status;

      throw Error(error);
    }

    return data as T;
  }


  // Automatically restore server data when a task is selected.
  // Never replace text already edited in this browser session.
  useEffect(() => {
    if (!selectedId) return;

    let active = true;
    const taskId = selectedId;
    const key = workspaceId + ':' + taskId;

    setAutoLoad({ key, status: 'loading' });

    const url = '/api/directive-drafts?' +
      new URLSearchParams({
        workspaceId,
        taskId,
      }).toString();

    void (async () => {
      try {
        const list = await draftRequest<{
          drafts: ServerDraft[];
        }>(url);

        if (!active) return;

        const drafts = Array.isArray(list.drafts)
          ? list.drafts
          : [];

        if (drafts.length === 0) {
          setAutoLoad({ key, status: 'empty' });
          return;
        }

        // Prefer the newest draft returned by the server.
        const newest = drafts[0];

        const detailUrl = url +
          '&draftId=' + encodeURIComponent(newest.id);

        const details = await draftRequest<{
          draft: ServerDraft;
          versions: ServerVersion[];
        }>(detailUrl);

        if (!active) return;

        const remote = details.draft;

        if (!remote || remote.task_id !== taskId ||
          remote.workspace_id !== workspaceId) {
          throw Error('D? li?u d? th?o kh?ng kh?p c?ng vi?c.');
        }

        setServerDrafts(current => ({
          ...current,
          [key]: remote,
        }));

        setServerVersions(current => ({
          ...current,
          [key]: Array.isArray(details.versions)
            ? details.versions
            : [],
        }));

        setEditedDrafts(current => {
          // Important: an existing edit is never overwritten
          // by an asynchronous server response.
          if (current[key] !== undefined) return current;

          return {
            ...current,
            [key]: remote.body,
          };
        });

        setAutoLoad({ key, status: 'ready' });
      } catch (error) {
        if (!active) return;

        setAutoLoad({
          key,
          status: 'error',
          message: error instanceof Error
            ? error.message
            : String(error),
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [workspaceId, selectedId]);

  async function loadServerDraft() {
    if (!selected || serverBusy) return;

    const key = draftKey;
    const taskId = selected.task.id;

    setServerBusy(true);
    setServerNotice('');

    try {
      const list = await draftRequest<{ drafts: ServerDraft[] }>(
        draftApiUrl(taskId),
      );

      const drafts = Array.isArray(list.drafts) ? list.drafts : [];
      const current = serverDrafts[key];
      const latest = drafts.find(item => item.id === current?.id) ||
        drafts[0];

      if (!latest) {
        setServerNotice(
          'Ch\u01b0a c\u00f3 d\u1ef1 th\u1ea3o tr\u00ean D1 cho c\u00f4ng vi\u1ec7c n\u00e0y.'
        );
        return;
      }

      const details = await draftRequest<{
        draft: ServerDraft;
        versions: ServerVersion[];
      }>(draftApiUrl(taskId, latest.id));

      if (!window.confirm(
        'T\u1ea3i n\u1ed9i dung t\u1eeb D1? N\u1ed9i dung \u0111ang ch\u1ec9nh s\u1eeda tr\u00ean giao di\u1ec7n s\u1ebd b\u1ecb thay th\u1ebf.'
      )) {
        return;
      }

      setEditedDrafts(items => ({
        ...items,
        [key]: details.draft.body,
      }));
      setServerDrafts(items => ({
        ...items,
        [key]: details.draft,
      }));
      setServerVersions(items => ({
        ...items,
        [key]: details.versions || [],
      }));

      setServerNotice(
        '\u0110\u00e3 t\u1ea3i d\u1ef1 th\u1ea3o D1 - phi\u00ean b\u1ea3n ' +
        details.draft.version + '.'
      );
    } catch (error) {
      setServerNotice(
        'L\u1ed7i t\u1ea3i D1: ' +
        (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setServerBusy(false);
    }
  }

  async function saveServerDraft() {
    if (!selected) {
      setServerNotice('Chua chon cong viec de luu.');
      return;
    }

    if (!draft.trim()) {
      setServerNotice('Noi dung du thao dang trong.');
      return;
    }

    if (serverBusy) {
      setServerNotice('Yeu cau truoc dang duoc xu ly.');
      return;
    }

    setServerNotice('Da nhan thao tac luu. Dang ket noi API D1...');

    const key = draftKey;
    const taskId = selected.task.id;
    const existing = serverDrafts[key];

    setServerBusy(true);

    try {
      // Read existing drafts first: never silently create a duplicate
      // when this browser does not know the server-side draft.
      const list = await draftRequest<{ drafts: ServerDraft[] }>(
        draftApiUrl(taskId),
      );

      const remote = (list.drafts || []).find(
        item => item.id === existing?.id
      );

      if (!existing && list.drafts?.length) {
        setServerNotice(
          '\u0110\u00e3 c\u00f3 d\u1ef1 th\u1ea3o tr\u00ean D1. H\u00e3y nh\u1ea5n "T\u1ea3i t\u1eeb D1" tr\u01b0\u1edbc khi c\u1eadp nh\u1eadt.'
        );
        return;
      }

      if (existing && (!remote || remote.version !== existing.version)) {
        setServerNotice(
          'Phi\u00ean b\u1ea3n D1 \u0111\u00e3 thay \u0111\u1ed5i. H\u00e3y t\u1ea3i l\u1ea1i tr\u01b0\u1edbc khi l\u01b0u.'
        );
        return;
      }

      const payload: Record<string, unknown> = {
        workspaceId,
        taskId,
        title: selected.task.title?.trim() || selected.task.id,
        body: draft,
      };

      if (existing) {
        payload.draftId = existing.id;
        payload.version = existing.version;
      }

      const saved = await draftRequest<{
        id: string;
        version: number;
      }>(
        '/api/directive-drafts',
        existing ? 'PATCH' : 'POST',
        payload,
      );

      const details = await draftRequest<{
        draft: ServerDraft;
        versions: ServerVersion[];
      }>(draftApiUrl(taskId, saved.id));

      setServerDrafts(items => ({
        ...items,
        [key]: details.draft,
      }));
      setServerVersions(items => ({
        ...items,
        [key]: details.versions || [],
      }));

      setServerNotice(
        '\u0110\u00e3 l\u01b0u l\u00ean D1 - phi\u00ean b\u1ea3n ' +
        saved.version + '.'
      );
    } catch (error) {
      setServerNotice(
        'L\u01b0u D1 th\u1ea5t b\u1ea1i: ' +
        (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setServerBusy(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setNotice('\u0110\u00e3 sao ch\u00e9p b\u1ea3n nh\u00e1p.');
    } catch {
      setNotice('Kh\u00f4ng sao ch\u00e9p \u0111\u01b0\u1ee3c. Ki\u1ec3m tra quy\u1ec1n clipboard.');
    }
  }


  const remoteDraft = serverDrafts[draftKey];
  const currentAutoLoad =
    autoLoad?.key === draftKey ? autoLoad : null;

  const hasUnsavedChanges = Boolean(
    selected &&
    (
      remoteDraft
        ? draft !== remoteDraft.body
        : editedDrafts[draftKey] !== undefined &&
          draft !== generatedDraft
    )
  );

  const saveStatusText = !selected
    ? ''
    : currentAutoLoad?.status === 'loading'
      ? '\u0110ang ki\u1ec3m tra d\u1ef1 th\u1ea3o tr\u00ean D1...'
      : currentAutoLoad?.status === 'error'
        ? 'Kh\u00f4ng t\u1ef1 t\u1ea3i \u0111\u01b0\u1ee3c D1: ' +
          (currentAutoLoad.message || 'L\u1ed7i kh\u00f4ng x\u00e1c \u0111\u1ecbnh')
        : remoteDraft
          ? hasUnsavedChanges
            ? 'C\u00f3 thay \u0111\u1ed5i ch\u01b0a l\u01b0u l\u00ean D1'
            : '\u0110\u00e3 \u0111\u1ed3ng b\u1ed9 v\u1edbi D1 - b\u1ea3n ' +
              remoteDraft.version
          : currentAutoLoad?.status === 'empty'
            ? 'Ch\u01b0a c\u00f3 d\u1ef1 th\u1ea3o l\u01b0u tr\u00ean D1'
            : 'Ch\u01b0a x\u00e1c \u0111\u1ecbnh tr\u1ea1ng th\u00e1i D1';

  const controlStyle: React.CSSProperties = {
    minWidth: 170,
    maxWidth: '100%',
    padding: 9,
  };

  return (
    <section style={{
      borderTop: '1px solid #e2e8f0',
      paddingTop: 22,
      marginTop: 22,
      display: 'grid',
      gap: 16,
    }}>
      <div>
        <h3 style={{ margin: '0 0 6px' }}>
          {'Trung t\u00e2m ch\u1ec9 \u0111\u1ea1o \u0111i\u1ec1u h\u00e0nh'}
        </h3>
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          {'L\u1ecdc vi\u1ec7c c\u1ea7n can thi\u1ec7p, ch\u1ecdn nhi\u1ec7m v\u1ee5 v\u00e0 so\u1ea1n b\u1ea3n nh\u00e1p ch\u1ec9 \u0111\u1ea1o.'}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))',
        gap: 10,
      }}>
        {[
          ['\u01afu ti\u00ean cao', 'high'],
          ['Ch\u1edd duy\u1ec7t', 'review'],
          ['S\u1eafp h\u1ea1n', 'soon'],
          ['Thi\u1ebfu th\u00f4ng tin', 'information'],
        ].map(([label, id]) => (
          <button
            key={id}
            type="button"
            aria-pressed={level === id}
            onClick={() => { setLevel(level === id ? 'all' : id); setNotice(''); }}
            style={{
              textAlign: 'left',
              padding: 13,
              borderRadius: 10,
              cursor: 'pointer',
              border: level === id
                ? '2px solid #0d9488'
                : '1px solid #e2e8f0',
              background: '#fff',
            }}
          >
            <span className="muted" style={{ fontSize: 12 }}>
              {label}
            </span>
            <strong style={{ display: 'block', fontSize: 25 }}>
              {entries.filter(entry => entry.level === id).length}
            </strong>
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <label style={{ display: 'grid', gap: 5 }}>
          {'Ph\u00f2ng ban'}
          <select
            style={controlStyle}
            value={department}
            onChange={event => setDepartment(event.target.value)}
          >
            <option value="all">{'T\u1ea5t c\u1ea3'}</option>
            {departments.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 5 }}>
          {'Ng\u01b0\u1eddi ph\u1ee5 tr\u00e1ch'}
          <select
            style={controlStyle}
            value={person}
            onChange={event => setPerson(event.target.value)}
          >
            <option value="all">{'T\u1ea5t c\u1ea3'}</option>
            {owners.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn secondary compact"
          onClick={() => {
            setLevel('all');
            setDepartment('all');
            setPerson('all');
            setSelectedId('');
            setNotice('');
          }}
        >
          {'X\u00f3a b\u1ed9 l\u1ecdc'}
        </button>
      </div>

      {directory?.workspaceId === workspaceId && directory.error && (
        <p role="alert" className="muted">
          {'Danh b\u1ea1 ch\u01b0a t\u1ea3i \u0111\u01b0\u1ee3c; t\u00ean v\u00e0 ph\u00f2ng ban c\u00f3 th\u1ec3 ch\u01b0a \u0111\u1ea7y \u0111\u1ee7.'}
        </p>
      )}

      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        {'Hi\u1ec3n th\u1ecb '}{visible.length}
        {' / '}{entries.length}{' c\u00f4ng vi\u1ec7c c\u1ea7n quan t\u00e2m.'}
      </p>

      <div style={{
        display: 'grid',
        gap: 9,
        maxHeight: 380,
        overflowY: 'auto',
      }}>
        {visible.length === 0 && (
          <p className="muted">
            {'Kh\u00f4ng c\u00f3 c\u00f4ng vi\u1ec7c ph\u00f9 h\u1ee3p b\u1ed9 l\u1ecdc.'}
          </p>
        )}
        {visible.map(entry => (
          <button
            key={entry.task.id}
            type="button"
            onClick={() => { setSelectedId(entry.task.id); setNotice(''); }}
            style={{
              padding: 13,
              borderRadius: 10,
              border: selectedId === entry.task.id
                ? '2px solid #0d9488'
                : '1px solid #e2e8f0',
              background: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'grid',
              gap: 6,
            }}
          >
            <strong>{entry.task.title || entry.task.id}</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              {ownerName(entry.task)}
              {' \u00b7 '}{departmentName(entry.task)}
              {' \u00b7 H\u1ea1n: '}{formatDay(entry.task.due)}
            </span>
            <span style={{ fontSize: 12, color: '#b45309' }}>
              {levelLabels[entry.level]}
              {' \u00b7 '}
              {entry.alerts.map(a => alertLabels[a]).join(', ')}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div style={{
          border: '1px solid #cbd5e1',
          borderRadius: 12,
          padding: 16,
          display: 'grid',
          gap: 12,
        }}>
          <h4 style={{ margin: 0 }}>
            {'So\u1ea1n b\u1ea3n nh\u00e1p ch\u1ec9 \u0111\u1ea1o'}
          </h4>

          <label style={{ display: 'grid', gap: 6, maxWidth: 370 }}>
            {'M\u1ee5c \u0111\u00edch ch\u1ec9 \u0111\u1ea1o'}
            <select
              value={purpose}
              onChange={event => {
                setPurpose(event.target.value as
                  'update' | 'resolve' | 'coordinate');
                setNotice('');
              }}
            >
              <option value="update">
                {'Y\u00eau c\u1ea7u c\u1eadp nh\u1eadt ti\u1ebfn \u0111\u1ed9'}
              </option>
              <option value="resolve">
                {'\u0110\u1ec1 ngh\u1ecb x\u1eed l\u00fd t\u1ed3n \u0111\u1ecdng'}
              </option>
              <option value="coordinate">
                {'Y\u00eau c\u1ea7u ph\u1ed1i h\u1ee3p'}
              </option>
            </select>
          </label>


          <div style={{
            border: '1px solid #99f6e4',
            borderRadius: 12,
            padding: 14,
            display: 'grid',
            gap: 10,
          }}>
            <strong>
              {'L\u01b0u tr\u1eef d\u1ef1 th\u1ea3o tr\u00ean D1'}
            </strong>

            <p className="muted" style={{
              fontSize: 12,
              margin: 0,
            }}>
              {'L\u01b0u th\u1eadt l\u00ean database local/remote theo m\u00f4i tr\u01b0\u1eddng \u0111ang ch\u1ea1y. Kh\u00f4ng ph\u1ea3i ban h\u00e0nh ch\u1ec9 \u0111\u1ea1o.'}
            </p>

            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}>
              <button
                type="button"
                className="btn primary"
                disabled={serverBusy || !draft.trim()}
                onClick={() => void saveServerDraft()}
              >
                {serverBusy
                  ? '\u0110ang x\u1eed l\u00fd...'
                  : 'L\u01b0u l\u00ean D1'}
              </button>

              <button
                type="button"
                className="btn secondary compact"
                disabled={serverBusy}
                onClick={() => void loadServerDraft()}
              >
                {'T\u1ea3i t\u1eeb D1'}
              </button>
            </div>

            {serverDrafts[draftKey] && (
              <p className="muted" style={{
                fontSize: 12,
                margin: 0,
              }}>
                {'Phi\u00ean b\u1ea3n D1: '}
                {serverDrafts[draftKey].version}
                {' \u00b7 C\u1eadp nh\u1eadt: '}
                {serverDrafts[draftKey].updated_at}
              </p>
            )}

            {serverVersions[draftKey]?.length > 0 && (
              <details>
                <summary style={{ cursor: 'pointer' }}>
                  {'L\u1ecbch s\u1eed tr\u00ean D1 ('}
                  {serverVersions[draftKey].length}
                  {')'}
                </summary>
                <div style={{
                  display: 'grid',
                  gap: 8,
                  marginTop: 10,
                }}>
                  {serverVersions[draftKey].map(version => (
                    <div key={version.version} style={{
                      padding: 9,
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}>
                      <span>
                        {'Phi\u00ean b\u1ea3n '}{version.version}
                        {' \u00b7 '}{version.edited_at}
                      </span>
                      <button
                        type="button"
                        className="btn secondary compact"
                        onClick={() => {
                          setEditedDrafts(items => ({
                            ...items,
                            [draftKey]: version.body,
                          }));
                          setServerNotice(
                            '\u0110\u00e3 n\u1ea1p n\u1ed9i dung b\u1ea3n ' +
                            version.version +
                            '. Nh\u1ea5n L\u01b0u l\u00ean D1 \u0111\u1ec3 t\u1ea1o phi\u00ean b\u1ea3n m\u1edbi.'
                          );
                        }}
                      >
                        {'N\u1ea1p n\u1ed9i dung'}
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            )}


            <div
              role="status"
              aria-live="polite"
              style={{
                padding: '9px 11px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: hasUnsavedChanges
                  ? '#fffbeb'
                  : currentAutoLoad?.status === 'error'
                    ? '#fef2f2'
                    : '#f0fdfa',
                color: hasUnsavedChanges
                  ? '#92400e'
                  : currentAutoLoad?.status === 'error'
                    ? '#b91c1c'
                    : '#115e59',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {saveStatusText}
            </div>

            {serverNotice && (
              <p
                role="status"
                aria-live="polite"
                style={{
                  fontSize: 13,
                  margin: 0,
                  padding: 10,
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  color: '#0f172a',
                }}
              >
                {serverNotice}
              </p>
            )}
          </div>

          <textarea
            rows={15}
            value={draft}
            onChange={event => {
              const text = event.target.value;
              setEditedDrafts(current => ({
                ...current,
                [draftKey]: text,
              }));
              setNotice('');
            }}
            aria-label="Noi dung du thao chi dao"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
          />


          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <button
              type="button"
              className="btn secondary compact"
              onClick={saveVersion}
              disabled={!draft.trim()}
            >
              {'L\u01b0u phi\u00ean b\u1ea3n'}
            </button>

            <button
              type="button"
              className="btn secondary compact"
              onClick={resetDraft}
            >
              {'N\u1ea1p l\u1ea1i m\u1eabu'}
            </button>

            <button
              type="button"
              className="btn secondary compact"
              onClick={downloadDraft}
              disabled={!draft.trim()}
            >
              {'T\u1ea3i b\u1ea3n nh\u00e1p TXT'}
            </button>
          </div>

          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 12,
          }}>
            <strong style={{ fontSize: 13 }}>
              {'L\u1ecbch s\u1eed phi\u00ean b\u1ea3n trong phi\u00ean'}
            </strong>

            {versions.length === 0 ? (
              <p className="muted" style={{
                fontSize: 12,
                marginBottom: 0,
              }}>
                {'Ch\u01b0a l\u01b0u phi\u00ean b\u1ea3n n\u00e0o.'}
              </p>
            ) : (
              <div style={{
                marginTop: 10,
                display: 'grid',
                gap: 8,
                maxHeight: 220,
                overflowY: 'auto',
              }}>
                {versions.map(version => (
                  <div key={version.revision} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                    padding: 9,
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 12 }}>
                      {'B\u1ea3n '}{version.revision}
                      {' \u00b7 '}{version.savedAt}
                    </span>

                    <button
                      type="button"
                      className="btn secondary compact"
                      onClick={() => restoreVersion(
                        version.text,
                        version.revision,
                      )}
                    >
                      {'Kh\u00f4i ph\u1ee5c'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => void copyDraft()}
            >
              {'Sao ch\u00e9p b\u1ea3n nh\u00e1p'}
            </button>
            <a
              className="btn secondary compact"
              href={detailUrl(selected.task.id)}
              style={{ textDecoration: 'none' }}
            >
              {'M\u1edf chi ti\u1ebft c\u00f4ng vi\u1ec7c'}
            </a>
          </div>

          {notice && (
            <p role="status" aria-live="polite">{notice}</p>
          )}

          <p className="muted" style={{ fontSize: 11, margin: 0 }}>
            {'Phiên bản chỉ giữ trong bộ nhớ của giao diện hiện tại, tối đa 20 bản mỗi công việc. Tải TXT để giữ nội dung sau khi tải lại trang.'}
          </p>

          <p className="muted" style={{ fontSize: 11, margin: 0 }}>
            {'B\u1ea3n nh\u00e1p ch\u01b0a \u0111\u01b0\u1ee3c g\u1eedi. C\u1ea7n ki\u1ec3m tra ng\u01b0\u1eddi nh\u1eadn, th\u1ea9m quy\u1ec1n v\u00e0 n\u1ed9i dung tr\u01b0\u1edbc khi s\u1eed d\u1ee5ng.'}
          </p>
        </div>
      )}
    </section>
  );
}
