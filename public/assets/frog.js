/* 奶蛙 · 角色：3D PNG 主形象 + 染色 PNG 棋子（ball/bust/body）
 * NaiwaFrog.png / html / load / spritePng  -> 全身/头 PNG
 * NaiwaFrog.piece / pieceUrl / pieceSprite -> 彩色棋子（3D 头染色）
 * NaiwaFrog.svg / bust / ball              -> 旧矢量兜底（尽量别用）
 */
(function (root) {
  'use strict';
  var uid = 0;
  var ASSET = {
    stand: '/assets/frog/frog-front.png',
    front: '/assets/frog/frog-front.png',
    peace: '/assets/frog/frog-peace.png',
    laugh: '/assets/frog/frog-laugh.png',
    head: '/assets/frog/frog-head.png'
  };
  var ASSET_SM = {
    stand: '/assets/frog/frog-front-sm.png',
    front: '/assets/frog/frog-front-sm.png',
    peace: '/assets/frog/frog-peace-sm.png',
    laugh: '/assets/frog/frog-laugh-sm.png',
    head: '/assets/frog/frog-head-sm.png'
  };

  function poseKey(o) {
    o = o || {};
    if (o.pose === 'peace') return 'peace';
    if (o.pose === 'cheer') return 'peace';
    if (o.pose === 'front' || o.pose === 'stand') {
      if (o.mood === 'laugh' || o.mood === 'cackle') return 'laugh';
      return 'stand';
    }
    if (o.mood === 'laugh' || o.mood === 'cackle') return 'laugh';
    if (o.crop === 'head') return 'head';
    return 'stand';
  }

  function png(o) {
    o = o || {};
    var key = poseKey(o);
    return (o.sm ? ASSET_SM : ASSET)[key] || ASSET.stand;
  }

  function html(o) {
    o = o || {};
    var src = png(o);
    var cls = 'nf-png' + (o.anim ? ' nf-anim' : '') + (o.className ? ' ' + o.className : '');
    var st = o.style || '';
    if (o.width && st.indexOf('width') < 0) st = 'width:' + (typeof o.width === 'number' ? o.width + 'px' : o.width) + ';' + st;
    if (o.height && st.indexOf('height') < 0) st = 'height:' + (typeof o.height === 'number' ? o.height + 'px' : o.height) + ';' + st;
    return '<img class="' + cls + '" src="' + src + '" alt="奶蛙" draggable="false" decoding="async"' +
      (o.width && typeof o.width === 'number' ? ' width="' + o.width + '"' : '') +
      ' style="' + st + '">';
  }

  var imgCache = {};
  function load(srcOrOpts, cb) {
    var src = typeof srcOrOpts === 'string' ? srcOrOpts : png(srcOrOpts);
    var im = imgCache[src];
    if (!im) {
      im = new Image();
      im.decoding = 'async';
      im.src = src;
      imgCache[src] = im;
    }
    if (cb) {
      if (im.complete && im.naturalWidth) cb(im);
      else im.addEventListener('load', function () { cb(im); });
    }
    return im;
  }

  function spritePng(src, w, h, dpr) {
    dpr = dpr || Math.min(window.devicePixelRatio || 1, 2.5);
    var c = document.createElement('canvas');
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.__w = w; c.__h = h;
    load(src, function (im) {
      var ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      /* contain */
      var ir = im.naturalWidth / im.naturalHeight, cr = w / h;
      var dw, dh;
      if (ir > cr) { dw = c.width; dh = dw / ir; }
      else { dh = c.height; dw = dh * ir; }
      ctx.drawImage(im, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
      if (c.onready) c.onready();
    });
    return c;
  }

  /* ---------- color helpers（棋子用） ---------- */
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgb2hex(r, g, b) { return '#' + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
  function pal(base) {
    return {
      hi: mix(base, '#ffffff', 0.38),
      lite: mix(base, '#ffffff', 0.16),
      base: base,
      mid: mix(base, '#e07a00', 0.22),
      shade: mix(base, '#c05a00', 0.45),
      deep: mix(base, '#7a3000', 0.55)
    };
  }
  var GOLD = '#F7C32B';
  var BELLY = ['#FAEDCB', '#F1DDB2', '#E3C68E'];
  var OLIVE = ['#9a8a3a', '#6f6228', '#4a4219'];
  function f(n) { return Math.round(n * 100) / 100; }

  function defs(id, P, o) {
    var s = '<defs>';
    s += '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.hi + '"/><stop offset=".22" stop-color="' + P.lite + '"/><stop offset=".6" stop-color="' + P.base + '"/><stop offset="1" stop-color="' + P.mid + '"/></linearGradient>';
    s += '<linearGradient id="' + id + 'sd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + P.shade + '" stop-opacity=".85"/><stop offset=".16" stop-color="' + P.shade + '" stop-opacity=".25"/><stop offset=".34" stop-color="' + P.shade + '" stop-opacity="0"/><stop offset=".7" stop-color="' + P.shade + '" stop-opacity="0"/><stop offset=".86" stop-color="' + P.shade + '" stop-opacity=".3"/><stop offset="1" stop-color="' + P.deep + '" stop-opacity=".8"/></linearGradient>';
    s += '<linearGradient id="' + id + 'bt" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="' + P.shade + '" stop-opacity="0"/><stop offset="1" stop-color="' + P.shade + '" stop-opacity=".7"/></linearGradient>';
    s += '<linearGradient id="' + id + 'lt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.deep + '" stop-opacity=".55"/><stop offset=".45" stop-color="' + P.deep + '" stop-opacity="0"/></linearGradient>';
    s += '<radialGradient id="' + id + 'hl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".55" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
    s += '<radialGradient id="' + id + 'bl" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="' + BELLY[0] + '"/><stop offset=".7" stop-color="' + BELLY[1] + '"/><stop offset=".92" stop-color="' + BELLY[2] + '" stop-opacity=".95"/><stop offset="1" stop-color="' + BELLY[2] + '" stop-opacity="0"/></radialGradient>';
    s += '<linearGradient id="' + id + 'lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + P.mid + '"/><stop offset=".3" stop-color="' + P.base + '"/><stop offset=".62" stop-color="' + P.lite + '"/><stop offset="1" stop-color="' + P.shade + '"/></linearGradient>';
    s += '<radialGradient id="' + id + 'ol" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="' + OLIVE[0] + '"/><stop offset=".6" stop-color="' + OLIVE[1] + '"/><stop offset="1" stop-color="' + OLIVE[2] + '"/></radialGradient>';
    s += '<radialGradient id="' + id + 'ir" cx=".42" cy=".4" r=".62"><stop offset="0" stop-color="#d7eeb0"/><stop offset=".55" stop-color="#a9d284"/><stop offset="1" stop-color="#6aa24a"/></radialGradient>';
    s += '<radialGradient id="' + id + 'ey" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="' + P.hi + '"/><stop offset=".6" stop-color="' + P.lite + '"/><stop offset="1" stop-color="' + P.mid + '"/></radialGradient>';
    s += '<radialGradient id="' + id + 'gs" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6b4a00" stop-opacity=".34"/><stop offset=".6" stop-color="#6b4a00" stop-opacity=".16"/><stop offset="1" stop-color="#6b4a00" stop-opacity="0"/></radialGradient>';
    s += '<radialGradient id="' + id + 'mo" cx=".5" cy=".25" r=".9"><stop offset="0" stop-color="#5a1a08"/><stop offset=".7" stop-color="#8e3a14"/><stop offset="1" stop-color="#b9561f"/></radialGradient>';
    s += '<clipPath id="' + id + 'tc"><path d="' + TORSO + '"/></clipPath>';
    s += '</defs>';
    return s;
  }

  var TORSO = 'M200 26C164 26 148 52 146 92C144 132 128 152 108 178C80 212 68 266 78 334C88 390 140 426 200 426C260 426 312 390 322 334C332 266 320 212 292 178C272 152 256 132 254 92C252 52 236 26 200 26Z';

  function tube(pts, w0, w1, id, P) {
    var d = 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L');
    var s = '<path d="' + d + '" fill="none" stroke="' + P.shade + '" stroke-width="' + (w0 + 4) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="' + d + '" fill="none" stroke="url(#' + id + 'b)" stroke-width="' + w0 + '" stroke-linecap="round" stroke-linejoin="round"/>';
    return s;
  }
  function ctube(d, w, id, P) {
    return '<path d="' + d + '" fill="none" stroke="' + P.shade + '" stroke-width="' + (w + 4) + '" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="url(#' + id + 'b)" stroke-width="' + w + '" stroke-linecap="round"/>';
  }
  function hand(x, y, rot, id, big) {
    var k = big || 1;
    var s = '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + k + ')">';
    s += '<ellipse cx="0" cy="0" rx="15" ry="13" fill="url(#' + id + 'ol)"/>';
    [[-9, 12, 8], [0, 15, 0], [9, 12, -8]].forEach(function (a) {
      s += '<ellipse cx="' + a[0] + '" cy="' + a[1] + '" rx="4.8" ry="9" transform="rotate(' + a[2] + ' ' + a[0] + ' ' + a[1] + ')" fill="url(#' + id + 'ol)"/>';
    });
    s += '<ellipse cx="-4" cy="-5" rx="7" ry="4" fill="#fff" opacity=".18"/>';
    s += '</g>';
    return s;
  }
  function foot(side, id) {
    var g = '<g transform="translate(' + (200 + side * 60) + ' 516) scale(' + (side*1.1) + ' 1.1)">';
    g += '<ellipse cx="0" cy="-2" rx="30" ry="13" transform="rotate(-6)" fill="url(#' + id + 'ol)"/>';
    [[-26, 6, 7.5, -50], [-17, 10, 7.5, -28], [-6, 12, 7.5, -8], [6, 11, 7, 10], [-33, 0, 6.5, -70]].forEach(function (t) {
      g += '<ellipse cx="' + t[0] + '" cy="' + t[1] + '" rx="' + t[2] + '" ry="6.5" transform="rotate(' + t[3] + ' ' + t[0] + ' ' + t[1] + ')" fill="url(#' + id + 'ol)"/>';
    });
    g += '<ellipse cx="2" cy="-8" rx="14" ry="3.5" fill="#fff" opacity=".2"/>';
    g += '</g>';
    return g;
  }
  function eye(cx, cy, id, o) {
    var r = o.big ? 12.6 : 11.4;
    var px = (o.look && o.look[0] || 0) * 2.6, py = (o.look && o.look[1] || 0) * 2.6;
    var cid = id + 'ec' + (cx | 0);
    var s = '<clipPath id="' + cid + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 3) + '"/></clipPath>';
    s += '<ellipse cx="' + cx + '" cy="' + (cy + 3) + '" rx="' + (r + 7) + '" ry="' + (r + 7) + '" fill="url(#' + id + 'gs)"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 3.4) + '" fill="url(#' + id + 'ey)"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 0.9) + '" fill="#6a9d4a"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 0.5) + '" fill="url(#' + id + 'ir)"/>';
    s += '<ellipse cx="' + f(cx + px) + '" cy="' + f(cy + py + 0.4) + '" rx="' + (o.big ? 8.4 : 7.4) + '" ry="' + (o.big ? 9.6 : 8.8) + '" fill="#090908"/>';
    s += '<ellipse cx="' + f(cx + px - 2.9) + '" cy="' + f(cy + py - 3.6) + '" rx="3" ry="2.6" fill="#fff"/>';
    s += '<circle cx="' + f(cx + px + 3.1) + '" cy="' + f(cy + py + 3.8) + '" r="1.3" fill="#fff" opacity=".7"/>';
    s += '<path d="M' + (cx - r + 2.4) + ' ' + (cy - 2) + 'A' + (r - 2) + ' ' + (r - 2) + ' 0 0 1 ' + (cx + 1) + ' ' + (cy - r + 1.4) + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round"/>';
    s += '<g clip-path="url(#' + cid + ')">';
    if (o.cackle) {
      s += '<rect x="' + (cx - r - 6) + '" y="' + (cy - r - 6) + '" width="' + (2 * r + 12) + '" height="' + (2 * r + 12) + '" fill="url(#' + id + 'b)"/>';
      s += '<path d="M' + (cx - r + 1) + ' ' + (cy + 4) + 'Q' + cx + ' ' + (cy - 9) + ' ' + (cx + r - 1) + ' ' + (cy + 4) + '" fill="none" stroke="#5a3200" stroke-width="3.2" stroke-linecap="round"/>';
    } else if (o.smileEye) {
      s += '<path d="M' + (cx - r - 6) + ' ' + (cy + 5) + 'Q' + cx + ' ' + (cy - 3) + ' ' + (cx + r + 6) + ' ' + (cy + 5) + 'L' + (cx + r + 6) + ' ' + (cy + r + 8) + 'L' + (cx - r - 6) + ' ' + (cy + r + 8) + 'Z" fill="url(#' + id + 'b)"/>';
      s += '<path d="M' + (cx - r - 2) + ' ' + (cy + 5) + 'Q' + cx + ' ' + (cy - 3) + ' ' + (cx + r + 2) + ' ' + (cy + 5) + '" fill="none" stroke="' + o.P.shade + '" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>';
    }
    if (o.smug) {
      var t = o.side < 0 ? [-4, 2] : [2, -4];
      s += '<path d="M' + (cx - r - 6) + ' ' + (cy - r - 6) + 'L' + (cx + r + 6) + ' ' + (cy - r - 6) + 'L' + (cx + r + 6) + ' ' + (cy + t[1]) + 'L' + (cx - r - 6) + ' ' + (cy + t[0]) + 'Z" fill="url(#' + id + 'b)"/>';
      s += '<path d="M' + (cx - r - 3) + ' ' + (cy + t[0]) + 'L' + (cx + r + 3) + ' ' + (cy + t[1]) + '" stroke="' + o.P.deep + '" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>';
    }
    s += '<g class="nf-lid" style="transform-box:fill-box;transform-origin:50% 0;transform:scaleY(' + (o.lid || 0) + ')"><circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 4) + '" fill="url(#' + id + 'b)"/><path d="M' + (cx - r) + ' ' + (cy + r * 0.5) + 'Q' + cx + ' ' + (cy + r * 0.9) + ' ' + (cx + r) + ' ' + (cy + r * 0.5) + '" fill="none" stroke="' + o.P.deep + '" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/></g>';
    s += '</g>';
    return s;
  }
  function mouth(id, P, mood) {
    if (mood === 'laugh' || mood === 'cackle') {
      var s = '<path d="M168 128Q200 122 232 128Q230 156 200 158Q170 156 168 128Z" fill="url(#' + id + 'mo)" stroke="' + P.deep + '" stroke-width="2.4" stroke-linejoin="round"/>';
      s += '<clipPath id="' + id + 'mc"><path d="M168 128Q200 122 232 128Q230 156 200 158Q170 156 168 128Z"/></clipPath>';
      s += '<g clip-path="url(#' + id + 'mc)"><ellipse cx="200" cy="158" rx="19" ry="10" fill="#e9843f"/><ellipse cx="195" cy="154" rx="9" ry="3.2" fill="#ffb27a" opacity=".6"/>';
      s += '<rect x="187" y="122" width="13" height="10" rx="3" fill="#fff6e2"/><rect x="200" y="122" width="13" height="10" rx="3" fill="#fff6e2"/></g>';
      return s;
    }
    if (mood === 'wow') {
      return '<ellipse cx="200" cy="141" rx="12" ry="14" fill="url(#' + id + 'mo)" stroke="' + P.deep + '" stroke-width="2.2"/><ellipse cx="200" cy="150" rx="7" ry="4.6" fill="#e9843f"/><rect x="193" y="128" width="14" height="6" rx="2.6" fill="#fff6e2"/>';
    }
    if (mood === 'smug') {
      return '<path d="M176 136Q200 138 224 134" fill="none" stroke="#6a4208" stroke-width="2.6" stroke-linecap="round"/><path d="M178 139.5Q200 141.5 222 137.5" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>';
    }
    return '<path d="M181 136Q200 142 219 136" fill="none" stroke="#6a4208" stroke-width="2.6" stroke-linecap="round"/><path d="M183 139.8Q200 145.5 217 139.8" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="1.6" stroke-linecap="round"/>';
  }

  /* 整只蛙：默认金色走 3D PNG 的 data-url 包装不适用；保留 SVG 供彩色/特殊。
     若未指定 color 或 color 为金色，且未强制 forceSvg，返回空并建议用 html()/png()。
     为兼容旧调用：金色默认仍生成 SVG，但主要页面已切到 html()。 */
  function svg(o) {
    o = o || {};
    var id = o.id || ('nf' + (++uid) + '_');
    var P = pal(o.color || GOLD);
    var pose = o.pose || 'stand';
    var mood = o.mood || 'neutral';
    var width = o.width;
    var vb = o.crop === 'head' ? '110 20 180 190' : '0 0 400 556';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"' + (width ? ' width="' + width + '"' : '') + ' class="nf-svg' + (o.anim ? ' nf-anim' : '') + '" role="img" aria-label="奶蛙">';
    s += defs(id, P, o);
    s += '<ellipse cx="200" cy="534" rx="130" ry="13" fill="#6b4a00" opacity=".15"/><ellipse cx="200" cy="532" rx="88" ry="7" fill="#6b4a00" opacity=".16"/>';
    s += '<g class="nf-body">';
    var hands = '';
    var X = function (sd, x) { return sd < 0 ? x : 400 - x; };
    [-1, 1].forEach(function (sd) {
      var x = function (v) { return X(sd, v); };
      if (pose === 'peace') {
        s += ctube('M' + x(126) + ' 204C' + x(44) + ' 214 ' + x(34) + ' 150 ' + x(98) + ' 104', 50, id, P);
        hands += '<g transform="translate(' + x(106) + ' 82) rotate(' + (sd < 0 ? 18 : -18) + ')"><ellipse cx="0" cy="8" rx="19" ry="19" fill="url(#' + id + 'ol)"/>' +
          '<path d="M-7 -2L-14 -46" stroke="url(#' + id + 'ol)" stroke-width="12" stroke-linecap="round"/><path d="M7 -2L18 -44" stroke="url(#' + id + 'ol)" stroke-width="12" stroke-linecap="round"/>' +
          '<ellipse cx="-9" cy="24" rx="6.5" ry="8" fill="url(#' + id + 'ol)"/><ellipse cx="7" cy="25" rx="6.5" ry="7.5" fill="url(#' + id + 'ol)"/><ellipse cx="-4" cy="3" rx="8" ry="4" fill="#fff" opacity=".2"/></g>';
      } else if (pose === 'cheer') {
        s += ctube('M' + x(126) + ' 200C' + x(40) + ' 210 ' + x(30) + ' 140 ' + x(52) + ' 96', 50, id, P);
        hands += '<g transform="translate(' + x(52) + ' 76) rotate(180)"><ellipse cx="0" cy="0" rx="17" ry="15" fill="url(#' + id + 'ol)"/>' +
          [[-10, 13, 10], [0, 17, 0], [10, 13, -10]].map(function (a) { return '<ellipse cx="' + a[0] + '" cy="' + a[1] + '" rx="5.4" ry="10" transform="rotate(' + a[2] + ' ' + a[0] + ' ' + a[1] + ')" fill="url(#' + id + 'ol)"/>'; }).join('') + '</g>';
      } else {
        s += ctube('M' + x(126) + ' 200C' + x(60) + ' 224 ' + x(44) + ' 290 ' + x(62) + ' 340', 54, id, P);
        hands += hand(x(62), 356, sd < 0 ? 4 : -4, id, 1.25);
      }
    });
    [-1, 1].forEach(function (sd) {
      s += '<g transform="translate(' + (sd < 0 ? 0 : 400) + ' 0) scale(' + sd * -1 + ' 1)">';
      s += '<path d="M142 396C134 436 128 474 124 506L166 508C170 476 182 440 194 406Z" fill="url(#' + id + 'lg)"/>';
      s += '<path d="M142 396C134 436 128 474 124 506L166 508C170 476 182 440 194 406Z" fill="url(#' + id + 'lt)"/>';
      s += '<path d="M152 414C146 446 142 474 140 498" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="5" stroke-linecap="round"/>';
      s += '</g>';
    });
    s += foot(-1, id) + foot(1, id);
    s += '<path d="' + TORSO + '" fill="url(#' + id + 'b)"/>';
    s += '<g clip-path="url(#' + id + 'tc)">';
    s += '<rect x="60" y="20" width="280" height="420" fill="url(#' + id + 'sd)"/>';
    s += '<rect x="60" y="20" width="280" height="420" fill="url(#' + id + 'bt)"/>';
    s += '<ellipse cx="176" cy="62" rx="34" ry="26" fill="url(#' + id + 'hl)" opacity=".6" transform="rotate(-18 176 64)"/>';
    s += '<ellipse cx="146" cy="220" rx="20" ry="62" fill="url(#' + id + 'hl)" opacity=".5" transform="rotate(14 146 220)"/>';
    s += '<ellipse cx="200" cy="322" rx="118" ry="92" fill="url(#' + id + 'bl)"/>';
    s += '<ellipse cx="164" cy="250" rx="50" ry="22" fill="#fff" opacity=".22" transform="rotate(-14 164 250)"/>';
    s += '</g>';
    if (pose === 'stand') {
      s += '<path d="M112 206C88 240 80 290 84 330" fill="none" stroke="' + P.shade + '" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/><path d="M288 206C312 240 320 290 316 330" fill="none" stroke="' + P.shade + '" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>';
    }
    var eo = { P: P, look: o.look || [-0.15, 0.1], lid: o.lid || 0, big: mood === 'wow', smileEye: mood === 'laugh', cackle: mood === 'cackle', smug: mood === 'smug' };
    s += eye(158, 84, id, Object.assign({}, eo, { side: -1 }));
    s += eye(242, 84, id, Object.assign({}, eo, { side: 1 }));
    s += '<g transform="translate(0 -30)">' + mouth(id, P, mood) + '</g>';
    if (mood === 'laugh' || mood === 'cackle') {
      s += '<ellipse cx="148" cy="124" rx="10" ry="6" fill="#ff7a4d" opacity=".28"/><ellipse cx="252" cy="124" rx="10" ry="6" fill="#ff7a4d" opacity=".28"/>';
    }
    s += hands;
    s += '</g></svg>';
    return s;
  }

  function bust(o) {
    o = o || {};
    /* 金色默认头像：用 3D 头图（通过 html 路径更合适；bust 仍返回 SVG 以兼容棋子尺寸） */
    var id = 'nb' + (++uid) + '_';
    var P = pal(o.color || GOLD);
    var mood = o.mood || 'neutral';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"' + (o.size ? ' width="' + o.size + '" height="' + o.size + '"' : '') + '>';
    s += '<defs>';
    s += '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.hi + '"/><stop offset=".3" stop-color="' + P.lite + '"/><stop offset=".7" stop-color="' + P.base + '"/><stop offset="1" stop-color="' + P.mid + '"/></linearGradient>';
    s += '<linearGradient id="' + id + 's" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + P.shade + '" stop-opacity=".7"/><stop offset=".25" stop-color="' + P.shade + '" stop-opacity="0"/><stop offset=".75" stop-color="' + P.shade + '" stop-opacity="0"/><stop offset="1" stop-color="' + P.deep + '" stop-opacity=".7"/></linearGradient>';
    s += '<radialGradient id="' + id + 'h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
    s += '<radialGradient id="' + id + 'i" cx=".42" cy=".4" r=".62"><stop offset="0" stop-color="#d7eeb0"/><stop offset=".6" stop-color="#a9d284"/><stop offset="1" stop-color="#6aa24a"/></radialGradient>';
    s += '<radialGradient id="' + id + 'l" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="' + BELLY[0] + '"/><stop offset="1" stop-color="' + BELLY[2] + '" stop-opacity="0"/></radialGradient>';
    s += '<clipPath id="' + id + 'c"><path d="' + BUST + '"/></clipPath></defs>';
    s += '<ellipse cx="50" cy="94" rx="36" ry="4.5" fill="#5a3a00" opacity=".18"/>';
    s += '<path d="' + BUST + '" fill="url(#' + id + 'b)" stroke="' + P.shade + '" stroke-width="1.4" stroke-opacity=".6"/>';
    s += '<g clip-path="url(#' + id + 'c)"><rect width="100" height="100" fill="url(#' + id + 's)"/><ellipse cx="50" cy="96" rx="34" ry="22" fill="url(#' + id + 'l)"/><ellipse cx="38" cy="22" rx="17" ry="11" fill="url(#' + id + 'h)" transform="rotate(-18 38 22)"/></g>';
    [[36, 38], [64, 38]].forEach(function (e) {
      s += '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="10.6" fill="' + P.lite + '"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="8.6" fill="#5c8f3c"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="7.4" fill="url(#' + id + 'i)"/>';
      s += '<ellipse cx="' + (e[0] - 0.8) + '" cy="' + (e[1] + 0.4) + '" rx="4.4" ry="5.2" fill="#0b0b09"/><circle cx="' + (e[0] - 2.4) + '" cy="' + (e[1] - 2.2) + '" r="1.9" fill="#fff"/>';
    });
    if (mood === 'laugh') {
      s += '<path d="M33 53Q50 49 67 53Q68 72 50 74Q32 72 33 53Z" fill="#7a2a0e" stroke="' + P.deep + '" stroke-width="1.4"/><ellipse cx="50" cy="72" rx="11" ry="5" fill="#e9843f"/><rect x="42" y="50" width="8" height="5" rx="1.6" fill="#fff6e2"/><rect x="50" y="50" width="8" height="5" rx="1.6" fill="#fff6e2"/>';
    } else if (mood === 'wow') {
      s += '<ellipse cx="50" cy="62" rx="6" ry="7.5" fill="#7a2a0e" stroke="' + P.deep + '" stroke-width="1.2"/>';
    } else if (mood === 'sad') {
      s += '<path d="M41 64Q50 57 59 64" fill="none" stroke="#6a4208" stroke-width="2.2" stroke-linecap="round"/>';
    } else {
      s += '<path d="M41 58Q50 63 59 58" fill="none" stroke="#6a4208" stroke-width="2.2" stroke-linecap="round"/>';
    }
    s += '</svg>';
    return s;
  }
  var BUST = 'M50 8C34 8 25 20 24 36C23 50 16 56 11 68C7 80 12 92 28 92L72 92C88 92 93 80 89 68C84 56 77 50 76 36C75 20 66 8 50 8Z';

  function ball(o) {
    o = o || {};
    var id = 'nl' + (++uid) + '_';
    var P = pal(o.color || GOLD);
    var mood = o.mood || 'neutral';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"' + (o.size ? ' width="' + o.size + '" height="' + o.size + '"' : '') + '><defs>';
    s += '<radialGradient id="' + id + 'b" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="' + P.hi + '"/><stop offset=".35" stop-color="' + P.lite + '"/><stop offset=".72" stop-color="' + P.base + '"/><stop offset="1" stop-color="' + P.shade + '"/></radialGradient>';
    s += '<radialGradient id="' + id + 'h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
    s += '<radialGradient id="' + id + 'l" cx=".45" cy=".25" r=".8"><stop offset="0" stop-color="' + BELLY[0] + '"/><stop offset=".8" stop-color="' + BELLY[1] + '"/><stop offset="1" stop-color="' + BELLY[2] + '" stop-opacity="0"/></radialGradient>';
    s += '<radialGradient id="' + id + 'i" cx=".42" cy=".4" r=".62"><stop offset="0" stop-color="#d7eeb0"/><stop offset=".6" stop-color="#a9d284"/><stop offset="1" stop-color="#6aa24a"/></radialGradient>';
    s += '<clipPath id="' + id + 'c"><circle cx="50" cy="52" r="45"/></clipPath></defs>';
    s += '<ellipse cx="50" cy="95" rx="30" ry="3.6" fill="#5a3a00" opacity=".16"/>';
    s += '<circle cx="50" cy="52" r="45" fill="url(#' + id + 'b)"/>';
    s += '<g clip-path="url(#' + id + 'c)"><ellipse cx="50" cy="104" rx="34" ry="24" fill="url(#' + id + 'l)"/></g>';
    s += '<path d="M50 7a45 45 0 0 1 0 90" fill="none" stroke="' + P.deep + '" stroke-opacity=".18" stroke-width="2"/>';
    s += '<ellipse cx="33" cy="24" rx="16" ry="9" fill="url(#' + id + 'h)" transform="rotate(-32 33 24)"/>';
    [[34, 42], [66, 42]].forEach(function (e) {
      s += '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="9.4" fill="' + P.lite + '"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="8" fill="#6a9d4a"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="6.8" fill="url(#' + id + 'i)"/>';
      s += '<ellipse cx="' + (e[0] - 0.6) + '" cy="' + (e[1] + 0.4) + '" rx="4.4" ry="5" fill="#0b0b09"/><circle cx="' + (e[0] - 2.2) + '" cy="' + (e[1] - 2) + '" r="1.8" fill="#fff"/>';
    });
    if (mood === 'laugh') {
      s += '<path d="M31 58Q50 54 69 58Q68 78 50 80Q32 78 31 58Z" fill="#7a2a0e" stroke="' + P.deep + '" stroke-width="1.4"/><ellipse cx="50" cy="77" rx="11" ry="5" fill="#e9843f"/><rect x="42" y="55" width="8" height="5" rx="1.6" fill="#fff6e2"/><rect x="50" y="55" width="8" height="5" rx="1.6" fill="#fff6e2"/>';
    } else if (mood === 'wow') {
      s += '<ellipse cx="50" cy="68" rx="6" ry="7.5" fill="#7a2a0e" stroke="' + P.deep + '" stroke-width="1.2"/>';
    } else if (mood === 'sad') {
      s += '<path d="M40 70Q50 62 60 70" fill="none" stroke="#6a4208" stroke-width="2.4" stroke-linecap="round"/>';
    } else {
      s += '<path d="M40 63Q50 69 60 63" fill="none" stroke="#6a4208" stroke-width="2.4" stroke-linecap="round"/>';
    }
    if (o.crown) {
      s += '<path d="M30 14L36 -2L44 8L50 -6L56 8L64 -2L70 14Z" transform="translate(0 6)" fill="#ffd23f" stroke="#c98a07" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="3" r="2.6" fill="#ff5a5a"/>';
    }
    s += '</svg>';
    return s;
  }

  function sprite(svgStr, w, h, dpr) {
    dpr = dpr || Math.min(window.devicePixelRatio || 1, 2.5);
    var c = document.createElement('canvas');
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.__w = w; c.__h = h;
    var im = new Image();
    im.onload = function () { c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); if (c.onready) c.onready(); };
    im.src = url(svgStr);
    return c;
  }
  function url(s) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); }
  var cache = {};
  function image(s, cb) {
    var im = cache[s];
    if (!im) {
      im = new Image(); im.decoding = 'async'; im.src = url(s); cache[s] = im;
    }
    if (cb) { if (im.complete && im.naturalWidth) cb(im); else im.addEventListener('load', function () { cb(im); }); }
    return im;
  }


  /* ---------- 染色 PNG 棋子（merge/match3/2048/snake…） ---------- */
  var COLOR_KEY = {
    '#F7C32B': 'gold', '#f7c32b': 'gold',
    '#8FD14F': 'green', '#8fd14f': 'green',
    '#FF9F43': 'orange', '#ff9f43': 'orange',
    '#FF7BAC': 'pink', '#ff7bac': 'pink',
    '#5CC8F2': 'blue', '#5cc8f2': 'blue',
    '#B28DFF': 'purple', '#b28dff': 'purple',
    '#FF6B5E': 'red', '#ff6b5e': 'red',
    '#3ED3B5': 'teal', '#3ed3b5': 'teal',
    '#FFB830': 'amber', '#ffb830': 'amber'
  };
  function colorKey(c) {
    if (!c) return 'gold';
    var k = COLOR_KEY[c] || COLOR_KEY[String(c).toLowerCase()];
    if (k) return k;
    var t = hex2rgb(c), best = 'gold', bd = 1e9;
    Object.keys(COLOR_KEY).forEach(function (h) {
      if (h.charAt(0) !== '#') return;
      var o = hex2rgb(h), d = Math.abs(o[0] - t[0]) + Math.abs(o[1] - t[1]) + Math.abs(o[2] - t[2]);
      if (d < bd) { bd = d; best = COLOR_KEY[h]; }
    });
    return best;
  }
  function piecePath(o) {
    o = o || {};
    var shape = o.shape || 'ball';
    var mood = o.mood || 'neutral';
    var key = colorKey(o.color);
    var moodTag = '';
    if (mood === 'laugh' || mood === 'cackle') moodTag = '-laugh';
    else if (mood === 'wow') moodTag = '-wow';
    if (shape === 'body') return '/assets/frog/pieces/body-' + key + '.png';
    return '/assets/frog/pieces/' + shape + '-' + key + moodTag + '.png';
  }
  function pieceUrl(o) { return piecePath(o); }
  function piece(o) { return piecePath(o); }
  function pieceSprite(o, w, h) {
    return spritePng(piecePath(o), w || 96, h || w || 96);
  }
  var pieceImgCache = {};
  function pieceImage(o, cb) {
    var src = piecePath(o);
    var im = pieceImgCache[src];
    if (!im) { im = new Image(); im.decoding = 'async'; im.src = src; pieceImgCache[src] = im; }
    if (cb) { if (im.complete && im.naturalWidth) cb(im); else im.addEventListener('load', function () { cb(im); }); }
    return im;
  }

  var COLORS = ['#F7C32B', '#8FD14F', '#FF9F43', '#FF7BAC', '#5CC8F2', '#B28DFF', '#FF6B5E', '#3ED3B5'];

  root.NaiwaFrog = {
    svg: svg, bust: bust, ball: ball, sprite: sprite, spritePng: spritePng,
    url: url, image: image, load: load, png: png, html: html,
    piece: piece, pieceUrl: pieceUrl, piecePath: piecePath, pieceSprite: pieceSprite, pieceImage: pieceImage, colorKey: colorKey,
    ASSET: ASSET, ASSET_SM: ASSET_SM, poseKey: poseKey,
    COLORS: COLORS, pal: pal, mix: mix
  };
  if (typeof module !== 'undefined') module.exports = root.NaiwaFrog;
})(typeof window !== 'undefined' ? window : globalThis);
