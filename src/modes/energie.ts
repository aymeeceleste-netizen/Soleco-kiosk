import HeatpumpSvgUrl from '../assets/Heatpump2_recolored.svg';
import { t } from '../i18n';
import type { KioskState } from '../state';
import { store } from '../state';
import type { ModeView } from './_types';
import './energie.css';

/**
 * Energie tab — Rev. 2 system canonical (heating-only).
 *
 * Faithful port of `Soleco_Energie_D_Final (3).html`. Per brief §3 this is the
 * reference implementation for canvas-based tabs in the new design system.
 * Do not "improve" the visual — it is the canonical.
 *
 * Adaptations to the kiosk:
 *  - Slider drives `store.heatTempC`; UI re-renders via the existing pub/sub
 *  - DE/EN labels pulled from `t(state.lang).energie.*`
 *  - Heroline `<em>X kWh</em>` is updated on each frame from the lerped
 *    `displayCOP` (rounded to whole kWh) — per user spec
 */

type Pt = { x: number; y: number };
type Dict = ReturnType<typeof t>;

// Logo center in the recolored SVG's 1024×1024 viewBox.
const LOGO_SVG_CX = 858;
const LOGO_SVG_CY = 274;

// Slider tick label values in °C (must match the .slider-labels span list).
const TICK_VALUES: number[] = [-15, -7, 0, 7, 15];

export function mountEnergie(): ModeView {
  // Energie is heating-only.
  const s0 = store.get();
  if (s0.energieMode !== 'heizen' || s0.hpState !== 'heat') {
    store.set({ energieMode: 'heizen', hpState: 'heat' });
  }

  /* ============================================================
     DOM — built per canonical structure:
       header (kicker + heroline)
       hero (canvas-host + elec-overlay + vD-stats-overlay)
       caption (vD-temp: slider header + slider + ticks)
       control (vD-cop-area: cop-pill + temp echo)
     ============================================================ */
  const header = document.createElement('div');
  const headlineEl = document.createElement('h1');
  headlineEl.className = 'heroline';
  header.append(headlineEl);

  // Hero — wraps the entire vD-canvas-area content.
  const hero = document.createElement('div');
  hero.style.position = 'absolute';
  hero.style.inset = '0';

  const canvasHost = document.createElement('div');
  canvasHost.className = 'canvas-host';
  canvasHost.style.height = '100%';
  hero.appendChild(canvasHost);

  const canvas = document.createElement('canvas');
  canvasHost.appendChild(canvas);

  // Strom (electricity) overlay — top-center of canvas.
  const elecOv = document.createElement('div');
  elecOv.className = 'elec-overlay';
  const elecLabel = document.createElement('div');
  elecLabel.className = 'stat-label';
  const elecVal = document.createElement('div');
  elecVal.className = 'elec-val';
  elecOv.append(elecLabel, elecVal);
  canvasHost.appendChild(elecOv);

  // Stats overlay — bottom-left "Aus der Luft +X.XX" / bottom-right "Wärme X.XX".
  const statsOv = document.createElement('div');
  statsOv.className = 'vD-stats-overlay';

  const airStat = document.createElement('div');
  airStat.className = 'vD-stat';
  const airKicker = document.createElement('div');
  airKicker.className = 'kicker';
  const airNum = document.createElement('div');
  airNum.className = 'stat-air-num';
  airStat.append(airKicker, airNum);

  const heatStat = document.createElement('div');
  heatStat.className = 'vD-stat vD-stat-out';
  const heatKicker = document.createElement('div');
  heatKicker.className = 'kicker';
  const heatNum = document.createElement('div');
  heatNum.className = 'stat-out-num';
  heatStat.append(heatKicker, heatNum);

  statsOv.append(airStat, heatStat);
  hero.appendChild(statsOv);

  // Caption slot = vD-temp (slider with header row + tick labels).
  const caption = document.createElement('div');
  caption.className = 'vD-temp';
  const tempHeader = document.createElement('div');
  tempHeader.className = 'header-row';
  const tempKicker = document.createElement('span');
  tempKicker.className = 'kicker';
  const tempReadout = document.createElement('span');
  tempReadout.className = 'temp-readout';
  tempHeader.append(tempKicker, tempReadout);

  const sliderBlock = document.createElement('div');
  sliderBlock.className = 'slider-block';
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '-15';
  slider.max = '15';
  slider.step = '1';
  slider.value = String(store.get().heatTempC);
  slider.addEventListener('input', () => {
    store.set({ heatTempC: parseInt(slider.value, 10) });
  });

  const sliderLabels = document.createElement('div');
  sliderLabels.className = 'slider-labels';
  const tickEls: HTMLSpanElement[] = TICK_VALUES.map((v) => {
    const span = document.createElement('span');
    span.textContent = `${v >= 0 ? '+' : ''}${v} °C`;
    sliderLabels.appendChild(span);
    return span;
  });

  sliderBlock.append(slider, sliderLabels);
  caption.append(tempHeader, sliderBlock);

  // Control slot = vD-cop-area (cop-pill + temp echo).
  const control = document.createElement('div');
  control.className = 'vD-cop-area';
  const copPill = document.createElement('span');
  copPill.className = 'cop-pill';
  const copValEl = document.createElement('span');
  copPill.append(document.createTextNode('COP '), copValEl);

  const copEchoEl = document.createElement('div');
  copEchoEl.style.fontSize = '12px';
  copEchoEl.style.color = 'var(--text-muted)';

  control.append(copPill, copEchoEl);

  /* ============================================================
     Canvas state + helpers (closure-scoped).
     ============================================================ */
  const ctx = canvas.getContext('2d')!;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let isPortrait = false;
  let currentCOP = 5.01;
  let displayCOP = 5.01;
  let houseWarmth = 0;
  let lastHeroKwh = 0;
  let currentDict: Dict | null = null;

  const hpImg = new Image();
  let hpImgLoaded = false;
  hpImg.onload = () => {
    hpImgLoaded = true;
  };
  hpImg.src = HeatpumpSvgUrl;

  let unitDims = { cx: 0, cy: 0, w: 0, h: 0 };
  let airPath: Pt[] = [];
  let heatPaths: Pt[][] = [];
  let elecPath: Pt[] = [];
  let rafId = 0;

  function resize(): void {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement!.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    if (!W || !H) return;
    isPortrait = H > W * 1.05 || window.innerWidth <= 768;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPaths();
  }

  function getCOP(temp: number): number {
    return Math.max(2.0, Math.min(7.0, 4.2 + 0.12 * temp + 0.001 * temp * temp));
  }

  function bezier3(pts: Pt[], k: number): Pt {
    const a = 1 - k;
    return {
      x: a * a * pts[0]!.x + 2 * a * k * pts[1]!.x + k * k * pts[2]!.x,
      y: a * a * pts[0]!.y + 2 * a * k * pts[1]!.y + k * k * pts[2]!.y,
    };
  }
  function bezier4(pts: Pt[], k: number): Pt {
    const a = 1 - k;
    return {
      x: a * a * a * pts[0]!.x + 3 * a * a * k * pts[1]!.x + 3 * a * k * k * pts[2]!.x + k * k * k * pts[3]!.x,
      y: a * a * a * pts[0]!.y + 3 * a * a * k * pts[1]!.y + 3 * a * k * k * pts[2]!.y + k * k * k * pts[3]!.y,
    };
  }
  function bz(pts: Pt[], k: number): Pt {
    return pts.length === 3 ? bezier3(pts, k) : bezier4(pts, k);
  }
  function easeInOut(k: number): number {
    return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  }
  function strokePath(pts: Pt[]): void {
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    if (pts.length === 3) ctx.quadraticCurveTo(pts[1]!.x, pts[1]!.y, pts[2]!.x, pts[2]!.y);
    else ctx.bezierCurveTo(pts[1]!.x, pts[1]!.y, pts[2]!.x, pts[2]!.y, pts[3]!.x, pts[3]!.y);
    ctx.stroke();
  }

  function buildPaths(): void {
    if (isPortrait) buildPathsPortrait();
    else buildPathsLandscape();
  }

  function buildPathsLandscape(): void {
    const cx = W * 0.5;
    const cy = H * 0.55;
    const unitH = Math.min(H * 0.55, 240);
    const unitW = unitH;
    unitDims = { cx, cy, w: unitW, h: unitH };

    const bodyHalfW = unitW * 0.417;
    const bodyTopOffset = unitH * 0.33;
    const enterDepth = 6;

    airPath = [
      { x: -10, y: cy },
      { x: W * 0.13, y: cy - 10 },
      { x: W * 0.30, y: cy + 6 },
      { x: cx - bodyHalfW + enterDepth, y: cy },
    ];

    heatPaths = [];
    const houseX = W * 0.92;
    const houseS = Math.min(50, W * 0.045);
    const houseWallLeft = houseX - houseS * 0.9;
    for (let i = 0; i < 5; i++) {
      const spread = i / 4;
      const sy = cy + (spread - 0.5) * (bodyHalfW * 1.5);
      const ey = cy + (spread - 0.5) * houseS * 1.2;
      heatPaths.push([
        { x: cx + bodyHalfW - enterDepth, y: sy },
        { x: cx + bodyHalfW + (houseWallLeft - cx - bodyHalfW) * 0.35, y: sy + (ey - sy) * 0.35 },
        { x: cx + bodyHalfW + (houseWallLeft - cx - bodyHalfW) * 0.7, y: ey },
        { x: houseWallLeft + 2, y: ey },
      ]);
    }

    elecPath = [
      { x: cx, y: 36 },
      { x: cx, y: H * 0.22 },
      { x: cx, y: cy - bodyTopOffset + enterDepth },
    ];
  }

  function buildPathsPortrait(): void {
    const unitW = Math.min(W * 0.62, 220);
    const unitH = unitW;
    const cx = W * 0.5;
    const cy = H * 0.46;
    unitDims = { cx, cy, w: unitW, h: unitH };

    const bodyHalfW = unitW * 0.417;
    const bodyTopOffset = unitH * 0.33;
    const bodyBottomOffset = unitH * 0.34;
    const enterDepth = 6;

    const houseS = Math.min(48, W * 0.10);
    const houseY = H * 0.86;
    const houseWallTop = houseY - houseS * 1.0;

    airPath = [
      { x: cx, y: -10 },
      { x: cx, y: cy - bodyTopOffset * 0.6 },
      { x: cx, y: cy - bodyTopOffset + enterDepth },
    ];

    elecPath = [
      { x: cx, y: 24 },
      { x: cx, y: cy - bodyTopOffset - 30 },
      { x: cx, y: cy - bodyTopOffset + enterDepth },
    ];

    heatPaths = [];
    for (let i = 0; i < 5; i++) {
      const spread = i / 4;
      const sx = cx + (spread - 0.5) * (bodyHalfW * 1.5);
      const ex = cx + (spread - 0.5) * houseS * 1.4;
      const startY = cy + bodyBottomOffset - enterDepth;
      const endY = houseWallTop + 2;
      const midY1 = startY + (endY - startY) * 0.4;
      const midY2 = startY + (endY - startY) * 0.75;
      heatPaths.push([
        { x: sx, y: startY },
        { x: sx + (ex - sx) * 0.3, y: midY1 },
        { x: sx + (ex - sx) * 0.7, y: midY2 },
        { x: ex, y: endY },
      ]);
    }
  }

  /* ============================================================
     Drawing — air, electricity, heat pulses, unit, house.
     Verbatim from canonical (TS-typed).
     ============================================================ */
  function drawAirFlow(time: number): void {
    if (isPortrait) drawAirFlowPortrait(time);
    else drawAirFlowLandscape(time);
  }
  function drawAirFlowLandscape(time: number): void {
    const cx = unitDims.cx;
    const cy = unitDims.cy;
    const bodyHalfW = unitDims.w * 0.417;
    const endX = cx - bodyHalfW + 6;

    ctx.strokeStyle = 'rgba(180,210,240,0.03)';
    ctx.lineWidth = 3;
    strokePath(airPath);

    const wisps = 4;
    for (let w = 0; w < wisps; w++) {
      const wSpread = w / (wisps - 1) - 0.5;
      const baseY = cy + wSpread * 35;
      const freq = 0.008 + w * 0.002;
      const amp = 6 + w * 3;
      const phaseOff = w * 1.7;
      const wispAlpha = 0.12 + 0.06 * Math.sin(time * 0.0008 + w);

      const segs = 40;
      ctx.beginPath();
      for (let s = 0; s <= segs; s++) {
        const frac = s / segs;
        const x = -10 + (endX + 10) * frac;
        const converge = frac * frac * frac;
        const yBase = baseY + (cy - baseY) * converge;
        const wave = Math.sin(-time * freq + frac * 12 + phaseOff) * amp * (1 - converge * 0.8);
        const y = yBase + wave;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(180,215,245,${wispAlpha})`;
      ctx.lineWidth = 1.2 + Math.sin(time * 0.001 + w) * 0.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = `rgba(160,200,235,${wispAlpha * 0.25})`;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }
  function drawAirFlowPortrait(time: number): void {
    const cx = unitDims.cx;
    const cy = unitDims.cy;
    const bodyHalfW = unitDims.w * 0.417;
    const bodyTopOffset = unitDims.h * 0.33;
    const endY = cy - bodyTopOffset + 6;
    const targetLeftX = cx - bodyHalfW * 0.4;
    const targetRightX = cx + bodyHalfW * 0.4;

    const wispsPerSide = 3;
    for (let side = 0; side < 2; side++) {
      const fromX = side === 0 ? -10 : W + 10;
      const targetX = side === 0 ? targetLeftX : targetRightX;
      const dirSign = side === 0 ? 1 : -1;

      for (let w = 0; w < wispsPerSide; w++) {
        const wSpread = w / (wispsPerSide - 1) - 0.5;
        const baseStartY = -8 + wSpread * 28;
        const freq = 0.009 + w * 0.002;
        const amp = 5 + w * 2.5;
        const phaseOff = w * 1.7 + side * 0.9;
        const wispAlpha = 0.11 + 0.06 * Math.sin(time * 0.0008 + w + side);

        const segs = 36;
        ctx.beginPath();
        for (let s = 0; s <= segs; s++) {
          const frac = s / segs;
          const converge = frac * frac * frac;
          const x = fromX + (targetX - fromX) * frac;
          const yBase = baseStartY + (endY - baseStartY) * (frac * 0.6 + converge * 0.4);
          const wavePhase = -time * freq + frac * 11 + phaseOff;
          const wave = Math.sin(wavePhase) * amp * (1 - converge * 0.85) * dirSign;
          const y = yBase + wave;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(180,215,245,${wispAlpha})`;
        ctx.lineWidth = 1.2 + Math.sin(time * 0.001 + w + side) * 0.3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.strokeStyle = `rgba(160,200,235,${wispAlpha * 0.25})`;
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    }
  }

  function drawElectricity(time: number): void {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1.5;
    strokePath(elecPath);

    for (let p = 0; p < 2; p++) {
      const cycleDur = 3800;
      const raw = ((time + p * cycleDur * 0.5) % cycleDur) / cycleDur;
      const eased = easeInOut(raw);
      const pulseLen = 0.30;
      const head = -0.05 + eased * 1.15;
      const tail = head - pulseLen;
      const dH = Math.min(1, Math.max(0, head));
      const dT = Math.min(1, Math.max(0, tail));
      if (dH - dT < 0.01) continue;
      const vis = (dH - dT) / pulseLen;
      const fadeIn = Math.min(1, head / 0.12);
      const fadeOut = Math.min(1, (1.05 - head + pulseLen) / 0.15);
      const alpha = vis * Math.max(0, fadeIn) * Math.max(0, fadeOut);

      const steps = 16;
      const points: Pt[] = [];
      for (let s = 0; s <= steps; s++) {
        const st = dT + (dH - dT) * (s / steps);
        points.push(bz(elecPath, Math.min(st, 0.999)));
      }

      ctx.beginPath();
      points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.strokeStyle = `rgba(220,225,235,${alpha * 0.12})`;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      const hp = points[points.length - 1]!;
      const g = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 8);
      g.addColorStop(0, `rgba(255,255,255,${alpha * 0.6})`);
      g.addColorStop(0.5, `rgba(220,225,240,${alpha * 0.15})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawElectricPulse(pts: Pt[], head: number, tail: number, maxAlpha: number): void {
    if (maxAlpha < 0.005) return;
    const dH = Math.min(1, Math.max(0, head));
    const dT = Math.min(1, Math.max(0, tail));
    if (dH - dT < 0.005) return;
    const pulseLen = head - tail;
    const vis = (dH - dT) / Math.max(pulseLen, 0.01);
    const fadeIn = Math.min(1, head / 0.12);
    const fadeOut = Math.min(1, (1.05 - head + pulseLen) / 0.15);
    const alpha = maxAlpha * vis * Math.max(0, fadeIn) * Math.max(0, fadeOut);

    const steps = 24;
    const points: Pt[] = [];
    for (let s = 0; s <= steps; s++) {
      const st = dT + (dH - dT) * (s / steps);
      points.push(bz(pts, Math.min(st, 0.999)));
    }

    // 4-layer pulse — wide bloom → medium → bright core → hot filament
    const drawTrace = (style: string, w: number): void => {
      ctx.beginPath();
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = style;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };
    drawTrace(`rgba(232,146,12,${alpha * 0.08})`, 20);
    drawTrace(`rgba(232,146,12,${alpha * 0.25})`, 8);
    drawTrace(`rgba(255,180,40,${alpha * 0.6})`, 3);
    drawTrace(`rgba(255,245,220,${alpha * 0.5})`, 1.2);

    // Head glow — orange bloom + hot white-gold core
    const hp = points[points.length - 1]!;
    const g1 = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 18);
    g1.addColorStop(0, `rgba(232,146,12,${alpha * 0.35})`);
    g1.addColorStop(1, 'rgba(232,146,12,0)');
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, 18, 0, Math.PI * 2);
    ctx.fill();

    const g2 = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 5);
    g2.addColorStop(0, `rgba(255,250,230,${alpha * 0.7})`);
    g2.addColorStop(0.6, `rgba(255,200,80,${alpha * 0.2})`);
    g2.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFlows(time: number): void {
    displayCOP += (currentCOP - displayCOP) * 0.04;

    const fullLines = Math.min(5, Math.floor(displayCOP));
    const frac = displayCOP - Math.floor(displayCOP);
    const partialIdx = fullLines < 5 && frac > 0.5 ? fullLines : -1;
    const partialBrightness = partialIdx >= 0 ? (frac - 0.5) * 2 : 0;

    drawAirFlow(time);
    drawElectricity(time);

    let totalBrightness = 0;
    for (let i = 0; i < 5; i++) {
      const pts = heatPaths[i];
      if (!pts) continue;
      const isActive = i < fullLines;
      const isPartial = i === partialIdx;
      let brightness = 0;
      if (isActive) brightness = 1;
      else if (isPartial) brightness = partialBrightness;
      totalBrightness += brightness;

      ctx.strokeStyle = `rgba(232,146,12,${brightness > 0.01 ? 0.04 : 0.015})`;
      ctx.lineWidth = 2;
      strokePath(pts);

      if (brightness < 0.01) continue;

      const cycleDur = 4200 + i * 300;
      const pulseLen = 0.30;
      for (let p = 0; p < 2; p++) {
        const phase = i * 700 + p * cycleDur * 0.5;
        const raw = ((time + phase) % cycleDur) / cycleDur;
        const eased = easeInOut(raw);
        const head = -0.08 + eased * 1.22;
        const tail = head - pulseLen;
        drawElectricPulse(pts, head, tail, brightness);
      }

      const breathe = 0.4 + 0.18 * Math.sin(time * 0.0012 + i * 1.3);
      const ambAlpha = brightness * breathe;
      ctx.strokeStyle = `rgba(232,146,12,${ambAlpha * 0.25})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      strokePath(pts);
      ctx.strokeStyle = `rgba(232,146,12,${ambAlpha * 0.05})`;
      ctx.lineWidth = 12;
      strokePath(pts);
    }

    houseWarmth += (totalBrightness - houseWarmth) * 0.06;
  }

  function drawUnit(time: number): void {
    const cx = unitDims.cx;
    const cy = unitDims.cy;
    const imgW = unitDims.w;
    const imgH = unitDims.h;
    const imgX = cx - imgW / 2;
    const imgY = cy - imgH / 2;

    const pulse = 0.20 + 0.08 * Math.sin(time * 0.002);
    const glowR = imgW * 0.55;
    const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    gg.addColorStop(0, `rgba(232,146,12,${pulse})`);
    gg.addColorStop(0.55, `rgba(232,146,12,${pulse * 0.25})`);
    gg.addColorStop(1, 'rgba(232,146,12,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    if (hpImgLoaded) ctx.drawImage(hpImg, imgX, imgY, imgW, imgH);

    // Logo glow — 3 layered radial gradients
    const logoCX = imgX + (LOGO_SVG_CX / 1024) * imgW;
    const logoCY = imgY + (LOGO_SVG_CY / 1024) * imgH;
    const logoSize = imgW * 0.04;
    const lp = 0.7 + 0.3 * Math.sin(time * 0.003);

    const lg1 = ctx.createRadialGradient(logoCX, logoCY, 0, logoCX, logoCY, logoSize * 5);
    lg1.addColorStop(0, `rgba(254,225,163,${0.28 * lp})`);
    lg1.addColorStop(0.5, `rgba(232,170,40,${0.10 * lp})`);
    lg1.addColorStop(1, 'rgba(232,146,12,0)');
    ctx.fillStyle = lg1;
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, logoSize * 5, 0, Math.PI * 2);
    ctx.fill();

    const lg2 = ctx.createRadialGradient(logoCX, logoCY, 0, logoCX, logoCY, logoSize * 2.5);
    lg2.addColorStop(0, `rgba(255,240,200,${0.35 * lp})`);
    lg2.addColorStop(0.6, `rgba(254,225,163,${0.12 * lp})`);
    lg2.addColorStop(1, 'rgba(254,225,163,0)');
    ctx.fillStyle = lg2;
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, logoSize * 2.5, 0, Math.PI * 2);
    ctx.fill();

    const lg3 = ctx.createRadialGradient(logoCX, logoCY, 0, logoCX, logoCY, logoSize * 1.2);
    lg3.addColorStop(0, `rgba(255,252,240,${0.45 * lp})`);
    lg3.addColorStop(0.5, `rgba(255,235,180,${0.18 * lp})`);
    lg3.addColorStop(1, 'rgba(255,225,163,0)');
    ctx.fillStyle = lg3;
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, logoSize * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHouse(time: number): void {
    let hx: number;
    let hy: number;
    let s: number;
    if (isPortrait) {
      hx = W * 0.5;
      hy = H * 0.86;
      s = Math.min(48, W * 0.10);
    } else {
      hx = W * 0.92;
      hy = unitDims.cy;
      s = Math.min(50, W * 0.045);
    }

    const w = Math.min(1, houseWarmth / 5);
    const breathe = 0.85 + 0.15 * Math.sin(time * 0.0015);

    const glowRadius = s * (2 + w * 2);
    const glowAlpha = w * 0.4 * breathe;
    if (glowAlpha > 0.005) {
      const houseGlow = ctx.createRadialGradient(hx, hy, 0, hx, hy, glowRadius);
      houseGlow.addColorStop(0, `rgba(232,146,12,${glowAlpha})`);
      houseGlow.addColorStop(0.4, `rgba(232,146,12,${glowAlpha * 0.3})`);
      houseGlow.addColorStop(1, 'rgba(232,146,12,0)');
      ctx.fillStyle = houseGlow;
      ctx.beginPath();
      ctx.arc(hx, hy, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    const lineAlpha = 0.25 + w * 0.2 + 0.04 * Math.sin(time * 0.0018);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const roofPeak = hy - s;
    const eaveY = hy - s * 0.15;
    ctx.strokeStyle = `rgba(232,232,225,${lineAlpha})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hx - s * 1.22, eaveY);
    ctx.lineTo(hx, roofPeak);
    ctx.lineTo(hx + s * 1.22, eaveY);
    ctx.stroke();

    const wallLeft = hx - s * 0.9;
    const wallRight = hx + s * 0.9;
    const floorY = hy + s * 0.85;
    ctx.beginPath();
    ctx.moveTo(wallLeft, eaveY);
    ctx.lineTo(wallLeft, floorY);
    ctx.lineTo(wallRight, floorY);
    ctx.lineTo(wallRight, eaveY);
    ctx.stroke();

    if (w > 0.05) {
      const interiorAlpha = w * 0.08 * breathe;
      ctx.fillStyle = `rgba(232,146,12,${interiorAlpha})`;
      ctx.beginPath();
      ctx.moveTo(wallLeft, eaveY);
      ctx.lineTo(wallLeft, floorY);
      ctx.lineTo(wallRight, floorY);
      ctx.lineTo(wallRight, eaveY);
      ctx.closePath();
      ctx.fill();
    }

    const doorW = s * 0.28;
    const doorH = s * 0.55;
    const doorX = hx - doorW / 2;
    const doorY = floorY - doorH;
    const doorAlpha = 0.12 + w * 0.4 + 0.08 * Math.sin(time * 0.002);
    ctx.fillStyle = `rgba(232,146,12,${doorAlpha})`;
    ctx.beginPath();
    ctx.roundRect(doorX, doorY, doorW, doorH, [4, 4, 0, 0]);
    ctx.fill();

    const winSize = s * 0.22;
    const winY = eaveY + s * 0.18;
    const winAlpha = 0.06 + w * 0.3 + 0.04 * Math.sin(time * 0.0022 + 1);

    ctx.fillStyle = `rgba(232,180,60,${winAlpha})`;
    ctx.fillRect(wallLeft + s * 0.2, winY, winSize, winSize);
    ctx.strokeStyle = `rgba(232,232,225,${lineAlpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(wallLeft + s * 0.2, winY, winSize, winSize);

    ctx.fillStyle = `rgba(232,180,60,${winAlpha})`;
    ctx.fillRect(wallRight - s * 0.2 - winSize, winY, winSize, winSize);
    ctx.strokeRect(wallRight - s * 0.2 - winSize, winY, winSize, winSize);
  }

  function drawAirSwirl(): void {
    ctx.fillStyle = 'rgba(200,200,195,0.45)';
    ctx.font = '600 11px "Inter", sans-serif';
    const label = currentDict?.energie.outsideAirLabel?.toUpperCase() ?? 'AUSSENLUFT';
    if (isPortrait) {
      ctx.textAlign = 'left';
      ctx.fillText(label, 14, 20);
    } else {
      ctx.textAlign = 'left';
      const ay = unitDims.cy - unitDims.h * 0.55;
      ctx.fillText(label, 12, Math.max(ay, 28));
    }
  }

  function loop(time: number): void {
    if (W > 0 && H > 0) {
      ctx.clearRect(0, 0, W, H);
      drawAirSwirl();
      drawFlows(time);
      drawUnit(time);
      drawHouse(time);
      // Update the heroline `<em>X kWh</em>` from the lerped displayCOP
      const k = Math.round(displayCOP);
      if (k !== lastHeroKwh && currentDict) {
        lastHeroKwh = k;
        headlineEl.innerHTML = currentDict.energie.heroline(k);
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  /* ============================================================
     UI render — pulls strings from the current language dict and
     drives big-number stats from the slider value (current snapshot).
     ============================================================ */
  function render(s: KioskState): void {
    const dict = t(s.lang);
    currentDict = dict;
    const tempC = s.heatTempC;
    const cop = getCOP(tempC);
    currentCOP = cop;
    const heat = cop;
    const air = heat - 1;
    const tempStr = `${tempC >= 0 ? '+' : ''}${tempC} °C`;
    const echoStr = `${tempC >= 0 ? '+' : ''}${tempC}°C`;

    // Header
    headlineEl.innerHTML = dict.energie.heroline(Math.round(displayCOP));

    // Strom overlay
    elecLabel.textContent = dict.energie.electricityLabel.toUpperCase();
    elecVal.textContent = `⚡ ${dict.energie.electricityIn}`;

    // Stats overlay
    airKicker.textContent = dict.energie.statKickerAir;
    airNum.textContent = `+${air.toFixed(2)}`;
    heatKicker.textContent = dict.energie.heatLabel;
    heatNum.textContent = heat.toFixed(2);

    // Slider header + ticks
    tempKicker.textContent = dict.energie.sliderHeader;
    tempReadout.textContent = tempStr;
    if (slider.value !== String(tempC)) slider.value = String(tempC);
    tickEls.forEach((el, i) => {
      el.classList.toggle('hot', Math.abs(tempC - TICK_VALUES[i]!) <= 3);
    });

    // COP pill + echo
    copValEl.textContent = cop.toFixed(2);
    copEchoEl.textContent = dict.energie.copEcho(echoStr);
  }

  /* ============================================================
     Lifecycle — observe the canvas's parent (vD-canvas-area) and
     rebuild paths whenever the slot resizes.
     ============================================================ */
  const ro = new ResizeObserver(() => resize());
  // Defer to next frame so the canvas is in the DOM before the first resize.
  requestAnimationFrame(() => {
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();
  });
  rafId = requestAnimationFrame(loop);

  const unsub = store.subscribe(render);
  render(store.get());

  return {
    header,
    hero,
    caption,
    control,
    destroy() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      unsub();
    },
  };
}
