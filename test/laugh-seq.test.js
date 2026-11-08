'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const S = require('../public/laugh/seq.js');

function median(xs) {
  const a = xs.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

test('one sustained take: rate 1, no second layered source', () => {
  const plan = S.voicePlan();
  assert.equal(plan.sources, 1);
  assert.equal(plan.playbackRate, 1);
  assert.equal(plan.detune, 0);
  assert.equal(plan.layered, false);
  assert.equal(plan.leadSilence, S.AUDIO_START);
  assert.equal(plan.duration, S.DUR);
});

test('syllables stay silent until the measured onset, then match fast and slow gaps', () => {
  const times = S.syllableTimes();
  assert.ok(times.length > 100 && times.length < 180);
  assert.equal(times[0], S.AUDIO_START);
  assert.ok(times.every((t, i) => i === 0 || t > times[i - 1]));
  assert.ok(times.every((t) => t >= S.AUDIO_START && t < S.AUDIO_END));
  const loud = [];
  const soft = [];
  for (let i = 0; i < times.length - 1; i++) {
    const gap = times[i + 1] - times[i];
    const mid = (times[i] + times[i + 1]) / 2;
    if (mid >= 2.1 && mid < 4.1) loud.push(gap);
    if (mid >= 4.4 && mid < 5.6) soft.push(gap);
  }
  assert.ok(Math.abs(median(loud) - S.LOUD_IOI) < 0.004);
  assert.ok(Math.abs(median(soft) - S.SOFT_IOI) < 0.004);
  const plan = S.syllablePlan();
  assert.equal(plan.length, times.length);
  assert.ok(plan.every((s) => s.dur > 0.02 && s.dur < s.ioi));
});

test('visual laugh follows the audio onset and the 2s float gate', () => {
  assert.equal(S.visualAt(0, 'playing').face, 'stand');
  assert.equal(S.visualAt(1.5, 'playing').haha, false);
  assert.equal(S.visualAt(1.9, 'playing').face, 'laugh');
  assert.equal(S.visualAt(1.9, 'playing').haha, false);
  assert.equal(S.visualAt(2, 'playing').haha, true);
  assert.equal(S.visualAt(10, 'playing').showStop, true);
  assert.equal(S.visualAt(12, 'playing').lie, 0);
  const mid = S.visualAt(13.65, 'playing').lie;
  assert.ok(mid > 0.2 && mid < 0.9);
  assert.equal(S.visualAt(14.2, 'playing').lie, 1);
  assert.ok(S.visualAt(2.05, 'playing').pulse > 0.2);
  const ended = S.visualAt(0, 'ended');
  assert.equal(ended.face, 'laugh');
  assert.equal(ended.haha, false);
  assert.equal(ended.lie, 1);
  assert.equal(ended.showStop, false);
  assert.equal(S.visualAt(3, 'idle').face, 'stand');
  assert.equal(S.visualAt(3, 'idle').haha, false);
});

test('repeated clicks and a held press do not stack or restart the take', () => {
  const ctl = S.create();
  const first = ctl.pointerDown();
  assert.equal(first.accepted, true);
  assert.equal(first.command.sources, 1);
  assert.equal(first.command.playbackRate, 1);
  assert.equal(first.command.currentTime, 0);
  assert.equal(first.command.layered, false);
  const burst = [];
  for (let i = 0; i < 12; i++) burst.push(ctl.pointerDown());
  assert.ok(burst.every((r) => r.accepted === false && r.reason === 'busy'));
  assert.equal(ctl.pointerUp().accepted, false);
  assert.equal(ctl.pointerDown().reason, 'busy');
  assert.equal(ctl.key(' ').reason, 'busy');
  assert.equal(ctl.snapshot().token, first.token);
  assert.equal(ctl.snapshot().state, 'playing');
});

test('stop returns to the start and clears loop; a later click can play once', () => {
  const ctl = S.create();
  ctl.toggleLoop();
  assert.equal(ctl.snapshot().loop, true);
  assert.equal(ctl.snapshot().state, 'playing');
  const stopped = ctl.stop();
  assert.equal(stopped.command.op, 'stop');
  assert.equal(stopped.command.pause, true);
  assert.equal(stopped.command.currentTime, 0);
  assert.equal(stopped.command.loop, false);
  assert.equal(ctl.snapshot().state, 'idle');
  assert.equal(ctl.snapshot().loop, false);
  const again = ctl.pointerDown();
  assert.equal(again.accepted, true);
  assert.equal(again.command.op, 'play');
  assert.notEqual(again.token, stopped.token);
});

test('loop keeps a single take; turning it off holds the last pose instead of restarting', () => {
  const ctl = S.create();
  const started = ctl.pointerDown();
  assert.equal(started.command.loop, false);
  const on = ctl.toggleLoop();
  assert.equal(on.loop, true);
  assert.equal(on.start.accepted, false);
  assert.equal(on.start.reason, 'busy');
  assert.equal(ctl.finish().reason, 'looping');
  assert.equal(ctl.snapshot().state, 'playing');
  const off = ctl.toggleLoop();
  assert.equal(off.loop, false);
  assert.equal(off.start, null);
  assert.equal(ctl.snapshot().state, 'playing');
  const done = ctl.finish();
  assert.equal(done.state, 'ended');
  assert.equal(done.command.op, 'hold-end');
  assert.equal(done.restarted, false);
  const replay = ctl.pointerDown();
  assert.equal(replay.accepted, true);
  assert.equal(replay.command.currentTime, 0);
});

test('held input is edge triggered: time passing without another down does not schedule audio', () => {
  const ctl = S.create();
  const down = ctl.pointerDown();
  const commands = [down.command];
  for (let i = 0; i < 40; i++) {
    const up = ctl.pointerUp();
    if (up.command) commands.push(up.command);
  }
  assert.equal(commands.length, 1);
  assert.equal(commands[0].op, 'play');
  assert.equal(ctl.snapshot().state, 'playing');
});

test('laugh page does not retrigger the old per-click ha stack', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public/laugh/index.html'), 'utf8');
  assert.match(html, /laugh_take\.wav/);
  assert.match(html, /LaughSeq/);
  assert.match(html, /bindLaughMedia/);
  assert.doesNotMatch(html, /sfx\.ha\(/);
  assert.doesNotMatch(html, /startFeverGiggle/);
  assert.doesNotMatch(html, /proceduralLaugh/);
  assert.match(html, /playbackRate = 1/);
});
