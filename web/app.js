const state = { flavor: 'sunny', tempo: 108, energy: 2, swing: 1, songName: 'Little Day Out', notes: [], vocalEnabled: true, vocalText: '', playing: false, context: null, timers: [], covers: {}, activeCard: null };
// Imported covers live only in this browser (localStorage) — never in the repo.
const COVERS_KEY = 'croak-covers';
function loadCovers() { try { state.covers = JSON.parse(localStorage.getItem(COVERS_KEY)) || {}; } catch { state.covers = {}; } }
function saveCovers() { try { localStorage.setItem(COVERS_KEY, JSON.stringify(state.covers)); } catch {} }
function markCardCovers() { document.querySelectorAll('.song-demo').forEach(btn => { const has = !!state.covers[btn.dataset.demo]; btn.classList.toggle('has-cover', has); btn.querySelector('.demo-arrow').textContent = has ? '✓' : '↗'; if (has) btn.querySelector('.demo-copy small').textContent = 'your cover ready'; }); }

const presets = {
  sunny: { title: 'Sunny dock', tempo: 108, subtitle: 'bouncy bells · little handclaps', color: '#61b982', lead: 'bell', comp: 'kalimba', reverb: .3, brightness: 7200, pad: false },
  rainy: { title: 'Rainy cabin', tempo: 84, subtitle: 'soft kalimba · window rain', color: '#6eb9c6', lead: 'musicbox', comp: 'kalimba', reverb: .55, brightness: 4800, pad: true },
  seaside: { title: 'Saltwater stroll', tempo: 100, subtitle: 'breezy marimba · tide taps', color: '#4aaebf', lead: 'marimba', comp: 'marimba', reverb: .42, brightness: 6200, pad: false },
  evening: { title: 'Lantern tide', tempo: 76, subtitle: 'warm music box · sleepy bass', color: '#8c81b5', lead: 'musicbox', comp: 'guitar', reverb: .62, brightness: 4200, pad: true },
};
const songSuitcases = {
  odoriko: { flavor: 'rainy', tempo: 96, energy: 2, label: 'Odoriko suitcase is packed: rainy sparkle, a close little band, and room for your MIDI.' },
  vampire: { flavor: 'evening', tempo: 132, energy: 3, label: 'vampire suitcase is packed: lantern drama, a bigger band, and room for your MIDI.' },
  'what-is-love': { flavor: 'sunny', tempo: 101, energy: 3, label: 'What Is Love? suitcase is packed: bright dock-pop, extra bounce, and room for your MIDI.' },
};
const defaultNotes = [72,74,76,79,76,74,72,69, 72,74,76,81,79,76,74,72, 69,72,74,76,74,72,69,67, 69,71,72,74,72,69,67,64]
  .map((pitch, index) => ({ pitch, start: index * .5, duration: index % 7 === 0 ? .85 : .42 }));
// Turn [pitch, beats] pairs into timed notes, and loop a motif to fill the sketch.
function seq(pairs) { let t = 0; return pairs.map(([pitch, dur]) => { const n = { pitch, start: t, duration: dur }; t += dur; return n; }); }
function loopSeq(notes, times) { const span = notes.length ? notes[notes.length - 1].start + notes[notes.length - 1].duration : 0; const out = []; for (let k = 0; k < times; k++) notes.forEach(n => out.push({ pitch: n.pitch, start: n.start + span * k, duration: n.duration })); return out; }
// Original short motifs — not transcriptions, just melodies that fit each card's mood.
const cardMelodies = {
  odoriko: loopSeq(seq([[76,.5],[74,.5],[72,.5],[74,.5], [76,.5],[79,.5],[76,.75],[72,.25], [74,.5],[72,.5],[69,.5],[72,.5], [74,.5],[76,.5],[74,1]]), 2),
  vampire: loopSeq(seq([[74,.5],[72,.5],[70,.5],[69,.75], [69,.25],[72,.5],[74,.5],[77,.5], [76,.5],[74,.5],[72,.5],[70,.5], [69,.5],[67,.5],[65,1]]), 2),
  'what-is-love': loopSeq(seq([[67,.5],[69,.5],[67,.25],[64,.75], [60,.5],[64,.5],[67,.5],[69,.5], [67,.5],[64,.5],[62,.5],[60,.5], [62,.5],[64,.5],[67,1]]), 2),
};
const instruments = [
  ['✦','Glockenspiel','the bright little lead'],
  ['⌁','Kalimba','soft chord sparkle'],
  ['◒','Upright bass','a warm walk home'],
  ['·','Hand percussion','tap tap, shuffle'],
  ['❋','Woodwind','a friendly answer'],
  ['◌','Marimba','round wooden sunshine'],
  ['⌇','Leafy guitar','little plucked chords'],
  ['≋','Brush shaker','a breezy edge'],
];

function setup() {
  state.notes = defaultNotes;
  loadCovers(); markCardCovers();
  makeWave(); renderTracks();
  document.querySelectorAll('.flavor').forEach(button => button.addEventListener('click', () => setFlavor(button.dataset.flavor)));
  document.querySelectorAll('.song-demo').forEach(button => button.addEventListener('click', () => { if (state.activeCard === button.dataset.demo) deselectCard(); else loadSuitcase(button.dataset.demo); }));
  document.querySelector('#midi-input').addEventListener('change', importMidi);
  document.querySelector('#demo-button').addEventListener('click', () => { state.activeCard = null; state.notes = defaultNotes; state.songName = 'Little Day Out'; document.querySelector('#song-status').textContent = 'Cozy demo planted — a cheerful 16-bar melody is ready to arrange.'; refreshSong(); });
  document.querySelector('#energy').addEventListener('input', event => { state.energy = +event.target.value; document.querySelector('#energy-output').textContent = ['gentle', 'just right', 'full of beans'][state.energy - 1]; renderTracks(); });
  document.querySelector('#tempo').addEventListener('input', event => { state.tempo = +event.target.value; document.querySelector('#tempo-value').textContent = state.tempo; document.querySelector('#tempo-output').textContent = `${state.tempo} bpm`; });
  document.querySelector('#swing').addEventListener('input', event => { state.swing = +event.target.value; document.querySelector('#swing-output').textContent = ['straight', 'a little', 'extra bouncy'][state.swing]; });
  document.querySelector('#vocal-toggle').addEventListener('change', event => { state.vocalEnabled = event.target.checked; document.querySelector('#vocal-text').disabled = !state.vocalEnabled; });
  document.querySelector('#vocal-text').addEventListener('input', event => { state.vocalText = event.target.value; });
  document.querySelector('#play-button').addEventListener('click', togglePlay);
  document.querySelector('#download-button').addEventListener('click', downloadWav);
  document.querySelector('.share-button').addEventListener('click', () => { navigator.clipboard?.writeText(location.href); const button = document.querySelector('.share-button'); button.textContent = '✓ Link copied'; setTimeout(() => button.textContent = '↗ Share', 1500); });
}
function deselectCard() {
  state.activeCard = null;
  document.querySelectorAll('.song-demo').forEach(b => b.classList.remove('active'));
  state.notes = defaultNotes; state.songName = 'Little Day Out';
  document.querySelector('#demo-note').textContent = 'These set up an original arrangement recipe. Add a MIDI you’re allowed to use to make it your cover.';
  document.querySelector('#song-status').textContent = 'Cleared the suitcase — back to the cozy demo melody.';
  document.querySelector('#listen-title').textContent = 'Little Day Out';
  makeWave(); renderTracks();
}
function loadSuitcase(name) {
  const suitcase = songSuitcases[name];
  state.activeCard = name;
  setFlavor(suitcase.flavor);
  state.tempo = suitcase.tempo; state.energy = suitcase.energy;
  document.querySelector('#tempo').value = state.tempo; document.querySelector('#energy').value = state.energy;
  document.querySelector('#tempo-value').textContent = state.tempo; document.querySelector('#tempo-output').textContent = `${state.tempo} bpm`;
  document.querySelector('#energy-output').textContent = ['gentle', 'just right', 'full of beans'][state.energy - 1];
  document.querySelectorAll('.song-demo').forEach(button => button.classList.toggle('active', button.dataset.demo === name));
  document.querySelector('#demo-note').textContent = suitcase.label;
  const cover = state.covers[name], pretty = name.replaceAll('-', ' ');
  if (cover) { state.notes = cover.notes; state.songName = cover.songName || `${pretty} cover`; }
  else if (cardMelodies[name]) { state.notes = cardMelodies[name]; state.songName = `${pretty} sketch`; }
  document.querySelector('#song-status').textContent = cover
    ? `Playing your imported ${pretty} cover ✓ — kept in this browser only. Press play, or re-import to replace it.`
    : `Loaded the ${pretty} setup with an original melody sketch. Press play, or add a MIDI you have the right to use to make it the real cover.`;
  document.querySelector('#listen-title').textContent = cover ? `${pretty} · your cover` : `${pretty} · setup sketch`;
  makeWave(); renderTracks();
}
function setFlavor(flavor) { state.flavor = flavor; const preset = presets[flavor]; state.tempo = preset.tempo; document.querySelector('#tempo').value = state.tempo; document.querySelector('#tempo-value').textContent = state.tempo; document.querySelector('#tempo-output').textContent = `${state.tempo} bpm`; document.querySelector('#arrangement-title').textContent = preset.title; document.querySelector('#listen-subtitle').textContent = `${preset.subtitle} · instrumental`; document.querySelectorAll('.flavor').forEach(b => { const chosen = b.dataset.flavor === flavor; b.classList.toggle('selected', chosen); b.setAttribute('aria-checked', chosen); }); makeWave(); renderTracks(); }
function refreshSong() { document.querySelector('#listen-title').textContent = state.songName; makeWave(); renderTracks(); }
function makeWave() { const root = document.querySelector('#waveform'); root.replaceChildren(); const seed = state.flavor.charCodeAt(0); for (let i=0;i<80;i++) { const bar = document.createElement('i'); const height = 8 + ((i * seed + i * i * 7) % 35); bar.style.height = `${height}px`; bar.style.background = presets[state.flavor].color; root.append(bar); } updateTimeline(); }
function renderTracks() { const root = document.querySelector('#tracks'); root.replaceChildren(); instruments.slice(0, state.energy * 2 + 2).forEach(([icon, name, detail], index) => { const row = document.createElement('div'); row.className = 'track'; row.innerHTML = `<span class="track-icon">${icon}</span><span>${name}<small>${detail}</small></span><span class="track-meter">${Array.from({length: 8}, (_, n) => `<i style="height:${5 + ((n * (index + 3) * 7) % 13)}px"></i>`).join('')}</span>`; root.append(row); }); }
function midiToHz(note) { return 440 * Math.pow(2, (note - 69) / 12); }
// --- Cozy sound engine: a small warm room with a handful of soft instruments ---
// Louder master (~2x the old .65) with a gentle brick-wall limiter so dense sections can't clip.
const MASTER_GAIN = 1.4;
function makeMaster(ctx) { const master = ctx.createGain(); master.gain.value = MASTER_GAIN; const limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -2; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = .003; limiter.release.value = .12; master.connect(limiter).connect(ctx.destination); return master; }
// Seeded RNG so the reverb tail and percussion noise are identical every render (play == export).
function seededRand(seed) { let x = seed >>> 0; return () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296; }
function makeReverb(ctx) { const len = Math.floor(ctx.sampleRate * 1.7); const buf = ctx.createBuffer(2, len, ctx.sampleRate); const rnd = seededRand(0xC0FFEE); for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / len, 2.6); } const conv = ctx.createConvolver(); conv.buffer = buf; return conv; }
function buildEngine(ctx, master, pal = {}) { const dry = ctx.createGain(); dry.gain.value = .9; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = pal.brightness || 6800; dry.connect(lp).connect(master); const send = makeReverb(ctx); const wet = ctx.createGain(); wet.gain.value = pal.reverb ?? .45; send.connect(wet); wet.connect(master); return { dry, send }; }
function sendTo(ctx, amp, dry, send, wetAmt) { amp.connect(dry); if (send) { const s = ctx.createGain(); s.gain.value = wetAmt; amp.connect(s); s.connect(send); } }
function noiseBuffer(ctx) { if (ctx._noise) return ctx._noise; const len = Math.floor(ctx.sampleRate * .5); const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0); const rnd = seededRand(0x5EED); for (let i = 0; i < len; i++) d[i] = rnd() * 2 - 1; ctx._noise = buf; return buf; }
// Bell / glockenspiel — bright inharmonic partials, the sparkly lead
function bell(ctx, dry, send, note, t, dur, gain) { const f = midiToHz(note), d = Math.max(dur, .5); [[1, gain, d], [3.01, gain * .35, d * .6], [5.4, gain * .12, d * .4]].forEach(([ratio, g, dd]) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * ratio; const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + .006); a.gain.exponentialRampToValueAtTime(.0001, t + dd); o.connect(a); sendTo(ctx, a, dry, send, .3); o.start(t); o.stop(t + dd + .05); }); }
// Marimba lead — woodier and shorter than the bell
function marimba(ctx, dry, send, note, t, dur, gain) { const f = midiToHz(note), d = Math.max(Math.min(dur, .55), .3); [[1, gain, d], [4.0, gain * .22, d * .45]].forEach(([ratio, g, dd]) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * ratio; const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + .005); a.gain.exponentialRampToValueAtTime(.0001, t + dd); o.connect(a); sendTo(ctx, a, dry, send, .3); o.start(t); o.stop(t + dd + .05); }); }
// Music box — soft, gentle attack, long dreamy tail
function musicBox(ctx, dry, send, note, t, dur, gain) { const f = midiToHz(note), d = Math.max(dur, .7); [[1, gain, d], [2.0, gain * .2, d * .7], [3.9, gain * .09, d * .45]].forEach(([ratio, g, dd]) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * ratio; const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + .014); a.gain.exponentialRampToValueAtTime(.0001, t + dd); o.connect(a); sendTo(ctx, a, dry, send, .4); o.start(t); o.stop(t + dd + .05); }); }
// Woodwind-ish soft answer — gentle attack, holds, fades
function softLead(ctx, dry, send, note, t, dur, gain) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = midiToHz(note); const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(gain, t + .04); a.gain.setValueAtTime(gain, t + dur * .6); a.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(a); sendTo(ctx, a, dry, send, .35); o.start(t); o.stop(t + dur + .05); }
// Kalimba / marimba pluck — woody, quick decay, the chord comp
function pluckComp(ctx, dry, send, note, t, dur, gain) { const f = midiToHz(note), d = Math.min(dur, .5); [[1, gain, d], [2.0, gain * .3, d * .5]].forEach(([r, g, dd]) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * r; const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + .005); a.gain.exponentialRampToValueAtTime(.0001, t + dd); o.connect(a); sendTo(ctx, a, dry, send, .28); o.start(t); o.stop(t + dd + .05); }); }
// Leafy guitar — softened sawtooth chord swell
function guitar(ctx, dry, send, note, t, dur, gain) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiToHz(note); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(gain, t + .012); a.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(lp).connect(a); sendTo(ctx, a, dry, send, .2); o.start(t); o.stop(t + dur + .05); }
// Upright bass — round triangle pluck
function bass(ctx, dry, send, note, t, dur, gain) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = midiToHz(note); const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(gain, t + .02); a.gain.exponentialRampToValueAtTime(.0001, t + Math.max(dur, .3)); o.connect(a); sendTo(ctx, a, dry, send, .12); o.start(t); o.stop(t + dur + .1); }
// Brush shaker & hand tap — filtered noise, dry
function shaker(ctx, dry, t, gain) { const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 7200; bp.Q.value = 1.2; const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(gain, t + .005); a.gain.exponentialRampToValueAtTime(.0001, t + .09); src.connect(bp).connect(a).connect(dry); src.start(t); src.stop(t + .12); }
// Rough key estimate — the most-weighted pitch class — used only to seed the babble.
function detectKey(notes) { const w = new Array(12).fill(0); notes.forEach(n => w[((n.pitch % 12) + 12) % 12] += (n.duration || 1)); let best = 0; for (let i = 1; i < 12; i++) if (w[i] > w[best]) best = i; return best; }
// Croak-chat / animalese: a saw glottal source shaped by three vowel formants (a real vowel),
// with fade-in vibrato so it "sings" and a short consonant tick at the syllable onset so it "talks".
const VOWEL_FORMANTS = { a: [800, 1150, 2800], e: [500, 1900, 2550], i: [300, 2300, 3000], o: [500, 900, 2600], u: [330, 800, 2400] };
function croakChat(ctx, dry, send, note, start, duration, syllable, detune = 0) {
  const s = syllable.toLowerCase();
  const F = VOWEL_FORMANTS[s.match(/[aeiou]/)?.[0]] || VOWEL_FORMANTS.a;
  // Short, articulated syllable — a held vowel just reads as a drone; a quick blip reads as speech.
  const dur = Math.max(.11, Math.min(duration, .2)), base = midiToHz(note) * Math.pow(2, detune / 1200);
  const level = ctx.createGain(); level.gain.value = .16; sendTo(ctx, level, dry, send, .22);
  const osc = ctx.createOscillator(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(base * .96, start);
  osc.frequency.linearRampToValueAtTime(base, start + Math.min(.03, dur * .3));
  const vib = ctx.createOscillator(); vib.type = 'sine'; vib.frequency.value = 5.5;
  const vibGain = ctx.createGain(); vibGain.gain.setValueAtTime(0, start); vibGain.gain.linearRampToValueAtTime(base * .01, start + dur * .5);
  vib.connect(vibGain).connect(osc.frequency);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(.0001, start);
  amp.gain.exponentialRampToValueAtTime(1, start + .012);
  amp.gain.setValueAtTime(1, start + dur * .5);
  amp.gain.exponentialRampToValueAtTime(.0001, start + dur);
  // The key to hearing a *syllable*: formants glide from a neutral consonant locus INTO the vowel.
  const glide = Math.min(.06, dur * .5), locus = [560, 1650, 2500];
  F.forEach((freq, k) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = [6, 7, 8][k]; bp.frequency.setValueAtTime(locus[k], start); bp.frequency.linearRampToValueAtTime(freq, start + glide); const fg = ctx.createGain(); fg.gain.value = [1, .55, .3][k]; osc.connect(bp).connect(fg).connect(amp); });
  amp.connect(level);
  // Soft consonant onset (quiet, so it articulates without a jumpscare).
  if (s[0] && !'aeiou'.includes(s[0])) { const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 'sfhc'.includes(s[0]) ? 3800 : 1300; bp.Q.value = .9; const ng = ctx.createGain(); ng.gain.setValueAtTime('sfhc'.includes(s[0]) ? .13 : .09, start); ng.gain.exponentialRampToValueAtTime(.0001, start + .03); src.connect(bp).connect(ng).connect(level); src.start(start); src.stop(start + .04); }
  osc.start(start); osc.stop(start + dur + .03); vib.start(start); vib.stop(start + dur + .03);
}
const LEADS = { bell, marimba, musicbox: musicBox };
const COMPS = { kalimba: pluckComp, marimba, guitar };
function fmtTime(sec) { return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`; }
function songSeconds() { const beat = 60 / state.tempo; const end = state.notes.reduce((m, n) => Math.max(m, n.start + (n.duration || .5)), 0); return Math.max(4, Math.min(end * beat + 1.5, 300)); }
function updateTimeline() { const secs = songSeconds(), labels = document.querySelectorAll('.timeline-labels span'); if (labels.length === 4) [0, secs / 3, secs * 2 / 3, secs].forEach((t, i) => labels[i].textContent = fmtTime(t)); }
// Fake-language babble: language-ish CV(C) syllables, seeded so playback and export match.
function makeBabble(n, seed) { const onsets = ['b','d','g','k','t','p','m','n','r','s','h','w','y','ch','sh','j','f','l','','']; const vowels = ['a','e','i','o','u','ai','ou','ee','oo','ya']; const codas = ['','','','','','n','m','k','t']; let x = seed >>> 0; const rnd = () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296; const pick = a => a[Math.floor(rnd() * a.length)]; const out = []; for (let i = 0; i < Math.max(1, n); i++) out.push((pick(onsets) + pick(vowels) + pick(codas)) || 'la'); return out; }
// Find the major scale that best contains the melody, then use only that key's diatonic triads —
// so the comp can never introduce an out-of-key note that clashes with the tune.
const MAJ_SCALE = [0, 2, 4, 5, 7, 9, 11];
function pcHistogram(notes) { const w = new Array(12).fill(0); notes.forEach(n => w[((n.pitch % 12) + 12) % 12] += (n.duration || .5)); return w; }
function detectScale(notes) { const w = pcHistogram(notes); let best = 0, bestScore = -1; for (let t = 0; t < 12; t++) { const sc = MAJ_SCALE.reduce((a, d) => a + w[(t + d) % 12], 0); if (sc > bestScore) { bestScore = sc; best = t; } } return best; }
function diatonicTriads(tonic) { const sc = MAJ_SCALE.map(d => (tonic + d) % 12); return sc.map((_, i) => [sc[i], sc[(i + 2) % 7], sc[(i + 4) % 7]]); }
function chordForBar(notes, lo, hi, prev, triads) {
  const w = new Array(12).fill(0);
  notes.forEach(n => { if (n.start + (n.duration || .5) > lo && n.start < hi) w[((n.pitch % 12) + 12) % 12] += (n.duration || .5); });
  if (!w.some(x => x > 0)) return prev || { root: triads[0][0], tones: triads[0] };
  let best = null;
  for (const tones of triads) {
    let score = tones.reduce((a, pc) => a + w[pc], 0) + w[tones[0]] * .2; // coverage, small nod to the root
    if (prev && prev.root === tones[0]) score += .2; // gentle continuity between bars
    if (!best || score > best.score) best = { score, root: tones[0], tones };
  }
  return best;
}
function voiceTones(tones, base) { return tones.map(pc => base + (((pc - base) % 12) + 12) % 12); }
// Soft cozy kick and a light rim tap for the groove.
function kick(ctx, dry, t, gain) { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(46, t + .11); const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(gain, t + .006); a.gain.exponentialRampToValueAtTime(.0001, t + .18); o.connect(a).connect(dry); o.start(t); o.stop(t + .2); }
function rim(ctx, dry, t, gain) { const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 1.4; const a = ctx.createGain(); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(gain, t + .003); a.gain.exponentialRampToValueAtTime(.0001, t + .07); src.connect(bp).connect(a).connect(dry); src.start(t); src.stop(t + .09); }
function scheduleArrangement(ctx, master, seconds = songSeconds()) {
  const pal = presets[state.flavor] || {};
  const { dry, send } = buildEngine(ctx, master, pal);
  const lead = LEADS[pal.lead] || bell, comp = COMPS[pal.comp] || pluckComp;
  const beat = 60 / state.tempo, bar = beat * 4;
  const swingAmt = [0, .06, .12][state.swing] || 0;
  const keyRoot = detectKey(state.notes);
  const melodyNotes = state.notes.filter(n => n.start * beat < seconds);
  const cue = state.vocalText.match(/[a-zA-Z]+/g);
  const vseed = (melodyNotes.length * 131 + keyRoot * 17 + Math.round(state.tempo)) >>> 0;
  const syllables = cue && cue.length ? cue : makeBabble(melodyNotes.length, vseed);
  const vjit = seededRand(vseed ^ 0x9e3779b9); // slight, occasional pitch drift — a little off, on purpose

  // Lead line (on the grid, no swing): the flavor's voice, with a soft answer on higher energy
  melodyNotes.forEach((n, i) => {
    const t = n.start * beat;
    const dur = Math.min((n.duration || .4) * beat, .9);
    lead(ctx, dry, send, n.pitch, t, dur, .12);
    if (state.vocalEnabled) { const detune = vjit() < .28 ? (vjit() * 2 - 1) * 32 : (vjit() * 2 - 1) * 7; croakChat(ctx, dry, send, n.pitch, t, Math.min(dur, .28), syllables[i % syllables.length], detune); }
    if (state.energy > 1 && i % 4 === 2) softLead(ctx, dry, send, n.pitch + 3, t + beat * .5, .3, .05);
  });

  // Rhythm section: per-bar chord that fits the melody, gentle arpeggio comp, bass, and a cozy groove
  const bars = Math.ceil(seconds / bar);
  const tonic = detectScale(state.notes), triads = diatonicTriads(tonic);
  const scale = MAJ_SCALE.map(d => (tonic + d) % 12);
  // Cozy K.K. color: add a diatonic 6th to major chords, a diatonic 7th to minor ones (both in-key).
  const voiceColored = ch => { const colorPc = (ch.root + (ch.tones.includes((ch.root + 4) % 12) ? 9 : 10)) % 12; return voiceTones(scale.includes(colorPc) ? [...ch.tones, colorPc] : ch.tones, 52); };
  const steps = state.energy > 1 ? 2 : 1; // comp subdivisions per beat
  let prevChord = null;
  for (let b = 0; b < bars; b++) {
    // Two chords per bar (half-bar harmonic rhythm) so the accompaniment moves instead of sitting still.
    for (let h = 0; h < 2; h++) {
      const lo = b * 4 + h * 2;
      const ch = chordForBar(melodyNotes, lo, lo + 2, prevChord, triads); prevChord = ch;
      const chord = voiceColored(ch), bassNote = 36 + (((ch.root - 36) % 12) + 12) % 12, half = b * bar + h * 2 * beat;
      for (let bi = 0; bi < 2; bi++) for (let s = 0; s < steps; s++) {
        const t = half + bi * beat + s * (beat / steps) + (s ? swingAmt * beat * .5 : 0);
        if (t < seconds) comp(ctx, dry, send, chord[(bi * steps + s) % chord.length], t, beat / steps * .9, .045);
      }
      if (pal.pad) chord.forEach(p => softLead(ctx, dry, send, p - 12, half, bar * .48, .022));
      if (half < seconds) bass(ctx, dry, send, bassNote + (h && state.energy > 2 ? 7 : 0), half, beat * .9, h ? .1 : .12);
    }
    kick(ctx, dry, b * bar, .4);
    if (state.energy > 1 && b * bar + 2 * beat < seconds) kick(ctx, dry, b * bar + 2 * beat, .32);
    if (state.energy > 1) for (let e = 0; e < 4; e++) { const t = b * bar + e * beat + beat * .5 + swingAmt * beat * .5; if (t < seconds) shaker(ctx, dry, t, .026); }
    if (state.energy > 2) for (const e of [1, 3]) { const t = b * bar + e * beat; if (t < seconds) rim(ctx, dry, t, .05); }
  }
}
function togglePlay() { if (state.playing) return stopPlay(); const secs = songSeconds(); state.context = new AudioContext(); const master = makeMaster(state.context); scheduleArrangement(state.context, master, secs); state.playing=true; document.querySelector('#play-button span').textContent='■'; document.querySelector('.playhead').getAnimations().forEach(a => a.cancel()); document.querySelector('.playhead').animate([{left:'0%'},{left:'100%'}],{duration:secs*1000,iterations:1}); state.timers.push(setTimeout(stopPlay, secs*1000+400)); }
function stopPlay() { state.timers.forEach(clearTimeout); state.timers=[]; state.context?.close(); state.context=null; state.playing=false; document.querySelector('#play-button span').textContent='▶'; }
function bufferToWav(buffer) { const channels=buffer.numberOfChannels, length=buffer.length*channels*2+44, view=new DataView(new ArrayBuffer(length)); const write=(o,s)=>[...s].forEach((c,i)=>view.setUint8(o+i,c.charCodeAt(0))); write(0,'RIFF');view.setUint32(4,36+buffer.length*channels*2,true);write(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,buffer.sampleRate,true);view.setUint32(28,buffer.sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,buffer.length*channels*2,true);let offset=44;for(let i=0;i<buffer.length;i++)for(let c=0;c<channels;c++){const s=Math.max(-1,Math.min(1,buffer.getChannelData(c)[i]));view.setInt16(offset,s<0?s*0x8000:s*0x7fff,true);offset+=2;}return new Blob([view],{type:'audio/wav'}); }
async function downloadWav() { const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext; if(!Offline) return; const secs=songSeconds(); const offline=new OfflineAudioContext(2, Math.ceil(44100*secs), 44100); const master=makeMaster(offline); scheduleArrangement(offline,master,secs); const blob=bufferToWav(await offline.startRendering()); const link=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`${state.songName.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-croak-and-chord.wav`}); link.click(); URL.revokeObjectURL(link.href); }
function readVlq(data, pos) { let value=0, byte; do { byte=data[pos.i++]; value=(value<<7)|(byte&127); } while(byte&128); return value; }
// Parse a MIDI file into {pitch,start,duration} notes (start/duration in quarter-note beats).
// Each track keeps its OWN clock, and channel messages read the right number of data bytes.
function parseMidi(buffer) {
  const data = new Uint8Array(buffer), view = new DataView(buffer);
  if (String.fromCharCode(...data.slice(0, 4)) !== 'MThd') throw Error('not MIDI');
  const division = view.getUint16(12) || 480;
  const pos = { i: 14 }, notes = [];
  while (pos.i < data.length) {
    if (String.fromCharCode(...data.slice(pos.i, pos.i + 4)) !== 'MTrk') { pos.i++; continue; }
    pos.i += 8;
    let ticks = 0, running = 0; const active = new Map(); // per-track clock — the old bug shared this across tracks
    while (pos.i < data.length && String.fromCharCode(...data.slice(pos.i, pos.i + 4)) !== 'MTrk') {
      ticks += readVlq(data, pos);
      let status = data[pos.i];
      if (status & 128) { pos.i++; running = status; } else status = running;
      if (status === 0xff) { const kind = data[pos.i++]; pos.i += readVlq(data, pos); if (kind === 47) break; continue; }
      if (status === 0xf0 || status === 0xf7) { pos.i += readVlq(data, pos); continue; } // skip sysex
      const hi = status & 0xf0, a = data[pos.i++], b = (hi === 0xc0 || hi === 0xd0) ? 0 : data[pos.i++]; // C0/D0 carry one data byte
      const key = `${status & 15}-${a}`;
      if (hi === 0x90 && b) active.set(key, { pitch: a, tick: ticks });
      else if (hi === 0x80 || (hi === 0x90 && !b)) { const on = active.get(key); if (on) { notes.push({ pitch: on.pitch, start: on.tick / division, duration: Math.max(.12, (ticks - on.tick) / division) }); active.delete(key); } }
    }
  }
  return notes;
}
// Collapse polyphony to a clean top-line melody: highest note at each onset, trimmed to the next onset.
function skyline(notes) {
  const byStart = new Map();
  notes.forEach(n => { const k = Math.round(n.start * 4) / 4; const cur = byStart.get(k); if (!cur || n.pitch > cur.pitch) byStart.set(k, { pitch: n.pitch, start: k, duration: n.duration }); });
  const arr = [...byStart.values()].sort((a, b) => a.start - b.start);
  for (let i = 0; i < arr.length - 1; i++) arr[i].duration = Math.max(.12, Math.min(arr[i].duration, arr[i + 1].start - arr[i].start));
  return arr;
}
function setImportProgress(frac) { const bar = document.querySelector('#import-progress'); if (!bar) return; if (frac == null) { bar.hidden = true; bar.firstElementChild.style.width = '0%'; } else { bar.hidden = false; bar.firstElementChild.style.width = `${Math.round(Math.min(1, frac) * 100)}%`; } }
function importMidi(event) {
  const file = event.target.files[0]; if (!file) return;
  const status = document.querySelector('#song-status');
  const cleanName = file.name.replace(/\.(mid|midi)$/i, '');
  status.textContent = `Reading “${file.name}”…`; setImportProgress(.05);
  const reader = new FileReader();
  reader.onprogress = e => { if (e.lengthComputable) setImportProgress(.05 + .55 * e.loaded / e.total); };
  reader.onerror = () => { setImportProgress(null); status.textContent = 'Could not read that file — try another .mid or .midi.'; };
  reader.onload = () => {
    setImportProgress(.65); status.textContent = `Arranging “${file.name}”…`;
    setTimeout(() => { // let the progress bar paint before the (blocking) parse
      try {
        const all = parseMidi(reader.result);
        event.target.value = ''; setImportProgress(1);
        if (!all.length) {
          state.notes = defaultNotes; state.songName = 'Little Day Out';
          status.textContent = `Hmm — couldn't find playable notes in “${file.name}”. Kept the cozy demo; try another MIDI?`;
          refreshSong();
        } else {
          const parsed = skyline(all).slice(0, 600);
          state.notes = parsed; state.songName = cleanName;
          if (state.activeCard) {
            const pretty = state.activeCard.replaceAll('-', ' ');
            state.covers[state.activeCard] = { songName: cleanName, notes: parsed }; saveCovers(); markCardCovers();
            status.textContent = `Saved “${file.name}” as your ${pretty} cover ✓ — kept in this browser only. Press play to hear it in ${(presets[state.flavor] || {}).title || 'this flavor'}.`;
            refreshSong(); document.querySelector('#listen-title').textContent = `${pretty} · your cover`;
          } else {
            status.textContent = `${parsed.length} little notes planted from “${file.name}”. Have a listen, then change the weather.`;
            refreshSong();
          }
        }
        setTimeout(() => setImportProgress(null), 400);
      } catch (err) { setImportProgress(null); status.textContent = 'That file did not look like a MIDI garden path — try a .mid or .midi file.'; }
    }, 30);
  };
  reader.readAsArrayBuffer(file);
}
setup();
