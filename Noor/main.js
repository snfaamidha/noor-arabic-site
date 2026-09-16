/* =========================================================
   Learn Arabic — main.js
   Shared logic for nav, letters, quiz, reading, lessons, games
   ========================================================= */

/* ---------- Mobile nav toggle ---------- */
/* ---------- Side dock: theme + language ---------- */
function initSideDock() {
  const dock = document.createElement('div');
  dock.id = 'sideDock';
  dock.innerHTML = `
    <button type="button" id="themeBtn" title="Toggle dark mode">🌙</button>
    <span class="dock-label">Theme</span>
    <button type="button" id="langBtn" title="Toggle language view">AR</button>
    <span class="dock-label">Lang</span>
  `;
  document.body.appendChild(dock);

  const themeBtn = document.getElementById('themeBtn');
  const savedTheme = localStorage.getItem('la-theme') || 'light';
  applyTheme(savedTheme);
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('la-theme', next);
  });
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
    themeBtn.classList.toggle('active', t === 'dark');
  }

  const langBtn = document.getElementById('langBtn');
  const savedLang = localStorage.getItem('la-lang') || 'both';
  applyLang(savedLang);
  langBtn.addEventListener('click', () => {
    const order = ['both', 'ar', 'en'];
    const current = localStorage.getItem('la-lang') || 'both';
    const next = order[(order.indexOf(current) + 1) % order.length];
    applyLang(next);
    localStorage.setItem('la-lang', next);
  });
  function applyLang(l) {
    document.body.classList.remove('hide-en', 'hide-ar');
    if (l === 'ar') { document.body.classList.add('hide-en'); langBtn.textContent = 'AR'; langBtn.classList.add('active'); }
    else if (l === 'en') { document.body.classList.add('hide-ar'); langBtn.textContent = 'EN'; langBtn.classList.add('active'); }
    else { langBtn.textContent = 'A/E'; langBtn.classList.remove('active'); }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  initSideDock();
  initChatBuddy();
  initProfileChip();
  initSignupForm();
  trackStreakAndExplorer();
  initProfilePage();
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // Mark active nav link
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === here) a.classList.add('active');
  });
});

/* ---------- Speech helper (browser speech synthesis, Arabic voice if available) ---------- */
function pickArabicVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const arVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
  if (!arVoices.length) return null;
  // Prefer well-known high-quality Standard Arabic (Fus'ha) voices by name first.
  const byName = arVoices.find(v => /google/i.test(v.name)) ||
                 arVoices.find(v => /(naayf|hoda|maged|tarik|laila)/i.test(v.name));
  if (byName) return byName;
  // Otherwise prefer explicit Saudi (ar-SA) tagging — the most common MSA-tagged locale.
  return (
    arVoices.find(v => v.lang.toLowerCase() === 'ar-sa') ||
    arVoices.find(v => v.lang.toLowerCase() === 'ar') ||
    arVoices[0]
  );
}

function speakArabic(text) {
  if (!('speechSynthesis' in window)) {
    alert('Audio pronunciation is not supported in this browser.');
    return;
  }

  let spoken = false;
  function doSpeak() {
    if (spoken) return;
    spoken = true;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.78;
    utter.pitch = 1;
    const voice = pickArabicVoice();
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      // No Arabic voice installed on this device — still attempt to speak
      // with the browser's default voice rather than staying silent.
      utter.lang = 'ar-SA';
    }
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  if (speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    // Voice list often loads asynchronously on first use. Wait for it, but
    // also fall back on a short timer in case the event never fires.
    speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    setTimeout(doSpeak, 300);
  }
}

/* ---------- Arabic letters data ---------- */
const ARABIC_LETTERS = [
  { ar:'ا', name_ar:'أَلِف', name_en:'Alif', sound:'a long "aa" as in "father"', word_ar:'أَسَد', word_en:'lion', pos:{initial:'ا', medial:'ـا', final:'ـا'} },
  { ar:'ب', name_ar:'باء', name_en:'Baa', sound:'like "b" in "book"', word_ar:'بَيْت', word_en:'house', pos:{initial:'بـ', medial:'ـبـ', final:'ـب'} },
  { ar:'ت', name_ar:'تاء', name_en:'Taa', sound:'like "t" in "table"', word_ar:'تُفَّاح', word_en:'apple', pos:{initial:'تـ', medial:'ـتـ', final:'ـت'} },
  { ar:'ث', name_ar:'ثاء', name_en:'Thaa', sound:'like "th" in "think"', word_ar:'ثَعْلَب', word_en:'fox', pos:{initial:'ثـ', medial:'ـثـ', final:'ـث'} },
  { ar:'ج', name_ar:'جيم', name_en:'Jeem', sound:'like "j" in "jam"', word_ar:'جَمَل', word_en:'camel', pos:{initial:'جـ', medial:'ـجـ', final:'ـج'} },
  { ar:'ح', name_ar:'حاء', name_en:'Haa', sound:'a breathy "h" from the throat', word_ar:'حِصَان', word_en:'horse', pos:{initial:'حـ', medial:'ـحـ', final:'ـح'} },
  { ar:'خ', name_ar:'خاء', name_en:'Khaa', sound:'like "ch" in Scottish "loch"', word_ar:'خُبْز', word_en:'bread', pos:{initial:'خـ', medial:'ـخـ', final:'ـخ'} },
  { ar:'د', name_ar:'دال', name_en:'Daal', sound:'like "d" in "door"', word_ar:'دُبّ', word_en:'bear', pos:{initial:'د', medial:'ـد', final:'ـد'} },
  { ar:'ذ', name_ar:'ذال', name_en:'Dhaal', sound:'like "th" in "this"', word_ar:'ذِئْب', word_en:'wolf', pos:{initial:'ذ', medial:'ـذ', final:'ـذ'} },
  { ar:'ر', name_ar:'راء', name_en:'Raa', sound:'a rolled "r"', word_ar:'رَجُل', word_en:'man', pos:{initial:'ر', medial:'ـر', final:'ـر'} },
  { ar:'ز', name_ar:'زاي', name_en:'Zay', sound:'like "z" in "zoo"', word_ar:'زَهْرَة', word_en:'flower', pos:{initial:'ز', medial:'ـز', final:'ـز'} },
  { ar:'س', name_ar:'سين', name_en:'Seen', sound:'like "s" in "sun"', word_ar:'سَمَك', word_en:'fish', pos:{initial:'سـ', medial:'ـسـ', final:'ـس'} },
  { ar:'ش', name_ar:'شين', name_en:'Sheen', sound:'like "sh" in "ship"', word_ar:'شَمْس', word_en:'sun', pos:{initial:'شـ', medial:'ـشـ', final:'ـش'} },
  { ar:'ص', name_ar:'صاد', name_en:'Saad', sound:'a heavy, emphatic "s"', word_ar:'صَقْر', word_en:'falcon', pos:{initial:'صـ', medial:'ـصـ', final:'ـص'} },
  { ar:'ض', name_ar:'ضاد', name_en:'Daad', sound:'a heavy, emphatic "d"', word_ar:'ضَوْء', word_en:'light', pos:{initial:'ضـ', medial:'ـضـ', final:'ـض'} },
  { ar:'ط', name_ar:'طاء', name_en:'Taa (heavy)', sound:'a heavy, emphatic "t"', word_ar:'طَائِر', word_en:'bird', pos:{initial:'طـ', medial:'ـطـ', final:'ـط'} },
  { ar:'ظ', name_ar:'ظاء', name_en:'Zhaa', sound:'a heavy, emphatic "th"', word_ar:'ظَبْي', word_en:'gazelle', pos:{initial:'ظـ', medial:'ـظـ', final:'ـظ'} },
  { ar:'ع', name_ar:'عين', name_en:'Ayn', sound:'a deep throat sound, no English equivalent', word_ar:'عَيْن', word_en:'eye', pos:{initial:'عـ', medial:'ـعـ', final:'ـع'} },
  { ar:'غ', name_ar:'غين', name_en:'Ghayn', sound:'like French "r" (gargled)', word_ar:'غَيْمَة', word_en:'cloud', pos:{initial:'غـ', medial:'ـغـ', final:'ـغ'} },
  { ar:'ف', name_ar:'فاء', name_en:'Faa', sound:'like "f" in "food"', word_ar:'فِيل', word_en:'elephant', pos:{initial:'فـ', medial:'ـفـ', final:'ـف'} },
  { ar:'ق', name_ar:'قاف', name_en:'Qaaf', sound:'a deep "k" from the back of the throat', word_ar:'قَمَر', word_en:'moon', pos:{initial:'قـ', medial:'ـقـ', final:'ـق'} },
  { ar:'ك', name_ar:'كاف', name_en:'Kaaf', sound:'like "k" in "kite"', word_ar:'كِتَاب', word_en:'book', pos:{initial:'كـ', medial:'ـكـ', final:'ـك'} },
  { ar:'ل', name_ar:'لام', name_en:'Laam', sound:'like "l" in "lamp"', word_ar:'لَيْمُون', word_en:'lemon', pos:{initial:'لـ', medial:'ـلـ', final:'ـل'} },
  { ar:'م', name_ar:'ميم', name_en:'Meem', sound:'like "m" in "moon"', word_ar:'مَاء', word_en:'water', pos:{initial:'مـ', medial:'ـمـ', final:'ـم'} },
  { ar:'ن', name_ar:'نون', name_en:'Noon', sound:'like "n" in "nose"', word_ar:'نَجْمَة', word_en:'star', pos:{initial:'نـ', medial:'ـنـ', final:'ـن'} },
  { ar:'ه', name_ar:'هاء', name_en:'Haa (soft)', sound:'like "h" in "house"', word_ar:'هِلَال', word_en:'crescent moon', pos:{initial:'هـ', medial:'ـهـ', final:'ـه'} },
  { ar:'و', name_ar:'واو', name_en:'Waaw', sound:'like "w" in "water", or long "oo"', word_ar:'وَرْدَة', word_en:'rose', pos:{initial:'و', medial:'ـو', final:'ـو'} },
  { ar:'ي', name_ar:'ياء', name_en:'Yaa', sound:'like "y" in "yes", or long "ee"', word_ar:'يَد', word_en:'hand', pos:{initial:'يـ', medial:'ـيـ', final:'ـي'} }
];

/* ---------- Badges & achievements ---------- */
const BADGE_CATALOG = {
  first_quiz:    { icon: '🏅', title: 'First Quiz',     desc: 'Complete your first quiz.' },
  perfect_quiz:  { icon: '🌟', title: 'Perfect Score',  desc: 'Get every question right on a quiz.' },
  tracing_star:  { icon: '✍️', title: 'Tracing Star',   desc: 'Score 80%+ tracing a letter or word.' },
  clear_speaker: { icon: '🗣️', title: 'Clear Speaker',  desc: 'Score 85%+ on pronunciation practice.' },
  homework_hero: { icon: '📅', title: 'Homework Hero',  desc: 'Complete a weekly assignment.' },
  game_champion: { icon: '🎮', title: 'Game Champion',  desc: 'Finish a full round of any game.' },
  streak_3:      { icon: '🔥', title: '3-Day Streak',   desc: 'Visit the site on 3 different days.' },
  explorer:      { icon: '🧭', title: 'Explorer',       desc: 'Visit 5 different sections of the site.' }
};

function getBadges() {
  try { return JSON.parse(localStorage.getItem('la-badges') || '[]'); } catch (e) { return []; }
}
function hasBadge(id) { return getBadges().includes(id); }

function showBadgeToast(id) {
  const info = BADGE_CATALOG[id];
  if (!info) return;
  const toast = document.createElement('div');
  toast.className = 'badge-toast';
  toast.innerHTML = `
    <span class="badge-toast-icon">${info.icon}</span>
    <div><strong class="en">Badge Earned!</strong><p class="en">${info.title}</p></div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

function awardBadge(id) {
  if (hasBadge(id)) return;
  const badges = getBadges();
  badges.push(id);
  try { localStorage.setItem('la-badges', JSON.stringify(badges)); } catch (e) { /* ignore */ }
  showBadgeToast(id);
}

function trackStreakAndExplorer() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    let days = JSON.parse(localStorage.getItem('la-visit-days') || '[]');
    if (!days.includes(today)) { days.push(today); localStorage.setItem('la-visit-days', JSON.stringify(days)); }
    if (days.length >= 3) awardBadge('streak_3');
  } catch (e) { /* ignore */ }
  try {
    const page = location.pathname.split('/').pop() || 'index.html';
    let pages = JSON.parse(localStorage.getItem('la-visited-pages') || '[]');
    if (!pages.includes(page)) { pages.push(page); localStorage.setItem('la-visited-pages', JSON.stringify(pages)); }
    if (pages.length >= 5) awardBadge('explorer');
  } catch (e) { /* ignore */ }
}

/* ---------- Profile: chip + signup form ---------- */
function getProfile() {
  try {
    const raw = localStorage.getItem('la-profile');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function initProfileChip() {
  const chip = document.getElementById('profileChip');
  if (!chip) return;
  const profile = getProfile();
  if (!profile) return;
  const initial = (profile.name || '?').trim().charAt(0).toUpperCase();
  chip.innerHTML = `
    <a href="profile.html" class="chip-link"><span class="avatar">${initial}</span><span>${profile.name}</span></a>
    <button type="button" class="signout-btn en">Sign out</button>
  `;
  chip.querySelector('.signout-btn').addEventListener('click', () => {
    localStorage.removeItem('la-profile');
    window.location.href = 'signup.html';
  });
}

function initSignupForm() {
  const studentForm = document.getElementById('signupFormStudent');
  if (!studentForm) return;

  // If already signed up, skip straight to the site.
  if (getProfile()) {
    window.location.replace('index.html');
    return;
  }

  studentForm.addEventListener('submit', e => {
    e.preventDefault();
    const errorEl = document.getElementById('suError');
    const name = document.getElementById('suName').value.trim();
    const grade = document.getElementById('suGrade').value;
    const email = document.getElementById('suEmail').value.trim();
    if (!name) { errorEl.textContent = 'Please enter your name.'; return; }
    if (!grade) { errorEl.textContent = 'Please select your grade.'; return; }
    try { localStorage.setItem('la-profile', JSON.stringify({ name, grade, email, ts: Date.now() })); } catch (e) { /* ignore */ }
    window.location.href = 'index.html';
  });
}

function initProfilePage() {
  const summary = document.getElementById('profileSummary');
  const grid = document.getElementById('badgeGrid');
  if (!summary && !grid) return;

  const profile = getProfile();
  if (!profile) return;

  const badges = getBadges();
  let days = [];
  let pages = [];
  try { days = JSON.parse(localStorage.getItem('la-visit-days') || '[]'); } catch (e) { /* ignore */ }
  try { pages = JSON.parse(localStorage.getItem('la-visited-pages') || '[]'); } catch (e) { /* ignore */ }

  if (summary) {
    const initial = (profile.name || '?').trim().charAt(0).toUpperCase();
    summary.innerHTML = `
      <span class="big-avatar">${initial}</span>
      <div>
        <h2 class="en">${profile.name}</h2>
        <p class="en" style="margin:0;">Grade ${profile.grade || '—'}</p>
      </div>
      <div class="profile-stats">
        <div class="profile-stat"><span class="num">${days.length}</span><span class="label en">Days Visited</span></div>
        <div class="profile-stat"><span class="num">${badges.length}</span><span class="label en">Badges Earned</span></div>
        <div class="profile-stat"><span class="num">${pages.length}</span><span class="label en">Sections Explored</span></div>
      </div>
    `;
  }

  if (grid) {
    grid.innerHTML = '';
    Object.keys(BADGE_CATALOG).forEach(id => {
      const info = BADGE_CATALOG[id];
      const earned = badges.includes(id);
      const card = document.createElement('div');
      card.className = `badge-card${earned ? ' earned' : ''}`;
      card.innerHTML = `
        <span class="icon">${earned ? info.icon : '🔒'}</span>
        <h4 class="en">${info.title}</h4>
        <p class="en">${info.desc}</p>
      `;
      grid.appendChild(card);
    });
  }

  const resetBtn = document.getElementById('resetProfileBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('This will clear your badges, streak, and profile on this device. Continue?')) return;
      ['la-profile', 'la-badges', 'la-visit-days', 'la-visited-pages'].forEach(k => localStorage.removeItem(k));
      window.location.href = 'signup.html';
    });
  }
}

/* ---------- Practice: pronunciation scoring ---------- */
const PRACTICE_WORDS = [
  { ar: 'بَيْت', en: 'house', sentence_ar: 'هَذَا بَيْتِي.', sentence_en: 'This is my house.', grammar: 'هَذَا ("this") + noun forms a simple nominal sentence — no verb "to be" is needed in the present tense.' },
  { ar: 'كِتَاب', en: 'book', sentence_ar: 'الكِتَابُ عَلَى الطَّاوِلَةِ.', sentence_en: 'The book is on the table.', grammar: 'الـ ("al-") makes الكِتَاب definite ("the book"); عَلَى ("on") is a preposition placed before the location.' },
  { ar: 'قَلَم', en: 'pen', sentence_ar: 'أَكْتُبُ بِالقَلَمِ.', sentence_en: 'I write with the pen.', grammar: 'بِ ("bi-") attached to the front of a noun means "with/by" — a very common one-letter preposition.' },
  { ar: 'شَمْس', en: 'sun', sentence_ar: 'الشَّمْسُ كَبِيرَةٌ.', sentence_en: 'The sun is big.', grammar: 'كَبِيرَةٌ ends in ة to agree with الشَّمْس, which is a feminine noun.' },
  { ar: 'قَمَر', en: 'moon', sentence_ar: 'القَمَرُ جَمِيلٌ فِي اللَّيْلِ.', sentence_en: 'The moon is beautiful at night.', grammar: 'جَمِيلٌ has no ة ending because القَمَر is masculine — adjectives must match the noun\'s gender.' },
  { ar: 'مَاء', en: 'water', sentence_ar: 'أَشْرَبُ المَاءَ.', sentence_en: 'I drink the water.', grammar: 'أَشْرَبُ is the "I" form of the present-tense verb شَرِبَ ("to drink") — notice the أ prefix for "I".' },
  { ar: 'مَدْرَسَة', en: 'school', sentence_ar: 'أَذْهَبُ إِلَى المَدْرَسَةِ.', sentence_en: 'I go to school.', grammar: 'إِلَى ("to/towards") is a preposition placed right before the destination.' },
  { ar: 'طَالِب', en: 'student', sentence_ar: 'أَنَا طَالِبٌ فِي المَدْرَسَةِ.', sentence_en: 'I am a student at school.', grammar: 'A nominal sentence: أَنَا ("I") + طَالِبٌ ("student") — no verb "to be" needed here either.' },
  { ar: 'جَمِيل', en: 'beautiful', sentence_ar: 'الحَدِيقَةُ جَمِيلَةٌ.', sentence_en: 'The garden is beautiful.', grammar: 'جَمِيلَةٌ takes the ة ending to agree with الحَدِيقَة, a feminine noun.' },
  { ar: 'أَسَد', en: 'lion', sentence_ar: 'الأَسَدُ مَلِكُ الغَابَةِ.', sentence_en: 'The lion is the king of the forest.', grammar: 'مَلِكُ الغَابَةِ is an iḍāfa (possession) construction: "king (of) the-forest" — no separate word for "of".' },
  { ar: 'جَمَل', en: 'camel', sentence_ar: 'الجَمَلُ يَعِيشُ فِي الصَّحْرَاءِ.', sentence_en: 'The camel lives in the desert.', grammar: 'يَعِيشُ is the "he/it" form of the present-tense verb عَاشَ ("to live") — notice the يـ prefix.' },
  { ar: 'مَرْحَبًا', en: 'hello', sentence_ar: 'مَرْحَبًا، كَيْفَ حَالُكَ؟', sentence_en: 'Hello, how are you?', grammar: 'كَيْفَ ("how") + حَالُكَ ("your state") is the standard way to ask "how are you?" in Arabic.' }
];

function normalizeAr(s) {
  return s
    .replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED\u0670\u0640]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0600-\u06FF]/g, '')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function scorePronunciation(target, heard) {
  const t = normalizeAr(target);
  const h = normalizeAr(heard);
  if (!h) return 0;
  const dist = levenshtein(t, h);
  const maxLen = Math.max(t.length, h.length, 1);
  return Math.max(0, Math.round((1 - dist / maxLen) * 100));
}

function scoreFeedback(score) {
  if (score >= 85) return { label: 'Excellent! 🎉', color: 'var(--green)', tips: ['Your pronunciation is very close to native. Try a harder word next!'] };
  if (score >= 60) return { label: 'Good — keep practicing', color: 'var(--gold)', tips: [
    'Listen to the word again and repeat it slowly, syllable by syllable.',
    'Pay attention to any emphatic letters (ص، ض، ط، ظ, ق) — they need extra force from the back of the throat.'
  ] };
  return { label: 'Needs more practice', color: 'var(--red)', tips: [
    'Hit "🔊 Hear it" and repeat right after, matching the rhythm as closely as you can.',
    'Break the word into smaller sounds and say each one before joining them together.',
    'Make sure you are speaking clearly and close to the microphone.'
  ] };
}

function initPracticePage() {
  const list = document.getElementById('practiceList');
  if (!list) return;

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supportNote = document.getElementById('practiceSupportNote');
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const isSecure = window.isSecureContext;

  if (!SpeechRec || !hasGetUserMedia) {
    if (supportNote) supportNote.innerHTML = "⚠️ Your browser doesn't support speech recognition. Please try the latest Chrome or Edge on desktop or Android.";
  } else if (!isSecure) {
    if (supportNote) supportNote.innerHTML = "⚠️ Microphone access needs a secure connection. If you're opening this file directly (file://), pronunciation recording won't work — host the site (e.g. GitHub Pages, Netlify) or run it through <code>localhost</code> to enable it. Everything else on the site still works fine.";
  } else {
    if (supportNote) supportNote.style.display = 'none';
  }

  PRACTICE_WORDS.forEach((w, i) => {
    const card = document.createElement('div');
    card.className = 'practice-card';
    card.innerHTML = `
      <div class="pw-arabic">${w.ar}</div>
      <div class="pw-english en">${w.en}</div>
      <div class="pw-actions">
        <button type="button" class="sound-btn hear-btn">🔊 Hear it</button>
        ${SpeechRec && hasGetUserMedia && isSecure ? '<button type="button" class="record-btn">🎤 Record</button>' : ''}
      </div>
      <button type="button" class="sentence-toggle en">📖 See it in a sentence</button>
      <div class="pw-sentence-box">
        <p class="ar" style="font-size:1.15rem; margin-bottom:4px;">${w.sentence_ar}</p>
        <p class="en pw-sentence-en">${w.sentence_en}</p>
        <p class="en pw-grammar-note"><strong>Grammar:</strong> ${w.grammar}</p>
        <button type="button" class="sound-btn hear-sentence-btn en" style="margin-top:8px;">🔊 Hear sentence</button>
      </div>
      <div class="pw-result"></div>
    `;
    list.appendChild(card);

    card.querySelector('.hear-btn').addEventListener('click', () => speakArabic(w.ar));

    const sentenceToggle = card.querySelector('.sentence-toggle');
    const sentenceBox = card.querySelector('.pw-sentence-box');
    sentenceToggle.addEventListener('click', () => {
      const open = sentenceBox.classList.toggle('show');
      sentenceToggle.textContent = open ? '📖 Hide sentence' : '📖 See it in a sentence';
    });
    card.querySelector('.hear-sentence-btn').addEventListener('click', () => speakArabic(w.sentence_ar));

    const recordBtn = card.querySelector('.record-btn');
    if (!recordBtn) return;

    recordBtn.addEventListener('click', () => {
      const recognition = new SpeechRec();
      recognition.lang = 'ar-SA';
      recognition.maxAlternatives = 1;

      recordBtn.classList.add('listening');
      recordBtn.textContent = '⏺ Listening...';

      recognition.onresult = (event) => {
        const heard = event.results[0][0].transcript;
        const score = scorePronunciation(w.ar, heard);
        const fb = scoreFeedback(score);
        const resultEl = card.querySelector('.pw-result');
        resultEl.innerHTML = `
          <p class="pw-heard en">You said: <span class="ar">${heard}</span></p>
          <div class="pw-score-row">
            <div class="pw-score-bar"><div class="pw-score-fill" style="width:${score}%; background:${fb.color};"></div></div>
            <span class="pw-score-num">${score}%</span>
          </div>
          <p style="font-weight:700; margin:0 0 6px; color:${fb.color};" class="en">${fb.label}</p>
          <ul class="pw-tips en">${fb.tips.map(t => `<li>${t}</li>`).join('')}</ul>
        `;
        if (score >= 85) awardBadge('clear_speaker');
      };
      recognition.onerror = (event) => {
        const resultEl = card.querySelector('.pw-result');
        let msg = 'Something went wrong. Please try again.';
        if (event.error === 'not-allowed' || event.error === 'permission-denied') msg = 'Microphone access was blocked. Please allow microphone permission and try again.';
        else if (event.error === 'no-speech') msg = "I didn't hear anything — try again a little closer to the mic.";
        else if (event.error === 'network') msg = 'A network connection is needed for speech recognition.';
        resultEl.innerHTML = `<p class="en" style="color:var(--red-deep);">${msg}</p>`;
      };
      recognition.onend = () => {
        recordBtn.classList.remove('listening');
        recordBtn.textContent = '🎤 Record';
      };

      try {
        recognition.start();
      } catch (e) {
        recordBtn.classList.remove('listening');
        recordBtn.textContent = '🎤 Record';
      }
    });
  });
}

/* ---------- Tracing practice (canvas drawing + pixel-overlap scoring) ---------- */
function traceFeedback(score) {
  if (score >= 80) return { label: 'Great tracing! 🎉', color: 'var(--green)', tips: ['Your strokes closely match the letter shape. Try a trickier letter next!'] };
  if (score >= 50) return { label: 'Good try — keep practicing', color: 'var(--gold)', tips: [
    'Try to cover the whole shape of the letter, not just part of it.',
    'Slow down and follow the curve of the guide as closely as you can.'
  ] };
  return { label: 'Keep practicing', color: 'var(--red)', tips: [
    'Trace directly over the gold guide letter, start to finish.',
    'Use your finger or mouse like a pen — smaller, careful strokes work best.'
  ] };
}

function initTracingPractice() {
  const guideCanvas = document.getElementById('traceGuideCanvas');
  const drawCanvas = document.getElementById('traceDrawCanvas');
  if (!guideCanvas || !drawCanvas) return;

  const W = guideCanvas.width, H = guideCanvas.height;
  const gctx = guideCanvas.getContext('2d');
  const dctx = drawCanvas.getContext('2d');
  const picker = document.getElementById('tracePicker');
  const resultEl = document.getElementById('traceResult');
  const meaningEl = document.getElementById('traceMeaning');
  const modeBtns = document.querySelectorAll('.trace-mode-tab');

  const LETTER_SET = ARABIC_LETTERS.map(l => ({ text: l.ar, meaning: null, sub: l.name_en }));
  const WORD_SET = PRACTICE_WORDS.map(w => ({ text: w.ar, meaning: w.en, sub: null }));

  let mode = 'letters';
  let currentSet = LETTER_SET;
  let currentIndex = 0;
  let coreGuideMask, toleranceMask;
  let drawing = false, lastX = 0, lastY = 0;

  function buildPicker() {
    picker.innerHTML = '';
    currentSet.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = item.text;
      if (mode === 'words') btn.style.fontSize = '.85rem';
      btn.addEventListener('click', () => selectItem(i));
      picker.appendChild(btn);
    });
  }

  function selectItem(i) {
    currentIndex = i;
    [...picker.children].forEach((b, idx) => b.classList.toggle('active', idx === i));
    drawGuide();
    clearDrawing();
    updateMeaning();
  }

  function updateMeaning() {
    if (!meaningEl) return;
    const item = currentSet[currentIndex];
    if (item.meaning) {
      meaningEl.innerHTML = `<span class="en">Meaning:</span> <strong class="en">${item.meaning}</strong>`;
      meaningEl.style.display = 'block';
    } else if (item.sub) {
      meaningEl.innerHTML = `<span class="en">Letter name:</span> <strong class="en">${item.sub}</strong>`;
      meaningEl.style.display = 'block';
    } else {
      meaningEl.style.display = 'none';
    }
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      currentSet = mode === 'words' ? WORD_SET : LETTER_SET;
      modeBtns.forEach(b => b.classList.toggle('active', b === btn));
      buildPicker();
      selectItem(0);
    });
  });

  function drawGuide() {
    const text = currentSet[currentIndex].text;
    const fontSize = mode === 'words' ? Math.max(70, Math.min(130, Math.floor(820 / text.length))) : 210;
    const font = `${fontSize}px "Noto Sans Arabic", sans-serif`;

    gctx.clearRect(0, 0, W, H);
    gctx.save();
    gctx.font = font;
    gctx.textAlign = 'center';
    gctx.textBaseline = 'middle';
    gctx.fillStyle = 'rgba(201,162,39,0.45)';
    gctx.fillText(text, W / 2, H / 2 + 8);
    gctx.restore();

    const img = gctx.getImageData(0, 0, W, H).data;
    coreGuideMask = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) coreGuideMask[p] = img[p * 4 + 3] > 40 ? 1 : 0;

    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    const tctx = tmp.getContext('2d');
    tctx.filter = 'blur(9px)';
    tctx.font = font;
    tctx.textAlign = 'center';
    tctx.textBaseline = 'middle';
    tctx.fillStyle = 'black';
    tctx.fillText(text, W / 2, H / 2 + 8);
    const img2 = tctx.getImageData(0, 0, W, H).data;
    toleranceMask = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) toleranceMask[p] = img2[p * 4 + 3] > 8 ? 1 : 0;
  }

  function clearDrawing() {
    dctx.clearRect(0, 0, W, H);
    resultEl.innerHTML = '';
  }

  function getPos(e) {
    const rect = drawCanvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
  }

  drawCanvas.addEventListener('pointerdown', e => {
    drawing = true;
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
    drawCanvas.setPointerCapture(e.pointerId);
    dctx.fillStyle = '#CE1126';
    dctx.beginPath();
    dctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    dctx.fill();
  });
  drawCanvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    const p = getPos(e);
    dctx.strokeStyle = '#CE1126';
    dctx.lineWidth = 10;
    dctx.lineCap = 'round';
    dctx.lineJoin = 'round';
    dctx.beginPath();
    dctx.moveTo(lastX, lastY);
    dctx.lineTo(p.x, p.y);
    dctx.stroke();
    lastX = p.x; lastY = p.y;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(evt => {
    drawCanvas.addEventListener(evt, () => { drawing = false; });
  });

  document.getElementById('traceClearBtn').addEventListener('click', clearDrawing);
  document.getElementById('traceCheckBtn').addEventListener('click', () => {
    const img = dctx.getImageData(0, 0, W, H).data;
    let userCount = 0, coreCount = 0, coverageHit = 0, precisionHit = 0;
    for (let p = 0; p < W * H; p++) {
      const userOn = img[p * 4 + 3] > 40;
      if (userOn) userCount++;
      if (coreGuideMask[p]) coreCount++;
      if (userOn && coreGuideMask[p]) coverageHit++;
      if (userOn && toleranceMask[p]) precisionHit++;
    }
    if (userCount === 0) {
      resultEl.innerHTML = '<p class="en" style="color:var(--red-deep); margin:0;">Try tracing first!</p>';
      return;
    }
    const coverage = coreCount ? coverageHit / coreCount : 0;
    const precision = userCount ? precisionHit / userCount : 0;
    const score = Math.max(0, Math.min(100, Math.round((coverage * 0.6 + precision * 0.4) * 100)));
    const fb = traceFeedback(score);
    resultEl.innerHTML = `
      <div class="pw-score-row">
        <div class="pw-score-bar"><div class="pw-score-fill" style="width:${score}%; background:${fb.color};"></div></div>
        <span class="pw-score-num">${score}%</span>
      </div>
      <p style="font-weight:700; margin:0 0 6px; color:${fb.color};" class="en">${fb.label}</p>
      <ul class="pw-tips en" style="text-align:start;">${fb.tips.map(t => `<li>${t}</li>`).join('')}</ul>
    `;
    if (score >= 80) awardBadge('tracing_star');
  });

  buildPicker();
  selectItem(0);
}

/* ---------- Weekly sentence assignment ---------- */
const WEEKLY_ASSIGNMENTS = [
  { title: 'Introduce Yourself', instructions: 'Write a sentence in Arabic introducing your name.', prompt: 'My name is ... (اسْمِي ...)', model: 'اسْمِي سَارَة.' },
  { title: 'Describe Your House', instructions: 'Write one sentence in Arabic describing your house.', prompt: 'My house is ... (بَيْتِي ...)', model: 'بَيْتِي كَبِيرٌ وَجَمِيلٌ.' },
  { title: 'Talk About School', instructions: 'Write a sentence saying what you study at school.', prompt: 'I study ... (أَدْرُسُ ...)', model: 'أَدْرُسُ اللُّغَةَ العَرَبِيَّةَ.' },
  { title: 'Your Family', instructions: 'Write a sentence naming one family member.', prompt: 'My father / mother is ... (أَبِي / أُمِّي ...)', model: 'أُمِّي مُعَلِّمَةٌ.' },
  { title: 'Daily Routine', instructions: 'Write a sentence about something you do every day, using a present-tense verb.', prompt: 'Every day I ... (كُلَّ يَوْمٍ ...)', model: 'كُلَّ يَوْمٍ أَذْهَبُ إِلَى المَدْرَسَةِ.' },
  { title: 'Likes and Dislikes', instructions: 'Write a sentence about something you love, using أُحِبُّ.', prompt: 'I love ... (أُحِبُّ ...)', model: 'أُحِبُّ القِرَاءَةَ وَالكِتَابَةَ.' },
  { title: 'The Weather', instructions: 'Write a short sentence describing the sun or moon.', prompt: 'The sun / moon is ... (الشَّمْسُ / القَمَرُ ...)', model: 'القَمَرُ جَمِيلٌ فِي اللَّيْلِ.' },
  { title: 'Past Tense Practice', instructions: 'Write a sentence about something you did yesterday, using a past-tense verb.', prompt: 'Yesterday I ... (أَمْسِ ...)', model: 'أَمْسِ ذَهَبْتُ إِلَى المَدْرَسَةِ.' },
  { title: 'Possession (Iḍāfa)', instructions: 'Write a short possessive phrase using the iḍāfa construction (noun + noun, no "the" on the first).', prompt: "The student's book (كِتَابُ ...)", model: 'كِتَابُ الطَّالِبِ عَلَى الطَّاوِلَةِ.' },
  { title: 'National Pride', instructions: 'Write a sentence about UAE National Day or your own country.', prompt: 'On National Day, we ... (فِي اليَوْمِ الوَطَنِيِّ ...)', model: 'فِي اليَوْمِ الوَطَنِيِّ نَرْتَدِي الزِّيَّ التَّقْلِيدِيَّ.' }
];

function getWeekNumber() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d - start) / 86400000);
  return Math.floor(dayOfYear / 7) + 1;
}

function initWeeklyAssignment() {
  const titleEl = document.getElementById('assignTitle');
  if (!titleEl) return;

  const week = getWeekNumber();
  const assignment = WEEKLY_ASSIGNMENTS[(week - 1) % WEEKLY_ASSIGNMENTS.length];

  document.getElementById('assignWeekLabel').textContent = `Week ${week} Assignment`;
  titleEl.textContent = assignment.title;
  document.getElementById('assignInstructions').textContent = assignment.instructions;
  document.getElementById('assignPrompt').textContent = assignment.prompt;

  const statusKey = `la-assignment-status-${week}`;
  const answerKey = `la-assignment-answer-${week}`;
  const statusEl = document.getElementById('assignStatus');
  const textarea = document.getElementById('assignAnswer');

  function refreshStatus() {
    let done = false;
    try { done = localStorage.getItem(statusKey) === '1'; } catch (e) { /* ignore */ }
    statusEl.textContent = done ? '✅ Completed' : 'Not completed yet';
    statusEl.classList.toggle('done', done);
  }
  refreshStatus();

  try {
    const saved = localStorage.getItem(answerKey);
    if (saved) textarea.value = saved;
  } catch (e) { /* ignore */ }

  textarea.addEventListener('input', () => {
    try { localStorage.setItem(answerKey, textarea.value); } catch (e) { /* ignore */ }
  });

  document.getElementById('assignRevealBtn').addEventListener('click', () => {
    const modelEl = document.getElementById('assignModelAnswer');
    modelEl.innerHTML = `<strong class="en">Model Answer:</strong><p class="ar" style="margin:6px 0 0; font-size:1.15rem;">${assignment.model}</p>`;
    modelEl.classList.add('show');
  });

  document.getElementById('assignCompleteBtn').addEventListener('click', () => {
    try { localStorage.setItem(statusKey, '1'); } catch (e) { /* ignore */ }
    refreshStatus();
    awardBadge('homework_hero');
  });
}

/* ---------- Chat Buddy (offline, keyword-matching) ---------- */
const MATCH_PAIRS = [
  { ar:'بَيْت', en:'House' },
  { ar:'شَمْس', en:'Sun' },
  { ar:'قَمَر', en:'Moon' },
  { ar:'مَاء', en:'Water' },
  { ar:'كِتَاب', en:'Book' }
];

const CB_VOCAB = [
  ...ARABIC_LETTERS.map(l => ({ en: l.word_en.toLowerCase(), ar: l.word_ar })),
  ...PRACTICE_WORDS.map(w => ({ en: w.en.toLowerCase(), ar: w.ar })),
  ...MATCH_PAIRS.map(w => ({ en: w.en.toLowerCase(), ar: w.ar })),
  { en: 'moon', ar: 'قَمَر' }, { en: 'sun', ar: 'شَمْس' }, { en: 'water', ar: 'مَاء' },
  { en: 'book', ar: 'كِتَاب' }, { en: 'house', ar: 'بَيْت' }, { en: 'pen', ar: 'قَلَم' },
  { en: 'father', ar: 'أَب' }, { en: 'mother', ar: 'أُم' }, { en: 'teacher', ar: 'مُعَلِّم' },
  { en: 'hello', ar: 'مَرْحَبًا' }, { en: 'thank you', ar: 'شُكْرًا' }, { en: 'yes', ar: 'نَعَم' },
  { en: 'no', ar: 'لَا' }, { en: 'school', ar: 'مَدْرَسَة' }, { en: 'student', ar: 'طَالِب' },
  { en: 'i', ar: 'أَنَا' }, { en: 'you', ar: 'أَنْتَ / أَنْتِ' }, { en: 'he', ar: 'هُوَ' },
  { en: 'she', ar: 'هِيَ' }, { en: 'we', ar: 'نَحْنُ' }, { en: 'they', ar: 'هُمْ' },
  { en: 'friend', ar: 'صَدِيق' }, { en: 'family', ar: 'عَائِلَة' }, { en: 'brother', ar: 'أَخ' },
  { en: 'sister', ar: 'أُخْت' }, { en: 'name', ar: 'اِسْم' }, { en: 'day', ar: 'يَوْم' },
  { en: 'night', ar: 'لَيْل' }, { en: 'today', ar: 'اليَوْم' }, { en: 'tomorrow', ar: 'غَدًا' },
  { en: 'good', ar: 'جَيِّد' }, { en: 'bad', ar: 'سَيِّئ' }, { en: 'new', ar: 'جَدِيد' },
  { en: 'old', ar: 'قَدِيم' }, { en: 'fast', ar: 'سَرِيع' }, { en: 'slow', ar: 'بَطِيء' },
  { en: 'red', ar: 'أَحْمَر' }, { en: 'green', ar: 'أَخْضَر' }, { en: 'black', ar: 'أَسْوَد' },
  { en: 'white', ar: 'أَبْيَض' }, { en: 'blue', ar: 'أَزْرَق' }, { en: 'yellow', ar: 'أَصْفَر' },
  { en: 'one', ar: 'وَاحِد' }, { en: 'two', ar: 'اِثْنَان' }, { en: 'three', ar: 'ثَلَاثَة' },
  { en: 'four', ar: 'أَرْبَعَة' }, { en: 'five', ar: 'خَمْسَة' }, { en: 'six', ar: 'سِتَّة' },
  { en: 'seven', ar: 'سَبْعَة' }, { en: 'eight', ar: 'ثَمَانِيَة' }, { en: 'nine', ar: 'تِسْعَة' },
  { en: 'ten', ar: 'عَشَرَة' }, { en: 'eat', ar: 'يَأْكُلُ' }, { en: 'drink', ar: 'يَشْرَبُ' },
  { en: 'go', ar: 'يَذْهَبُ' }, { en: 'read', ar: 'يَقْرَأُ' }, { en: 'love', ar: 'يُحِبُّ' },
  { en: 'good morning', ar: 'صَبَاحُ الخَيْر' }, { en: 'good night', ar: 'تُصْبِحُ عَلَى خَيْر' },
  { en: 'how are you', ar: 'كَيْفَ حَالُك' }, { en: 'goodbye', ar: 'مَعَ السَّلَامَة' },
  { en: 'please', ar: 'مِنْ فَضْلِك' }, { en: 'sorry', ar: 'آسِف' }, { en: 'welcome', ar: 'أَهْلًا وَسَهْلًا' }
];
// De-duplicate by English word, keeping the first (most curated) entry
const CB_VOCAB_DEDUPED = [];
const seenEn = new Set();
for (const v of CB_VOCAB) {
  if (!seenEn.has(v.en)) { seenEn.add(v.en); CB_VOCAB_DEDUPED.push(v); }
}
CB_VOCAB.length = 0;
CB_VOCAB.push(...CB_VOCAB_DEDUPED);

const CB_VOWELS = {
  'fatha': 'Fatḥa (ـَ) makes a short "a" sound, written above the letter. Example: بَ = "ba".',
  'fatḥa': 'Fatḥa (ـَ) makes a short "a" sound, written above the letter. Example: بَ = "ba".',
  'kasra': 'Kasra (ـِ) makes a short "i" sound, written below the letter. Example: بِ = "bi".',
  'damma': 'Ḍamma (ـُ) makes a short "u" sound, written above the letter. Example: بُ = "bu".',
  'ḍamma': 'Ḍamma (ـُ) makes a short "u" sound, written above the letter. Example: بُ = "bu".',
  'sukun': 'Sukun (ـْ) means "no vowel" — the letter is pronounced with no short vowel after it.',
  'shadda': 'Shadda (ـّ) doubles a letter\'s sound, as if writing it twice. بَّ = "bba".'
};

function cbWordBoundaryMatch(msg, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(msg);
}

function cbFindVocab(word) {
  const w = word.trim().toLowerCase();
  return CB_VOCAB.find(v => v.en === w) || CB_VOCAB.find(v => cbWordBoundaryMatch(w, v.en) || cbWordBoundaryMatch(v.en, w));
}

function cbFuzzyVocab(word) {
  const w = word.trim().toLowerCase();
  if (w.length < 3) return null;
  let best = null, bestScore = Infinity;
  for (const v of CB_VOCAB) {
    const lenDiff = Math.abs(v.en.length - w.length);
    if (lenDiff > 2) continue;
    const dist = levenshtein(w, v.en);
    if (dist > 2) continue;
    const sameFirstLetter = v.en[0] === w[0] ? 0 : 1;
    const sameLastLetter = v.en[v.en.length - 1] === w[w.length - 1] ? 0 : 1;
    // Lower score wins: edit distance matters most, then matching first/last letters, then closer length
    const score = dist * 10 + sameFirstLetter * 2 + sameLastLetter * 2 + lenDiff;
    if (score < bestScore) { bestScore = score; best = v; }
  }
  return best;
}

function cbPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cbFindLetter(query) {
  const q = query.trim();
  return ARABIC_LETTERS.find(l => l.ar === q || l.name_en.toLowerCase() === q.toLowerCase() || l.name_ar === q);
}

function cbAnswer(raw) {
  const msg = raw.toLowerCase().trim();

  if (/^(hi|hello|hey|مرحبا|السلام)/.test(msg)) {
    return cbPick([
      { en: "Hello! Ask me how to say a word in Arabic, what a letter sounds like, or about vowels and grammar.", ar: "مرحبًا! اسألني عن ترجمة كلمة، أو صوت حرف، أو الحركات والقواعد." },
      { en: "Hi there! I'm Maryam 👋 — try asking me to translate a word, or about a grammar topic you're stuck on.", ar: "أهلًا وسهلًا!" },
      { en: "Hey! Ready to practice some Arabic? Ask away.", ar: "مَرْحَبًا بِك!" }
    ]);
  }

  // small talk / personality
  if (/\b(your name|who are you)\b/.test(msg)) return { en: "I'm Maryam! I'm one of نور's mascots, and I'm here to help you practice Arabic vocabulary and grammar.", ar: "أَنَا مَرْيَم!" };
  if (/\bhow old\b/.test(msg)) return { en: "I don't really have an age — I'm just here to help with your Arabic practice!" };
  if (/\b(favou?rite letter)\b/.test(msg)) return { en: "I have a soft spot for ع (Ayn) — it's a sound that doesn't exist in English at all, so it always impresses people once you get it right!" };
  if (/\bwhy learn arabic\b/.test(msg) || /\bwhy should i learn\b/.test(msg)) return { en: "Arabic is spoken by over 400 million people, it's the language of the Quran, and it opens the door to a huge amount of history, poetry, and culture. Plus, once you learn the root-letter system, it's honestly a really logical language!" };
  if (/\bfun fact\b/.test(msg) || /\btell me something\b/.test(msg)) return cbPick([
    { en: "Fun fact: Arabic has no capital letters at all — every letter keeps the same basic form regardless of where a sentence starts." },
    { en: "Fun fact: many English words came from Arabic — like 'algebra', 'coffee', 'lemon', and 'sofa'!" },
    { en: "Fun fact: Arabic script is written right to left, but numbers within Arabic text are still written left to right." }
  ]);
  if (/\bhardest letter\b/.test(msg)) return { en: "Many learners find ض (Ḍaad) and ع (Ayn) the trickiest — they're sounds that don't really exist in English. Practice on the Letters page and don't worry if it takes a while!" };
  if (/\bdialect\b/.test(msg) || /\bmsa\b/.test(msg) || /\bfus[h']?a\b/.test(msg)) return { en: "نور teaches Modern Standard Arabic (Fuṣḥā) — the formal version used in writing, news, and across the Arab world. Spoken dialects (Egyptian, Gulf, Levantine, etc.) vary quite a bit region to region, but MSA is the shared foundation everyone learns first." };

  // vowel marks — check first since they're specific terms
  for (const key in CB_VOWELS) {
    if (msg.includes(key)) return { en: CB_VOWELS[key] };
  }

  // grammar / site-topic keywords — checked early so they aren't swallowed by the translation-lookup branch below
  if (msg.includes('plural')) return { en: 'Some plurals just add a suffix; others change shape entirely ("broken" plurals). Example: كِتَاب (book) → كُتُب (books). See the Lessons page, Grade 5.' };
  if (msg.includes('pronoun')) return { en: 'Arabic pronouns: أَنَا (I), أَنْتَ/أَنْتِ (you), هُوَ (he), هِيَ (she), نَحْنُ (we), هُمْ (they). See the Grammar page for the full table.' };
  if (msg.includes('past tense') || msg.includes('past-tense')) return { en: 'Past-tense verbs take a suffix, e.g. كَتَبَ (he wrote), كَتَبْتُ (I wrote). See Grade 6 on the Lessons page.' };
  if (msg.includes('present tense') || msg.includes('present-tense')) return { en: 'Present-tense verbs take a prefix that changes with the subject, e.g. أَكْتُبُ (I write), يَكْتُبُ (he writes). See the Grammar page.' };
  if (msg.includes('alphabet') || msg.includes('letters')) return { en: 'Arabic has 28 letters, written right to left. Visit the Letters page to explore each one — click a tile to hear it!' };
  if (msg.includes('quiz')) return { en: "You can test yourself any time on the Quiz page — it's multiple choice, with new questions every day." };
  if (msg.includes('worksheet')) return { en: 'Printable worksheets (tracing, matching, translation, reading) are on the Worksheets page — use the print button, and there\'s an answer key on each one too.' };
  if (msg.includes('grade') || msg.includes('curriculum')) return { en: 'The Lessons page has a full path from Grade 1 to Grade 12 — click any lesson to open it and try a short practice quiz.' };
  if (msg.includes('trace') || msg.includes('tracing') || msg.includes('handwriting')) return { en: 'Head to the Practice page and open the Tracing tab — you can trace letters or whole words with your mouse or finger.' };
  if (msg.includes('assignment') || msg.includes('homework')) return { en: 'The Practice page has a Weekly Assignment tab with a new sentence task each week — write your answer, then reveal the model answer to check yourself.' };
  if (msg.includes('badge') || msg.includes('achievement')) return { en: 'You can earn badges by practicing across the site — check your Profile page to see which ones you\'ve unlocked and which are still locked.' };
  if (msg.includes('streak') || msg.includes('profile')) return { en: 'Your Profile page shows your visit streak, badges earned, and how many sections of the site you\'ve explored so far.' };
  if (msg.includes('game')) return { en: 'The Games page has three games: Word Matching, a Memory Game, and Audio Match (where you listen and pick the matching word).' };
  if (msg.includes('culture')) return { en: 'The Culture page covers UAE traditions, hospitality, calligraphy, and has a couple of short videos too.' };
  if (msg.includes('sign') && (msg.includes('in') || msg.includes('up') || msg.includes('out'))) return { en: 'You sign up once with your name and grade — that\'s saved right on your device. Use "Sign out" in the top bar if you ever want to switch profiles.' };
  if (msg.includes('idafa') || msg.includes('possess') || msg.includes('iḍāfa')) return { en: 'Arabic shows possession by placing two nouns together with no separate word for "of" — e.g. بَيْتُ الطَّالِبِ ("the student\'s house"). See Grammar, topic 6.' };
  if (msg.includes('feminine') || msg.includes('taa marbuta') || msg.includes('ة')) return { en: 'Many feminine words end in ة (tāʾ marbūṭa), pronounced like a soft "a". Example: مُعَلِّم (teacher, m.) → مُعَلِّمَة (teacher, f.). See Grammar, topic 5.' };
  if (msg.includes('definite') || msg.includes('al-') || msg.includes('"the"')) return { en: 'Adding الـ ("al-") to the start of a noun makes it definite, like "the" in English — كِتَاب (a book) → الكِتَاب (the book). See Grammar, topic 4.' };
  if (msg.includes('root') && msg.includes('letter')) return { en: 'Most Arabic words are built from a three-letter root that carries the core meaning — e.g. ك ت ب (k-t-b) is the root behind كَتَبَ (he wrote), كِتَاب (book), and مَكْتَبَة (library).' };
  if (msg.includes('case') || msg.includes('إعراب') || msg.includes('iraab')) return { en: 'Arabic has three main grammatical cases — مرفوع (nominative), منصوب (accusative), and مجرور (genitive) — each shown with a different short vowel ending. See Grammar page, Grade 9 on Lessons.' };
  if (msg.includes('rtl') || msg.includes('right to left') || msg.includes('direction')) return { en: 'Arabic is written and read from right to left — the opposite direction from English!' };
  if (msg.includes('who made') || msg.includes('who built') || msg.includes('who created')) return { en: 'نور was built by three students — Faamidha, Nazneen, and Aaira — check out the About page for the full story!' };
  if (msg.includes('what does noor mean') || msg.includes('what does نور mean') || (msg.includes('noor') && msg.includes('mean'))) return { en: 'نور (Noor) means "light" in Arabic — the site\'s tagline is "Knowledge is Light."' };
  if (msg.includes('ahmed') || msg.includes('maryam')) return { en: "Ahmed and Maryam are نور's friendly mascots — you'll spot their tips scattered around the Grammar and About pages!" };
  if (msg.includes('how many letters')) return { en: 'Arabic has 28 letters in total.' };
  if (msg.includes('vowel') && !Object.keys(CB_VOWELS).some(k => msg.includes(k))) return { en: 'Arabic short vowels (tashkeel) are fatḥa (a), kasra (i), and ḍamma (u) — small marks above or below a letter. Ask me "what is fatha" for more detail!' };
  if (msg.includes('thank')) return cbPick([
    { en: "You're welcome! Good luck with your Arabic practice.", ar: 'عَفْوًا! بِالتَّوْفِيق!' },
    { en: "Anytime! Come back whenever you're stuck on something.", ar: 'عَفْوًا!' }
  ]);
  if (/\b(bye|goodbye|see you)\b/.test(msg)) return cbPick([
    { en: 'Bye for now — see you next time!', ar: 'مَعَ السَّلَامَة!' },
    { en: 'Take care, keep practicing!', ar: 'إِلَى اللِّقَاء!' }
  ]);
  if (msg.includes('how are you')) return { en: "I'm doing great, thanks for asking! Ready to help you practice some Arabic?" };

  // letter lookup — find any known Arabic letter in the message, works regardless of word order
  // ("what does ب sound like", "sound of ب", "what letter is باء", bare "ب", etc.)
  if (/\b(sound|pronounce|pronunciation|letter)\b/i.test(msg) || /^[\u0600-\u06FF]$/.test(raw.trim())) {
    const arabicChars = raw.match(/[\u0600-\u06FF]/g) || [];
    for (const ch of arabicChars) {
      const letter = cbFindLetter(ch);
      if (letter) return { en: `${letter.name_en} (${letter.ar}) sounds ${letter.sound}. Example word: "${letter.word_en}"`, ar: letter.word_ar };
    }
    const nameMatch = ARABIC_LETTERS.find(l => cbWordBoundaryMatch(msg, l.name_en.toLowerCase()));
    if (nameMatch) return { en: `${nameMatch.name_en} (${nameMatch.ar}) sounds ${nameMatch.sound}. Example word: "${nameMatch.word_en}"`, ar: nameMatch.word_ar };
  }

  // "how do you say X" / "what is X in arabic" / "translate X" / "meaning of X"
  let m = msg.match(/(?:how do you say|what is|what's|translate|meaning of|what does)\s+["']?([a-z\s]+?)["']?\s*(?:mean|in arabic)?\??$/);
  if (m) {
    const word = m[1].trim();
    const hit = cbFindVocab(word);
    if (hit) return { en: `"${word}" in Arabic is:`, ar: hit.ar };
    const fuzzyHit = cbFuzzyVocab(word);
    if (fuzzyHit) return { en: `Did you mean "${fuzzyHit.en}"? In Arabic that's:`, ar: fuzzyHit.ar };
    // fall through — might be a topic word handled elsewhere, or genuinely unknown
  }

  // direct vocab match anywhere in message (word-boundary safe) — catches casual phrasing
  const directHit = CB_VOCAB.find(v => cbWordBoundaryMatch(msg, v.en));
  if (directHit) return { en: `"${directHit.en}" in Arabic is:`, ar: directHit.ar };

  // Arabic-to-English: if the raw message contains an Arabic word we know, translate the other way
  const arWordHit = CB_VOCAB.find(v => raw.includes(v.ar) || raw.replace(/[\u064B-\u065F\u0670]/g, '').includes(v.ar.replace(/[\u064B-\u065F\u0670]/g, '')));
  if (arWordHit) return { en: `That means "${arWordHit.en}" in English.`, ar: arWordHit.ar };

  // last resort: try fuzzy-matching individual words in the message against known vocab, to catch typos
  const words = msg.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  for (const w of words) {
    const fuzzy = cbFuzzyVocab(w);
    if (fuzzy && fuzzy.en !== w) return { en: `Did you mean "${fuzzy.en}"? In Arabic that's:`, ar: fuzzy.ar };
  }

  return cbPick([
    { en: "I don't have that one yet — try asking me to translate a word (\"how do you say book in Arabic\"), a letter sound (\"what does ب sound like\"), or a grammar topic like plurals, pronouns, or the feminine ة." },
    { en: "Hmm, I'm not sure about that. I'm best with vocabulary, letter sounds, vowels, and grammar topics — try rephrasing, or ask me something like \"what is fatha\" or \"how do you say water in Arabic\"." },
    { en: "I don't know that one! Good places to explore: the Letters page for sounds, the Grammar page for rules, or just ask me to translate a specific word." },
    { en: "That's outside what I know right now. I can help with vocabulary, pronunciation, vowels, and grammar — or check the Lessons page for a full curriculum." }
  ]);
}

function initChatBuddy() {
  const btn = document.createElement('button');
  btn.id = 'chatBuddyBtn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Open practice buddy chat');
  btn.innerHTML = '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="width:34px;height:34px;"><circle cx="20" cy="20" r="20" fill="#CE1126"/><path d="M8 22 Q8 6 20 6 Q32 6 32 22 L32 30 Q26 24 20 24 Q14 24 8 30 Z" fill="#00732F"/><circle cx="20" cy="19" r="9" fill="#F0C29C"/><circle cx="16.5" cy="19" r="1.2" fill="#262420"/><circle cx="23.5" cy="19" r="1.2" fill="#262420"/><path d="M16 23.5 Q20 26.5 24 23.5" stroke="#262420" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>';
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'chatBuddyPanel';
  panel.innerHTML = `
    <div class="cb-header">
      <span>Maryam <span class="ar" style="font-weight:500;">مَرْيَم</span></span>
      <button type="button" class="cb-close" aria-label="Close chat">✕</button>
    </div>
    <div class="cb-messages" id="cbMessages"></div>
    <div class="cb-quick" id="cbQuick">
      <button type="button" data-q="how do you say book in arabic">How do you say "book"?</button>
      <button type="button" data-q="what does ب sound like">Sound of ب</button>
      <button type="button" data-q="what is fatha">What is fatḥa?</button>
    </div>
    <div class="cb-input-row">
      <input type="text" id="cbInput" placeholder="Ask a question..." />
      <button type="button" id="cbSend" aria-label="Send">➤</button>
    </div>
  `;
  document.body.appendChild(panel);

  const messages = panel.querySelector('#cbMessages');
  const input = panel.querySelector('#cbInput');

  function addMsg(role, en, ar) {
    const div = document.createElement('div');
    div.className = `cb-msg ${role}`;
    div.innerHTML = `${en || ''}${ar ? `<span class="ar">${ar}</span>` : ''}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function handleSend(text) {
    const q = text.trim();
    if (!q) return;
    addMsg('user', q);
    input.value = '';
    setTimeout(() => {
      const a = cbAnswer(q);
      addMsg('bot', a.en, a.ar);
    }, 250);
  }

  btn.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !messages.dataset.greeted) {
      addMsg('bot', "Hi! I'm your practice buddy. Ask me how to say a word in Arabic, what a letter sounds like, or about grammar topics.", 'مرحبًا! اسألني عن أي كلمة أو حرف أو قاعدة.');
      messages.dataset.greeted = '1';
    }
  });
  panel.querySelector('.cb-close').addEventListener('click', () => panel.classList.remove('open'));
  panel.querySelector('#cbSend').addEventListener('click', () => handleSend(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(input.value); });
  panel.querySelectorAll('.cb-quick button').forEach(b => {
    b.addEventListener('click', () => handleSend(b.dataset.q));
  });
}

/* ---------- Letters page ---------- */
function initLettersPage() {
  const grid = document.getElementById('lettersGrid');
  if (!grid) return;

  ARABIC_LETTERS.forEach((letter, i) => {
    const tile = document.createElement('button');
    tile.className = 'letter-tile';
    tile.textContent = letter.ar;
    tile.setAttribute('aria-label', `${letter.name_en} / ${letter.name_ar}`);
    tile.addEventListener('click', () => showLetterDetail(i, tile));
    grid.appendChild(tile);
  });

  function showLetterDetail(index, tileEl) {
    document.querySelectorAll('.letter-tile').forEach(t => t.classList.remove('active', 'speaking'));
    tileEl.classList.add('active');

    const l = ARABIC_LETTERS[index];
    const detail = document.getElementById('letterDetail');
    detail.classList.add('show');
    detail.innerHTML = `
      <div class="big-letter">${l.ar}</div>
      <div>
        <dl>
          <dt class="en">Name</dt><dd><span class="en">${l.name_en}</span> <span class="ar">— ${l.name_ar}</span></dd>
          <dt class="en">Sound</dt><dd class="en">${l.sound}</dd>
          <dt class="en">Example</dt><dd class="ar">${l.word_ar}</dd>
          <dt class="en">Meaning</dt><dd class="en">${l.word_en}</dd>
          <dt class="en">Positions</dt><dd class="ar">${l.pos.initial} &nbsp; ${l.pos.medial} &nbsp; ${l.pos.final}</dd>
        </dl>
        <button class="sound-btn en" type="button">🔊 Hear letter</button>
        <button class="sound-btn en" type="button" style="margin-inline-start:8px;">🔊 Hear word</button>
      </div>
    `;

    // Auto-play the letter name as soon as it's clicked
    tileEl.classList.add('speaking');
    speakArabic(l.name_ar);
    setTimeout(() => tileEl.classList.remove('speaking'), 500);

    const [letterBtn, wordBtn] = detail.querySelectorAll('.sound-btn');
    letterBtn.addEventListener('click', () => speakArabic(l.name_ar));
    wordBtn.addEventListener('click', () => speakArabic(l.word_ar));

    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/* ---------- Reading page: reveal answers ---------- */
function initReadingPage() {
  document.querySelectorAll('.reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ans = btn.nextElementSibling;
      ans.classList.toggle('show');
      btn.textContent = ans.classList.contains('show') ? 'Hide answers ▲' : 'Show answers ▼';
    });
  });
}

/* ---------- Worksheets: answer key toggle ---------- */
function initWorksheetAnswers() {
  document.querySelectorAll('.ws-answer-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.nextElementSibling;
      key.classList.toggle('show');
      btn.innerHTML = key.classList.contains('show')
        ? '🙈 <span class="en">Hide Answer Key</span>'
        : '🔑 <span class="en">Show Answer Key</span>';
    });
  });
}

/* ---------- Reading page: listen buttons ---------- */
function initListenButtons() {
  document.querySelectorAll('.listen-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.listenTarget;
      const p = document.querySelector(`[data-listen="${id}"]`);
      if (p) speakArabic(p.textContent);
    });
  });
}

/* ---------- Reading page: Arabic multiple-choice comprehension ---------- */
const READING_QUESTIONS = [
  [
    { q: 'ماذا يدرس الطالب؟', options: ['اللغة العربية', 'الرياضيات', 'العلوم', 'التاريخ'], answer: 'اللغة العربية' },
    { q: 'ماذا يحب الطالب؟', options: ['القراءة والكتابة', 'الرياضة والموسيقى', 'الطبخ والرسم', 'السباحة والجري'], answer: 'القراءة والكتابة' },
    { q: 'متى يذهب الطالب إلى المدرسة؟', options: ['كل يوم', 'مرة في الأسبوع', 'في العطلة فقط', 'مرة في الشهر'], answer: 'كل يوم' }
  ],
  [
    { q: 'كيف يوصف البيت؟', options: ['كبير وجميل', 'صغير وقديم', 'بعيد ومظلم', 'جديد وغالٍ'], answer: 'كبير وجميل' },
    { q: 'ماذا يوجد في البيت؟', options: ['غرفة نوم ومطبخ وحديقة', 'مسبح وملعب', 'مكتبة ومتحف', 'مصنع ومستودع'], answer: 'غرفة نوم ومطبخ وحديقة' },
    { q: 'كم يحب المتحدث بيته؟', options: ['كثيرًا', 'قليلاً', 'لا يحبه', 'أحيانًا'], answer: 'كثيرًا' }
  ],
  [
    { q: 'أين تشرق الشمس؟', options: ['فوق الصحراء', 'فوق الجبل', 'فوق البحر', 'فوق المدينة'], answer: 'فوق الصحراء' },
    { q: 'ماذا يفعل الصياد؟', options: ['يذهب إلى البحر ليصطاد السمك', 'يذهب إلى السوق', 'يزرع الأرض', 'يبني بيتًا'], answer: 'يذهب إلى البحر ليصطاد السمك' },
    { q: 'ماذا يحدث في المساء؟', options: ['تجتمع العائلة لتناول العشاء', 'تنام العائلة مبكرًا', 'تسافر العائلة', 'تشاهد العائلة التلفاز'], answer: 'تجتمع العائلة لتناول العشاء' }
  ],
  [
    { q: 'بماذا تحتفل الإمارات كل عام؟', options: ['باليوم الوطني', 'بعيد الأضحى', 'برأس السنة', 'بيوم المعلم'], answer: 'باليوم الوطني' },
    { q: 'كيف يزين الناس الشوارع؟', options: ['بالأعلام', 'بالورود', 'بالأضواء الملونة', 'بالصور'], answer: 'بالأعلام' },
    { q: 'كيف يشعر الجميع في هذا اليوم؟', options: ['بالفخر والسعادة', 'بالحزن', 'بالتعب', 'بالخوف'], answer: 'بالفخر والسعادة' }
  ],
  [
    { q: 'أين يعيش الجمل؟', options: ['في الصحراء', 'في الغابة', 'في الجبل', 'في البحر'], answer: 'في الصحراء' },
    { q: 'ماذا يستطيع الجمل أن يفعل بدون ماء؟', options: ['السير مسافات طويلة', 'الطيران', 'السباحة', 'النوم لأيام'], answer: 'السير مسافات طويلة' },
    { q: 'ماذا يسمى الجمل؟', options: ['سفينة الصحراء', 'ملك الغابة', 'أمير الصحراء', 'نجم الصحراء'], answer: 'سفينة الصحراء' }
  ]
];

function initReadingMCQ() {
  document.querySelectorAll('.reading-mcq').forEach(container => {
    const idx = parseInt(container.dataset.passage, 10);
    const questions = READING_QUESTIONS[idx];
    if (!questions) return;

    questions.forEach((item, qi) => {
      const block = document.createElement('div');
      block.style.marginTop = qi === 0 ? '18px' : '14px';
      block.innerHTML = `
        <div class="quiz-question ar" style="font-size:1.05rem;">${item.q}</div>
        <div class="quiz-options"></div>
      `;
      const optWrap = block.querySelector('.quiz-options');
      const shuffled = [...item.options].sort(() => Math.random() - 0.5);
      shuffled.forEach(opt => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'quiz-option';
        b.textContent = opt;
        b.addEventListener('click', () => {
          block.querySelectorAll('.quiz-option').forEach(o => o.disabled = true);
          if (opt === item.answer) {
            b.classList.add('correct');
          } else {
            b.classList.add('wrong');
            [...optWrap.children].find(o => o.textContent === item.answer)?.classList.add('correct');
          }
        });
        optWrap.appendChild(b);
      });
      container.appendChild(block);
    });
  });
}

/* ---------- Quiz page ---------- */
const QUIZ_QUESTIONS = [
  { q_en: 'Which letter makes the sound "m" as in "moon"?', q_ar:'أي حرف يصدر صوت الميم؟', options:['م','ن','ب','ل'], answer:'م' },
  { q_en: 'What does "بَيْت" mean?', q_ar:'ماذا تعني كلمة "بَيْت"؟', options:['House','Book','Water','Sun'], answer:'House' },
  { q_en: 'Which letter is "Alif"?', q_ar:'أي حرف هو "أَلِف"؟', options:['ا','ي','و','ه'], answer:'ا' },
  { q_en: 'What does "شَمْس" mean?', q_ar:'ماذا تعني كلمة "شَمْس"؟', options:['Moon','Sun','Star','Cloud'], answer:'Sun' },
  { q_en: 'Which letter makes a rolled "r" sound?', q_ar:'أي حرف يصدر صوت الراء المكرر؟', options:['ر','ز','د','ذ'], answer:'ر' },
  { q_en: 'What does "كِتَاب" mean?', q_ar:'ماذا تعني كلمة "كِتَاب"؟', options:['Pen','Bag','Book','Table'], answer:'Book' },
  { q_en: 'Which letter is "Meem"?', q_ar:'أي حرف هو "ميم"؟', options:['م','ك','ل','ن'], answer:'م' },
  { q_en: 'What does "قَمَر" mean?', q_ar:'ماذا تعني كلمة "قَمَر"؟', options:['Star','Sky','Moon','Cloud'], answer:'Moon' },
  { q_en: 'What does "مَاء" mean?', q_ar:'ماذا تعني كلمة "مَاء"؟', options:['Fire','Water','Air','Sand'], answer:'Water' },
  { q_en: 'What does "مَدْرَسَة" mean?', q_ar:'ماذا تعني كلمة "مَدْرَسَة"؟', options:['Hospital','School','Market','House'], answer:'School' },
  { q_en: 'Which letter is "Baa"?', q_ar:'أي حرف هو "باء"؟', options:['ب','ت','ث','ن'], answer:'ب' },
  { q_en: 'What does "أَنَا" mean?', q_ar:'ماذا تعني كلمة "أَنَا"؟', options:['You', 'He', 'I', 'We'], answer:'I' },
  { q_en: 'What does "هُوَ" mean?', q_ar:'ماذا تعني كلمة "هُوَ"؟', options:['She', 'He', 'They', 'We'], answer:'He' },
  { q_en: 'Which mark makes a short "a" sound?', q_ar:'أي حركة من هذه الحركات هي الفتحة؟', options:['فتحة', 'كسرة', 'ضمة', 'سكون'], answer:'فتحة' },
  { q_en: 'What does "جَمِيل" mean?', q_ar:'ماذا تعني كلمة "جَمِيل"؟', options:['Ugly', 'Beautiful', 'Big', 'Small'], answer:'Beautiful' },
  { q_en: 'What does "طَالِب" mean?', q_ar:'ماذا تعني كلمة "طَالِب"؟', options:['Teacher', 'Student', 'Doctor', 'Driver'], answer:'Student' },
  { q_en: 'Which letter is "Seen"?', q_ar:'أي حرف هو "سين"؟', options:['س', 'ش', 'ص', 'ز'], answer:'س' },
  { q_en: 'What does "كَبِير" mean?', q_ar:'ماذا تعني كلمة "كَبِير"؟', options:['Small', 'Big', 'Fast', 'Slow'], answer:'Big' },
  { q_en: 'How do you say "thank you" in Arabic?', q_ar:'أي كلمة نقولها لنشكر شخصًا ما؟', options:['مَرْحَبًا', 'شُكْرًا', 'نَعَم', 'لَا'], answer:'شُكْرًا' },
  { q_en: 'Which word means "camel"?', q_ar:'أي كلمة من هذه الكلمات تدل على الجمل؟', options:['أَسَد', 'جَمَل', 'قَمَر', 'بَيْت'], answer:'جَمَل' },
  { q_en: 'What does "يَكْتُبُ" mean?', q_ar:'ماذا تعني كلمة "يَكْتُبُ"؟', options:['He reads', 'He writes', 'He runs', 'He eats'], answer:'He writes' },
  { q_en: 'Which plural means "books"?', q_ar:'ما جمع كلمة "كِتَاب"؟', options:['كُتُب', 'كِتَاب', 'كُتَّاب', 'كِتَابَة'], answer:'كُتُب' },
  { q_en: 'What does "الـ" do to a noun?', q_ar:'ماذا تفعل "الـ" بالاسم؟', options:['Makes it plural', 'Makes it definite ("the")', 'Makes it a question', 'Makes it feminine'], answer:'Makes it definite ("the")' },
  { q_en: 'Which letter is "Waaw"?', q_ar:'أي حرف هو "واو"؟', options:['و', 'ي', 'ا', 'ه'], answer:'و' }
];

function seededShuffle(array, seed) {
  const arr = [...array];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  function rand() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getDailyQuizQuestions(count) {
  const shuffled = seededShuffle(QUIZ_QUESTIONS, getDailySeed());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function initQuizPage() {
  const box = document.getElementById('quizBox');
  if (!box) return;

  const dateNote = document.getElementById('quizDateNote');
  if (dateNote) {
    dateNote.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  const dailyQuestions = getDailyQuizQuestions(8);
  let current = 0;
  let score = 0;
  const total = dailyQuestions.length;

  function render() {
    if (current >= total) {
      renderResult();
      return;
    }
    const item = dailyQuestions[current];
    box.innerHTML = `
      <div class="quiz-progress"><span>Question ${current + 1} / ${total}</span><span>Score: ${score}</span></div>
      <div class="quiz-question"><span class="en">${item.q_en}</span><span class="ar">${item.q_ar}</span></div>
      <div class="quiz-options"></div>
      <div class="quiz-feedback" aria-live="polite"></div>
    `;
    const optWrap = box.querySelector('.quiz-options');
    const feedback = box.querySelector('.quiz-feedback');
    const shuffled = [...item.options].sort(() => Math.random() - 0.5);

    shuffled.forEach(opt => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-option';
      b.textContent = opt;
      b.addEventListener('click', () => {
        box.querySelectorAll('.quiz-option').forEach(o => o.disabled = true);
        if (opt === item.answer) {
          b.classList.add('correct');
          feedback.textContent = '✅ Correct!';
          score++;
        } else {
          b.classList.add('wrong');
          feedback.textContent = `❌ Not quite — the answer was "${item.answer}".`;
          [...optWrap.children].find(o => o.textContent === item.answer)?.classList.add('correct');
        }
        setTimeout(() => { current++; render(); }, 1100);
      });
      optWrap.appendChild(b);
    });
  }

  function renderResult() {
    awardBadge('first_quiz');
    if (score === total) awardBadge('perfect_quiz');
    box.innerHTML = `
      <div class="quiz-result">
        <p class="score">${score}/${total}</p>
        <h3>${score === total ? 'Excellent! أَحْسَنْت!' : score >= total / 2 ? 'Good job! أَحْسَنْت!' : 'Keep practicing! حَاوِلْ مَرَّةً أُخْرَى!'}</h3>
        <p>Review the letters and vocabulary, then try again to beat your score.</p>
        <button class="btn btn-primary" id="quizRestart" type="button">Try Again</button>
      </div>
    `;
    document.getElementById('quizRestart').addEventListener('click', () => {
      current = 0; score = 0; render();
    });
  }

  render();
}

/* ---------- Games page ---------- */
function initMatchGame() {
  const wrap = document.getElementById('matchGame');
  if (!wrap) return;

  const arCol = wrap.querySelector('.match-col.ar-col');
  const enCol = wrap.querySelector('.match-col.en-col');
  const status = wrap.nextElementSibling;

  const shuffledAr = [...MATCH_PAIRS].sort(() => Math.random() - 0.5);
  const shuffledEn = [...MATCH_PAIRS].sort(() => Math.random() - 0.5);
  let selectedAr = null, selectedEn = null, matchedCount = 0;

  function clearWrongState() {
    wrap.querySelectorAll('.match-item.wrong-flash').forEach(i => i.classList.remove('wrong-flash', 'selected'));
  }

  shuffledAr.forEach(pair => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'match-item always-ar';
    el.textContent = pair.ar;
    el.dataset.ar = pair.ar;
    el.addEventListener('click', () => {
      if (el.classList.contains('matched')) return;
      clearWrongState();
      arCol.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
      selectedAr = el;
      tryMatch();
    });
    arCol.appendChild(el);
  });

  shuffledEn.forEach(pair => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'match-item en';
    el.textContent = pair.en;
    el.dataset.ar = pair.ar;
    el.addEventListener('click', () => {
      if (el.classList.contains('matched')) return;
      clearWrongState();
      enCol.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
      selectedEn = el;
      tryMatch();
    });
    enCol.appendChild(el);
  });

  function tryMatch() {
    if (!selectedAr || !selectedEn) return;
    const a = selectedAr, b = selectedEn;
    if (a.dataset.ar === b.dataset.ar) {
      a.classList.add('matched');
      b.classList.add('matched');
      a.classList.remove('selected');
      b.classList.remove('selected');
      matchedCount++;
      status.textContent = `Matched ${matchedCount} of ${MATCH_PAIRS.length} — keep going!`;
      if (matchedCount === MATCH_PAIRS.length) { status.textContent = '🎉 All matched! Great work!'; awardBadge('game_champion'); }
    } else {
      a.classList.add('wrong-flash');
      b.classList.add('wrong-flash');
      setTimeout(clearWrongState, 500);
    }
    selectedAr = null; selectedEn = null;
  }
}

function initMemoryGame() {
  const grid = document.getElementById('memoryGrid');
  if (!grid) return;
  const status = document.getElementById('memoryStatus');

  const set = PRACTICE_WORDS.slice(0, 8);
  let cards = [];
  set.forEach((w, i) => {
    cards.push({ pairId: i, text: w.ar, lang: 'ar' });
    cards.push({ pairId: i, text: w.en, lang: 'en' });
  });
  cards.sort(() => Math.random() - 0.5);

  let flipped = [];
  let matched = 0;
  let lock = false;

  cards.forEach(card => {
    const c = document.createElement('button');
    c.type = 'button';
    const langClass = card.lang === 'ar' ? 'always-ar' : 'en';
    c.className = `memory-card ${langClass}`;
    c.dataset.pairId = card.pairId;
    c.textContent = card.text;
    c.addEventListener('click', () => {
      if (lock || c.classList.contains('flipped') || c.classList.contains('matched')) return;
      c.classList.add('flipped');
      flipped.push(c);
      if (flipped.length === 2) {
        lock = true;
        const [a, b] = flipped;
        if (a.dataset.pairId === b.dataset.pairId) {
          a.classList.add('matched'); b.classList.add('matched');
          matched++;
          flipped = []; lock = false;
          status.textContent = `Pairs found: ${matched} / ${set.length}`;
          if (matched === set.length) { status.textContent = '🎉 You matched every word!'; awardBadge('game_champion'); }
        } else {
          setTimeout(() => {
            a.classList.remove('flipped'); b.classList.remove('flipped');
            flipped = []; lock = false;
          }, 700);
        }
      }
    });
    grid.appendChild(c);
  });
}

function initGameTabs() {
  const tabs = document.querySelectorAll('.game-tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(tab.dataset.target).classList.add('active');
    });
  });
}

function initAudioMatchGame() {
  const playBtn = document.getElementById('audioPlayBtn');
  const optionsEl = document.getElementById('audioOptions');
  const statusEl = document.getElementById('audioStatus');
  if (!playBtn || !optionsEl) return;

  const bank = [...MATCH_PAIRS, ...PRACTICE_WORDS.map(w => ({ ar: w.ar, en: w.en }))];
  let correctCount = 0, totalCount = 0;
  let currentWord = null;

  function nextRound(shouldSpeak) {
    optionsEl.innerHTML = '';
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    currentWord = shuffled[0];
    const distractors = shuffled.slice(1, 4);
    const choices = [currentWord, ...distractors].sort(() => Math.random() - 0.5);

    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = choice.ar;
      btn.addEventListener('click', () => {
        optionsEl.querySelectorAll('button').forEach(b => b.disabled = true);
        totalCount++;
        if (choice.ar === currentWord.ar) {
          btn.classList.add('correct');
          correctCount++;
        } else {
          btn.classList.add('wrong');
          [...optionsEl.children].find(b => b.textContent === currentWord.ar)?.classList.add('correct');
        }
        if (statusEl) statusEl.textContent = `Score: ${correctCount} / ${totalCount}`;
        if (totalCount >= 5) awardBadge('game_champion');
        setTimeout(() => nextRound(true), 1300);
      });
      optionsEl.appendChild(btn);
    });

    if (shouldSpeak) speakArabic(currentWord.ar);
  }

  playBtn.addEventListener('click', () => {
    if (currentWord) speakArabic(currentWord.ar);
    else nextRound(true);
  });

  // Build the first round's choices without speaking — audio should only
  // play once the player actually opens this tab and presses Play.
  nextRound(false);

  const audioTabBtn = document.querySelector('.game-tab[data-target="audioPanel"]');
  if (audioTabBtn) {
    audioTabBtn.addEventListener('click', () => {
      if (currentWord) speakArabic(currentWord.ar);
    }, { once: true });
  }
}

/* ---------- Lessons: writing practice trace letters ---------- */
function initTraceLetters() {
  const row = document.getElementById('traceRow');
  if (!row) return;
  ['ا','ب','ت','م','ن'].forEach(l => {
    const el = document.createElement('div');
    el.className = 'trace-letter';
    el.textContent = l;
    row.appendChild(el);
  });
}

/* ---------- Init all on load ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initLettersPage();
  initReadingPage();
  initWorksheetAnswers();
  initListenButtons();
  initReadingMCQ();
  initQuizPage();
  initMatchGame();
  initMemoryGame();
  initGameTabs();
  initAudioMatchGame();
  initTraceLetters();
  initGradeLessons();
  initPracticePage();
  initTracingPractice();
  initWeeklyAssignment();
});
const GRADE_LESSONS = {
  "g1l1": {
    content: [
    `In this lesson you'll learn to recognize and name Arabic letters by sight.`,
    `Look at each letter, say its name out loud, and notice its shape.`,
    `<span class='ar' style='font-size:1.3rem;'>ا &nbsp; ب &nbsp; ت &nbsp; ث</span> — Alif, Baa, Taa, Thaa`,
    `Arabic has 28 letters in total, and most connect to each other in slightly different shapes depending on whether they sit at the start, middle, or end of a word.`    ],
    practice: [
    { q: `أي حرف اسمه "باء"؟`, options: [`ب`, `ت`, `ث`, `ا`], answer: `ب` },
    { q: `أي حرف هو "أَلِف"؟`, options: [`ت`, `ث`, `ا`, `ب`], answer: `ا` }
    ]
  },
  "g1l2": {
    content: [
    `Short vowels (tashkeel) are small marks written above or below a letter.`,
    `<span class='ar' style='font-size:1.3rem;'>بَ = ba &nbsp;&nbsp; بِ = bi &nbsp;&nbsp; بُ = bu</span>`,
    `Fatḥa makes an "a" sound, kasra makes an "i" sound, ḍamma makes a "u" sound.`,
    `These marks are often left out in newspapers and everyday writing once you're a confident reader, but they're essential for beginners since the same letters can form completely different words depending on the vowels used.`    ],
    practice: [
    { q: `ما الحركة في الكلمة "بَ"؟`, options: [`فتحة`, `كسرة`, `ضمة`, `سكون`], answer: `فتحة` },
    { q: `أي حركة من هذه الحركات هي الضمة؟`, options: [`ضمة`, `فتحة`, `كسرة`, `سكون`], answer: `ضمة` }
    ]
  },
  "g2l1": {
    content: [
    `Blend 2–3 letters together to read simple, common words.`,
    `<span class='ar' style='font-size:1.3rem;'>بَيْت (house) &nbsp;&nbsp; قَلَم (pen)</span>`,
    `Notice how the letters connect into one flowing shape.`,
    `Most Arabic words are built from a three-letter root that carries the core meaning, with vowels and extra letters added around it to form related words.`    ],
    practice: [
    { q: `ماذا نسمي مكان السكن؟`, options: [`بَيْت`, `قَلَم`, `كِتَاب`, `بَاب`], answer: `بَيْت` },
    { q: `أي كلمة نستخدمها للكتابة؟`, options: [`قَلَم`, `بَيْت`, `مَاء`, `شَمْس`], answer: `قَلَم` }
    ]
  },
  "g2l2": {
    content: [
    `Read short sentences using the pattern "هَذَا" (this) + noun.`,
    `<span class='ar' style='font-size:1.3rem;'>هَذَا بَيْتِي</span> — This is my house.`,
    `Try matching short sentences like this to a picture in your head.`,
    `This pattern works for masculine nouns like بَيْت — for feminine nouns, careful learners will notice هَذِهِ (hādhihi) is used instead, as in هَذِهِ سَيَّارَتِي ('this is my car').`    ],
    practice: [
    { q: `من أي جزأين تتكوّن جملة "هَذَا بَيْتِي"؟`, options: [`اسم إشارة + اسم`, `فعل + فاعل`, `حرف جر + اسم`, `صفة + موصوف`], answer: `اسم إشارة + اسم` },
    { q: `أي كلمة تبدأ بها الجملة عند الإشارة إلى شيء قريب؟`, options: [`هَذَا`, `ذَهَبَ`, `فِي`, `كَبِير`], answer: `هَذَا` }
    ]
  },
  "g3l1": {
    content: [
    `Build vocabulary around family, home, and school.`,
    `<span class='ar' style='font-size:1.3rem;'>أَب (father) &nbsp; أُم (mother) &nbsp; مُعَلِّم (teacher)</span>`,
    `Learning vocabulary in themed groups like this — family, home, school — makes words easier to remember, since your brain links them together by context rather than as a random list.`    ],
    practice: [
    { q: `ما معنى كلمة "مُعَلِّم" في المدرسة؟`, options: [`الشخص الذي يُعلّم الطلاب`, `الشخص الذي يطبخ`, `الشخص الذي يقود السيارة`, `الشخص الذي يبني البيوت`], answer: `الشخص الذي يُعلّم الطلاب` },
    { q: `أي كلمة تدل على أحد أفراد العائلة؟`, options: [`أُم`, `مَدْرَسَة`, `كِتَاب`, `قَلَم`], answer: `أُم` }
    ]
  },
  "g3l2": {
    content: [
    `Arabic verbal sentences usually start with the verb, then the subject.`,
    `<span class='ar' style='font-size:1.3rem;'>يَذْهَبُ الوَلَدُ إِلَى المَدْرَسَةِ</span> — The boy goes to school.`,
    `You can also reverse the order to say الوَلَدُ يَذْهَبُ إِلَى المَدْرَسَةِ, which shifts the sentence into a nominal type and puts slightly more emphasis on who the subject is.`    ],
    practice: [
    { q: `في الجملة "يَذْهَبُ الوَلَدُ إِلَى المَدْرَسَةِ"، ما هو الفعل؟`, options: [`يَذْهَبُ`, `الوَلَدُ`, `المَدْرَسَةِ`, `إِلَى`], answer: `يَذْهَبُ` },
    { q: `أين يذهب الولد؟`, options: [`إلى المَدْرَسَةِ`, `إلى البَيْتِ`, `إلى السُّوقِ`, `إلى الحَدِيقَةِ`], answer: `إلى المَدْرَسَةِ` }
    ]
  },
  "g4l1": {
    content: [
    `Present-tense verbs change their prefix depending on the subject.`,
    `<span class='ar' style='font-size:1.3rem;'>أَكْتُبُ (I write) &nbsp; يَكْتُبُ (he writes) &nbsp; نَكْتُبُ (we write)</span>`,
    `Notice that تَكْتُبُ is used both for 'you (masculine) write' and 'she writes' — context is what tells them apart, since Arabic often relies on the surrounding sentence rather than the verb form alone.`    ],
    practice: [
    { q: `أي كلمة تعني "هو يكتب"؟`, options: [`يَكْتُبُ`, `أَكْتُبُ`, `نَكْتُبُ`, `تَكْتُبُ`], answer: `يَكْتُبُ` },
    { q: `أي كلمة تعني "نحن نكتب"؟`, options: [`نَكْتُبُ`, `يَكْتُبُ`, `أَكْتُبُ`, `تَكْتُبُ`], answer: `نَكْتُبُ` }
    ]
  },
  "g4l2": {
    content: [
    `Practice reading a short passage, then answer comprehension questions.`,
    `<span class='ar' style='font-size:1.2rem;'>أَنَا طَالِبٌ. أَدْرُسُ اللُّغَةَ العَرَبِيَّةَ.</span>`,
    `When reading a passage for the first time, it helps to scan for familiar words before worrying about every unfamiliar one — you can usually guess the general meaning from just a few anchors.`    ],
    practice: [
    { q: `ماذا يدرس الطالب في النص؟`, options: [`اللُّغَةَ العَرَبِيَّةَ`, `الرِّيَاضِيَّات`, `العُلُوم`, `التَّارِيخ`], answer: `اللُّغَةَ العَرَبِيَّةَ` },
    { q: `من المتحدث في هذا النص؟`, options: [`طَالِبٌ`, `مُعَلِّمٌ`, `طَبِيبٌ`, `مُهَنْدِسٌ`], answer: `طَالِبٌ` }
    ]
  },
  "g5l1": {
    content: [
    `Some plurals just add a suffix; others change shape entirely ("broken" plurals).`,
    `<span class='ar' style='font-size:1.3rem;'>كِتَاب → كُتُب &nbsp;&nbsp; مُعَلِّم → مُعَلِّمُون</span>`,
    `Broken plurals like مُعَلِّمُون don't follow one single rule, which is why learners often just memorize the plural form alongside the singular when learning a new noun.`    ],
    practice: [
    { q: `ما جمع كلمة "كِتَاب"؟`, options: [`كُتُب`, `كِتَابَات`, `كُتَّاب`, `كِتَابُون`], answer: `كُتُب` },
    { q: `ما جمع كلمة "مُعَلِّم"؟`, options: [`مُعَلِّمُون`, `مُعَلِّمَات فقط`, `مُعَلِّم`, `مُعَلِّمِين فقط`], answer: `مُعَلِّمُون` }
    ]
  },
  "g5l2": {
    content: [
    `Adjectives usually follow the noun and must agree in gender and number.`,
    `<span class='ar' style='font-size:1.3rem;'>بَيْتٌ كَبِيرٌ (big house) &nbsp; سَيَّارَةٌ كَبِيرَةٌ (big car)</span>`,
    `If a noun is definite (has الـ), its adjective must also take الـ — so 'the big house' is البَيْتُ الكَبِيرُ, not البَيْتُ كَبِيرٌ, which instead means 'the house is big.'`    ],
    practice: [
    { q: `أي صفة تصف "سَيَّارَة" بشكل صحيح؟`, options: [`كَبِيرَة`, `كَبِير`, `كَبِيرُون`, `كِبَار`], answer: `كَبِيرَة` },
    { q: `أين تأتي الصفة عادة في الجملة العربية؟`, options: [`بعد الاسم`, `قبل الاسم`, `في بداية الجملة`, `لا تُستخدم`], answer: `بعد الاسم` }
    ]
  },
  "g6l1": {
    content: [
    `Past-tense verbs take a suffix instead of a prefix.`,
    `<span class='ar' style='font-size:1.3rem;'>كَتَبَ (he wrote) &nbsp; كَتَبْتُ (I wrote) &nbsp; كَتَبْنَا (we wrote)</span>`,
    `Unlike English, Arabic past-tense verbs already show who's speaking through their ending, so you often don't need a separate pronoun at all — كَتَبْتُ alone means 'I wrote.'`    ],
    practice: [
    { q: `أي كلمة تعني "أنا كتبتُ"؟`, options: [`كَتَبْتُ`, `كَتَبَ`, `كَتَبْنَا`, `يَكْتُبُ`], answer: `كَتَبْتُ` },
    { q: `أي كلمة في زمن الماضي؟`, options: [`كَتَبَ`, `يَكْتُبُ`, `سَيَكْتُبُ`, `اكْتُبْ`], answer: `كَتَبَ` }
    ]
  },
  "g6l2": {
    content: [
    `Combine several sentences with و (and) to build a short paragraph about your day.`,
    `<span class='ar' style='font-size:1.2rem;'>ذَهَبْتُ إِلَى المَدْرَسَةِ وَدَرَسْتُ العَرَبِيَّةَ.</span>`,
    `Try varying your connecting words beyond just و ('and') — using ثُمَّ ('then') or بَعْدَ ذَلِكَ ('after that') makes a paragraph feel more like a real story with a sequence of events.`    ],
    practice: [
    { q: `ما معنى كلمة "وَ" في الجملة؟`, options: [`أداة ربط تعني "and"`, `فعل ماضٍ`, `اسم`, `حرف جر`], answer: `أداة ربط تعني "and"` },
    { q: `أي جملة تصف نشاطًا في الماضي؟`, options: [`ذَهَبْتُ إِلَى المَدْرَسَةِ`, `سَأَذْهَبُ غَدًا`, `أَذْهَبُ الآن`, `اذْهَبْ الآن`], answer: `ذَهَبْتُ إِلَى المَدْرَسَةِ` }
    ]
  },
  "g7l1": {
    content: [
    `Learn common prepositions and question words used every day.`,
    `<span class='ar' style='font-size:1.3rem;'>فِي، عَلَى، مِنْ، إِلَى &nbsp;—&nbsp; مَاذَا، مَتَى، أَيْنَ، كَيْفَ</span>`,
    `Question words like مَاذَا and أَيْنَ always come at the very start of the question in Arabic, just like in English, so listen for them first when someone is asking you something.`    ],
    practice: [
    { q: `أي كلمة نستخدمها للسؤال عن المكان؟`, options: [`أَيْنَ`, `مَتَى`, `مَاذَا`, `كَيْفَ`], answer: `أَيْنَ` },
    { q: `أي حرف جر يعني "in / at"؟`, options: [`فِي`, `إِلَى`, `مِنْ`, `عَلَى`], answer: `فِي` }
    ]
  },
  "g7l2": {
    content: [
    `Read a short story, then answer both literal and inferential questions.`,
    `Think not just about what happened, but why it happened.`,
    `A good habit is pausing after each paragraph to summarize what just happened in your own words — one of the fastest ways to build real reading comprehension in a new language.`    ],
    practice: [
    { q: `ما الفرق بين السؤال المباشر والسؤال الاستنتاجي؟`, options: [`المباشر إجابته موجودة في النص، والاستنتاجي يحتاج تفكيرًا`, `لا فرق بينهما`, `الاستنتاجي أسهل دائمًا`, `المباشر لا علاقة له بالنص`], answer: `المباشر إجابته موجودة في النص، والاستنتاجي يحتاج تفكيرًا` },
    { q: `عند قراءة قصة، ماذا نسمي شخصياتها الرئيسية؟`, options: [`الأبطال`, `العناوين`, `الحواشي`, `الفهرس`], answer: `الأبطال` }
    ]
  },
  "g8l1": {
    content: [
    `Combine ideas using و (and), لكن (but), and لأن (because).`,
    `<span class='ar' style='font-size:1.2rem;'>أُحِبُّ القِرَاءَةَ لَكِنَّنِي أُحِبُّ الرِّيَاضَةَ أَيْضًا.</span>`,
    `Words like لَكِنَّ and إِنَّ attach directly to the noun that follows and slightly change its ending — a preview of the deeper grammar you'll see in later grades.`    ],
    practice: [
    { q: `أي أداة نستخدمها للتعبير عن السبب؟`, options: [`لِأَنَّ`, `لَكِنَّ`, `وَ`, `أَوْ`], answer: `لِأَنَّ` },
    { q: `أي أداة تدل على التناقض بين فكرتين؟`, options: [`لَكِنَّ`, `وَ`, `لِأَنَّ`, `ثُمَّ`], answer: `لَكِنَّ` }
    ]
  },
  "g8l2": {
    content: [
    `A personal letter needs a greeting, a body, and a closing.`,
    `<span class='ar' style='font-size:1.2rem;'>عَزِيزِي صَدِيقِي، ... مَعَ تَحِيَّاتِي</span>`,
    `Formal letters in Arabic often use more elaborate greetings than English does — phrases like أَطَالَ اللهُ عُمْرَكَ ('may God lengthen your life') are common in very formal or older-style writing.`    ],
    practice: [
    { q: `بماذا نبدأ الرسالة الشخصية عادة؟`, options: [`بتحية مثل "عَزِيزِي"`, `بالتوقيع`, `بالتاريخ فقط`, `بجملة ختامية`], answer: `بتحية مثل "عَزِيزِي"` },
    { q: `ماذا نكتب في نهاية الرسالة؟`, options: [`عبارة ختامية مثل "مَعَ تَحِيَّاتِي"`, `المقدمة`, `عنوان الرسالة`, `لا شيء`], answer: `عبارة ختامية مثل "مَعَ تَحِيَّاتِي"` }
    ]
  },
  "g9l1": {
    content: [
    `The ending of a word can change based on its grammatical role.`,
    `<span class='ar' style='font-size:1.3rem;'>الطَّالِبُ (subject) &nbsp; الطَّالِبَ (object)</span>`,
    `There are three main cases in Arabic: مرفوع (nominative, for subjects), منصوب (accusative, for objects), and مجرور (genitive, after prepositions or in possession) — each with its own short vowel ending.`    ],
    practice: [
    { q: `ماذا نسمي دراسة أواخر الكلمات وتغيرها حسب موقعها في الجملة؟`, options: [`الإِعْرَاب`, `الصَّرْف`, `البَلَاغَة`, `العَرُوض`], answer: `الإِعْرَاب` },
    { q: `في الجملة الاسمية، ما هو المرفوع عادة؟`, options: [`المُبْتَدَأ`, `المَفْعُول بِه`, `الحَال`, `التَّمْيِيز`], answer: `المُبْتَدَأ` }
    ]
  },
  "g9l2": {
    content: [
    `Read short excerpts from modern Arabic literature and discuss theme and tone.`,
    `Consider: what mood does the writer create, and how?`,
    `Modern Arabic literature often blends Modern Standard Arabic with touches of dialect in dialogue, so don't be surprised if a character's spoken lines look slightly different from the narration around them.`    ],
    practice: [
    { q: `ماذا نسمي الفكرة الرئيسية التي يعالجها نص أدبي؟`, options: [`المَوْضُوع أو الفِكْرَة`, `القَافِيَة`, `الوَزْن`, `العُنْوَان فقط`], answer: `المَوْضُوع أو الفِكْرَة` },
    { q: `ماذا نسمي الشعور العام الذي يتركه النص لدى القارئ؟`, options: [`النَّبْرَة أو الجَوّ العَام`, `الإِعْرَاب`, `الجَمْع`, `حَرْف الجَرّ`], answer: `النَّبْرَة أو الجَوّ العَام` }
    ]
  },
  "g10l1": {
    content: [
    `Classical Arabic poetry (الشعر) uses rhythm (وزن) and rhyme (قافية).`,
    `Read a short verse aloud and notice its repeating rhythm.`,
    `Classical Arabic poetry was traditionally composed and performed orally long before it was written down, which is part of why rhythm and sound carry so much weight in how a poem is judged.`    ],
    practice: [
    { q: `ماذا نسمي النظام الإيقاعي المتكرر في البيت الشعري؟`, options: [`الوَزْن`, `القَافِيَة`, `البَحْر فقط`, `النَّثْر`], answer: `الوَزْن` },
    { q: `ماذا نسمي تكرار الصوت في نهاية كل بيت شعري؟`, options: [`القَافِيَة`, `الوَزْن`, `الاستِعَارَة`, `التَّشْبِيه`], answer: `القَافِيَة` }
    ]
  },
  "g10l2": {
    content: [
    `Arabic verbs follow patterns (أوزان) built from a three-letter root.`,
    `<span class='ar' style='font-size:1.3rem;'>كَتَبَ → كَاتَبَ → اكْتَتَبَ</span> — the root ك ت ب shifts meaning with each pattern.`,
    `Each of the ten verb patterns (أوزان) tends to carry its own general 'flavor' of meaning — for example, Form II often makes a verb causative, turning 'to know' into 'to teach.'`    ],
    practice: [
    { q: `كم عدد الحروف الأساسية في معظم الجذور العربية؟`, options: [`ثَلَاثَة`, `اثْنَان`, `أَرْبَعَة`, `خَمْسَة`], answer: `ثَلَاثَة` },
    { q: `ماذا نسمي الأنماط المختلفة التي يأخذها الفعل من جذر واحد؟`, options: [`الأَوْزَان`, `القَوَافِي`, `الحُرُوف`, `الأَسْمَاء`], answer: `الأَوْزَان` }
    ]
  },
  "g11l1": {
    content: [
    `Journalistic Arabic uses a more formal register than everyday speech.`,
    `Notice longer sentences and precise vocabulary in news writing.`,
    `News Arabic tends to favor passive constructions and longer noun phrases compared to everyday speech, which is part of why it can feel denser to read at first.`    ],
    practice: [
    { q: `أي أسلوب يغلب على اللغة الإخبارية؟`, options: [`أسلوب رَسْمِيّ ودقيق`, `أسلوب عَامِّيّ وغَيْر رَسْمِيّ`, `أسلوب شِعْرِيّ فقط`, `لا يوجد أسلوب مُحَدَّد`], answer: `أسلوب رَسْمِيّ ودقيق` },
    { q: `أين نتوقع أن نجد اللغة الإعلامية الرسمية؟`, options: [`في الأَخْبَار والصُّحُف`, `في المحادثات اليومية فقط`, `في الأغاني فقط`, `لا تُستخدم أبدًا`], answer: `في الأَخْبَار والصُّحُف` }
    ]
  },
  "g11l2": {
    content: [
    `A structured essay has an introduction, body paragraphs, and a conclusion.`,
    `Each body paragraph should support one clear idea with evidence or examples.`,
    `Strong Arabic essays often open with a general statement before narrowing to the specific argument — a 'funnel' structure similar to many English essay traditions.`    ],
    practice: [
    { q: `ما هي أجزاء المقال الأساسية؟`, options: [`مقدمة، عرض، خاتمة`, `عنوان فقط`, `أسئلة فقط`, `قافية ووزن`], answer: `مقدمة، عرض، خاتمة` },
    { q: `ماذا يجب أن تحتوي كل فقرة في عرض المقال؟`, options: [`فكرة واحدة واضحة مدعومة بأمثلة`, `عدة أفكار غير مترابطة`, `لا شيء محدد`, `فقط أسئلة`], answer: `فكرة واحدة واضحة مدعومة بأمثلة` }
    ]
  },
  "g12l1": {
    content: [
    `Rhetoric (البلاغة) studies how language creates beauty and persuasion — through simile, metaphor, and more.`,
    `<span class='ar' style='font-size:1.2rem;'>هُوَ كَالأَسَدِ فِي الشَّجَاعَةِ</span> — a simile (تَشْبِيه) comparing courage to a lion.`,
    `Beyond simile (تَشْبِيه) and metaphor (اسْتِعَارَة), classical rhetoric also studies كِنَايَة — a kind of implication, saying one thing to mean another — all still used in modern Arabic writing and speech.`    ],
    practice: [
    { q: `ماذا نسمي علم دراسة جمال اللغة وأساليب التعبير؟`, options: [`البَلَاغَة`, `النَّحْو`, `الصَّرْف`, `العَرُوض`], answer: `البَلَاغَة` },
    { q: `ماذا نسمي تشبيه شيء بشيء آخر باستخدام أداة تشبيه مثل "كَـ"؟`, options: [`التَّشْبِيه`, `الاسْتِعَارَة`, `الكِنَايَة`, `الجِنَاس`], answer: `التَّشْبِيه` }
    ]
  },
  "g12l2": {
    content: [
    `Research a topic of your choice in Arabic, then prepare a short paper or presentation.`,
    `This is your chance to bring together everything you've learned — vocabulary, grammar, and writing style.`,
    `Choosing a topic you're genuinely curious about — Arabic music, calligraphy, or a historical event — will make the research and writing process far more enjoyable than picking something just because it seems easy.`    ],
    practice: [
    { q: `ما الهدف الرئيسي من مشروع التخرج؟`, options: [`تطبيق كل المهارات اللغوية المكتسبة في مشروع واحد`, `حفظ قائمة كلمات فقط`, `الإجابة عن سؤال واحد فقط`, `لا يوجد هدف محدد`], answer: `تطبيق كل المهارات اللغوية المكتسبة في مشروع واحد` },
    { q: `أي مهارة على الأرجح ستحتاجها لعرض مشروعك؟`, options: [`مهارة التحدث والعرض أمام الآخرين`, `الرسم فقط`, `الطبخ`, `السباحة`], answer: `مهارة التحدث والعرض أمام الآخرين` }
    ]
  },
};

function initGradeLessons() {
  document.querySelectorAll('.grade-lesson').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const panel = document.getElementById('content-' + key);
      if (!panel) return;

      const isOpen = panel.classList.contains('open');
      if (isOpen) {
        panel.classList.remove('open');
        btn.classList.remove('active');
        return;
      }

      if (!panel.dataset.rendered) {
        const data = GRADE_LESSONS[key];
        if (!data) return;
        let html = '<div class="lesson-explain">';
        data.content.forEach(p => { html += `<p>${p}</p>`; });
        html += '</div><div class="lesson-practice"><h5>Practice <span class="ar">تدريب</span></h5>';
        html += '</div>';
        panel.innerHTML = html;

        const practiceWrap = panel.querySelector('.lesson-practice');
        data.practice.forEach(item => {
          const qBlock = document.createElement('div');
          qBlock.className = 'lesson-question';
          qBlock.innerHTML = `<p class="ar lq-text">${item.q}</p><div class="quiz-options"></div>`;
          const optWrap = qBlock.querySelector('.quiz-options');
          const shuffled = [...item.options].sort(() => Math.random() - 0.5);
          shuffled.forEach(opt => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'quiz-option';
            b.textContent = opt;
            b.addEventListener('click', () => {
              qBlock.querySelectorAll('.quiz-option').forEach(o => o.disabled = true);
              if (opt === item.answer) {
                b.classList.add('correct');
              } else {
                b.classList.add('wrong');
                [...optWrap.children].find(o => o.textContent === item.answer)?.classList.add('correct');
              }
            });
            optWrap.appendChild(b);
          });
          practiceWrap.appendChild(qBlock);
        });

        panel.dataset.rendered = '1';
      }

      panel.classList.add('open');
      btn.classList.add('active');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

