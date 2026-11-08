#!/usr/bin/env python3
"""原创笑声采样。音节时间从 public/laugh/seq.js 读取，不使用官网录音。"""
import json
import math
import struct
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR = 22050
SEED = 20261108


def load_plan():
    script = (
        "const s=require('./public/laugh/seq.js');"
        "process.stdout.write(JSON.stringify({dur:s.DUR,plan:s.syllablePlan()}));"
    )
    out = subprocess.check_output(['node', '-e', script], cwd=ROOT)
    return json.loads(out)


def write_wav(path, samples):
    path.parent.mkdir(parents=True, exist_ok=True)
    clipped = np.clip(samples, -1, 1)
    pcm = (clipped * 32767).astype(np.int16)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def resonator(x, freq, bw):
    r = math.exp(-math.pi * bw / SR)
    theta = 2 * math.pi * freq / SR
    a1 = 2 * r * math.cos(theta)
    a2 = -(r * r)
    y = np.zeros_like(x)
    y1 = 0.0
    y2 = 0.0
    for i, s in enumerate(x):
        y0 = s + a1 * y1 + a2 * y2
        y[i] = y0
        y2 = y1
        y1 = y0
    peak = np.max(np.abs(y)) or 1
    return y / peak


def envelope(n, attack, release):
    env = np.ones(n, dtype=np.float64)
    a = max(1, int(attack * SR))
    rel = max(1, int(release * SR))
    env[:a] = np.linspace(0, 1, a)
    if rel < n:
        env[-rel:] *= np.linspace(1, 0, rel)
    return env


def syllable(dur, f0, vowel, rng, amp):
    n = max(8, int(dur * SR))
    t = np.arange(n) / SR
    fall = np.linspace(f0, f0 * 0.82, n)
    y = np.zeros(n, dtype=np.float64)
    phase = 0.0
    for i in range(n):
        phase += fall[i] / SR
        if phase >= 1:
            phase -= 1
            y[i] = 1.0
    # 声门脉冲略展宽，避免纯点击
    kernel = np.array([0.2, 0.6, 1, 0.45, 0.15])
    y = np.convolve(y, kernel, mode='same')
    vowels = {
        'ha': [(680, 90, 1.0), (1220, 110, 0.62), (2550, 160, 0.28)],
        'hee': [(420, 70, 0.7), (2100, 120, 0.9), (3100, 180, 0.35)],
        'ga': [(520, 90, 1.0), (980, 100, 0.55), (2400, 170, 0.22)],
    }
    spec = vowels.get(vowel, vowels['ha'])
    voiced = np.zeros(n, dtype=np.float64)
    for freq, bw, g in spec:
        voiced += resonator(y, freq, bw) * g
    noise = rng.standard_normal(n)
    noise = resonator(noise, 1800, 400) 
    asp_n = max(1, int(0.018 * SR))
    asp = np.zeros(n)
    asp[:asp_n] = noise[:asp_n] * np.linspace(1, 0, asp_n)
    mixed = voiced * 0.82 + asp * 0.22
    mixed *= envelope(n, 0.008, dur * 0.28)
    peak = np.max(np.abs(mixed)) or 1
    return mixed / peak * amp


def render_take(plan, dur):
    n = int(dur * SR)
    y = np.zeros(n, dtype=np.float64)
    rng = np.random.default_rng(SEED)
    gains = [s['gain'] for s in plan] or [1]
    gmax = max(gains) or 1
    for i, syl in enumerate(plan):
        f0 = 300 + (i % 7) * 18 + float(rng.normal(0, 6))
        if syl['vowel'] == 'hee':
            f0 += 70
        if syl['vowel'] == 'ga':
            f0 -= 40
        amp = 0.62 * (0.35 + 0.65 * (syl['gain'] / gmax))
        piece = syllable(syl['dur'], f0, syl['vowel'], rng, amp)
        start = int(round(syl['t'] * SR))
        end = min(n, start + len(piece))
        if start >= n:
            continue
        y[start:end] += piece[: end - start]
    # 软限制，避免硬削波
    y = np.tanh(y * 1.15) * 0.78
    return y


def render_short(kind, f0, dur, vowel):
    rng = np.random.default_rng(SEED + int(f0))
    n = int(dur * SR)
    y = np.zeros(n, dtype=np.float64)
    if kind == 'fever':
        times = [0.02, 0.108, 0.196, 0.284]
        vowels = ['ha', 'hee', 'ha', 'ga']
        for i, t0 in enumerate(times):
            piece = syllable(0.08, f0 + i * 12, vowels[i], rng, 0.55)
            s = int(t0 * SR)
            e = min(n, s + len(piece))
            y[s:e] += piece[: e - s]
    else:
        piece = syllable(min(0.2, dur - 0.02), f0, vowel, rng, 0.6)
        s = int(0.012 * SR)
        e = min(n, s + len(piece))
        y[s:e] += piece[: e - s]
    return np.tanh(y * 1.2) * 0.75


def main():
    data = load_plan()
    take = render_take(data['plan'], data['dur'])
    out_dir = ROOT / 'public' / 'assets' / 'audio'
    write_wav(out_dir / 'laugh_take.wav', take)
    shorts = [
        ('ha1.wav', 'ha', 280, 0.24, 'ha'),
        ('ha2.wav', 'ha', 340, 0.26, 'ha'),
        ('ha3.wav', 'ha', 390, 0.22, 'hee'),
        ('ha4.wav', 'ha', 250, 0.28, 'ga'),
        ('ha5.wav', 'ha', 360, 0.25, 'ha'),
        ('ha6.wav', 'ha', 430, 0.23, 'hee'),
        ('tap_ha.wav', 'ha', 310, 0.18, 'ha'),
        ('fever1.wav', 'fever', 360, 0.40, 'ha'),
        ('fever2.wav', 'fever', 400, 0.40, 'hee'),
        ('fever3.wav', 'fever', 330, 0.40, 'ga'),
    ]
    for name, kind, f0, dur, vowel in shorts:
        write_wav(out_dir / name, render_short(kind, f0, dur, vowel))
    print('wrote', out_dir, 'take_samples', len(take), 'syllables', len(data['plan']))


if __name__ == '__main__':
    main()
