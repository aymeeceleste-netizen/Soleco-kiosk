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

const VIEWBOX_W = 860;
const VIEWBOX_H = 520;
const SPEED = 60;

let instanceCounter = 0;

interface AnimRefs {
  setMode(m: EnergieMode): void;
  setLabels(dict: ReturnType<typeof t>['innen'], currentMode: EnergieMode): void;
  stop(): void;
}

export function mountInnen(): ModeView {
  const id = `innen-${++instanceCounter}`;

  // ---- Hero: 2-column split, explainer left / animation right ------------
  const hero = document.createElement('div');
  hero.className = 'hp-hero';
  hero.dataset.mode = store.get().energieMode;

  const textCol = document.createElement('div');
  textCol.className = 'hp-hero__text';
  hero.appendChild(textCol);

  const explainer = document.createElement('div');
  explainer.className = 'hp-explainer';
  const explainerText = document.createElement('span');
  explainerText.className = 'hp-explainer__text';
  explainer.appendChild(explainerText);
  textCol.appendChild(explainer);

  // Hint moved into the text column — frees vertical space in the stage column
  // so the SVG can grow larger.
  const hint = document.createElement('p');
  hint.className = 'hp-hint';
  textCol.appendChild(hint);

  const stageCol = document.createElement('div');
  stageCol.className = 'hp-hero__stage';
  hero.appendChild(stageCol);

  const stage = document.createElement('div');
  stage.className = 'hp-stage';
  stageCol.appendChild(stage);

  const svg = buildSvg(id);
  stage.appendChild(svg);

  // ---- Caption slot = mode pills (canonical: .hp-mode-pills) ----------
  const caption = document.createElement('div');
  caption.className = 'mode-caption hp-mode-pills';
  caption.dataset.mode = store.get().energieMode;

  const pills = document.createElement('div');
  pills.className = 'hp-pills';
  pills.setAttribute('role', 'tablist');

  const pillHeat = makePill('heizen', '01');
  const pillCool = makePill('kuehlen', '02');
  pills.append(pillHeat.btn, pillCool.btn);
  caption.appendChild(pills);

  // ---- Control slot = heat-flow toggle (canonical: .hp-aux-wrap) -------
  const control = document.createElement('div');
  control.className = 'mode-control hp-aux-wrap';
  control.dataset.mode = store.get().energieMode;

  const toggle = makeToggle();
  control.appendChild(toggle.label);

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
    explainerText.innerHTML = mode === 'heizen' ? dict.heat.explainer : dict.cool.explainer;
    explainer.dataset.mode = mode;

    if (anim) {
      anim.setLabels(dict, mode);
      anim.setMode(mode);
    }

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

    <line x1="0" y1="380" x2="860" y2="380" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>

    <text id="hp-indoor-label" x="155" y="32" text-anchor="middle" font-size="11" fill="#4a4a48" letter-spacing="0.08em">INNENLUFT</text>
    <text id="hp-indoor-temp" x="155" y="58" text-anchor="middle" font-size="22" font-weight="500" fill="#e8e6e1">21°C</text>
    <text id="hp-outdoor-label" x="500" y="32" text-anchor="middle" font-size="11" fill="#4a4a48" letter-spacing="0.08em">AUSSENLUFT</text>
    <text id="hp-outdoor-temp" x="500" y="58" text-anchor="middle" font-size="22" font-weight="500" fill="#e8e6e1">−2°C</text>

    <g id="hp-house" stroke="#4a4a48" fill="none">
      <polygon points="60,200 160,130 260,200" stroke-width="1.2" stroke-linejoin="round"/>
      <rect x="80" y="200" width="160" height="190" stroke-width="1.2"/>
      <rect x="100" y="220" width="40" height="40" fill="rgba(46,124,246,0.08)" stroke="#2e7cf6" stroke-width="0.8" stroke-opacity="0.4"/>
      <line x1="120" y1="220" x2="120" y2="260" stroke="#2e7cf6" stroke-width="0.5" stroke-opacity="0.4"/>
      <line x1="100" y1="240" x2="140" y2="240" stroke="#2e7cf6" stroke-width="0.5" stroke-opacity="0.4"/>
      <rect x="190" y="310" width="40" height="80" stroke-width="0.8" stroke="#4a4a48"/>
      <circle cx="222" cy="350" r="1.6" fill="#4a4a48" stroke="none"/>
      <g>
        <rect x="100" y="374" width="80" height="14" rx="3" stroke="#4a4a48" stroke-width="0.8" fill="rgba(255,255,255,0.02)"/>
        <line x1="108" y1="381" x2="172" y2="381" stroke="#4a4a48" stroke-width="0.5" stroke-dasharray="3 3" stroke-opacity="0.5"/>
      </g>
    </g>

    <g>
      <text id="hp-indoor-coil-name" x="60" y="436" text-anchor="middle" font-size="11" font-weight="500" fill="#e8e6e1">Innenwärmetauscher</text>
      <text id="hp-indoor-coil-sub-1" x="60" y="450" text-anchor="middle" font-size="9" fill="#7a7872">(gibt Wärme</text>
      <text id="hp-indoor-coil-sub-2" x="60" y="461" text-anchor="middle" font-size="9" fill="#7a7872">in den Raum ab)</text>
    </g>

    <g id="hp-outdoor-unit">
      <rect x="280" y="130" width="380" height="290" rx="14" fill="#1d1c1c" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <rect x="285" y="135" width="370" height="280" rx="12" fill="#18181b"/>
      <rect x="565" y="132" width="93" height="286" rx="14" fill="#1d1c1c" stroke="rgba(255,255,255,0.04)" stroke-width="0.8"/>
      <rect x="569" y="136" width="85" height="278" rx="12" fill="#141416"/>

      <g opacity="0.4" stroke="none">
        <rect x="422" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="433" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="444" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="455" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="466" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="477" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="488" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="499" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="510" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="521" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="532" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="543" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
        <rect x="554" y="148" width="2.5" height="250" rx="1" fill="#1d1c1c"/>
      </g>

      <line x1="415" y1="145" x2="415" y2="408" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="563" y1="145" x2="563" y2="408" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>

      <text id="hp-outdoor-name" x="470" y="118" text-anchor="middle" font-size="11" font-weight="500" fill="#e8e6e1" letter-spacing="0.04em">SOLECO Wärmepumpe</text>

      <g id="hp-led-wide" filter="url(#${fWide})" opacity="0.55" color="#e8920c">
        <use href="#${sym}" x="596" y="155" width="28" height="30" fill="currentColor"/>
      </g>
      <g id="hp-led-tight" filter="url(#${fTight})" opacity="0.85" color="#e8920c">
        <use href="#${sym}" x="596" y="155" width="28" height="30" fill="currentColor"/>
      </g>
      <g id="hp-led-main" color="#e8920c">
        <use href="#${sym}" x="596" y="155" width="28" height="30" fill="currentColor"/>
      </g>

      <g id="hp-expansion" class="hp-component">
        <rect class="hp-pulse" x="296" y="195" width="88" height="52" rx="8" fill="none" stroke="#e8920c" stroke-width="1.5"/>
        <rect x="300" y="199" width="80" height="44" rx="6" fill="#0c0c0e" stroke="#4a4a48" stroke-width="0.8"/>
        <polygon points="334,212 346,212 340,224" fill="none" stroke="#4a4a48" stroke-width="0.8"/>
        <polygon points="334,236 346,236 340,224" fill="none" stroke="#4a4a48" stroke-width="0.8"/>
        <text id="hp-expansion-name" x="340" y="262" text-anchor="middle" font-size="10" font-weight="500" fill="#e8e6e1">Expansionsventil</text>
        <text id="hp-expansion-sub" x="340" y="275" text-anchor="middle" font-size="8.5" fill="#7a7872">(senkt den Druck)</text>
      </g>

      <circle cx="490" cy="275" r="52" fill="none" stroke="#4a4a48" stroke-width="0.8"/>
      <g id="hp-fan-blades" transform="translate(490 275)">
        <path d="M 0 -44 Q 11 -22 0 0 Q -11 -22 0 -44 Z" fill="rgba(140,138,135,0.3)"/>
        <path d="M 0 -44 Q 11 -22 0 0 Q -11 -22 0 -44 Z" fill="rgba(140,138,135,0.3)" transform="rotate(120)"/>
        <path d="M 0 -44 Q 11 -22 0 0 Q -11 -22 0 -44 Z" fill="rgba(140,138,135,0.3)" transform="rotate(240)"/>
        <circle r="5" fill="#4a4a48"/>
      </g>
      <text id="hp-outdoor-coil-name" x="490" y="345" text-anchor="middle" font-size="10" font-weight="500" fill="#e8e6e1">Aussenwärmetauscher</text>
      <text id="hp-outdoor-coil-sub" x="490" y="358" text-anchor="middle" font-size="8.5" fill="#7a7872">(holt Wärme aus der Aussenluft)</text>

      <g id="hp-compressor" class="hp-component">
        <rect class="hp-pulse hp-pulse--delayed" x="296" y="318" width="88" height="58" rx="8" fill="none" stroke="#e8920c" stroke-width="1.5"/>
        <rect x="300" y="322" width="80" height="50" rx="6" fill="#0c0c0e" stroke="#4a4a48" stroke-width="0.8"/>
        <circle cx="340" cy="347" r="13" fill="none" stroke="#4a4a48" stroke-width="0.8"/>
        <circle id="hp-comp-piston" cx="340" cy="347" r="5" fill="#4a4a48"/>
        <text id="hp-compressor-name" x="340" y="389" text-anchor="middle" font-size="10" font-weight="500" fill="#e8e6e1">Kompressor</text>
        <text id="hp-compressor-sub" x="340" y="402" text-anchor="middle" font-size="8.5" fill="#7a7872">(erhöht den Druck)</text>
      </g>

      <rect x="310" y="420" width="55" height="6" rx="2" fill="#1d1c1c"/>
      <rect x="590" y="420" width="55" height="6" rx="2" fill="#1d1c1c"/>
    </g>

    <path id="hp-loop"
      d="M 180 381
         L 220 381
         L 220 221
         L 300 221
         M 380 221
         L 490 221
         L 490 252
         M 490 298
         L 490 347
         L 380 347
         M 300 347
         L 290 347
         L 290 440
         L 100 440
         L 100 381"
      fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linejoin="round"/>

    <path id="hp-loop-master"
      d="M 180 381 L 220 381 L 220 221 L 300 221 L 340 221 L 380 221 L 490 221 L 490 275 L 490 347 L 380 347 L 340 347 L 300 347 L 290 347 L 290 440 L 100 440 L 100 381 Z"
      fill="none" stroke="none"/>

    <g id="hp-airflow-particles" opacity="0.6"></g>
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
  const airLayer = svg.querySelector<SVGGElement>('#hp-airflow-particles')!;
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
    indoor: { x: 96, y: 372, w: 88, h: 18 },
    expansion: { x: 300, y: 199, w: 80, h: 44 },
    outdoor: { x: 438, y: 240, w: 104, h: 70 },
    compressor: { x: 300, y: 322, w: 80, h: 50 },
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

  // Airflow wisps — Energie-style sinusoidal paths blowing rightward from
  // the grill exit. Each wisp has a main stroke and a wider soft glow.
  const N_AIR = 5;
  const airWisps: {
    el: SVGPathElement;
    glowEl: SVGPathElement;
    baseY: number;
    freq: number;
    amp: number;
    phaseOff: number;
  }[] = [];
  for (let i = 0; i < N_AIR; i++) {
    const glow = document.createElementNS(SVG_NS, 'path');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', 'rgba(160,200,235,0.03)');
    glow.setAttribute('stroke-width', '5');
    glow.setAttribute('stroke-linecap', 'round');
    glow.setAttribute('stroke-linejoin', 'round');
    airLayer.appendChild(glow);

    const wisp = document.createElementNS(SVG_NS, 'path');
    wisp.setAttribute('fill', 'none');
    wisp.setAttribute('stroke', 'rgba(180,215,245,0.12)');
    wisp.setAttribute('stroke-width', '1.3');
    wisp.setAttribute('stroke-linecap', 'round');
    wisp.setAttribute('stroke-linejoin', 'round');
    airLayer.appendChild(wisp);

    airWisps.push({
      el: wisp,
      glowEl: glow,
      baseY: 185 + (i / (N_AIR - 1)) * 180,
      freq: 0.008 + i * 0.002,
      amp: 5 + i * 2.5,
      phaseOff: i * 1.7,
    });
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
    fanBlades.setAttribute('transform', `translate(490 275) rotate(${rot})`);
  }

  function updateHeat(dt: number): void {
    const showHeat = getState().innenShowHeat !== false;
    if (!showHeat) {
      heatDots.forEach((d) => d.el.setAttribute('opacity', '0'));
      return;
    }
    const src =
      mode === 'heizen'
        ? { from: { x: 660, y: 230, jitter: 30 }, to: { x: 490, y: 275 } }
        : { from: { x: 140, y: 240, jitter: 40 }, to: { x: 140, y: 381 } };
    const snk =
      mode === 'heizen'
        ? { from: { x: 140, y: 381, jitter: 0 }, to: { x: 160, y: 220, jitter: 40 } }
        : { from: { x: 490, y: 275, jitter: 0 }, to: { x: 660, y: 230, jitter: 30 } };

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

  function updateAirflow(): void {
    // Sinusoidal wisps emanating from grill exit (x=562) toward right edge
    // of the wider viewBox (x=850), diverging from fan-center as they travel.
    const GRILL_EXIT = 562;
    const END_X = 850;
    const FAN_CY = 275;
    const SEGS = 28;
    const now = performance.now();

    airWisps.forEach((w, i) => {
      const wispAlpha = 0.1 + 0.05 * Math.sin(now * 0.0008 + i);
      const glowAlpha = wispAlpha * 0.25;
      const lw = 1.2 + Math.sin(now * 0.001 + i) * 0.3;

      let d = '';
      for (let s = 0; s <= SEGS; s++) {
        const frac = s / SEGS;
        const x = GRILL_EXIT + (END_X - GRILL_EXIT) * frac;
        const diverge = frac * frac;
        const yBase = FAN_CY + (w.baseY - FAN_CY) * (0.3 + 0.7 * diverge);
        const wave =
          Math.sin(-now * w.freq + frac * 10 + w.phaseOff) * w.amp * (0.3 + diverge * 0.7);
        const y = yBase + wave;
        d += (s === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
      }

      w.el.setAttribute('d', d);
      w.el.setAttribute('stroke', `rgba(180,215,245,${wispAlpha.toFixed(3)})`);
      w.el.setAttribute('stroke-width', lw.toFixed(1));

      w.glowEl.setAttribute('d', d);
      w.glowEl.setAttribute('stroke', `rgba(160,200,235,${glowAlpha.toFixed(3)})`);
    });
  }

  function frame(ts: number): void {
    const dt = Math.min(50, ts - lastTs);
    lastTs = ts;
    updateParticles(dt);
    updateHeat(dt);
    updateAirflow();
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
