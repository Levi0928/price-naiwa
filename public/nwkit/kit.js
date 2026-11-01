/* 奶蛙新游戏公共小工具：画布舞台 / 循环(含顿帧) / 缓动 / 蛙头像缓存。
 * 依赖 /assets/frog.js 与 /assets/nw.js，只被新增游戏目录使用。 */
(function (root) {
  'use strict';
  var K = {};
  K.rr = function (c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  K.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  K.lerp = function (a, b, t) { return a + (b - a) * t; };
  K.rand = function (a, b) { return a + Math.random() * (b - a); };
  K.ease = {
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    inQuad: function (t) { return t * t; },
    inOutCubic: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    outBack: function (t) { var s = 1.70158; t -= 1; return t * t * ((s + 1) * t + s) + 1; },
    outElastic: function (t) { if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1; }
  };
  /* 蛙头像：3D 染色 PNG */
  var cache = {};
  K.bust = function (color, mood) {
    var k = 'bust|' + color + '|' + (mood || 'neutral');
    if (!cache[k]) cache[k] = NaiwaFrog.pieceImage({ shape: 'bust', color: color, mood: mood || 'neutral' });
    return cache[k];
  };
  K.drawBust = function (c, color, mood, x, y, size, rot) {
    var im = K.bust(color, mood); if (!(im.complete && im.naturalWidth)) return;
    if (rot) { c.save(); c.translate(x, y); c.rotate(rot); c.drawImage(im, -size / 2, -size / 2, size, size); c.restore(); }
    else c.drawImage(im, x - size / 2, y - size / 2, size, size);
  };
  K.body = function (color, mood, h) {
    var gold = !color || color === '#F7C32B' || String(color).toLowerCase() === '#f7c32b';
    var k = 'B|' + color + '|' + (mood || 'neutral') + '|' + (gold ? 'png' : 'tint');
    if (!cache[k]) {
      if (gold) cache[k] = NaiwaFrog.load({ pose: (mood === 'laugh' || mood === 'cackle') ? 'stand' : 'stand', mood: mood || 'neutral' });
      else cache[k] = NaiwaFrog.pieceImage({ shape: 'body', color: color, mood: mood || 'neutral' });
      /* laugh gold full body */
      if (gold && (mood === 'laugh' || mood === 'cackle')) cache[k] = NaiwaFrog.load({ mood: 'laugh' });
    }
    return cache[k];
  };
  K.drawBody = function (c, color, mood, x, y, h, rot) {
    var im = K.body(color, mood, h); if (!(im.complete && im.naturalWidth)) return;
    var w = h * (im.naturalWidth / im.naturalHeight);
    if (rot) { c.save(); c.translate(x, y); c.rotate(rot); c.drawImage(im, -w / 2, -h / 2, w, h); c.restore(); }
    else c.drawImage(im, x - w / 2, y - h / 2, w, h);
  };
  K.preload = function (colors, moods) { colors.forEach(function (c) { moods.forEach(function (m) { K.bust(c, m); }); }); };

  /* 舞台：逻辑分辨率 W×H，自动适配容器与 DPR；统一指针事件 */
  K.stage = function (o) {
    var box = document.getElementById('box'), cv = document.getElementById('cv'), c = cv.getContext('2d');
    var S = { cv: cv, c: c, W: o.W, H: o.H, sc: 1, shakeAmt: 0, fx: new NW.FX(), time: 0, freezeT: 0, handlers: {} };
    function resize() { NW.fit(cv, box, o.W / o.H, o.maxW || 480); S.sc = cv.width / o.W; }
    window.addEventListener('resize', resize); resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(box);
    S.pt = function (e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * o.W, y: (e.clientY - r.top) / r.height * o.H }; };
    cv.style.touchAction = 'none';
    function bind(type, name) {
      cv.addEventListener(type, function (e) {
        var h = S.handlers[name]; if (!h) return; var p = S.pt(e);
        if (name === 'down') { try { cv.setPointerCapture(e.pointerId); } catch (_) {} }
        h(p.x, p.y, e);
        if (name !== 'move' || e.cancelable) e.preventDefault();
      });
    }
    bind('pointerdown', 'down'); bind('pointermove', 'move'); bind('pointerup', 'up'); bind('pointercancel', 'up');
    S.on = function (h) { for (var k in h) S.handlers[k] = h[k]; };
    S.shake = function (a) { S.shakeAmt = Math.max(S.shakeAmt, a); };
    S.freeze = function (ms) { S.freezeT = Math.max(S.freezeT, ms / 1000); };
    S.run = function (update, draw) {
      var last = performance.now();
      function frame(t) {
        var dt = Math.min(.033, (t - last) / 1000); last = t; S.time += dt;
        var sim = dt; if (S.freezeT > 0) { S.freezeT -= dt; sim = dt * .05; }
        update(sim, dt); S.fx.update(dt);
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
        var sx = 0, sy = 0; if (S.shakeAmt > .2) { sx = (Math.random() - .5) * S.shakeAmt; sy = (Math.random() - .5) * S.shakeAmt; S.shakeAmt *= Math.pow(.0008, dt); } else S.shakeAmt = 0;
        c.setTransform(S.sc, 0, 0, S.sc, sx * S.sc, sy * S.sc);
        draw(c); S.fx.draw(c);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };
    S.panel = function (c, top, bot) {
      var g = c.createLinearGradient(0, 0, 0, o.H); g.addColorStop(0, top || '#fff7ec'); g.addColorStop(1, bot || '#ffe8c2');
      c.fillStyle = g; K.rr(c, 0, 0, o.W, o.H, 22); c.fill();
      c.strokeStyle = 'rgba(26,22,18,.12)'; c.lineWidth = 1.5; K.rr(c, 1, 1, o.W - 2, o.H - 2, 21); c.stroke();
    };
    return S;
  };
  K.page = function (title) { return title; };
  root.NWK = K;
})(window);
