import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardCheck,
  MessageSquareText,
  GraduationCap,
  ChartNoAxesCombined,
  LogOut,
  Plus,
  Search,
  RefreshCw,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  UserRound,
  Settings,
  AlertCircle,
  Megaphone,
  Pin,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && anon ? createClient(url, anon) : null;

const nav = [
  ['dashboard', '대시보드', LayoutDashboard],
  ['schedules', '일정 관리', CalendarDays],
  ['participants', '참여자 관리', Users],
  ['attendance', '출결 관리', ClipboardCheck],
  ['consultations', '상담 관리', MessageSquareText],
  ['followups', '사후관리', GraduationCap],
  ['stats', '성과 통계', ChartNoAxesCombined],
  ['settings', '사이트 설정', Settings]
];

const DEFAULT_RECRUIT_COHORTS = {
  '1기': { short: '2026.12.01 ~ 2026.12.14', mid: '2026.12.01 ~ 2026.12.20', long: '2026.12.01 ~ 2026.12.28' },
  '2기': { short: '', mid: '', long: '' },
  '3기': { short: '', mid: '', long: '' }
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
  dashboard_config: DEFAULT_DASHBOARD_CONFIG
};

const pad2 = (n) => String(n).padStart(2, '0');
const formatLocalDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = formatLocalDate(new Date());

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
  const d = new Date(isoStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]})`;
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

const emptyForms = {
  participants: { name: '', phone: '', cohort: '1기', manager: '', status: '참여중', memo: '' },
  schedules: {
    title: '',
    category: '프로그램',
    start_at: today + 'T14:00',
    end_at: today + 'T16:00',
    location: '',
    expected_count: 0,
    description: ''
  },
  attendance: { participant_id: '', attend_date: today, status: '출석', memo: '' },
  consultations: { participant_id: '', consulted_at: today, manager: '', category: '진로·취업', content: '', next_action: '' },
  followups: { participant_id: '', activity_date: today, activity_name: '', status: '참여', memo: '' }
};

const tableByPage = {
  participants: 'participants',
  schedules: 'schedules',
  attendance: 'attendance',
  consultations: 'consultations',
  followups: 'followups'
};

const titles = {
  participants: '참여자 관리',
  schedules: '일정 관리',
  attendance: '출결 관리',
  consultations: '상담 관리',
  followups: '사후관리',
  settings: '사이트 설정'
};

const fields = {
  participants: [
    ['name', '이름', 'text'],
    ['phone', '연락처', 'text'],
    ['cohort', '기수', 'select', ['1기', '2기', '3기', '4기', '5기', '기타']],
    ['manager', '담당자', 'text'],
    ['status', '참여 상태', 'select', ['참여중', '수료', '중도탈락', '대기']],
    ['memo', '메모', 'textarea']
  ],
  schedules: [
    ['title', '일정명', 'text'],
    ['category', '구분', 'select', ['프로그램', '사후관리', '상담', '회의', '행사', '기타']],
    ['start_at', '시작 일시', 'datetime-local'],
    ['end_at', '종료 일시', 'datetime-local'],
    ['location', '장소', 'text'],
    ['expected_count', '참여 인원(명)', 'number'],
    ['description', '내용', 'textarea']
  ],
  attendance: [
    ['participant_id', '참여자', 'participant'],
    ['attend_date', '일자', 'date'],
    ['status', '출결 상태', 'select', ['출석', '지각', '조퇴', '결석', '공결']],
    ['memo', '비고', 'text']
  ],
  consultations: [
    ['participant_id', '참여자', 'participant'],
    ['consulted_at', '상담일', 'date'],
    ['manager', '상담자', 'text'],
    ['category', '상담 구분', 'select', ['진로·취업', '심리·정서', '생활', '프로그램', '기타']],
    ['content', '상담 내용', 'textarea'],
    ['next_action', '후속 조치', 'textarea']
  ],
  followups: [
    ['participant_id', '참여자', 'participant'],
    ['activity_date', '활동일', 'date'],
    ['activity_name', '활동명', 'text'],
    ['status', '참여 여부', 'select', ['참여', '불참', '취소']],
    ['memo', '비고', 'textarea']
  ]
};

function App() {
const [page, setPage] = useState('dashboard');
  const [rows, setRows] = useState({
    participants: [],
    schedules: [],
    attendance: [],
    consultations: [],
    followups: []
  });
  const [siteConfig, setSiteConfig] = useState(DEFAULT_SETTINGS);
  const [savedNotice, setSavedNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [month, setMonth] = useState(new Date());

  const loadSettings = async () => {
    if (!supabase) return;
    const { data, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (!settingsError && data) {
      setSiteConfig({
        ...DEFAULT_SETTINGS,
        ...data,
        hidden_menus: Array.isArray(data.hidden_menus) ? data.hidden_menus : [],
        custom_labels: data.custom_labels && typeof data.custom_labels === 'object' ? data.custom_labels : {},
        dashboard_config: normalizeDashboardConfig(data.dashboard_config)
      });
    }
  };

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    const names = ['participants', 'schedules', 'attendance', 'consultations', 'followups'];
    const results = await Promise.all(
      names.map((n) =>
        supabase
          .from(n)
          .select('*')
          .order(
            n === 'schedules'
              ? 'start_at'
              : n === 'participants'
              ? 'created_at'
              : n === 'attendance'
              ? 'attend_date'
              : n === 'consultations'
              ? 'consulted_at'
              : 'activity_date',
            { ascending: false }
          )
          .limit(500)
      )
    );
    const bad = results.find((r) => r.error);
    if (bad) setError(bad.error.message);
    else setRows(Object.fromEntries(names.map((n, i) => [n, results[i].data || []])));
    await loadSettings();
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel('workspace-live')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const saveSettings = async (nextConfig) => {
    if (!supabase) return;
    setError('');
    setSavedNotice('');
    const payload = {
      ...nextConfig,
      id: 'default',
      updated_at: new Date().toISOString()
    };
    const { error: saveError } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' });
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setSiteConfig(payload);
    setSavedNotice('설정이 저장되었습니다.');
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForms[tableByPage[page]] });
    setModal(true);
  };

  const openEdit = (r) => {
    setEditing(r.id);
    setForm({ ...r });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const table = tableByPage[page];
    const payload = { ...form };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    if (table === 'schedules' && payload.expected_count !== undefined && payload.expected_count !== '') {
      payload.expected_count = Number(payload.expected_count) || 0;
    }
    if (editing) {
      const { error: upError } = await supabase.from(table).update(payload).eq('id', editing);
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
    await load();
  };

  const remove = async (id) => {
    if (!confirm('이 항목을 삭제할까요?')) return;
    const { error: delError } = await supabase.from(tableByPage[page]).delete().eq('id', id);
    if (delError) setError(delError.message);
    else load();
  };

  const participantName = (id) => rows.participants.find((p) => p.id === id)?.name || '참여자 정보 없음';

  const getMenuLabel = (id, defaultLabel) => siteConfig.custom_labels?.[id]?.trim() || defaultLabel;

  const visibleNav = useMemo(
    () => nav.filter(([id]) => id === 'settings' || !siteConfig.hidden_menus?.includes(id)),
    [siteConfig.hidden_menus]
  );

  useEffect(() => {
    if (page !== 'settings' && siteConfig.hidden_menus?.includes(page)) {
      setPage('dashboard');
    }
  }, [page, siteConfig.hidden_menus]);

  const filtered = useMemo(() => {
    const data = rows[tableByPage[page]] || [];
    if (!query) return data;
    return data.filter(
      (r) =>
        JSON.stringify(r).toLowerCase().includes(query.toLowerCase()) ||
        participantName(r.participant_id).includes(query)
    );
  }, [rows, page, query]);

  if (!supabase) return <SetupScreen />;

  const rawNavItem = nav.find((n) => n[0] === page);
  const pageTitle = rawNavItem ? getMenuLabel(rawNavItem[0], rawNavItem[1]) : '대시보드';

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
            <div className="avatar">청</div>
            <div className="user-info">
              <b>공용 워크스페이스</b>
              <small>바로 접속 모드</small>
            </div>
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
            <button className="icon-btn" onClick={load} title="새로고침">
              <RefreshCw size={17} />
            </button>
            <div className="avatar">청</div>
          </div>
        </header>

        <div className="content">
          {error && (
            <div className="alert">
              <AlertCircle size={17} />
              {error}
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
                      ? '참여자 상담 이력과 후속 조치를 기록합니다.'
                      : '수료자 사후관리 활동과 참여 이력을 관리합니다.'}
                  </p>
                </div>
                <button className="primary" onClick={openNew}>
                  <Plus size={17} /> 새로 등록
                </button>
              </div>
              <div className="toolbar">
                <div className="search">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="이름, 내용, 담당자 검색"
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
                onEdit={openEdit}
                onDelete={remove}
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
                <p className="eyebrow">NEW RECORD</p>
                <h2>{editing ? '정보 수정' : titles[page] + ' 등록'}</h2>
              </div>
              <button className="icon-btn" onClick={() => setModal(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={save}>
              <div className="form-grid">
                {(fields[page] || []).map(([key, label, type, options]) => (
                  <label className={type === 'textarea' ? 'wide' : ''} key={key}>
                    {label}
                    {type === 'select' ? (
                      <select
                        value={form[key] || ''}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      >
                        {options.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : type === 'participant' ? (
                      <select
                        required
                        value={form[key] || ''}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      >
                        <option value="">참여자 선택</option>
                        {rows.participants.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {p.cohort}
                          </option>
                        ))}
                      </select>
                    ) : type === 'textarea' ? (
                      <textarea
                        rows="3"
                        value={form[key] || ''}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    ) : (
                      <input
                        required={['name', 'title', 'participant_id'].includes(key)}
                        type={type}
                        value={form[key] ?? ''}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setModal(false)}>
                  취소
                </button>
                <button className="primary">저장하기</button>
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
          <p>수정할 항목 탭을 선택해 문구·순서·고정·기준값을 개별적으로 관리할 수 있습니다.</p>
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
          <p className="muted wide">
            ※ 오늘 날짜에 등록된 일정이 자동으로 집계되며, 우측 상단에 강조된 건수 배지가 함께 표시됩니다.
          </p>
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
          <p className="muted wide">
            ※ 이번주 주요 일정에서는 왼쪽 배지에 구분명(예: [사후관리], [프로그램])이 표시되고, 날짜·시간·장소·설명은 세부사항 영역에 함께 출력됩니다.
          </p>
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
          <p className="muted wide">
            ※ 일정 관리에서 구분을 '사후관리'로 등록하고 참여 인원을 입력하면 전체 사후관리 참여 인원이 자동으로 합산됩니다. (사후관리 메뉴의 '참여' 기록도 함께 참고할 수 있습니다.)
          </p>
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
                placeholder="새 기수 (예: 4기)"
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
  const [draft, setDraft] = useState(config);
  const [tab, setTab] = useState('sidebar');
  useEffect(() => setDraft(config), [config]);

  const editableMenus = nav.filter(([id]) => id !== 'settings');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(draft);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SITE CUSTOMIZATION</p>
          <h1>사이트 설정</h1>
          <p className="muted">사이드바 메뉴와 대시보드 표시 항목을 탭별로 직접 수정합니다.</p>
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
              <h2>메뉴 이름 및 노출 설정</h2>
              <p>원하는 메뉴명을 입력하거나 사용하지 않는 메뉴를 숨길 수 있습니다.</p>
            </div>
          </div>

          <div className="form-grid">
            {editableMenus.map(([id, defaultLabel]) => {
              const isHidden = draft.hidden_menus.includes(id);
              return (
                <div key={id} className="event-row">
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
              onClick={() => setDraft({ ...config, hidden_menus: [], custom_labels: {} })}
            >
              메뉴 커스텀 초기화
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
        <p>Supabase 프로젝트를 생성한 뒤 환경변수를 설정하면 로그인과 데이터 저장 기능을 사용할 수 있습니다.</p>
        <ol>
          <li>Supabase에서 새 프로젝트 생성</li>
          <li>프로젝트 URL과 anon key를 <code>.env</code> 파일에 입력</li>
          <li><code>supabase/schema.sql</code>을 SQL Editor에서 실행</li>
          <li>관리자가 팀원을 이메일로 초대하고 공개 회원가입 비활성화</li>
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

  // 공지사항: 상단 고정 우선 정렬
  const sortedNotices = useMemo(() => {
    const list = [...(dashConfig.notices || [])];
    return list.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  }, [dashConfig.notices]);

  // 두 번째 줄: 오늘의 일정 & 이번 주 주요 일정
  const weekRange = getWeekRange();
  const todaySchedules = rows.schedules
    .filter((s) => s.start_at?.slice(0, 10) === today)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));

  const weekSchedules = rows.schedules
    .filter((s) => {
      const d = s.start_at?.slice(0, 10);
      return d && d >= weekRange.start && d <= weekRange.end;
    })
    .sort((a, b) => a.start_at.localeCompare(b.start_at));

  // 세 번째 줄: 사후관리 활동 현황 (일정의 사후관리 참여 인원 합계 + 남은 사후관리 활동)
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

  return (
    <>
      <div className="welcome">
        <div>
          <p className="eyebrow">TEAM OVERVIEW</p>
          <h1>{siteConfig?.welcome_title || '안녕하세요, 오늘도 함께 시작해요.'}</h1>
          <p>{siteConfig?.welcome_subtitle || '청도지 사업단의 주요 현황을 한눈에 확인할 수 있습니다.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
          {/* 첫 번째 줄: 공지사항 및 주요 전달사항 (한 줄 전체) */}
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

          {/* 두 번째 줄: 오늘의 일정 / 이번주 주요 일정 (2열) */}
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
                  일정 관리 →
                </button>
              </div>
              {todaySchedules.length ? (
                todaySchedules.map((s) => (
                  <div className="dash-item-box" key={s.id}>
                    <div className="dash-item-title-row">
                      <span className="program-tag">[{s.category || '일정'}]</span>
                      <b className="dash-item-title">{s.title}</b>
                      {Number(s.expected_count) > 0 && (
                        <span className="pill">{s.expected_count}명</span>
                      )}
                    </div>
                    <div className="dash-item-body">
                      <span className="meta-line">
                        <Clock3 size={13} />{' '}
                        {new Date(s.start_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        {s.end_at
                          ? ` ~ ${new Date(s.end_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                          : ''}
                        {s.location ? ` · 장소: ${s.location}` : ''}
                      </span>
                      {s.description && <p className="detail-desc">{s.description}</p>}
                    </div>
                  </div>
                ))
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
                weekSchedules.map((s) => (
                  <div className="week-item-card" key={s.id}>
                    <div className="program-badge-box">[{s.category || '프로그램'}]</div>
                    <div className="week-item-content">
                      <div className="dash-item-title-row">
                        <b className="dash-item-title">{s.title}</b>
                        {Number(s.expected_count) > 0 && (
                          <span className="pill">{s.expected_count}명</span>
                        )}
                      </div>
                      <div className="dash-item-body">
                        <span className="meta-line">
                          <CalendarDays size={13} /> {formatKoreanDateShort(s.start_at)}{' '}
                          {new Date(s.start_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          {s.location ? ` · ${s.location}` : ''}
                        </span>
                        {s.description && <p className="detail-desc">{s.description}</p>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty text="이번 주에 등록된 일정이 없습니다." />
              )}
            </section>
          </div>

          {/* 세 번째 줄: 사후관리 활동 현황 / 참여자 모집 일정 (2열) */}
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
                <div className="recruit-row">
                  <span className="course-badge short">{selectedCohort} 단기</span>
                  <b className="recruit-date">{activeRecruit.short || '일정 미등록'}</b>
                </div>
                <div className="recruit-row">
                  <span className="course-badge mid">{selectedCohort} 중기</span>
                  <b className="recruit-date">{activeRecruit.mid || '일정 미등록'}</b>
                </div>
                <div className="recruit-row">
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

function DataTable({ page, rows, participantName, onEdit, onDelete }) {
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
    consultations: [
      ['consulted_at', '상담일'],
      ['participant_id', '참여자'],
      ['manager', '상담자'],
      ['category', '상담 구분'],
      ['content', '상담 내용']
    ],
    followups: [
      ['activity_date', '활동일'],
      ['participant_id', '참여자'],
      ['activity_name', '활동명'],
      ['status', '참여 여부'],
      ['memo', '비고']
    ]
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns[page].map((c) => (
              <th key={c[0]}>{c[1]}</th>
            ))}
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {columns[page].map(([k]) => (
                <td key={k}>
                  {k === 'participant_id' ? (
                    participantName(r[k])
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

function CalendarPage({ rows, month, setMonth, onAdd, onEdit }) {
  const year = month.getFullYear(),
    m = month.getMonth(),
    first = new Date(year, m, 1),
    days = new Date(year, m + 1, 0).getDate(),
    offset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => i - offset + 1);
  const items = rows.schedules;
  const dayItems = (d) =>
    items.filter(
      (s) => s.start_at?.slice(0, 10) === `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SCHEDULE CALENDAR</p>
          <h1>일정 관리</h1>
          <p className="muted">사업단의 프로그램, 사후관리, 상담, 회의 일정을 관리합니다.</p>
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
        <div className="calendar-grid">
          {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
            <div className="weekday" key={d}>
              {d}
            </div>
          ))}
          {cells.map((d, i) => (
            <div key={i} className={'calendar-cell ' + (d < 1 || d > days ? 'outside' : '')}>
              <span
                className={
                  'day-number ' +
                  (d === new Date().getDate() && m === new Date().getMonth() && year === new Date().getFullYear()
                    ? 'today'
                    : '')
                }
              >
                {d > 0 && d <= days ? d : ''}
              </span>
              {d > 0 &&
                d <= days &&
                dayItems(d)
                  .slice(0, 3)
                  .map((s) => (
                    <button className="calendar-event" key={s.id} onClick={() => onEdit(s)} title={s.title}>
                      [{s.category}] {s.title}
                    </button>
                  ))}
              {d > 0 && d <= days && dayItems(d).length > 3 && (
                <small className="more">+{dayItems(d).length - 3}개 더보기</small>
              )}
            </div>
          ))}
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
            ['일정', rows.schedules.length],
            ['출결 기록', rows.attendance.length],
            ['상담 기록', rows.consultations.length],
            ['사후관리 활동', rows.followups.length]
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
