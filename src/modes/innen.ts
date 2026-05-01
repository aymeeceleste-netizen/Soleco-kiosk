import heatpumpUrl from '../assets/soleco-heatpump.png';
import { INNEN_STEPS } from '../data';
import { t } from '../i18n';
import type { InnenStep, KioskState } from '../state';
import { store } from '../state';
import type { ModeView } from './_types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VB_W = 1200;
const VB_H = 400;
const STOP_Y = 160;
const STOPS_X: Record<InnenStep, number> = { 1: 180, 2: 460, 3: 740, 4: 1020 };
const STOP_R = 28;

/**
 * Closed-loop path: 4 stops on top, loop-back curve on the bottom.
 * Used both as the visible cycle path and as the offset-path for the
 * traveling particle.
 */
const LOOP_PATH = (() => {
  const x1 = STOPS_X[1];
  const x4 = STOPS_X[4];
  return `M ${x1} ${STOP_Y} H ${x4} C ${x4 + 90} ${STOP_Y} ${x4 + 90} 300 ${x4} 300 H ${x1} C ${x1 - 90} 300 ${x1 - 90} ${STOP_Y} ${x1} ${STOP_Y} Z`;
})();

export function mountInnen(): ModeView {
  const hero = buildHero();
  const captionEl = document.createElement('div');
  captionEl.className = 'mode-caption';
  const controlEl = buildControl();

  const render = (s: KioskState): void => {
    const dict = t(s.lang);
    captionEl.textContent = s.innenPumpOpen
      ? dict.innen.captionPump
      : dict.innen.stops[s.innenStep].desc;
    hero.update(s);
    controlEl.update(s);
  };

  const unsub = store.subscribe(render);
  render(store.get());

  return {
    hero: hero.el,
    caption: captionEl,
    control: controlEl.el,
    destroy() {
      unsub();
    },
  };
}

/* ============================================================
   Hero — photo (faded) + closed loop + 4 stops + traveling particle
   ============================================================ */
function buildHero() {
  const el = document.createElement('div');
  el.className = 'innen-hero';

  // Faded photo
  const photo = document.createElement('img');
  photo.src = heatpumpUrl;
  photo.alt = '';
  photo.className = 'innen-photo';
  el.appendChild(photo);

  // SVG canvas with the loop + stops + particle
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'innen-canvas');
  svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  const loopPath = document.createElementNS(SVG_NS, 'path');
  loopPath.setAttribute('class', 'innen-loop');
  loopPath.setAttribute('d', LOOP_PATH);
  loopPath.setAttribute('fill', 'none');
  loopPath.setAttribute('stroke', 'rgba(255,255,255,0.2)');
  loopPath.setAttribute('stroke-width', '2');
  loopPath.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(loopPath);

  // Stops as <g> with circle + number + name (placed absolutely as HTML for nicer typography)
  const stopGroups: Record<InnenStep, SVGGElement> = {} as Record<InnenStep, SVGGElement>;
  INNEN_STEPS.forEach((step) => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', `innen-stop innen-stop--${step}`);
    g.setAttribute('transform', `translate(${STOPS_X[step]} ${STOP_Y})`);
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => {
      if (step === 3) {
        store.set({ innenStep: step, innenPumpOpen: !store.get().innenPumpOpen });
      } else {
        store.set({ innenStep: step, innenPumpOpen: false });
      }
    });
    g.innerHTML = `
      <circle r="${STOP_R}" fill="rgba(26,22,20,0.9)" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <text x="0" y="0" dy="0.36em" text-anchor="middle"
            font-family="Inter, sans-serif" font-size="22" font-weight="500" fill="currentColor">${step}</text>
    `;
    svg.appendChild(g);
    stopGroups[step] = g;
  });

  el.appendChild(svg);

  // Stop labels (HTML for nice typography) — positioned absolutely
  const stopLabels: Record<InnenStep, HTMLDivElement> = {} as Record<InnenStep, HTMLDivElement>;
  INNEN_STEPS.forEach((step) => {
    const lbl = document.createElement('div');
    lbl.className = `innen-stop-label innen-stop-label--${step}`;
    lbl.style.left = `${(STOPS_X[step] / VB_W) * 100}%`;
    lbl.style.top = `${((STOP_Y - STOP_R - 28) / VB_H) * 100}%`;
    el.appendChild(lbl);
    stopLabels[step] = lbl;
  });

  // Traveling particle — uses CSS offset-path tied to the same loop coordinates
  const particle = document.createElement('div');
  particle.className = 'innen-particle';
  el.appendChild(particle);

  // Bicycle-pump animation overlay (next to Kompressor)
  const pump = buildPump();
  pump.el.style.left = `${(STOPS_X[3] / VB_W) * 100}%`;
  pump.el.style.top = `${((STOP_Y + STOP_R + 24) / VB_H) * 100}%`;
  el.appendChild(pump.el);

  return {
    el,
    update(s: KioskState) {
      const dict = t(s.lang);
      el.dataset.mode = s.energieMode;
      el.dataset.pumpOpen = String(s.innenPumpOpen);

      INNEN_STEPS.forEach((step) => {
        const isActive = step === s.innenStep;
        stopGroups[step].dataset.active = String(isActive);
        const lbl = stopLabels[step];
        const stop = dict.innen.stops[step];
        lbl.textContent = stop.name;
        lbl.dataset.active = String(isActive);
      });

      pump.setOpen(s.innenPumpOpen);
    },
  };
}

function buildPump() {
  const el = document.createElement('div');
  el.className = 'innen-pump';
  el.innerHTML = `
    <svg viewBox="0 0 80 140" xmlns="${SVG_NS}">
      <!-- heat lines rising from cylinder top -->
      <g class="innen-pump__heat" stroke="#f6a000" stroke-width="2" stroke-linecap="round" fill="none">
        <path d="M 22 36 Q 18 26 22 16" />
        <path d="M 40 32 Q 36 22 40 12" />
        <path d="M 58 36 Q 62 26 58 16" />
      </g>
      <!-- piston rod (animates up-down) -->
      <g class="innen-pump__piston">
        <rect x="38" y="0" width="4" height="58" fill="rgba(255,255,255,0.7)"/>
        <rect x="22" y="0" width="36" height="6" fill="rgba(255,255,255,0.85)" rx="1"/>
      </g>
      <!-- cylinder -->
      <rect x="22" y="56" width="36" height="80" fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/>
    </svg>
  `;

  return {
    el,
    setOpen(open: boolean) {
      el.classList.toggle('innen-pump--open', open);
    },
  };
}

/* ============================================================
   Control — 4 step pills
   ============================================================ */
function buildControl() {
  const el = document.createElement('div');
  el.className = 'mode-control innen-control';

  const pills = document.createElement('div');
  pills.className = 'innen-pills';

  type Refs = { btn: HTMLButtonElement };
  const refs: Record<InnenStep, Refs> = {} as Record<InnenStep, Refs>;
  INNEN_STEPS.forEach((step) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'innen-pill';
    btn.dataset.step = String(step);
    btn.addEventListener('click', () => {
      if (step === 3) {
        store.set({ innenStep: step, innenPumpOpen: !store.get().innenPumpOpen });
      } else {
        store.set({ innenStep: step, innenPumpOpen: false });
      }
    });
    pills.appendChild(btn);
    refs[step] = { btn };
  });

  el.appendChild(pills);

  return {
    el,
    update(s: KioskState) {
      const dict = t(s.lang);
      INNEN_STEPS.forEach((step) => {
        const r = refs[step];
        if (!r) return;
        const stop = dict.innen.stops[step];
        r.btn.innerHTML = `<span class="innen-pill__num">${step}</span><span>${stop.name}</span>`;
        r.btn.setAttribute('aria-pressed', String(step === s.innenStep));
      });
    },
  };
}

export const INNEN_LOOP_PATH = LOOP_PATH;
