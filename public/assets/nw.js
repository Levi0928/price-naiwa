/* 奶蛙合集 · 公共运行时：音效 / 粒子 / 存档 / 游戏壳 */
(function (root) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var SITE = 'https://price-naiwa.onrender.com';

  /* ---------- 存档 ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('nw_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('nw_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- WebAudio 合成音效 ---------- */
  var AC = null, master = null, muted = !!store.get('mute', false);
  function ctx() {
    if (!AC) {
      var C = root.AudioContext || root.webkitAudioContext; if (!C) return null;
      AC = new C(); master = AC.createGain(); master.gain.value = 0.55; master.connect(AC.destination);
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f, d, type, vol, slide, delay) {
    if (muted) return; var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.03);
  }
  function noise(d, vol, hp, delay) {
    if (muted) return; var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), ch = b.getChannelData(0);
    for (var i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp || 800; g.gain.value = vol || 0.2; s.buffer = b; s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  var SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
  var sfx = {
    click: function () { tone(660, .07, 'triangle', .22, 880); },
    tap: function () { tone(520, .09, 'sine', .3, 820); },
    ha: function (p) { var b = 300 + (p || 0) * 28; tone(b, .09, 'square', .12, b * 1.3); tone(b * 1.25, .09, 'square', .1, b * 1.5, .08); tone(b * 1.5, .12, 'triangle', .14, b * 1.2, .16); },
    pop: function (p) { noise(.1, .14, 1500); tone(700 + (p || 0) * 70, .12, 'sine', .28, 260); },
    merge: function (lv) { var n = SCALE[Math.min(SCALE.length - 1, lv || 0)]; tone(n, .16, 'triangle', .34, n * 1.5); tone(n * 1.5, .22, 'sine', .22, null, .06); noise(.06, .08, 3000); },
    swap: function () { tone(380, .08, 'sine', .2, 560); },
    bad: function () { tone(220, .14, 'sawtooth', .16, 150); },
    combo: function (c) { var k = Math.min(c || 1, 7); for (var i = 0; i < 3; i++) tone(SCALE[Math.min(10, k + i * 2)], .13, 'triangle', .26, null, i * .06); },
    eat: function () { tone(880, .06, 'square', .12, 1200); tone(1320, .09, 'square', .1, 1760, .05); },
    drop: function () { tone(180, .12, 'sine', .35, 70); noise(.05, .1, 400); },
    jump: function () { tone(300, .22, 'sine', .3, 760); },
    land: function () { tone(150, .14, 'sine', .4, 60); noise(.06, .12, 600); },
    perfect: function () { [0, 2, 4, 7].forEach(function (k, i) { tone(SCALE[k + 3], .14, 'triangle', .26, null, i * .05); }); },
    win: function () { [0, 2, 4, 5, 7].forEach(function (k, i) { tone(SCALE[k], .2, 'triangle', .3, null, i * .09); }); },
    lose: function () { tone(440, .22, 'sawtooth', .2, 300); tone(330, .22, 'sawtooth', .2, 220, .18); tone(220, .45, 'sawtooth', .22, 110, .36); },
    start: function () { [0, 4, 7].forEach(function (k, i) { tone(SCALE[k + 2], .12, 'triangle', .26, null, i * .07); }); }
  };
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { root.addEventListener(ev, function () { if (!muted) ctx(); }, { passive: true }); });
  function vib(n) { try { if (!muted && navigator.vibrate) navigator.vibrate(n); } catch (e) {} }

  /* ---------- 粒子 ---------- */
  function FX() { this.p = []; }
  FX.prototype.burst = function (x, y, o) {
    o = o || {}; var n = o.count || 14, cols = o.colors || ['#FFD23F', '#7CC93E', '#fff', '#FF9F43'];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, sp = (o.speed || 240) * (0.35 + Math.random() * 0.75);
      this.p.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 60), life: 0, max: (o.life || .7) * (0.7 + Math.random() * .6), size: (o.size || 7) * (0.6 + Math.random() * .8), color: cols[i % cols.length], shape: o.shape || (Math.random() < .5 ? 'star' : 'circle'), rot: Math.random() * 6, vr: (Math.random() - .5) * 10, g: o.gravity == null ? 520 : o.gravity });
    }
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
      begin: function () { score = 0; ctl.newBest = false; sEl.textContent = '0'; running = true; $('#nw-start').classList.remove('show'); $('#nw-over').classList.remove('show'); sfx.start(); o.onStart && o.onStart(); },
      over: function (sub, title) {
        if (!running) return; running = false; var isNew = ctl.newBest && score > 0; var prev = store.get('best_' + o.key, 0);
        if (score > prev) store.set('best_' + o.key, score);
        $('#nw-over-score').textContent = score; $('#nw-over-best').textContent = Math.max(best, prev);
        $('#nw-over-title').textContent = title || (isNew ? '新纪录！' : '游戏结束'); $('#nw-over-sub').textContent = sub || '';
        $('#nw-over-badge').innerHTML = isNew ? '<span class="badge">新纪录</span>' : '';
        $('#nw-over-m').innerHTML = NaiwaFrog.html({ pose: isNew ? 'peace' : 'stand', mood: isNew ? 'laugh' : 'neutral', style: 'height:150px;width:auto;margin:0 auto;display:block;object-fit:contain' });
        isNew ? sfx.win() : sfx.lose();
        setTimeout(function () { $('#nw-over').classList.add('show'); }, 450);
      },
      toast: toast
    };
    $('#nw-go').onclick = function () { ctl.begin(); };
    $('#nw-again').onclick = function () { ctl.begin(); };
    $('#nw-redo').onclick = function () { sfx.click(); ctl.begin(); };
    $('#nw-snd').onclick = function () { muted = !muted; store.set('mute', muted); this.innerHTML = muted ? ICON.off : ICON.on; this.classList.toggle('muted', muted); if (!muted) sfx.click(); };
    if (muted) $('#nw-snd').classList.add('muted');
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

  root.NW = { store: store, sfx: sfx, tone: tone, vib: vib, FX: FX, fit: fit, toast: toast, shake: shake, mount: mount, isMuted: function () { return muted; } };
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
