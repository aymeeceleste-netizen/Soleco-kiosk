import heatpumpUrl from '../assets/soleco-heatpump.png';
import {
  COP_BY_TEMP_COOL,
  COP_BY_TEMP_HEAT,
  TEMP_STOPS_COOL,
  TEMP_STOPS_HEAT,
  type CopRow,
} from '../data';
import { Hexagon } from '../hexagon';
import { t } from '../i18n';
import type { EnergieMode, KioskState } from '../state';
import { store } from '../state';
import type { ModeView } from './_types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HOUSE_FAN_LINES = 6;

/**
 * Hero is a single SVG canvas (viewBox 1200×500, preserveAspectRatio="none")
 * stretched to fill the hero. Coordinates inside the viewBox map 1:1 to
 * percentages of the hero, which lets us place HTML elements (photo, labels,
 * house) at exact percentages and have SVG line endpoints land on them.
 *
 * Photo lives at left 50% / top 50% / width 26% / aspect 1461:822.
 *   → photo edges: x=37%..63% of hero, i.e. viewBox x=444..756
 *   → photo y center: 50% of hero, i.e. viewBox y=250
 * Electricity line ends at the photo's left edge (444, 250).
 * Fan lines start at the photo's right edge (756, 250) and converge into
 * the house body at viewBox x=1050..1110.
 */
const VB_W = 1200;
const VB_H = 500;
const PHOTO_LEFT_VB = 444;
const PHOTO_RIGHT_VB = 756;
const MID_Y_VB = 250;
const HOUSE_LEFT_VB = 1050;
const HOUSE_RIGHT_VB = 1112;
const HOUSE_TOP_VB = 200;
const HOUSE_BOT_VB = 320;

const stopsFor = (em: EnergieMode): number[] =>
  em === 'kuehlen' ? TEMP_STOPS_COOL : TEMP_STOPS_HEAT;
const tempFor = (s: KioskState): number =>
  s.energieMode === 'kuehlen' ? s.coolTempC : s.heatTempC;

export function mountEnergie(): ModeView {
  const hero = buildHero();
  const captionEl = document.createElement('div');
  captionEl.className = 'mode-caption';
  const controlEl = buildControl();

  const render = (s: KioskState): void => {
    const row = pickRow(tempFor(s), s.energieMode);
    const dict = t(s.lang);

    hero.update(s, row);
    captionEl.textContent =
      s.energieMode === 'kuehlen' ? dict.energie.captionCool : dict.energie.caption;
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
   Hero — single SVG canvas + overlaid photo, hex, labels, house
   ============================================================ */
function buildHero() {
  const el = document.createElement('div');
  el.className = 'energie-hero';

  // ---- SVG canvas (electricity line + fan curves)
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('energie-canvas');
  svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  // Electricity line (left → photo)
  const elecGroup = document.createElementNS(SVG_NS, 'g');
  elecGroup.setAttribute('class', 'energie-line-in');
  elecGroup.innerHTML = `
    <path d="M 130 ${MID_Y_VB} L ${PHOTO_LEFT_VB} ${MID_Y_VB}"
          fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M ${PHOTO_LEFT_VB - 12} ${MID_Y_VB - 7}
             L ${PHOTO_LEFT_VB} ${MID_Y_VB}
             L ${PHOTO_LEFT_VB - 12} ${MID_Y_VB + 7}"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;
  svg.appendChild(elecGroup);

  // Fan lines (photo → house)
  const fanGroup = document.createElementNS(SVG_NS, 'g');
  fanGroup.setAttribute('class', 'energie-fan-lines');
  const fanLines: SVGPathElement[] = [];
  for (let i = 0; i < HOUSE_FAN_LINES; i++) {
    const t = i / Math.max(1, HOUSE_FAN_LINES - 1);
    const yEnd = HOUSE_TOP_VB + 18 + t * (HOUSE_BOT_VB - HOUSE_TOP_VB - 36);
    const yCtrl = (MID_Y_VB + yEnd) / 2 + (t - 0.5) * 28;
    const xMid = (PHOTO_RIGHT_VB + HOUSE_LEFT_VB) / 2;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute(
      'd',
      `M ${PHOTO_RIGHT_VB} ${MID_Y_VB} Q ${xMid} ${yCtrl} ${HOUSE_LEFT_VB} ${yEnd}`,
    );
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    fanGroup.appendChild(path);
    fanLines.push(path);
  }
  svg.appendChild(fanGroup);

  // House silhouette in the same SVG so it lands exactly where fan lines end
  const house = document.createElementNS(SVG_NS, 'g');
  house.setAttribute('class', 'energie-house');
  house.innerHTML = `
    <path d="M ${HOUSE_LEFT_VB} ${HOUSE_TOP_VB + 30}
             L ${(HOUSE_LEFT_VB + HOUSE_RIGHT_VB) / 2} ${HOUSE_TOP_VB}
             L ${HOUSE_RIGHT_VB} ${HOUSE_TOP_VB + 30}
             L ${HOUSE_RIGHT_VB} ${HOUSE_BOT_VB}
             L ${HOUSE_LEFT_VB} ${HOUSE_BOT_VB} Z"
          fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.5)"
          stroke-width="1.6" stroke-linejoin="round"
          vector-effect="non-scaling-stroke"/>
    <rect x="${HOUSE_LEFT_VB + 22}" y="${HOUSE_TOP_VB + 50}"
          width="18" height="${HOUSE_BOT_VB - HOUSE_TOP_VB - 50}"
          fill="rgba(246,160,0,0.18)" stroke="rgba(246,160,0,0.6)"
          stroke-width="1" vector-effect="non-scaling-stroke"/>
  `;
  svg.appendChild(house);

  el.appendChild(svg);

  // ---- Photo + hexagon overlay (absolute, dead-center)
  const stage = document.createElement('div');
  stage.className = 'energie-stage';
  const photo = document.createElement('img');
  photo.src = heatpumpUrl;
  photo.alt = '';
  photo.className = 'energie-photo';
  const hex = new Hexagon();
  hex.el.classList.add('energie-hex');
  stage.append(photo, hex.el);
  el.appendChild(stage);

  // ---- "1 kWh Strom" label sitting just above the electricity line
  const inLabel = document.createElement('div');
  inLabel.className = 'energie-label energie-label--in';
  inLabel.innerHTML = `<span class="num">1</span><span class="unit"></span>`;
  const inUnitEl = inLabel.querySelector('.unit') as HTMLSpanElement;
  el.appendChild(inLabel);

  // ---- "5.01 kWh Wärme" label sitting above the house
  const outLabel = document.createElement('div');
  outLabel.className = 'energie-label energie-label--out';
  outLabel.innerHTML = `<span class="num"></span><span class="unit"></span>`;
  const outNumEl = outLabel.querySelector('.num') as HTMLSpanElement;
  const outUnitEl = outLabel.querySelector('.unit') as HTMLSpanElement;
  el.appendChild(outLabel);

  // ---- "+ N kWh aus der Luft (gratis)" below the photo
  const fromAir = document.createElement('div');
  fromAir.className = 'energie-from-air';
  fromAir.innerHTML = `<span class="plus">+</span> <span class="num"></span> <span class="desc"></span>`;
  const fromAirNumEl = fromAir.querySelector('.num') as HTMLSpanElement;
  const fromAirDescEl = fromAir.querySelector('.desc') as HTMLSpanElement;
  el.appendChild(fromAir);

  return {
    el,
    update(s: KioskState, row: CopRow) {
      const dict = t(s.lang);
      const cop = row.cop;
      const arrows = row.arrows;
      const fromAirN = Math.max(0, cop - 1);

      el.dataset.mode = s.energieMode;
      hex.setState(s.energieMode === 'kuehlen' ? 'cool' : 'heat');

      inUnitEl.textContent = s.lang === 'de' ? 'kWh Strom' : 'kWh electricity';
      outNumEl.textContent = formatNum(cop);
      outUnitEl.textContent =
        s.energieMode === 'kuehlen' ? dict.energie.coolOut : dict.energie.heatOut;

      fromAirNumEl.textContent = `${formatNum(fromAirN)} kWh`;
      fromAirDescEl.textContent = dict.energie.fromAir;

      // Light up `arrows` fan lines, fractional COP fades the next one
      const lit = Math.min(arrows, HOUSE_FAN_LINES);
      const fractional = cop - Math.floor(cop);
      fanLines.forEach((p, idx) => {
        if (idx < lit) p.style.opacity = '1';
        else if (idx === lit && fractional > 0.05)
          p.style.opacity = String(0.25 + fractional * 0.5);
        else p.style.opacity = '0.08';
      });
    },
  };
}

/* ============================================================
   Control — Heizen/Kühlen toggle + temperature slider w/ detents
   ============================================================ */
function buildControl() {
  const el = document.createElement('div');
  el.className = 'mode-control energie-control';

  const toggle = document.createElement('div');
  toggle.className = 'pill-toggle';
  toggle.setAttribute('role', 'group');

  const heizenBtn = document.createElement('button');
  heizenBtn.type = 'button';
  heizenBtn.className = 'pill-toggle__btn';
  heizenBtn.dataset.value = 'heizen';
  heizenBtn.addEventListener('click', () =>
    store.set({ energieMode: 'heizen', hpState: 'heat' }),
  );

  const kuehlenBtn = document.createElement('button');
  kuehlenBtn.type = 'button';
  kuehlenBtn.className = 'pill-toggle__btn';
  kuehlenBtn.dataset.value = 'kuehlen';
  kuehlenBtn.addEventListener('click', () =>
    store.set({ energieMode: 'kuehlen', hpState: 'cool' }),
  );

  toggle.append(heizenBtn, kuehlenBtn);

  const sliderWrap = document.createElement('div');
  sliderWrap.className = 'slider-wrap';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.step = '1';
  slider.className = 'slider';
  slider.addEventListener('input', () => {
    const idx = Number(slider.value);
    const em = store.get().energieMode;
    const stops = stopsFor(em);
    const tC = stops[idx];
    if (tC === undefined) return;
    store.set(em === 'kuehlen' ? { coolTempC: tC } : { heatTempC: tC });
  });

  const ticks = document.createElement('div');
  ticks.className = 'slider-ticks';
  let tickEls: HTMLSpanElement[] = [];
  let lastStops: number[] = [];

  const buildTicks = (stops: number[]): void => {
    if (sameArr(stops, lastStops)) return;
    ticks.innerHTML = '';
    tickEls = stops.map((tC) => {
      const span = document.createElement('span');
      span.className = 'slider-tick';
      span.textContent = `${tC > 0 ? '+' : ''}${tC} °C`;
      span.addEventListener('click', () => {
        const em = store.get().energieMode;
        store.set(em === 'kuehlen' ? { coolTempC: tC } : { heatTempC: tC });
      });
      ticks.appendChild(span);
      return span;
    });
    lastStops = stops;
  };

  sliderWrap.append(slider, ticks);
  el.append(toggle, sliderWrap);

  return {
    el,
    update(s: KioskState) {
      const dict = t(s.lang);
      heizenBtn.textContent = dict.energie.heizen;
      kuehlenBtn.textContent = dict.energie.kuehlen;
      heizenBtn.setAttribute('aria-pressed', String(s.energieMode === 'heizen'));
      kuehlenBtn.setAttribute('aria-pressed', String(s.energieMode === 'kuehlen'));

      const stops = stopsFor(s.energieMode);
      slider.max = String(stops.length - 1);
      buildTicks(stops);

      const activeTemp = tempFor(s);
      const idx = stops.indexOf(activeTemp);
      if (idx >= 0) slider.value = String(idx);

      tickEls.forEach((tickEl, i) => {
        tickEl.classList.toggle('is-active', i === idx);
      });
    },
  };
}

/* ============================================================
   Helpers
   ============================================================ */
function pickRow(tempC: number, mode: EnergieMode): CopRow {
  const table = mode === 'kuehlen' ? COP_BY_TEMP_COOL : COP_BY_TEMP_HEAT;
  const row = table.find((r) => r.temp === tempC);
  if (row) return row;
  const fallback = table[0];
  if (!fallback) throw new Error('empty COP table');
  return fallback;
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toFixed(0);
  return n.toFixed(2);
}

function sameArr(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
