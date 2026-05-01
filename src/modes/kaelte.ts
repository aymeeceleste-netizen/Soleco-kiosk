import heatpumpUrl from '../assets/soleco-heatpump.png';
import {
  COP_BY_TEMP_KAELTE,
  TEMP_STOPS_KAELTE,
  heatPerChf,
  type KaelteRow,
} from '../data';
import { t } from '../i18n';
import type { KioskState } from '../state';
import { store } from '../state';
import type { ModeView } from './_types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FROST_MIN = -25;
const FROST_MAX = 12;
const SNOWFLAKES = 14;

export function mountKaelte(): ModeView {
  // Cooling mode is irrelevant here; if user came from Energie/Kühlen, reset.
  if (store.get().energieMode === 'kuehlen') {
    store.set({ energieMode: 'heizen', hpState: 'heat' });
  }

  const hero = buildHero();
  const captionEl = document.createElement('div');
  captionEl.className = 'mode-caption';
  const controlEl = buildControl();

  const render = (s: KioskState): void => {
    const dict = t(s.lang);
    captionEl.textContent = dict.kaelte.caption;
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
   Hero — frost overlay, snowflakes, photo (top-left), bar chart
   ============================================================ */
function buildHero() {
  const el = document.createElement('div');
  el.className = 'kaelte-hero';

  // Frost overlay (CSS gradient, opacity tied to slider value)
  const frost = document.createElement('div');
  frost.className = 'kaelte-frost';
  el.appendChild(frost);

  // Snowflakes
  const snow = document.createElement('div');
  snow.className = 'kaelte-snow';
  for (let i = 0; i < SNOWFLAKES; i++) {
    const flake = document.createElement('span');
    flake.className = 'kaelte-flake';
    const left = Math.random() * 100;
    const delay = Math.random() * 8;
    const dur = 6 + Math.random() * 6;
    const size = 4 + Math.random() * 8;
    flake.style.left = `${left}%`;
    flake.style.animationDelay = `-${delay}s`;
    flake.style.animationDuration = `${dur}s`;
    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;
    snow.appendChild(flake);
  }
  el.appendChild(snow);

  // Photo at top-left
  const photoCorner = document.createElement('div');
  photoCorner.className = 'kaelte-photo-corner';

  const photo = document.createElement('img');
  photo.src = heatpumpUrl;
  photo.alt = '';
  photo.className = 'kaelte-photo';
  photoCorner.appendChild(photo);

  const pill = document.createElement('div');
  pill.className = 'kaelte-pill';
  pill.innerHTML = `<span class="kaelte-pill__dot"></span><span class="kaelte-pill__text"></span>`;
  const pillTextEl = pill.querySelector('.kaelte-pill__text') as HTMLSpanElement;
  photoCorner.appendChild(pill);

  el.appendChild(photoCorner);

  // Bar chart on the right
  const chart = document.createElement('div');
  chart.className = 'kaelte-chart';
  const title = document.createElement('div');
  title.className = 'kaelte-chart__title';
  chart.appendChild(title);

  const bars = document.createElement('div');
  bars.className = 'kaelte-bars';
  const barRefs = (['hp', 'oil', 'electric'] as const).map((kind) => {
    const row = document.createElement('div');
    row.className = `kaelte-bar kaelte-bar--${kind}`;
    const labelEl = document.createElement('div');
    labelEl.className = 'kaelte-bar__label';
    const trackEl = document.createElement('div');
    trackEl.className = 'kaelte-bar__track';
    const fillEl = document.createElement('div');
    fillEl.className = 'kaelte-bar__fill';
    const valueEl = document.createElement('div');
    valueEl.className = 'kaelte-bar__value';
    trackEl.appendChild(fillEl);
    row.append(labelEl, trackEl, valueEl);
    bars.appendChild(row);
    return { kind, labelEl, fillEl, valueEl };
  });
  chart.appendChild(bars);

  const objection = document.createElement('div');
  objection.className = 'kaelte-objection';
  chart.appendChild(objection);

  el.appendChild(chart);

  return {
    el,
    update(s: KioskState) {
      const dict = t(s.lang);
      const row = pickKaelte(s.kaelteTempC);
      const tnorm = clamp01((s.kaelteTempC - FROST_MIN) / (FROST_MAX - FROST_MIN));
      // tnorm 1 (warm) → frost opacity 0; tnorm 0 (cold) → frost opacity 0.85
      const frostOpacity = (1 - tnorm) * 0.85;
      el.style.setProperty('--frost-opacity', String(frostOpacity));
      el.style.setProperty('--snow-opacity', String((1 - tnorm) * 0.9));

      pillTextEl.textContent = dict.kaelte.statusPill(row.cop.toFixed(2));

      title.textContent = dict.kaelte.chartTitle;
      objection.textContent = dict.kaelte.objectionKill;

      const heat = heatPerChf(s.kaelteTempC);
      const max = Math.max(heat.hp, heat.oil, heat.electric, 1);
      const labels: Record<'hp' | 'oil' | 'electric', string> = {
        hp: dict.kaelte.barHp,
        oil: dict.kaelte.barOil,
        electric: dict.kaelte.barElectric,
      };
      barRefs.forEach((b) => {
        const v = heat[b.kind];
        b.labelEl.textContent = labels[b.kind];
        b.valueEl.textContent = `${v.toFixed(1)} kWh / CHF`;
        b.fillEl.style.width = `${(v / max) * 100}%`;
      });
    },
  };
}

/* ============================================================
   Control — temp slider with ticks
   ============================================================ */
function buildControl() {
  const el = document.createElement('div');
  el.className = 'mode-control kaelte-control';

  const wrap = document.createElement('div');
  wrap.className = 'slider-wrap kaelte-slider-wrap';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = String(TEMP_STOPS_KAELTE.length - 1);
  slider.step = '1';
  slider.className = 'slider';
  slider.addEventListener('input', () => {
    const idx = Number(slider.value);
    const tC = TEMP_STOPS_KAELTE[idx];
    if (tC !== undefined) store.set({ kaelteTempC: tC });
  });

  const ticks = document.createElement('div');
  ticks.className = 'slider-ticks';
  const tickEls: HTMLSpanElement[] = TEMP_STOPS_KAELTE.map((tC) => {
    const span = document.createElement('span');
    span.className = 'slider-tick';
    span.textContent = `${tC > 0 ? '+' : ''}${tC} °C`;
    span.addEventListener('click', () => store.set({ kaelteTempC: tC }));
    ticks.appendChild(span);
    return span;
  });

  wrap.append(slider, ticks);
  el.appendChild(wrap);

  return {
    el,
    update(s: KioskState) {
      const idx = TEMP_STOPS_KAELTE.indexOf(s.kaelteTempC);
      if (idx >= 0) slider.value = String(idx);
      tickEls.forEach((t, i) => t.classList.toggle('is-active', i === idx));
    },
  };
}

function pickKaelte(tC: number): KaelteRow {
  return COP_BY_TEMP_KAELTE.find((r) => r.temp === tC) ?? COP_BY_TEMP_KAELTE[0]!;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

void SVG_NS;
