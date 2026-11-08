/* 奶蛙狂笑时间轴
 * 节奏来自公开页 https://milkyfrog.com/ 首页手机里的那一段互动（2026-11-08 测量）：
 * 单段约 17.5s；前 1.86s 没有笑声；之后是连续笑，不是每点一下一声短促音效。
 * 这里只保存测得的时间结构（静音起点、快/慢音节间隔、强弱起伏、第 2 秒起飘字、
 * 约 13.2–14.1s 躺下）。波形是原创合成，不是官网录音。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LaughSeq = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DUR = 17.52;
  var HAHA_FROM = 2;
  var AUDIO_START = 1.86;
  var AUDIO_END = 17.42;
  var LOUD_IOI = 0.088;
  var SOFT_IOI = 0.21;
  var LIE_FROM = 13.2;
  var LIE_TO = 14.1;
  /* 250ms 能量低于约 0.22 的区间，音节拉开 */
  var SOFT = [
    [4.25, 5.75],
    [8.25, 9.5],
    [12.25, 13.75],
    [16.25, 17.52]
  ];
  /* 相对响度，取自公开视频音轨的 250ms RMS，只用来定强弱，不保存采样 */
  var GAIN_BINS = [
    [0, 0], [1.5, 0], [1.75, 0.174], [2, 0.334], [2.25, 0.326], [2.5, 0.311], [2.75, 0.346],
    [3, 0.345], [3.25, 0.324], [3.5, 0.282], [3.75, 0.287], [4, 0.245], [4.25, 0.205],
    [4.5, 0.217], [4.75, 0.172], [5, 0.158], [5.25, 0.167], [5.5, 0.169], [5.75, 0.236],
    [6, 0.329], [6.25, 0.341], [6.5, 0.351], [6.75, 0.329], [7, 0.333], [7.25, 0.308],
    [7.5, 0.326], [7.75, 0.33], [8, 0.272], [8.25, 0.232], [8.5, 0.239], [8.75, 0.244],
    [9, 0.211], [9.25, 0.172], [9.5, 0.343], [9.75, 0.369], [10, 0.349], [10.25, 0.34],
    [10.5, 0.328], [10.75, 0.313], [11, 0.295], [11.25, 0.246], [11.5, 0.244], [11.75, 0.286],
    [12, 0.253], [12.25, 0.203], [12.5, 0.223], [12.75, 0.171], [13, 0.159], [13.25, 0.166],
    [13.5, 0.165], [13.75, 0.24], [14, 0.326], [14.25, 0.338], [14.5, 0.352], [14.75, 0.332],
    [15, 0.332], [15.25, 0.299], [15.5, 0.318], [15.75, 0.326], [16, 0.265], [16.25, 0.247],
    [16.5, 0.235], [16.75, 0.255], [17, 0.208], [17.25, 0.182], [17.52, 0.08]
  ];

  function round3(n) { return Math.round(n * 1000) / 1000; }

  function ioiAt(t) {
    for (var i = 0; i < SOFT.length; i++) {
      if (t >= SOFT[i][0] && t < SOFT[i][1]) return SOFT_IOI;
    }
    return LOUD_IOI;
  }

  function gainAt(t) {
    if (t <= GAIN_BINS[0][0]) return GAIN_BINS[0][1];
    for (var i = 1; i < GAIN_BINS.length; i++) {
      var b = GAIN_BINS[i];
      if (t <= b[0]) {
        var a = GAIN_BINS[i - 1];
        var span = b[0] - a[0] || 1;
        var k = (t - a[0]) / span;
        return a[1] + (b[1] - a[1]) * k;
      }
    }
    return 0;
  }

  function syllableTimes() {
    var t = AUDIO_START;
    var out = [];
    while (t < AUDIO_END - 0.02) {
      out.push(round3(t));
      t += ioiAt(t);
    }
    return out;
  }

  function syllablePlan() {
    var times = syllableTimes();
    var vowels = ['ha', 'ha', 'hee', 'ha', 'ga', 'ha'];
    return times.map(function (time, i) {
      var next = i + 1 < times.length ? times[i + 1] : AUDIO_END;
      var ioi = next - time;
      var soft = ioi > 0.15;
      return {
        t: time,
        ioi: round3(ioi),
        soft: soft,
        dur: round3(soft ? Math.min(0.16, ioi * 0.62) : Math.min(0.084, ioi * 0.92)),
        vowel: vowels[i % vowels.length],
        gain: gainAt(time)
      };
    });
  }

  function lieAmount(t) {
    if (t < LIE_FROM) return 0;
    if (t >= LIE_TO) return 1;
    var k = (t - LIE_FROM) / (LIE_TO - LIE_FROM);
    return k * k * (3 - 2 * k);
  }

  function pulseAt(t) {
    var times = syllableTimes();
    var lo = 0;
    var hi = times.length - 1;
    var idx = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (times[mid] <= t + 1e-4) { idx = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    if (idx < 0) return 0;
    var age = t - times[idx];
    if (age < 0 || age > 0.12) return 0;
    return Math.exp(-age / 0.04);
  }

  function visualAt(t, state) {
    var playing = state === 'playing';
    var ended = state === 'ended';
    var time = ended ? DUR : Math.max(0, t || 0);
    return {
      face: ((playing && time >= AUDIO_START) || ended) ? 'laugh' : 'stand',
      haha: playing && time >= HAHA_FROM,
      lie: ended ? 1 : (playing ? lieAmount(time) : 0),
      pulse: playing ? pulseAt(time) : 0,
      showStop: playing,
      time: time
    };
  }

  function voicePlan() {
    return {
      element: 'audio',
      src: '/assets/audio/laugh_take.wav',
      sources: 1,
      playbackRate: 1,
      detune: 0,
      layered: false,
      leadSilence: AUDIO_START,
      duration: DUR
    };
  }

  function create() {
    var state = 'idle';
    var loop = false;
    var token = 0;

    function playCommand() {
      return {
        op: 'play',
        token: token,
        playbackRate: 1,
        currentTime: 0,
        loop: loop,
        sources: 1,
        layered: false
      };
    }

    function play() {
      if (state === 'playing') {
        return { accepted: false, reason: 'busy', state: state, token: token, loop: loop };
      }
      state = 'playing';
      token += 1;
      return { accepted: true, reason: 'start', state: state, token: token, loop: loop, command: playCommand() };
    }

    function toggleLoop() {
      loop = !loop;
      if (loop) {
        var started = play();
        return { loop: loop, state: state, start: started };
      }
      return { loop: loop, state: state, start: null };
    }

    function stop() {
      var was = state;
      loop = false;
      state = 'idle';
      token += 1;
      return {
        accepted: true,
        state: state,
        token: token,
        loop: false,
        command: { op: 'stop', pause: true, currentTime: 0, loop: false, was: was }
      };
    }

    function finish() {
      if (state !== 'playing') return { accepted: false, reason: 'not-playing', state: state, loop: loop };
      if (loop) return { accepted: false, reason: 'looping', state: 'playing', loop: true };
      state = 'ended';
      return { accepted: true, restarted: false, state: 'ended', loop: false, command: { op: 'hold-end' } };
    }

    return {
      pointerDown: play,
      pointerUp: function () { return { accepted: false, reason: 'up', state: state, token: token }; },
      key: function (name) {
        if (name !== ' ' && name !== 'Enter') return { accepted: false, reason: 'key', state: state };
        return play();
      },
      toggleLoop: toggleLoop,
      stop: stop,
      finish: finish,
      snapshot: function () { return { state: state, loop: loop, token: token }; }
    };
  }

  return {
    DUR: DUR,
    HAHA_FROM: HAHA_FROM,
    AUDIO_START: AUDIO_START,
    AUDIO_END: AUDIO_END,
    LOUD_IOI: LOUD_IOI,
    SOFT_IOI: SOFT_IOI,
    LIE_FROM: LIE_FROM,
    LIE_TO: LIE_TO,
    SOFT: SOFT,
    ioiAt: ioiAt,
    gainAt: gainAt,
    syllableTimes: syllableTimes,
    syllablePlan: syllablePlan,
    lieAmount: lieAmount,
    pulseAt: pulseAt,
    visualAt: visualAt,
    voicePlan: voicePlan,
    create: create
  };
});
