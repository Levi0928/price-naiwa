/* 原创金蛙 canvas 绘制 — 亮黄梨形身 / 奶油肚 / 浅绿鼓眼 / 深绿手脚 */
(function (global) {
  const PAL = {
    bodyTop: '#ffe566',
    body: '#ffd54a',
    bodyDeep: '#f0b429',
    belly: '#fff6d6',
    bellyEdge: '#f5e6b8',
    eye: '#a8d84a',
    eyeDeep: '#7cb342',
    pupil: '#1a1a14',
    limb: '#5a7a2e',
    limbDeep: '#3d5a1f',
    mouth: '#5a4a20',
    mouthOpen: '#c62828',
    mouthInner: '#ff8a80',
    tooth: '#fff8e7',
  };

  function radGrad(ctx, x, y, r, c0, c1) {
    const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    return g;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x center
   * @param {number} y center (belly center-ish)
   * @param {number} r body radius
   * @param {{laugh?:boolean, face?:boolean, scaleX?:number, scaleY?:number}} [opt]
   */
  function drawGoldenFrog(ctx, x, y, r, opt) {
    opt = opt || {};
    const laugh = !!opt.laugh;
    const face = opt.face !== false;
    const sx = opt.scaleX || 1;
    const sy = opt.scaleY || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    // soft shadow
    ctx.beginPath();
    ctx.ellipse(0, r * 1.05, r * 0.72, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,140,40,0.22)';
    ctx.fill();

    // feet
    ctx.beginPath();
    ctx.ellipse(-r * 0.42, r * 0.88, r * 0.32, r * 0.16, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.42, r * 0.88, r * 0.32, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = radGrad(ctx, 0, r * 0.88, r * 0.4, PAL.limb, PAL.limbDeep);
    ctx.fill();

    // legs
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, r * 0.62, r * 0.24, r * 0.3, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.34, r * 0.62, r * 0.24, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = radGrad(ctx, 0, r * 0.5, r, PAL.bodyTop, PAL.bodyDeep);
    ctx.fill();

    // body pear
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 1.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = radGrad(ctx, -r * 0.15, -r * 0.35, r * 1.2, PAL.bodyTop, PAL.bodyDeep);
    ctx.fill();

    // belly
    ctx.beginPath();
    ctx.ellipse(0, r * 0.22, r * 0.52, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = radGrad(ctx, 0, r * 0.05, r * 0.6, PAL.belly, PAL.bellyEdge);
    ctx.fill();

    // arms
    if (laugh) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.95, -r * 0.35, r * 0.22, r * 0.32, -0.7, 0, Math.PI * 2);
      ctx.ellipse(r * 0.95, -r * 0.35, r * 0.22, r * 0.32, 0.7, 0, Math.PI * 2);
      ctx.fillStyle = radGrad(ctx, 0, -r * 0.2, r, PAL.bodyTop, PAL.bodyDeep);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-r * 1.1, -r * 0.65, r * 0.2, r * 0.16, 0, 0, Math.PI * 2);
      ctx.ellipse(r * 1.1, -r * 0.65, r * 0.2, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = radGrad(ctx, 0, -r * 0.65, r * 0.3, PAL.limb, PAL.limbDeep);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(-r * 0.78, r * 0.12, r * 0.26, r * 0.2, -0.3, 0, Math.PI * 2);
      ctx.ellipse(r * 0.78, r * 0.12, r * 0.26, r * 0.2, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = radGrad(ctx, 0, 0, r, PAL.bodyTop, PAL.bodyDeep);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-r * 0.62, r * 0.35, r * 0.22, r * 0.16, 0, 0, Math.PI * 2);
      ctx.ellipse(r * 0.62, r * 0.35, r * 0.22, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = radGrad(ctx, 0, r * 0.35, r * 0.3, PAL.limb, PAL.limbDeep);
      ctx.fill();
    }

    if (face) {
      // eyes
      const ey = -r * 0.32;
      const ex = r * 0.38;
      const er = r * 0.36;
      ctx.beginPath();
      ctx.ellipse(-ex, ey, er, er * 1.05, 0, 0, Math.PI * 2);
      ctx.ellipse(ex, ey, er, er * 1.05, 0, 0, Math.PI * 2);
      ctx.fillStyle = radGrad(ctx, -ex, ey - er * 0.2, er, '#c8f070', PAL.eyeDeep);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ex, ey, er, er * 1.05, 0, 0, Math.PI * 2);
      ctx.fillStyle = radGrad(ctx, ex, ey - er * 0.2, er, '#c8f070', PAL.eyeDeep);
      ctx.fill();

      if (laugh) {
        ctx.strokeStyle = PAL.pupil;
        ctx.lineWidth = Math.max(2, r * 0.08);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-ex - er * 0.55, ey);
        ctx.quadraticCurveTo(-ex, ey - er * 0.45, -ex + er * 0.55, ey);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex - er * 0.55, ey);
        ctx.quadraticCurveTo(ex, ey - er * 0.45, ex + er * 0.55, ey);
        ctx.stroke();
        // open mouth
        ctx.beginPath();
        ctx.ellipse(0, r * 0.18, r * 0.48, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fillStyle = radGrad(ctx, 0, r * 0.05, r * 0.5, PAL.mouthInner, PAL.mouthOpen);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, r * 0.02, r * 0.4, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fillStyle = PAL.tooth;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(-ex + er * 0.12, ey + er * 0.1, er * 0.32, 0, Math.PI * 2);
        ctx.arc(ex - er * 0.12, ey + er * 0.1, er * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = PAL.pupil;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-ex + er * 0.22, ey - er * 0.05, er * 0.1, 0, Math.PI * 2);
        ctx.arc(ex - er * 0.02, ey - er * 0.05, er * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        // slit mouth
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, r * 0.05);
        ctx.quadraticCurveTo(0, r * 0.14, r * 0.2, r * 0.05);
        ctx.strokeStyle = PAL.mouth;
        ctx.lineWidth = Math.max(1.5, r * 0.05);
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /** tiny head-only for tiles / snake head */
  function drawFrogFace(ctx, x, y, r, laugh) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 1.05, 0, 0, Math.PI * 2);
    ctx.fillStyle = radGrad(ctx, -r * 0.2, -r * 0.3, r * 1.1, PAL.bodyTop, PAL.bodyDeep);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.25, r * 0.45, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.belly;
    ctx.fill();
    const ex = r * 0.38, ey = -r * 0.15, er = r * 0.32;
    ctx.beginPath();
    ctx.ellipse(-ex, ey, er, er, 0, 0, Math.PI * 2);
    ctx.ellipse(ex, ey, er, er, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.eye;
    ctx.fill();
    if (laugh) {
      ctx.strokeStyle = PAL.pupil;
      ctx.lineWidth = Math.max(1.5, r * 0.1);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-ex - er * 0.5, ey);
      ctx.quadraticCurveTo(-ex, ey - er * 0.4, -ex + er * 0.5, ey);
      ctx.moveTo(ex - er * 0.5, ey);
      ctx.quadraticCurveTo(ex, ey - er * 0.4, ex + er * 0.5, ey);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, r * 0.28, r * 0.4, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fillStyle = PAL.mouthOpen;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(-ex + 1, ey + 1, er * 0.35, 0, Math.PI * 2);
      ctx.arc(ex - 1, ey + 1, er * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = PAL.pupil;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.18, r * 0.2);
      ctx.quadraticCurveTo(0, r * 0.28, r * 0.18, r * 0.2);
      ctx.strokeStyle = PAL.mouth;
      ctx.lineWidth = Math.max(1.2, r * 0.06);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  global.NaiwaFrog = { drawGoldenFrog, drawFrogFace, PAL };
})(typeof window !== 'undefined' ? window : globalThis);
