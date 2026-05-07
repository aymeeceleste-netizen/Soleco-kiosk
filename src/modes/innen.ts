import './innen.css';
import { t } from '../i18n';
import type { EnergieMode, KioskState, Lang } from '../state';
import { store } from '../state';
import type { ModeView } from './_types';
import { createCloseupController } from './innen-closeup';

/**
 * Innen mode — heat-pump schematic (replaces the earlier abstract loop).
 *
 * Adapted from a standalone JS package. Key adaptations to kiosk conventions:
 *  - Mode key: package's `'heat'` → kiosk's `'heizen'` so the local pill writes
 *    straight through to the global `energieMode` (no translation layer).
 *  - State: package's `hpMode` / `hpShowHeat` → `energieMode` + new
 *    `innenShowHeat` (added in state.ts) for "Wärmestrom anzeigen" persistence.
 *  - i18n: package's `dict.heatpump.{outdoorUnit,showHeat,captionHeat,
 *    captionCool}` map to `dict.innen.{brandLabel,showHeatFlow,heat.explainer,
 *    cool.explainer}` already present in i18n.ts.
 *  - getTotalLength()/getPointAtLength() require the path in the DOM, so the
 *    animation startup is deferred to a rAF after mount.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const HEAT_COLOR = '#f6a000';
const COOL_COLOR = '#2e7cf6';

// Refrigerant phase palette
const COLOR = {
  coldGas: '#7fb3ff',
  warmGas: '#fbbf24',
  hotGas: '#ff7849',
  warmLiq: '#f6a000',
  coldLiq: '#2e7cf6',
} as const;

const VIEWBOX_W = 700;
const VIEWBOX_H = 460;
const SPEED = 60;

let instanceCounter = 0;

interface AnimRefs {
  setMode(m: EnergieMode): void;
  setLabels(dict: ReturnType<typeof t>['innen'], currentMode: EnergieMode): void;
  stop(): void;
}

export function mountInnen(): ModeView {
  const id = `innen-${++instanceCounter}`;

  // ---- Hero -------------------------------------------------
  const hero = document.createElement('div');
  hero.className = 'hp-hero';
  hero.dataset.mode = store.get().energieMode;

  const stage = document.createElement('div');
  stage.className = 'hp-stage';
  hero.appendChild(stage);

  const svg = buildSvg(id);
  stage.appendChild(svg);

  // Hint under the schematic — invites users to tap the compressor / valve.
  // Click handlers (modal close-ups) come in pass 2; for now the SVG groups
  // are styled as clickable so the affordance is visible.
  const hint = document.createElement('p');
  hint.className = 'hp-hint';
  hero.appendChild(hint);

  // ---- Caption ---------------------------------------------
  const caption = document.createElement('div');
  caption.className = 'mode-caption';
  const captionInner = document.createElement('span');
  captionInner.className = 'hp-caption';
  caption.appendChild(captionInner);

  // ---- Control ---------------------------------------------
  const control = document.createElement('div');
  control.className = 'mode-control hp-control';
  control.dataset.mode = store.get().energieMode;

  const pills = document.createElement('div');
  pills.className = 'hp-pills';
  pills.setAttribute('role', 'tablist');

  const pillHeat = makePill('heizen', '01');
  const pillCool = makePill('kuehlen', '02');
  pills.append(pillHeat.btn, pillCool.btn);

  const spacer = document.createElement('div');
  const toggle = makeToggle();

  control.append(pills, spacer, toggle.label);

  // ---- Pill / toggle handlers -------------------------------
  pillHeat.btn.addEventListener('click', () =>
    store.set({ energieMode: 'heizen', hpState: 'heat' }),
  );
  pillCool.btn.addEventListener('click', () =>
    store.set({ energieMode: 'kuehlen', hpState: 'cool' }),
  );
  toggle.input.addEventListener('change', () => {
    store.set({ innenShowHeat: toggle.input.checked });
  });

  // ---- Component close-up modal -----------------------------
  // Wired on document.body so it overlays the kiosk shell. The controller
  // owns its own DOM; we only feed it the current i18n dict and handle the
  // SVG-group click/keyboard hotspots.
  const closeup = createCloseupController(() => t(store.get().lang).innen);

  const expansionG = svg.querySelector<SVGGElement>('#hp-expansion');
  const compressorG = svg.querySelector<SVGGElement>('#hp-compressor');
  const wireHotspot = (g: SVGGElement | null, which: 'compressor' | 'expansion'): void => {
    if (!g) return;
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.addEventListener('click', () => closeup.open(which));
    g.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeup.open(which);
      }
    });
  };
  wireHotspot(expansionG, 'expansion');
  wireHotspot(compressorG, 'compressor');

  // ---- Animation runtime (deferred until SVG is in DOM) -----
  let anim: AnimRefs | null = null;
  let setupRaf = 0;
  let stopped = false;

  const tryStartAnim = (): void => {
    if (stopped) return;
    const loop = svg.querySelector<SVGGeometryElement>('#hp-loop-master');
    if (!loop || !loop.getTotalLength || !loop.getTotalLength()) {
      setupRaf = requestAnimationFrame(tryStartAnim);
      return;
    }
    anim = startAnimation(svg, () => store.get());
    // Fire the first paint with the latest state now that anim refs exist
    render(store.get());
  };
  setupRaf = requestAnimationFrame(tryStartAnim);

  // ---- Render on state change -------------------------------
  let lastLang: Lang | null = null;
  function render(state: KioskState): void {
    const lang: Lang = state.lang;
    const mode: EnergieMode = state.energieMode;
    const showHeat = state.innenShowHeat !== false;
    const dict = t(lang).innen;

    hero.dataset.mode = mode;
    control.dataset.mode = mode;

    pillHeat.btn.setAttribute('aria-pressed', String(mode === 'heizen'));
    pillCool.btn.setAttribute('aria-pressed', String(mode === 'kuehlen'));
    pillHeat.label.textContent = dict.modeHeat;
    pillCool.label.textContent = dict.modeCool;

    toggle.input.checked = showHeat;
    toggle.labelText.textContent = dict.showHeatFlow;

    hint.textContent = dict.hintCaption;

    if (anim) {
      anim.setLabels(dict, mode);
      anim.setMode(mode);
    }

    captionInner.innerHTML = mode === 'heizen' ? dict.heat.explainer : dict.cool.explainer;
    captionInner.dataset.mode = mode;

    // Re-pull modal copy/canvas labels when the kiosk language toggles.
    if (lastLang !== lang) {
      lastLang = lang;
      closeup.refresh();
    }
  }

  const unsubscribe = store.subscribe(render);
  render(store.get());

  return {
    hero,
    caption,
    control,
    destroy() {
      stopped = true;
      unsubscribe();
      if (setupRaf) cancelAnimationFrame(setupRaf);
      anim?.stop();
      closeup.destroy();
    },
  };
}

/* ============================================================
   Helpers — pill button and heat-flow toggle
   ============================================================ */
function makePill(mode: EnergieMode, num: string) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hp-pill';
  btn.dataset.mode = mode;
  btn.setAttribute('aria-pressed', 'false');

  const numEl = document.createElement('span');
  numEl.className = 'hp-pill__num';
  numEl.textContent = num;

  const label = document.createElement('span');
  label.className = 'hp-pill__label';

  btn.append(numEl, label);
  return { btn, label };
}

function makeToggle() {
  const label = document.createElement('label');
  label.className = 'hp-toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = true;

  const track = document.createElement('span');
  track.className = 'hp-toggle__track';
  const dot = document.createElement('span');
  dot.className = 'hp-toggle__dot';
  track.appendChild(dot);

  const labelText = document.createElement('span');
  labelText.className = 'hp-toggle__text';

  label.append(input, track, labelText);
  return { label, input, labelText };
}

/* ============================================================
   SVG construction. Filter / symbol IDs are namespaced per-mount
   so cross-fading between two instances doesn't collide on
   url(#…) lookups.
   ============================================================ */
function buildSvg(id: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'hp-svg');
  svg.setAttribute('viewBox', `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'img');

  const fTight = `${id}-led-glow-tight`;
  const fWide = `${id}-led-glow-wide`;
  const fParticle = `${id}-particle-glow`;
  const sym = `${id}-hex-logo`;

  svg.innerHTML = `
    <defs>
      <filter id="${fTight}" x="-200%" y="-200%" width="500%" height="500%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
      </filter>
      <filter id="${fWide}" x="-200%" y="-200%" width="500%" height="500%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="9"/>
      </filter>
      <filter id="${fParticle}" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
      </filter>
      <symbol id="${sym}" viewBox="0 0 189 203">
        <path d="M105.915 36.2102L147.804 60.3996C150.281 61.8413 152.338 63.9065 153.769 66.3897C155.2 68.8729 155.957 71.6875 155.963 74.5538V126.903C155.963 127.358 155.913 127.812 155.874 128.257L185.091 145.127C187.423 139.334 188.628 133.148 188.636 126.903V74.5538C188.628 65.9486 186.36 57.4968 182.059 50.0433C177.759 42.5898 171.577 36.3962 164.131 32.0815L118.804 5.91661C114.775 3.60526 110.434 1.88547 105.915 0.810059V36.2102Z"/>
        <path d="M143.823 143.369L102.467 167.252C99.981 168.679 97.1647 169.43 94.2984 169.43C91.4319 169.43 88.6155 168.679 86.1298 167.252L40.803 141.077C38.3233 139.64 36.2642 137.577 34.8308 135.095C33.3974 132.613 32.6401 129.799 32.6346 126.933V74.5833C32.6342 71.7108 33.3886 68.8885 34.8222 66.3992C36.2558 63.9099 38.3183 61.841 40.803 60.3996L86.1594 34.2445C86.3767 34.1161 86.6039 34.0371 86.8212 33.9186V0C80.8414 0.9119 75.0818 2.9211 69.8322 5.92636L24.4956 32.1012C17.0516 36.4163 10.871 42.6104 6.5722 50.0639C2.27343 57.5175 0.00715766 65.9691 0 74.5733V126.923C0.00516584 135.528 2.27063 143.98 6.56961 151.434C10.8686 158.888 17.0502 165.082 24.4956 169.395L69.8322 195.57C77.2817 199.863 85.7302 202.118 94.328 202.109C102.929 202.12 111.381 199.863 118.833 195.57L164.16 169.395C168.025 167.145 171.559 164.37 174.661 161.148L143.823 143.369Z"/>
      </symbol>
    </defs>

    <rect x="0" y="0" width="700" height="320" fill="var(--color-bg, #1a1614)"/>
    <rect x="0" y="320" width="700" height="140" fill="var(--color-surface-lower, #15110f)"/>
    <line x1="0" y1="320" x2="700" y2="320" stroke="var(--color-divider, rgba(255,255,255,0.08))" stroke-width="1"/>

    <text id="hp-indoor-label" x="155" y="32" text-anchor="middle" font-size="11" fill="var(--color-text-subtle, #7a7370)" letter-spacing="0.08em">INNENLUFT</text>
    <text id="hp-indoor-temp" x="155" y="58" text-anchor="middle" font-size="22" font-weight="500" fill="var(--color-text, #faf8f5)">21°C</text>
    <text id="hp-outdoor-label" x="500" y="32" text-anchor="middle" font-size="11" fill="var(--color-text-subtle, #7a7370)" letter-spacing="0.08em">AUSSENLUFT</text>
    <text id="hp-outdoor-temp" x="500" y="58" text-anchor="middle" font-size="22" font-weight="500" fill="var(--color-text, #faf8f5)">−2°C</text>

    <g id="hp-house" stroke="var(--color-text-subtle, #7a7370)" fill="none">
      <polygon points="60,180 160,110 260,180" stroke-width="1.2" stroke-linejoin="round"/>
      <rect x="80" y="180" width="160" height="160" stroke-width="1.2"/>
      <rect x="100" y="200" width="40" height="40" fill="rgba(46,124,246,0.12)" stroke="#2e7cf6" stroke-width="0.8" stroke-opacity="0.6"/>
      <line x1="120" y1="200" x2="120" y2="240" stroke="#2e7cf6" stroke-width="0.5" stroke-opacity="0.6"/>
      <line x1="100" y1="220" x2="140" y2="220" stroke="#2e7cf6" stroke-width="0.5" stroke-opacity="0.6"/>
      <rect x="190" y="270" width="40" height="70" stroke-width="0.8"/>
      <circle cx="222" cy="306" r="1.6" fill="var(--color-text-subtle, #7a7370)" stroke="none"/>
      <g>
        <rect x="100" y="324" width="80" height="14" rx="3" stroke-width="0.8" fill="rgba(255,255,255,0.03)"/>
        <line x1="108" y1="331" x2="172" y2="331" stroke-width="0.5" stroke-dasharray="3 3" stroke-opacity="0.6"/>
      </g>
    </g>

    <g>
      <text id="hp-indoor-coil-name" x="60" y="380" text-anchor="middle" font-size="11" font-weight="500" fill="var(--color-text, #faf8f5)">Innenwärmetauscher</text>
      <text id="hp-indoor-coil-sub-1" x="60" y="394" text-anchor="middle" font-size="9" fill="var(--color-text-muted, #b8b0a8)">(gibt Wärme</text>
      <text id="hp-indoor-coil-sub-2" x="60" y="405" text-anchor="middle" font-size="9" fill="var(--color-text-muted, #b8b0a8)">in den Raum ab)</text>
    </g>

    <g>
      <rect x="290" y="170" width="350" height="220" rx="12" fill="var(--color-surface, #25201c)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <text id="hp-outdoor-name" x="455" y="160" text-anchor="middle" font-size="11" font-weight="500" fill="var(--color-text, #faf8f5)" letter-spacing="0.04em">SOLECO Wärmepumpe</text>
      <line x1="290" y1="195" x2="640" y2="195" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

      <g id="hp-led-wide" filter="url(#${fWide})" opacity="0.55" color="#f6a000">
        <use href="#${sym}" x="572" y="198" width="32" height="34" fill="currentColor"/>
      </g>
      <g id="hp-led-tight" filter="url(#${fTight})" opacity="0.85" color="#f6a000">
        <use href="#${sym}" x="572" y="198" width="32" height="34" fill="currentColor"/>
      </g>
      <g id="hp-led-main" color="#f6a000">
        <use href="#${sym}" x="572" y="198" width="32" height="34" fill="currentColor"/>
      </g>

      <circle cx="535" cy="290" r="48" fill="none" stroke="var(--color-text-subtle, #7a7370)" stroke-width="1"/>
      <g id="hp-fan-blades" transform="translate(535 290)">
        <path d="M 0 -40 Q 11 -20 0 0 Q -11 -20 0 -40 Z" fill="rgba(184,176,168,0.5)"/>
        <path d="M 0 -40 Q 11 -20 0 0 Q -11 -20 0 -40 Z" fill="rgba(184,176,168,0.5)" transform="rotate(120)"/>
        <path d="M 0 -40 Q 11 -20 0 0 Q -11 -20 0 -40 Z" fill="rgba(184,176,168,0.5)" transform="rotate(240)"/>
        <circle r="5" fill="var(--color-text-subtle, #7a7370)"/>
      </g>
      <text id="hp-outdoor-coil-name" x="535" y="357" text-anchor="middle" font-size="11" font-weight="500" fill="var(--color-text, #faf8f5)">Aussenwärmetauscher</text>
      <text id="hp-outdoor-coil-sub" x="535" y="371" text-anchor="middle" font-size="9" fill="var(--color-text-muted, #b8b0a8)">(holt Wärme aus der Aussenluft)</text>

      <g id="hp-expansion" class="hp-component">
        <rect class="hp-pulse" x="316" y="204" width="88" height="52" rx="8" fill="none" stroke="#f6a000" stroke-width="1.5"/>
        <rect x="320" y="208" width="80" height="44" rx="6" fill="var(--color-bg, #1a1614)" stroke="var(--color-text-subtle, #7a7370)" stroke-width="0.8"/>
        <polygon points="354,222 366,222 360,234" fill="none" stroke="var(--color-text-subtle, #7a7370)" stroke-width="0.8"/>
        <polygon points="354,246 366,246 360,234" fill="none" stroke="var(--color-text-subtle, #7a7370)" stroke-width="0.8"/>
        <text id="hp-expansion-name" x="360" y="269" text-anchor="middle" font-size="11" font-weight="500" fill="var(--color-text, #faf8f5)">Expansionsventil</text>
        <text id="hp-expansion-sub" x="360" y="282" text-anchor="middle" font-size="9" fill="var(--color-text-muted, #b8b0a8)">(senkt den Druck)</text>
      </g>

      <g id="hp-compressor" class="hp-component">
        <rect class="hp-pulse hp-pulse--delayed" x="316" y="316" width="88" height="58" rx="8" fill="none" stroke="#f6a000" stroke-width="1.5"/>
        <rect x="320" y="320" width="80" height="50" rx="6" fill="var(--color-bg, #1a1614)" stroke="var(--color-text-subtle, #7a7370)" stroke-width="0.8"/>
        <circle cx="360" cy="345" r="13" fill="none" stroke="var(--color-text-subtle, #7a7370)" stroke-width="0.8"/>
        <circle id="hp-comp-piston" cx="360" cy="345" r="5" fill="#7a7370"/>
        <text id="hp-compressor-name" x="360" y="385" text-anchor="middle" font-size="11" font-weight="500" fill="var(--color-text, #faf8f5)">Kompressor</text>
        <text id="hp-compressor-sub" x="360" y="398" text-anchor="middle" font-size="9" fill="var(--color-text-muted, #b8b0a8)">(erhöht den Druck)</text>
      </g>
    </g>

    <path id="hp-loop"
      d="M 180 331 L 220 331 L 220 237 L 320 237
         M 400 237 L 470 237 L 470 251 L 535 251
         M 535 329 L 470 329 L 470 345 L 400 345
         M 320 345 L 310 345 L 310 380 L 100 380 L 100 331"
      fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3" stroke-linejoin="round"/>

    <path id="hp-loop-master"
      d="M 180 331 L 220 331 L 220 237 L 320 237 L 360 237 L 400 237 L 470 237 L 470 251 L 535 251 L 535 290 L 535 329 L 470 329 L 470 345 L 400 345 L 360 345 L 320 345 L 310 345 L 310 380 L 100 380 L 100 331 Z"
      fill="none" stroke="none"/>

    <g id="hp-heat-particles"></g>
    <g id="hp-refrigerant-particles" filter="url(#${fParticle})"></g>
  `;
  return svg;
}

/* ============================================================
   Animation runtime — particle motion, fan rotation, piston pulse,
   heat-flow dots. Same logic as the source package.
   ============================================================ */
function startAnimation(svg: SVGSVGElement, getState: () => KioskState): AnimRefs {
  const loop = svg.querySelector<SVGGeometryElement>('#hp-loop-master')!;
  const refLayer = svg.querySelector<SVGGElement>('#hp-refrigerant-particles')!;
  const heatLayer = svg.querySelector<SVGGElement>('#hp-heat-particles')!;
  const compPiston = svg.querySelector<SVGCircleElement>('#hp-comp-piston')!;
  const fanBlades = svg.querySelector<SVGGElement>('#hp-fan-blades')!;
  const ledMain = svg.querySelector<SVGGElement>('#hp-led-main')!;
  const ledTight = svg.querySelector<SVGGElement>('#hp-led-tight')!;
  const ledWide = svg.querySelector<SVGGElement>('#hp-led-wide')!;
  const indoorTemp = svg.querySelector<SVGTextElement>('#hp-indoor-temp')!;
  const outdoorTemp = svg.querySelector<SVGTextElement>('#hp-outdoor-temp')!;

  const labels = {
    indoorAir: svg.querySelector<SVGTextElement>('#hp-indoor-label')!,
    outdoorAir: svg.querySelector<SVGTextElement>('#hp-outdoor-label')!,
    indoorCoil: svg.querySelector<SVGTextElement>('#hp-indoor-coil-name')!,
    outdoorCoil: svg.querySelector<SVGTextElement>('#hp-outdoor-coil-name')!,
    expansion: svg.querySelector<SVGTextElement>('#hp-expansion-name')!,
    compressor: svg.querySelector<SVGTextElement>('#hp-compressor-name')!,
    expansionSub: svg.querySelector<SVGTextElement>('#hp-expansion-sub')!,
    compressorSub: svg.querySelector<SVGTextElement>('#hp-compressor-sub')!,
    indoorSub1: svg.querySelector<SVGTextElement>('#hp-indoor-coil-sub-1')!,
    indoorSub2: svg.querySelector<SVGTextElement>('#hp-indoor-coil-sub-2')!,
    outdoorSub: svg.querySelector<SVGTextElement>('#hp-outdoor-coil-sub')!,
    outdoorUnit: svg.querySelector<SVGTextElement>('#hp-outdoor-name')!,
  };

  const totalLen = loop.getTotalLength();
  const SAMPLES = 400;

  const inRect = (p: DOMPoint, r: { x: number; y: number; w: number; h: number }): boolean =>
    p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

  const zones = {
    indoor: { x: 96, y: 322, w: 88, h: 18 },
    expansion: { x: 320, y: 208, w: 80, h: 44 },
    outdoor: { x: 487, y: 240, w: 100, h: 100 },
    compressor: { x: 320, y: 320, w: 80, h: 50 },
  };

  const zoneAt = new Array<string>(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const p = loop.getPointAtLength((i / SAMPLES) * totalLen);
    let z = 'pipe';
    for (const k of Object.keys(zones) as (keyof typeof zones)[]) {
      if (inRect(p, zones[k])) {
        z = k;
        break;
      }
    }
    zoneAt[i] = z;
  }

  const zoneCenterFraction = (name: string): number => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < SAMPLES; i++) {
      if (zoneAt[i] === name) {
        sum += i;
        count++;
      }
    }
    return count > 0 ? sum / count / SAMPLES : 0;
  };

  const centers = {
    indoor: zoneCenterFraction('indoor'),
    expansion: zoneCenterFraction('expansion'),
    outdoor: zoneCenterFraction('outdoor'),
    compressor: zoneCenterFraction('compressor'),
  };

  const between = (f: number, a: number, b: number): boolean => {
    f = ((f % 1) + 1) % 1;
    if (a < b) return f >= a && f < b;
    return f >= a || f < b;
  };

  const colorAtHeating = (f: number): string => {
    if (between(f, centers.indoor, centers.expansion)) return COLOR.warmLiq;
    if (between(f, centers.expansion, centers.outdoor)) return COLOR.coldLiq;
    if (between(f, centers.outdoor, centers.compressor)) return COLOR.coldGas;
    return COLOR.hotGas;
  };

  const colorAtCooling = (f: number): string => {
    if (between(f, centers.indoor, centers.expansion)) return COLOR.coldLiq;
    if (between(f, centers.expansion, centers.outdoor)) return COLOR.warmLiq;
    if (between(f, centers.outdoor, centers.compressor)) return COLOR.hotGas;
    return COLOR.warmGas;
  };

  const N_PARTICLES = 28;
  const particles: { el: SVGCircleElement; f: number }[] = [];
  for (let i = 0; i < N_PARTICLES; i++) {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('r', '4');
    c.setAttribute('class', 'hp-blob');
    c.setAttribute('fill', COLOR.coldGas);
    refLayer.appendChild(c);
    particles.push({ el: c, f: i / N_PARTICLES });
  }

  // Heat dots — amber in both modes per the package's design choice.
  const N_HEAT = 14;
  const heatDots: { el: SVGCircleElement; t: number }[] = [];
  for (let i = 0; i < N_HEAT; i++) {
    const d = document.createElementNS(SVG_NS, 'circle');
    d.setAttribute('r', '3');
    d.setAttribute('fill', HEAT_COLOR);
    d.setAttribute('opacity', '0');
    heatLayer.appendChild(d);
    heatDots.push({ el: d, t: Math.random() });
  }

  let progress = 0;
  let lastTs = performance.now();
  let raf = 0;
  let mode: EnergieMode = 'heizen';

  function setMode(m: EnergieMode): void {
    mode = m;
    const c = m === 'heizen' ? HEAT_COLOR : COOL_COLOR;
    ledMain.setAttribute('color', c);
    ledTight.setAttribute('color', c);
    ledWide.setAttribute('color', c);

    if (m === 'heizen') {
      indoorTemp.textContent = '21°C';
      outdoorTemp.textContent = '−2°C';
    } else {
      indoorTemp.textContent = '22°C';
      outdoorTemp.textContent = '32°C';
    }
  }

  function setLabels(dict: ReturnType<typeof t>['innen'], currentMode: EnergieMode): void {
    labels.indoorAir.textContent = dict.indoorAir;
    labels.outdoorAir.textContent = dict.outdoorAir;
    labels.indoorCoil.textContent = dict.indoorCoil;
    labels.outdoorCoil.textContent = dict.outdoorCoil;
    labels.expansion.textContent = dict.expansion;
    labels.compressor.textContent = dict.compressor;
    labels.expansionSub.textContent = dict.expansionSub;
    labels.compressorSub.textContent = dict.compressorSub;
    labels.outdoorUnit.textContent = dict.brandLabel;

    if (currentMode === 'heizen') {
      labels.indoorSub1.textContent = dict.heat.indoorSub1;
      labels.indoorSub2.textContent = dict.heat.indoorSub2;
      labels.outdoorSub.textContent = dict.heat.outdoorSub;
    } else {
      labels.indoorSub1.textContent = dict.cool.indoorSub1;
      labels.indoorSub2.textContent = dict.cool.indoorSub2;
      labels.outdoorSub.textContent = dict.cool.outdoorSub;
    }
  }

  function updateParticles(dt: number): void {
    const dir = mode === 'heizen' ? 1 : -1;
    progress = (progress + (SPEED / 1000) * dt * 0.001 * dir) % 1;
    if (progress < 0) progress += 1;

    for (const p of particles) {
      const f = (p.f + progress + 1) % 1;
      const pt = loop.getPointAtLength(f * totalLen);
      p.el.setAttribute('cx', String(pt.x));
      p.el.setAttribute('cy', String(pt.y));
      const color = mode === 'heizen' ? colorAtHeating(f) : colorAtCooling(f);
      p.el.setAttribute('fill', color);
      const isGas = color === COLOR.hotGas || color === COLOR.coldGas || color === COLOR.warmGas;
      p.el.setAttribute('r', isGas ? '4.5' : '3.2');
    }

    const pulse = Math.sin(performance.now() * 0.006 * (SPEED / 80)) * 2.5;
    compPiston.setAttribute('r', String(5 + pulse));

    const rot = performance.now() * 0.001 * (SPEED / 4) * dir;
    fanBlades.setAttribute('transform', `translate(535 290) rotate(${rot})`);
  }

  function updateHeat(dt: number): void {
    const showHeat = getState().innenShowHeat !== false;
    if (!showHeat) {
      heatDots.forEach((d) => d.el.setAttribute('opacity', '0'));
      return;
    }
    const src =
      mode === 'heizen'
        ? { from: { x: 660, y: 230, jitter: 30 }, to: { x: 535, y: 290 } }
        : { from: { x: 140, y: 220, jitter: 40 }, to: { x: 140, y: 331 } };
    const snk =
      mode === 'heizen'
        ? { from: { x: 140, y: 331, jitter: 0 }, to: { x: 160, y: 200, jitter: 40 } }
        : { from: { x: 535, y: 290, jitter: 0 }, to: { x: 660, y: 230, jitter: 30 } };

    heatDots.forEach((d, i) => {
      d.t += dt * 0.0006 * (SPEED / 80);
      if (d.t > 1) d.t -= 1;
      const isSource = i < heatDots.length / 2;
      const seg = isSource ? src : snk;
      const tt = d.t;
      const fromJitter = seg.from.jitter ?? 10;
      const jitterX = Math.sin(tt * 6.28 + i) * fromJitter;
      const jitterY = Math.cos(tt * 6.28 + i * 1.7) * 8;
      const x = seg.from.x + (seg.to.x - seg.from.x) * tt + jitterX * (1 - tt);
      const y = seg.from.y + (seg.to.y - seg.from.y) * tt + jitterY * (1 - tt);
      d.el.setAttribute('cx', String(x));
      d.el.setAttribute('cy', String(y));
      d.el.setAttribute('fill', HEAT_COLOR);
      d.el.setAttribute('opacity', (Math.sin(tt * Math.PI) * 0.7).toFixed(2));
    });
  }

  function frame(ts: number): void {
    const dt = Math.min(50, ts - lastTs);
    lastTs = ts;
    updateParticles(dt);
    updateHeat(dt);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    setMode,
    setLabels,
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}
