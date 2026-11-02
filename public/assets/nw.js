/* 奶蛙合集 · 公共运行时：音效 / 粒子 / 存档 / 游戏壳 · PNG pieces v3 */
(function (root) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var SITE = 'https://price-naiwa.onrender.com';

  /* ---------- 存档 ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('nw_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('nw_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- WebAudio 音效 / BGM（原创合成 + 自研笑声采样） ---------- */
  var AC = null, master = null, sfxGain = null, bgmGain = null;
  var muted = !!store.get('mute', false);
  var volSfx = +store.get('vol_sfx', 0.95) || 0.95;
  var volBgm = +store.get('vol_bgm', 0.22) || 0.22;
  var buffers = {};
  var rawAudio = {};
  var bgmTimer = null, bgmKey = null, bgmNext = 0, feverLoop = null;
  var unlockPromise = null;

  function ctx() {
    if (!AC) {
      var C = root.AudioContext || root.webkitAudioContext; if (!C) return null;
      AC = new C();
      master = AC.createGain(); master.gain.value = 1;
      sfxGain = AC.createGain(); sfxGain.gain.value = muted ? 0 : volSfx;
      bgmGain = AC.createGain(); bgmGain.gain.value = muted ? 0 : volBgm;
      sfxGain.connect(master); bgmGain.connect(master); master.connect(AC.destination);
    }
    return AC;
  }
  function unlockAudio() {
    var a = ctx();
    if (!a) return Promise.resolve(false);
    if (a.state !== 'suspended') return Promise.resolve(true);
    if (unlockPromise) return unlockPromise;
    unlockPromise = a.resume().then(function () {
      unlockPromise = null; return true;
    }).catch(function () {
      unlockPromise = null; return false;
    });
    return unlockPromise;
  }
  function applyMuteGains() {
    if (!sfxGain || !bgmGain) return;
    var t = AC.currentTime;
    sfxGain.gain.cancelScheduledValues(t);
    bgmGain.gain.cancelScheduledValues(t);
    sfxGain.gain.setTargetAtTime(muted ? 0 : volSfx, t, 0.02);
    bgmGain.gain.setTargetAtTime(muted ? 0 : volBgm, t, 0.04);
  }
  function setMuted(v) {
    muted = !!v; store.set('mute', muted);
    if (!muted) ctx();
    applyMuteGains();
    if (muted) stopBgm(true);
    syncMuteButtons();
  }
  function toggleMute() { setMuted(!muted); if (!muted) sfx.click(); return muted; }

  function tone(f, d, type, vol, slide, delay) {
    if (muted) return; var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + d + 0.03);
  }
  function noise(d, vol, hp, delay) {
    if (muted) return; var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), ch = b.getChannelData(0);
    for (var i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp || 800; g.gain.value = vol || 0.2; s.buffer = b; s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t);
  }
  /* 程序化「哈」后备：大声多音节，采样未就绪 / iOS 首点也必须听得到 */
  function voiceHa(delay, f0, dur, vol, kind) {
    if (muted) return; var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0);
    dur = dur || 0.18; vol = vol || 0.55; f0 = f0 || 340;
    var nLen = Math.max(1, Math.floor(a.sampleRate * Math.min(dur * 0.55, 0.1)));
    var b = a.createBuffer(1, nLen, a.sampleRate), ch = b.getChannelData(0);
    for (var i = 0; i < nLen; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nLen, 0.35);
    var ns = a.createBufferSource(); ns.buffer = b;
    var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = kind === 'ga' ? 900 : 2100; bp.Q.value = 0.85;
    var ng = a.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(vol * 0.7, t + 0.008);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.5);
    ns.connect(bp); bp.connect(ng); ng.connect(sfxGain); ns.start(t); ns.stop(t + dur * 0.55);
    var o1 = a.createOscillator(), o2 = a.createOscillator(), o3 = a.createOscillator(), g = a.createGain(), f1 = a.createBiquadFilter(), g3 = a.createGain();
    o1.type = 'triangle'; o2.type = 'sine'; o3.type = 'square';
    o1.frequency.setValueAtTime(f0, t); o1.frequency.exponentialRampToValueAtTime(f0 * 1.18, t + dur);
    o2.frequency.setValueAtTime(f0 * (kind === 'hee' ? 2.45 : 2.05), t);
    o3.frequency.setValueAtTime(f0 * 0.5, t);
    f1.type = 'bandpass'; f1.frequency.value = kind === 'ga' ? 500 : (kind === 'hee' ? 980 : 740); f1.Q.value = 2.4;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.014); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g3.gain.setValueAtTime(0.0001, t); g3.gain.exponentialRampToValueAtTime(vol * 0.14, t + 0.01); g3.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.4);
    o1.connect(f1); o2.connect(f1); f1.connect(g); g.connect(sfxGain);
    o3.connect(g3); g3.connect(sfxGain);
    o1.start(t); o2.start(t); o3.start(t); o1.stop(t + dur + 0.03); o2.stop(t + dur + 0.03); o3.stop(t + dur * 0.4);
  }
  function proceduralLaugh(p, fever) {
    p = p || 0;
    var base = 310 + (p % 7) * 24;
    var nSyl = fever ? 6 + (p % 3) : 3 + (p % 3);
    var gap = fever ? 0.07 : 0.095;
    var kinds = fever ? ['ha', 'hee', 'ha', 'ga', 'hee', 'ha'] : ['ha', 'ha', 'hee', 'ga', 'ha'];
    var vol = fever ? 0.62 : 0.58;
    for (var i = 0; i < nSyl; i++) {
      voiceHa(i * gap, base * (1 + i * 0.065) * (fever ? 1.14 : 1), fever ? 0.13 : 0.17, vol * (1 - i * 0.04), kinds[i % kinds.length]);
    }
  }

  function playBuf(name, opts) {
    opts = opts || {};
    if (muted) return false;
    var a = ctx(); if (!a) return false;
    var buf = buffers[name]; if (!buf) return false;
    var src = a.createBufferSource(); src.buffer = buf;
    var rate = opts.rate || 1;
    if (opts.detune) rate *= Math.pow(2, opts.detune / 12);
    src.playbackRate.value = rate;
    var g = a.createGain();
    var vol = opts.vol == null ? 1 : opts.vol;
    var t = a.currentTime + (opts.delay || 0);
    g.gain.setValueAtTime(Math.max(0.0001, vol), t);
    if (opts.fade) g.gain.exponentialRampToValueAtTime(0.0001, t + opts.fade);
    src.connect(g); g.connect(opts.bgm ? bgmGain : sfxGain);
    try { src.start(t); } catch (e) { return false; }
    return true;
  }

  var HA_NAMES = ['ha1', 'ha2', 'ha3', 'ha4', 'ha5', 'ha6'];
  var FEVER_NAMES = ['fever1', 'fever2', 'fever3'];
  var audioReady = false, audioLoading = null, audioPrefetch = null;
  function prefetchAudio() {
    if (audioPrefetch) return audioPrefetch;
    var names = HA_NAMES.concat(FEVER_NAMES).concat(['tap_ha']);
    audioPrefetch = Promise.all(names.map(function (n) {
      if (rawAudio[n] || buffers[n]) return Promise.resolve();
      return fetch('/assets/audio/' + n + '.wav?v=sfx2').then(function (r) {
        if (!r.ok) throw new Error('audio ' + n);
        return r.arrayBuffer();
      }).then(function (ab) { rawAudio[n] = ab; }).catch(function () {});
    }));
    return audioPrefetch;
  }
  function decodeFetched() {
    var a = ctx(); if (!a) return Promise.resolve();
    var names = Object.keys(rawAudio);
    if (!names.length) return Promise.resolve();
    return Promise.all(names.map(function (n) {
      if (buffers[n]) return Promise.resolve();
      var ab = rawAudio[n];
      return new Promise(function (res) {
        try {
          a.decodeAudioData(ab.slice(0), function (buf) { buffers[n] = buf; delete rawAudio[n]; res(); }, function () { res(); });
        } catch (e) { res(); }
      });
    })).then(function () {
      audioReady = HA_NAMES.some(function (n) { return !!buffers[n]; });
    });
  }
  function loadAudio() {
    if (audioReady) return Promise.resolve();
    if (audioLoading) return audioLoading;
    audioLoading = prefetchAudio().then(function () {
      /* 未解锁前不创建 AudioContext，避免 iOS 一直 suspended */
      if (!AC) return;
      return unlockAudio().then(function () { return decodeFetched(); });
    }).then(function () { audioLoading = null; }).catch(function () { audioLoading = null; });
    return audioLoading;
  }

  var SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
  var sfx = {
    click: function () { tone(660, .07, 'triangle', .18, 880); },
    tap: function () { if (muted) { toast('音效已关闭 · 点右上角喇叭开启'); return; } if (!playBuf('tap_ha', { vol: 1.0, detune: (Math.random() - .5) * 1.2 })) tone(520, .1, 'sine', .4, 820); },
    ha: function (p, feverOrOpts) {
      if (muted) { toast('音效已关闭 · 点右上角喇叭开启'); return; }
      var fever = false, intensity = 0;
      if (typeof feverOrOpts === 'object' && feverOrOpts) { fever = !!feverOrOpts.fever; intensity = feverOrOpts.intensity || 0; }
      else fever = !!feverOrOpts;
      p = (p || 0) | 0;
      var det = ((p * 17) % 7) - 3;
      var rate = 1 + det * 0.03 + Math.min(0.12, intensity * 0.01);
      function doPlay() {
        decodeFetched();
        if (fever) {
          var fn = FEVER_NAMES[p % FEVER_NAMES.length];
          var ok = playBuf(fn, { vol: 1.05, rate: rate * 1.04, detune: det * 0.4 });
          playBuf(HA_NAMES[(p + 2) % HA_NAMES.length], { vol: 0.7, rate: rate * 1.12, delay: 0.04 });
          if (!ok) proceduralLaugh(p, true);
          return;
        }
        var name = HA_NAMES[p % HA_NAMES.length];
        if (!playBuf(name, { vol: 1.05 + Math.min(0.1, intensity * 0.01), rate: rate })) proceduralLaugh(p, false);
      }
      /* 同一手势内：创建并 resume，再立刻发声（iOS 要求） */
      var a = ctx();
      if (a && a.state === 'suspended') a.resume();
      applyMuteGains();
      doPlay();
      prefetchAudio().then(function () { decodeFetched(); });
    },
    giggle: function (p) { sfx.ha(p || 0, false); },
    cackle: function (p) { sfx.ha(p || 0, true); },
    pop: function (p) { noise(.08, .12, 1600); tone(720 + (p || 0) * 60, .11, 'sine', .24, 280); },
    merge: function (lv) { var n = SCALE[Math.min(SCALE.length - 1, lv || 0)]; tone(n, .15, 'triangle', .3, n * 1.5); tone(n * 1.5, .2, 'sine', .18, null, .05); noise(.05, .07, 2800); },
    swap: function () { tone(400, .07, 'sine', .18, 580); },
    bad: function () { tone(210, .14, 'sawtooth', .14, 140); },
    combo: function (c) { var k = Math.min(c || 1, 7); for (var i = 0; i < 3; i++) tone(SCALE[Math.min(10, k + i * 2)], .12, 'triangle', .22, null, i * .055); },
    eat: function () { tone(880, .06, 'square', .1, 1200); tone(1320, .08, 'square', .08, 1760, .05); },
    drop: function () { tone(180, .11, 'sine', .3, 70); noise(.045, .08, 400); },
    jump: function (pw) { var p = Math.max(0, Math.min(1, pw == null ? 0.55 : pw)); tone(280 + p * 80, .18 + p * .06, 'sine', .26, 700 + p * 180); },
    land: function () { tone(150, .12, 'sine', .34, 60); noise(.05, .1, 600); },
    perfect: function () { [0, 2, 4, 7].forEach(function (k, i) { tone(SCALE[k + 3], .12, 'triangle', .22, null, i * .05); }); },
    win: function () { [0, 2, 4, 5, 7].forEach(function (k, i) { tone(SCALE[k], .18, 'triangle', .26, null, i * .08); }); },
    lose: function () { tone(420, .2, 'sawtooth', .16, 280); tone(300, .22, 'sawtooth', .16, 180, .16); tone(200, .4, 'sawtooth', .18, 90, .32); },
    start: function () { [0, 4, 7].forEach(function (k, i) { tone(SCALE[k + 2], .11, 'triangle', .22, null, i * .06); }); },
    nearMiss: function () { tone(920, .06, 'sine', .12, 1400); noise(.04, .06, 3200); },
    slide: function () { noise(.09, .14, 900); tone(180, .1, 'sine', .2, 90); },
    spring: function () { tone(360, .1, 'triangle', .22, 720); tone(540, .12, 'sine', .18, 880, .05); },
    djump: function () { tone(340, .12, 'sine', .2, 760); },
    slice: function () { noise(.05, .1, 2400); tone(880, .07, 'square', .12, 420); },
    sliceCombo: function (n) { var k = Math.min(n || 1, 8); for (var i = 0; i < 2; i++) tone(SCALE[Math.min(10, 4 + k + i)], .09, 'triangle', .2, null, i * .04); },
    whoosh: function () { noise(.06, .08, 1800); },
    hit: function () { tone(160, .16, 'sawtooth', .2, 70); noise(.1, .16, 700); },
    fanfare: function () { [0, 4, 7, 12].forEach(function (k, i) { tone(SCALE[Math.min(10, k)] || (261.6 * Math.pow(2, k/12)), .1, 'triangle', .2, null, i * .05); }); },
    coin: function () { tone(980, .07, 'sine', .18, 1320); }
  };

  /* 轻量循环 BGM：原创五声琶音，不大声 */
  var BGM_PAT = {
    lobby: { notes: [0, 2, 4, 7, 4, 2, 0, 4], base: 2, gap: 0.42, type: 'sine', vol: 0.07 },
    play: { notes: [0, 4, 7, 4, 2, 5, 4, 0], base: 3, gap: 0.36, type: 'triangle', vol: 0.06 },
    fever: { notes: [4, 7, 9, 7, 4, 7, 11, 9], base: 4, gap: 0.22, type: 'triangle', vol: 0.08 }
  };
  function stopBgm(keepKey) {
    if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; }
    bgmNext = 0;
    if (!keepKey) bgmKey = null;
  }
  function scheduleBgmStep() {
    if (!bgmKey || muted) { bgmTimer = null; return; }
    var a = ctx(); if (!a || !bgmGain) { bgmTimer = null; return; }
    var pat = BGM_PAT[bgmKey] || BGM_PAT.play;
    var now = a.currentTime;
    if (bgmNext < now) bgmNext = now + 0.02;
    var step = (scheduleBgmStep._i || 0) % pat.notes.length;
    scheduleBgmStep._i = step + 1;
    var f = SCALE[Math.min(SCALE.length - 1, pat.base + pat.notes[step])];
    var o = a.createOscillator(), g = a.createGain();
    o.type = pat.type; o.frequency.value = f;
    var t0 = bgmNext;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(pat.vol, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + pat.gap * 0.85);
    o.connect(g); g.connect(bgmGain); o.start(t0); o.stop(t0 + pat.gap);
    bgmNext = t0 + pat.gap;
    bgmTimer = setTimeout(scheduleBgmStep, Math.max(20, pat.gap * 1000 * 0.9));
  }
  function playBgm(key) {
    key = key || 'play';
    if (bgmKey === key && bgmTimer) return;
    stopBgm();
    bgmKey = key; scheduleBgmStep._i = 0;
    if (muted) return;
    ctx(); applyMuteGains();
    scheduleBgmStep();
  }

  function startFeverGiggle() {
    stopFeverGiggle();
    function tick() {
      if (muted) return;
      sfx.ha((Math.random() * 6) | 0, true);
      feverLoop = setTimeout(tick, 280 + Math.random() * 220);
    }
    feverLoop = setTimeout(tick, 180);
  }
  function stopFeverGiggle() { if (feverLoop) { clearTimeout(feverLoop); feverLoop = null; } }

  var SND_ICON = {
    on: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="#5a3a00" stroke-width="1.5"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
    off: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="#5a3a00" stroke-width="1.5"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
  };
  function syncMuteButtons() {
    var nodes = document.querySelectorAll('#nw-snd, #lobby-snd, .nw-mute-btn');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.innerHTML = muted ? SND_ICON.off : SND_ICON.on;
      el.classList.toggle('muted', muted);
      el.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }
  }
  function bindMuteButton(el) {
    if (!el) return;
    el.innerHTML = muted ? SND_ICON.off : SND_ICON.on;
    el.classList.toggle('muted', muted);
    el.addEventListener('click', function (e) { e.preventDefault(); toggleMute(); });
  }

  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
    root.addEventListener(ev, function () {
      prefetchAudio();
      if (AC) { unlockAudio().then(decodeFetched); }
    }, { passive: true });
  });
  try { prefetchAudio(); } catch (e) {}
  var canVib = null;
  sfx.charge = function (pw) {
    try {
      var a = ctx(); if (!a || muted) return;
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = 180 + (pw || 0) * 420;
      g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.045, a.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.09);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.1);
    } catch (e) {}
  };
  sfx.spark = function () { try { noise && noise(0.06, 0.12, 1400); } catch (e) { tone(1200, 0.05, 'square', 0.04); } };
  sfx.reward = function () {
    try { var notes = [523, 659, 784, 1047]; notes.forEach(function (f, i) { setTimeout(function () { tone(f, 0.1, 'sine', 0.06); }, i * 90); }); } catch (e) {}
  };
  sfx.feverIn = function () { try { var a = ctx(); if (!a || muted) return; var o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(400, a.currentTime); o.frequency.exponentialRampToValueAtTime(900, a.currentTime + 0.15); g.gain.value = 0.08; g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.18); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.2); } catch (e) {} };
  function vib(n) {
    try {
      if (muted) return;
      if (canVib === null) { try { canVib = !!(navigator.vibrate && navigator.vibrate(0) !== false); } catch (e) { canVib = false; } }
      if (canVib && navigator.vibrate) navigator.vibrate(n);
    } catch (e) {}
  }

  /* ---------- 粒子 ---------- */
  function FX() { this.p = []; }
  FX.MAX_P = 140;
  FX.prototype.burst = function (x, y, o) {
    o = o || {};
    var reduce = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var n = o.count || 14; if (reduce) n = Math.max(2, Math.floor(n * 0.3));
    var cols = o.colors || ['#FFD23F', '#7CC93E', '#fff', '#FF9F43'];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, sp = (o.speed || 240) * (0.35 + Math.random() * 0.75);
      this.p.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 60), life: 0, max: (o.life || .7) * (0.7 + Math.random() * .6), size: (o.size || 7) * (0.6 + Math.random() * .8), color: cols[i % cols.length], shape: o.shape || (Math.random() < .5 ? 'star' : 'circle'), rot: Math.random() * 6, vr: (Math.random() - .5) * 10, g: o.gravity == null ? 520 : o.gravity });
    }
    while (this.p.length > FX.MAX_P) {
      var drop = -1;
      for (var j = 0; j < this.p.length; j++) if (this.p[j].shape !== 'text' && this.p[j].shape !== 'ripple' && this.p[j].shape !== 'ring') { drop = j; break; }
      if (drop < 0) break; this.p.splice(drop, 1);
    }
  };
  FX.prototype.ripple = function (x, y, o) {
    o = o || {};
    this.p.push({ x: x, y: y, vx: 0, vy: 0, life: 0, max: o.life || 0.32, size: o.size || 10, color: o.color || 'rgba(255,255,255,.85)', shape: 'ripple', rot: 0, vr: 0, g: 0, maxR: o.maxR || 48, line: o.line || 3 });
  };
  FX.prototype.ring = function (x, y, o) {
    o = o || {};
    this.p.push({ x: x, y: y, vx: 0, vy: 0, life: 0, max: o.life || 0.55, size: o.size || 20, color: o.color || 'rgba(255,210,63,.7)', shape: 'ring', rot: 0, vr: 0, g: 0, maxR: o.maxR || 160, line: o.line || 10 });
  };
  FX.prototype.text = function (x, y, str, o) {
    o = o || {}; this.p.push({ x: x, y: y, vx: 0, vy: -(o.rise || 70), life: 0, max: o.life || .9, size: o.size || 26, color: o.color || '#ff8a00', shape: 'text', text: str, g: 0, rot: 0, vr: 0, pop: 1, stroke: o.stroke || '#fff' });
  };
  FX.prototype.update = function (dt) {
    var p = this.p;
    for (var i = p.length - 1; i >= 0; i--) {
      var q = p[i]; q.life += dt; if (q.life >= q.max) { p.splice(i, 1); continue; }
      q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
    }
  };
  FX.prototype.draw = function (c) {
    var p = this.p;
    for (var i = 0; i < p.length; i++) {
      var q = p[i], t = q.life / q.max, a = t < .7 ? 1 : 1 - (t - .7) / .3;
      c.save(); c.globalAlpha = Math.max(0, a); c.translate(q.x, q.y);
      if (q.shape === 'text') {
        var sc = t < .15 ? .5 + (t / .15) * .7 : (t < .3 ? 1.2 - (t - .15) / .15 * .2 : 1);
        c.scale(sc, sc); c.font = '900 ' + q.size + 'px ' + getComputedStyle(document.body).fontFamily; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = Math.max(4, q.size / 5); c.strokeStyle = q.stroke; c.lineJoin = 'round'; c.strokeText(q.text, 0, 0); c.fillStyle = q.color; c.fillText(q.text, 0, 0);
      } else if (q.shape === 'ripple' || q.shape === 'ring') {
        var rr = (q.size || 8) + t * (q.maxR || 48);
        c.strokeStyle = q.color; c.lineWidth = Math.max(1, (q.line || 3) * (1 - t));
        c.beginPath(); c.arc(0, 0, rr, 0, 6.283); c.stroke();
      } else {
        c.rotate(q.rot); var s = q.size * (1 - t * .4); c.fillStyle = q.color;
        if (q.shape === 'star') { c.beginPath(); for (var k = 0; k < 10; k++) { var r = k % 2 ? s * .45 : s, an = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); }
        else { c.beginPath(); c.arc(0, 0, s * .6, 0, 6.283); c.fill(); }
      }
      c.restore();
    }
  };

  /* ---------- 画布自适应 ---------- */
  function fit(canvas, box, aspect, maxW) {
    var r = box.getBoundingClientRect(), w = Math.min(r.width, maxW || 9999), h = w / aspect;
    if (h > r.height) { h = r.height; w = h * aspect; }
    var dpr = Math.min(root.devicePixelRatio || 1, 2.5);
    canvas.style.width = Math.floor(w) + 'px'; canvas.style.height = Math.floor(h) + 'px';
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    return { w: Math.floor(w), h: Math.floor(h), dpr: dpr };
  }

  /* ---------- 工具 ---------- */
  function toast(msg) {
    var t = $('.nw-toast'); if (!t) { t = document.createElement('div'); t.className = 'nw-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(t.__t); t.__t = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }
  function shake(el, amp, dur) {
    if (!el || !el.animate) return; amp = amp || 8;
    el.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + -amp + 'px,' + amp / 2 + 'px)' }, { transform: 'translate(' + amp + 'px,' + -amp / 2 + 'px)' }, { transform: 'translate(' + -amp / 2 + 'px,0)' }, { transform: 'translate(0,0)' }], { duration: dur || 280, easing: 'ease-out' });
  }
  var ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    on: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="#5a3a00" stroke-width="1.5"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
    off: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="#5a3a00" stroke-width="1.5"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 11-2.4-5.7"/><path d="M20 4v5h-5"/></svg>'
  };

  /* ---------- 游戏壳 ---------- */
  function mount(o) {
    var best = store.get('best_' + o.key, 0), score = 0, running = false;
    var top = $('#nw-top'), hud = $('#nw-hud');
    top.className = 'nw-top';
    top.innerHTML = '<a class="round-btn" href="/" aria-label="返回合集" id="nw-back">' + ICON.back + '</a>' +
      '<h1><img src="/assets/favicon-frog.png" alt="">' + o.title + '</h1>' +
      '<button class="round-btn" id="nw-snd" aria-label="音效开关">' + (muted ? ICON.off : ICON.on) + '</button>' +
      '<button class="round-btn" id="nw-redo" aria-label="重新开始">' + ICON.redo + '</button>';
    hud.className = 'nw-hud';
    hud.innerHTML = '<div class="nw-card"><small>' + (o.scoreLabel || '分数') + '</small><b id="nw-score">0</b></div>' +
      (o.extraCard ? '<div class="nw-card"><small>' + o.extraCard + '</small><b id="nw-extra">-</b></div>' : '') +
      '<div class="nw-card hi"><small>最高</small><b id="nw-best">' + best + '</b></div>';
    var m = document.createElement('div');
    m.innerHTML =
      '<div class="nw-modal show" id="nw-start"><div class="nw-dialog"><div class="mascot">' + NaiwaFrog.html({ pose: 'peace', style: 'height:150px;width:auto;margin:0 auto;display:block;object-fit:contain' }) + '</div>' +
      '<h2>' + o.title + '</h2><p>' + (o.rules || '') + '</p><div class="row"><button class="btn green big" id="nw-go">开始游戏</button><a class="btn white small" href="/">返回合集</a></div></div></div>' +
      '<div class="nw-modal" id="nw-over"><div class="nw-dialog"><div class="mascot" id="nw-over-m"></div><div id="nw-over-badge"></div><h2 id="nw-over-title">游戏结束</h2><p id="nw-over-sub"></p><div class="big-score" id="nw-over-score">0</div><p>最高分 <b id="nw-over-best">0</b></p>' +
      '<div class="row"><button class="btn green big" id="nw-again">再来一局</button><div class="row2"><button class="btn small" id="nw-share">分享战绩</button><a class="btn white small" href="/">返回合集</a></div></div></div></div>';
    while (m.firstChild) document.body.appendChild(m.firstChild);
    var sEl = $('#nw-score'), bEl = $('#nw-best');
    var ctl = {
      get score() { return score; }, get best() { return best; }, get running() { return running; },
      setScore: function (n, pop) { score = n; sEl.textContent = n; if (pop !== false) { sEl.classList.remove('pop'); void sEl.offsetWidth; sEl.classList.add('pop'); } if (n > best) { best = n; bEl.textContent = n; ctl.newBest = true; } },
      setExtra: function (t) { var e = $('#nw-extra'); if (e) e.textContent = t; },
      begin: function () { score = 0; ctl.newBest = false; sEl.textContent = '0'; running = true; $('#nw-start').classList.remove('show'); $('#nw-over').classList.remove('show'); loadAudio(); sfx.start(); playBgm(o.bgm || 'play'); o.onStart && o.onStart(); },
      over: function (sub, title) {
        if (!running) return; running = false; var isNew = ctl.newBest && score > 0; var prev = store.get('best_' + o.key, 0);
        if (score > prev) store.set('best_' + o.key, score);
        $('#nw-over-score').textContent = score; $('#nw-over-best').textContent = Math.max(best, prev);
        $('#nw-over-title').textContent = title || (isNew ? '新纪录！' : '游戏结束'); $('#nw-over-sub').textContent = sub || '';
        $('#nw-over-badge').innerHTML = isNew ? '<span class="badge">新纪录</span>' : '';
        $('#nw-over-m').innerHTML = NaiwaFrog.html({ pose: isNew ? 'peace' : 'stand', mood: isNew ? 'laugh' : 'neutral', style: 'height:150px;width:auto;margin:0 auto;display:block;object-fit:contain' });
        stopFeverGiggle(); playBgm('lobby');
        isNew ? sfx.win() : sfx.lose();
        setTimeout(function () { $('#nw-over').classList.add('show'); }, 450);
      },
      toast: toast
    };
    $('#nw-go').onclick = function () { ctl.begin(); };
    $('#nw-again').onclick = function () { ctl.begin(); };
    $('#nw-redo').onclick = function () { sfx.click(); ctl.begin(); };
    $('#nw-snd').onclick = function () { toggleMute(); };
    if (muted) $('#nw-snd').classList.add('muted');
    syncMuteButtons();
    $('#nw-share').onclick = function () {
      var text = '我在奶蛙「' + o.title + '」拿了 ' + score + ' 分！来挑战我 👉 ' + SITE + '/' + o.key + '/';
      if (navigator.share) { navigator.share({ title: '奶蛙小游戏', text: text, url: SITE + '/' + o.key + '/' }).catch(function () {}); }
      else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(function () { toast('战绩已复制，去分享吧'); }, function () { toast(text); }); }
      else { toast(text); }
    };
    // 阻止 iOS 双击放大 / 橡皮筋
    var last = 0; document.addEventListener('touchend', function (e) { var n = Date.now(); if (n - last < 320 && e.target.closest && !e.target.closest('button,a')) e.preventDefault(); last = n; }, { passive: false });
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('touchmove', function (e) { if (!e.target.closest('.nw-dialog')) e.preventDefault(); }, { passive: false });
    return ctl;
  }

  function grade(score, tiers) {
    tiers = tiers || [[7000, '笑到打滚'], [4500, '一秒破绷'], [2500, '噗嗤一声'], [1000, '嘴角上扬'], [0, '就这？']];
    for (var i = 0; i < tiers.length; i++) if (score >= tiers[i][0]) return tiers[i][1];
    return tiers[tiers.length - 1][1];
  }
  function reduceMotion() { try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  function reducedMotion() { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  root.NW = { reducedMotion: reducedMotion, store: store, sfx: sfx, tone: tone, vib: vib, FX: FX, fit: fit, toast: toast, shake: shake, mount: mount, grade: grade, reduceMotion: reduceMotion, isMuted: function () { return muted; }, setMuted: setMuted, toggleMute: toggleMute, bindMuteButton: bindMuteButton, playBgm: playBgm, stopBgm: stopBgm, loadAudio: loadAudio, prefetchAudio: prefetchAudio, unlockAudio: unlockAudio, startFeverGiggle: startFeverGiggle, stopFeverGiggle: stopFeverGiggle };
})(window);
/* 叠加层 canvas（粒子特效）：自动跟随容器尺寸 */
(function (root) {
  root.NW.overlay = function (box) {
    var c = document.createElement('canvas'); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5';
    box.appendChild(c);
    var o = { canvas: c, ctx: c.getContext('2d'), w: 0, h: 0, dpr: 1, resize: function () { var r = box.getBoundingClientRect(); o.dpr = Math.min(root.devicePixelRatio || 1, 2.5); o.w = r.width; o.h = r.height; c.width = Math.round(r.width * o.dpr); c.height = Math.round(r.height * o.dpr); } };
    o.resize(); root.addEventListener('resize', o.resize); if (root.ResizeObserver) new ResizeObserver(o.resize).observe(box);
    return o;
  };
  root.NW.head = function (title, key, desc) { return ''; };
})(window);
