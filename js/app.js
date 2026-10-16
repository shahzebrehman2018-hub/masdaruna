/* مصادر — Masdar Dictionary App */
'use strict';
let PS = [], FA = [], LD = [];
function initCommunity() { try { communityWords = COMMUNITY_DATA || []; } catch (e) { communityWords = []; } }
let dictFilter = 'all', letterDict = 'ps', activeLetter = null;
let myWords = [], grammarNotes = [], communityWords = [];
function visibleMyWords() {
  const base = new Set();
  PS.forEach(e => base.add(norm(e[2])));
  FA.forEach(e => base.add(norm(e[1])));
  communityWords.forEach(w => base.add(norm(w.word)));
  return myWords.filter(w => !base.has(norm(w.word)));
}
/* ---------- export / import my data ---------- */
function buildMyExportText() {
  const data = {
    app: 'د پښتو مصدرونه', v: 1,
    date: new Date().toISOString().slice(0, 10),
    words: myWords, conj: getCustomConj(), notes: grammarNotes,
    entryfix: getEntryFix(), grammarfix: getGrammarFix(),
    mysent: getMySentences(), sentfix: getSentFixes(),
    dictedits: dictEdits, dicttexts: dictTexts, dictalpha: localStorage.getItem('masdar_dict_alpha') || ''
  };
  return JSON.stringify(data, null, 2);
}
/* Online export: copy the export and open the website (GitHub) submit page
   with the data pre-filled, so the user's words reach the project online. */
function exportOnline() {
  const text = buildMyExportText();
  const openSite = () => {
    const title = encodeURIComponent('Masdaruna — میرا ڈیٹا ایکسپورٹ');
    let url = 'https://github.com/shahzebrehman2018-hub/masdaruna/issues/new?title=' + title;
    const body = 'میرا Masdaruna ڈیٹا (الفاظ / گردانیں / تصحیحات):\n\n' + text;
    if (encodeURIComponent(body).length <= 6500) url += '&body=' + encodeURIComponent(body);
    else url += '&body=' + encodeURIComponent('ڈیٹا لمبا تھا، اس لیے کلپ بورڈ میں کاپی کر دیا گیا ہے — براہ کرم یہاں پیسٹ کر دیں۔');
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    toast('🌐 ویب سائٹ کھل رہی ہے — وہاں «Submit» دبا دیں');
  };
  if (window.MasdarBridge && MasdarBridge.copyText) { MasdarBridge.copyText(text); setTimeout(openSite, 300); }
  else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(openSite).catch(openSite); }
  else openSite();
}
window.exportOnline = exportOnline;

/* ---------- 🧩 JSON بنائیں (update-file maker) ---------- */
function jmBuild() {
  const type = $('jmType').value;
  const lines = $('jmInput').value.split('\n').map(x => x.trim()).filter(Boolean);
  let obj = null;
  if (type === 'sentences') {
    const arr = lines.map(l => { const p = l.split('@').map(x => x.trim()); return { ps: p[0] || '', ur: p[1] || '', en: p[2] || '', fa: p[3] || '' }; }).filter(s => s.ps);
    obj = { sentences: arr }; window._jmName = 'sentences.json';
  } else {
    const arr = lines.map(l => { const p = l.split('@').map(x => x.trim()); return { w: p[0] || '', r: p[1] || '', en: p[2] || '', ur: p[3] || '', fa: p[4] || '' }; }).filter(s => s.w);
    obj = { masdars: arr }; window._jmName = 'masdars.json';
  }
  $('jmOutput').value = JSON.stringify(obj, null, 1);
  toast('🧩 JSON تیار ہو گیا');
}
function jmCopy() {
  const t = $('jmOutput').value; if (!t) { toast('پہلے JSON بنائیں'); return; }
  if (window.MasdarBridge && MasdarBridge.copyText) MasdarBridge.copyText(t);
  else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(() => {});
  toast('📋 کاپی ہو گیا');
}
function jmSave() {
  const t = $('jmOutput').value; if (!t) { toast('پہلے JSON بنائیں'); return; }
  const name = window._jmName || 'update.json';
  if (window.MasdarBridge && MasdarBridge.saveFile) { MasdarBridge.saveFile(name, t); return; }
  const blob = new Blob([t], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
function initJsonMaker() {
  if (!$('jmBuildBtn')) return;
  $('jmBuildBtn').onclick = jmBuild;
  $('jmCopyBtn').onclick = jmCopy;
  $('jmSaveBtn').onclick = jmSave;
  $('jmApplyBtn').onclick = () => { const t = $('jmOutput').value.trim(); if (!t) { toast('پہلے JSON بنائیں'); return; } if (window.MasdarUpdateFile) window.MasdarUpdateFile(t); };
  const sel = $('jmType');
  if (sel) sel.onchange = () => { $('jmHint').textContent = sel.value === 'sentences' ? 'ہر سطر: پشتو جملہ @ اردو ترجمہ @ English @ فارسی (آخری دو اختیاری ہیں)' : 'ہر سطر: مصدر @ رومن @ English @ اردو @ فارسی (مصدر ضروری، باقی اختیاری)'; };
}
window.initJsonMaker = initJsonMaker;

/* ---------- 📊 تعداد و شمار (counts by language) ---------- */
function renderStats() {
  const box = $('statsBody'); if (!box) return;
  const comm = (typeof COMMUNITY_DATA !== 'undefined' && Array.isArray(COMMUNITY_DATA)) ? COMMUNITY_DATA : [];
  const commBy = l => comm.filter(w => w.lang === l).length;
  const sents = getSentences();
  const row = (label, n) => `<div class="kv"><b>${label}</b><span><strong>${Number(n).toLocaleString('ur')}</strong></span></div>`;
  box.innerHTML =
    `<div class="card"><h4 style="margin:0 0 6px">📚 الفاظ — زبان کے حساب سے</h4>`
    + row('پشتو مصادر', PS.length)
    + row('فارسی مصادر', FA.length)
    + row('پشتو لغت کے الفاظ', LD.length)
    + row('شامل کردہ الفاظ — پشتو', commBy('ps'))
    + row('شامل کردہ الفاظ — فارسی', commBy('fa'))
    + row('شامل کردہ الفاظ — اردو', commBy('ur'))
    + row('میرے الفاظ (اس فون میں)', myWords.length)
    + `</div><div class="card" style="margin-top:10px"><h4 style="margin:0 0 6px">📜 جملے — ترجمے کے حساب سے</h4>`
    + row('کل جملے', sents.length)
    + row('اردو ترجمے والے', sents.filter(s => s.ur).length)
    + row('فارسی ترجمے والے', sents.filter(s => s.fa).length)
    + row('انگریزی ترجمے والے', sents.filter(s => s.en).length)
    + `</div><div class="card" style="margin-top:10px"><h4 style="margin:0 0 6px">📖 گرامر</h4>`
    + row('گردانیں والے افعال', getGardananVerbs().length)
    + row('صورتیں والے الفاظ', Object.keys(getFormsMap()).length)
    + `<div class="kv"><b>گرامر موضوعات (پشتو / فارسی)</b><span><strong>${getGrammarTopics('ps').length} / ${getGrammarTopics('fa').length}</strong></span></div>`
    + (typeof getPsPsEntries === 'function' ? row('Urdu to Pashto لغت کے الفاظ', getPsPsEntries().length) : '')
    + `</div>`;
}
window.renderStats = renderStats;

/* ---------- 🌐 گوگل ترجمہ ----------
   Google Translate forbids framing (X-Frame-Options: SAMEORIGIN), so the
   app opens it in the browser with the text and languages pre-filled. */
function gtOpenUrl() {
  const f = ($('gtFrom') || {}).value || 'ps';
  const t = ($('gtTo') || {}).value || 'ur';
  const x = (($('gtText') || {}).value || '').trim();
  return 'https://translate.google.com/?sl=' + f + '&tl=' + t + (x ? '&text=' + encodeURIComponent(x) : '') + '&op=translate';
}
function gtOpen() {
  const a = document.createElement('a');
  a.href = gtOpenUrl(); a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}
function initGTranslate() {
  const b = $('gtOpenBtn'); if (!b) return;
  b.onclick = gtOpen;
  const sw = $('gtSwapBtn');
  if (sw) sw.onclick = () => { const f = $('gtFrom'), t = $('gtTo'); const v = f.value; f.value = t.value; t.value = v; };
  const cb = $('gtCopyBtn');
  if (cb) cb.onclick = () => {
    const x = ($('gtText') || {}).value || '';
    if (window.MasdarBridge && MasdarBridge.copyText) MasdarBridge.copyText(x);
    else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(x).catch(() => {});
    toast('📋 متن کاپی ہو گیا');
  };
}
window.initGTranslate = initGTranslate;
window.gtOpenUrl = gtOpenUrl;
function exportMyData() {
  const text = buildMyExportText();
  if (window.MasdarBridge && MasdarBridge.saveFile) { MasdarBridge.saveFile('masdar-my-data.json', text); return; }
  const blob = new Blob([text], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'masdar-my-data.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
/* Merge one masdar-my-data object (export format) into local storage. Returns count of merged items. */
function mergeMyDataObject(d) {
  let n = 0;
  if (Array.isArray(d.words)) {
    const have = new Set(myWords.map(w => w.id));
    d.words.forEach(w => { if (w && w.word && !have.has(w.id)) { myWords.push(w); have.add(w.id); n++; } });
  }
  if (d.conj && typeof d.conj === 'object') {
    const cur = getCustomConj();
    Object.keys(d.conj).forEach(k => { cur[k] = d.conj[k]; n++; });
    saveCustomConj(cur);
  }
  if (Array.isArray(d.notes)) {
    const have = new Set(grammarNotes.map(g => g.t + '|' + g.b));
    d.notes.forEach(g => { if (g && g.t && !have.has(g.t + '|' + g.b)) { grammarNotes.push(g); n++; } });
  }
  if (d.entryfix && typeof d.entryfix === 'object') {
    const cur = getEntryFix();
    Object.keys(d.entryfix).forEach(k => { cur[k] = d.entryfix[k]; n++; });
    saveEntryFix(cur); applyAllEntryFixes();
  }
  if (d.grammarfix && typeof d.grammarfix === 'object') {
    const cur = getGrammarFix();
    Object.keys(d.grammarfix).forEach(k => { cur[k] = d.grammarfix[k]; n++; });
    saveGrammarFix(cur);
  }
  if (Array.isArray(d.mysent)) {
    const cur = getMySentences(); const have = new Set(cur.map(s => norm(s.ps)));
    d.mysent.forEach(s => { if (s && s.ps && !have.has(norm(s.ps))) { cur.push(s); have.add(norm(s.ps)); n++; } });
    saveMySentences(cur);
  }
  if (d.sentfix && typeof d.sentfix === 'object') {
    const cur = getSentFixes();
    Object.keys(d.sentfix).forEach(k => { cur[k] = d.sentfix[k]; n++; });
    saveSentFixes(cur);
  }
  if (typeof renderSentences === 'function' && $('sentResults')) renderSentences(($('sentSearchInput') || {}).value || '');
  if (d.dictedits && typeof d.dictedits === 'object') { dictEdits = d.dictedits; saveDictEdits(); n++; }
  if (d.dicttexts && typeof d.dicttexts === 'object') { dictTexts = d.dicttexts; localStorage.setItem('masdar_dict_texts', JSON.stringify(dictTexts)); applyDictTexts(); n++; }
  if (typeof d.dictalpha === 'string' && d.dictalpha) { localStorage.setItem('masdar_dict_alpha', d.dictalpha); buildDictLetters(); }
  saveStore(); renderMyWords(); renderGrammar();
  return n;
}
function importMyData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || typeof d !== 'object') throw 0;
      const n = mergeMyDataObject(d);
      alert(n ? n + ' چیزیں شامل ہو گئیں! ✅' : 'نئی کوئی چیز نہیں ملی');
    } catch (e) { alert('فائل درست نہیں ہے ❌'); }
  };
  r.readAsText(file);
}
window.exportMyData = exportMyData;
let spellCurrent = null, sentCurrent = null;

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const norm = s => (s || '').replace(/[\u064B-\u0652\u0670]/g, '').replace(/آ/g, 'ا').replace(/ك/g, 'ک').replace(/ي/g, 'ی').replace(/ة/g, 'ه').trim();
const latin = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ə/g, 'e').replace(/ʃ/g, 'sh').replace(/ʒ/g, 'zh').trim();
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function lev(a, b) {
  a = norm(a); b = norm(b);
  if (!a || !b) return 99;
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[m][n];
}

/* ---------- init ---------- */
function hideSplash(){ try { $('splash').classList.add('hide'); } catch(e){} }
document.addEventListener('DOMContentLoaded', async () => {
  /* each init runs behind its own guard: a throw in one must not stop the
     later ones (e.g. initUpdate) from binding their handlers */
  const safeInit = (name, fn) => {
    try { fn(); } catch (e) { try { console.warn('init failed:', name, e); } catch (e2) {} }
  };
  safeInit('theme', initTheme); safeInit('nav', initNav); safeInit('search', initSearch);
  safeInit('dict', initDict); safeInit('letters', initLetters); safeInit('update', initUpdate);
  safeInit('mywords', initMyWords); safeInit('practice', initPractice); safeInit('grammar', initGrammar);
  safeInit('share', initShare); safeInit('intro', initIntro); safeInit('gardanan', initGardanan);
  safeInit('sentences', initSentences);
  safeInit('jsonmaker', initJsonMaker); safeInit('gtranslate', initGTranslate);
  safeInit('qamosona', initQamosonaHome);
  safeInit('clockdates', initClockDates);
  safeInit('applink', () => { if (window.MasdarBridge) { const dc = $('apkDlCard'); if (dc) dc.hidden = true; const dl = $('dlDrawerLink'); if (dl) dl.hidden = true; } });
  try {
    if (typeof PS_DATA !== 'undefined' && typeof FA_DATA !== 'undefined') {
      PS = PS_DATA; FA = FA_DATA;
      if (typeof LD_DATA !== 'undefined') LD = LD_DATA;
      mergeMasdarPack();
      applyAllEntryFixes();
    } else {
      const [ps, fa] = await Promise.all([
        fetch('data/pashto.json').then(r => r.json()),
        fetch('data/persian.json').then(r => r.json())
      ]);
      PS = ps; FA = fa;
      try { LD = await fetch('data/lingdocs.json').then(r => r.json()); } catch (e2) {}
      mergeMasdarPack();
      applyAllEntryFixes();
    }
    $('statPs').textContent = PS.length.toLocaleString('ur');
    $('statFa').textContent = FA.length.toLocaleString('ur');
    try { $('statLd').textContent = LD.length.toLocaleString('ur'); } catch (e) {}
    loadStore(); initCommunity(); renderMyWords(); renderGrammar(); buildLetterGrid(); buildDictLetters(); newSpellWord(); newSentPrompt(); showRandom();
  } catch (e) {
    $('searchResults').innerHTML = '<div class="empty">ڈیٹا لوڈ نہیں ہو سکا۔ ایپ دوبارہ کھولیں۔</div>';
  }
  setTimeout(hideSplash, 600);
  setTimeout(hideSplash, 2500);
  try { if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
});
window.addEventListener('error', hideSplash);


/* ---------- app update checker ---------- */
const APP_VERSION_CODE = 41;
const APP_LINK = 'https://shahzebrehman2018-hub.github.io/masdaruna';
/* Public website address of this app (e.g. GitHub Pages). This is the SINGLE
   place to patch when the public site address exists: set SITE_URL (and
   APP_LINK for the share sheet) and the online-update button uses it
   automatically instead of the manually typed server address. */
const SITE_URL = 'https://shahzebrehman2018-hub.github.io/masdaruna';
function updBase(inp) {
  if (SITE_URL) return SITE_URL.replace(/\/$/, '');
  const manual = ((inp && inp.value) || '').trim() || localStorage.getItem('masdar_upd_server') || '';
  return manual.trim().replace(/\/$/, '');
}
/* fetch with a hard timeout (~12s): a hung network must never leave the
   update UI stuck on «چیک ہو رہا ہے…» forever. */
async function fetchTimeout(url, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms || 12000);
  try { return await fetch(url, { cache: 'no-store', signal: ctl.signal }); }
  finally { clearTimeout(t); }
}
function initUpdate() {
  const btn = $('updCheck'), inp = $('updServer'), res = $('updResult');
  if (!btn) return;
  inp.value = localStorage.getItem('masdar_upd_server') || '';
  if (APP_LINK) { const sl = $('siteLine'), sa = $('siteLink'); if (sl && sa) { sl.style.display = ''; sa.href = APP_LINK; sa.textContent = APP_LINK; } }
  btn.onclick = async () => {
    if (inp.value.trim()) localStorage.setItem('masdar_upd_server', inp.value.trim());
    const base = updBase(inp);
    if (!base) { res.innerHTML = '<p class="bad">پہلے اپنی ویب سائٹ کا پتہ لکھیں۔</p>'; return; }
    /* unmissable feedback: the button itself shows progress and locks */
    const btnLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'چیک ہو رہا ہے…';
    res.innerHTML = '<p class="hint">چیک ہو رہا ہے…</p>';
    const msgs = [];
    let outcome = 'سرور سے رابطہ نہیں ہوا';
    try {
      /* (a) app version check */
      try {
        const r = await fetchTimeout(base + '/version.json');
        if (!r.ok) throw 0;
        const v = await r.json();
        if (v.versionCode > APP_VERSION_CODE) {
          let apk = v.apkUrl || 'masdar.apk';
          if (!/^https?:/.test(apk)) apk = base + '/' + apk.replace(/^\//, '');
          msgs.push(`<p class="good">🎉 نیا ورژن دستیاب ہے: ${esc(v.versionName)}</p><p>${esc(v.notes || '')}</p><a href="${esc(apk)}" data-updlink class="btn-primary" style="display:block;text-align:center;text-decoration:none">⬇️ نئی ایپ ڈاؤن لوڈ کریں</a>`);
          outcome = '🎉 نیا ورژن دستیاب ہے: ' + (v.versionName || '');
        } else {
          msgs.push('<p class="good">✅ آپ کے پاس تازہ ترین ورژن ہے</p>');
          outcome = '✅ آپ کے پاس تازہ ترین ورژن ہے';
        }
      } catch (e) {
        msgs.push('<p class="bad">ورژن چیک نہیں ہو سکا — سرور سے رابطہ نہیں ہوا۔ پتہ درست لکھیں (مثلاً https://example.com)</p>');
      }
      /* (b) gardanan (conjugation) content check */
      try {
        const r2 = await fetchTimeout(base + '/gardanan.json');
        if (r2.ok) {
          const g = await r2.json();
          const cur = Number(localStorage.getItem('masdar_gardanan_rev') || 0);
          if (g && typeof g.rev === 'number' && g.rev > cur && Array.isArray(g.verbs)) {
            localStorage.setItem('masdar_gardanan_data', JSON.stringify(g));
            localStorage.setItem('masdar_gardanan_rev', String(g.rev));
            _resetKindCache();
            if (typeof renderGardanan === 'function') renderGardanan();
            msgs.push('<p class="good">✅ نئی گردانیں شامل ہو گئیں</p>');
          }
        }
      } catch (e) { /* a missing gardanan.json on the server is not an error */ }
      /* (c) sentences content check */
      try {
        const r3 = await fetchTimeout(base + '/sentences.json');
        if (r3.ok) {
          const sj = await r3.json();
          const curS = Number(localStorage.getItem('masdar_sentences_rev') || 0);
          if (sj && typeof sj.rev === 'number' && sj.rev > curS && Array.isArray(sj.sentences)) {
            localStorage.setItem('masdar_sentences_data', JSON.stringify(sj));
            localStorage.setItem('masdar_sentences_rev', String(sj.rev));
            if (typeof renderSentences === 'function') renderSentences(($('sentSearchInput') || {}).value || '');
            msgs.push('<p class="good">✅ نئے جملے شامل ہو گئے</p>');
          }
        }
      } catch (e) { /* a missing sentences.json on the server is not an error */ }
      /* (d) new masdars content check */
      try {
        const r4 = await fetchTimeout(base + '/masdars.json');
        if (r4.ok) {
          const mj = await r4.json();
          const curM = Number(localStorage.getItem('masdar_masdars_rev') || 0);
          if (mj && typeof mj.rev === 'number' && mj.rev > curM && Array.isArray(mj.entries)) {
            localStorage.setItem('masdar_masdars_data', JSON.stringify(mj));
            localStorage.setItem('masdar_masdars_rev', String(mj.rev));
            mergeMasdarPack();
            try { $('statPs').textContent = PS.length.toLocaleString('ur'); } catch (e2) {}
            msgs.push('<p class="good">✅ نئے مصادر شامل ہو گئے</p>');
          }
        }
      } catch (e) { /* a missing masdars.json on the server is not an error */ }
      /* (e) word-forms content check */
      try {
        const r5 = await fetchTimeout(base + '/forms.json');
        if (r5.ok) {
          const fj = await r5.json();
          const curF = Number(localStorage.getItem('masdar_forms_rev') || 0);
          if (fj && typeof fj.rev === 'number' && fj.rev > curF && fj.words && typeof fj.words === 'object') {
            localStorage.setItem('masdar_forms_data', JSON.stringify(fj));
            localStorage.setItem('masdar_forms_rev', String(fj.rev));
            _resetKindCache();
            msgs.push('<p class="good">✅ الفاظ کی نئی صورتیں شامل ہو گئیں</p>');
          }
        }
      } catch (e) { /* a missing forms.json on the server is not an error */ }
      /* (f) Pashto-to-Pashto definitions content check */
      try {
        const r6 = await fetchTimeout(base + '/psps.json');
        if (r6.ok) {
          const pj = await r6.json();
          const curP = Number(localStorage.getItem('masdar_psps_rev') || 0);
          if (pj && typeof pj.rev === 'number' && pj.rev > curP && Array.isArray(pj.entries)) {
            localStorage.setItem('masdar_psps_data', JSON.stringify(pj));
            localStorage.setItem('masdar_psps_rev', String(pj.rev));
            if (typeof renderPsPs === 'function') renderPsPs();
            msgs.push('<p class="good">✅ پشتو-پشتو تشریحات شامل ہو گئیں</p>');
          }
        }
      } catch (e) { /* a missing psps.json on the server is not an error */ }
      /* (g) grammar topics content check */
      try {
        const r7 = await fetchTimeout(base + '/grammar.json');
        if (r7.ok) {
          const gj = await r7.json();
          const curG = Number(localStorage.getItem('masdar_grammar_rev') || 0);
          if (gj && typeof gj.rev === 'number' && gj.rev > curG && (Array.isArray(gj.ps) || Array.isArray(gj.fa))) {
            localStorage.setItem('masdar_grammar_data', JSON.stringify(gj));
            localStorage.setItem('masdar_grammar_rev', String(gj.rev));
            if (typeof renderGrammarTopics === 'function') renderGrammarTopics();
            msgs.push('<p class="good">✅ گرامر کے نئے موضوعات شامل ہو گئے</p>');
          }
        }
      } catch (e) { /* a missing grammar.json on the server is not an error */ }
    } finally {
      res.innerHTML = msgs.join('') || '<p class="bad">سرور سے رابطہ نہیں ہو سکا۔ پتہ درست لکھیں (مثلاً https://example.com)</p>';
      /* in the app, the download link goes through the one-tap installer */
      const dl = res.querySelector('[data-updlink]');
      if (dl) dl.addEventListener('click', e => {
        if (window.MasdarBridge && MasdarBridge.updateApp) {
          e.preventDefault();
          MasdarBridge.updateApp(dl.href);
        }
      });
      btn.disabled = false;
      btn.textContent = btnLabel;
    }
    /* the result sits low in a long card — bring it into view + announce it */
    try { res.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    toast(outcome);
  };
  /* (c) update from a file — native picker in the app, hidden input on the web */
  const fbtn = $('updFileBtn'), fb = $('updFile');
  if (fbtn) fbtn.onclick = () => {
    if (window.MasdarBridge && MasdarBridge.openUpdateFile) { MasdarBridge.openUpdateFile(); return; }
    if (fb) fb.click();
    else toast('فائل منتخب نہیں ہو سکی ❌');
  };
  if (fb) fb.onchange = e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (/\.apk$/i.test(f.name)) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(f); a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast('ایپ فائل ڈاؤن لوڈ ہو گئی — اسے کھول کر انسٹال کریں');
      return;
    }
    const r = new FileReader();
    r.onload = () => window.MasdarUpdateFile(String(r.result || ''));
    r.onerror = () => toast('فائل پڑھی نہیں جا سکی ❌');
    r.readAsText(f);
  };
  /* (d) update by pasting the file contents (e.g. copied from a message) */
  const pbtn = $('updPasteBtn'), pbox = $('updPaste'), cbtn = $('updClipBtn');
  if (pbtn && pbox) pbtn.onclick = () => {
    const t = pbox.value.trim();
    if (!t) { toast('پہلے مواد پیسٹ کریں'); return; }
    let ok = false;
    try { const d = JSON.parse(t); ok = !!(d && typeof d === 'object' && ((d.gardanan && typeof d.gardanan === 'object') || Array.isArray(d.verbs) || Array.isArray(d.words) || Array.isArray(d.sentences) || Array.isArray(d.masdars) || Array.isArray(d.entries) || (d.forms && typeof d.forms === 'object') || (d.grammar && typeof d.grammar === 'object') || Array.isArray(d.ps) || Array.isArray(d.fa))); } catch (e) {}
    window.MasdarUpdateFile(t);
    if (ok) pbox.value = '';
  };
  if (cbtn && pbox) cbtn.onclick = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) { pbox.value = t; toast('مواد آ گیا ✅ — اب «پیسٹ سے اپڈیٹ کریں» دبائیں'); }
      else toast('کلپ بورڈ خالی ہے');
    } catch (e) {
      toast('کلپ بورڈ سے نہیں آ سکا — خانے کو دبا کر رکھیں اور Paste منتخب کریں');
      try { pbox.focus(); } catch (e2) {}
    }
  };
  /* quiet automatic check shortly after start (banner only if newer) */
  setTimeout(autoCheckUpdate, 1500);
  /* quiet refresh of the sentence / new-masdar packs shortly after start */
  setTimeout(autoFetchPacks, 2600);
}

/* ---------- automatic update notice (home-page banner) ---------- */
const UPD_DISMISS_KEY = 'masdar_upd_dismissed';
/* Base for the automatic check: the user's saved manual address wins,
   otherwise the built-in site address. */
function autoUpdateBase() {
  const manual = (localStorage.getItem('masdar_upd_server') || '').trim();
  if (manual) return manual.replace(/\/$/, '');
  return SITE_URL ? SITE_URL.replace(/\/$/, '') : '';
}
/* One-tap update: native download+install in the app; a plain open of the
   APK address everywhere else (browser tab / shell hand-off). */
function startAppUpdate(apkUrl) {
  if (window.MasdarBridge && MasdarBridge.updateApp) { MasdarBridge.updateApp(apkUrl); return; }
  window.open(apkUrl, '_blank');
}
function showUpdBanner(v, apk) {
  const b = $('updBanner');
  if (!b) return;
  b.innerHTML = `<div class="ub-txt"><div class="ub-title">🎉 نیا ورژن ${esc(v.versionName || '')} دستیاب ہے</div>`
    + (v.notes ? `<div class="ub-notes">${esc(v.notes)}</div>` : '')
    + `</div><button type="button" class="ub-go" id="updBannerGo">⬇️ ابھی اپڈیٹ کریں</button>`
    + `<button type="button" class="ub-x" id="updBannerX" aria-label="بعد میں">✕</button>`;
  $('updBannerGo').onclick = () => startAppUpdate(apk);
  $('updBannerX').onclick = () => {
    try { localStorage.setItem(UPD_DISMISS_KEY, String(v.versionCode)); } catch (e) {}
    b.hidden = true;
  };
  b.hidden = false;
}
async function autoCheckUpdate() {
  try {
    if (!navigator.onLine) return;
    const base = autoUpdateBase();
    if (!base) return;
    const r = await fetchTimeout(base + '/version.json?_=' + Date.now());
    if (!r.ok) return;
    const v = await r.json();
    if (!v || !(v.versionCode > APP_VERSION_CODE)) return;
    let dismissed = 0;
    try { dismissed = Number(localStorage.getItem(UPD_DISMISS_KEY) || 0); } catch (e) {}
    if (dismissed === Number(v.versionCode)) return;
    let apk = v.apkUrl || 'masdar.apk';
    if (!/^https?:/.test(apk)) apk = base + '/' + apk.replace(/^\//, '');
    showUpdBanner(v, apk);
  } catch (e) { /* offline / server error: stay silent, manual card remains */ }
}
/* Quietly refresh the جملے and نئے مصادر packs from the site at start:
   the store of sentences and masdars keeps growing without a new APK. */
async function autoFetchPacks() {
  try {
    if (!navigator.onLine) return;
    const base = autoUpdateBase();
    if (!base) return;
    try {
      const r = await fetchTimeout(base + '/sentences.json?_=' + Date.now(), 8000);
      if (r.ok) {
        const sj = await r.json();
        const cur = Number(localStorage.getItem('masdar_sentences_rev') || 0);
        if (sj && typeof sj.rev === 'number' && sj.rev > cur && Array.isArray(sj.sentences)) {
          localStorage.setItem('masdar_sentences_data', JSON.stringify(sj));
          localStorage.setItem('masdar_sentences_rev', String(sj.rev));
          if (typeof renderSentences === 'function') renderSentences(($('sentSearchInput') || {}).value || '');
        }
      }
    } catch (e) {}
    try {
      const r = await fetchTimeout(base + '/masdars.json?_=' + Date.now(), 8000);
      if (r.ok) {
        const mj = await r.json();
        const cur = Number(localStorage.getItem('masdar_masdars_rev') || 0);
        if (mj && typeof mj.rev === 'number' && mj.rev > cur && Array.isArray(mj.entries)) {
          localStorage.setItem('masdar_masdars_data', JSON.stringify(mj));
          localStorage.setItem('masdar_masdars_rev', String(mj.rev));
          mergeMasdarPack();
          try { $('statPs').textContent = PS.length.toLocaleString('ur'); } catch (e2) {}
        }
      }
    } catch (e) {}
    try {
      const r = await fetchTimeout(base + '/forms.json?_=' + Date.now(), 8000);
      if (r.ok) {
        const fj = await r.json();
        const cur = Number(localStorage.getItem('masdar_forms_rev') || 0);
        if (fj && typeof fj.rev === 'number' && fj.rev > cur && fj.words && typeof fj.words === 'object') {
          localStorage.setItem('masdar_forms_data', JSON.stringify(fj));
          localStorage.setItem('masdar_forms_rev', String(fj.rev));
          _resetKindCache();
        }
      }
    } catch (e) {}
    try {
      const r = await fetchTimeout(base + '/gardanan.json?_=' + Date.now(), 8000);
      if (r.ok) {
        const gj = await r.json();
        const cur = Number(localStorage.getItem('masdar_gardanan_rev') || 0);
        if (gj && typeof gj.rev === 'number' && gj.rev > cur && Array.isArray(gj.verbs)) {
          localStorage.setItem('masdar_gardanan_data', JSON.stringify(gj));
          localStorage.setItem('masdar_gardanan_rev', String(gj.rev));
          _resetKindCache();
          if (typeof renderGardanan === 'function') renderGardanan();
        }
      }
    } catch (e) {}
    try {
      const r = await fetchTimeout(base + '/psps.json?_=' + Date.now(), 8000);
      if (r.ok) {
        const pj = await r.json();
        const cur = Number(localStorage.getItem('masdar_psps_rev') || 0);
        if (pj && typeof pj.rev === 'number' && pj.rev > cur && Array.isArray(pj.entries)) {
          localStorage.setItem('masdar_psps_data', JSON.stringify(pj));
          localStorage.setItem('masdar_psps_rev', String(pj.rev));
          if (typeof renderPsPs === 'function') renderPsPs();
        }
      }
    } catch (e) {}
    try {
      const r = await fetchTimeout(base + '/grammar.json?_=' + Date.now(), 8000);
      if (r.ok) {
        const gj = await r.json();
        const cur = Number(localStorage.getItem('masdar_grammar_rev') || 0);
        if (gj && typeof gj.rev === 'number' && gj.rev > cur && (Array.isArray(gj.ps) || Array.isArray(gj.fa))) {
          localStorage.setItem('masdar_grammar_data', JSON.stringify(gj));
          localStorage.setItem('masdar_grammar_rev', String(gj.rev));
          if (typeof renderGrammarTopics === 'function') renderGrammarTopics();
        }
      }
    } catch (e) {}
  } catch (e) {}
}
/* Called by the Android bridge (and the web file fallback) with the text of a
   chosen update file: a gardanan pack ({rev, verbs} or {gardanan:{...}}) or a
   میرے الفاظ export file ({words:[...]}). */
window.MasdarUpdateFile = function (text) {
  let d;
  try { d = JSON.parse(text); } catch (e) { toast('فائل سمجھ نہیں آئی ❌'); return; }
  if (!d || typeof d !== 'object') { toast('فائل سمجھ نہیں آئی ❌'); return; }
  const g = (d.gardanan && typeof d.gardanan === 'object') ? d.gardanan : (Array.isArray(d.verbs) ? d : null);
  if (g) {
    const rev = (typeof g.rev === 'number' && g.rev) ? g.rev : Date.now();
    localStorage.setItem('masdar_gardanan_data', JSON.stringify({ rev, verbs: g.verbs }));
    localStorage.setItem('masdar_gardanan_rev', String(rev));
    _resetKindCache();
    if (typeof renderGardanan === 'function') renderGardanan();
    toast('✅ گردانیں شامل ہو گئیں');
    return;
  }
  if (Array.isArray(d.words)) {
    const before = new Set(myWords.map(w => w.id));
    let n = 0;
    try { n = mergeMyDataObject(d); } catch (e) { toast('فائل سمجھ نہیں آئی ❌'); return; }
    const wordsAdded = myWords.filter(w => !before.has(w.id)).length;
    if (wordsAdded) toast(wordsAdded + ' الفاظ شامل ہو گئے ✅');
    else toast(n ? n + ' چیزیں شامل ہو گئیں ✅' : 'نئی کوئی چیز نہیں ملی');
    return;
  }
  if (Array.isArray(d.sentences)) {
    const rev = (typeof d.rev === 'number' && d.rev) ? d.rev : Date.now();
    /* merge with whatever pack is already stored — a small file must not
       wipe the sentences that arrived online */
    let curList = [];
    try { const st = JSON.parse(localStorage.getItem('masdar_sentences_data') || 'null'); if (st && Array.isArray(st.sentences)) curList = st.sentences; } catch (e) {}
    const smap = new Map(); curList.forEach(s => { if (s && s.ps) smap.set(norm(s.ps), s); });
    d.sentences.forEach(s => { if (s && s.ps) smap.set(norm(s.ps), s); });
    localStorage.setItem('masdar_sentences_data', JSON.stringify({ rev, sentences: Array.from(smap.values()) }));
    localStorage.setItem('masdar_sentences_rev', String(rev));
    if (typeof renderSentences === 'function') renderSentences('');
    toast('✅ جملے شامل ہو گئے');
    return;
  }
  if (d.forms && typeof d.forms === 'object') {
    const rev = (typeof d.rev === 'number' && d.rev) ? d.rev : Date.now();
    let curW = {};
    try { const st = JSON.parse(localStorage.getItem('masdar_forms_data') || 'null'); if (st && st.words) curW = st.words; } catch (e) {}
    localStorage.setItem('masdar_forms_data', JSON.stringify({ rev, words: Object.assign({}, curW, d.forms) }));
    localStorage.setItem('masdar_forms_rev', String(rev));
    _resetKindCache();
    toast('✅ الفاظ کی صورتیں شامل ہو گئیں');
    return;
  }
  const gr = (d.grammar && typeof d.grammar === 'object') ? d.grammar
    : ((Array.isArray(d.ps) || Array.isArray(d.fa)) ? d : null);
  if (gr && (Array.isArray(gr.ps) || Array.isArray(gr.fa))) {
    const rev = (typeof gr.rev === 'number' && gr.rev) ? gr.rev : Date.now();
    /* merge with the stored pack by topic title — a small file must not
       wipe the grammar topics that arrived online */
    let curG = {};
    try { const st = JSON.parse(localStorage.getItem('masdar_grammar_data') || 'null'); if (st && typeof st === 'object') curG = st; } catch (e) {}
    const merged = { rev };
    ['ps', 'fa'].forEach(lang => {
      const gm = new Map();
      const gadd = t => { if (t && t.t) gm.set(norm(t.t), t); };
      (Array.isArray(curG[lang]) ? curG[lang] : []).forEach(gadd);
      (Array.isArray(gr[lang]) ? gr[lang] : []).forEach(gadd);
      merged[lang] = Array.from(gm.values());
    });
    localStorage.setItem('masdar_grammar_data', JSON.stringify(merged));
    localStorage.setItem('masdar_grammar_rev', String(rev));
    if (typeof renderGrammarTopics === 'function') renderGrammarTopics();
    toast('✅ گرامر موضوعات شامل ہو گئے');
    return;
  }
  if (Array.isArray(d.masdars) || Array.isArray(d.entries)) {
    let entries = Array.isArray(d.masdars) ? d.masdars : d.entries;
    const rev = (typeof d.rev === 'number' && d.rev) ? d.rev : Date.now();
    let curE = [];
    try { const st = JSON.parse(localStorage.getItem('masdar_masdars_data') || 'null'); if (st && Array.isArray(st.entries)) curE = st.entries; } catch (e) {}
    if (curE.length) { const emap = new Map(); curE.forEach(en => { if (en && en.w) emap.set(norm(en.w), en); }); entries.forEach(en => { if (en && en.w) emap.set(norm(en.w), en); }); entries = Array.from(emap.values()); }
    localStorage.setItem('masdar_masdars_data', JSON.stringify({ rev, entries }));
    localStorage.setItem('masdar_masdars_rev', String(rev));
    mergeMasdarPack();
    try { $('statPs').textContent = PS.length.toLocaleString('ur'); } catch (e) {}
    toast('✅ نئے مصادر شامل ہو گئے');
    return;
  }
  toast('فائل سمجھ نہیں آئی ❌');
};

/* ---------- نئے مصادر pack (online masdars.json) ----------
   Masdars that are not in the built-in data yet arrive as a pack
   ({rev, entries:[{w, r, en, ur, fa}]}) and merge into PS at load. */
function mergeMasdarPack() {
  try {
    const stored = JSON.parse(localStorage.getItem('masdar_masdars_data') || 'null');
    const list = stored && Array.isArray(stored.entries) ? stored.entries : [];
    if (!list.length || !PS) return;
    const have = new Set(PS.map(e => norm(e[2])));
    list.forEach((en, i) => {
      if (!en || !en.w) return;
      const k = norm(en.w);
      if (have.has(k)) return;
      have.add(k);
      PS.push(['np' + i + '_' + k, String(en.w).charAt(0), en.w, en.r || '', en.en || '', en.ur || '', en.fa || '', []]);
    });
  } catch (e) {}
}

/* ---------- جملے page ----------
   Built-in seed (js/sentences-data.js) + online pack (sentences.json,
   localStorage masdar_sentences_data) merged by Pashto sentence. */
function getSentFixes() { try { const o = JSON.parse(localStorage.getItem('masdar_sent_fix') || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
function saveSentFixes(o) { localStorage.setItem('masdar_sent_fix', JSON.stringify(o)); }
function getMySentences() { try { const a = JSON.parse(localStorage.getItem('masdar_my_sentences') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function saveMySentences(a) { localStorage.setItem('masdar_my_sentences', JSON.stringify(a)); }
function getSentences() {
  const map = new Map();
  const add = s => { if (s && s.ps) map.set(norm(s.ps), s); };
  (window.SENTENCES_SEED || []).forEach(add);
  try {
    const stored = JSON.parse(localStorage.getItem('masdar_sentences_data') || 'null');
    const list = stored && Array.isArray(stored.sentences) ? stored.sentences : (Array.isArray(stored) ? stored : []);
    list.forEach(add);
  } catch (e) {}
  /* the user's own corrections replace the stored sentence (keyed by the
     original sentence's normalised Pashto); when only the translations
     changed, set() in place so the sentence keeps its position */
  const fixes = getSentFixes();
  for (const k in fixes) {
    const fx = fixes[k];
    if (fx && fx.ps && map.has(k)) {
      if (norm(fx.ps) === k) map.set(k, fx);
      else { map.delete(k); map.set(norm(fx.ps), fx); }
    }
  }
  /* the user's own added sentences lead the list (and win on duplicates) */
  const mineList = getMySentences().filter(s => s && s.ps);
  const mineKeys = new Set(mineList.map(s => norm(s.ps)));
  const rest = Array.from(map.values()).filter(s => !mineKeys.has(norm(s.ps)));
  return mineList.concat(rest);
}
function renderSentences(q) {
  const box = $('sentResults');
  if (!box) return;
  const all = getSentences();
  const query = norm(q || '');
  const list = query
    ? all.filter(s => norm(s.ps).includes(query) || norm(s.ur || '').includes(query) || norm(s.fa || '').includes(query) || latin(s.en || '').includes(latin(query)))
    : all;
  if (!list.length) { box.innerHTML = '<div class="empty">کوئی جملہ نہیں ملا — کوئی اور لفظ لکھ کر دیکھیں۔</div>'; return; }
  const show = list.slice(0, 300);
  window._sentRendered = show;
  const mineSet = new Set(getMySentences().map(s => norm(s.ps)));
  box.innerHTML = (query
    ? `<p class="hint">«${esc(q)}» — ${list.length.toLocaleString('ur')} جملے ملے</p>`
    : `<p class="hint">سب جملے — اوپر کسی لفظ سے تلاش کریں</p>`)
    + show.map((s, i) => { const mine = mineSet.has(norm(s.ps)); return `<div class="result-card"><div class="w" style="font-size:19px;line-height:1.9">${esc(s.ps)}</div>`
      + (s.ur ? `<div class="m">🇵🇰 ${esc(s.ur)}</div>` : '')
      + (s.fa ? `<div class="m">🇮🇷 ${esc(s.fa)}</div>` : '')
      + (s.en ? `<div class="m">🇬🇧 <span dir="ltr">${esc(s.en)}</span></div>` : '')
      + `<div style="margin-top:6px;display:flex;gap:6px;align-items:center"><button class="btn-ghost" data-sentedit="${i}">✏️ تصحیح</button>${mine ? '<span class="tag">میرا جملہ</span><button class="btn-ghost" data-sentdel="' + i + '">🗑️ حذف</button>' : ''}</div></div>`; }).join('')
    + (list.length > show.length ? `<p class="hint">… اور ${(list.length - show.length).toLocaleString('ur')} جملے — تلاش سے مخصوص لفظ لکھیں</p>` : '');
}
/* Sentence editor: correction of any stored sentence (saved as a fix keyed
   by the original) or editing/deleting one of the user's own sentences;
   new sentences go to the user's own store. Both ride along in exports. */
let sentEditCtx = null;
function openSentEditor(rec, isNew) {
  sentEditCtx = { origKey: rec ? norm(rec.ps) : '', isNew: !!isNew };
  openSheet(`<h3 style="text-align:center">${isNew ? '＋ نیا جملہ' : '✏️ جملے کی تصحیح'}</h3>
    <label>پشتو جملہ<textarea id="sePs" rows="2">${esc(rec ? rec.ps : '')}</textarea></label>
    <label>اردو ترجمہ<textarea id="seUr" rows="2">${esc(rec ? rec.ur || '' : '')}</textarea></label>
    <label>فارسی ترجمہ<textarea id="seFa" rows="2">${esc(rec ? rec.fa || '' : '')}</textarea></label>
    <label>English<textarea id="seEn" rows="2" dir="ltr">${esc(rec ? rec.en || '' : '')}</textarea></label>
    <button class="btn-primary" style="width:100%;margin-top:8px" onclick="saveSentEdit()">💾 محفوظ کریں</button>
    <p class="hint" style="margin-top:8px">یہ تصحیح/اضافہ آپ کے فون میں محفوظ رہے گا اور ایکسپورٹ میں شامل ہو گا — بھیجنے پر سب کے لیے مستقل ہو جائے گا۔</p>`);
}
function saveSentEdit() {
  const rec = { ps: $('sePs').value.trim(), ur: $('seUr').value.trim(), fa: $('seFa').value.trim(), en: $('seEn').value.trim() };
  if (!rec.ps) { toast('پشتو جملہ لکھیں'); return; }
  const mine = getMySentences();
  const mi = sentEditCtx.isNew ? -1 : mine.findIndex(s => norm(s.ps) === sentEditCtx.origKey);
  if (mi >= 0) { mine[mi] = rec; saveMySentences(mine); }
  else if (sentEditCtx.isNew) { mine.push(rec); saveMySentences(mine); }
  else { const fx = getSentFixes(); fx[sentEditCtx.origKey] = rec; saveSentFixes(fx); }
  closeSheet();
  renderSentences(($('sentSearchInput') || {}).value || '');
  toast('✅ جملہ محفوظ ہو گیا');
}
window.openSentEditor = openSentEditor;
window.saveSentEdit = saveSentEdit;
window.renderSentences = renderSentences;
function initSentences() {
  const inp = $('sentSearchInput'), btn = $('sentSearchBtn');
  if (!inp) return;
  const run = () => renderSentences(inp.value);
  if (btn) btn.onclick = run;
  inp.addEventListener('input', () => { clearTimeout(window._st); window._st = setTimeout(run, 250); });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  const add = $('sentAddBtn'); if (add) add.onclick = () => openSentEditor(null, true);
  const box = $('sentResults');
  if (box) box.addEventListener('click', e => {
    const eb = e.target.closest('[data-sentedit]');
    const db = e.target.closest('[data-sentdel]');
    if (eb) { const rec = (window._sentRendered || [])[Number(eb.dataset.sentedit)]; if (rec) openSentEditor(rec, false); }
    if (db) { const rec = (window._sentRendered || [])[Number(db.dataset.sentdel)]; if (rec) { saveMySentences(getMySentences().filter(s => norm(s.ps) !== norm(rec.ps))); renderSentences(inp.value); toast('جملہ حذف ہو گیا'); } }
  });
  renderSentences('');
}

/* ---------- گردانیں page ---------- */
function getGardananVerbs() {
  const map = new Map();
  const add = v => { if (v && v.ps) map.set(String(v.ps), v); };
  (window.GARDANAN_SEED || []).forEach(add);
  try {
    const stored = JSON.parse(localStorage.getItem('masdar_gardanan_data') || 'null');
    const list = stored && Array.isArray(stored.verbs) ? stored.verbs : (Array.isArray(stored) ? stored : []);
    list.forEach(add);
  } catch (e) {}
  return Array.from(map.values());
}
function renderGardanan() {
  const box = $('gardananList'), detail = $('gardananDetail');
  if (!box) return;
  if (detail) detail.hidden = true;
  box.hidden = false;
  const verbs = getGardananVerbs();
  if (!verbs.length) { box.innerHTML = '<div class="empty">ابھی کوئی گردان موجود نہیں۔</div>'; return; }
  box.innerHTML = verbs.map((v, i) => `<div class="result-card" data-gard="${i}"><div class="w">${esc(v.ps)}</div><div class="m">🇵🇰 ${esc(v.ur || '')}${v.en ? ' · <span dir="ltr">' + esc(v.en) + '</span>' : ''}${v.kind ? ' · ' + esc(v.kind) : ''}</div></div>`).join('');
  box.querySelectorAll('[data-gard]').forEach(c => c.onclick = () => openGardananVerb(verbs[Number(c.dataset.gard)]));
}
window.renderGardanan = renderGardanan;
/* Expand one stored گردان line into one line per person-form: stored lines
   pack several forms, each with its gloss in (…), separated by ") /" or
   ")،". A segment may join two forms sharing one gloss
   ("هغوی …، دوی … (gloss)") — split it so each form gets its own line
   carrying the shared gloss. Single-form lines pass through unchanged. */
function splitGardananLine(line) {
  const s = String(line == null ? '' : line).trim();
  if (!s) return [];
  const segs = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) {
        let j = i + 1;
        while (j < s.length && s[j] === ' ') j++;
        if (j < s.length && (s[j] === '/' || s[j] === '،')) {
          segs.push(s.slice(start, i + 1).trim());
          start = j + 1;
          i = j;
        }
      }
    }
  }
  segs.push(s.slice(start).trim());
  const out = [];
  segs.forEach(seg => {
    const p = seg.indexOf('(');
    if (p > 0) {
      const head = seg.slice(0, p).trim(), tail = seg.slice(p).trim();
      if (head.indexOf('،') >= 0) {
        const parts = head.split('،').map(x => x.trim()).filter(Boolean);
        if (parts.length > 1) { parts.forEach(x => out.push(x + ' ' + tail)); return; }
      }
    }
    if (seg) out.push(seg);
  });
  return out;
}
function expandGardananLines(lines) {
  const out = [];
  (lines || []).forEach(l => { splitGardananLine(l).forEach(x => out.push(x)); });
  return out;
}
function openGardananVerb(v) {
  const box = $('gardananList'), detail = $('gardananDetail');
  if (!detail || !v) return;
  if (box) box.hidden = true;
  detail.hidden = false;
  detail.innerHTML = `<button class="btn-ghost" id="gardBack" style="margin:0 0 10px">⬅ واپس</button>
    <div class="card" style="margin:0 0 12px"><div class="sheet-word">${esc(v.ps)}</div>
    <div class="sheet-roman">🇵🇰 ${esc(v.ur || '')}${v.en ? ' · <span dir="ltr">' + esc(v.en) + '</span>' : ''}${v.kind ? ' · ' + esc(v.kind) : ''}</div></div>`
    + (v.sections || []).map(s => `<div class="card" style="margin:0 0 12px"><h4 style="margin:0 0 8px">${esc(s.title || '')}${s.ur_title ? ' — ' + esc(s.ur_title) : ''}${s.en_title ? ' · <span dir="ltr">' + esc(s.en_title) + '</span>' : ''}</h4>${expandGardananLines(s.lines).map(l => `<p dir="rtl" style="margin:0;padding:7px 0;border-bottom:1px dashed rgba(127,127,127,.35);font-size:17px;line-height:1.9">${esc(l)}</p>`).join('')}</div>`).join('');
  const back = $('gardBack');
  if (back) back.onclick = () => renderGardanan();
  window.scrollTo(0, 0);
}
/* Full collected paradigm («📖 مکمل گردان») for a masdar detail sheet:
   looks the headword up in the گردانیں data (seed + update packs). Returns ''
   when no gardanan entry exists for the word, so sheets stay clean. */
function renderGardananBlock(word) {
  if (!word) return '';
  const v = getGardananVerbs().find(x => String(x.ps) === String(word));
  if (!v || !Array.isArray(v.sections) || !v.sections.length) return '';
  return `<div class="sheet-sec"><h4>📖 مکمل گردان${v.kind ? ' — ' + esc(v.kind) : ''}</h4>` + v.sections.map(s =>
    `<h4 style="margin-top:10px">${esc(s.title || '')}${s.ur_title ? ' — ' + esc(s.ur_title) : ''}${s.en_title ? ' · <span dir="ltr">' + esc(s.en_title) + '</span>' : ''}</h4>` +
    expandGardananLines(s.lines).map(l => `<p dir="rtl" style="margin:0;padding:7px 0;border-bottom:1px dashed rgba(127,127,127,.35);font-size:17px;line-height:1.9">${esc(l)}</p>`).join('')
  ).join('') + `</div>`;
}
function initGardanan() { renderGardanan(); }

/* ---------- فعل کی قسم (متعدی / لازم) ----------
   A masdar's kind, wherever it has been written: the گردانیں entry's
   `kind`, or the لفظ کی صورتیں meta «فعل کی قسم». Cached because word
   cards render in bulk; the cache resets whenever a pack lands. */
let _kindCache = null;
function _resetKindCache() { _kindCache = null; }
window._resetKindCache = _resetKindCache;
function verbKind(word) {
  if (!word) return '';
  if (!_kindCache) {
    _kindCache = new Map();
    try { getGardananVerbs().forEach(v => { if (v && v.ps && v.kind) _kindCache.set(norm(v.ps), v.kind); }); } catch (e) {}
    try {
      const fm = getFormsMap();
      for (const k in fm) {
        const f = fm[k];
        if (f && Array.isArray(f.meta)) { const m = f.meta.find(x => x[0] === 'فعل کی قسم'); if (m && !_kindCache.has(k)) _kindCache.set(k, m[1]); }
      }
    } catch (e) {}
  }
  return _kindCache.get(norm(word)) || '';
}
window.verbKind = verbKind;

/* ---------- لفظ کی صورتیں و گرامر ----------
   Per-word forms: gender/number/case variants, derived adjectives
   (فاعلی/مفعولی/لیاقت/شغلی), compounds, verb class (متعدی/لازم), masdar
   state, prefix/suffix derivatives — each form may carry an example
   sentence. Built-in seed (js/forms-data.js) + online pack (forms.json,
   localStorage masdar_forms_data) merged per word. */
function getFormsMap() {
  const map = {};
  const addAll = src => { if (src && typeof src === 'object') for (const k in src) map[norm(k)] = src[k]; };
  addAll(window.FORMS_SEED);
  try {
    const stored = JSON.parse(localStorage.getItem('masdar_forms_data') || 'null');
    addAll(stored && stored.words ? stored.words : stored);
  } catch (e) {}
  return map;
}
function formsBlockHTML(word) {
  if (!word) return '';
  const f = getFormsMap()[norm(word)];
  if (!f || (!Array.isArray(f.forms) && !Array.isArray(f.meta))) return '';
  const meta = (f.meta || []).map(m => `<div class="kv"><b>${esc(m[0])}</b><span>${esc(m[1])}</span></div>`).join('');
  const rows = (f.forms || []).map(it => `<div class="kv"><b>${esc(it.k)}</b><span><strong>${esc(it.v)}</strong>${it.s ? `<br>${esc(it.s)}${it.su ? `<br><span class="suggest">${esc(it.su)}</span>` : ''}` : ''}</span></div>`).join('');
  if (!meta && !rows) return '';
  return `<div class="sheet-sec"><h4>🔤 لفظ کی صورتیں و گرامر</h4>${meta}${rows}</div>`;
}
window.formsBlockHTML = formsBlockHTML;

/* ---------- share the app ---------- */
const INVITE_TEXT = 'د پښتو مصدرونه — پشتو و فارسی مصادر کی آف لائن ڈکشنری (تیار کردہ: کلثوم درانی)';
function shareInviteText() {
  return APP_LINK ? INVITE_TEXT + '\n' + APP_LINK : INVITE_TEXT;
}
function copyInvite() {
  const t = shareInviteText();
  if (window.MasdarBridge && MasdarBridge.copyText) { MasdarBridge.copyText(t); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(() => alert('پیغام کاپی ہو گیا ✅')).catch(() => alert(t)); }
  else alert(t);
}
function initShare() {
  const b = $('shareBtn'); if (!b) return;
  b.onclick = () => {
    const inApp = !!(window.MasdarBridge && MasdarBridge.shareApp);
    openSheet(`<h3 style="text-align:center">📤 ایپ شیئر کریں</h3>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
      ${inApp ? '<button class="btn-primary" id="shFile">📤 ایپ کی فائل بھیجیں (APK)</button>' : ''}
      ${APP_LINK ? '<button class="btn-primary" id="shLink">🔗 ایپ کا لنک بھیجیں</button>' : ''}
      <button class="btn-ghost" id="shCopy" style="margin:0">📋 دعوتی پیغام کاپی کریں</button>
      ${APP_LINK ? `<p class="hint" style="text-align:center" dir="ltr">${esc(APP_LINK)}</p>` : '<p class="hint" style="text-align:center">مستقل لنک کے لیے ایپ کو ویب سائٹ پر لگانا ہوگا — نیچے پیغام میں اس کی تجویز ہے۔</p>'}
      </div>`);
    const f = $('shFile'); if (f) f.onclick = () => { closeSheet(); MasdarBridge.shareApp(); };
    const l = $('shLink'); if (l) l.onclick = () => {
      closeSheet();
      if (window.MasdarBridge && MasdarBridge.shareText) MasdarBridge.shareText(shareInviteText());
      else if (navigator.share) navigator.share({ title: 'د پښتو مصدرونه', text: shareInviteText(), url: APP_LINK }).catch(() => {});
    };
    const c = $('shCopy'); if (c) c.onclick = () => { closeSheet(); copyInvite(); };
  };
}

/* ---------- editable intro (تعارف) ---------- */
function initIntro() {
  const para = $('introPara'); if (!para) return;
  const def = para.textContent;
  const saved = localStorage.getItem('masdar_intro');
  if (saved) para.textContent = saved;
  const box = $('introEditBox'), ta = $('ieBody');
  $('introEditBtn').onclick = () => { ta.value = para.textContent; box.hidden = !box.hidden; if (!box.hidden) box.scrollIntoView({ behavior: 'smooth' }); };
  $('ieSave').onclick = () => {
    const v = ta.value.trim();
    if (!v) { alert('تعارف کا متن لکھیں!'); return; }
    localStorage.setItem('masdar_intro', v);
    para.textContent = v; box.hidden = true;
    alert('تعارف محفوظ ہو گیا ✅');
  };
  $('ieReset').onclick = () => { localStorage.removeItem('masdar_intro'); para.textContent = def; box.hidden = true; };
}

/* ---------- theme ---------- */
function initTheme() {
  const t = localStorage.getItem('masdar_theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  $('themeBtn').textContent = t === 'dark' ? '☀️' : '🌙';
  $('themeBtn').onclick = () => {
    const nt = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nt);
    localStorage.setItem('masdar_theme', nt);
    $('themeBtn').textContent = nt === 'dark' ? '☀️' : '🌙';
  };
}

/* ---------- navigation ---------- */
function initNav() {
  const go = name => {
    /* Qamosona online search lives on the home page now («ابتدائی صفحہ»):
       «آنلائن تلاش» navigation lands on home and scrolls to its section. */
    const target = name === 'online' ? 'search' : name;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    $('page-' + target).classList.add('active');
    document.querySelectorAll('#bottomNav button').forEach(b => b.classList.toggle('active', b.dataset.nav === target));
    $('drawer').classList.remove('open'); $('scrim').classList.remove('show');
    if (name === 'online') {
      initOnline();
      setTimeout(() => { const q = $('qamosonaHome'); if (q) q.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    } else {
      window.scrollTo(0, 0);
    }
    if (name === 'stats' && typeof renderStats === 'function') renderStats();
    if (name === 'psps') initPsPs();
    if (name === 'grammar') initGrammarTopics();
  };
  window._goNav = go;
  document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => go(b.dataset.nav));
  $('menuBtn').onclick = () => { $('drawer').classList.add('open'); $('scrim').classList.add('show'); };
  $('scrim').onclick = () => { $('drawer').classList.remove('open'); $('scrim').classList.remove('show'); };
  $('sheetClose').onclick = closeSheet;
  $('sheetScrim').onclick = closeSheet;
}
function openSheet(html) { $('sheetBody').innerHTML = html; $('sheet').classList.add('open'); $('sheetScrim').classList.add('show'); }
function closeSheet() { $('sheet').classList.remove('open'); $('sheetScrim').classList.remove('show'); }

/* ---------- online search (Qamosona) ----------
   Pure live view: the iframe shows qamosona.com directly. Per the site's
   own policy nothing from it is saved, cached or copied into app data.
   The section sits on the home page (#qamosonaHome); the frame's src is
   set lazily — only when the section is first shown or navigated to. */
const QAMOSONA_URL = 'https://www.qamosona.com/ndic3/';
let _onlineLoaded = false;
function initOnline() {
  const fr = $('onlineFrame'), off = $('onlineOff');
  if (!fr) return;
  if (navigator.onLine === false) {
    fr.hidden = true;
    if (off) off.hidden = false;
    return;
  }
  if (off) off.hidden = true;
  fr.hidden = false;
  if (!_onlineLoaded) { fr.src = QAMOSONA_URL; _onlineLoaded = true; }
}
/* ---------- اپنی پشتو-پشتو لغت (offline seed + online psps.json pack) ----------
   Entries are {w, def, syn}: the definition of a Pashto word written IN
   Pashto. Built-in seed (js/psps-data.js) + online pack (psps.json,
   localStorage masdar_psps_data) merged by word — the pack wins. */
function getPsPsEntries() {
  const map = new Map();
  const add = e => { if (e && e.w) map.set(norm(e.w), { w: e.w, def: e.def || '', syn: e.syn || '' }); };
  (window.PSPS_SEED || []).forEach(add);
  try {
    const stored = JSON.parse(localStorage.getItem('masdar_psps_data') || 'null');
    const list = stored && Array.isArray(stored.entries) ? stored.entries : (Array.isArray(stored) ? stored : []);
    list.forEach(add);
  } catch (e) {}
  return Array.from(map.values());
}
window.getPsPsEntries = getPsPsEntries;
function psFold(s) { return norm(s).replace(/ے/g, 'ی'); }
function renderPsPs() {
  const box = $('pspsResults');
  if (!box) return;
  const all = getPsPsEntries();
  if (!all.length) { box.innerHTML = '<div class="empty">تر اوسه کومه تشریح نه ده شامله — ژر به راشي۔</div>'; return; }
  const query = psFold(($('pspsInput') || {}).value || '');
  const list = query
    ? all.filter(e => psFold(e.w).includes(query) || psFold(e.def).includes(query) || psFold(e.syn).includes(query))
    : all;
  window._pspsList = list;
  if (!list.length) { box.innerHTML = '<div class="empty">کوم ويی ونه موندل شو — بل ويی وليکئ او بيا لټون وکړئ۔</div>'; return; }
  box.innerHTML = list.slice(0, 60).map((e, i) => `<div class="result-card" data-psps="${i}"><div class="w">${esc(e.w)}</div>`
    + (e.def ? `<div class="m">${esc(e.def)}</div>` : '')
    + (e.syn ? `<div class="m">مترادف: ${esc(e.syn)}</div>` : '')
    + `</div>`).join('');
  box.querySelectorAll('[data-psps]').forEach(el => el.addEventListener('click', () => openPsPsDetail(window._pspsList[+el.dataset.psps])));
}
function pspsEquivs(e) {
  return (e.def || '').split(/[،؛,]/).map(s => s.trim()).filter(Boolean);
}
function openPsPsDetail(e) {
  if (!e) return;
  const eq = pspsEquivs(e);
  const syn = e.syn ? `<div class="sheet-sec"><h4>مترادف</h4><div class="ex">${esc(e.syn)}</div></div>` : '';
  openSheet(`<h3 style="margin:6px 0 2px">${esc(e.w)}</h3>`
    + `<div class="sheet-sec"><h4>پشتو</h4>`
    + (eq.length ? eq.map(s => `<button type="button" class="chipbtn" data-eq="${esc(s)}">${esc(s)}</button>`).join(' ') : `<div class="ex">${esc(e.def || '')}</div>`)
    + `</div>` + syn);
  document.querySelectorAll('#sheetBody [data-eq]').forEach(b => b.addEventListener('click', () => {
    closeSheet();
    const inp = $('pspsInput'); if (inp) inp.value = b.dataset.eq;
    renderPsPs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
}
window.openPsPsDetail = openPsPsDetail;
window.renderPsPs = renderPsPs;

/* ---------- Pashto to Pashto dictionary page (our own لغت) ---------- */
let _pspsWired = false;
function initPsPs() {
  if (!_pspsWired) {
    _pspsWired = true;
    const inp = $('pspsInput'), btn = $('pspsBtn');
    if (inp) inp.addEventListener('input', () => { clearTimeout(window._pspsT); window._pspsT = setTimeout(renderPsPs, 250); });
    if (btn) btn.onclick = () => renderPsPs();
  }
  renderPsPs();
}

/* ---------- 📚 گرامر topics (offline seed + online grammar.json pack) ----------
   Topics are {t, tu, lines}: a Pashto/Farsi title, its Urdu title shown
   alongside, and body lines (a line starting with «◆» is a sub-heading).
   Built-in seed (js/grammar-data.js, window.GRAMMAR_SEED) + online pack
   (grammar.json, localStorage masdar_grammar_data) merged by title — the
   pack wins. Content is added only after the user's per-topic approval. */
function getGrammarTopics(lang) {
  const map = new Map();
  const add = t => { if (t && t.t) map.set(norm(t.t), { t: t.t, tu: t.tu || '', lines: Array.isArray(t.lines) ? t.lines : [] }); };
  const seed = (window.GRAMMAR_SEED && Array.isArray(window.GRAMMAR_SEED[lang])) ? window.GRAMMAR_SEED[lang] : [];
  seed.forEach(add);
  try {
    const stored = JSON.parse(localStorage.getItem('masdar_grammar_data') || 'null');
    if (stored && Array.isArray(stored[lang])) stored[lang].forEach(add);
  } catch (e) {}
  return Array.from(map.values());
}
window.getGrammarTopics = getGrammarTopics;
let _grammarLang = 'ps';
function setGrammarLang(lang) {
  _grammarLang = lang;
  document.querySelectorAll('#grammarTabs button').forEach(b => b.classList.toggle('active', b.dataset.glang === lang));
  renderGrammarTopics();
}
function renderGrammarTopics() {
  const box = $('grammarTopics');
  if (!box) return;
  const list = getGrammarTopics(_grammarLang);
  window._grammarList = list;
  if (!list.length) {
    box.innerHTML = `<div class="empty">${_grammarLang === 'ps' ? 'ابھی کوئی موضوع شامل نہیں — جلد آئے گا' : 'هنوز هیچ موضوعی اضافه نشده است — به‌زودی اضافه می‌شود'}</div>`;
    return;
  }
  box.innerHTML = list.map((t, i) => `<div class="result-card" data-gt="${i}"><div class="w">${esc(t.t)}</div>`
    + (t.tu ? `<div class="m">${esc(t.tu)}</div>` : '')
    + `</div>`).join('');
  box.querySelectorAll('[data-gt]').forEach(el => el.addEventListener('click', () => openGrammarTopic(window._grammarList[+el.dataset.gt])));
}
function openGrammarTopic(t) {
  if (!t) return;
  const body = (t.lines || []).map(l => String(l).startsWith('◆')
    ? `<h4 style="margin:12px 0 4px">${esc(String(l).replace(/^◆\s*/, ''))}</h4>`
    : `<p style="margin:4px 0;line-height:2">${esc(l)}</p>`).join('');
  openSheet(`<h3 style="margin:6px 0 2px">${esc(t.t)}</h3>`
    + (t.tu ? `<div class="m" style="margin-bottom:6px">${esc(t.tu)}</div>` : '')
    + `<div class="sheet-sec">${body}</div>`);
}
window.openGrammarTopic = openGrammarTopic;
window.renderGrammarTopics = renderGrammarTopics;
window.setGrammarLang = setGrammarLang;
let _grammarWired = false;
function initGrammarTopics() {
  if (!_grammarWired) {
    _grammarWired = true;
    document.querySelectorAll('#grammarTabs button').forEach(b => b.addEventListener('click', () => setGrammarLang(b.dataset.glang)));
  }
  renderGrammarTopics();
}
window.initGrammarTopics = initGrammarTopics;

/* ---------- header clock + Gregorian/Hijri dates ---------- */
/* Hijri date follows Pakistan's moon-based sequence (the built-in Intl
   islamic calendar runs ahead of it). Anchored at 15 Oct 2026 = 3 Jumada
   al-Awwal 1448 and walked with tabular month lengths from there. */
const HIJRI_MONTHS = ['محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاول', 'جمادی الثانی', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذوالقعدہ', 'ذوالحجہ'];
const UR_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toUrDigits = n => String(n).replace(/\d/g, d => UR_DIGITS[+d]);
function hijriString(now) {
  const MS = 86400000;
  const anchor = Date.UTC(2026, 9, 15);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  let diff = Math.round((today - anchor) / MS);
  let y = 1448, m = 4, d = 3;
  const leap = yy => [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(((yy - 1) % 30) + 1);
  const mlen = (yy, mm) => mm === 11 ? (leap(yy) ? 30 : 29) : (mm % 2 === 0 ? 30 : 29);
  while (diff > 0) {
    const L = mlen(y, m);
    if (d + diff <= L) { d += diff; diff = 0; }
    else { diff -= (L - d + 1); d = 1; m++; if (m > 11) { m = 0; y++; } }
  }
  while (diff < 0) {
    if (d + diff >= 1) { d += diff; diff = 0; }
    else { diff += d; m--; if (m < 0) { m = 11; y--; } d = mlen(y, m); }
  }
  return d + ' ' + HIJRI_MONTHS[m] + ' ' + y + 'ھ';
}
function initClockDates() {
  const g = $('dateGreg'), h = $('dateHijri'), c = $('clock');
  if (!g || !c) return;
  const tick = () => {
    const now = new Date();
    try { g.textContent = new Intl.DateTimeFormat('ur-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now); }
    catch (e) { g.textContent = now.toDateString(); }
    if (h) {
      try { h.textContent = hijriString(now); }
      catch (e) { h.textContent = ''; }
    }
    let hh = now.getHours();
    const mm = String(now.getMinutes()).padStart(2, '0'), ss = String(now.getSeconds()).padStart(2, '0');
    const ap = hh >= 12 ? 'PM' : 'AM'; hh = hh % 12 || 12;
    c.textContent = String(hh).padStart(2, '0') + ':' + mm + ':' + ss + ' ' + ap;
  };
  tick();
  setInterval(tick, 1000);
}

function initQamosonaHome() {
  const sec = $('qamosonaHome');
  if (!sec) return;
  if (!('IntersectionObserver' in window)) return; /* nav still triggers the load */
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { initOnline(); io.disconnect(); }
  }, { threshold: 0.1 });
  io.observe(sec);
}
window.addEventListener('online', () => {
  if ($('qamosonaHome')) initOnline();
});

/* ---------- search ---------- */
function initDict() {
  const dab = $('dictAddBtn');
  if (dab) dab.onclick = () => {
    const w = $('dictInput').value.trim();
    if (window._goNav) window._goNav('mywords');
    $('wordForm').hidden = false;
    if (w) $('wfWord').value = w;
    setTimeout(() => $('wordForm').scrollIntoView({ behavior: 'smooth' }), 150);
  };
  $('dictBtn').onclick = doDictSearch;
  $('dictInput').addEventListener('input', () => { clearTimeout(window._dt); window._dt = setTimeout(doDictSearch, 300); });
  $('dictInput').addEventListener('keydown', e => { if (e.key === 'Enter') doDictSearch(); });
  const openAddAs = lang => { if (window._goNav) window._goNav('mywords'); $('wordForm').hidden = false; $('wfLang').value = lang; const w = $('dictInput').value.trim(); if (w) $('wfWord').value = w; setTimeout(() => $('wordForm').scrollIntoView({ behavior: 'smooth' }), 150); };
  const daf = $('dictAddFa'); if (daf) daf.onclick = () => openAddAs('fa');
  const dau = $('dictAddUr'); if (dau) dau.onclick = () => openAddAs('ur');
  const dtb = $('dictTextsBtn'); if (dtb) dtb.onclick = editDictTexts;
  applyDictTexts();
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-dictedit]'); if (b) { ev.stopPropagation(); editDictWord(b.dataset.dictedit); } });
}
const PS_ALPHABET = ['ا','ب','پ','ت','ټ','ث','ج','چ','ح','خ','د','ډ','ذ','ر','ړ','ز','ژ','ږ','س','ش','ښ','ص','ض','ط','ظ','ع','غ','ف','ق','ک','ګ','ل','م','ن','ڼ','و','ه','ی','ې'];
function buildDictLetters() {
  const g = $('dictLetters'); if (!g || !LD.length) return;
  const counts = {};
  LD.forEach(e => { const c = e[0].charAt(0); counts[c] = (counts[c] || 0) + 1; });
  const AL = dictAlpha();
  const letters = Object.keys(counts).sort((a, b) => {
    const ia = AL.indexOf(a), ib = AL.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  g.innerHTML = letters.map(l => `<button data-dl="${esc(l)}">${esc(l)}<small>${counts[l].toLocaleString('ur')}</small></button>`).join('');
  g.querySelectorAll('button').forEach(b => b.onclick = () => {
    g.querySelectorAll('button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const L = b.dataset.dl;
    const list = LD.filter(e => e[0].charAt(0) === L);
    const myList = visibleMyWords().concat(communityWords).filter(w => w.word && w.word.charAt(0) === L);
    const box = $('dictBrowse');
    box.innerHTML = `<p class="hint">«${esc(L)}» — ${list.length.toLocaleString('ur')} الفاظ</p>`
      + myList.map(w => `<div class="result-card" data-dictword="${esc(w.word)}"><span class="tag">میرا لفظ</span><div class="w">${esc(w.word)}</div><div class="r">${esc(w.urdu || '')}</div></div>`).join('')
      + list.slice(0, 400).map(e =>
      `<div class="result-card" data-dictword="${esc(ldView(e).w)}"><div class="w">${esc(ldView(e).w)}</div><div class="r">${esc(ldView(e).r)}</div>${ldView(e).ur ? `<div class="m">🇵🇰 ${esc(ldView(e).ur.slice(0, 90))}</div>` : (ldView(e).en ? `<div class="m">🇬🇧 ${esc(ldView(e).en.slice(0, 90))}</div>` : '')}</div>`).join('')
      + (list.length > 400 ? `<p class="hint">… اور ${(list.length - 400).toLocaleString('ur')} الفاظ — اوپر تلاش میں لکھ کر دیکھیں</p>` : '');
    box.querySelectorAll('[data-dictword]').forEach(c => c.onclick = () => openDictWord(c.dataset.dictword));
  });
}
function relatedInf(word) {
  const w = norm(word);
  const out = [];
  for (const e of PS) {
    const p = norm(e[2]);
    const stem = p.endsWith('ل') ? p.slice(0, -1) : p;
    if ((w.includes(stem) && stem.length >= 3) || (stem.includes(w) && w.length >= 3)) {
      out.push(e); if (out.length >= 5) break;
    }
  }
  return out;
}
function ldMeanHtml(e) {
  const v = ldView(e);
  if (!v.ur && !v.en && !v.fa) return '';
  return `<div class="sheet-sec"><h4>📚 ترجمہ${v.edited ? ' <span class="tag">آپ کی تصحیح</span>' : ''}</h4>${v.ur ? `<div class="kv"><b>🇵🇰 اردو</b><span>${esc(v.ur)}</span></div>` : ''}${v.en ? `<div class="kv"><b>🇬🇧 English</b><span dir="ltr">${esc(v.en)}</span></div>` : ''}${v.fa ? `<div class="kv"><b>🇮🇷 فارسی</b><span>${esc(v.fa)}</span></div>` : ''}</div>`;
}
function dictDetailCard(e) {
  const iid = e[2];
  const inf = iid ? PS.find(x => x[0] === iid) : null;
  let detail = '';
  if (inf) {
    detail = `<div class="sheet-sec"><h4>📚 ترجمہ (مصدر)</h4>
      <div class="kv"><b>مصدر</b><span><strong>${esc(inf[2])}</strong> <span class="suggest">${esc(inf[3])}</span></span></div>
      <div class="kv"><b>🇬🇧 English</b><span>${esc(inf[4])}</span></div>
      <div class="kv"><b>🇵🇰 اردو</b><span>${esc(inf[5])}</span></div>
      <div class="kv"><b>🇮🇷 فارسی</b><span>${esc(inf[6])}</span></div>
      <div class="kv"><b></b><span><button class="btn-ghost" onclick="showDetail('ps',${inf[0]})">مکمل تفصیل دیکھیں ⏎</button></span></div></div>`;
  } else {
    /* Not (resolvably) a masdar: never hide glosses the entry actually has —
       render ldMeanHtml whenever any of ur/en/fa is non-empty (the entry's
       own English gloss or the user's written meanings). Only a word with
       genuinely no meanings gets the friendly note. Related masdars and the
       ✏️ تصحیح button below always stay. */
    detail = ldMeanHtml(e);
    if (!detail) detail = `<div class="sheet-sec"><h4>📚 ترجمہ</h4><p class="hint">اس لفظ کا ترجمہ فی الحال دستیاب نہیں — نیچے ✏️ بٹن سے خود لکھ دیں ✍️</p></div>`;
    const rel = relatedInf(e[0]);
    if (rel.length) detail += `<div class="sheet-sec"><h4>متعلقہ مصادر</h4>` + rel.map(r =>
      `<div class="result-card" data-type="ps" data-id="${r[0]}"><div class="w">${esc(r[2])}</div><div class="m">🇵🇰 ${esc(r[5])}</div></div>`).join('') + `</div>`;
  }
  const v = ldView(e);
  return `<div class="sheet-word">${esc(v.w)}</div><div class="sheet-roman">${esc(v.r)}</div>
    <div class="sheet-sec"><h4>تلفظ</h4><div class="kv"><b>رومن</b><span dir="ltr">${esc(v.r)}</span></div></div>${detail}${formsBlockHTML(v.w)}<div style="margin-top:8px"><button class="btn-ghost" data-dictedit="${esc(e[0])}">✏️ تصحیح کریں / معنی لکھیں</button></div>`;
}
function myDictCard(w) {
  return `<div class="card"><div class="sheet-word">${esc(w.word)}</div><div class="sheet-roman">${esc(w.roman || '')}</div>
    <div class="sheet-sec"><h4>📚 ترجمہ — آپ کا شامل کردہ لفظ <span class="tag">میرا لفظ</span></h4>
    ${w.urdu ? `<div class="kv"><b>🇵🇰 اردو</b><span>${esc(w.urdu)}</span></div>` : ''}
    ${w.english ? `<div class="kv"><b>🇬🇧 English</b><span dir="ltr">${esc(w.english)}</span></div>` : ''}
    ${w.farsi ? `<div class="kv"><b>🇮🇷 فارسی</b><span>${esc(w.farsi)}</span></div>` : ''}
    ${w.sentence ? `<div class="kv"><b>مثالی جملہ</b><span>${esc(w.sentence)}</span></div>` : ''}
    ${formsBlockHTML(w.word)}
    <button class="btn-ghost" onclick="showDetail('my','${w.id}')">مکمل تفصیل ⏎</button></div></div>`;
}
function findMyWord(q) {
  const all = visibleMyWords().concat(communityWords);
  return all.find(w => norm(w.word) === q || norm(w.urdu || '') === q || norm(w.farsi || '') === q || latin(w.english || '') === latin(q));
}
/* ---- dictionary corrections & meanings written by the user ---- */
let dictEdits = {};
try { dictEdits = JSON.parse(localStorage.getItem('masdar_dict_edits') || '{}'); } catch (e) { dictEdits = {}; }
function saveDictEdits() { localStorage.setItem('masdar_dict_edits', JSON.stringify(dictEdits)); }
function toast(msg) {
  let t = document.getElementById('toastEl');
  if (!t) {
    t = document.createElement('div'); t.id = 'toastEl';
    t.style.cssText = 'position:fixed;bottom:86px;left:50%;transform:translateX(-50%);background:#14532d;color:#fff;padding:10px 18px;border-radius:999px;font-size:15px;z-index:9999;box-shadow:0 4px 18px rgba(0,0,0,.3);opacity:0;transition:opacity .25s;pointer-events:none;max-width:88vw;text-align:center';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(window._toastT); window._toastT = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}
function ldView(e) {
  const ov = dictEdits[e[0]] || {};
  return { w: ov.word || e[0], r: (ov.roman !== undefined ? ov.roman : e[1]), en: (ov.english !== undefined ? ov.english : (e[3] || '')), ur: ov.urdu || '', fa: ov.farsi || '', edited: Object.keys(ov).length > 0 };
}
function resolveDictWord(q) {
  for (const k in dictEdits) {
    const ov = dictEdits[k];
    if (norm(ov.word || k) === q || norm(ov.urdu || '') === q || norm(ov.farsi || '') === q) {
      const e = LD.find(x => x[0] === k); if (e) return e;
    }
  }
  return null;
}
function editDictWord(orig) {
  const e = LD.find(x => x[0] === orig); if (!e) return;
  const ov = dictEdits[orig] || {};
  const F = (id, label, val, dir) => `<label>${label}<input id="${id}" value="${esc(val || '')}"${dir ? ' dir="' + dir + '"' : ''}></label>`;
  openSheet(`<h3 style="margin:0 0 6px">✏️ لغت — تصحیح / معنی لکھیں</h3>
    <p class="hint">اصل لفظ: <b>${esc(orig)}</b> — اردو اور فارسی کے معنی بھی لکھ سکتے ہیں۔ آپ کی تصحیح اسی فون میں محفوظ رہے گی اور ایکسپورٹ فائل میں بھی شامل ہو گی، تاکہ نئے ورژن میں سب کے لیے شامل کی جا سکے۔</p>
    ${F('deWord', 'لفظ (درست املا لکھیں)', ov.word || orig)}
    ${F('deRoman', 'رومن تلفظ', ov.roman !== undefined ? ov.roman : e[1], 'ltr')}
    ${F('deUrdu', '🇵🇰 اردو معنی', ov.urdu)}
    ${F('deEnglish', '🇬🇧 English meaning', ov.english !== undefined ? ov.english : (e[3] || ''), 'ltr')}
    ${F('deFarsi', '🇮🇷 فارسی معنی', ov.farsi)}
    <div class="row" style="margin-top:10px"><button class="btn-primary grow" id="deSave">💾 محفوظ کریں</button>
    ${Object.keys(ov).length ? '<button class="btn-ghost" id="deClear">تصحیح ختم کریں</button>' : ''}</div>`);
  $('deSave').onclick = () => {
    const rec = { word: $('deWord').value.trim(), roman: $('deRoman').value.trim(), urdu: $('deUrdu').value.trim(), english: $('deEnglish').value.trim(), farsi: $('deFarsi').value.trim() };
    if (!rec.word) { toast('لفظ خالی نہیں ہو سکتا'); return; }
    dictEdits[orig] = rec; saveDictEdits(); closeSheet(); toast('محفوظ ہو گیا ✅');
    $('dictInput').value = rec.word; doDictSearch();
  };
  const dc = $('deClear');
  if (dc) dc.onclick = () => { delete dictEdits[orig]; saveDictEdits(); closeSheet(); toast('تصحیح ختم ہو گئی'); doDictSearch(); };
}
/* ---- dictionary page intro texts & alphabet (editable) ---- */
let dictTexts = {};
try { dictTexts = JSON.parse(localStorage.getItem('masdar_dict_texts') || '{}'); } catch (e) { dictTexts = {}; }
const DICT_TEXT_DEFAULTS = { placeholder: 'پښتو او انګرېزۍ ويی وليکئ', heroHint: 'پښتو او انګرېزۍ ويی وليکئ', lettersTitle: 'د تورو په لحاظ وييونه وګورئ', lettersHintA: 'کوم يو ويی وکاږئ - د هغه توري نه پيل شوی ويی به مخې ته در شي', lettersHintB: 'ويی کاږلو سره به يې مانا مخې ته راشي' };
function applyDictTexts() {
  const t = Object.assign({}, DICT_TEXT_DEFAULTS, dictTexts);
  const di = $('dictInput'); if (di) di.placeholder = t.placeholder;
  const hh = $('dictHeroHint'); if (hh) hh.textContent = t.heroHint;
  const lt = $('dictLettersTitle'); if (lt) lt.textContent = t.lettersTitle;
  const ha = $('dictLettersHintA'); if (ha) ha.textContent = t.lettersHintA;
  const hb = $('dictLettersHintB'); if (hb) hb.textContent = t.lettersHintB;
}
function dictAlpha() {
  const s = (localStorage.getItem('masdar_dict_alpha') || '').trim();
  if (s) { const arr = s.split(/\s+/).filter(Boolean); if (arr.length >= 10) return arr; }
  return PS_ALPHABET;
}
function editDictTexts() {
  const t = Object.assign({}, DICT_TEXT_DEFAULTS, dictTexts);
  const F = (id, label, val) => `<label>${label}<input id="${id}" value="${esc(val || '')}"></label>`;
  openSheet(`<h3 style="margin:0 0 6px">✏️ لغت — تعارفی الفاظ و حروف درست کریں</h3>
    <p class="hint">لغت والے صفحے کی ہدایات اور حروف تہجی کی ترتیب یہاں سے درست کریں — تبدیلیاں اسی فون میں محفوظ رہیں گی اور ایکسپورٹ میں بھی شامل ہوں گی۔</p>
    ${F('dtPlaceholder', 'تلاش خانے کی رہنمائی', t.placeholder)}
    ${F('dtHeroHint', 'اوپر والی ہدایت', t.heroHint)}
    ${F('dtLettersTitle', 'حروف والا عنوان (پشتو)', t.lettersTitle)}
    ${F('dtLettersHintA', 'حروف کی ہدایت — پہلی سطر', t.lettersHintA)}
    ${F('dtLettersHintB', 'حروف کی ہدایت — دوسری سطر', t.lettersHintB)}
    <label>حروف تہجی کی ترتیب (خالی جگہ سے الگ کریں)<textarea id="dtAlpha" style="min-height:56px">${esc(dictAlpha().join(' '))}</textarea></label>
    <div class="row" style="margin-top:10px"><button class="btn-primary grow" id="dtSave">💾 محفوظ کریں</button><button class="btn-ghost" id="dtReset">اصل حالت پر واپس</button></div>`);
  $('dtSave').onclick = () => {
    dictTexts = { placeholder: $('dtPlaceholder').value.trim(), heroHint: $('dtHeroHint').value.trim(), lettersTitle: $('dtLettersTitle').value.trim(), lettersHintA: $('dtLettersHintA').value.trim(), lettersHintB: $('dtLettersHintB').value.trim() };
    localStorage.setItem('masdar_dict_texts', JSON.stringify(dictTexts));
    localStorage.setItem('masdar_dict_alpha', $('dtAlpha').value.trim());
    applyDictTexts(); buildDictLetters(); closeSheet(); toast('محفوظ ہو گیا ✅');
  };
  $('dtReset').onclick = () => { dictTexts = {}; localStorage.removeItem('masdar_dict_texts'); localStorage.removeItem('masdar_dict_alpha'); applyDictTexts(); buildDictLetters(); closeSheet(); toast('اصل حالت بحال ہو گئی'); };
}
function openDictWord(wtxt) {
  const q = norm(wtxt);
  const mine = findMyWord(q);
  if (mine) { openSheet(myDictCard(mine)); bindCards($('sheetBody')); return; }
  let e = LD.find(x => norm(x[0]) === q);
  if (!e) e = resolveDictWord(q);
  if (e) { openSheet(dictDetailCard(e)); bindCards($('sheetBody')); return; }
  $('dictInput').value = wtxt; doDictSearch();
}
function doDictSearch() {
  const raw = $('dictInput').value;
  const q = norm(raw);
  const box = $('dictResults');
  if (q.length < 1) { box.innerHTML = ''; return; }
  // user's own added words first — the dictionary includes them
  const mine = findMyWord(q);
  if (mine) { box.innerHTML = myDictCard(mine); bindCards(box); return; }
  // exact match first (incl. the user's corrected spellings and Urdu/Farsi meanings)
  let exact = LD.find(e => norm(e[0]) === q);
  if (!exact) exact = resolveDictWord(q);
  if (exact) {
    const v = ldView(exact);
    const editBtn = `<div style="margin-top:8px"><button class="btn-ghost" data-dictedit="${esc(exact[0])}">✏️ تصحیح کریں / معنی لکھیں</button></div>`;
    box.innerHTML = `<div class="card"><div class="sheet-word">${esc(v.w)}</div><div class="sheet-roman">${esc(v.r)}</div>`
      + (exact[2] ? (() => { const inf = PS.find(x => x[0] === exact[2]); return inf ?
        `<div class="sheet-sec"><h4>📚 ترجمہ</h4>
        <div class="kv"><b>🇬🇧 English</b><span>${esc(inf[4])}</span></div>
        <div class="kv"><b>🇵🇰 اردو</b><span>${esc(inf[5])}</span></div>
        <div class="kv"><b>🇮🇷 فارسی</b><span>${esc(inf[6])}</span></div>
        <button class="btn-ghost" onclick="showDetail('ps',${inf[0]})">مکمل تفصیل ⏎</button>${editBtn}</div>` : ''; })()
        : (() => { const rel = relatedInf(exact[0]); const has = v.ur || v.en || v.fa; return (has ? `<div class="sheet-sec"><h4>📚 ترجمہ${v.edited ? ' <span class="tag">آپ کی تصحیح</span>' : ''}</h4>${v.ur ? `<div class="kv"><b>🇵🇰 اردو</b><span>${esc(v.ur)}</span></div>` : ''}${v.en ? `<div class="kv"><b>🇬🇧 English</b><span dir="ltr">${esc(v.en)}</span></div>` : ''}${v.fa ? `<div class="kv"><b>🇮🇷 فارسی</b><span>${esc(v.fa)}</span></div>` : ''}</div>` : `<p class="hint">اس لفظ کا معنی فی الحال دستیاب نہیں — نیچے والے بٹن سے خود لکھ دیں ✍️</p>`) + editBtn + (rel.length ? `<h4>متعلقہ مصادر</h4>` + rel.map(r => `<div class="result-card" data-type="ps" data-id="${r[0]}"><div class="w">${esc(r[2])}</div><div class="m">🇵🇰 ${esc(r[5])}</div></div>`).join('') : ''); })())
      + `</div>`;
    bindCards(box);
    return;
  }
  // Urdu / Farsi meaning match against the masdars
  const psm = PS.find(e => norm(e[5]) === q || norm(e[6]) === q);
  if (psm) { box.innerHTML = `<p class="hint">اردو/فارسی معنی سے ملا لفظ:</p>` + psCard(psm); bindCards(box); return; }
  // English meaning search (e.g. "sister", "book") — best matches first:
  // meanings starting with the word, then whole-word matches, then partial ones
  const ql = raw.trim().toLowerCase();
  if (ql.length >= 2 && /[a-z]/.test(ql)) {
    const esc2 = ql.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRe = new RegExp('(^|[^a-z])' + esc2 + '([^a-z]|$)', 'i');
    const t1 = [], t2 = [], t3 = [];
    for (const e of LD) {
      const ovE = dictEdits[e[0]];
      const mtxt = (ovE && ovE.english !== undefined) ? ovE.english : e[3];
      if (!mtxt) continue;
      const m = mtxt.toLowerCase();
      if (!m.includes(ql)) continue;
      if (m.startsWith(ql)) t1.push(e);
      else if (wordRe.test(m)) t2.push(e);
      else t3.push(e);
    }
    const en = t1.concat(t2, t3).slice(0, 25);
    if (en.length) {
      box.innerHTML = `<p class="hint">«${esc(raw)}» — انگریزی معنی سے ملے الفاظ:</p>` + en.map(e =>
        `<div class="result-card" data-dictword="${esc(ldView(e).w)}"><div class="w">${esc(ldView(e).w)}</div><div class="r">${esc(ldView(e).r)}</div><div class="m">🇬🇧 ${esc((((dictEdits[e[0]] || {}).english) || e[3] || '').slice(0, 90))}</div></div>`).join('');
      box.querySelectorAll('[data-dictword]').forEach(c => c.onclick = () => openDictWord(c.dataset.dictword));
      bindCards(box);
      return;
    }
  }
  // no exact match: suggestions
  const lq = latin(q);
  const sug = [];
  for (const e of LD) {
    if (norm(e[0]).includes(q) || latin(e[1]).includes(lq)) { sug.push(e); if (sug.length >= 12) break; }
  }
  const mySug = visibleMyWords().concat(communityWords).filter(w => norm(w.word).includes(q) || norm(w.urdu || '').includes(q) || norm(w.farsi || '').includes(q));
  box.innerHTML = `<div class="empty">«${esc(raw)}» نہیں ملا 😕</div>` +
    (mySug.length ? `<p class="hint">آپ کے شامل کردہ الفاظ میں:</p>` + mySug.map(w =>
      `<div class="result-card" data-dictword="${esc(w.word)}"><div class="w">${esc(w.word)}</div><div class="r">${esc(w.urdu || '')}</div></div>`).join('') : '') +
    (sug.length ? `<p class="hint">شاید آپ کا مطلب:</p>` + sug.map(e =>
      `<div class="result-card" data-dictword="${esc(e[0])}"><div class="w">${esc(e[0])}</div><div class="r">${esc(e[1])}</div></div>`).join('') : '') +
    `<button class="btn-ghost" onclick="document.getElementById('dictAddBtn').click()">＋ «${esc(raw)}» کو لغت میں شامل کریں</button>` +
    `<button class="btn-primary" style="margin-top:8px" onclick="window._goNav && window._goNav('online')">🌐 Qamosona پر آنلائن تلاش کریں</button>`;
  box.querySelectorAll('[data-dictword]').forEach(c => c.onclick = () => openDictWord(c.dataset.dictword));
  bindCards(box);
}
function initSearch() {
  document.querySelectorAll('.dict-tabs [data-dict]').forEach(b => b.onclick = () => {
    document.querySelectorAll('.dict-tabs [data-dict]').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); dictFilter = b.dataset.dict; doSearch();
  });
  $('searchBtn').onclick = doSearch;
  $('searchInput').addEventListener('input', () => { clearTimeout(window._st); window._st = setTimeout(doSearch, 300); });
  $('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}
function doSearch() {
  const q = norm($('searchInput').value);
  const box = $('searchResults');
  if (q.length < 1) { box.innerHTML = ''; return; }
  const out = [];
  if (dictFilter !== 'fa') for (const e of PS) {
    if (norm(e[2]).includes(q) || latin(e[3]).includes(latin(q)) || norm(e[4]).toLowerCase().includes(q.toLowerCase()) || norm(e[5]).includes(q) || norm(e[6]).includes(q)) {
      out.push(psCard(e)); if (out.length >= 60) break;
    }
  }
  if (dictFilter !== 'ps' && out.length < 60) for (const e of FA) {
    if (norm(e[1]).includes(q) || latin(e[2]).includes(latin(q)) || norm(e[3]).toLowerCase().includes(q.toLowerCase()) || norm(e[4]).includes(q)) {
      out.push(faCard(e)); if (out.length >= 60) break;
    }
  }
  for (const w of visibleMyWords()) {
    if (norm(w.word).includes(q) || norm(w.urdu).includes(q) || latin(w.english || '').includes(latin(q)))
      out.unshift(myCard(w));
  }
  for (const w of communityWords) {
    if (q && (norm(w.word).includes(q) || norm(w.urdu||'').includes(q) || norm(w.english||'').includes(q) || norm(w.roman||'').includes(q))) out.unshift(myCard(w));
  }
  box.innerHTML = out.length ? out.join('') : '<div class="empty">کوئی نتیجہ نہیں ملا 😕</div>';
  bindCards(box);
}
function psCard(e) {
  const kind = verbKind(e[2]);
  return `<div class="result-card" data-type="ps" data-id="${e[0]}"><span class="tag">پشتو</span>
    <div class="w">${esc(e[2])}</div><div class="r">${esc(e[3])}</div>
    <div class="m">🇬🇧 ${esc(e[4])}<br>🇵🇰 ${esc(e[5])}<br>🇮🇷 ${esc(e[6])}${kind ? '<br>🔤 فعل کی قسم: ' + esc(kind) : ''}</div></div>`;
}
function faCard(e) {
  return `<div class="result-card" data-type="fa" data-id="${e[0]}"><span class="tag">فارسی</span>
    <div class="w">${esc(e[1])}</div><div class="r">${esc(e[2])}</div>
    <div class="m">🇬🇧 ${esc(e[3])}<br>🇵🇰 ${esc(e[4])}</div></div>`;
}
function myCard(w) {
  return `<div class="result-card" data-type="my" data-id="${w.id}"><span class="tag">میرا لفظ</span>
    <div class="w">${esc(w.word)}</div><div class="m">🇵🇰 ${esc(w.urdu || '')}<br>🇬🇧 ${esc(w.english || '')}</div></div>`;
}
function bindCards(box) {
  box.querySelectorAll('.result-card').forEach(c => {
    /* لغت cards carry data-dictword and open via openDictWord — never
       overwrite their handler with showDetail(undefined, undefined). */
    if (c.hasAttribute('data-dictword') || !c.dataset.type) return;
    c.onclick = () => showDetail(c.dataset.type, c.dataset.id);
  });
}
function showRandom() {
  const e = PS[Math.floor(Math.random() * PS.length)];
  const box = $('randomWord');
  box.hidden = false;
  box.innerHTML = `<div style="font-size:13px">🎲 آج کا لفظ</div><div class="w">${esc(e[2])}</div><div>${esc(e[5])} — ${esc(e[4])}</div>`;
  box.onclick = () => showDetail('ps', e[0]);
}


/* ---------- tap any word for meaning ---------- */
function tapWords(text) {
  return String(text || '').split(/(\s+)/).map(tok => {
    if (!tok.trim()) return esc(tok);
    const clean = tok.replace(/[.,!?؟،؛:"«»()\[\]/\-]/g, '');
    if (!clean) return esc(tok);
    return `<span class="tapw" data-w="${esc(clean)}">${esc(tok)}</span>`;
  }).join('');
}
function lookupWord(q) {
  q = norm(q);
  if (!q) return null;
  let e = FA.find(x => norm(x[1]) === q);
  if (e) return {type: 'fa', id: e[0]};
  e = PS.find(x => norm(x[2]) === q);
  if (e) return {type: 'ps', id: e[0]};
  const l = LD.find(x => norm(x[0]) === q);
  if (l) return {type: 'ld', w: l};
  return null;
}
function tapWordMeaning(word) {
  const r = lookupWord(word);
  if (!r) {
    openSheet(`<div class="sheet-word">${esc(word)}</div><p class="hint" style="text-align:center">اس لفظ کا ترجمہ نہیں ملا 😕<br>املا چیک کر کے دوبارہ ٹچ کریں</p>`);
    return;
  }
  if (r.type === 'ld') {
    const e = r.w;
    const inf = e[2] ? PS.find(x => x[0] === e[2]) : null;
    openSheet(`<div class="sheet-word">${esc(e[0])}</div><div class="sheet-roman">${esc(e[1])}</div>` +
      (inf ? `<div class="sheet-sec"><h4>📚 ترجمہ</h4><div class="kv"><b>🇬🇧</b><span>${esc(inf[4])}</span></div><div class="kv"><b>🇵🇰</b><span>${esc(inf[5])}</span></div></div>` : (e[3] ? ldMeanHtml(e) : `<p class="hint" style="text-align:center">ترجمہ دستیاب نہیں</p>`)));
  } else showDetail(r.type, r.id);
}
document.addEventListener('click', e => {
  const t = e.target.closest ? e.target.closest('.tapw') : null;
  if (t && t.dataset.w) { e.stopPropagation(); tapWordMeaning(t.dataset.w); }
});


/* ---------- entry correction (user can fix infinitives) ---------- */
function getEntryFix() { try { return JSON.parse(localStorage.getItem('masdar_entryfix') || '{}'); } catch (e) { return {}; } }
function saveEntryFix(d) { localStorage.setItem('masdar_entryfix', JSON.stringify(d)); }
function applyAllEntryFixes() {
  const fx = getEntryFix();
  const ap = (arr, pfx) => arr.map(e => {
    const f = fx[pfx + e[0]];
    if (!f) return e;
    const c = e.slice();
    for (const k in f) c[+k] = f[k];
    return c;
  });
  PS = ap(PS, 'ps_'); FA = ap(FA, 'fa_');
}
const PS_FIELDS = [[2, 'مصدر (پشتو)'], [3, 'رومن'], [4, 'English'], [5, 'اردو'], [6, 'فارسی']];
const FA_FIELDS = [[1, 'مصدر (فارسی)'], [2, 'رومن'], [3, 'English'], [4, 'اردو'], [5, 'مثال (فارسی)'], [6, 'مثال (English)'], [7, 'مثال (اردو)'], [8, 'بن ماضی'], [9, 'بن مضارع'], [13, 'نوٹ']];
let _eeType = null, _eeId = null, _eeOrig = {};
function openEntryEditor(type, id) {
  _eeType = type; _eeId = id;
  const e = (type === 'ps' ? PS.find(x => x[0] == id) : FA.find(x => x[0] == id));
  if (!e) return;
  const fields = type === 'ps' ? PS_FIELDS : FA_FIELDS;
  _eeOrig = {};
  fields.forEach(([i]) => _eeOrig[i] = e[i] == null ? '' : String(e[i]));
  const h = `<div class="sheet-word" style="font-size:22px">${esc(String(e[type === 'ps' ? 2 : 1]))}</div>
    <p class="hint" style="text-align:center">مصدر کی تصحیح کریں — صرف بدلی ہوئی چیزیں محفوظ ہوں گی</p>
    <div class="card">` +
    fields.map(([i, lbl]) => `<label>${lbl}<input data-ef="${i}" value="${esc(_eeOrig[i])}" ${i === 4 || i === 3 || i === 6 ? 'dir="ltr"' : ''}></label>`).join('') +
    `</div>
    <div class="form-actions">
      <button class="btn-primary" onclick="eeSave()">💾 محفوظ کریں</button>
      <button class="btn-ghost" onclick="showDetail('${type}', '${id}')">منسوخ</button>
    </div>`;
  openSheet(h);
}
window.eeSave = () => {
  const fields = _eeType === 'ps' ? PS_FIELDS : FA_FIELDS;
  const store = getEntryFix();
  const key = _eeType + '_' + _eeId;
  const cur = store[key] || {};
  document.querySelectorAll('[data-ef]').forEach(inp => {
    const i = inp.dataset.ef, v = inp.value;
    if (v !== _eeOrig[i]) { if (v.trim() === '' && _eeOrig[i] === '') delete cur[i]; else cur[i] = v; }
    else delete cur[i];
  });
  if (Object.keys(cur).length) store[key] = cur; else delete store[key];
  saveEntryFix(store);
  applyAllEntryFixes();
  showDetail(_eeType, _eeId);
};
window.openEntryEditor = openEntryEditor;

/* ---------- grammar correction ---------- */
function getGrammarFix() { try { return JSON.parse(localStorage.getItem('masdar_grammarfix') || '{}'); } catch (e) { return {}; } }
function saveGrammarFix(d) { localStorage.setItem('masdar_grammarfix', JSON.stringify(d)); }
let _geSrc = null, _geIdx = null;
function openGrammarEditor(src, idx) {
  _geSrc = src; _geIdx = idx;
  const gf = getGrammarFix();
  const base = src === 'ps' ? GRAMMAR_PS[idx] : DEFAULT_GRAMMAR[idx];
  const f = gf[src + '_' + idx] || {};
  const t = f.t !== undefined ? f.t : base.t;
  const b = f.b !== undefined ? f.b : base.b;
  openSheet(`<h3 style="text-align:center">✏️ گرامر کی تصحیح</h3>
    <div class="card">
      <label>عنوان<input id="geTitle" value="${esc(t)}"></label>
      <label>تفصیل<textarea id="geBody" rows="8">${esc(b)}</textarea></label>
    </div>
    <div class="form-actions">
      <button class="btn-primary" onclick="geSave()">💾 محفوظ کریں</button>
      <button class="btn-ghost" onclick="geReset()">↩ اصل بحال کریں</button>
      <button class="btn-ghost" onclick="closeSheet()">منسوخ</button>
    </div>`);
}
window.geSave = () => {
  const t = $('geTitle').value.trim(), b = $('geBody').value.trim();
  if (!t || !b) { alert('عنوان اور تفصیل دونوں لکھیں!'); return; }
  const gf = getGrammarFix();
  gf[_geSrc + '_' + _geIdx] = { t, b };
  saveGrammarFix(gf); closeSheet(); renderGrammar();
};
window.geReset = () => {
  const gf = getGrammarFix();
  delete gf[_geSrc + '_' + _geIdx];
  saveGrammarFix(gf); closeSheet(); renderGrammar();
};
window.openGrammarEditor = openGrammarEditor;

/* ---------- conjugation editor (user can write & correct) ---------- */
function getCustomConj() { try { return JSON.parse(localStorage.getItem('masdar_conj') || '{}'); } catch (e) { return {}; } }
function saveCustomConj(d) { localStorage.setItem('masdar_conj', JSON.stringify(d)); }
function getMergedConj(type, e) {
  const idx = type === 'ps' ? 7 : 14;
  const base = (e[idx] || []).map(t => ({name: t[0], ur: t[1], en: t[2], rows: t[3].map(r => r.slice()), custom: false}));
  const c = getCustomConj()[type + '_' + e[0]];
  if (!c) return base;
  let out = base.filter(t => !(c.hide || []).includes(t.name));
  (c.tenses || []).forEach(ct => {
    const nt = {name: ct.name, ur: ct.ur, en: ct.en, rows: ct.rows.map(r => r.slice()), custom: true};
    const i = out.findIndex(t => t.name === ct.name);
    if (i >= 0) out[i] = nt; else out.push(nt);
  });
  return out;
}
function renderConjTables(tenses) {
  return tenses.map(t =>
    `<h4 style="margin-top:10px">${esc(t.name)}${t.ur && t.ur !== t.name ? ' — ' + esc(t.ur) : ''}${t.en ? ' — ' + esc(t.en) : ''}${t.custom ? ' <span class="tag">میرا</span>' : ''}</h4>` +
    t.rows.map(r => {
      const parts = [];
      if (r[0]) parts.push(esc(r[0]));
      if (r[3]) parts.push(esc(r[3]));
      if (r[2]) parts.push(`<span dir="ltr">${esc(r[2])}</span>`);
      const tail = parts.length ? ' — ' + parts.join(' · ') : '';
      return `<p dir="rtl" style="margin:0;padding:7px 0;border-bottom:1px dashed rgba(127,127,127,.35);font-size:16px;line-height:1.9"><strong>${esc(r[1] || '')}</strong>${tail}</p>`;
    }).join('')).join('');
}
let _ceType = null, _ceId = null;
function openConjEditor(type, id) {
  _ceType = type; _ceId = id;
  const e = (type === 'ps' ? PS.find(x => x[0] == id) : FA.find(x => x[0] == id));
  if (!e) return;
  const word = type === 'ps' ? e[2] : e[1];
  const tenses = getMergedConj(type, e);
  let h = `<div class="sheet-word" style="font-size:24px">${esc(word)}</div>
    <p class="hint" style="text-align:center">گردانیں لکھیں یا درست کریں — محفوظ کرنے پر یہ آپ کے فون میں رہیں گی</p>
    <div id="ceList">` +
    tenses.map((t, ti) => `
    <div class="card" data-ti="${ti}">
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input data-f="name" value="${esc(t.name)}" placeholder="زمانہ (مثلاً ماضی)" style="flex:1">
        <button class="btn-ghost" onclick="ceDelTense(${ti})" style="margin:0;padding:6px 12px">🗑</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input data-f="ur" value="${esc(t.ur || '')}" placeholder="اردو نام" style="flex:1">
        <input data-f="en" value="${esc(t.en || '')}" placeholder="English name" dir="ltr" style="flex:1">
      </div>
      <div data-rows>` +
      t.rows.map((r, ri) => `
        <div class="ce-row" data-ri="${ri}" style="border:1px solid var(--line);border-radius:10px;padding:8px;margin:6px 0">
          <div style="display:flex;gap:6px">
            <input data-c="0" value="${esc(r[0])}" placeholder="ضمیر" style="flex:1">
            <input data-c="1" value="${esc(r[1])}" placeholder="لفظ" style="flex:2">
          </div>
          <div style="display:flex;gap:6px;margin-top:6px">
            <input data-c="3" value="${esc(r[3])}" placeholder="اردو" style="flex:1">
            <input data-c="2" value="${esc(r[2])}" placeholder="English" dir="ltr" style="flex:1">
            <button class="btn-ghost" onclick="ceDelRow(${ti},${ri})" style="margin:0;padding:4px 10px">✕</button>
          </div>
        </div>`).join('') +
      `</div>
      <button class="btn-ghost" onclick="ceAddRow(${ti})">＋ قطار</button>
    </div>`).join('') +
    `</div>
    <button class="btn-ghost" onclick="ceAddTense()">＋ نیا زمانہ شامل کریں</button>
    <div class="form-actions">
      <button class="btn-primary" onclick="ceSave()">💾 محفوظ کریں</button>
      <button class="btn-ghost" onclick="showDetail('${type}', '${id}')">منسوخ</button>
    </div>`;
  openSheet(h);
}
window.ceDelTense = ti => { document.querySelector(`#ceList [data-ti="${ti}"]`).remove(); };
window.ceDelRow = (ti, ri) => { document.querySelector(`#ceList [data-ti="${ti}"] [data-ri="${ri}"]`).remove(); };
window.ceAddRow = ti => {
  const box = document.querySelector(`#ceList [data-ti="${ti}"] [data-rows]`);
  const div = document.createElement('div');
  div.className = 'ce-row'; div.style.cssText = 'border:1px solid var(--line);border-radius:10px;padding:8px;margin:6px 0';
  div.innerHTML = `<div style="display:flex;gap:6px"><input data-c="0" placeholder="ضمیر" style="flex:1"><input data-c="1" placeholder="لفظ" style="flex:2"></div><div style="display:flex;gap:6px;margin-top:6px"><input data-c="3" placeholder="اردو" style="flex:1"><input data-c="2" placeholder="English" dir="ltr" style="flex:1"><button class="btn-ghost" onclick="this.parentElement.parentElement.remove()" style="margin:0;padding:4px 10px">✕</button></div>`;
  box.appendChild(div);
};
window.ceAddTense = () => {
  const list = $('ceList');
  const ti = list.children.length;
  const div = document.createElement('div');
  div.className = 'card'; div.dataset.ti = ti;
  div.innerHTML = `<div style="display:flex;gap:6px;margin-bottom:8px"><input data-f="name" placeholder="زمانہ (مثلاً ماضی)" style="flex:1"><button class="btn-ghost" onclick="this.parentElement.parentElement.remove()" style="margin:0;padding:6px 12px">🗑</button></div><div style="display:flex;gap:6px;margin-bottom:8px"><input data-f="ur" placeholder="اردو نام" style="flex:1"><input data-f="en" placeholder="English name" dir="ltr" style="flex:1"></div><div data-rows></div><button class="btn-ghost" onclick="ceAddRow(${ti})">＋ قطار</button>`;
  list.appendChild(div);
  div.scrollIntoView({behavior: 'smooth'});
};
window.ceSave = () => {
  const tenses = [];
  document.querySelectorAll('#ceList .card').forEach(card => {
    const name = card.querySelector('[data-f="name"]').value.trim();
    if (!name) return;
    const ur = card.querySelector('[data-f="ur"]').value.trim();
    const en = card.querySelector('[data-f="en"]').value.trim();
    const rows = [];
    card.querySelectorAll('[data-rows] .ce-row').forEach(rr => {
      const g = i => (rr.querySelector(`[data-c="${i}"]`) || {}).value || '';
      if (g(1).trim()) rows.push([g(0).trim(), g(1).trim(), g(2).trim(), g(3).trim()]);
    });
    if (rows.length) tenses.push({name, ur, en, rows});
  });
  const store = getCustomConj();
  store[_ceType + '_' + _ceId] = {tenses};
  saveCustomConj(store);
  showDetail(_ceType, _ceId);
};
window.openConjEditor = openConjEditor;

/* ---------- detail sheet ---------- */
function showDetail(type, id) {
  if (type === 'ps') {
    const e = PS.find(x => x[0] == id); if (!e) return;
    let h = `
      <div class="sheet-word">${esc(e[2])}</div><div class="sheet-roman">${esc(e[3])}</div>
      <div class="sheet-sec"><h4>معانی</h4>
        <div class="kv"><b>🇬🇧 English</b><span>${esc(e[4])}</span></div>
        <div class="kv"><b>🇵🇰 اردو</b><span>${esc(e[5])}</span></div>
        <div class="kv"><b>🇮🇷 فارسی</b><span>${esc(e[6])}</span></div>
        ${verbKind(e[2]) ? `<div class="kv"><b>فعل کی قسم</b><span>${esc(verbKind(e[2]))}</span></div>` : ''}
        <div class="kv"><b>حرف</b><span>${esc(e[1])} — نمبر ${e[0]}</span></div>
      </div>`;
    const pc = getMergedConj('ps', e);
    if (pc && pc.length) {
      h += `<div class="sheet-sec"><h4>گردانیں</h4>` + renderConjTables(pc) + `</div>`;
    }
    h += renderGardananBlock(e[2]);
    h += formsBlockHTML(e[2]);
    h += `<div style="display:flex;gap:8px"><button class="btn-ghost" style="flex:1;margin:0" onclick="openEntryEditor('ps', '${e[0]}')">✏️ مصدر درست کریں</button><button class="btn-ghost" style="flex:1;margin:0" onclick="openConjEditor('ps', '${e[0]}')">✏️ گردانیں لکھیں / درست کریں</button></div>`;
    openSheet(h);
  } else if (type === 'fa') {
    const e = FA.find(x => x[0] == id); if (!e) return;
    const [n, inf, roman, en, ur, exFa, exEn, exUr, bm, bz, fields, shahed, foot, noe, conj] = e;
    let h = `<div class="sheet-word">${esc(inf)}</div><div class="sheet-roman">${esc(roman)}</div>
      <div class="sheet-sec"><h4>معانی</h4>
        <div class="kv"><b>🇬🇧 English</b><span>${esc(en)}</span></div>
        <div class="kv"><b>🇵🇰 اردو</b><span>${esc(ur)}</span></div>
        ${noe ? `<div class="kv"><b>قسم</b><span>${esc(noe)}</span></div>` : ''}
        <div class="kv"><b>بن ماضی</b><span>${esc(bm)}</span></div>
        <div class="kv"><b>بن مضارع</b><span>${esc(bz)}</span></div></div>`;
    if (exFa) h += `<div class="sheet-sec"><h4>مثال</h4><p class="hint">👆 کسی بھی لفظ کو چھو کر معنی دیکھیں</p><div class="verse">${tapWords(exFa)}<br><span class="poet">🇵🇰</span> ${esc(exUr)}<br><span class="poet">🇬🇧</span> ${esc(exEn)}</div></div>`;
    if (fields && fields.length) {
      h += `<div class="sheet-sec"><h4>مشتقات</h4>` + fields.map(f => {
        const fw = String(f[1] || '').replace(/[.,!?؟،؛:"«»()\[\]/\-]/g, '').trim();
        return `<div class="kv"><b>${esc(f[0])}</b><span>${fw ? `<span class="tapw" data-w="${esc(fw)}">${esc(f[1])}</span>` : esc(f[1])}${f[3] ? ' — ' + esc(f[3]) : ''}${f[2] ? ' <span class="suggest">(' + esc(f[2]) + ')</span>' : ''}</span></div>`;
      }).join('') + `</div>`;
    }
    const mc = getMergedConj('fa', e);
    if (mc && mc.length) {
      h += `<div class="sheet-sec"><h4>گردانیں</h4>` + renderConjTables(mc) + `</div>`;
    }
    h += renderGardananBlock(inf);
    h += `<div style="display:flex;gap:8px"><button class="btn-ghost" style="flex:1;margin:0" onclick="openEntryEditor('fa', '${e[0]}')">✏️ مصدر درست کریں</button><button class="btn-ghost" style="flex:1;margin:0" onclick="openConjEditor('fa', '${e[0]}')">✏️ گردانیں لکھیں / درست کریں</button></div>`;
    if (shahed && shahed.length) {
      h += `<div class="sheet-sec"><h4>اشعار (شاہد)</h4>` + shahed.map(s =>
        `<div class="verse">${s[0] ? `<span class="poet">${esc(s[0])}</span><br>` : ''}${tapWords(s[1])}<br><span class="poet">🇵🇰</span> ${esc(s[2])}<br><span class="poet">🇬🇧</span> ${esc(s[3])}</div>`).join('') + `</div>`;
    }
    if (foot) h += `<div class="sheet-sec"><h4>حاشیہ</h4><p>${esc(foot)}</p></div>`;
    openSheet(h);
  } else if (type === 'my') {
    const w = myWords.find(x => x.id == id) || communityWords.find(x => x.id == id); if (!w) return;
    openSheet(`<div class="sheet-word">${esc(w.word)}</div><div class="sheet-roman">${esc(w.roman || '')}</div>
      <div class="sheet-sec"><h4>معانی</h4>
        <div class="kv"><b>🇵🇰 اردو</b><span>${esc(w.urdu || '')}</span></div>
        <div class="kv"><b>🇬🇧 English</b><span>${esc(w.english || '')}</span></div>
        ${w.farsi ? `<div class="kv"><b>🇮🇷 فارسی</b><span>${esc(w.farsi)}</span></div>` : ''}
        <div class="kv"><b>زبان</b><span>${w.lang === 'ps' ? 'پشتو' : w.lang === 'fa' ? 'فارسی' : 'اردو'}</span></div></div>
      ${w.sentence ? `<div class="sheet-sec"><h4>مثالی جملہ</h4><p style="white-space:pre-wrap">${esc(w.sentence)}</p>${w.sentenceTr ? `<p class="hint">${esc(w.sentenceTr)}</p>` : ''}</div>` : ''}
      ${w.conj ? `<div class="sheet-sec"><h4>گردان / نوٹ</h4><p style="white-space:pre-wrap">${esc(w.conj)}</p></div>` : ''}
      <button class="btn-ghost" onclick="delWord('${w.id}')">🗑 حذف کریں</button>`);
  }
}
window.showDetail = showDetail;
window.delWord = id => { myWords = myWords.filter(w => w.id != id); saveStore(); renderMyWords(); closeSheet(); };

/* ---------- letters ---------- */
const FA_LETTERS = ['ا','ب','پ','ت','ث','ج','چ','ح','خ','د','ذ','ر','ز','ژ','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ک','گ','ل','م','ن','و','ہ','ی'];
function initLetters() {
  document.querySelectorAll('[data-ldict]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-ldict]').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); letterDict = b.dataset.ldict; activeLetter = null; buildLetterGrid();
  });
}
function buildLetterGrid() {
  const g = $('letterGrid'); $('letterResults').innerHTML = '';
  let letters;
  if (letterDict === 'ps') {
    const counts = {};
    PS.forEach(e => counts[e[1]] = (counts[e[1]] || 0) + 1);
    letters = Object.keys(counts).map(l => [l, counts[l]]);
  } else {
    letters = FA_LETTERS.map(l => [l, FA.filter(e => norm(e[1]).startsWith(norm(l))).length]);
  }
  g.innerHTML = letters.map(([l, c]) => `<button data-l="${esc(l)}" class="${l === activeLetter ? 'active' : ''}">${esc(l)}<small>${c}</small></button>`).join('');
  g.querySelectorAll('button').forEach(b => b.onclick = () => {
    activeLetter = b.dataset.l;
    g.querySelectorAll('button').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); showLetterWords();
  });
}
function showLetterWords() {
  const box = $('letterResults');
  let list;
  if (letterDict === 'ps') list = PS.filter(e => e[1] === activeLetter).map(psCard);
  else list = FA.filter(e => norm(e[1]).startsWith(norm(activeLetter))).map(faCard);
  box.innerHTML = list.length ? `<p class="hint">«${esc(activeLetter)}» — ${list.length} مصادر</p>` + list.slice(0, 400).join('') : '<div class="empty">اس حرف سے کوئی مصدر نہیں</div>';
  bindCards(box);
}

/* ---------- my words ---------- */
function loadStore() {
  try { myWords = JSON.parse(localStorage.getItem('masdar_words') || '[]'); } catch (e) { myWords = []; }
  try { grammarNotes = JSON.parse(localStorage.getItem('masdar_grammar') || '[]'); } catch (e) { grammarNotes = []; }
  $('statMine').textContent = myWords.length;
}
function saveStore() {
  localStorage.setItem('masdar_words', JSON.stringify(myWords));
  localStorage.setItem('masdar_grammar', JSON.stringify(grammarNotes));
  $('statMine').textContent = myWords.length;
}
function initMyWords() {
  $('addWordBtn').onclick = () => { $('wordForm').hidden = false; $('wordForm').scrollIntoView({ behavior: 'smooth' }); };
  const qa = $('quickAddBtn');
  if (qa) qa.onclick = () => { if (window._goNav) window._goNav('mywords'); $('wordForm').hidden = false; setTimeout(() => $('wordForm').scrollIntoView({ behavior: 'smooth' }), 150); };
  $('wfCancel').onclick = () => { $('wordForm').hidden = true; };
  $('exportBtn').onclick = exportMyData;
  $('importBtn').onclick = () => $('importFile').click();
  const eob = $('exportOnlineBtn'); if (eob) eob.onclick = exportOnline;
  const mob = $('mwOnlineBtn');
  if (mob) mob.onclick = () => {
    if (window._goNav) window._goNav('about');
    toast('🌐 ویب سائٹ سے ڈائریکٹ اپڈیٹ چیک ہو رہا ہے…');
    setTimeout(() => { const b = $('updCheck'); if (b) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); b.click(); } }, 450);
  };
  $('importFile').onchange = e => { if (e.target.files[0]) importMyData(e.target.files[0]); e.target.value = ''; };
  $('wfSave').onclick = () => {
    const word = $('wfWord').value.trim();
    if (!word) { alert('لفظ لکھیں!'); return; }
    myWords.unshift({ id: 'w' + Date.now(), lang: $('wfLang').value, word, roman: $('wfRoman').value.trim(), urdu: $('wfUrdu').value.trim(), english: $('wfEnglish').value.trim(), farsi: $('wfFarsi').value.trim(), sentence: $('wfSentence').value.trim(), sentenceTr: $('wfSentenceTr').value.trim(), conj: $('wfConj').value.trim() });
    ['wfWord', 'wfRoman', 'wfUrdu', 'wfEnglish', 'wfFarsi', 'wfSentence', 'wfSentenceTr', 'wfConj'].forEach(id => $(id).value = '');
    $('wordForm').hidden = true; saveStore(); renderMyWords();
  };
}
function renderMyWords() {
  const box = $('myWordsList');
  const list = visibleMyWords();
  box.innerHTML = list.length ? list.map(myCard).join('') : '<div class="empty">ابھی کوئی لفظ شامل نہیں کیا۔<br>اوپر بٹن دبا کر پہلا لفظ شامل کریں! 📝</div>';
  bindCards(box);
}

/* ---------- practice ---------- */
function initPractice() {
  document.querySelectorAll('[data-ptab]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-ptab]').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.ptab').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); $('ptab-' + b.dataset.ptab).classList.add('active');
  });
  $('spellCheck').onclick = () => {
    if (!spellCurrent) return;
    const ans = $('spellInput').value.trim();
    const ok = norm(ans) === norm(spellCurrent[2]);
    $('spellResult').innerHTML = ok
      ? `<span class="good">✅ بالکل صحیح! شاباش!</span>`
      : `<span class="bad">❌ درست املا:</span> <strong style="font-size:22px">${esc(spellCurrent[2])}</strong> <span class="suggest">(${esc(spellCurrent[3])})</span>`;
  };
  $('spellNext').onclick = newSpellWord;
  $('correctBtn').onclick = doCorrect;
  $('sentCheck').onclick = () => {
    if (!sentCurrent) return;
    $('sentResult').innerHTML = `<div class="verse"><strong>مثال:</strong> ${esc(sentCurrent[5] || '—')}<br><span class="poet">🇵🇰</span> ${esc(sentCurrent[7] || '')}</div>
      <p class="hint">اپنے جملے کا اس مثال سے موازنہ کریں۔ کوئی بھی کوشش اچھی کوشش ہے! 💪</p>`;
  };
  $('sentNext').onclick = newSentPrompt;
}
function newSpellWord() {
  spellCurrent = PS[Math.floor(Math.random() * PS.length)];
  $('spellPrompt').innerHTML = `<div class="suggest">${esc(spellCurrent[3])}</div><div>${esc(spellCurrent[5])}</div><div class="suggest">${esc(spellCurrent[4])}</div>`;
  $('spellInput').value = ''; $('spellResult').innerHTML = '';
}
function newSentPrompt() {
  sentCurrent = FA[Math.floor(Math.random() * FA.length)];
  $('sentPrompt').innerHTML = `<div style="font-size:24px;font-weight:bold">${esc(sentCurrent[1])}</div><div class="suggest">${esc(sentCurrent[2])} — ${esc(sentCurrent[4])}</div>`;
  $('sentInput').value = ''; $('sentResult').innerHTML = '';
}
function allWords() {
  const set = new Map();
  PS.forEach(e => { set.set(norm(e[2]), { w: e[2], m: e[5] }); });
  FA.forEach(e => { set.set(norm(e[1]), { w: e[1], m: e[4] }); });
  visibleMyWords().forEach(w => { set.set(norm(w.word), { w: w.word, m: w.urdu }); });
  communityWords.forEach(w => { if (!set.has(norm(w.word))) set.set(norm(w.word), { w: w.word, m: w.urdu }); });
  return set;
}
function doCorrect() {
  const text = $('correctInput').value.trim();
  if (!text) return;
  const dict = allWords();
  const toks = text.split(/(\s+)/);
  const html = toks.map(t => {
    if (!t.trim()) return esc(t);
    const clean = t.replace(/[.,!?؟،؛:"«»()]/g, '');
    if (!clean) return esc(t);
    if (dict.has(norm(clean))) return `<span class="tok ok tapw" data-w="${esc(clean)}" title="صحیح ✓">${esc(t)}</span>`;
    let best = null, bd = 3;
    dict.forEach(v => { const d = lev(clean, v.w); if (d < bd) { bd = d; best = v; } });
    return `<span class="tok no tapw" data-w="${esc(best ? best.w : clean)}" title="${best ? 'شاید: ' + best.w + ' (' + best.m + ')' : 'ڈکشنری میں نہیں'}">${esc(t)}</span>` +
      (best ? `<div class="suggest">💡 «${esc(t)}» کی جگہ شاید «${esc(best.w)}» — ${esc(best.m)}</div>` : '');
  }).join('');
  const wrong = (html.match(/tok no/g) || []).length;
  $('correctResult').innerHTML = `<p class="${wrong ? 'bad' : 'good'}">${wrong ? wrong + ' ممکنہ غلطی ملی' : '✅ سب الفاظ درست ہیں! بہت خوب!'}</p>` + html +
    `<p class="hint">سبز = درست، سرخ = چیک کریں (ٹیپ کر کے مشورہ دیکھیں)</p>`;
}

/* ---------- grammar ---------- */
const DEFAULT_GRAMMAR = [
  { t: 'پشتو مصادر کی پہچان', b: 'پشتو مصادر عام طور پر «ول» پر ختم ہوتے ہیں، مثلاً: کول (کرنا)، لیکل (لکھنا)، ویل (کہنا)۔ «ېدل» والے مصادر لازم (intransitive) ہوتے ہیں جیسے کېدل (ہونا)، اور «ول» والے متعدی (transitive) جیسے کول (کرنا)۔' },
  { t: 'فارسی بن ماضی اور بن مضارع', b: 'ہر فارسی مصدر سے دو بنیادی بنیں نکلتی ہیں: بن ماضی (ماضی کے زمانوں کے لیے) اور بن مضارع (مضارع، امر اور نہی کے لیے)۔ مثلاً کردن سے بن ماضی «کرد» اور بن مضارع «کن»۔' },
  { t: 'فارسی امر اور نہی', b: 'امر بنانے کے لیے بن مضارع سے پہلے «بـ» لگائیں: بکن (کرو)! نہی کے لیے «نـ» یا «مـ»: نکن (نہ کرو)!' }
];
function initGrammar() {
  $('gfSave').onclick = () => {
    const t = $('gfTitle').value.trim(), b = $('gfBody').value.trim();
    if (!t || !b) { alert('عنوان اور تفصیل دونوں لکھیں!'); return; }
    grammarNotes.unshift({ t, b }); $('gfTitle').value = ''; $('gfBody').value = '';
    saveStore(); renderGrammar();
  };
}
function renderGrammar() {
  const gf = getGrammarFix();
  const gps = (typeof GRAMMAR_PS !== 'undefined') ? GRAMMAR_PS : [];
  const all = [
    ...grammarNotes.map((g, i) => ({ ...g, _u: i })),
    ...gps.map((g, i) => ({ ...g, ...(gf['ps_' + i] || {}), _src: 'ps', _i: i, _fix: !!gf['ps_' + i] })),
    ...DEFAULT_GRAMMAR.map((g, i) => ({ ...g, ...(gf['def_' + i] || {}), _src: 'def', _i: i, _fix: !!gf['def_' + i] }))
  ];
  $('grammarList').innerHTML = all.map(g =>
    `<div class="card"><h3>${esc(g.t)}${g._fix ? ' <span class="tag">درست شدہ</span>' : ''}</h3><p>${tapWords(g.b)}</p>` +
    (g._u !== undefined
      ? `<button class="btn-ghost" onclick="delGrammar(${g._u})">🗑 حذف کریں</button>`
      : `<button class="btn-ghost" onclick="openGrammarEditor('${g._src}', ${g._i})">✏️ درست کریں</button>`) +
    `</div>`).join('');
}
window.delGrammar = i => { grammarNotes.splice(i, 1); saveStore(); renderGrammar(); };
