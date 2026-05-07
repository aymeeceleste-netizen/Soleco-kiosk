import { t } from '../i18n';

/**
 * Component close-up modal for the Innen mode.
 *
 * Two interactive close-ups — compressor and expansion valve — both showing
 * the underlying refrigerant physics with a particle simulation drawn on
 * canvas. Ported from the v1 HTML prototype.
 *
 * Public surface:
 *   const ctrl = createCloseupController();
 *   ctrl.open('compressor');         // shows the modal, starts the anim
 *   ctrl.refresh();                  // re-pull i18n (call on lang change)
 *   ctrl.close();                    // hide + stop the anim
 *   ctrl.destroy();                  // remove DOM, cancel rAF, drop listeners
 *
 * The modal mounts on document.body so it overlays the kiosk shell, matching
 * the qr-modal pattern.
 */

type Which = 'compressor' | 'expansion';
type InnenDict = ReturnType<typeof t>['innen'];

export interface CloseupController {
  open(which: Which): void;
  close(): void;
  /** Re-apply the current language's strings. Safe to call when modal is closed. */
  refresh(): void;
  destroy(): void;
}

// SOLECO-skinned palette (RGB tuples for canvas tinting).
const PALETTE = {
  bg: '#1a1614',
  surface: '#25201c',
  wallSubtle: '#7a7370',
  textMuted: 'rgba(248, 245, 240, 0.55)',
  blue: [127, 179, 255] as RGB, // matches refrigerant coldGas
  amb: [246, 160, 0] as RGB, // matches --color-accent / warmLiq
  red: [255, 120, 73] as RGB, // matches refrigerant hotGas
  icy: [174, 207, 255] as RGB, // light blue tail (post-orifice)
};

type RGB = [number, number, number];

const lerpN = (a: number, b: number, k: number): number => a + (b - a) * k;
const clampN = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const lcN = (a: RGB, b: RGB, k: number): RGB => [lerpN(a[0], b[0], k), lerpN(a[1], b[1], k), lerpN(a[2], b[2], k)];
const rgbN = (c: RGB): string => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const rgbaN = (c: RGB, a: number): string => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const easeN = (k: number): number => (k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k);

function setupCanvas(cv: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  cv.width = w * dpr;
  cv.height = h * dpr;
  cv.style.width = w + 'px';
  cv.style.height = h + 'px';
  const ctx = cv.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return ctx;
}

export function createCloseupController(getDict: () => InnenDict): CloseupController {
  // ---- Modal DOM ----------------------------------------------------------
  const root = document.createElement('div');
  root.className = 'hp-modal';
  root.setAttribute('aria-hidden', 'true');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');

  const backdrop = document.createElement('div');
  backdrop.className = 'hp-modal__backdrop';
  backdrop.dataset.close = '1';

  const panel = document.createElement('div');
  panel.className = 'hp-modal__panel';
  panel.setAttribute('role', 'document');

  const head = document.createElement('header');
  head.className = 'hp-modal__head';
  const titleEl = document.createElement('h3');
  titleEl.className = 'hp-modal__title';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'hp-modal__close';
  closeBtn.dataset.close = '1';
  closeBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>';
  head.append(titleEl, closeBtn);

  const body = document.createElement('div');
  body.className = 'hp-modal__body';
  const descEl = document.createElement('p');
  descEl.className = 'hp-modal__desc';
  const analogyEl = document.createElement('div');
  analogyEl.className = 'hp-modal__analogy';
  const canvas = document.createElement('canvas');
  canvas.className = 'hp-modal__canvas';
  const disclaimerEl = document.createElement('p');
  disclaimerEl.className = 'hp-modal__disclaimer';
  body.append(descEl, analogyEl, canvas, disclaimerEl);

  panel.append(head, body);
  root.append(backdrop, panel);
  document.body.appendChild(root);

  // ---- State --------------------------------------------------------------
  let open: Which | null = null;
  let activeRaf = 0;
  let activeCleanup: (() => void) | null = null;
  let lastFocus: HTMLElement | null = null;

  function setAriaLabel(): void {
    const dict = getDict();
    closeBtn.setAttribute('aria-label', dict.modalClose);
  }

  function applyText(): void {
    if (!open) return;
    const t = getDict().popup[open];
    titleEl.textContent = t.title;
    descEl.textContent = t.desc;
    analogyEl.textContent = t.analogy;
    disclaimerEl.textContent = t.disclaimer;
  }

  function startAnim(): void {
    stopAnim();
    if (!open) return;
    if (open === 'compressor') {
      activeCleanup = startCompressorAnim(canvas, () => getDict().popup.compressor.labels);
    } else {
      activeCleanup = startExpansionAnim(canvas, () => getDict().popup.expansion.labels);
    }
  }

  function stopAnim(): void {
    if (activeCleanup) {
      activeCleanup();
      activeCleanup = null;
    }
    if (activeRaf) {
      cancelAnimationFrame(activeRaf);
      activeRaf = 0;
    }
  }

  // ---- Public API ---------------------------------------------------------
  function openModal(which: Which): void {
    open = which;
    root.dataset.which = which;
    setAriaLabel();
    applyText();
    root.setAttribute('aria-hidden', 'false');
    lastFocus = document.activeElement as HTMLElement | null;
    startAnim();
    closeBtn.focus();
  }

  function closeModal(): void {
    stopAnim();
    root.setAttribute('aria-hidden', 'true');
    open = null;
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function refresh(): void {
    setAriaLabel();
    if (!open) return;
    applyText();
    // Restart the animation so the new-language labels appear in the canvas.
    startAnim();
  }

  // ---- Listeners ----------------------------------------------------------
  const onClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('[data-close]')) closeModal();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && root.getAttribute('aria-hidden') === 'false') closeModal();
  };
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  setAriaLabel();

  return {
    open: openModal,
    close: closeModal,
    refresh,
    destroy() {
      stopAnim();
      root.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      root.remove();
    },
  };
}

/* ============================================================
   Compressor close-up
   ============================================================ */
function startCompressorAnim(
  modalCanvas: HTMLCanvasElement,
  getLabels: () => InnenDict['popup']['compressor']['labels'],
): () => void {
  const W = 680;
  const H = 250;
  const ctx = setupCanvas(modalCanvas, W, H);

  const OUT_CY = 120;
  const OUT_H = 36;
  const OUT_Y = OUT_CY - OUT_H / 2;
  const CH_X = 150;
  const CH_W = 300;
  const CH_H = 150;
  const CH_Y = OUT_CY - CH_H / 2;
  const IN_X = 470;
  const IN_W = 210;
  const IN_H = 90;
  const IN_CY = OUT_CY;
  const IN_Y = IN_CY - IN_H / 2;
  const PW = 16;
  const CYC = 4500;

  type Mol = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    ph: 'in' | 'ch' | 'out';
    jp: number;
  };

  const pistonP = (time: number): number => {
    const s = (time % CYC) / CYC;
    if (s < 0.35) return easeN(s / 0.35);
    if (s < 0.55) return 1;
    if (s < 0.85) return 1 - easeN((s - 0.55) / 0.3);
    return 0;
  };

  const spawnIn = (): Mol => ({
    x: W + 5 + Math.random() * 10,
    y: IN_Y + 6 + Math.random() * (IN_H - 12),
    vx: -(0.5 + Math.random() * 0.3),
    vy: (Math.random() - 0.5) * 0.2,
    r: 5,
    ph: 'in',
    jp: Math.random() * Math.PI * 2,
  });

  const mols: Mol[] = [];
  for (let i = 0; i < 30; i++) {
    const m = spawnIn();
    m.x = IN_X + Math.random() * IN_W;
    m.y = IN_Y + 5 + Math.random() * (IN_H - 10);
    mols.push(m);
  }
  for (let i = 0; i < 25; i++) {
    const m = spawnIn();
    m.ph = 'ch';
    m.x = CH_X + 15 + Math.random() * (CH_W - 50);
    m.y = CH_Y + 10 + Math.random() * (CH_H - 20);
    m.vx = -(Math.random() * 0.6);
    m.vy = (Math.random() - 0.5) * 0.6;
    mols.push(m);
  }
  for (let i = 0; i < 25; i++) {
    const m = spawnIn();
    m.ph = 'out';
    m.x = 5 + Math.random() * (CH_X - 10);
    m.r = 3.8;
    m.vx = -1.3;
    m.y = OUT_Y + 4 + ((i % 4) / 3) * (OUT_H - 8);
    mols.push(m);
  }

  let stopped = false;
  let raf = 0;
  let spT = 0;

  function step(time: number): void {
    if (stopped) return;
    const labels = getLabels();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 10);
    ctx.fill();

    const p = pistonP(time);
    const pistonLeft = CH_X + CH_W - PW - 10 - CH_W * 0.5 * p;

    if (time - spT > 90 && mols.filter((m) => m.ph === 'in').length < 35) {
      mols.push(spawnIn());
      spT = time;
    }

    // Intake
    ctx.fillStyle = 'rgba(127,179,255,.06)';
    ctx.fillRect(IN_X - 10, IN_Y, IN_W + 20, IN_H);
    ctx.strokeStyle = PALETTE.wallSubtle;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(IN_X - 10, IN_Y);
    ctx.lineTo(W, IN_Y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(IN_X - 10, IN_Y + IN_H);
    ctx.lineTo(W, IN_Y + IN_H);
    ctx.stroke();

    // Chamber
    ctx.fillStyle = `rgba(255,120,73,${p * 0.12})`;
    ctx.beginPath();
    ctx.roundRect(CH_X, CH_Y, CH_W, CH_H, 6);
    ctx.fill();
    ctx.strokeStyle = PALETTE.wallSubtle;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(CH_X, CH_Y, CH_W, CH_H, 6);
    ctx.stroke();

    // Outlet
    ctx.fillStyle = 'rgba(255,120,73,.1)';
    ctx.fillRect(0, OUT_Y, CH_X, OUT_H);
    ctx.strokeStyle = 'rgba(255,120,73,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, OUT_Y);
    ctx.lineTo(CH_X, OUT_Y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, OUT_Y + OUT_H);
    ctx.lineTo(CH_X, OUT_Y + OUT_H);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,120,73,${p * 0.1})`;
    ctx.fillRect(CH_X - 1, OUT_Y + 1, 4, OUT_H - 2);
    ctx.fillRect(CH_X + CH_W - 3, IN_Y + 1, 6, IN_H - 2);

    // Piston
    ctx.fillStyle = '#9a9085';
    ctx.beginPath();
    ctx.roundRect(pistonLeft, CH_Y + 4, PW, CH_H - 8, 3);
    ctx.fill();
    ctx.strokeStyle = '#7a7370';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pistonLeft + PW, CH_Y + CH_H / 2);
    ctx.lineTo(CH_X + CH_W + 25, CH_Y + CH_H / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CH_X + CH_W + 40, CH_Y + CH_H / 2, 14, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.surface;
    ctx.fill();
    ctx.strokeStyle = PALETTE.wallSubtle;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const rm: number[] = [];
    for (let i = 0; i < mols.length; i++) {
      const m = mols[i]!;
      const jx = Math.sin(time * 0.003 + m.jp) * 0.6;
      const jy = Math.cos(time * 0.004 + m.jp * 1.3) * 0.6;

      if (m.ph === 'in') {
        m.vx = lerpN(m.vx, -0.7, 0.03);
        m.x += m.vx;
        m.y += m.vy * 0.3;
        if (m.y < IN_Y + m.r) {
          m.y = IN_Y + m.r;
          m.vy = Math.abs(m.vy);
        }
        if (m.y > IN_Y + IN_H - m.r) {
          m.y = IN_Y + IN_H - m.r;
          m.vy = -Math.abs(m.vy);
        }
        if (m.x < CH_X + CH_W - 5) {
          m.ph = 'ch';
          m.vy = (Math.random() - 0.5) * 1;
        }
        ctx.beginPath();
        ctx.arc(m.x + jx, m.y + jy, m.r, 0, Math.PI * 2);
        ctx.fillStyle = rgbN(PALETTE.blue);
        ctx.fill();
      } else if (m.ph === 'ch') {
        const wallL = CH_X + 6;
        const wallR = pistonLeft - 4;
        const speedM = lerpN(1, 2.8, p);
        m.vx += (Math.random() - 0.5) * 0.1 * speedM;
        m.vy += (Math.random() - 0.5) * 0.1 * speedM;
        m.vx = lerpN(m.vx, -0.18, 0.01);
        m.x += m.vx * speedM;
        m.y += m.vy * speedM;
        if (m.x - m.r < wallL) {
          m.x = wallL + m.r;
          m.vx = Math.abs(m.vx);
        }
        if (m.x + m.r > wallR) {
          m.x = wallR - m.r;
          m.vx = -Math.abs(m.vx);
        }
        if (m.y - m.r < CH_Y + 4) {
          m.y = CH_Y + 4 + m.r;
          m.vy = Math.abs(m.vy);
        }
        if (m.y + m.r > CH_Y + CH_H - 4) {
          m.y = CH_Y + CH_H - 4 - m.r;
          m.vy = -Math.abs(m.vy);
        }
        if (m.x - m.r < CH_X + 12 && m.y > OUT_Y - 2 && m.y < OUT_Y + OUT_H + 2) {
          m.ph = 'out';
          m.vx = -1.4 - Math.random() * 0.5;
          m.vy = (Math.random() - 0.5) * 0.15;
          m.x = CH_X - 5;
          m.r = 3.8;
          m.y = clampN(m.y, OUT_Y + 4, OUT_Y + OUT_H - 4);
        }
        const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy) * speedM;
        const heat = clampN(spd / 5, 0, 1);
        const col =
          heat < 0.5
            ? lcN(PALETTE.blue, PALETTE.amb, heat * 2)
            : lcN(PALETTE.amb, PALETTE.red, (heat - 0.5) * 2);
        if (spd > 2) {
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * speedM * 1.2, m.y - m.vy * speedM * 1.2);
          ctx.strokeStyle = rgbaN(col, 0.1);
          ctx.lineWidth = m.r;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(m.x + jx, m.y + jy, m.r, 0, Math.PI * 2);
        ctx.fillStyle = rgbN(col);
        ctx.fill();
        if (heat > 0.5) {
          ctx.beginPath();
          ctx.arc(m.x + jx, m.y + jy, m.r + 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = rgbaN(PALETTE.red, (heat - 0.5) * 0.25);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      } else {
        m.vx = lerpN(m.vx, -1.3, 0.03);
        m.x += m.vx;
        m.y += m.vy * 0.15;
        m.r = lerpN(m.r, 3.8, 0.05);
        if (m.y < OUT_Y + m.r + 1) {
          m.y = OUT_Y + m.r + 1;
          m.vy = Math.abs(m.vy) * 0.2;
        }
        if (m.y > OUT_Y + OUT_H - m.r - 1) {
          m.y = OUT_Y + OUT_H - m.r - 1;
          m.vy = -Math.abs(m.vy) * 0.2;
        }
        ctx.beginPath();
        ctx.arc(m.x, m.y + jy * 0.3, m.r, 0, Math.PI * 2);
        ctx.fillStyle = rgbN(PALETTE.red);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.x, m.y + jy * 0.3, m.r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = rgbaN(PALETTE.red, 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();
        if (m.x < -10) rm.push(i);
      }
    }
    for (let i = rm.length - 1; i >= 0; i--) mols.splice(rm[i]!, 1);

    // Labels
    ctx.fillStyle = rgbN(PALETTE.blue);
    ctx.font = '500 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels.coolIn, IN_X + IN_W / 2 + 20, IN_Y - 18);
    ctx.fillStyle = rgbN(PALETTE.red);
    ctx.fillText(labels.hotOut, 75, OUT_Y - 18);

    ctx.font = '500 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    if (p < 0.15) {
      ctx.fillStyle = rgbN(PALETTE.blue);
      ctx.fillText(labels.cool, CH_X + CH_W / 2, CH_Y + CH_H + 14);
    } else if (p < 0.5) {
      ctx.fillStyle = rgbN(PALETTE.amb);
      ctx.fillText(labels.warming, CH_X + CH_W / 2, CH_Y + CH_H + 14);
    } else if (p < 0.85) {
      ctx.fillStyle = rgbN(PALETTE.red);
      ctx.fillText(labels.hot, CH_X + CH_W / 2, CH_Y + CH_H + 14);
    } else {
      ctx.fillStyle = rgbN(lcN(PALETTE.red, PALETTE.blue, (p - 0.85) / 0.15));
      ctx.fillText(labels.releasing, CH_X + CH_W / 2, CH_Y + CH_H + 14);
    }

    raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);

  return () => {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
  };
}

/* ============================================================
   Expansion-valve close-up
   ============================================================ */
function startExpansionAnim(
  modalCanvas: HTMLCanvasElement,
  getLabels: () => InnenDict['popup']['expansion']['labels'],
): () => void {
  const W = 680;
  const H = 240;
  const ctx = setupCanvas(modalCanvas, W, H);

  const NAR_X = 0;
  const NAR_W = 270;
  const NAR_H = 38;
  const NAR_CY = 120;
  const NAR_Y = NAR_CY - NAR_H / 2;
  const VX = 270;
  const VW = 28;
  const GAP_CY = NAR_CY;
  const GAP_H = 24;
  const GAP_Y = GAP_CY - GAP_H / 2;
  const WIDE_X = 298;
  const WIDE_W = 382;
  const WIDE_H = 160;
  const WIDE_Y = GAP_CY - WIDE_H / 2;
  const BASE_SPEED = 0.9;

  type Mol = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    ph: 'nar' | 'sq' | 'wide';
    jp: number;
    age?: number;
  };

  const spawn = (): Mol => {
    const lanes = 4;
    const lane = Math.floor(Math.random() * lanes);
    return {
      x: -5 - Math.random() * 8,
      y: NAR_Y + 5 + (lane / (lanes - 1)) * (NAR_H - 10) + (Math.random() - 0.5) * 2,
      vx: BASE_SPEED,
      vy: 0,
      r: 3.8,
      ph: 'nar',
      jp: Math.random() * Math.PI * 2,
    };
  };

  const mols: Mol[] = [];
  for (let i = 0; i < 50; i++) {
    const m = spawn();
    m.x = NAR_X + 3 + (i % 16) * 17;
    const lane = i % 4;
    m.y = NAR_Y + 5 + (lane / 3) * (NAR_H - 10) + (Math.random() - 0.5) * 2;
    mols.push(m);
  }

  let stopped = false;
  let raf = 0;
  let spT = 0;

  function step(time: number): void {
    if (stopped) return;
    const labels = getLabels();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 10);
    ctx.fill();

    if (time - spT > 65 && mols.filter((m) => m.ph === 'nar').length < 55) {
      mols.push(spawn());
      spT = time;
    }

    ctx.fillStyle = 'rgba(255,120,73,.1)';
    ctx.fillRect(NAR_X, NAR_Y, NAR_W, NAR_H);
    ctx.strokeStyle = 'rgba(255,120,73,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, NAR_Y);
    ctx.lineTo(VX, NAR_Y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, NAR_Y + NAR_H);
    ctx.lineTo(VX, NAR_Y + NAR_H);
    ctx.stroke();

    ctx.fillStyle = 'rgba(127,179,255,.06)';
    ctx.beginPath();
    ctx.roundRect(WIDE_X, WIDE_Y, WIDE_W, WIDE_H, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(127,179,255,.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(WIDE_X, WIDE_Y, WIDE_W, WIDE_H, 8);
    ctx.stroke();

    // Valve body
    ctx.fillStyle = '#7a7370';
    ctx.beginPath();
    ctx.roundRect(VX, WIDE_Y - 2, VW, GAP_Y - WIDE_Y + 2, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(VX, GAP_Y + GAP_H, VW, WIDE_Y + WIDE_H - GAP_Y - GAP_H + 2, 3);
    ctx.fill();

    // Orifice
    ctx.fillStyle = '#3a3330';
    ctx.fillRect(VX + 6, GAP_Y, VW - 12, GAP_H);
    ctx.strokeStyle = '#a09a92';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(VX + 5, GAP_Y - 1, VW - 10, GAP_H + 2);

    const rm: number[] = [];
    for (let i = 0; i < mols.length; i++) {
      const m = mols[i]!;
      const jy = Math.sin(time * 0.004 + m.jp) * 0.3;

      if (m.ph === 'nar') {
        m.vx = BASE_SPEED;
        const distV = VX - m.x;
        if (distV < 30) {
          m.vy = lerpN(m.vy, (GAP_CY - m.y) * 0.12, 0.1);
          m.vx = BASE_SPEED + 0.3;
        } else {
          m.vy *= 0.9;
        }
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < NAR_Y + m.r) {
          m.y = NAR_Y + m.r;
          m.vy = Math.abs(m.vy) * 0.3;
        }
        if (m.y > NAR_Y + NAR_H - m.r) {
          m.y = NAR_Y + NAR_H - m.r;
          m.vy = -Math.abs(m.vy) * 0.3;
        }
        if (m.x >= VX + 4) m.ph = 'sq';
        ctx.beginPath();
        ctx.arc(m.x, m.y + jy, m.r, 0, Math.PI * 2);
        ctx.fillStyle = rgbN(PALETTE.red);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.x, m.y + jy, m.r + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = rgbaN(PALETTE.red, 0.1);
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (m.ph === 'sq') {
        m.vx = lerpN(m.vx, 2, 0.1);
        m.x += m.vx;
        m.y = lerpN(m.y, GAP_CY, 0.2);
        m.r = lerpN(m.r, 2.5, 0.15);
        if (m.x > VX + VW) {
          m.ph = 'wide';
          m.vx = 1.5 + Math.random() * 1.5;
          m.vy = (Math.random() - 0.5) * 3.5;
          m.age = 0;
        }
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = rgbN(PALETTE.amb);
        ctx.fill();
      } else {
        m.age = (m.age ?? 0) + 0.016;
        m.vx = lerpN(m.vx, 0.9, 0.015);
        m.vy *= 0.96;
        m.x += m.vx;
        m.y += m.vy;
        m.r = lerpN(m.r, 7, 0.025);
        if (m.y - m.r < WIDE_Y + 4) {
          m.y = WIDE_Y + 4 + m.r;
          m.vy = Math.abs(m.vy) * 0.4;
        }
        if (m.y + m.r > WIDE_Y + WIDE_H - 4) {
          m.y = WIDE_Y + WIDE_H - 4 - m.r;
          m.vy = -Math.abs(m.vy) * 0.4;
        }
        const coolT = clampN(m.age * 1.5, 0, 1);
        const col =
          coolT < 0.4
            ? lcN(PALETTE.amb, PALETTE.blue, coolT * 2.5)
            : lcN(PALETTE.blue, PALETTE.icy, (coolT - 0.4) / 0.6);
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = rgbN(col);
        ctx.fill();
        if (coolT > 0.3) {
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = rgbaN(PALETTE.icy, (coolT - 0.3) * 0.15);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        if (m.x > W + 10) rm.push(i);
      }
    }
    for (let i = rm.length - 1; i >= 0; i--) mols.splice(rm[i]!, 1);

    // Sparks downstream of the orifice
    for (let s = 0; s < 5; s++) {
      const age = (time * 0.004 + s * 1.3) % 1;
      if (age < 0.6) {
        const sx = VX + VW + age * 35;
        const sy = GAP_CY + Math.sin(s * 2.9 + time * 0.006) * 18 * age;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + age * 3, 0, Math.PI * 2);
        ctx.fillStyle = rgbaN(PALETTE.amb, 0.3 - age * 0.3);
        ctx.fill();
      }
    }

    // Labels
    ctx.fillStyle = rgbN(PALETTE.red);
    ctx.font = '500 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels.warmIn, NAR_W / 2, NAR_Y + NAR_H + 10);
    ctx.fillStyle = rgbN(PALETTE.icy);
    ctx.fillText(labels.coldOut, WIDE_X + WIDE_W / 2, WIDE_Y + WIDE_H + 10);
    ctx.fillStyle = PALETTE.textMuted;
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText(labels.orifice, VX + VW / 2, WIDE_Y + WIDE_H + 28);
    ctx.fillStyle = rgbN(PALETTE.red);
    ctx.font = '500 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(labels.warm, 15, NAR_Y - 6);
    ctx.fillStyle = rgbN(PALETTE.icy);
    ctx.textAlign = 'right';
    ctx.fillText(labels.cold, W - 15, WIDE_Y - 6);

    raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);

  return () => {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
  };
}
