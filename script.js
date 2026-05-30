/* ================================================================
   BROTHERS MATCH
   script.js · v4.0 (Fully Debugged & Unified Edition)
   ================================================================ */
'use strict';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";
import { getDatabase, ref, get, set, update, serverTimestamp, onValue, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCz_wVUsz-k-qH6MYhYGGBITtrQS1yg084",
  authDomain: "brothers-match.firebaseapp.com",
  databaseURL: "https://brothers-match-default-rtdb.firebaseio.com",
  projectId: "brothers-match",
  storageBucket: "brothers-match.firebasestorage.app",
  messagingSenderId: "876014786324",
  appId: "1:876014786324:web:2771bdc4891310637c1401",
  measurementId: "G-XT75QV1XEX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

/* ── Database node references ── */
const MATCH_REF  = ref(db, 'match');
const TEAMS_REF  = ref(db, 'match/teams');
const TIMER_REF  = ref(db, 'match/timer');
const STATUS_REF = ref(db, 'match/status');
const STATS_REF  = ref(db, 'match/stats');
const EVENTS_REF = ref(db, 'match/events');

/* ── Server time offset ── */
let _serverOffset = 0;
onValue(ref(db, '.info/serverTimeOffset'), snap => {
  _serverOffset = snap.val() || 0;
});
function serverNow() { return Date.now() + _serverOffset; }

const q  = sel => document.querySelector(sel);
const qa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ================================================================
   SECTION 2 — STATE & CACHE
   ================================================================ */
const DEFAULT_STATE = {
  teams: {
    home: { name: '200L & 300L', score: 0 },
    away: { name: '100L & FYB',  score: 0 }
  },
  timer: { running: false, startedAt: 0, elapsedMs: 0 },
  status: 'PRE',
  venue:  'Estadio Premiere Olobo',
  stats: {
    possession: 50,
    homeShotsOn: 0, awayShotsOn: 0,
    homeShotsOff: 0, awayShotsOff: 0,
    homeFouls: 0, awayFouls: 0,
    homeCorners: 0, awayCorners: 0,
    homePassAcc: 78, awayPassAcc: 74
  },
  events: {}
};

let CACHE = JSON.parse(JSON.stringify(DEFAULT_STATE));

let _timerDisplayInterval = null;
let _adminOpen    = false;
let _evtTeam      = 'home';
let _evtType      = 'goal';
let _confettiRaf  = null;
let _confettiOn   = false;

/* ================================================================
   SECTION 3 — SQUAD LINEUPS
   ================================================================ */
const LINEUPS = {
  home: [
    { n:1,  name:'O. KENNEDY',    pos:'GK' }, { n:2,  name:'S. JOSHUA',     pos:'RB' },
    { n:5,  name:'JIDE',          pos:'CB' }, { n:6,  name:'P. CHIMA',      pos:'CB' },
    { n:3,  name:'E. VICTOR',     pos:'LB' }, { n:8,  name:'O. ELECT',      pos:'CM' },
    { n:4,  name:'CHIDIOMIMI',    pos:'CM' }, { n:7,  name:'ARINZE',        pos:'RW' },
    { n:10, name:'U. EMMANUEL',   pos:'AM' }, { n:11, name:'GREAT-VICTOR',  pos:'LW' },
    { n:9,  name:'TBD',           pos:'ST' }
  ],
  away: [
    { n:1,  name:'P. BEULAH',    pos:'GK' }, { n:2,  name:'C. GODSWILL',  pos:'RB' },
    { n:5,  name:'C. PLACID',    pos:'CB' }, { n:6,  name:'N. BENJAMIN',  pos:'CB' },
    { n:3,  name:'E. DANIEL',    pos:'LB' }, { n:8,  name:'J. SUCCESS',   pos:'CM' },
    { n:4,  name:'A. JOHN',      pos:'CM' }, { n:7,  name:'C. MIRACLE',   pos:'RW' },
    { n:10, name:'O. MIRACLE',   pos:'AM' }, { n:11, name:'O. JUSTICE',   pos:'LW' },
    { n:9,  name:'C. PROSPER',   pos:'ST' }
  ]
};

/* ================================================================
   SECTION 4 — BOOT SEQUENCE & LISTENER ATTACHMENT
   ================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  runLoader();
  initParticles();
  renderCrests();
  attachEventListeners(); 
  
  /* ── Initialize Firebase FIRST, then start timer display ── */
  await initFirebase();          // ✅ Wait for Firebase to connect and load data
  
  seedNotifications();
  startTimerDisplayInterval();   // ✅ Now CACHE has real data from Firebase
});
function attachEventListeners() {
  // Score controls
  qa('.sc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const scVal = btn.closest('.a-group')?.querySelector('.sc-val');
      if(!scVal) return;
      const team = scVal.id === 'adminHomeScore' ? 'home' : 'away';
      const delta = btn.textContent.trim() === '+' ? 1 : -1;
      adjustScore(team, delta);
    });
  });

  // Admin status buttons
  const statusMap = { 'PRE-MATCH':'PRE', 'LIVE':'LIVE', 'HALF TIME':'HT', 'FULL TIME':'FT' };
  qa('.a-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const txt = btn.textContent.trim().replace('▶ ','');
      if (statusMap[txt]) setStatus(statusMap[txt]);
    });
  });
  
  q('#spPre') ?.addEventListener('click', () => setStatus('PRE'));
  q('#spLive')?.addEventListener('click', () => setStatus('LIVE'));
  q('#spHt')  ?.addEventListener('click', () => setStatus('HT'));
  q('#spFt')  ?.addEventListener('click', () => setStatus('FT'));

  // Admin panel toggle
  q('#adminFab')       ?.addEventListener('click', toggleAdmin);
  q('.admin-close-btn')?.addEventListener('click', toggleAdmin);
  q('#adminOverlay')   ?.addEventListener('click', toggleAdmin);

  // Admin tabs
  qa('.a-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Event panel
  q('#evtTeamHome')?.addEventListener('click', () => selectEvtTeam('home'));
  q('#evtTeamAway')?.addEventListener('click', () => selectEvtTeam('away'));
  qa('.evt-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selectEvtType(btn.dataset.type));
  });
  q('.a-content#tab-events .a-action-btn')?.addEventListener('click', addEvent);

  // Timer buttons
  q('#startTimerBtn')?.addEventListener('click', () => timerControl('start'));
  q('#pauseTimerBtn')?.addEventListener('click', () => timerControl('pause'));
  qa('.t-btn--reset').forEach(btn => btn.addEventListener('click', () => timerControl('reset')));

  // Stats sliders / inputs
  q('#possSlider')    ?.addEventListener('input', e => updateStat('possession',   e.target.value));
  q('#homeShotsI')    ?.addEventListener('input', e => updateStat('shotsHome',    e.target.value));
  q('#awayShotsI')    ?.addEventListener('input', e => updateStat('shotsAway',    e.target.value));
  q('#homeShotsOffI') ?.addEventListener('input', e => updateStat('shotsOffHome', e.target.value));
  q('#awayShotsOffI') ?.addEventListener('input', e => updateStat('shotsOffAway', e.target.value));
  q('#homeFoulsI')    ?.addEventListener('input', e => updateStat('foulsHome',    e.target.value));
  q('#awayFoulsI')    ?.addEventListener('input', e => updateStat('foulsAway',    e.target.value));
  q('#homeCornersI')  ?.addEventListener('input', e => updateStat('cornersHome',  e.target.value));
  q('#awayCornersI')  ?.addEventListener('input', e => updateStat('cornersAway',  e.target.value));
  q('#homePassI')     ?.addEventListener('input', e => updateStat('passHome',     e.target.value));
  q('#awayPassI')     ?.addEventListener('input', e => updateStat('passAway',     e.target.value));

  // Teams tab
  q('#tab-teams .a-action-btn:not(.a-action-btn--danger)')?.addEventListener('click', updateTeams);
  q('#tab-teams .a-action-btn--danger')?.addEventListener('click', resetAll);

  // Lineup modal
  q('#lineupOpenBtn')  ?.addEventListener('click', openLineupModal);
  q('.modal-x')        ?.addEventListener('click', closeLineupModal);
  q('#lineupModal')    ?.addEventListener('click', e => { if (e.target.id === 'lineupModal') closeLineupModal(); });

  // Scroll CTA
  q('.scroll-cta')?.addEventListener('click', () => q('#mainContent')?.scrollIntoView({ behavior: 'smooth' }));

  // Global Keys
  window.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === ' ')      { e.preventDefault(); CACHE.timer.running ? timerControl('pause') : timerControl('start'); }
    if (e.key === 'Escape') { if (_adminOpen) toggleAdmin(); closeLineupModal(); }
    if (e.key.toLowerCase() === 'a' && !_adminOpen) toggleAdmin();
  });
}

async function initFirebase() {
  /* ── Check if database has data ── */
  const snap = await get(MATCH_REF);
  
  if (!snap.exists()) {
    /* First time ever — create the default structure */
    await set(MATCH_REF, DEFAULT_STATE);
    console.log('✅ Firebase initialized with default state');
  } else {
    console.log('✅ Firebase data found — using existing state');
  }

  /* ── Master Listener: fires on EVERY data change ── */
  onValue(MATCH_REF, snapshot => {
    const data = snapshot.val();
    if (!data) return;

    function deepMerge(target, source) {
      if (typeof source !== 'object' || source === null) return target;
      for (const key in source) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          target[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    }

    CACHE = deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), data);

    renderScoreboard();
    renderStatus();
    renderTimerControls();
    renderStats();
    renderEvents();
    renderCardCounts();
    renderQuickStats();
    renderTicker();
    syncAdminInputs();
    
    console.log('🔄 CACHE updated:', {
      status: CACHE.status,
      timerRunning: CACHE.timer.running,
      elapsedMs: CACHE.timer.elapsedMs,
      startedAt: CACHE.timer.startedAt
    });
  });
}
/* ================================================================
   SECTION 5 — TIMER SYSTEM
   ================================================================ */
function computeElapsedMs() {
  const t = CACHE.timer;
  /* Guard: if timer hasn't loaded from Firebase yet */
  if (!t) return 0;
  
  if (!t.running) return t.elapsedMs || 0;
  
  /* When running: total elapsed = previous time + time since last start */
  const elapsed = (t.elapsedMs || 0) + (serverNow() - (t.startedAt || serverNow()));
  return Math.max(0, elapsed);
}

function startTimerDisplayInterval() {
  if (_timerDisplayInterval) clearInterval(_timerDisplayInterval);
  _timerDisplayInterval = setInterval(renderTimerDisplay, 500);
  renderTimerDisplay(); 
}

function renderTimerDisplay() {
  /* Guard: if timer data hasn't loaded yet, don't render */
  if (!CACHE.timer) return;
  
  const ms   = Math.max(0, computeElapsedMs());
  const secs = Math.floor(ms / 1000);
  const m    = Math.floor(secs / 60);
  const s    = secs % 60;
  const str  = pad2(m) + ':' + pad2(s);

  setText('timerDisplay',    str);
  setText('timerBigDisplay', str);
  setText('matchPeriod',     periodLabel());
  setText('timerPeriodLabel', periodLabel());

  const progress = Math.min(secs / 5400, 1);
  const circ     = 175.9;
  const el = q('#timerCircle');
  if (el) el.style.strokeDashoffset = (circ - progress * circ).toFixed(2);
}
async function timerControl(action) {
  const currentMs = computeElapsedMs();
  if (action === 'start' && !CACHE.timer.running) {
    await update(TIMER_REF, { running: true, startedAt: serverTimestamp(), elapsedMs: currentMs });
    if (CACHE.status === 'PRE' || CACHE.status === 'HT') setStatus('LIVE');
  }
  if (action === 'pause' && CACHE.timer.running) {
    await update(TIMER_REF, { running: false, elapsedMs: currentMs, startedAt: 0 });
  }
  if (action === 'reset') {
    if (!confirm("Are you sure you want to reset the match clock?")) return;
    await update(TIMER_REF, { running: false, startedAt: 0, elapsedMs: 0 });
    await set(STATUS_REF, 'PRE');
  }
}

function renderTimerControls() {
  const startB = q('#startTimerBtn');
  const pauseB = q('#pauseTimerBtn');
  if (startB) startB.disabled = CACHE.timer.running;
  if (pauseB) pauseB.disabled = !CACHE.timer.running;
}

/* ================================================================
   SECTION 6 — MATCH STATUS & SCORE
   ================================================================ */
async function setStatus(s) {
  await set(STATUS_REF, s);
  if (s === 'LIVE' && !CACHE.timer.running) {
    await update(TIMER_REF, { running: true, startedAt: serverTimestamp(), elapsedMs: CACHE.timer.elapsedMs || 0 });
  }
  if ((s === 'HT' || s === 'FT') && CACHE.timer.running) {
    await update(TIMER_REF, { running: false, elapsedMs: computeElapsedMs(), startedAt: 0 });
  }
}

function renderStatus() {
  const label  = statusLabel();
  setText('matchStatusText',  label);
  setText('liveBadgeText',    label);
  setText('timerPeriodLabel', label);
  setText('matchPeriod',      periodLabel());

  const badge = q('#matchStatusBadge');
  const liveBadge = q('#liveBadge');
  if (badge && liveBadge) {
    badge.className = 'status-pill';
    liveBadge.className = 'live-badge';
    if (CACHE.status === 'LIVE') {
      badge.classList.add('status-pill--live');
      liveBadge.classList.add('live-badge--live');
    } else if (CACHE.status === 'HT' || CACHE.status === 'FT') {
      badge.classList.add('status-pill--ht');
      liveBadge.classList.add('live-badge--ht');
    }
  }

  ['pre','live','ht','ft'].forEach(s => {
    const b = q(`#sp${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (b) b.classList.toggle('sp-active', CACHE.status === s.toUpperCase());
  });
}

async function adjustScore(team, delta) {
  const current = CACHE.teams[team]?.score ?? 0;
  const newScore = Math.max(0, current + delta);
  await update(ref(db, `match/teams/${team}`), { score: newScore });
  if (delta > 0) {
    triggerScreenFlash();
    launchGoalCelebration(team, '');
  }
}

function renderScoreboard() {
  const hs = CACHE.teams.home.score;
  const as = CACHE.teams.away.score;

  const hEl = q('#homeScoreDisplay');
  const aEl = q('#awayScoreDisplay');
  if (hEl && hEl.textContent !== String(hs)) { hEl.textContent = hs; flashEl(hEl); }
  if (aEl && aEl.textContent !== String(as)) { aEl.textContent = as; flashEl(aEl); }

  setText('adminHomeScore', hs);
  setText('adminAwayScore', as);
  setText('homeTeamName', CACHE.teams.home.name);
  setText('awayTeamName', CACHE.teams.away.name);
  setText('pitchHomeName', CACHE.teams.home.name);
  setText('pitchAwayName', CACHE.teams.away.name);
  setText('statsHomeName', abbr(CACHE.teams.home.name));
  setText('statsAwayName', abbr(CACHE.teams.away.name));
  setText('matchVenue',    CACHE.venue);
  setText('lineupHomeHdr', CACHE.teams.home.name);
  setText('lineupAwayHdr', CACHE.teams.away.name);
}

/* ================================================================
   SECTION 7 — MATCH EVENTS
   ================================================================ */
async function addEvent() {
  const player  = (q('#evtPlayer')?.value  || '').trim() || 'Player';
  const player2 = (q('#evtPlayer2')?.value || '').trim();
  let elapsedMs = computeElapsedMs();
  if (typeof elapsedMs !== 'number' || isNaN(elapsedMs) || elapsedMs < 0) elapsedMs = 0;
  const min = Math.floor(elapsedMs / 60000);

  const evt = { team: _evtTeam, type: _evtType, player, player2, min, ts: serverTimestamp() };
  await set(push(EVENTS_REF), evt);

  if (_evtType === 'goal') {
    const current = CACHE.teams[_evtTeam]?.score ?? 0;
    await update(ref(db, `match/teams/${_evtTeam}`), { score: current + 1 });
    triggerScreenFlash();
    launchGoalCelebration(_evtTeam, player);
  }

  if(q('#evtPlayer')) q('#evtPlayer').value = '';
  if(q('#evtPlayer2')) q('#evtPlayer2').value = '';
}

function renderEvents() {
  const tl = q('#eventsTimeline');
  const empty = q('#eventsEmpty');
  
  const evts = Object.entries(CACHE.events || {})
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => (b.min - a.min) || ((b.ts || 0) - (a.ts || 0)));
  
  const badge = q('#eventsCount');
  if (badge) badge.textContent = `${evts.length} event${evts.length !== 1 ? 's' : ''}`;

  qa('.event-item', tl).forEach(n => n.remove());

  if (evts.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  const ICONS = { goal:'⚽', yellow:'🟨', red:'🟥', sub:'🔄', foul:'👟', offside:'🚩' };

  evts.forEach((ev, i) => {
    const div = document.createElement('div');
    div.className = 'event-item';
    div.style.animationDelay = `${i * 0.04}s`;
    const isHome = ev.team === 'home';
    const icon   = ICONS[ev.type] || '▪';

    const infoHTML = `
      <div class="evt-info">
        <span class="evt-player">${ev.player.toUpperCase()}</span>
        ${ev.player2 ? `<span class="evt-sub-txt">${ev.type === 'sub' ? '↑ ' + ev.player2 : 'Ast: ' + ev.player2}</span>` : ''}
      </div>`;

    div.innerHTML = `
      <div class="evt-home-side">${isHome  ? infoHTML : ''}</div>
      <div class="evt-center">
        <div class="evt-icon evt-icon--${ev.type}">${icon}</div>
        <span class="evt-min">${ev.min}'</span>
      </div>
      <div class="evt-away-side">${!isHome ? infoHTML : ''}</div>`;
    tl.appendChild(div);
  });
}

function renderCardCounts() {
  const evts = Object.values(CACHE.events || {});
  ['home', 'away'].forEach(side => {
    const el = q(`#${side}Cards`);
    if (!el) return;
    el.innerHTML = evts
      .filter(e => e.team === side && (e.type === 'yellow' || e.type === 'red'))
      .map(e => `<span class="mini-card mini-card--${e.type}"></span>`)
      .join('');
  });
}

function selectEvtTeam(t) {
  _evtTeam = t;
  q('#evtTeamHome')?.classList.toggle('active', t === 'home');
  q('#evtTeamAway')?.classList.toggle('active', t === 'away');
}

function selectEvtType(t) {
  _evtType = t;
  qa('.evt-type-btn').forEach(b => b.classList.toggle('selected', b.dataset.type === t));
}

/* ================================================================
   SECTION 8 — STATS & TEAMS UPDATE
   ================================================================ */
async function updateStat(key, value) {
  const v = parseFloat(value) || 0;
  const updates = {};
  const map = {
    possession:   'possession',
    shotsHome:    'homeShotsOn',  shotsAway:    'awayShotsOn',
    shotsOffHome: 'homeShotsOff', shotsOffAway: 'awayShotsOff',
    foulsHome:    'homeFouls',    foulsAway:    'awayFouls',
    cornersHome:  'homeCorners',  cornersAway:  'awayCorners',
    passHome:     'homePassAcc',  passAway:     'awayPassAcc'
  };
  if (!map[key]) return;
  updates[map[key]] = key === 'possession' ? Math.min(100, Math.max(0, v)) : v;
  await update(STATS_REF, updates);
}

function renderStats() {
  const s  = CACHE.stats;
  const el = q('#statsList');
  if (!el) return;

  const rows = [
    { label:'POSSESSION',       hV:s.possession,    aV:100-s.possession,    hW:s.possession,                                    aW:100-s.possession,                                    fmt:v=>v+'%' },
    { label:'SHOTS ON TARGET',  hV:s.homeShotsOn,   aV:s.awayShotsOn,       hW:pct(s.homeShotsOn,  s.homeShotsOn+s.awayShotsOn),  aW:pct(s.awayShotsOn,  s.homeShotsOn+s.awayShotsOn),   fmt:v=>v },
    { label:'SHOTS OFF TARGET', hV:s.homeShotsOff,  aV:s.awayShotsOff,      hW:pct(s.homeShotsOff, s.homeShotsOff+s.awayShotsOff),aW:pct(s.awayShotsOff, s.homeShotsOff+s.awayShotsOff), fmt:v=>v },
    { label:'FOULS',            hV:s.homeFouls,     aV:s.awayFouls,         hW:pct(s.homeFouls,   s.homeFouls+s.awayFouls),       aW:pct(s.awayFouls,   s.homeFouls+s.awayFouls),         fmt:v=>v },
    { label:'CORNERS',          hV:s.homeCorners,   aV:s.awayCorners,       hW:pct(s.homeCorners, s.homeCorners+s.awayCorners),   aW:pct(s.awayCorners, s.homeCorners+s.awayCorners),      fmt:v=>v },
    { label:'PASS ACCURACY',    hV:s.homePassAcc,   aV:s.awayPassAcc,       hW:pct(s.homePassAcc, s.homePassAcc+s.awayPassAcc),   aW:pct(s.awayPassAcc, s.homePassAcc+s.awayPassAcc),      fmt:v=>v+'%' }
  ];

  el.innerHTML = rows.map(r => `
    <div class="stat-row">
      <div class="stat-row-labels">
        <span class="stat-val">${r.fmt(r.hV)}</span>
        <span class="stat-name">${r.label}</span>
        <span class="stat-val">${r.fmt(r.aV)}</span>
      </div>
      <div class="stat-bar">
        <div class="stat-bar-h" style="width:${r.hW}%"></div>
        <div class="stat-bar-a" style="width:${r.aW}%"></div>
      </div>
    </div>`).join('');
}

function renderQuickStats() {
  const s = CACHE.stats;
  setText('qsHomePoss', s.possession + '%');
  setText('qsAwayPoss', (100 - s.possession) + '%');
  setWidth('qsPossBar', s.possession);

  const sh = s.homeShotsOn + s.awayShotsOn || 1;
  setText('qsHomeShots', s.homeShotsOn);
  setText('qsAwayShots', s.awayShotsOn);
  setWidth('qsShotsBar', Math.round(s.homeShotsOn / sh * 100));

  const sc = s.homeCorners + s.awayCorners || 1;
  setText('qsHomeCorners', s.homeCorners);
  setText('qsAwayCorners', s.awayCorners);
  setWidth('qsCornersBar', Math.round(s.homeCorners / sc * 100));
}

async function updateTeams() {
  const hn = q('#homeTeamI')?.value;
  const an = q('#awayTeamI')?.value;
  const vn = q('#venueI')?.value;

  const updates = {};
  if (hn) updates['teams/home/name'] = hn;
  if (an) updates['teams/away/name'] = an;
  if (vn) updates['venue'] = vn;

  if (Object.keys(updates).length > 0) {
    await update(MATCH_REF, updates);
    notify('info', '✅ UPDATED', 'Team information saved', '');
  }
}

/* ================================================================
   SECTION 9 — ADMIN UI & RESET
   ================================================================ */
function toggleAdmin() {
  _adminOpen = !_adminOpen;
  q('#adminPanel')  ?.classList.toggle('open',   _adminOpen);
  q('#adminOverlay')?.classList.toggle('active', _adminOpen);
  document.body.classList.toggle('no-scroll', _adminOpen);
}

function switchTab(tab) {
  qa('.a-tab').forEach(t => t.classList.remove('active'));
  qa('.a-content').forEach(c => c.classList.remove('active'));
  q(`[data-tab="${tab}"]`)?.classList.add('active');
  q(`#tab-${tab}`)?.classList.add('active');
}

function syncAdminInputs() {
  const s = CACHE.stats;
  const set2 = (id, val) => {
    const el = q('#' + id);
    if (!el) return;
    el.tagName === 'INPUT' ? (el.value = val) : (el.textContent = val);
  };
  set2('homeTeamI',    CACHE.teams.home.name);
  set2('awayTeamI',    CACHE.teams.away.name);
  set2('venueI',       CACHE.venue);
  set2('possSlider',   s.possession);
  set2('possVal',      s.possession + '%');
  set2('homeShotsI',   s.homeShotsOn);
  set2('awayShotsI',   s.awayShotsOn);
  set2('homeShotsOffI',s.homeShotsOff);
  set2('awayShotsOffI',s.awayShotsOff);
  set2('homeFoulsI',   s.homeFouls);
  set2('awayFoulsI',   s.awayFouls);
  set2('homeCornersI', s.homeCorners);
  set2('awayCornersI', s.awayCorners);
  set2('homePassI',    s.homePassAcc);
  set2('awayPassI',    s.awayPassAcc);
}

async function resetAll() {
  if (!confirm('Reset ALL match data? Scores, events, and timer will be cleared. This cannot be undone.')) return;
  await set(MATCH_REF, {
    ...DEFAULT_STATE,
    teams: {
      home: { name: CACHE.teams.home.name, score: 0 },
      away: { name: CACHE.teams.away.name, score: 0 }
    },
    venue: CACHE.venue
  });
  notify('info', '🔄 RESET', 'All match data cleared', '');
}

/* ================================================================
   SECTION 10 — MODALS, TICKER & VISUALS
   ================================================================ */
function openLineupModal() {
  renderLineups();
  q('#lineupModal')?.classList.add('open');
  document.body.classList.add('no-scroll');
}

function closeLineupModal() {
  q('#lineupModal')?.classList.remove('open');
  document.body.classList.remove('no-scroll');
}

function renderLineups() {
  buildLineupList('lineupHomeList', LINEUPS.home);
  buildLineupList('lineupAwayList', LINEUPS.away);
}

function buildLineupList(id, players) {
  const el = q('#' + id);
  if (!el) return;
  el.innerHTML = players.map((p, i) => `
    <div class="lp-row" style="animation-delay:${i * 0.04}s">
      <span class="lp-num">${p.n}</span>
      <span class="lp-name">${p.name}</span>
      <span class="lp-pos">${p.pos}</span>
    </div>`).join('');
}

function renderTicker() {
  const el = q('#tickerContent');
  if (!el) return;

  const goals = Object.values(CACHE.events || {})
    .filter(e => e.type === 'goal')
    .slice(0, 5)
    .map(e => `<span class="ticker-item ticker-item--hl">⚽ GOAL — ${e.player.toUpperCase()} (${teamLabel(e.team)}) ${e.min}'</span>`);

  const items = [
    `<span class="ticker-item ticker-item--hl">⚽ ${CACHE.teams.home.name} ${CACHE.teams.home.score}–${CACHE.teams.away.score} ${CACHE.teams.away.name} · ${statusLabel()}</span>`,
    `<span class="ticker-item">🏟️ ${CACHE.venue}</span>`,
    `<span class="ticker-item">🎙️ Live Match Commentary Available</span>`,
    `<span class="ticker-item">🌟 Live Football Experience</span>`,
    ...goals
  ];

  el.innerHTML = items.join('');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function launchGoalCelebration(team, playerName) {
  const teamName = CACHE.teams[team]?.name || '';
  const cel = q('#goalCelebration');
  const flashDiv = q('#goalFlash');
  if (!cel) return;

  setText('goalScorer', playerName ? playerName.toUpperCase() : '');
  setText('goalTeam', teamName);
  cel.classList.add('active');

  if (flashDiv) {
    flashDiv.classList.remove('flashing');
    void flashDiv.offsetWidth;
    flashDiv.classList.add('flashing');
  }

  startConfetti();
  notify('goal', '⚽ GOAL!', playerName || 'GOAL SCORED!', teamName);

  setTimeout(() => {
    cel.classList.remove('active');
    stopConfetti();
  }, 4200);
}

function startConfetti() {
  const canvas = q('#confettiCanvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  _confettiOn = true;

  const COLORS = ['#1A7BFF','#00E5FF','#FFFFFF','#FFD000','#00E676','#FF69B4'];
  const pieces = Array.from({ length: 180 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    vx: (Math.random() - .5) * 4,
    vy: Math.random() * 5 + 2,
    rot: Math.random() * 360,
    rotV: (Math.random() - .5) * 7,
    w: Math.random() * 9 + 4,
    h: Math.random() * 5 + 2,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: Math.random() > .4 ? 'rect' : 'circle'
  }));

  (function loop() {
    if (!_confettiOn) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.c;
      if (p.shape === 'rect') ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      else { ctx.beginPath(); ctx.arc(0, 0, p.w / 2.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    });
    _confettiRaf = requestAnimationFrame(loop);
  })();
}

function stopConfetti() {
  _confettiOn = false;
  cancelAnimationFrame(_confettiRaf);
  const c = q('#confettiCanvas');
  if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
}

function notify(type, title, body, sub) {
  const container = q('#notifContainer');
  if (!container) return;

  const elapsedSecs = Math.floor(Math.max(0, computeElapsedMs()) / 1000);
  const min = Math.floor(elapsedSecs / 60);

  const n = document.createElement('div');
  n.className = `notif notif--${type}`;
  n.innerHTML = `
    <div class="notif-head">
      <span class="notif-ico">${({ goal:'⚽', yellow:'🟨', red:'🟥', sub:'🔄', foul:'👟', offside:'🚩', info:'ℹ️' }[type] || '▪')}</span>
      <span class="notif-type">${title}</span>
      <span class="notif-ts">${pad2(min)}'</span>
    </div>
    <div class="notif-body">${body}</div>
    ${sub ? `<div class="notif-sub">${sub}</div>` : ''}`;

  container.prepend(n);
  while (container.children.length > 4) container.lastChild?.remove();
  setTimeout(() => n.remove(), 4200);
}

function seedNotifications() {
  setTimeout(() => notify('info', '🎙️ COMMENTARY', 'Match officials in position', CACHE.venue), 2800);
  setTimeout(() => notify('info', '📢 ANNOUNCEMENT', 'Welcome to the stadium', ''), 9000);
}

function initParticles() {
  const canvas = q('#particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  class Dust {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W; this.y = init ? Math.random() * H : H + 10;
      this.r = Math.random() * 1.6 + 0.4;
      this.vx = (Math.random() - .5) * .25; this.vy = -(Math.random() * .5 + .1);
      this.a = Math.random() * .35 + .05; this.life = 0;
      this.maxLife = Math.random() * 300 + 150;
      this.hue = Math.random() > .55 ? '26,123,255' : '0,229,255';
    }
    update() { this.x += this.vx; this.y += this.vy; this.life++; if (this.life > this.maxLife || this.y < -10) this.reset(false); }
    draw() { const a = this.a * (1 - this.life / this.maxLife); ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(${this.hue},${a.toFixed(3)})`; ctx.fill(); }
  }

  const pts = Array.from({ length: 90 }, () => new Dust());
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  })();
}

function runLoader() {
  const screen = q('#loadingScreen');
  const bar = q('#loaderProgress');
  const pctText = q('#loaderPct');
  if (!screen || !bar || !pctText) return;

  let p = 0;
  const iv = setInterval(() => {
    p += 3;
    if (p >= 100) {
      p = 100; clearInterval(iv);
      setTimeout(() => {
        screen.classList.add('out');
        document.body.classList.remove('loading');
        setTimeout(() => screen.remove(), 750);
      }, 380);
    }
    bar.style.width = p + '%';
    pctText.textContent = Math.round(p) + '%';
  }, 70);
}

function renderCrests() {
  const hc = q('#homeCrest'); if (hc) hc.innerHTML = `<img src="home-logo.png" alt="Home team crest">`;
  const ac = q('#awayCrest'); if (ac) ac.innerHTML = `<img src="away-logo.png" alt="Away team crest">`;
}

function triggerScreenFlash() {
  const el = q('#screenFlash');
  if (!el) return;
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
}

/* ================================================================
   SECTION 11 — UTILITY HELPERS
   ================================================================ */
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setWidth(id, pct) { const el = document.getElementById(id); if (el) el.style.width = pct + '%'; }
function flashEl(el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 700); }
function pad2(n) { return String(n).padStart(2, '0'); }
function pct(v, total) { return total > 0 ? Math.round(v / total * 100) : 50; }
function abbr(n) { if (n.length <= 8) return n; const p = n.split(' '); return p.length > 1 ? p[p.length - 1] : n.substring(0, 8); }
function statusLabel() { return { PRE:'PRE-MATCH', LIVE:'LIVE', HT:'HALF TIME', FT:'FULL TIME' }[CACHE.status] || 'PRE-MATCH'; }
function periodLabel() {
  if (CACHE.status === 'HT') return 'HALF TIME';
  if (CACHE.status === 'FT') return 'FULL TIME';
  if (CACHE.status === 'PRE') return 'PRE-MATCH';
  const secs = Math.floor(Math.max(0, computeElapsedMs()) / 1000);
  return secs < 2700 ? '1ST HALF' : '2ND HALF';
}
function teamLabel(t) { return t === 'home' ? CACHE.teams.home.name : CACHE.teams.away.name; }
