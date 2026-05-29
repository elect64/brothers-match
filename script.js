/* ================================================================
   BROTHERS MATCH — Premium Live Football Platform
   script.js · v2.0
   ================================================================ */

'use strict';

/* ==================== FIREBASE SETUP ==================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// REPLACE THIS OBJECT WITH your exact config from Step 1.3
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDIsNwNf8dcHOOYBckXgXAGpMisBrG4pxM",
  authDomain: "live-score-app-63a97.firebaseapp.com",
  databaseURL: "https://live-score-app-63a97-default-rtdb.firebaseio.com",
  projectId: "live-score-app-63a97",
  storageBucket: "live-score-app-63a97.firebasestorage.app",
  messagingSenderId: "484767214076",
  appId: "1:484767214076:web:2c89b11777547f2648aa79",
  measurementId: "G-LYDGFJD5XH"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const db = getDatabase(app);

// Create a main reference point for our match data
const matchRef = ref(db, 'liveMatch');

console.log("Firebase successfully initialized and connected!");

onValue(matchRef, (snapshot) => {

 const data = snapshot.val();

 document.getElementById("homeScoreDisplay")
 .innerText = data.scoreA;

 document.getElementById("awayScoreDisplay")
 .innerText = data.scoreB;

});

/* ==================== STAGE 2: DATABASE INITIALIZATION ==================== */
// A temporary one-time function to build our initial JSON tree in Firebase
function initializeDatabase() {
  set(matchRef, {
    teams: {
      home: { name: "200L & 300L", score: 0 },
      away: { name: "100L & FYB", score: 0 }
    },
    status: "PRE",
    timer: {
      running: false,
      startTime: 0,
      elapsed: 0
    }
  }).then(() => {
    console.log("✅ Database structure created successfully!");
  }).catch((error) => {
    console.error("❌ Error creating database:", error);
  });
}

// ACTION REQUIRED: Uncomment the line below to run the function once.
  // initializeDatabase();

/* ==================== STAGES 3 & 4: ARCHITECTURE INTEGRATION ==================== */

// Global variable to hold our background calculation loop
let firebaseTimerInterval = null;

onValue(matchRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    console.warn("No match data found in Firebase.");
    return;
  }

  console.log("🔥 Firebase Match Sync Received:", data);

  // 1. Sync Score & Team State directly into your architecture
  STATE.home.name = data.teams.home.name;
  STATE.home.score = data.teams.home.score;
  STATE.away.name = data.teams.away.name;
  STATE.away.score = data.teams.away.score;
  STATE.status = data.status;

  // 2. Manage the Professional Synchronized Timer Loop
  const fTimer = data.timer;
  
  if (firebaseTimerInterval) {
    clearInterval(firebaseTimerInterval);
  }

  const runTimerCalculation = () => {
    let currentElapsedSeconds = Number(fTimer.elapsed) || 0;

    if (fTimer.running && fTimer.startTime) {
      const serverNow = Date.now();
      // Calculate real time delta from server timestamp coordinates
      const secondsSinceKickoff = Math.max(0, Math.floor((serverNow - fTimer.startTime) / 1000));
      currentElapsedSeconds += secondsSinceKickoff;
    }

    // Crucial Bridge: Inject calculated time straight into your local tracking state
    STATE.timer.secs = currentElapsedSeconds;
    STATE.timer.running = fTimer.running;

    // Fire your native UI rendering function to update every asset on screen smoothly
    syncUI();
  };

  // If match is active, loop the clock engine every 200ms to stay synchronized
  if (fTimer.running) {
    firebaseTimerInterval = setInterval(runTimerCalculation, 200);
  } else {
    runTimerCalculation();
  }
});


// /* ==================== STAGE 4: TIMER ENGINE (FORTIFIED) ==================== */
//     const timerData = data.timer;
//     const matchStatus = data.status;
    
//     if (window.matchTimerInterval) {
//       clearInterval(window.matchTimerInterval);
//     }

//     const updateTimerDisplay = () => {
//       let totalSeconds = Number(timerData.elapsed) || 0;

//       if (timerData.running && timerData.startTime) {
//         const now = Date.now();
//         // Math.max guarantees we never display a broken negative value if clocks are out of sync
//         const secondsSinceStart = Math.max(0, Math.floor((now - timerData.startTime) / 1000));
//         totalSeconds += secondsSinceStart;
//       }

//       const mins = Math.floor(totalSeconds / 60);
//       const secs = totalSeconds % 60;
//       const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

//       // Targeted UI Selector Fallback
//       // This checks for the main timer classes used in premium sport templates
//       const mainTimerEl = document.querySelector('.timer-digital') || 
//                           document.getElementById('timerDisplay') || 
//                           document.querySelector('.timer-display');
                          
//       if (mainTimerEl) {
//         mainTimerEl.innerText = formattedTime;
//       } else {
//         console.warn("⚠️ Timer UI element not targeted. Calculated Time:", formattedTime);
//       }
//     };

//     if (timerData.running) {
//       console.log("⏱️ Timer Loop is actively executing on Firebase trigger...");
//       window.matchTimerInterval = setInterval(updateTimerDisplay, 100); // 10hz update frequency
//     } else {
//       updateTimerDisplay();
//     }

//     // Status Pill Sync
//     const statusPill = document.querySelector('.status-badge') || document.querySelector('.status-pill');
//     if (statusPill) {
//       if (matchStatus === "PRE") statusPill.innerText = "PRE-MATCH";
//       if (matchStatus === "LIVE") statusPill.innerText = "LIVE";
//       if (matchStatus === "HT") statusPill.innerText = "HALFTIME";
//       if (matchStatus === "FT") statusPill.innerText = "FULLTIME";
//     }


/* ==================== STATE ==================== */
const STATE = {
  home: { name: '200L & 300L', score: 0 },
  away: { name: '100L & FYB',   score: 0 },
  timer:  { secs: 0, running: false, _iv: null },
  status: 'PRE',  // PRE | LIVE | HT | FT
  events: [],
  stats: {
    possession: 50,
    homeShotsOn:  0, awayShotsOn:  0,
    homeShotsOff: 0, awayShotsOff: 0,
    homeFouls:    0, awayFouls:    0,
    homeCorners:  0, awayCorners:  0,
    homePassAcc: 78, awayPassAcc: 74
  },
  venue: 'Estadio Premiere Olobo',
  adminEvtTeam: 'home',
  adminEvtType: 'goal',
  _confettiRaf: null,
  _confettiRunning: false
};

const STORAGE_KEY = 'bm_v2';

/* ==================== LINEUPS ==================== */
const LINEUPS = {
  home: [
    {n:1, name:'O. KENNEDY',    pos:'AM'},
    {n:2, name:'S. JOSHUA',     pos:'RB'},
    {n:5, name:'JIDE',     pos:'CB'},
    {n:6, name:'P. CHIMA',       pos:'CB'},
    {n:3, name:'E. VICTOR',    pos:'LB'},
    {n:8, name:'O. ELECT',     pos:'CM'},
    {n:4, name:'CHIDIOMIMI',    pos:'CM'},
    {n:7, name:'ARINZE',      pos:'RW'},
    {n:10,name:'U. EMMANUEL', pos:'GK'},
    {n:11,name:'GREAT-VICTOR',      pos:'LW'},
    {n:9, name:'',      pos:'ST'}
  ],
  away: [
    {n:1, name:'P. BEULAH',    pos:'GK'},
    {n:2, name:'C. GODSWILL',   pos:'RB'},
    {n:5, name:'C. PLACID',  pos:'CB'},
    {n:6, name:'N. BENJAMIN',  pos:'CB'},
    {n:3, name:'E. DANIEL',  pos:'LB'},
    {n:8, name:'J. SUCCESS',   pos:'CM'},
    {n:4, name:'A. JOHN',  pos:'CM'},
    {n:7, name:'C. MIRACLE',pos:'RW'},
    {n:10,name:'O. MIRACLE',    pos:'AM'},
    {n:11,name:'O. JUSTICE', pos:'LW'},
    {n:9, name:'C. PROSPER',   pos:'ST'}
  ]
};

/* ==================== BOOT ==================== */
document.addEventListener('DOMContentLoaded', () => {
  runLoader();
  loadStorage();
  initParticles();
  initTicker();
  renderCrests();
  renderStats();
  renderEvents();
  syncUI();
  syncAdminInputs();
  renderLineups();
  startAutoSave();
  seedNotifications();
});

/* ==================== LOADING SCREEN ==================== */
function runLoader() {
  const screen = document.getElementById('loadingScreen');
  const bar    = document.getElementById('loaderProgress');
  const pct    = document.getElementById('loaderPct');
  if (!screen || !bar || !pct) {
    if (document.body) document.body.classList.remove('loading');
    if (screen && screen.parentNode) screen.parentNode.removeChild(screen);
    return;
  }

  let p = 0;
  const iv = setInterval(() => {
    p += Math.random() * 14 + 4;
    if (p >= 100) {
      p = 100;
      clearInterval(iv);
      setTimeout(() => {
        screen.classList.add('out');
        document.body.classList.remove('loading');
        setTimeout(() => screen.remove(), 750);
      }, 380);
    }
    bar.style.width = p + '%';
    pct.textContent  = Math.round(p) + '%';
  }, 70);
}

/* ==================== PARTICLES ==================== */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, pts = [], streaks = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* Floating dust particle */
  class Dust {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.6 + 0.4;
      this.vx = (Math.random() - .5) * .25;
      this.vy = -(Math.random() * .5 + .1);
      this.a  = Math.random() * .35 + .05;
      this.life = 0;
      this.maxLife = Math.random() * 300 + 150;
      this.hue = Math.random() > .55 ? '26,123,255' : '0,229,255';
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.life++;
      if (this.life > this.maxLife || this.y < -10) this.reset(false);
    }
    draw() {
      const a = this.a * (1 - this.life / this.maxLife);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.hue},${a.toFixed(3)})`;
      ctx.fill();
    }
  }

  /* Light streak */
  class Streak {
    constructor() { this.reset(); this.active = false; }
    reset() {
      this.x     = Math.random() * W;
      this.y     = -80;
      this.len   = Math.random() * 120 + 60;
      this.speed = Math.random() * 2.5 + 1.2;
      this.a     = Math.random() * .22 + .05;
      this.w     = Math.random() * 1.2 + .4;
    }
    update() { this.y += this.speed; if (this.y > H + 100) { this.reset(); this.active = false; } }
    draw() {
      if (!this.active) return;
      const g = ctx.createLinearGradient(this.x, this.y - this.len, this.x, this.y);
      g.addColorStop(0,   `rgba(0,229,255,0)`);
      g.addColorStop(.5,  `rgba(0,229,255,${this.a})`);
      g.addColorStop(1,   `rgba(26,123,255,0)`);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.len);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = g;
      ctx.lineWidth   = this.w;
      ctx.stroke();
    }
  }

  for (let i = 0; i < 90;  i++) pts.push(new Dust());
  for (let i = 0; i < 6;   i++) streaks.push(new Streak());

  /* Randomly activate streaks */
  setInterval(() => {
    const s = streaks[Math.floor(Math.random() * streaks.length)];
    if (!s.active) { s.active = true; }
  }, 2200);

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => { p.update(); p.draw(); });
    streaks.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(loop);
  })();
}

/* ==================== TICKER ==================== */
const TICKER_STATIC = [
  '🏟️ Estadio Premiere Olobo · 30th May 2026',
  '🎙️ Live Match Commentary Available',
  '📱 Share the Live Experience with Fellow Brothers',
  '⚽ Brotherhood · Unity · Competition',
  '🌟 Brothers Football Match — Bringing Brothers Together on the Pitch',
  '🔥 Tonight\'s Feature Fixture Is LIVE',
];

function initTicker() { updateTicker(); }

function updateTicker() {
  const el = document.getElementById('tickerContent');
  if (!el) return;
  const items = [
    `<span class="ticker-item ticker-item--hl">⚽ ${STATE.home.name} ${STATE.home.score}–${STATE.away.score} ${STATE.away.name} · ${statusLabel()}</span>`,
    ...TICKER_STATIC.map(t => `<span class="ticker-item">${t}</span>`),
    ...STATE.events
      .filter(e => e.type === 'goal')
      .slice(0, 5)
      .map(e => `<span class="ticker-item ticker-item--hl">⚽ GOAL — ${e.player.toUpperCase()} (${teamLabel(e.team)}) ${e.min}'</span>`)
  ];
  el.innerHTML = items.join('');
  /* reset animation */
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function teamLabel(t) { return t === 'home' ? STATE.home.name : STATE.away.name; }
function statusLabel() {
  return { PRE:'PRE-MATCH', LIVE:'LIVE', HT:'HALF TIME', FT:'FULL TIME' }[STATE.status] || 'PRE-MATCH';
}

/* ==================== CRESTS ==================== */
function renderCrests() {
  const hc = document.getElementById('homeCrest');
  const ac = document.getElementById('awayCrest');
  if (hc) hc.innerHTML = homeCrestSVG();
  if (ac) ac.innerHTML = awayCrestSVG();
}

function homeCrestSVG() {
  return `<svg viewBox="0 0 82 82" fill="none">
    <defs>
      <linearGradient id="hg1" x1="0" y1="0" x2="82" y2="82"><stop offset="0%" stop-color="#1A7BFF"/><stop offset="100%" stop-color="#003399"/></linearGradient>
      <linearGradient id="hg2" x1="0" y1="0" x2="82" y2="82"><stop offset="0%" stop-color="#00E5FF"/><stop offset="100%" stop-color="#1A7BFF"/></linearGradient>
    </defs>
    <path d="M41 5L74 18L74 44C74 62 58 76 41 80C24 76 8 62 8 44L8 18Z" fill="url(#hg1)" stroke="url(#hg2)" stroke-width="1.5"/>
    <path d="M41 13L66 24L66 44C66 58 53 69 41 73C29 69 16 58 16 44L16 24Z" fill="rgba(0,20,60,0.55)"/>
    <path d="M28 36C28 30 34 26 39 26C41 26 43 27 44 29L48 27C50 26 51 27 51 28L49 31C50 33 50 37 48 39L47 46C47 48 44 50 41 50C38 50 35 48 35 46L34 39C31 37 28 37 28 36Z" fill="url(#hg2)" opacity=".85"/>
    <circle cx="38" cy="30" r="2.2" fill="white" opacity=".65"/>
    <path d="M27 56L32 53L37 55L41 54L45 55L50 53L55 56" stroke="url(#hg2)" stroke-width="1" fill="none" opacity=".5"/>
    <text x="29" y="66" font-size="7.5" fill="url(#hg2)" font-family="serif" opacity=".8">★ ★ ★</text>
  </svg>`;
}

function awayCrestSVG() {
  return `<svg viewBox="0 0 82 82" fill="none">
    <defs>
      <linearGradient id="ag1" x1="0" y1="0" x2="82" y2="82"><stop offset="0%" stop-color="#00C8E6"/><stop offset="100%" stop-color="#004466"/></linearGradient>
      <linearGradient id="ag2" x1="0" y1="0" x2="82" y2="82"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#00E5FF"/></linearGradient>
    </defs>
    <path d="M41 5L74 18L74 44C74 62 58 76 41 80C24 76 8 62 8 44L8 18Z" fill="url(#ag1)" stroke="url(#ag2)" stroke-width="1.5"/>
    <path d="M41 13L66 24L66 44C66 58 53 69 41 73C29 69 16 58 16 44L16 24Z" fill="rgba(0,30,50,0.55)"/>
    <path d="M17 40C20 30 27 26 33 31L37 28L41 26L45 28L49 31C55 26 62 30 65 40L55 37L50 43L41 48L32 43L27 37Z" fill="url(#ag2)" opacity=".85"/>
    <circle cx="41" cy="31" r="4.5" fill="white" opacity=".2"/>
    <circle cx="41" cy="31" r="2"   fill="url(#ag2)" opacity=".8"/>
    <text x="29" y="66" font-size="7.5" fill="url(#ag2)" font-family="serif" opacity=".8">★ ★ ★</text>
  </svg>`;
}

/* ==================== SYNC ALL UI ==================== */
function syncUI() {
  /* Scores */
  setText('homeScoreDisplay', STATE.home.score);
  setText('awayScoreDisplay', STATE.away.score);
  setText('adminHomeScore',   STATE.home.score);
  setText('adminAwayScore',   STATE.away.score);

  /* Names */
  setText('homeTeamName', STATE.home.name);
  setText('awayTeamName', STATE.away.name);
  setText('pitchHomeName', STATE.home.name);
  setText('pitchAwayName', STATE.away.name);
  setText('statsHomeName', abbr(STATE.home.name));
  setText('statsAwayName', abbr(STATE.away.name));
  setText('matchVenue', STATE.venue);
  setText('lineupHomeHdr', STATE.home.name);
  setText('lineupAwayHdr', STATE.away.name);

  /* Status */
  syncStatus();

  /* Timer */
  syncTimerDisplay();
  syncTimerBtns();

  /* Quick stats */
  syncQuickStats();

  /* Ticker */
  updateTicker();

  /* Card counts */
  renderCardCounts();
}

function abbr(n) {
  if (n.length <= 8) return n;
  const parts = n.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : n.substring(0,8);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function syncStatus() {
  const label  = statusLabel();
  const period = periodLabel();

  setText('matchStatusText',  label);
  setText('liveBadgeText',    label);
  setText('timerPeriodLabel', label);
  setText('matchPeriod',      period);

  /* Badge classes */
  const badge    = document.getElementById('matchStatusBadge');
  const liveBadge = document.getElementById('liveBadge');
  if (!badge || !liveBadge) return;

  badge.className    = 'status-pill';
  liveBadge.className = 'live-badge';

  if (STATE.status === 'LIVE') {
    badge.classList.add('status-pill--live');
    liveBadge.classList.add('live-badge--live');
  } else if (STATE.status === 'HT' || STATE.status === 'FT') {
    badge.classList.add('status-pill--ht');
    liveBadge.classList.add('live-badge--ht');
  }

  /* Status pill buttons highlight */
  ['pre','live','ht','ft'].forEach(s => {
    const b = document.getElementById('sp' + s.charAt(0).toUpperCase() + s.slice(1));
    if (b) b.classList.toggle('sp-active', STATE.status === s.toUpperCase());
  });
}

function periodLabel() {
  if (STATE.status === 'HT') return 'HALF TIME';
  if (STATE.status === 'FT') return 'FULL TIME';
  if (STATE.status === 'PRE') return 'PRE-MATCH';
  return STATE.timer.secs < 2700 ? '1ST HALF' : '2ND HALF';
}

function syncTimerDisplay() {
  const m = Math.floor(STATE.timer.secs / 60);
  const s = STATE.timer.secs % 60;
  const str = pad2(m) + ':' + pad2(s);

  setText('timerDisplay',    str);
  setText('timerBigDisplay', str);
  setText('matchPeriod',     periodLabel());

  /* Ring progress (90 min = full) */
  const progress = Math.min(STATE.timer.secs / 5400, 1);
  const circ     = 175.9;
  const el = document.getElementById('timerCircle');
  if (el) el.style.strokeDashoffset = (circ - progress * circ).toFixed(2);
}

function syncTimerBtns() {
  const startB = document.getElementById('startTimerBtn');
  const pauseB = document.getElementById('pauseTimerBtn');
  if (startB) startB.disabled = STATE.timer.running;
  if (pauseB) pauseB.disabled = !STATE.timer.running;
}

function syncQuickStats() {
  const s    = STATE.stats;
  const poss = s.possession;
  setText('qsHomePoss',    poss + '%');
  setText('qsAwayPoss',    (100 - poss) + '%');
  setWidth('qsPossBar',    poss);

  const sh = s.homeShotsOn + s.awayShotsOn || 1;
  setText('qsHomeShots',  s.homeShotsOn);
  setText('qsAwayShots',  s.awayShotsOn);
  setWidth('qsShotsBar',  Math.round(s.homeShotsOn / sh * 100));

  const sc = s.homeCorners + s.awayCorners || 1;
  setText('qsHomeCorners', s.homeCorners);
  setText('qsAwayCorners', s.awayCorners);
  setWidth('qsCornersBar', Math.round(s.homeCorners / sc * 100));
}

function setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = pct + '%';
}

function pad2(n) { return String(n).padStart(2,'0'); }

/* ==================== TIMER ==================== */
function timerControl(action) {
  switch (action) {
    case 'start':
      if (!STATE.timer.running) {
        STATE.timer.running = true;
        if (STATE.status === 'PRE' || STATE.status === 'HT') {
          STATE.status = 'LIVE';
        }
        STATE.timer._iv = setInterval(() => {
          STATE.timer.secs++;
          syncTimerDisplay();
          syncStatus();
        }, 1000);
        syncStatus();
        syncTimerBtns();
      }
      break;
    case 'pause':
      if (STATE.timer.running) {
        STATE.timer.running = false;
        clearInterval(STATE.timer._iv);
        STATE.timer._iv = null;
        syncTimerBtns();
      }
      break;
    case 'reset':
      clearInterval(STATE.timer._iv);
      STATE.timer._iv = null;
      STATE.timer.running = false;
      STATE.timer.secs    = 0;
      STATE.status        = 'PRE';
      syncStatus();
      syncTimerDisplay();
      syncTimerBtns();
      break;
  }
  saveStorage();
}

/* ==================== MATCH STATUS ==================== */
function setStatus(s) {
  STATE.status = s;
  if (s === 'LIVE' && !STATE.timer.running) timerControl('start');
  if ((s === 'HT' || s === 'FT') && STATE.timer.running) timerControl('pause');
  syncStatus();
  updateTicker();
  notify('info', '📋 STATUS', statusLabel(), '');
  saveStorage();
}

/* ==================== SCORE ==================== */
function adjustScore(team, delta) {
  if (team === 'home') {
    STATE.home.score = Math.max(0, STATE.home.score + delta);
  } else {
    STATE.away.score = Math.max(0, STATE.away.score + delta);
  }

  const elId = team === 'home' ? 'homeScoreDisplay' : 'awayScoreDisplay';
  flashScore(elId);

  setText('homeScoreDisplay', STATE.home.score);
  setText('awayScoreDisplay', STATE.away.score);
  setText('adminHomeScore',   STATE.home.score);
  setText('adminAwayScore',   STATE.away.score);

  if (delta > 0) {
    triggerScreenFlash();
    launchGoalCelebration(team, '');
  }

  updateTicker();
  saveStorage();
}

function flashScore(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 700);
}

function triggerScreenFlash() {
  const el = document.getElementById('screenFlash');
  if (!el) return;
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
}

/* ==================== GOAL CELEBRATION ==================== */
function launchGoalCelebration(team, playerName) {
  const teamName  = team === 'home' ? STATE.home.name : STATE.away.name;
  const cel       = document.getElementById('goalCelebration');
  const flashDiv  = document.getElementById('goalFlash');
  if (!cel) return;

  setText('goalScorer', playerName ? playerName.toUpperCase() : '');
  setText('goalTeam',   teamName);

  cel.classList.add('active');

  /* Flash */
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

/* ==================== CONFETTI ==================== */
function startConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  STATE._confettiRunning = true;

  const COLORS = ['#1A7BFF','#00E5FF','#FFFFFF','#FFD000','#00E676','#FF69B4'];
  const pieces = Array.from({length: 180}, () => ({
    x:  Math.random() * canvas.width,
    y:  Math.random() * canvas.height - canvas.height,
    vx: (Math.random() - .5) * 4,
    vy: Math.random() * 5 + 2,
    rot: Math.random() * 360,
    rotV:(Math.random() - .5) * 7,
    w:  Math.random() * 9 + 4,
    h:  Math.random() * 5 + 2,
    c:  COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: Math.random() > .4 ? 'rect' : 'circle'
  }));

  (function loop() {
    if (!STATE._confettiRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.rotV;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.c;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    STATE._confettiRaf = requestAnimationFrame(loop);
  })();
}

function stopConfetti() {
  STATE._confettiRunning = false;
  cancelAnimationFrame(STATE._confettiRaf);
  const c = document.getElementById('confettiCanvas');
  if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

/* ==================== EVENTS ==================== */
function selectEvtTeam(t) {
  STATE.adminEvtTeam = t;
  document.getElementById('evtTeamHome').classList.toggle('active', t === 'home');
  document.getElementById('evtTeamAway').classList.toggle('active', t === 'away');
}

function selectEvtType(t) {
  STATE.adminEvtType = t;
  document.querySelectorAll('.evt-type-btn').forEach(b => b.classList.toggle('selected', b.dataset.type === t));
}

function addEvent() {
  const player  = (document.getElementById('evtPlayer')?.value  || '').trim() || 'Player';
  const player2 = (document.getElementById('evtPlayer2')?.value || '').trim();
  const team    = STATE.adminEvtTeam;
  const type    = STATE.adminEvtType;
  const min     = Math.floor(STATE.timer.secs / 60);

  const evt = { id: Date.now(), team, type, player, player2, min };
  STATE.events.unshift(evt);

  /* Auto-score goal */
  if (type === 'goal') {
    if (team === 'home') STATE.home.score++;
    else                  STATE.away.score++;

    const elId = team === 'home' ? 'homeScoreDisplay' : 'awayScoreDisplay';
    flashScore(elId);
    setText('homeScoreDisplay', STATE.home.score);
    setText('awayScoreDisplay', STATE.away.score);
    setText('adminHomeScore',   STATE.home.score);
    setText('adminAwayScore',   STATE.away.score);
    triggerScreenFlash();
    launchGoalCelebration(team, player);
  }

  /* Card tracking */
  if (type === 'yellow' || type === 'red') renderCardCounts();

  renderEvents();
  updateTicker();
  saveStorage();

  /* Notification for non-goal events */
  const icons  = {yellow:'🟨', red:'🟥', sub:'🔄', foul:'👟', offside:'🚩'};
  const labels = {yellow:'YELLOW CARD', red:'RED CARD', sub:'SUBSTITUTION', foul:'FOUL', offside:'OFFSIDE'};
  if (type !== 'goal') notify(type, `${icons[type]} ${labels[type]}`, player.toUpperCase(), teamLabel(team));

  /* Clear inputs */
  const evtP  = document.getElementById('evtPlayer');
  const evtP2 = document.getElementById('evtPlayer2');
  if (evtP)  evtP.value  = '';
  if (evtP2) evtP2.value = '';
}

function renderEvents() {
  const tl    = document.getElementById('eventsTimeline');
  const empty = document.getElementById('eventsEmpty');
  const badge = document.getElementById('eventsCount');
  if (!tl) return;

  if (badge) badge.textContent = `${STATE.events.length} event${STATE.events.length !== 1 ? 's' : ''}`;

  /* Remove old event items */
  Array.from(tl.children).forEach(c => { if (!c.classList.contains('events-empty')) c.remove(); });

  if (STATE.events.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  const EVT_ICONS = {goal:'⚽', yellow:'🟨', red:'🟥', sub:'🔄', foul:'👟', offside:'🚩'};

  STATE.events.forEach((ev, i) => {
    const div  = document.createElement('div');
    div.className = 'event-item';
    div.style.animationDelay = `${i * 0.04}s`;
    div.dataset.id = ev.id;

    const isHome = ev.team === 'home';
    const icon   = EVT_ICONS[ev.type] || '▪';

    const infoHTML = `
      <div class="evt-info">
        <span class="evt-player">${ev.player.toUpperCase()}</span>
        ${ev.player2 ? `<span class="evt-sub-txt">${ev.type === 'sub' ? '↑ ' + ev.player2 : 'Ast: ' + ev.player2}</span>` : ''}
      </div>`;

    div.innerHTML = `
      <div class="evt-home-side">${isHome ? infoHTML : ''}</div>
      <div class="evt-center">
        <div class="evt-icon evt-icon--${ev.type}">${icon}</div>
        <span class="evt-min">${ev.min}'</span>
      </div>
      <div class="evt-away-side">${!isHome ? infoHTML : ''}</div>`;

    tl.appendChild(div);
  });
}

function renderCardCounts() {
  ['home','away'].forEach(side => {
    const el = document.getElementById(`${side}Cards`);
    if (!el) return;
    const evts = STATE.events.filter(e => e.team === side && (e.type === 'yellow' || e.type === 'red'));
    el.innerHTML = evts.map(e => `<span class="mini-card mini-card--${e.type}"></span>`).join('');
  });
}

/* ==================== STATS ==================== */
function renderStats() {
  const s  = STATE.stats;
  const el = document.getElementById('statsList');
  if (!el) return;

  const rows = [
    { label:'POSSESSION',       hVal:s.possession,   aVal:100-s.possession,   hW:s.possession,                              aW:100-s.possession,            fmt:v=>v+'%'  },
    { label:'SHOTS ON TARGET',  hVal:s.homeShotsOn,  aVal:s.awayShotsOn,      hW:pct(s.homeShotsOn, s.homeShotsOn+s.awayShotsOn),  aW:pct(s.awayShotsOn, s.homeShotsOn+s.awayShotsOn),  fmt:v=>v },
    { label:'SHOTS OFF TARGET', hVal:s.homeShotsOff, aVal:s.awayShotsOff,     hW:pct(s.homeShotsOff,s.homeShotsOff+s.awayShotsOff),aW:pct(s.awayShotsOff,s.homeShotsOff+s.awayShotsOff),fmt:v=>v },
    { label:'FOULS',            hVal:s.homeFouls,    aVal:s.awayFouls,        hW:pct(s.homeFouls, s.homeFouls+s.awayFouls),         aW:pct(s.awayFouls, s.homeFouls+s.awayFouls),         fmt:v=>v },
    { label:'CORNERS',          hVal:s.homeCorners,  aVal:s.awayCorners,      hW:pct(s.homeCorners,s.homeCorners+s.awayCorners),    aW:pct(s.awayCorners,s.homeCorners+s.awayCorners),    fmt:v=>v },
    { label:'PASS ACCURACY',    hVal:s.homePassAcc,  aVal:s.awayPassAcc,      hW:pct(s.homePassAcc,s.homePassAcc+s.awayPassAcc),    aW:pct(s.awayPassAcc,s.homePassAcc+s.awayPassAcc),    fmt:v=>v+'%' },
  ];

  el.innerHTML = rows.map(r => `
    <div class="stat-row">
      <div class="stat-row-labels">
        <span class="stat-val">${r.fmt(r.hVal)}</span>
        <span class="stat-name">${r.label}</span>
        <span class="stat-val">${r.fmt(r.aVal)}</span>
      </div>
      <div class="stat-bar">
        <div class="stat-bar-h" style="width:${r.hW}%"></div>
        <div class="stat-bar-a" style="width:${r.aW}%"></div>
      </div>
    </div>`).join('');
}

function pct(v, total) { return total > 0 ? Math.round(v / total * 100) : 50; }

function updateStat(key, value) {
  const v = parseFloat(value) || 0;
  const s = STATE.stats;
  const map = {
    possession:   () => { s.possession   = Math.min(100, Math.max(0, v)); setText('possVal', v+'%'); },
    shotsHome:    () => { s.homeShotsOn  = v; },
    shotsAway:    () => { s.awayShotsOn  = v; },
    shotsOffHome: () => { s.homeShotsOff = v; },
    shotsOffAway: () => { s.awayShotsOff = v; },
    foulsHome:    () => { s.homeFouls    = v; },
    foulsAway:    () => { s.awayFouls    = v; },
    cornersHome:  () => { s.homeCorners  = v; },
    cornersAway:  () => { s.awayCorners  = v; },
    passHome:     () => { s.homePassAcc  = v; },
    passAway:     () => { s.awayPassAcc  = v; }
  };
  if (map[key]) map[key]();
  renderStats();
  syncQuickStats();
  saveStorage();
}

/* ==================== TEAM UPDATES ==================== */
function updateTeams() {
  const hn = (document.getElementById('homeTeamI')?.value || '').trim().toUpperCase();
  const an = (document.getElementById('awayTeamI')?.value || '').trim().toUpperCase();
  const vn = (document.getElementById('venueI')?.value   || '').trim();
  if (hn) STATE.home.name = hn;
  if (an) STATE.away.name = an;
  if (vn) STATE.venue     = vn;
  syncUI();
  renderLineups();
  saveStorage();
  notify('info','✅ UPDATED','Team information saved','');
}

/* ==================== ADMIN PANEL ==================== */
let _adminOpen = false;

function toggleAdmin() {
  _adminOpen = !_adminOpen;
  document.getElementById('adminPanel')?.classList.toggle('open', _adminOpen);
  document.getElementById('adminOverlay')?.classList.toggle('active', _adminOpen);
  document.body.classList.toggle('no-scroll', _adminOpen);
}

function switchTab(tab) {
  document.querySelectorAll('.a-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.a-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`tab-${tab}`)?.classList.add('active');
}

/* ==================== LINEUP MODAL ==================== */
function renderLineups() {
  setText('lineupHomeHdr', STATE.home.name);
  setText('lineupAwayHdr', STATE.away.name);
  buildLineupList('lineupHomeList', LINEUPS.home);
  buildLineupList('lineupAwayList', LINEUPS.away);
}

function buildLineupList(id, players) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = players.map((p, i) => `
    <div class="lp-row" style="animation-delay:${i*0.04}s">
      <span class="lp-num">${p.n}</span>
      <span class="lp-name">${p.name}</span>
      <span class="lp-pos">${p.pos}</span>
    </div>`).join('');
}

function openLineupModal() {
  document.getElementById('lineupModal')?.classList.add('open');
  document.body.classList.add('no-scroll');
}

function closeLineupModal() {
  document.getElementById('lineupModal')?.classList.remove('open');
  document.body.classList.remove('no-scroll');
}

function handleModalClick(e) {
  if (e.target.id === 'lineupModal') closeLineupModal();
}

/* ==================== NOTIFICATIONS ==================== */
function notify(type, title, body, sub) {
  const container = document.getElementById('notifContainer');
  if (!container) return;

  const n   = document.createElement('div');
  n.className = `notif notif--${type}`;
  n.innerHTML = `
    <div class="notif-head">
      <span class="notif-ico">${({goal:'⚽',yellow:'🟨',red:'🟥',sub:'🔄',foul:'👟',offside:'🚩',info:'ℹ️'}[type] || '▪')}</span>
      <span class="notif-type">${title}</span>
      <span class="notif-ts">${pad2(Math.floor(STATE.timer.secs/60))}'</span>
    </div>
    <div class="notif-body">${body}</div>
    ${sub ? `<div class="notif-sub">${sub}</div>` : ''}`;

  container.prepend(n);
  while (container.children.length > 4) container.lastChild?.remove();
  setTimeout(() => n.remove(), 4200);
}

function seedNotifications() {
  setTimeout(() => notify('info','🎙️ COMMENTARY','Match officials in position', STATE.venue), 2800);
  setTimeout(() => notify('info','📢 ANNOUNCEMENT','Welcome to the Brotherhood Stadium', ''), 8000);
}

/* ==================== SYNC ADMIN INPUTS ==================== */
function syncAdminInputs() {
  const inputs = {
    homeTeamI:    STATE.home.name,
    awayTeamI:    STATE.away.name,
    venueI:       STATE.venue,
    possSlider:   STATE.stats.possession,
    possVal:      STATE.stats.possession + '%',
    homeShotsI:   STATE.stats.homeShotsOn,
    awayShotsI:   STATE.stats.awayShotsOn,
    homeShotsOffI:STATE.stats.homeShotsOff,
    awayShotsOffI:STATE.stats.awayShotsOff,
    homeFoulsI:   STATE.stats.homeFouls,
    awayFoulsI:   STATE.stats.awayFouls,
    homeCornersI: STATE.stats.homeCorners,
    awayCornersI: STATE.stats.awayCorners,
    homePassI:    STATE.stats.homePassAcc,
    awayPassI:    STATE.stats.awayPassAcc
  };
  Object.entries(inputs).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'INPUT') el.value = val;
      else el.textContent = val;
    }
  });
}

/* ==================== LOCALSTORAGE ==================== */
function saveStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      home:   STATE.home,
      away:   STATE.away,
      timer:  { secs: STATE.timer.secs, running: false },
      status: STATE.status,
      events: STATE.events,
      stats:  STATE.stats,
      venue:  STATE.venue
    }));
  } catch (e) { /* silent */ }
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.home)   Object.assign(STATE.home, d.home);
    if (d.away)   Object.assign(STATE.away, d.away);
    if (d.timer)  STATE.timer.secs = d.timer.secs || 0;
    if (d.status) STATE.status     = d.status;
    if (d.events) STATE.events     = d.events;
    if (d.stats)  Object.assign(STATE.stats, d.stats);
    if (d.venue)  STATE.venue      = d.venue;
  } catch (e) { /* silent */ }
}

function startAutoSave() { setInterval(saveStorage, 8000); }

function resetAll() {
  if (!confirm('Reset all match data? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  STATE.home   = { name:'FC BROTHERS', score:0 };
  STATE.away   = { name:'RIVALS XI',   score:0 };
  clearInterval(STATE.timer._iv);
  STATE.timer  = { secs:0, running:false, _iv:null };
  STATE.status = 'PRE';
  STATE.events = [];
  STATE.stats  = { possession:50, homeShotsOn:0,awayShotsOn:0,homeShotsOff:0,awayShotsOff:0,homeFouls:0,awayFouls:0,homeCorners:0,awayCorners:0,homePassAcc:78,awayPassAcc:74 };
  STATE.venue  = 'Brotherhood Stadium';
  syncUI();
  syncAdminInputs();
  renderStats();
  renderEvents();
  renderCardCounts();
  renderLineups();
  notify('info','🔄 RESET','All match data cleared','');
}

/* ==================== KEYBOARD SHORTCUTS ==================== */
document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea')) return;
  if (e.key === ' ')           { e.preventDefault(); STATE.timer.running ? timerControl('pause') : timerControl('start'); }
  if (e.key === 'Escape')      { if (_adminOpen) toggleAdmin(); closeLineupModal(); }
  if (e.key.toLowerCase()==='a' && !_adminOpen) toggleAdmin();
});

 
