import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardCheck,
  GraduationCap,
  Link2,
  ChartNoAxesCombined,
  Plus,
  Search,
  RefreshCw,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Clock3,
  UserRound,
  UserCheck,
  Settings,
  AlertCircle,
  Megaphone,
  Pin,
  ArrowUp,
  ArrowDown,
  Trash2,
  ArrowUpDown,
  LogOut,
  FileSpreadsheet,
  SlidersHorizontal,
  Pencil
} from 'lucide-react';
import AuthScreen from './AuthScreen';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && anon ? createClient(url, anon) : null;

const nav = [
  ['dashboard', '대시보드', LayoutDashboard],
  ['schedules', '사업단 일정', CalendarDays],
  ['participants', '참여자 관리', Users],
  ['attendance', '출결 관리', ClipboardCheck],
  ['consultations', '사후연계', Link2],
  ['followups', '사후관리', GraduationCap],
  ['managers', '담당자 관리', UserCheck],
  ['stats', '성과 통계', ChartNoAxesCombined],
  ['settings', '사이트 설정', Settings]
];

const DEFAULT_MENU_ORDER = nav.filter(([id]) => id !== 'settings').map(([id]) => id);

const SCHEDULE_CATEGORIES = ['프로그램', '사후관리', '행사', '기타'];
const MANAGER_ROLES = ['선임 매니저', '매니저'];

const DEFAULT_COHORT_OPTIONS = ['1기', '2기', '3기', '4기'];

const LINKAGE_PROGRAM_PRESETS = [
  '국민취업지원제도',
  '미래내일 일경험',
  '직업훈련',
  '구직자 도약 패키지'
];

const LINKAGE_DOC_STATUSES = ['서류 제출전', '서류 제출완료'];

const COHORT_PALETTE = [
  { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
  { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' },
  { bg: '#f0f9ff', text: '#075985', border: '#bae6fd' }
];

const PROGRAM_PALETTE = {
  '국민취업지원제도': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  '미래내일 일경험': { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  '직업훈련': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  '구직자 도약 패키지': { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' }
};

const getCohortStyle = (cohort) => {
  const str = String(cohort || '').trim();
  if (!str) return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return COHORT_PALETTE[hash % COHORT_PALETTE.length];
};

const getProgramStyle = (program) => {
  const key = String(program || '').trim();
  if (PROGRAM_PALETTE[key]) return PROGRAM_PALETTE[key];
  if (!key) return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 37 + key.charCodeAt(i)) >>> 0;
  }
  return COHORT_PALETTE[hash % COHORT_PALETTE.length];
};

const CATEGORY_STYLES = {
  '프로그램': {
    bg: '#eef4ff',
    border: '#60a5fa',
    text: '#1d4ed8',
    badgeBg: '#dbeafe',
    badgeText: '#1e40af'
  },
  '사후관리': {
    bg: '#ecfdf5',
    border: '#34d399',
    text: '#047857',
    badgeBg: '#d1fae5',
    badgeText: '#065f46'
  },
  '행사': {
    bg: '#fff7ed',
    border: '#fb923c',
    text: '#c2410c',
    badgeBg: '#ffedd5',
    badgeText: '#9a3412'
  },
  '기타': {
    bg: '#f3f4f6',
    border: '#9ca3af',
    text: '#374151',
    badgeBg: '#e5e7eb',
    badgeText: '#1f2937'
  }
};

const getCategoryStyle = (category) =>
  CATEGORY_STYLES[category] || CATEGORY_STYLES['기타'];

const HALF_HOUR_TIMES = Array.from({ length: 48 }, (_, idx) => {
  const h = String(Math.floor(idx / 2)).padStart(2, '0');
  const m = idx % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const snapToHalfHour = (timeStr) => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return '09:00';
  const [hh, mm] = timeStr.split(':').map(Number);
  const totalMinutes = Math.min(23 * 60 + 30, Math.max(0, hh * 60 + mm));
  const rounded = Math.round(totalMinutes / 30) * 30;
  const clamped = Math.min(23 * 60 + 30, rounded);
  const outH = String(Math.floor(clamped / 60)).padStart(2, '0');
  const outM = String(clamped % 60).padStart(2, '0');
  return `${outH}:${outM}`;
};

const addHalfHour = (timeStr) => {
  const snapped = snapToHalfHour(timeStr);
  const idx = HALF_HOUR_TIMES.indexOf(snapped);
  if (idx === -1 || idx >= HALF_HOUR_TIMES.length - 1) return '23:30';
  return HALF_HOUR_TIMES[idx + 1];
};

const hasExplicitTime = (rawStr) => {
  if (!rawStr) return false;
  const s = String(rawStr);
  if (!s.includes('T')) return false;
  const timePart = s.split('T')[1] || '';
  return /^\d{2}:\d{2}/.test(timePart);
};

const pad2 = (n) => String(n).padStart(2, '0');
const formatLocalDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = formatLocalDate(new Date());

const normalizeDateInput = (val) => {
  if (!val) return '';
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return formatLocalDate(val);
  }
  const s = String(val).trim().replace(/\./g, '-').replace(/\//g, '-');
  const match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return `${match[1]}-${pad2(Number(match[2]))}-${pad2(Number(match[3]))}`;
  }
  return '';
};

const parseRangeFromSchedule = (record) => {
  const fallbackDate = today;
  const startRaw = record?.start_at || `${fallbackDate}T09:00`;
  const [rawStartDate = fallbackDate, rawStartTimePart = '09:00'] = String(startRaw).split('T');
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(rawStartDate) ? rawStartDate : fallbackDate;
  const startTime = snapToHalfHour(rawStartTimePart.slice(0, 5));

  const endRaw = record?.end_at || `${startDate}T${addHalfHour(startTime)}`;
  const [rawEndDate = startDate, rawEndTimePart = addHalfHour(startTime)] = String(endRaw).split('T');
  const endDate = /^\d{4}-\d{2}-\d{2}$/.test(rawEndDate) ? rawEndDate : startDate;
  const endTime = snapToHalfHour(rawEndTimePart.slice(0, 5));

  const timeEnabled = record?.all_day === true ? false : hasExplicitTime(record?.start_at);

  return { startDate, startTime, endDate, endTime, timeEnabled };
};

const DEFAULT_RECRUIT_COHORTS = {
  '1기': { short: '2026.12.01 ~ 2026.12.14', mid: '2026.12.01 ~ 2026.12.20', long: '2026.12.01 ~ 2026.12.28' },
  '2기': { short: '', mid: '', long: '' },
  '3기': { short: '', mid: '', long: '' },
  '4기': { short: '', mid: '', long: '' }
};

const DEFAULT_DASHBOARD_CONFIG = {
  notices: [
    {
      id: 'n1',
      title: '이번 주 프로그램 운영 안내',
      content: '각 기수별 출결 및 상담 일지를 금요일 오후 5시까지 등록해 주세요.',
      pinned: true
    }
  ],
  banner_image: '',
  today_section_title: '오늘의 일정',
  today_section_sub: '당일 예정된 세부 일정 및 건수',
  week_section_title: '이번주 주요 일정',
  week_section_sub: '이번 주 예정 프로그램 및 세부 일정',
  followup_section_title: '사후관리 활동 현황',
  followup_target: 20,
  followup_schedule_keyword: '사후관리',
  recruit_section_title: '참여자 모집 일정',
  recruit_default_cohort: '1기',
  recruit_cohorts: DEFAULT_RECRUIT_COHORTS
};

const DEFAULT_SETTINGS = {
  id: 'default',
  brand_title: '청도지 WORKSPACE',
  brand_subtitle: 'TEAM MANAGEMENT',
  welcome_title: '안녕하세요, 오늘도 함께 시작해요.',
  welcome_subtitle: '청도지 사업단의 주요 현황을 한눈에 확인할 수 있습니다.',
  hidden_menus: [],
  custom_labels: {},
  menu_order: DEFAULT_MENU_ORDER,
  dashboard_config: DEFAULT_DASHBOARD_CONFIG
};

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day + 6) % 7;
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon);
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  return {
    start: formatLocalDate(mon),
    end: formatLocalDate(sun)
  };
};

const formatKoreanDateShort = (isoStr) => {
  if (!isoStr) return '';
  const datePart = String(isoStr).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [y, m, d] = datePart.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${m}월 ${d}일(${days[dt.getDay()]})`;
  }
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return datePart;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]})`;
};

const formatTimeShort = (schedule) => {
  if (!schedule) return '';
  if (schedule.all_day === true) return '';
  const isoStr = typeof schedule === 'string' ? schedule : schedule.start_at;
  if (!isoStr) return '';
  const s = String(isoStr);
  if (!s.includes('T')) return '';
  const part = s.split('T')[1];
  if (part && /^\d{2}:\d{2}/.test(part)) return part.slice(0, 5);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const formatScheduleTimeRange = (schedule) => {
  if (!schedule) return '';
  if (schedule.all_day === true || !hasExplicitTime(schedule.start_at)) {
    return '';
  }
  const startT = formatTimeShort(schedule.start_at);
  const endT = schedule.end_at && hasExplicitTime(schedule.end_at) ? formatTimeShort(schedule.end_at) : '';
  return startT ? (endT ? `${startT}~${endT}` : startT) : '';
};

const normalizeMenuOrder = (rawOrder) => {
  const base = Array.isArray(rawOrder) ? rawOrder.filter((id) => DEFAULT_MENU_ORDER.includes(id)) : [];
  const missing = DEFAULT_MENU_ORDER.filter((id) => !base.includes(id));
  return [...base, ...missing];
};

const normalizeDashboardConfig = (raw) => {
  const incoming = raw && typeof raw === 'object' ? raw : {};
  const cohorts = { ...DEFAULT_RECRUIT_COHORTS };
  if (incoming.recruit_cohorts && typeof incoming.recruit_cohorts === 'object') {
    Object.entries(incoming.recruit_cohorts).forEach(([k, v]) => {
      cohorts[k] = {
        short: v?.short || '',
        mid: v?.mid || '',
        long: v?.long || ''
      };
    });
  } else if (incoming.recruit_short || incoming.recruit_mid || incoming.recruit_long) {
    cohorts['1기'] = {
      short: (incoming.recruit_short || '').replace(/\s*\([^)]*\)/g, '').trim(),
      mid: (incoming.recruit_mid || '').replace(/\s*\([^)]*\)/g, '').trim(),
      long: (incoming.recruit_long || '').replace(/\s*\([^)]*\)/g, '').trim()
    };
  }

  return {
    ...DEFAULT_DASHBOARD_CONFIG,
    ...incoming,
    banner_image: typeof incoming.banner_image === 'string' ? incoming.banner_image : '',
    notices: Array.isArray(incoming.notices)
      ? incoming.notices.map((n, i) => ({
          id: n.id || 'n_' + i,
          title: n.title || '',
          content: n.content || '',
          pinned: Boolean(n.pinned)
        }))
      : DEFAULT_DASHBOARD_CONFIG.notices,
    recruit_cohorts: cohorts
  };
};

const parseLinkageMeta = (record) => {
  let meta = {};
  if (record?.next_action && typeof record.next_action === 'string') {
    const trimmed = record.next_action.trim();
    if (trimmed.startsWith('{')) {
      try {
        meta = JSON.parse(trimmed);
      } catch (_) {
        meta = { note: trimmed };
      }
    } else if (trimmed) {
      meta = { note: trimmed };
    }
  }
  const participantName = record?.participant_name || meta.participant_name || '';
  const cohort = record?.cohort || meta.cohort || '1기';
  const program =
    record?.category && record.category !== '기타'
      ? record.category
      : meta.program || record?.category || '국민취업지원제도';
  const docStatus = LINKAGE_DOC_STATUSES.includes(meta.doc_status)
    ? meta.doc_status
    : '서류 제출전';
  const completed = Boolean(meta.completed);
  const note =
    record?.content !== undefined && record?.content !== null
      ? String(record.content)
      : String(meta.note || '');

  return {
    participant_name: participantName,
    cohort,
    program,
    doc_status: docStatus,
    completed,
    note
  };
};

const parseFollowupDates = (record) => {
  let parsed = {};
  if (record?.memo && typeof record.memo === 'string') {
    const trimmed = record.memo.trim();
    if (trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (_) {
        parsed = { note: trimmed };
      }
    } else if (trimmed) {
      parsed = { note: trimmed };
    }
  }
  return {
    participant_name: record?.participant_name || parsed.participant_name || '',
    cohort: record?.cohort || parsed.cohort || '1기',
    program: parsed.program || '',
    round1_date: normalizeDateInput(parsed.round1_date || ''),
    round2_date: normalizeDateInput(parsed.round2_date || ''),
    round3_date: normalizeDateInput(parsed.round3_date || ''),
    note: parsed.note !== undefined ? String(parsed.note) : String(record?.activity_name || '')
  };
};

const normalizeRowsFromCells = (cellsMatrix) => {
  const rowsClean = (cellsMatrix || [])
    .map((r) => (Array.isArray(r) ? r.map((c) => (c == null ? '' : String(c).trim())) : []))
    .filter((r) => r.some((c) => c !== ''));

  if (!rowsClean.length) return [];

  const firstCells = rowsClean[0].map((c) => c.replace(/\s+/g, ''));
  const hasHeader =
    firstCells.includes('이름') ||
    firstCells.includes('성명') ||
    firstCells.includes('참여자') ||
    firstCells.toLowerCase().includes('name');

  return hasHeader ? rowsClean.slice(1) : rowsClean;
};

const parseSpreadsheetText = (rawText) => {
  const lines = String(rawText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
  if (!lines.length) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const splitRow = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  return normalizeRowsFromCells(lines.map(splitRow));
};

const emptyForms = {
  participants: { name: '', phone: '', cohort: '1기', manager: '', status: '참여중', memo: '' },
  schedules: {
    title: '',
    category: '프로그램',
    timeEnabled: true,
    startDate: today,
    startTime: '09:00',
    endDate: today,
    endTime: '10:00',
    start_at: today + 'T09:00',
    end_at: today + 'T10:00',
    location: '',
    expected_count: 0,
    managers: [],
    description: ''
  },
  attendance: { participant_id: '', attend_date: today, status: '출석', memo: '' },
  consultations: {
    participant_id: '',
    participant_name: '',
    cohort: '1기',
    program: '국민취업지원제도',
    customProgram: '',
    doc_status: '서류 제출전',
    completed: false,
    note: ''
  },
  followups: {
    participant_id: '',
    participant_name: '',
    cohort: '1기',
    program: '',
    round1_date: '',
    round2_date: '',
    round3_date: '',
    note: ''
  },
  managers: { name: '', role: '매니저', memo: '' }
};

const tableByPage = {
  participants: 'participants',
  schedules: 'schedules',
  attendance: 'attendance',
  consultations: 'consultations',
  followups: 'followups',
  managers: 'managers'
};

const titles = {
  participants: '참여자 관리',
  schedules: '사업단 일정',
  attendance: '출결 관리',
  consultations: '사후연계',
  followups: '사후관리',
  managers: '담당자 관리',
  settings: '사이트 설정'
};

const stripRolePrefix = (rawName) =>
  String(rawName || '')
    .replace(/^\[(선임\s*매니저|매니저)\]\s*/g, '')
    .trim();

const extractScheduleManagers = (schedule) => {
  if (!schedule) return [];
  if (Array.isArray(schedule.managers)) {
    return schedule.managers
      .map((item) => (typeof item === 'string' ? item : item?.name))
      .map(stripRolePrefix)
      .filter(Boolean);
  }
  if (typeof schedule.managers === 'string' && schedule.managers.trim()) {
    try {
      const parsed = JSON.parse(schedule.managers);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => stripRolePrefix(v)).filter(Boolean);
      }
    } catch (_) {
      return schedule.managers
        .split(',')
        .map((s) => stripRolePrefix(s))
        .filter(Boolean);
    }
  }
  if (typeof schedule.manager === 'string' && schedule.manager.trim()) {
    return schedule.manager
      .split(',')
      .map((s) => stripRolePrefix(s))
      .filter(Boolean);
  }
  return [];
};

function App() {
  const [page, setPage] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session || null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const currentUserId = session?.user?.id || null;

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const [rows, setRows] = useState({
    participants: [],
    schedules: [],
    attendance: [],
    consultations: [],
    followups: [],
    managers: []
  });
  const [siteConfig, setSiteConfig] = useState(DEFAULT_SETTINGS);
  const [savedNotice, setSavedNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPreviewRows, setBulkPreviewRows] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [manageModal, setManageModal] = useState(false);
  const [selectedManageIds, setSelectedManageIds] = useState([]);
  const excelFileInputRef = useRef(null);

  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [managerSort, setManagerSort] = useState({ key: 'name', direction: 'asc' });
  const [linkageSort, setLinkageSort] = useState({ key: 'name', direction: 'asc' });
  const [followupSort, setFollowupSort] = useState({ key: 'name', direction: 'asc' });
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  const cohortOptions = useMemo(() => {
    const set = new Set(DEFAULT_COHORT_OPTIONS);
    (rows.participants || []).forEach((p) => {
      if (p.cohort) set.add(String(p.cohort).trim());
    });
    Object.keys(siteConfig?.dashboard_config?.recruit_cohorts || {}).forEach((ck) => {
      if (ck) set.add(String(ck).trim());
    });
    return Array.from(set);
  }, [rows.participants, siteConfig?.dashboard_config?.recruit_cohorts]);

  const loadSettings = async () => {
    if (!supabase) return;
    const { data, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (!settingsError && data) {
      const normalizedDash = normalizeDashboardConfig(data.dashboard_config);
      const savedOrder = data.menu_order || normalizedDash.menu_order;
      setSiteConfig({
        ...DEFAULT_SETTINGS,
        ...data,
        hidden_menus: Array.isArray(data.hidden_menus) ? data.hidden_menus : [],
        custom_labels: data.custom_labels && typeof data.custom_labels === 'object' ? data.custom_labels : {},
        menu_order: normalizeMenuOrder(savedOrder),
        dashboard_config: normalizedDash
      });
    }
  };

  const load = async (uid = currentUserId) => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    const names = ['participants', 'schedules', 'attendance', 'consultations', 'followups', 'managers'];
    const results = await Promise.all(
      names.map((n) => {
        if (n === 'managers') {
          return supabase.from(n).select('*').order('name', { ascending: true }).limit(500);
        }
        const orderCol =
          n === 'schedules'
            ? 'start_at'
            : n === 'participants'
            ? 'created_at'
            : n === 'attendance'
            ? 'attend_date'
            : n === 'consultations'
            ? 'consulted_at'
            : 'activity_date';
        let q = supabase.from(n).select('*').order(orderCol, { ascending: false }).limit(500);
        if ((n === 'consultations' || n === 'followups') && uid) {
          q = q.eq('user_id', uid);
        }
        return q;
      })
    );

    const nextRows = {
      participants: [],
      schedules: [],
      attendance: [],
      consultations: [],
      followups: [],
      managers: []
    };
    const errors = [];

    names.forEach((n, idx) => {
      if (results[idx].error) {
        if (n === 'managers' && /does not exist|schema cache/i.test(results[idx].error.message)) {
          nextRows.managers = [];
        } else {
          errors.push(`${n}: ${results[idx].error.message}`);
        }
      } else {
        nextRows[n] = results[idx].data || [];
      }
    });

    if (errors.length) {
      setError(errors.join(' / '));
    }
    setRows(nextRows);
    await loadSettings();
    setLoading(false);
  };

  useEffect(() => {
    if (!authReady) return;
    load(currentUserId);
  }, [authReady, currentUserId]);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel('workspace-live')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => load(currentUserId))
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [currentUserId]);

  const saveSettings = async (nextConfig) => {
    if (!supabase) return;
    setError('');
    setSavedNotice('');
    const orderedMenus = normalizeMenuOrder(nextConfig.menu_order);
    const mergedDash = {
      ...normalizeDashboardConfig(nextConfig.dashboard_config),
      menu_order: orderedMenus
    };
    const dbPayload = {
      id: 'default',
      brand_title: nextConfig.brand_title,
      brand_subtitle: nextConfig.brand_subtitle,
      welcome_title: nextConfig.welcome_title,
      welcome_subtitle: nextConfig.welcome_subtitle,
      hidden_menus: nextConfig.hidden_menus || [],
      custom_labels: nextConfig.custom_labels || {},
      dashboard_config: mergedDash,
      updated_at: new Date().toISOString()
    };

    const { error: saveError } = await supabase
      .from('site_settings')
      .upsert(dbPayload, { onConflict: 'id' });
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setSiteConfig({
      ...dbPayload,
      menu_order: orderedMenus
    });
    setSavedNotice('설정이 저장되었습니다.');
  };

  const resolveParticipantName = (record) => {
    if (record?.participant_id) {
      const found = rows.participants.find((p) => p.id === record.participant_id);
      if (found?.name) return found.name;
    }
    if (record?.participant_name) return record.participant_name;
    if (record?.memo) {
      const trimmed = String(record.memo).trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.participant_name) return parsed.participant_name;
        } catch (_) {}
      }
    }
    if (record?.next_action) {
      const trimmed = String(record.next_action).trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.participant_name) return parsed.participant_name;
        } catch (_) {}
      }
    }
    return '참여자 정보 없음';
  };

  const getLinkedProgramForParticipant = (participantName, fallbackProg = '') => {
    if (fallbackProg) return fallbackProg;
    const cleanName = String(participantName || '').trim();
    if (!cleanName) return '';
    const match = (rows.consultations || []).find((c) => {
      const m = parseLinkageMeta(c);
      return String(m.participant_name || '').trim() === cleanName;
    });
    return match ? parseLinkageMeta(match).program : '';
  };

  const openNew = () => {
    const targetTable = tableByPage[page] || 'schedules';
    setEditing(null);
    setShowNameSuggestions(false);

    if (targetTable === 'schedules') {
      setForm({
        ...emptyForms.schedules,
        category: SCHEDULE_CATEGORIES[0],
        timeEnabled: true,
        startDate: today,
        startTime: '09:00',
        endDate: today,
        endTime: '10:00',
        managers: []
      });
    } else if (targetTable === 'managers') {
      setForm({
        ...emptyForms.managers,
        role: '매니저'
      });
    } else if (targetTable === 'consultations') {
      setForm({
        ...emptyForms.consultations,
        cohort: '1기',
        program: LINKAGE_PROGRAM_PRESETS[0],
        customProgram: '',
        doc_status: '서류 제출전',
        completed: false,
        note: ''
      });
    } else if (targetTable === 'followups') {
      setForm({
        ...emptyForms.followups,
        cohort: '1기',
        program: '',
        round1_date: '',
        round2_date: '',
        round3_date: '',
        note: ''
      });
    } else {
      setForm({ ...(emptyForms[targetTable] || {}) });
    }
    setModal(true);
  };

  const openNewOnDate = (dateStr) => {
    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : today;
    setPage('schedules');
    setEditing(null);
    setForm({
      ...emptyForms.schedules,
      category: SCHEDULE_CATEGORIES[0],
      timeEnabled: true,
      startDate: safeDate,
      startTime: '09:00',
      endDate: safeDate,
      endTime: '10:00',
      managers: []
    });
    setModal(true);
  };

  const openEdit = (r, explicitPage = null) => {
    const activePage = explicitPage || page;
    const targetTable = tableByPage[activePage] || 'schedules';
    setEditing(r.id);
    setShowNameSuggestions(false);

    if (targetTable === 'schedules') {
      const range = parseRangeFromSchedule(r);
      const safeCategory = SCHEDULE_CATEGORIES.includes(r.category) ? r.category : SCHEDULE_CATEGORIES[0];
      setForm({
        ...emptyForms.schedules,
        ...r,
        category: safeCategory,
        timeEnabled: range.timeEnabled,
        startDate: range.startDate,
        startTime: range.startTime,
        endDate: range.endDate,
        endTime: range.endTime,
        managers: extractScheduleManagers(r)
      });
    } else if (targetTable === 'managers') {
      const safeRole = MANAGER_ROLES.includes(r.role) ? r.role : '매니저';
      setForm({
        ...emptyForms.managers,
        ...r,
        role: safeRole
      });
    } else if (targetTable === 'consultations') {
      const meta = parseLinkageMeta(r);
      const isPreset = LINKAGE_PROGRAM_PRESETS.includes(meta.program);
      setForm({
        ...emptyForms.consultations,
        ...r,
        participant_name: meta.participant_name || resolveParticipantName(r),
        cohort: meta.cohort || '1기',
        program: isPreset ? meta.program : '직접 입력',
        customProgram: isPreset ? '' : meta.program,
        doc_status: meta.doc_status,
        completed: meta.completed,
        note: meta.note
      });
    } else if (targetTable === 'followups') {
      const fu = parseFollowupDates(r);
      setForm({
        ...emptyForms.followups,
        ...r,
        participant_name: fu.participant_name || resolveParticipantName(r),
        cohort: fu.cohort || '1기',
        program: fu.program || '',
        round1_date: fu.round1_date,
        round2_date: fu.round2_date,
        round3_date: fu.round3_date,
        note: fu.note
      });
    } else {
      setForm({ ...r });
    }
    setModal(true);
  };

  const buildLinkagePayload = (srcForm, actorName, ownerId = currentUserId) => {
    const chosenProgram =
      srcForm.program === '직접 입력'
        ? String(srcForm.customProgram || '').trim() || '기타'
        : srcForm.program || LINKAGE_PROGRAM_PRESETS[0];

    const docStatus = LINKAGE_DOC_STATUSES.includes(srcForm.doc_status)
      ? srcForm.doc_status
      : '서류 제출전';

    const completed = Boolean(srcForm.completed);
    const participantName = String(srcForm.participant_name || '').trim();
    const cohort = String(srcForm.cohort || '1기').trim();
    const note = String(srcForm.note || '').trim();

    const matchedParticipant = rows.participants.find(
      (p) => String(p.name || '').trim() === participantName
    );

    const metaJson = JSON.stringify({
      participant_name: participantName,
      cohort,
      program: chosenProgram,
      doc_status: docStatus,
      completed,
      note
    });

    const base = {
      participant_id: matchedParticipant?.id || srcForm.participant_id || null,
      consulted_at: srcForm.consulted_at || today,
      manager: srcForm.manager || actorName || '담당자',
      category: chosenProgram,
      content: note,
      next_action: metaJson
    };

    if (ownerId) {
      base.user_id = srcForm.user_id || ownerId;
    }
    return base;
  };

  const buildFollowupPayload = (srcForm, actorName, ownerId = currentUserId) => {
    const participantName = String(srcForm.participant_name || '').trim();
    const cohort = String(srcForm.cohort || '1기').trim();
    const program = String(srcForm.program || '').trim();
    const round1_date = normalizeDateInput(srcForm.round1_date || '');
    const round2_date = normalizeDateInput(srcForm.round2_date || '');
    const round3_date = normalizeDateInput(srcForm.round3_date || '');
    const note = String(srcForm.note || '').trim();

    const matchedParticipant = rows.participants.find(
      (p) => String(p.name || '').trim() === participantName
    );

    const memoJson = JSON.stringify({
      participant_name: participantName,
      cohort,
      program,
      round1_date,
      round2_date,
      round3_date,
      note
    });

    const latestDate = round3_date || round2_date || round1_date || srcForm.activity_date || today;

    const base = {
      participant_id: matchedParticipant?.id || srcForm.participant_id || null,
      activity_date: latestDate,
      activity_name: note || '사후관리',
      status: actorName || '참여',
      memo: memoJson
    };

    if (ownerId) {
      base.user_id = srcForm.user_id || ownerId;
    }
    return base;
  };

  const save = async (e) => {
    e.preventDefault();
    const table = tableByPage[page];
    if (!table || !supabase) return;

    if ((table === 'consultations' || table === 'followups') && !currentUserId) {
      setError('로그인 정보가 확인되지 않아 개인 데이터를 저장할 수 없습니다.');
      return;
    }

    const actorName = session?.user?.user_metadata?.full_name || '담당자';
    let payload = { ...form };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    if (table === 'schedules') {
      const startDate = payload.startDate || today;
      const endDate = payload.endDate || startDate;
      const timeEnabled = payload.timeEnabled !== false;

      if (!timeEnabled) {
        payload.start_at = startDate;
        payload.end_at = endDate < startDate ? startDate : endDate;
      } else {
        const startTime = snapToHalfHour(payload.startTime || '09:00');
        let endTime = snapToHalfHour(payload.endTime || addHalfHour(startTime));

        const startIsoLocal = `${startDate}T${startTime}`;
        let endIsoLocal = `${endDate}T${endTime}`;
        if (endIsoLocal < startIsoLocal) {
          endTime = addHalfHour(startTime);
          endIsoLocal = `${startDate}T${endTime}`;
        }

        payload.start_at = startIsoLocal;
        payload.end_at = endIsoLocal;
      }

      payload.category = SCHEDULE_CATEGORIES.includes(payload.category) ? payload.category : '프로그램';
      payload.expected_count =
        payload.expected_count !== undefined && payload.expected_count !== ''
          ? Number(payload.expected_count) || 0
          : 0;
      payload.managers = Array.isArray(payload.managers)
        ? payload.managers.map(stripRolePrefix).filter(Boolean)
        : [];

      delete payload.timeEnabled;
      delete payload.startDate;
      delete payload.startTime;
      delete payload.endDate;
      delete payload.endTime;
    } else if (table === 'managers') {
      payload.role = MANAGER_ROLES.includes(payload.role) ? payload.role : '매니저';
      delete payload.phone;
    } else if (table === 'consultations') {
      payload = buildLinkagePayload(form, actorName, currentUserId);
    } else if (table === 'followups') {
      payload = buildFollowupPayload(form, actorName, currentUserId);
    }

    if (editing) {
      let upQuery = supabase.from(table).update(payload).eq('id', editing);
      if ((table === 'consultations' || table === 'followups') && currentUserId) {
        upQuery = upQuery.eq('user_id', currentUserId);
      }
      const { error: upError } = await upQuery;
      if (upError) {
        setError(upError.message);
        return;
      }
    } else {
      const { error: insError } = await supabase.from(table).insert(payload);
      if (insError) {
        setError(insError.message);
        return;
      }
    }
    setModal(false);
    await load(currentUserId);
  };

  const updateLinkageRowInline = async (row, patchMeta) => {
    if (!supabase || !row?.id) return;
    const currentMeta = parseLinkageMeta(row);
    const nextMeta = { ...currentMeta, ...patchMeta };
    const updatedPayload = {
      category: nextMeta.program,
      content: nextMeta.note,
      next_action: JSON.stringify(nextMeta)
    };
    let q = supabase.from('consultations').update(updatedPayload).eq('id', row.id);
    if (currentUserId) q = q.eq('user_id', currentUserId);
    const { error: upErr } = await q;
    if (upErr) {
      setError(upErr.message);
      return;
    }
    await load(currentUserId);
  };

  const updateFollowupRoundInline = async (row, patchMeta) => {
    if (!supabase || !row?.id) return;
    const currentMeta = parseFollowupDates(row);
    const nextMeta = { ...currentMeta, ...patchMeta };
    const latestDate =
      nextMeta.round3_date || nextMeta.round2_date || nextMeta.round1_date || row.activity_date || today;
    const updatedPayload = {
      activity_date: latestDate,
      activity_name: nextMeta.note || '사후관리',
      memo: JSON.stringify(nextMeta)
    };
    let q = supabase.from('followups').update(updatedPayload).eq('id', row.id);
    if (currentUserId) q = q.eq('user_id', currentUserId);
    const { error: upErr } = await q;
    if (upErr) {
      setError(upErr.message);
      return;
    }
    await load(currentUserId);
  };

  const syncBulkTextAndPreview = (textVal) => {
    setBulkText(textVal);
    setBulkPreviewRows(parseSpreadsheetText(textVal));
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    if ((page === 'consultations' || page === 'followups') && !currentUserId) {
      setError('로그인 정보가 확인되지 않아 일괄 등록할 수 없습니다.');
      return;
    }

    const rowsToImport = bulkPreviewRows.length ? bulkPreviewRows : parseSpreadsheetText(bulkText);
    if (!rowsToImport.length) {
      setError('등록할 행 데이터를 입력하거나 파일을 선택해 주세요.');
      return;
    }

    const actorName = session?.user?.user_metadata?.full_name || '담당자';
    setBulkBusy(true);
    setError('');

    try {
      if (page === 'consultations') {
        const insertList = rowsToImport
          .map((cells) => {
            const nameVal = String(cells[0] || '').trim();
            if (!nameVal) return null;
            const cohortVal = String(cells[1] || '1기').trim() || '1기';
            const programVal = String(cells[2] || LINKAGE_PROGRAM_PRESETS[0]).trim() || LINKAGE_PROGRAM_PRESETS[0];
            const rawDoc = String(cells[3] || '').trim();
            const docVal =
              LINKAGE_DOC_STATUSES.includes(rawDoc)
                ? rawDoc
                : /완료/.test(rawDoc)
                ? '서류 제출완료'
                : '서류 제출전';
            const noteVal = String(cells[4] || '').trim();
            const completedVal = /^(y|yes|true|1|완료|o)$/i.test(String(cells[5] || '').trim());

            return buildLinkagePayload(
              {
                participant_name: nameVal,
                cohort: cohortVal,
                program: LINKAGE_PROGRAM_PRESETS.includes(programVal) ? programVal : '직접 입력',
                customProgram: LINKAGE_PROGRAM_PRESETS.includes(programVal) ? '' : programVal,
                doc_status: docVal,
                completed: completedVal,
                note: noteVal
              },
              actorName,
              currentUserId
            );
          })
          .filter(Boolean);

        if (!insertList.length) {
          setError('유효한 참여자 이름 행이 없습니다.');
          return;
        }
        const { error: insErr } = await supabase.from('consultations').insert(insertList);
        if (insErr) {
          setError(insErr.message);
          return;
        }
      } else if (page === 'followups') {
        const insertList = rowsToImport
          .map((cells) => {
            const nameVal = String(cells[0] || '').trim();
            if (!nameVal) return null;
            const cohortVal = String(cells[1] || '1기').trim() || '1기';
            const r1 = normalizeDateInput(cells[2] || '');
            const r2 = normalizeDateInput(cells[3] || '');
            const r3 = normalizeDateInput(cells[4] || '');
            const noteVal = String(cells[5] || '').trim();
            const programVal = String(cells[6] || '').trim();

            return buildFollowupPayload(
              {
                participant_name: nameVal,
                cohort: cohortVal,
                program: programVal,
                round1_date: r1,
                round2_date: r2,
                round3_date: r3,
                note: noteVal
              },
              actorName,
              currentUserId
            );
          })
          .filter(Boolean);

        if (!insertList.length) {
          setError('유효한 참여자 이름 행이 없습니다.');
          return;
        }
        const { error: insErr } = await supabase.from('followups').insert(insertList);
        if (insErr) {
          setError(insErr.message);
          return;
        }
      }

      setBulkModal(false);
      setBulkText('');
      setBulkPreviewRows([]);
      await load(currentUserId);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExcelFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const lowerName = String(file.name || '').toLowerCase();
    const isBinaryExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

    try {
      if (isBinaryExcel) {
        setError(
          '.xlsx/.xls 파일 직접 업로드는 현재 미지원입니다. 엑셀 시트에서 행을 드래그해 복사(Ctrl+C) 후 붙여넣기 하거나, CSV(.csv) 파일로 저장해 업로드해 주세요.'
        );
        e.target.value = '';
        return;
      }

      const text = await file.text();
      syncBulkTextAndPreview(text);
    } catch (err) {
      setError(`파일을 읽는 중 오류가 발생했습니다: ${err?.message || '알 수 없는 오류'}`);
    } finally {
      e.target.value = '';
    }
  };

  const remove = async (id) => {
    if (!id || !supabase) return;
    const table = tableByPage[page];
    if (!table) return;
    if (!confirm('이 항목을 삭제할까요?')) return;
    let delQuery = supabase.from(table).delete().eq('id', id);
    if ((table === 'consultations' || table === 'followups') && currentUserId) {
      delQuery = delQuery.eq('user_id', currentUserId);
    }
    const { error: delError } = await delQuery;
    if (delError) {
      setError(delError.message);
      return;
    }
    setModal(false);
    setSelectedManageIds((prev) => prev.filter((itemId) => itemId !== id));
    await load(currentUserId);
  };

  const handleBulkDeleteSelected = async () => {
    if (!supabase || !selectedManageIds.length) return;
    const table = tableByPage[page];
    if (!table) return;
    if (!confirm(`선택한 ${selectedManageIds.length}건을 일괄 삭제할까요?`)) return;

    let delQuery = supabase.from(table).delete().in('id', selectedManageIds);
    if ((table === 'consultations' || table === 'followups') && currentUserId) {
      delQuery = delQuery.eq('user_id', currentUserId);
    }
    const { error: delErr } = await delQuery;
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setSelectedManageIds([]);
    await load(currentUserId);
  };

  const toggleSelectManageRow = (id) => {
    setSelectedManageIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllManageRows = (allRows) => {
    const allIds = allRows.map((r) => r.id).filter(Boolean);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedManageIds.includes(id));
    setSelectedManageIds(allSelected ? [] : allIds);
  };

  const toggleFormManager = (managerName) => {
    const cleanName = stripRolePrefix(managerName);
    const current = Array.isArray(form.managers) ? form.managers.map(stripRolePrefix) : [];
    const exists = current.includes(cleanName);
    const next = exists ? current.filter((m) => m !== cleanName) : [...current, cleanName];
    setForm({ ...form, managers: next });
  };

  const handleManagerSort = (key) => {
    setManagerSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleLinkageSort = (key) => {
    setLinkageSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleFollowupSort = (key) => {
    setFollowupSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const participantName = (id) => rows.participants.find((p) => p.id === id)?.name || '참여자 정보 없음';

  const getMenuLabel = (id, defaultLabel) => siteConfig.custom_labels?.[id]?.trim() || defaultLabel;

  const orderedNav = useMemo(() => {
    const order = normalizeMenuOrder(siteConfig.menu_order);
    const navMap = Object.fromEntries(nav.map((item) => [item[0], item]));
    const sortedMain = order.map((id) => navMap[id]).filter(Boolean);
    return [...sortedMain, navMap.settings];
  }, [siteConfig.menu_order]);

  const visibleNav = useMemo(
    () => orderedNav.filter(([id]) => id === 'settings' || !siteConfig.hidden_menus?.includes(id)),
    [orderedNav, siteConfig.hidden_menus]
  );

  useEffect(() => {
    if (page !== 'settings' && siteConfig.hidden_menus?.includes(page)) {
      setPage('dashboard');
    }
  }, [page, siteConfig.hidden_menus]);

  const groupedManagers = useMemo(() => {
    const list = rows.managers || [];
    const seniors = list
      .filter((m) => m.role === '선임 매니저')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'));
    const juniors = list
      .filter((m) => m.role !== '선임 매니저')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'));
    return { seniors, juniors };
  }, [rows.managers]);

  const suggestedParticipants = useMemo(() => {
    const typed = String(form.participant_name || '').trim().toLowerCase();
    const list = rows.participants || [];
    if (!typed) return list.slice(0, 8);
    return list.filter(
      (p) =>
        String(p.name || '').toLowerCase().includes(typed) ||
        String(p.cohort || '').toLowerCase().includes(typed)
    );
  }, [rows.participants, form.participant_name]);

  const filtered = useMemo(() => {
    const data = rows[tableByPage[page]] || [];
    const searched = !query
      ? data
      : data.filter((r) => {
          const meta = parseLinkageMeta(r);
          const fu = parseFollowupDates(r);
          const fuProg = getLinkedProgramForParticipant(
            fu.participant_name || participantName(r.participant_id),
            fu.program
          );
          return (
            JSON.stringify(r).toLowerCase().includes(query.toLowerCase()) ||
            participantName(r.participant_id).includes(query) ||
            meta.participant_name.includes(query) ||
            meta.program.includes(query) ||
            fu.participant_name.includes(query) ||
            fuProg.includes(query)
          );
        });

    if (page === 'managers') {
      const { key, direction } = managerSort;
      const factor = direction === 'asc' ? 1 : -1;
      return [...searched].sort((a, b) => {
        const valA = String(a?.[key] ?? '').trim();
        const valB = String(b?.[key] ?? '').trim();
        return valA.localeCompare(valB, 'ko', { sensitivity: 'base' }) * factor;
      });
    }

    if (page === 'consultations') {
      const { key, direction } = linkageSort;
      const factor = direction === 'asc' ? 1 : -1;
      const getVal = (item) => {
        const m = parseLinkageMeta(item);
        if (key === 'name') return m.participant_name || participantName(item.participant_id);
        if (key === 'cohort') return m.cohort;
        if (key === 'program') return m.program;
        if (key === 'doc_status') return m.doc_status;
        if (key === 'note') return m.note;
        if (key === 'completed') return m.completed ? '1' : '0';
        return '';
      };
      return [...searched].sort(
        (a, b) => String(getVal(a)).localeCompare(String(getVal(b)), 'ko', { sensitivity: 'base' }) * factor
      );
    }

    if (page === 'followups') {
      const { key, direction } = followupSort;
      const factor = direction === 'asc' ? 1 : -1;
      const getVal = (item) => {
        const f = parseFollowupDates(item);
        const nameVal = f.participant_name || participantName(item.participant_id);
        if (key === 'name') return nameVal;
        if (key === 'cohort') return f.cohort;
        if (key === 'program') return getLinkedProgramForParticipant(nameVal, f.program);
        if (key === 'round1') return f.round1_date;
        if (key === 'round2') return f.round2_date;
        if (key === 'round3') return f.round3_date;
        if (key === 'note') return f.note;
        return '';
      };
      return [...searched].sort(
        (a, b) => String(getVal(a)).localeCompare(String(getVal(b)), 'ko', { sensitivity: 'base' }) * factor
      );
    }

    return searched;
  }, [rows, page, query, managerSort, linkageSort, followupSort]);

  if (!supabase) return <SetupScreen />;
  if (!authReady) return null;
  if (!session) {
    return <AuthScreen supabase={supabase} brandTitle={siteConfig.brand_title} />;
  }

  const currentUserName = session.user?.user_metadata?.full_name || '담당자';
  const currentUserRole = session.user?.user_metadata?.role || '매니저';

  const rawNavItem = nav.find((n) => n[0] === page);
  const pageTitle = rawNavItem ? getMenuLabel(rawNavItem[0], rawNavItem[1]) : '대시보드';

  const renderManagerPickButton = (m) => {
    const cleanName = stripRolePrefix(m.name);
    const selectedList = Array.isArray(form.managers) ? form.managers.map(stripRolePrefix) : [];
    const checked = selectedList.includes(cleanName);
    return (
      <button
        key={m.id || cleanName}
        type="button"
        className={'manager-pick-btn ' + (checked ? 'selected' : '')}
        onClick={() => toggleFormManager(cleanName)}
      >
        <span>{cleanName}</span>
      </button>
    );
  };

  const supportsBulkUpload = page === 'consultations' || page === 'followups';
  const supportsManageModal = page === 'consultations' || page === 'followups';

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobileNav ? 'show' : '')}>
        <div className="brand">
          <div className="brand-mark small">청</div>
          <div>
            <b>{siteConfig.brand_title || '청도지 WORKSPACE'}</b>
            <small>{siteConfig.brand_subtitle || 'TEAM MANAGEMENT'}</small>
          </div>
          <button className="mobile-close" onClick={() => setMobileNav(false)}>
            <X />
          </button>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {visibleNav.map(([id, defaultLabel, Icon]) => (
            <button
              key={id}
              className={'nav-item ' + (page === id ? 'active' : '')}
              onClick={() => {
                setPage(id);
                setQuery('');
                setSavedNotice('');
                setManageModal(false);
                setSelectedManageIds([]);
                setMobileNav(false);
              }}
            >
              <Icon size={18} />
              <span>{getMenuLabel(id, defaultLabel)}</span>
              {id === 'schedules' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">{currentUserName.slice(0, 1)}</div>
            <div className="user-info">
              <b>{currentUserName}</b>
              <small>{currentUserRole}</small>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={handleLogout}
              title="로그아웃"
              style={{ marginLeft: 'auto' }}
            >
              <LogOut size={16} />
            </button>
          </div>
          <div className="version">CHEONGDOJI · 2026</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="hamburger" onClick={() => setMobileNav(true)}>
            <Menu />
          </button>
          <div className="breadcrumb">
            {siteConfig.brand_title || '청도지 WORKSPACE'} <span>/</span> <b>{pageTitle}</b>
          </div>
          <div className="top-actions">
            <span className="live">
              <i /> 실시간 동기화
            </span>
            <button className="icon-btn" onClick={() => load(currentUserId)} title="새로고침">
              <RefreshCw size={17} />
            </button>
            <div className="avatar">{currentUserName.slice(0, 1)}</div>
          </div>
        </header>

        <div className="content">
          {error && (
            <div className="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
              <button onClick={() => setError('')}>닫기</button>
            </div>
          )}

          {page === 'dashboard' ? (
            <Dashboard
              rows={rows}
              siteConfig={siteConfig}
              notice={savedNotice}
              onSaveSettings={saveSettings}
              onNavigate={setPage}
            />
          ) : page === 'stats' ? (
            <Stats rows={rows} />
          ) : page === 'settings' ? (
            <SiteSettingsPage
              config={siteConfig}
              notice={savedNotice}
              onSave={saveSettings}
            />
          ) : page === 'schedules' ? (
            <CalendarPage
              rows={rows}
              month={month}
              setMonth={setMonth}
              onAdd={openNew}
              onAddOnDate={openNewOnDate}
              onEdit={(r) => {
                setPage('schedules');
                openEdit(r);
              }}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">DATA MANAGEMENT</p>
                  <h1>{pageTitle}</h1>
                  <p className="muted">
                    {page === 'participants'
                      ? '기수별 참여자 정보와 담당 현황을 관리합니다.'
                      : page === 'attendance'
                      ? '참여자별 출결 내역을 기록하고 확인합니다.'
                      : page === 'consultations'
                      ? '내 계정에 저장된 사후연계 참여자, 프로그램, 서류 제출상태 및 완료 여부를 관리합니다.'
                      : page === 'managers'
                      ? '선임 매니저와 매니저 명단을 등록하고 열 기준으로 정렬합니다.'
                      : '내 계정에 저장된 수료자 사후관리 대상 참여자와 1차·2차·3차 진행 일자를 관리합니다.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {supportsBulkUpload && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setBulkText('');
                        setBulkPreviewRows([]);
                        setBulkModal(true);
                      }}
                    >
                      <FileSpreadsheet size={16} /> 엑셀 일괄 등록
                    </button>
                  )}
                  <button className="primary" onClick={openNew}>
                    <Plus size={17} />{' '}
                    {page === 'consultations' || page === 'followups'
                      ? '참여자 등록'
                      : '새로 등록'}
                  </button>
                  {supportsManageModal && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setSelectedManageIds([]);
                        setManageModal(true);
                      }}
                    >
                      <SlidersHorizontal size={16} /> 관리
                    </button>
                  )}
                </div>
              </div>

              <div className="toolbar">
                <div className="search">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="이름, 기수, 프로그램, 특이사항 검색"
                  />
                </div>
                <span className="count">
                  총 <b>{filtered.length}</b>건
                </span>
              </div>

              <DataTable
                page={page}
                rows={filtered}
                participantName={participantName}
                getLinkedProgram={(nameVal, fallbackProg) =>
                  getLinkedProgramForParticipant(nameVal, fallbackProg)
                }
                onEdit={openEdit}
                onDelete={remove}
                managerSort={managerSort}
                onSortManager={handleManagerSort}
                linkageSort={linkageSort}
                onSortLinkage={handleLinkageSort}
                onToggleLinkageCompleted={(row) => {
                  const m = parseLinkageMeta(row);
                  updateLinkageRowInline(row, { completed: !m.completed });
                }}
                onChangeLinkageDocStatus={(row, nextStatus) => {
                  updateLinkageRowInline(row, { doc_status: nextStatus });
                }}
                followupSort={followupSort}
                onSortFollowup={handleFollowupSort}
                onChangeFollowupRound={(row, roundKey, nextDate) => {
                  updateFollowupRoundInline(row, { [roundKey]: nextDate });
                }}
              />
            </>
          )}

          {loading && (
            <div className="loading">
              <RefreshCw className="spin" size={16} /> 데이터를 불러오는 중입니다.
            </div>
          )}
        </div>
      </main>

      {manageModal && supportsManageModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setManageModal(false);
          }}
        >
          <div className="modal modal-wide">
            <div className="modal-head">
              <div>
                <p className="eyebrow">BATCH MANAGE & EDIT</p>
                <h2>{pageTitle} 목록 관리</h2>
              </div>
              <button className="icon-btn" onClick={() => setManageModal(false)}>
                <X />
              </button>
            </div>

            <div className="manage-toolbar">
              <label className="table-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={
                    filtered.length > 0 &&
                    filtered.every((r) => selectedManageIds.includes(r.id))
                  }
                  onChange={() => toggleSelectAllManageRows(filtered)}
                />
                <span>전체 선택 ({selectedManageIds.length}건 선택됨)</span>
              </label>

              <button
                type="button"
                className="danger bulk-del-btn"
                disabled={!selectedManageIds.length}
                onClick={handleBulkDeleteSelected}
              >
                <Trash2 size={15} /> 선택 일괄 삭제
              </button>
            </div>

            <div className="manage-list-wrap">
              {filtered.length ? (
                filtered.map((r) => {
                  const isLinkage = page === 'consultations';
                  const meta = isLinkage ? parseLinkageMeta(r) : null;
                  const fu = !isLinkage ? parseFollowupDates(r) : null;
                  const displayName = isLinkage
                    ? meta.participant_name || participantName(r.participant_id)
                    : fu.participant_name || participantName(r.participant_id);
                  const cohortVal = isLinkage ? meta.cohort : fu.cohort;
                  const progVal = isLinkage
                    ? meta.program
                    : getLinkedProgramForParticipant(displayName, fu.program);
                  const subSummary = isLinkage
                    ? `${meta.doc_status}${meta.note ? ` · ${meta.note}` : ''}`
                    : `1차: ${fu.round1_date || '-'} / 2차: ${fu.round2_date || '-'} / 3차: ${
                        fu.round3_date || '-'
                      }${fu.note ? ` · ${fu.note}` : ''}`;

                  return (
                    <div key={r.id} className="manage-row-item">
                      <label className="table-checkbox-wrap" style={{ flex: 1, minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={selectedManageIds.includes(r.id)}
                          onChange={() => toggleSelectManageRow(r.id)}
                        />
                        <div className="manage-row-text">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <b>{displayName}</b>
                            {cohortVal && <span className="pill">{cohortVal}</span>}
                            {progVal && <span className="pill">{progVal}</span>}
                          </div>
                          <small className="muted">{subSummary}</small>
                        </div>
                      </label>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          setManageModal(false);
                          openEdit(r, page);
                        }}
                      >
                        <Pencil size={14} /> 수정
                      </button>
                    </div>
                  );
                })
              ) : (
                <Empty text="관리할 참여자 데이터가 없습니다." />
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setManageModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkModal && supportsBulkUpload && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setBulkModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="eyebrow">BULK IMPORT</p>
                <h2>{pageTitle} 엑셀 일괄 등록</h2>
              </div>
              <button className="icon-btn" onClick={() => setBulkModal(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleBulkImportSubmit}>
              <div className="form-grid">
                <div className="wide">
                  <p className="muted" style={{ marginTop: 0 }}>
                    {page === 'consultations'
                      ? '엑셀에서 행을 복사해 붙여넣거나 파일을 선택하세요. 열 순서: 이름, 기수, 사후연계 프로그램, 서류 제출상태(서류 제출전/서류 제출완료), 특이사항'
                      : '엑셀에서 행을 복사해 붙여넣거나 파일을 선택하세요. 열 순서: 이름, 기수, 사후관리 1차(YYYY-MM-DD), 사후관리 2차(YYYY-MM-DD), 사후관리 3차(YYYY-MM-DD), 특이사항'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      ref={excelFileInputRef}
                      type="file"
                      accept=".csv,.tsv,.txt"
                      style={{ display: 'none' }}
                      onChange={handleExcelFileUpload}
                    />
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => excelFileInputRef.current?.click()}
                    >
                      <FileSpreadsheet size={15} /> 엑셀 / CSV 파일 선택
                    </button>
                    {bulkPreviewRows.length > 0 && (
                      <span className="count">
                        인식된 데이터: <b>{bulkPreviewRows.length}</b>행
                      </span>
                    )}
                  </div>
                  <textarea
                    rows="7"
                    placeholder={
                      page === 'consultations'
                        ? '홍길동\t1기\t국민취업지원제도\t서류 제출전\t상담 완료\n김영희\t2기\t미래내일 일경험\t서류 제출완료\t서류 확인됨'
                        : '홍길동\t1기\t2026-11-10\t2026-11-24\t\t1·2차 완료\n김영희\t2기\t2026-11-12\t\t\t1차 진행'
                    }
                    value={bulkText}
                    onChange={(e) => syncBulkTextAndPreview(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '18px' }}>
                <button type="button" className="secondary" onClick={() => setBulkModal(false)}>
                  취소
                </button>
                <button type="submit" className="primary" disabled={bulkBusy}>
                  {bulkBusy ? '등록 중...' : '일괄 등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="eyebrow">{editing ? 'EDIT RECORD' : 'NEW RECORD'}</p>
                <h2>
                  {editing
                    ? '정보 수정'
                    : page === 'consultations' || page === 'followups'
                    ? '참여자 등록'
                    : titles[page] + ' 등록'}
                </h2>
              </div>
              <button className="icon-btn" onClick={() => setModal(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={save}>
              {page === 'consultations' ? (
                <div className="form-grid">
                  <label className="wide" style={{ position: 'relative' }}>
                    이름
                    <input
                      type="text"
                      required
                      placeholder="참여자 이름 입력"
                      value={form.participant_name || ''}
                      onFocus={() => setShowNameSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowNameSuggestions(false), 160)}
                      onChange={(e) => {
                        setForm({ ...form, participant_name: e.target.value });
                        setShowNameSuggestions(true);
                      }}
                    />
                    {showNameSuggestions && suggestedParticipants.length > 0 && (
                      <div className="name-suggestion-dropdown">
                        {suggestedParticipants.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="name-suggestion-item"
                            onMouseDown={() => {
                              setForm({
                                ...form,
                                participant_name: p.name,
                                participant_id: p.id,
                                cohort: p.cohort || form.cohort || '1기'
                              });
                              setShowNameSuggestions(false);
                            }}
                          >
                            <b>{p.name}</b>
                            <small>{p.cohort || '기수 미지정'}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </label>

                  <label className="wide">
                    기수
                    <select
                      value={form.cohort || '1기'}
                      onChange={(e) => setForm({ ...form, cohort: e.target.value })}
                    >
                      {cohortOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="wide">
                    사후연계 프로그램
                    <select
                      value={form.program || LINKAGE_PROGRAM_PRESETS[0]}
                      onChange={(e) => setForm({ ...form, program: e.target.value })}
                    >
                      {LINKAGE_PROGRAM_PRESETS.map((prog) => (
                        <option key={prog} value={prog}>
                          {prog}
                        </option>
                      ))}
                      <option value="직접 입력">직접 입력</option>
                    </select>
                  </label>

                  {form.program === '직접 입력' && (
                    <label className="wide">
                      사후연계 프로그램 직접 입력
                      <input
                        type="text"
                        required
                        placeholder="프로그램명을 직접 입력하세요"
                        value={form.customProgram || ''}
                        onChange={(e) => setForm({ ...form, customProgram: e.target.value })}
                      />
                    </label>
                  )}

                  <label className="wide">
                    서류 제출상태
                    <select
                      value={form.doc_status || '서류 제출전'}
                      onChange={(e) => setForm({ ...form, doc_status: e.target.value })}
                    >
                      {LINKAGE_DOC_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="wide">
                    특이사항
                    <textarea
                      rows="3"
                      placeholder="특이사항을 입력하세요"
                      value={form.note || ''}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                    />
                  </label>
                </div>
              ) : page === 'followups' ? (
                <div className="form-grid">
                  <label className="wide" style={{ position: 'relative' }}>
                    이름
                    <input
                      type="text"
                      required
                      placeholder="참여자 이름 입력"
                      value={form.participant_name || ''}
                      onFocus={() => setShowNameSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowNameSuggestions(false), 160)}
                      onChange={(e) => {
                        setForm({ ...form, participant_name: e.target.value });
                        setShowNameSuggestions(true);
                      }}
                    />
                    {showNameSuggestions && suggestedParticipants.length > 0 && (
                      <div className="name-suggestion-dropdown">
                        {suggestedParticipants.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="name-suggestion-item"
                            onMouseDown={() => {
                              setForm({
                                ...form,
                                participant_name: p.name,
                                participant_id: p.id,
                                cohort: p.cohort || form.cohort || '1기'
                              });
                              setShowNameSuggestions(false);
                            }}
                          >
                            <b>{p.name}</b>
                            <small>{p.cohort || '기수 미지정'}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </label>

                  <label className="wide">
                    기수
                    <select
                      value={form.cohort || '1기'}
                      onChange={(e) => setForm({ ...form, cohort: e.target.value })}
                    >
                      {cohortOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="wide">
                    사후연계 프로그램 (구분용)
                    <select
                      value={form.program || ''}
                      onChange={(e) => setForm({ ...form, program: e.target.value })}
                    >
                      <option value="">선택 안 함 (사후연계 등록 내역 자동 연동)</option>
                      {LINKAGE_PROGRAM_PRESETS.map((prog) => (
                        <option key={prog} value={prog}>
                          {prog}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    사후관리 1차
                    <input
                      type="date"
                      value={form.round1_date || ''}
                      onChange={(e) => setForm({ ...form, round1_date: e.target.value })}
                    />
                  </label>

                  <label>
                    사후관리 2차
                    <input
                      type="date"
                      value={form.round2_date || ''}
                      onChange={(e) => setForm({ ...form, round2_date: e.target.value })}
                    />
                  </label>

                  <label className="wide">
                    사후관리 3차
                    <input
                      type="date"
                      value={form.round3_date || ''}
                      onChange={(e) => setForm({ ...form, round3_date: e.target.value })}
                    />
                  </label>

                  <label className="wide">
                    특이사항
                    <textarea
                      rows="3"
                      placeholder="특이사항을 입력하세요"
                      value={form.note || ''}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                    />
                  </label>
                </div>
              ) : (
                <div className="form-grid">
                  {page === 'participants' && (
                    <>
                      <label>
                        이름
                        <input
                          required
                          type="text"
                          value={form.name || ''}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </label>
                      <label>
                        연락처
                        <input
                          type="text"
                          value={form.phone || ''}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </label>
                      <label>
                        기수
                        <select
                          value={form.cohort || '1기'}
                          onChange={(e) => setForm({ ...form, cohort: e.target.value })}
                        >
                          {cohortOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        담당자
                        <input
                          type="text"
                          value={form.manager || ''}
                          onChange={(e) => setForm({ ...form, manager: e.target.value })}
                        />
                      </label>
                      <label>
                        참여 상태
                        <select
                          value={form.status || '참여중'}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                          {['참여중', '수료', '중도탈락', '대기'].map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="wide">
                        메모
                        <textarea
                          rows="3"
                          value={form.memo || ''}
                          onChange={(e) => setForm({ ...form, memo: e.target.value })}
                        />
                      </label>
                    </>
                  )}

                  {page === 'schedules' && (
                    <>
                      <label className="wide">
                        일정명
                        <input
                          required
                          type="text"
                          value={form.title || ''}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                      </label>
                      <label>
                        구분
                        <select
                          value={form.category || SCHEDULE_CATEGORIES[0]}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                        >
                          {SCHEDULE_CATEGORIES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="wide">
                        시작·종료 일시
                        <div className="datetime-range-box">
                          <label className="time-toggle-row">
                            <input
                              type="checkbox"
                              checked={form.timeEnabled !== false}
                              onChange={(e) =>
                                setForm({ ...form, timeEnabled: e.target.checked })
                              }
                            />
                            <span>시간 설정 사용 (체크 해제 시 날짜만 표시)</span>
                          </label>

                          <div className="datetime-row">
                            <span className="range-tag">시작</span>
                            <input
                              type="date"
                              required
                              value={form.startDate || today}
                              onChange={(e) => {
                                const nextStartDate = e.target.value;
                                const nextEndDate =
                                  form.endDate && form.endDate < nextStartDate
                                    ? nextStartDate
                                    : form.endDate || nextStartDate;
                                setForm({
                                  ...form,
                                  startDate: nextStartDate,
                                  endDate: nextEndDate
                                });
                              }}
                            />
                            {form.timeEnabled !== false && (
                              <select
                                value={snapToHalfHour(form.startTime || '09:00')}
                                onChange={(e) => {
                                  const nextStartTime = e.target.value;
                                  const nextEndTime =
                                    (form.endDate || form.startDate) === (form.startDate || today) &&
                                    (form.endTime || '10:00') <= nextStartTime
                                      ? addHalfHour(nextStartTime)
                                      : form.endTime || addHalfHour(nextStartTime);
                                  setForm({
                                    ...form,
                                    startTime: nextStartTime,
                                    endTime: nextEndTime
                                  });
                                }}
                              >
                                {HALF_HOUR_TIMES.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="datetime-row">
                            <span className="range-tag end">종료</span>
                            <input
                              type="date"
                              required
                              min={form.startDate || today}
                              value={form.endDate || form.startDate || today}
                              onChange={(e) =>
                                setForm({ ...form, endDate: e.target.value })
                              }
                            />
                            {form.timeEnabled !== false && (
                              <select
                                value={snapToHalfHour(form.endTime || '10:00')}
                                onChange={(e) =>
                                  setForm({ ...form, endTime: e.target.value })
                                }
                              >
                                {HALF_HOUR_TIMES.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </label>
                      <label>
                        장소
                        <input
                          type="text"
                          value={form.location || ''}
                          onChange={(e) => setForm({ ...form, location: e.target.value })}
                        />
                      </label>
                      <label>
                        참여 인원(명)
                        <input
                          type="number"
                          value={form.expected_count ?? 0}
                          onChange={(e) => setForm({ ...form, expected_count: e.target.value })}
                        />
                      </label>
                      <label className="wide">
                        담당자
                        <div className="manager-selector-box">
                          {rows.managers && rows.managers.length > 0 ? (
                            <div className="manager-role-groups">
                              <div className="manager-role-group">
                                <span className="manager-group-label senior">선임 매니저</span>
                                <div className="manager-chip-grid">
                                  {groupedManagers.seniors.length > 0 ? (
                                    groupedManagers.seniors.map(renderManagerPickButton)
                                  ) : (
                                    <span className="muted tiny">등록된 선임 매니저 없음</span>
                                  )}
                                </div>
                              </div>

                              <div className="manager-role-group">
                                <span className="manager-group-label junior">매니저</span>
                                <div className="manager-chip-grid">
                                  {groupedManagers.juniors.length > 0 ? (
                                    groupedManagers.juniors.map(renderManagerPickButton)
                                  ) : (
                                    <span className="muted tiny">등록된 매니저 없음</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="muted" style={{ margin: 0 }}>
                              등록된 담당자가 없습니다. 먼저 좌측 <b>담당자 관리</b> 메뉴에서 담당자를 등록해 주세요.
                            </p>
                          )}
                          {Array.isArray(form.managers) && form.managers.length > 0 && (
                            <div className="selected-managers-summary">
                              선택된 담당자: <b>{form.managers.map(stripRolePrefix).join(', ')}</b>
                            </div>
                          )}
                        </div>
                      </label>
                      <label className="wide">
                        내용
                        <textarea
                          rows="3"
                          value={form.description || ''}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                      </label>
                    </>
                  )}

                  {page === 'attendance' && (
                    <>
                      <label>
                        참여자
                        <select
                          required
                          value={form.participant_id || ''}
                          onChange={(e) => setForm({ ...form, participant_id: e.target.value })}
                        >
                          <option value="">참여자 선택</option>
                          {rows.participants.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} · {p.cohort}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        일자
                        <input
                          type="date"
                          value={form.attend_date || today}
                          onChange={(e) => setForm({ ...form, attend_date: e.target.value })}
                        />
                      </label>
                      <label>
                        출결 상태
                        <select
                          value={form.status || '출석'}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                          {['출석', '지각', '조퇴', '결석', '공결'].map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        비고
                        <input
                          type="text"
                          value={form.memo || ''}
                          onChange={(e) => setForm({ ...form, memo: e.target.value })}
                        />
                      </label>
                    </>
                  )}

                  {page === 'managers' && (
                    <>
                      <label>
                        담당자명
                        <input
                          required
                          type="text"
                          value={form.name || ''}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </label>
                      <label>
                        담당 역할
                        <select
                          value={form.role || '매니저'}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                          {MANAGER_ROLES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="wide">
                        비고
                        <textarea
                          rows="3"
                          value={form.memo || ''}
                          onChange={(e) => setForm({ ...form, memo: e.target.value })}
                        />
                      </label>
                    </>
                  )}
                </div>
              )}

              <div className="modal-actions between">
                <div>
                  {editing && (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => remove(editing)}
                    >
                      <Trash2 size={15} /> 삭제
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="secondary" onClick={() => setModal(false)}>
                    취소
                  </button>
                  <button className="primary">저장하기</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardEditForm({ dashConfig, onSave, notice }) {
  const [draft, setDraft] = useState(() => normalizeDashboardConfig(dashConfig));
  const [activeCardTab, setActiveCardTab] = useState('notices');
  const [newCohortName, setNewCohortName] = useState('');

  useEffect(() => {
    setDraft(normalizeDashboardConfig(dashConfig));
  }, [dashConfig]);

  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1400;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setDraft((prev) => ({ ...prev, banner_image: compressed }));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const addNotice = () => {
    const next = [
      ...(draft.notices || []),
      { id: 'n_' + Date.now(), title: '', content: '', pinned: false }
    ];
    setDraft({ ...draft, notices: next });
  };

  const updateNotice = (idx, field, val) => {
    const next = [...(draft.notices || [])];
    next[idx] = { ...next[idx], [field]: val };
    setDraft({ ...draft, notices: next });
  };

  const moveNotice = (idx, dir) => {
    const target = idx + dir;
    const list = [...(draft.notices || [])];
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    setDraft({ ...draft, notices: list });
  };

  const removeNotice = (idx) => {
    const next = (draft.notices || []).filter((_, i) => i !== idx);
    setDraft({ ...draft, notices: next });
  };

  const cohortKeys = Object.keys(draft.recruit_cohorts || DEFAULT_RECRUIT_COHORTS);
  const [editCohort, setEditCohort] = useState(cohortKeys[0] || '1기');

  const updateCohortField = (cohortKey, courseKey, val) => {
    setDraft({
      ...draft,
      recruit_cohorts: {
        ...draft.recruit_cohorts,
        [cohortKey]: {
          ...(draft.recruit_cohorts?.[cohortKey] || { short: '', mid: '', long: '' }),
          [courseKey]: val
        }
      }
    });
  };

  const addCohort = () => {
    const trimmed = newCohortName.trim();
    if (!trimmed) return;
    if (!draft.recruit_cohorts[trimmed]) {
      setDraft({
        ...draft,
        recruit_cohorts: {
          ...draft.recruit_cohorts,
          [trimmed]: { short: '', mid: '', long: '' }
        }
      });
    }
    setEditCohort(trimmed);
    setNewCohortName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(draft);
  };

  const subTabs = [
    ['banner', '0. 상단 배너 이미지'],
    ['notices', '1. 공지·전달사항'],
    ['today', '2. 오늘의 일정'],
    ['week', '3. 이번주 주요 일정'],
    ['followup', '4. 사후관리 현황'],
    ['recruit', '5. 참여자 모집 일정']
  ];

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div className="panel-head">
        <div>
          <h2>대시보드 항목별 개별 설정</h2>
          <p>수정할 항목 탭을 선택해 배너 이미지·문구·순서·고정·기준값을 개별적으로 관리할 수 있습니다.</p>
        </div>
        <button type="submit" className="primary">변경사항 저장</button>
      </div>

      <div className="subtab-bar">
        {subTabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={'subtab-btn ' + (activeCardTab === key ? 'active' : '')}
            onClick={() => setActiveCardTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeCardTab === 'banner' && (
        <div className="form-grid">
          <label className="wide">
            TEAM OVERVIEW 상단 카드 배경/배너 이미지 업로드
            <input type="file" accept="image/*" onChange={handleBannerFileChange} />
          </label>
          <label className="wide">
            또는 이미지 주소(URL) 직접 입력
            <input
              type="text"
              placeholder="https://example.com/banner.jpg"
              value={draft.banner_image || ''}
              onChange={(e) => setDraft({ ...draft, banner_image: e.target.value })}
            />
          </label>
          {draft.banner_image && (
            <div className="wide banner-preview-box">
              <img src={draft.banner_image} alt="대시보드 배너 미리보기" />
              <button
                type="button"
                className="danger"
                onClick={() => setDraft({ ...draft, banner_image: '' })}
              >
                이미지 제거
              </button>
            </div>
          )}
          <p className="muted wide">
            ※ 이미지를 설정하면 대시보드 최상단 TEAM OVERVIEW 큰 네모칸의 배경에 적용됩니다.
          </p>
        </div>
      )}

      {activeCardTab === 'notices' && (
        <div>
          <div className="panel-head">
            <div>
              <h2>공지사항 및 주요 전달사항</h2>
              <p>상단 고정 체크 시 목록 최상단에 우선 노출되며, 위·아래 버튼으로 순서를 바꿀 수 있습니다.</p>
            </div>
            <button type="button" className="secondary" onClick={addNotice}>
              + 공지 추가
            </button>
          </div>

          <div className="form-grid">
            {(draft.notices || []).map((item, idx) => (
              <div
                key={item.id || idx}
                className={'notice-edit-card wide ' + (item.pinned ? 'pinned' : '')}
              >
                <div className="notice-edit-top">
                  <span className="order-badge">#{idx + 1}</span>
                  <label className="pin-check">
                    <input
                      type="checkbox"
                      checked={Boolean(item.pinned)}
                      onChange={(e) => updateNotice(idx, 'pinned', e.target.checked)}
                    />
                    <Pin size={14} /> 상단 고정
                  </label>
                  <div className="order-btns">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveNotice(idx, -1)}
                      title="위로 이동"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (draft.notices || []).length - 1}
                      onClick={() => moveNotice(idx, 1)}
                      title="아래로 이동"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button type="button" className="danger" onClick={() => removeNotice(idx)}>
                      삭제
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="공지 제목 (예: 이번 주 운영 안내)"
                  value={item.title || ''}
                  onChange={(e) => updateNotice(idx, 'title', e.target.value)}
                />
                <textarea
                  rows="2"
                  placeholder="전달할 세부 내용을 입력하세요."
                  value={item.content || ''}
                  onChange={(e) => updateNotice(idx, 'content', e.target.value)}
                />
              </div>
            ))}
            {!(draft.notices || []).length && (
              <p className="muted wide">등록된 공지가 없습니다. 우측 상단 '+ 공지 추가'를 눌러 추가하세요.</p>
            )}
          </div>
        </div>
      )}

      {activeCardTab === 'today' && (
        <div className="form-grid">
          <label>
            카드 제목
            <input
              type="text"
              value={draft.today_section_title || ''}
              onChange={(e) => setDraft({ ...draft, today_section_title: e.target.value })}
            />
          </label>
          <label>
            카드 부제 설명
            <input
              type="text"
              value={draft.today_section_sub || ''}
              onChange={(e) => setDraft({ ...draft, today_section_sub: e.target.value })}
            />
          </label>
        </div>
      )}

      {activeCardTab === 'week' && (
        <div className="form-grid">
          <label>
            카드 제목
            <input
              type="text"
              value={draft.week_section_title || ''}
              onChange={(e) => setDraft({ ...draft, week_section_title: e.target.value })}
            />
          </label>
          <label>
            카드 부제 설명
            <input
              type="text"
              value={draft.week_section_sub || ''}
              onChange={(e) => setDraft({ ...draft, week_section_sub: e.target.value })}
            />
          </label>
        </div>
      )}

      {activeCardTab === 'followup' && (
        <div className="form-grid">
          <label>
            카드 제목
            <input
              type="text"
              value={draft.followup_section_title || ''}
              onChange={(e) => setDraft({ ...draft, followup_section_title: e.target.value })}
            />
          </label>
          <label>
            전체 사후관리 목표 건수 (남은 사후관리 계산 기준)
            <input
              type="number"
              min="0"
              value={draft.followup_target ?? 20}
              onChange={(e) => setDraft({ ...draft, followup_target: Number(e.target.value) })}
            />
          </label>
          <label className="wide">
            사후관리 일정 판별 키워드 (일정 구분 또는 제목 포함어)
            <input
              type="text"
              value={draft.followup_schedule_keyword || '사후관리'}
              onChange={(e) => setDraft({ ...draft, followup_schedule_keyword: e.target.value })}
            />
          </label>
        </div>
      )}

      {activeCardTab === 'recruit' && (
        <div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <label>
              카드 제목
              <input
                type="text"
                value={draft.recruit_section_title || ''}
                onChange={(e) => setDraft({ ...draft, recruit_section_title: e.target.value })}
              />
            </label>
            <label>
              대시보드 기본 선택 기수
              <select
                value={draft.recruit_default_cohort || '1기'}
                onChange={(e) => setDraft({ ...draft, recruit_default_cohort: e.target.value })}
              >
                {cohortKeys.map((ck) => (
                  <option key={ck} value={ck}>
                    {ck}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="cohort-selector-bar">
            <div className="cohort-pills">
              {cohortKeys.map((ck) => (
                <button
                  key={ck}
                  type="button"
                  className={'cohort-pill ' + (editCohort === ck ? 'active' : '')}
                  onClick={() => setEditCohort(ck)}
                >
                  {ck}
                </button>
              ))}
            </div>
            <div className="cohort-add-box">
              <input
                type="text"
                placeholder="새 기수 (예: 5기)"
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
              />
              <button type="button" className="secondary" onClick={addCohort}>
                기수 추가
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label className="wide">
              {editCohort} 단기 모집 일정 (날짜만 입력)
              <input
                type="text"
                placeholder="예: 2026.12.01 ~ 2026.12.14"
                value={draft.recruit_cohorts?.[editCohort]?.short || ''}
                onChange={(e) => updateCohortField(editCohort, 'short', e.target.value)}
              />
            </label>
            <label className="wide">
              {editCohort} 중기 모집 일정 (날짜만 입력)
              <input
                type="text"
                placeholder="예: 2026.12.01 ~ 2026.12.20"
                value={draft.recruit_cohorts?.[editCohort]?.mid || ''}
                onChange={(e) => updateCohortField(editCohort, 'mid', e.target.value)}
              />
            </label>
            <label className="wide">
              {editCohort} 장기 모집 일정 (날짜만 입력)
              <input
                type="text"
                placeholder="예: 2026.12.01 ~ 2026.12.28"
                value={draft.recruit_cohorts?.[editCohort]?.long || ''}
                onChange={(e) => updateCohortField(editCohort, 'long', e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      {notice && <p className="save-notice">{notice}</p>}

      <div className="modal-actions" style={{ marginTop: '20px' }}>
        <button type="submit" className="primary">변경사항 저장</button>
      </div>
    </form>
  );
}

function SiteSettingsPage({ config, onSave, notice }) {
  const [draft, setDraft] = useState(() => ({
    ...config,
    menu_order: normalizeMenuOrder(config.menu_order)
  }));
  const [tab, setTab] = useState('sidebar');

  useEffect(() => {
    setDraft({
      ...config,
      menu_order: normalizeMenuOrder(config.menu_order)
    });
  }, [config]);

  const navMap = Object.fromEntries(nav.map((item) => [item[0], item[1]]));
  const currentOrder = normalizeMenuOrder(draft.menu_order);

  const toggleHidden = (id) => {
    const exists = draft.hidden_menus.includes(id);
    const nextHidden = exists
      ? draft.hidden_menus.filter((m) => m !== id)
      : [...draft.hidden_menus, id];
    setDraft({ ...draft, hidden_menus: nextHidden });
  };

  const changeLabel = (id, value) => {
    setDraft({
      ...draft,
      custom_labels: { ...draft.custom_labels, [id]: value }
    });
  };

  const moveMenu = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= currentOrder.length) return;
    const next = [...currentOrder];
    [next[idx], next[target]] = [next[target], next[idx]];
    setDraft({ ...draft, menu_order: next });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...draft,
      menu_order: currentOrder
    });
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SITE CUSTOMIZATION</p>
          <h1>사이트 설정</h1>
          <p className="muted">사이드바 메뉴 이름·순서와 대시보드 표시 항목을 탭별로 직접 수정합니다.</p>
        </div>
        <div className="month-nav">
          <button
            type="button"
            className={tab === 'sidebar' ? 'primary' : 'secondary'}
            onClick={() => setTab('sidebar')}
          >
            사이드바·브랜드 설정
          </button>
          <button
            type="button"
            className={tab === 'dashboard' ? 'primary' : 'secondary'}
            onClick={() => setTab('dashboard')}
          >
            대시보드 항목 설정
          </button>
        </div>
      </div>

      {tab === 'dashboard' ? (
        <DashboardEditForm
          dashConfig={draft.dashboard_config || DEFAULT_DASHBOARD_CONFIG}
          notice={notice}
          onSave={(nextDash) => {
            const next = { ...draft, dashboard_config: nextDash };
            setDraft(next);
            onSave(next);
          }}
        />
      ) : (
        <form className="panel" onSubmit={handleSubmit}>
          <div className="panel-head">
            <div>
              <h2>브랜드 및 안내 문구</h2>
              <p>사이드바와 대시보드 상단에 표시되는 텍스트입니다.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              사이드바 메인 제목
              <input
                type="text"
                value={draft.brand_title || ''}
                onChange={(e) => setDraft({ ...draft, brand_title: e.target.value })}
              />
            </label>
            <label>
              사이드바 부제
              <input
                type="text"
                value={draft.brand_subtitle || ''}
                onChange={(e) => setDraft({ ...draft, brand_subtitle: e.target.value })}
              />
            </label>
            <label className="wide">
              대시보드 인사말
              <input
                type="text"
                value={draft.welcome_title || ''}
                onChange={(e) => setDraft({ ...draft, welcome_title: e.target.value })}
              />
            </label>
            <label className="wide">
              대시보드 설명 문구
              <input
                type="text"
                value={draft.welcome_subtitle || ''}
                onChange={(e) => setDraft({ ...draft, welcome_subtitle: e.target.value })}
              />
            </label>
          </div>

          <div className="panel-head" style={{ marginTop: '24px' }}>
            <div>
              <h2>메뉴 이름·순서 및 노출 설정</h2>
              <p>위·아래 화살표로 사이드바 순서를 변경하고, 원하는 메뉴명을 입력하거나 숨길 수 있습니다.</p>
            </div>
          </div>

          <div className="form-grid">
            {currentOrder.map((id, idx) => {
              const defaultLabel = navMap[id] || id;
              const isHidden = draft.hidden_menus.includes(id);
              return (
                <div key={id} className="event-row wide" style={{ gap: '12px' }}>
                  <div className="order-btns" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="order-badge">#{idx + 1}</span>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveMenu(idx, -1)}
                      title="위로 이동"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === currentOrder.length - 1}
                      onClick={() => moveMenu(idx, 1)}
                      title="아래로 이동"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="event-info" style={{ flex: 1 }}>
                    <b>기본 메뉴: {defaultLabel}</b>
                    <input
                      type="text"
                      placeholder={defaultLabel}
                      value={draft.custom_labels?.[id] ?? ''}
                      onChange={(e) => changeLabel(id, e.target.value)}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={isHidden}
                      onChange={() => toggleHidden(id)}
                    />
                    <span>숨기기</span>
                  </label>
                </div>
              );
            })}
          </div>

          {notice && <p className="save-notice">{notice}</p>}

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setDraft({
                  ...config,
                  hidden_menus: [],
                  custom_labels: {},
                  menu_order: DEFAULT_MENU_ORDER
                })
              }
            >
              메뉴 이름·순서 초기화
            </button>
            <button type="submit" className="primary">설정 저장</button>
          </div>
        </form>
      )}
    </>
  );
}

function SetupScreen() {
  return (
    <div className="setup">
      <div className="setup-card">
        <div className="brand-mark">청</div>
        <p className="eyebrow">PROJECT INITIALIZATION</p>
        <h1>청도지 WORKSPACE</h1>
        <h2>서비스 연결이 필요합니다.</h2>
        <p>Supabase 프로젝트를 생성한 뒤 환경변수를 설정하면 데이터 저장 기능을 사용할 수 있습니다.</p>
        <ol>
          <li>Supabase에서 새 프로젝트 생성</li>
          <li>프로젝트 URL과 anon key를 환경변수에 입력</li>
          <li>필요한 테이블 및 정책 설정 실행</li>
        </ol>
        <div className="code-note">
          VITE_SUPABASE_URL=프로젝트 URL
          <br />
          VITE_SUPABASE_ANON_KEY=anon key
        </div>
        <p className="tiny muted">현재 화면은 데이터 서버 연결 전 초기 설정 안내입니다.</p>
      </div>
    </div>
  );
}

function Dashboard({ rows, siteConfig, notice, onSaveSettings, onNavigate }) {
  const [dashTab, setDashTab] = useState('view');
  const dashConfig = useMemo(
    () => normalizeDashboardConfig(siteConfig?.dashboard_config),
    [siteConfig?.dashboard_config]
  );

  const cohortKeys = Object.keys(dashConfig.recruit_cohorts || DEFAULT_RECRUIT_COHORTS);
  const [selectedCohort, setSelectedCohort] = useState(dashConfig.recruit_default_cohort || '1기');

  useEffect(() => {
    if (dashConfig.recruit_default_cohort && cohortKeys.includes(dashConfig.recruit_default_cohort)) {
      setSelectedCohort(dashConfig.recruit_default_cohort);
    }
  }, [dashConfig.recruit_default_cohort]);

  const sortedNotices = useMemo(() => {
    const list = [...(dashConfig.notices || [])];
    return list.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  }, [dashConfig.notices]);

  const weekRange = getWeekRange();
  const todaySchedules = rows.schedules
    .filter((s) => s.start_at?.slice(0, 10) === today)
    .sort((a, b) => String(a.start_at || '').localeCompare(String(b.start_at || '')));

  const weekSchedules = rows.schedules
    .filter((s) => {
      const d = s.start_at?.slice(0, 10);
      return d && d >= weekRange.start && d <= weekRange.end;
    })
    .sort((a, b) => String(a.start_at || '').localeCompare(String(b.start_at || '')));

  const kw = (dashConfig.followup_schedule_keyword || '사후관리').trim();
  const followupSchedules = rows.schedules.filter(
    (s) => s.category === kw || (s.title && s.title.includes(kw))
  );
  const scheduleFollowupHeadcount = followupSchedules.reduce(
    (sum, s) => sum + (Number(s.expected_count) || 0),
    0
  );
  const completedFollowupRecords = rows.followups.filter((f) => f.status === '참여').length;
  const totalFollowupParticipants =
    scheduleFollowupHeadcount > 0 ? scheduleFollowupHeadcount : completedFollowupRecords;

  const targetFollowups = Number(dashConfig.followup_target) || 0;
  const remainingFollowups = Math.max(targetFollowups - followupSchedules.length, 0);

  const activeRecruit = dashConfig.recruit_cohorts?.[selectedCohort] || { short: '', mid: '', long: '' };
  const hasBannerImage = Boolean(dashConfig.banner_image);

  return (
    <>
      <div
        className={'welcome ' + (hasBannerImage ? 'has-banner-image' : '')}
        style={
          hasBannerImage
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.45) 60%, rgba(15, 23, 42, 0.25) 100%), url(${dashConfig.banner_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
            : undefined
        }
      >
        <div>
          <p className="eyebrow">TEAM OVERVIEW</p>
          <h1>{siteConfig?.welcome_title || '안녕하세요, 오늘도 함께 시작해요.'}</h1>
          <p>{siteConfig?.welcome_subtitle || '청도지 사업단의 주요 현황을 한눈에 확인할 수 있습니다.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={dashTab === 'view' ? 'primary' : 'secondary'}
            onClick={() => setDashTab('view')}
          >
            현황 보기
          </button>
          <button
            type="button"
            className={dashTab === 'edit' ? 'primary' : 'secondary'}
            onClick={() => setDashTab('edit')}
          >
            대시보드 수정
          </button>
        </div>
      </div>

      {dashTab === 'edit' ? (
        <DashboardEditForm
          dashConfig={dashConfig}
          notice={notice}
          onSave={(nextDash) => {
            onSaveSettings({
              ...siteConfig,
              dashboard_config: nextDash
            });
          }}
        />
      ) : (
        <>
          <section className="panel dash-card accent-notice" style={{ marginBottom: '18px' }}>
            <div className="panel-head dash-card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="section-icon-box notice">
                  <Megaphone size={18} />
                </span>
                <div>
                  <h2>공지사항 및 주요 전달사항</h2>
                  <p>팀원 전체 공유 사항 (상단 고정 항목 우선 표시)</p>
                </div>
              </div>
              <button className="text-button" onClick={() => setDashTab('edit')}>
                순서·고정 수정 →
              </button>
            </div>
            {sortedNotices.length ? (
              sortedNotices.map((n, i) => (
                <div className={'dash-item-box ' + (n.pinned ? 'is-pinned' : '')} key={n.id || i}>
                  <div className="dash-item-title-row">
                    {n.pinned && (
                      <span className="pin-badge">
                        <Pin size={12} /> 고정
                      </span>
                    )}
                    <b className="dash-item-title">{n.title || '공지사항'}</b>
                  </div>
                  <div className="dash-item-body">{n.content || '-'}</div>
                </div>
              ))
            ) : (
              <Empty text="등록된 공지사항이 없습니다." />
            )}
          </section>

          <div className="dashboard-grid" style={{ marginBottom: '18px' }}>
            <section className="panel dash-card accent-today">
              <div className="panel-head dash-card-head">
                <div>
                  <div className="title-with-count">
                    <h2>{dashConfig.today_section_title || '오늘의 일정'}</h2>
                    <span className="count-highlight">총 {todaySchedules.length}건</span>
                  </div>
                  <p>{dashConfig.today_section_sub || `${today} 기준 예정 일정`}</p>
                </div>
                <button className="text-button" onClick={() => onNavigate('schedules')}>
                  사업단 일정 →
                </button>
              </div>
              {todaySchedules.length ? (
                todaySchedules.map((s) => {
                  const mgrs = extractScheduleManagers(s);
                  const timeText = formatScheduleTimeRange(s);
                  return (
                    <div className="today-style-card" key={s.id}>
                      <div className="dash-item-title-row">
                        <span className="pin-badge">오늘</span>
                        <span className="program-tag">[{s.category || '일정'}]</span>
                        <b className="dash-item-title">{s.title}</b>
                        {Number(s.expected_count) > 0 && (
                          <span className="pill">{s.expected_count}명</span>
                        )}
                      </div>
                      <div className="dash-item-body">
                        <span className="meta-line">
                          {timeText && (
                            <>
                              <Clock3 size={13} /> {timeText}
                            </>
                          )}
                          {s.location ? `${timeText ? ' · ' : ''}장소: ${s.location}` : ''}
                          {mgrs.length
                            ? `${timeText || s.location ? ' · ' : ''}담당: ${mgrs.join(', ')}`
                            : ''}
                        </span>
                        {s.description && <p className="detail-desc">{s.description}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <Empty text="오늘 등록된 일정이 없습니다." />
              )}
            </section>

            <section className="panel dash-card accent-week">
              <div className="panel-head dash-card-head">
                <div>
                  <div className="title-with-count">
                    <h2>{dashConfig.week_section_title || '이번주 주요 일정'}</h2>
                    <span className="count-highlight week">총 {weekSchedules.length}건</span>
                  </div>
                  <p>
                    {dashConfig.week_section_sub || `${weekRange.start} ~ ${weekRange.end}`}
                  </p>
                </div>
                <button className="text-button" onClick={() => onNavigate('schedules')}>
                  전체 보기 →
                </button>
              </div>
              {weekSchedules.length ? (
                weekSchedules.map((s) => {
                  const mgrs = extractScheduleManagers(s);
                  const isTodayItem = s.start_at?.slice(0, 10) === today;
                  const timeText = formatScheduleTimeRange(s);
                  return (
                    <div
                      className={isTodayItem ? 'today-style-card' : 'week-item-card'}
                      key={s.id}
                    >
                      {!isTodayItem && (
                        <div className="program-badge-box">[{s.category || '프로그램'}]</div>
                      )}
                      <div className="week-item-content">
                        <div className="dash-item-title-row">
                          {isTodayItem && (
                            <>
                              <span className="pin-badge">오늘</span>
                              <span className="program-tag">[{s.category || '일정'}]</span>
                            </>
                          )}
                          <b className="dash-item-title">{s.title}</b>
                          {Number(s.expected_count) > 0 && (
                            <span className="pill">{s.expected_count}명</span>
                          )}
                        </div>
                        <div className="dash-item-body">
                          <span className="meta-line">
                            <CalendarDays size={13} /> {formatKoreanDateShort(s.start_at)}
                            {timeText ? ` ${timeText}` : ''}
                            {s.location ? ` · ${s.location}` : ''}
                            {mgrs.length ? ` · 담당: ${mgrs.join(', ')}` : ''}
                          </span>
                          {s.description && <p className="detail-desc">{s.description}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <Empty text="이번 주에 등록된 일정이 없습니다." />
              )}
            </section>
          </div>

          <div className="dashboard-grid">
            <section className="panel dash-card accent-followup">
              <div className="panel-head dash-card-head">
                <div>
                  <h2>{dashConfig.followup_section_title || '사후관리 활동 현황'}</h2>
                  <p>사후관리 일정 참여 인원 합계 및 남은 활동 건수</p>
                </div>
                <button className="text-button" onClick={() => onNavigate('schedules')}>
                  일정 등록 →
                </button>
              </div>
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 0 }}>
                <div className="metric-box primary-metric">
                  <span className="metric-label">사후관리 전체 참여 인원</span>
                  <div className="metric-value">
                    {totalFollowupParticipants}
                    <small>명</small>
                  </div>
                  <p className="metric-note">
                    {scheduleFollowupHeadcount > 0
                      ? `사후관리 일정 ${followupSchedules.length}건 누적 인원`
                      : `사후관리 출석·참여 기록 기준`}
                  </p>
                </div>
                <div className="metric-box secondary-metric">
                  <span className="metric-label">남은 사후관리 활동</span>
                  <div className="metric-value">
                    {remainingFollowups}
                    <small>건</small>
                  </div>
                  <p className="metric-note">목표 {targetFollowups}건 대비 잔여</p>
                </div>
              </div>
            </section>

            <section className="panel dash-card accent-recruit">
              <div className="panel-head dash-card-head">
                <div>
                  <h2>{dashConfig.recruit_section_title || '참여자 모집 일정'}</h2>
                  <p>기수를 선택해 과정별 모집 기간을 확인하세요</p>
                </div>
                <select
                  className="cohort-select"
                  value={selectedCohort}
                  onChange={(e) => setSelectedCohort(e.target.value)}
                >
                  {cohortKeys.map((ck) => (
                    <option key={ck} value={ck}>
                      {ck}
                    </option>
                  ))}
                </select>
              </div>
              <div className="recruit-list">
                <div className="recruit-row recruit-tinted">
                  <span className="course-badge short">{selectedCohort} 단기</span>
                  <b className="recruit-date">{activeRecruit.short || '일정 미등록'}</b>
                </div>
                <div className="recruit-row recruit-tinted">
                  <span className="course-badge mid">{selectedCohort} 중기</span>
                  <b className="recruit-date">{activeRecruit.mid || '일정 미등록'}</b>
                </div>
                <div className="recruit-row recruit-tinted">
                  <span className="course-badge long">{selectedCohort} 장기</span>
                  <b className="recruit-date">{activeRecruit.long || '일정 미등록'}</b>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ label, value, unit, note, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <div className="stat-value">
        {value}
        <small>{unit}</small>
      </div>
      <p>{note}</p>
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

function SortableHeader({ label, active, direction, onClick }) {
  return (
    <button
      type="button"
      className={'sort-th-btn ' + (active ? 'active' : '')}
      onClick={onClick}
    >
      <span>{label}</span>
      {active ? (
        <span className="sort-dir-mark">{direction === 'asc' ? '↑' : '↓'}</span>
      ) : (
        <ArrowUpDown size={13} className="sort-icon-muted" />
      )}
    </button>
  );
}

function CohortPill({ cohort }) {
  if (!cohort) return <span>-</span>;
  const st = getCohortStyle(cohort);
  return (
    <span
      className="type-color-badge"
      style={{
        backgroundColor: st.bg,
        color: st.text,
        borderColor: st.border
      }}
    >
      {cohort}
    </span>
  );
}

function ProgramPill({ program }) {
  if (!program) return <span className="muted">-</span>;
  const st = getProgramStyle(program);
  return (
    <span
      className="type-color-badge"
      style={{
        backgroundColor: st.bg,
        color: st.text,
        borderColor: st.border
      }}
    >
      {program}
    </span>
  );
}

function DataTable({
  page,
  rows,
  participantName,
  getLinkedProgram,
  onEdit,
  onDelete,
  managerSort,
  onSortManager,
  linkageSort,
  onSortLinkage,
  onToggleLinkageCompleted,
  onChangeLinkageDocStatus,
  followupSort,
  onSortFollowup,
  onChangeFollowupRound
}) {
  if (page === 'consultations') {
    const cols = [
      ['name', '이름'],
      ['cohort', '기수'],
      ['program', '사후연계 프로그램'],
      ['doc_status', '서류 제출상태'],
      ['note', '특이사항'],
      ['completed', '완료']
    ];

    return (
      <div className="table-wrap grid-lined-wrap">
        <table className="grid-lined-table linkage-table">
          <thead>
            <tr>
              {cols.map(([key, label]) => (
                <th key={key}>
                  <SortableHeader
                    label={label}
                    active={linkageSort?.key === key}
                    direction={linkageSort?.direction}
                    onClick={() => onSortLinkage?.(key)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = parseLinkageMeta(r);
              const displayName = meta.participant_name || participantName(r.participant_id);
              const progStyle = getProgramStyle(meta.program);
              return (
                <tr key={r.id}>
                  <td><b>{displayName}</b></td>
                  <td>
                    <CohortPill cohort={meta.cohort} />
                  </td>
                  <td style={{ backgroundColor: progStyle.bg }}>
                    <ProgramPill program={meta.program} />
                  </td>
                  <td>
                    <select
                      className={
                        'inline-table-select doc-status-select ' +
                        (meta.doc_status === '서류 제출완료' ? 'done' : 'pending')
                      }
                      value={meta.doc_status}
                      onChange={(e) => onChangeLinkageDocStatus?.(r, e.target.value)}
                    >
                      {LINKAGE_DOC_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className="truncate">{meta.note || '-'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="pure-complete-checkbox"
                      aria-label={`${displayName} 완료 체크`}
                      checked={Boolean(meta.completed)}
                      onChange={() => onToggleLinkageCompleted?.(r)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <Empty text="등록된 사후연계 참여자가 없습니다. 참여자 등록을 눌러 추가해 주세요." />
        )}
      </div>
    );
  }

  if (page === 'followups') {
    const cols = [
      ['name', '이름'],
      ['cohort', '기수'],
      ['program', '사후연계 프로그램'],
      ['round1', '사후관리 1차'],
      ['round2', '사후관리 2차'],
      ['round3', '사후관리 3차'],
      ['note', '특이사항']
    ];

    return (
      <div className="table-wrap grid-lined-wrap">
        <table className="grid-lined-table followup-table">
          <thead>
            <tr>
              {cols.map(([key, label]) => (
                <th
                  key={key}
                  className={
                    key === 'round1' || key === 'round2' || key === 'round3'
                      ? 'followup-round-th'
                      : ''
                  }
                >
                  <SortableHeader
                    label={label}
                    active={followupSort?.key === key}
                    direction={followupSort?.direction}
                    onClick={() => onSortFollowup?.(key)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const fu = parseFollowupDates(r);
              const displayName = fu.participant_name || participantName(r.participant_id);
              const progName = getLinkedProgram ? getLinkedProgram(displayName, fu.program) : fu.program;
              const progStyle = getProgramStyle(progName);
              return (
                <tr key={r.id}>
                  <td><b>{displayName}</b></td>
                  <td>
                    <CohortPill cohort={fu.cohort} />
                  </td>
                  <td style={{ backgroundColor: progStyle.bg }}>
                    <ProgramPill program={progName} />
                  </td>
                  <td className="followup-round-td">
                    <input
                      type="date"
                      className="inline-date-input followup-round-input"
                      value={fu.round1_date || ''}
                      onChange={(e) => onChangeFollowupRound?.(r, 'round1_date', e.target.value)}
                    />
                  </td>
                  <td className="followup-round-td">
                    <input
                      type="date"
                      className="inline-date-input followup-round-input"
                      value={fu.round2_date || ''}
                      onChange={(e) => onChangeFollowupRound?.(r, 'round2_date', e.target.value)}
                    />
                  </td>
                  <td className="followup-round-td">
                    <input
                      type="date"
                      className="inline-date-input followup-round-input"
                      value={fu.round3_date || ''}
                      onChange={(e) => onChangeFollowupRound?.(r, 'round3_date', e.target.value)}
                    />
                  </td>
                  <td>
                    <span className="truncate">{fu.note || '-'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <Empty text="등록된 사후관리 참여자가 없습니다. 참여자 등록을 눌러 추가해 주세요." />
        )}
      </div>
    );
  }

  const columns = {
    participants: [
      ['name', '이름'],
      ['cohort', '기수'],
      ['phone', '연락처'],
      ['manager', '담당자'],
      ['status', '상태']
    ],
    attendance: [
      ['attend_date', '일자'],
      ['participant_id', '참여자'],
      ['status', '출결 상태'],
      ['memo', '비고']
    ],
    managers: [
      ['name', '담당자명'],
      ['role', '담당 역할'],
      ['memo', '비고']
    ]
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {(columns[page] || []).map(([colKey, colLabel]) => {
              if (page === 'managers') {
                return (
                  <th key={colKey}>
                    <SortableHeader
                      label={colLabel}
                      active={managerSort?.key === colKey}
                      direction={managerSort?.direction}
                      onClick={() => onSortManager?.(colKey)}
                    />
                  </th>
                );
              }
              return <th key={colKey}>{colLabel}</th>;
            })}
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {(columns[page] || []).map(([k]) => (
                <td key={k}>
                  {k === 'participant_id' ? (
                    participantName(r[k])
                  ) : k === 'role' && page === 'managers' ? (
                    <span
                      className={
                        'role-badge ' +
                        (r[k] === '선임 매니저' ? 'senior' : 'junior')
                      }
                    >
                      {r[k] || '매니저'}
                    </span>
                  ) : k === 'content' || k === 'memo' ? (
                    <span className="truncate">{r[k] || '-'}</span>
                  ) : (
                    <span className={k === 'status' ? 'status-text' : ''}>{r[k] || '-'}</span>
                  )}
                </td>
              ))}
              <td>
                <div className="row-actions">
                  <button onClick={() => onEdit(r)}>수정</button>
                  <button className="danger" onClick={() => onDelete(r.id)}>
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Empty text="등록된 데이터가 없습니다. 새로 등록해 주세요." />}
    </div>
  );
}

function CalendarPage({ rows, month, setMonth, onAdd, onAddOnDate, onEdit }) {
  const year = month.getFullYear(),
    m = month.getMonth(),
    days = new Date(year, m + 1, 0).getDate();
  const items = rows.schedules || [];

  const getDateStr = (d) =>
    `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const dayItems = (d) => {
    const targetDate = getDateStr(d);
    return items
      .filter((s) => {
        const startD = s.start_at?.slice(0, 10);
        const endD = s.end_at?.slice(0, 10) || startD;
        if (!startD) return false;
        return targetDate >= startD && targetDate <= endD;
      })
      .sort((a, b) => String(a.start_at || '').localeCompare(String(b.start_at || '')));
  };

  const weekdays = ['월', '화', '수', '목', '금'];
  const firstWeekdayIndex = useMemo(() => {
    for (let d = 1; d <= days; d += 1) {
      const dow = new Date(year, m, d).getDay();
      if (dow >= 1 && dow <= 5) {
        return dow - 1;
      }
    }
    return 0;
  }, [year, m, days]);

  const calendarCells = useMemo(() => {
    const list = [];
    for (let i = 0; i < firstWeekdayIndex; i += 1) {
      list.push(null);
    }
    for (let d = 1; d <= days; d += 1) {
      const dow = new Date(year, m, d).getDay();
      if (dow >= 1 && dow <= 5) {
        list.push(d);
      }
    }
    while (list.length % 5 !== 0) {
      list.push(null);
    }
    return list;
  }, [year, m, days, firstWeekdayIndex]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SCHEDULE CALENDAR</p>
          <h1>사업단 일정</h1>
          <p className="muted">
            날짜 칸을 클릭해 바로 일정을 추가하거나, 일정을 클릭해 상세 확인·수정·삭제할 수 있습니다.
          </p>
        </div>
        <button className="primary" onClick={onAdd}>
          <Plus size={17} /> 일정 등록
        </button>
      </div>

      <div className="calendar-panel">
        <div className="calendar-head">
          <div>
            <h2>
              {year}년 {m + 1}월
            </h2>
            <p>월간 일정 캘린더</p>
          </div>
          <div className="calendar-legend">
            {SCHEDULE_CATEGORIES.map((cat) => {
              const st = getCategoryStyle(cat);
              return (
                <span
                  key={cat}
                  className="legend-pill"
                  style={{
                    backgroundColor: st.badgeBg,
                    color: st.badgeText,
                    borderColor: st.border
                  }}
                >
                  {cat}
                </span>
              );
            })}
          </div>
          <div className="month-nav">
            <button onClick={() => setMonth(new Date(year, m - 1, 1))}>
              <ChevronLeft />
            </button>
            <button onClick={() => setMonth(new Date())}>오늘</button>
            <button onClick={() => setMonth(new Date(year, m + 1, 1))}>
              <ChevronRight />
            </button>
          </div>
        </div>

        <div className="calendar-grid five-col-weekdays">
          {weekdays.map((d) => (
            <div className="weekday" key={d}>
              {d}
            </div>
          ))}
          {calendarCells.map((d, i) => {
            const isValidDay = typeof d === 'number' && d > 0 && d <= days;
            const dateStr = isValidDay ? getDateStr(d) : '';
            const events = isValidDay ? dayItems(d) : [];
            const isTodayCell =
              isValidDay &&
              d === new Date().getDate() &&
              m === new Date().getMonth() &&
              year === new Date().getFullYear();

            const cellClasses = [
              'calendar-cell',
              'weekday-large-cell',
              !isValidDay ? 'outside' : 'clickable-cell'
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={i}
                className={cellClasses}
                onClick={() => {
                  if (isValidDay) onAddOnDate(dateStr);
                }}
              >
                <div className="calendar-cell-top">
                  <span className={'day-number ' + (isTodayCell ? 'today' : '')}>
                    {isValidDay ? d : ''}
                  </span>
                  {isValidDay && (
                    <button
                      type="button"
                      className="cell-quick-add"
                      title={`${dateStr} 일정 추가`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddOnDate(dateStr);
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>

                {isValidDay &&
                  events.map((s) => {
                    const st = getCategoryStyle(s.category);
                    const mgrs = extractScheduleManagers(s);
                    const timeLabel = formatScheduleTimeRange(s);

                    return (
                      <button
                        type="button"
                        className="calendar-event-rich"
                        key={s.id}
                        style={{
                          backgroundColor: st.bg,
                          borderLeftColor: st.border,
                          color: st.text
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(s);
                        }}
                        title={`${s.title} (${s.category || '기타'})`}
                      >
                        <div className="cal-ev-header">
                          <span
                            className="cal-ev-cat"
                            style={{
                              backgroundColor: st.badgeBg,
                              color: st.badgeText
                            }}
                          >
                            {s.category || '기타'}
                          </span>
                          {timeLabel && <span className="cal-ev-time">{timeLabel}</span>}
                        </div>

                        <div className="cal-ev-title">{s.title}</div>

                        <div className="cal-ev-line-loc-count">
                          <span>📍 {s.location || '-'}</span>
                          <span>👥 {Number(s.expected_count) > 0 ? `${s.expected_count}명` : '-'}</span>
                        </div>

                        <div className="cal-ev-line-managers">
                          🙋 {mgrs.length > 0 ? mgrs.join(', ') : '-'}
                        </div>

                        {s.description && (
                          <div className="cal-ev-desc">{s.description}</div>
                        )}
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Stats({ rows }) {
  const total = rows.participants.length,
    completed = rows.participants.filter((p) => p.status === '수료').length,
    active = rows.participants.filter((p) => p.status === '참여중').length;
  const attendanceTotal = rows.attendance.length,
    attended = rows.attendance.filter((a) => a.status === '출석' || a.status === '지각' || a.status === '조퇴').length;
  const rate = attendanceTotal ? Math.round((attended / attendanceTotal) * 100) : 0;
  const cohorts = [...new Set(rows.participants.map((p) => p.cohort).filter(Boolean))];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PERFORMANCE OVERVIEW</p>
          <h1>성과 통계</h1>
          <p className="muted">등록된 사업 데이터를 기준으로 주요 운영 지표를 확인합니다.</p>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard label="전체 참여자" value={total} unit="명" note="누적 등록 인원" icon={Users} />
        <StatCard label="현재 참여중" value={active} unit="명" note="참여 상태 기준" icon={UserRound} />
        <StatCard
          label="수료 인원"
          value={completed}
          unit="명"
          note={total ? `수료 비율 ${Math.round((completed / total) * 100)}%` : '등록 데이터 없음'}
          icon={GraduationCap}
        />
        <StatCard label="출석률" value={rate} unit="%" note={`${attended}건 / 전체 ${attendanceTotal}건`} icon={ClipboardCheck} />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>기수별 참여자 현황</h2>
              <p>등록된 참여자 기준</p>
            </div>
          </div>
          {cohorts.length ? (
            cohorts.map((c) => {
              const n = rows.participants.filter((p) => p.cohort === c).length;
              return (
                <div className="bar-row" key={c}>
                  <span>{c}</span>
                  <div className="bar-track">
                    <i style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
                  </div>
                  <b>{n}명</b>
                </div>
              );
            })
          ) : (
            <Empty text="참여자 데이터가 없습니다." />
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>업무 실적 요약</h2>
              <p>현재 데이터베이스에 등록된 건수</p>
            </div>
          </div>
          {[
            ['사업단 일정', rows.schedules.length],
            ['출결 기록', rows.attendance.length],
            ['사후연계', rows.consultations.length],
            ['사후관리', rows.followups.length],
            ['등록 담당자', rows.managers.length]
          ].map(([l, n]) => (
            <div className="summary-line" key={l}>
              <span>{l}</span>
              <b>{n}건</b>
            </div>
          ))}
        </section>
      </div>
      <p className="tiny muted footnote">
        ※ 현재 통계는 사이트에 입력된 데이터만 집계합니다. 공식 실적 산식과 목표 대비 달성률은 사업단 기준을 확인한 뒤 추가 설정할 수 있습니다.
      </p>
    </>
  );
}

export default App;