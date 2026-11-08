'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../public/laugh/seq.js');

function analyze(file) {
  const script = `
import wave, json, sys
import numpy as np
path, marks = sys.argv[1], json.loads(sys.argv[2])
w = wave.open(path)
sr = w.getframerate()
n = w.getnframes()
x = np.frombuffer(w.readframes(n), np.int16).astype(np.float64) / 32768
w.close()
def rms(a, b):
    s = x[int(a*sr):int(b*sr)]
    if len(s) == 0: return 0.0
    return float(np.sqrt(np.mean(s*s)))
a = x[int(2.0*sr):int(2.08*sr)]
spec = np.abs(np.fft.rfft(a * np.hanning(len(a)))) + 1e-12
flat = float(np.exp(np.mean(np.log(spec))) / np.mean(spec))
a0 = a - a.mean()
c = np.correlate(a0, a0, 'full')
c = c[len(c)//2:]
minl, maxl = int(sr/650), int(sr/120)
lag = minl + int(np.argmax(c[minl:maxl]))
conf = float(c[lag] / c[0]) if c[0] else 0
win, hop = int(sr*0.012), int(sr*0.004)
hits = 0
for t in marks:
    i = int(t / (hop / sr))
    lo, hi = max(0, i-2), min(len(x)//hop, i+8)
    chunk = []
    for k in range(lo, hi):
        seg = x[k*hop:k*hop+win]
        if len(seg) < win: continue
        chunk.append(float(np.sqrt(np.mean(seg*seg))))
    if chunk and max(chunk) > 0.02:
        hits += 1
print(json.dumps({
  'sr': sr, 'dur': n/sr, 'peak': float(np.max(np.abs(x))),
  'lead': rms(0, 1.6), 'onset': rms(1.9, 2.15),
  'loud': rms(2.0, 3.5), 'soft': rms(4.5, 5.4),
  'flat': flat, 'conf': conf, 'hits': hits, 'marks': len(marks)
}))
`;
  const marks = S.syllableTimes();
  const out = execFileSync('python3', ['-c', script, file, JSON.stringify(marks)], { encoding: 'utf8' });
  return JSON.parse(out);
}

test('laugh_take matches the measured timeline and is voiced, not a noise bed', () => {
  const file = path.join(__dirname, '../public/assets/audio/laugh_take.wav');
  assert.ok(fs.existsSync(file));
  const m = analyze(file);
  assert.equal(m.sr, 22050);
  assert.ok(Math.abs(m.dur - S.DUR) < 0.02);
  assert.ok(m.lead < 0.002, 'lead-in should stay silent');
  assert.ok(m.onset > 0.04, 'laughter should be present just after 1.86s');
  assert.ok(m.loud > m.soft * 1.25, 'soft phrases should sit under the loud ones');
  assert.ok(m.peak < 0.95, 'should not be hard-clipped');
  assert.ok(m.flat < 0.35, 'a vowel has lower spectral flatness than the old noise clips');
  assert.ok(m.conf > 0.35, 'autocorrelation should find a pitch');
  assert.ok(m.hits / m.marks > 0.9, 'envelope peaks should land on the scheduled syllables');
});

test('short ha clips are single voiced syllables, not the old long buzzes', () => {
  for (const name of ['ha1.wav', 'ha2.wav', 'ha3.wav', 'ha4.wav', 'ha5.wav', 'ha6.wav', 'tap_ha.wav']) {
    const file = path.join(__dirname, '../public/assets/audio', name);
    const buf = fs.readFileSync(file);
    assert.equal(buf.slice(0, 4).toString(), 'RIFF');
    const script = `
import wave, json, sys
import numpy as np
w = wave.open(sys.argv[1])
sr, n = w.getframerate(), w.getnframes()
x = np.frombuffer(w.readframes(n), np.int16).astype(np.float64) / 32768
w.close()
dur = n / sr
a = x[int(0.02*sr):int(min(dur, 0.14)*sr)]
spec = np.abs(np.fft.rfft(a * np.hanning(len(a)))) + 1e-12
flat = float(np.exp(np.mean(np.log(spec))) / np.mean(spec))
print(json.dumps({'dur': dur, 'peak': float(np.max(np.abs(x))), 'flat': flat}))
`;
    const m = JSON.parse(execFileSync('python3', ['-c', script, file], { encoding: 'utf8' }));
    assert.ok(m.dur < 0.35, name + ' should be one short syllable');
    assert.ok(m.dur > 0.1, name);
    assert.ok(m.flat < 0.4, name);
    assert.ok(m.peak > 0.2 && m.peak < 0.95, name);
  }
});
