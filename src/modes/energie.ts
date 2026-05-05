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
 * cloud silhouette text, electricity bolt) at exact percentages and have SVG
 * line endpoints land on them.
 *
 * Layout (both modes):
 *   [cloud (outside-air)]  ⇄ flow ⇄  [unit photo]  ⇄ flow ⇄  [house]
 *                                  ↑
 *                          ⚡ 1 kWh Strom (separate input)
 *
 * Heating (Heizen): cloud → unit → house (heat moves into the house).
 * Cooling (Kühlen): cloud ← unit ← house (heat moves out of the house).
 * Electricity is a separate input feeding the unit in both modes.
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
// Cloud silhouette (outside-air representation)
const CLOUD_CENTER_X_VB = 110;
const CLOUD_RIGHT_VB = 152;
const CLOUD_TOP_VB = 215;
const CLOUD_BOT_VB = 285;
// Electricity connector — bolt sits above unit, dashed line drops onto photo top
const BOLT_CONN_X_VB = 600;
const BOLT_CONN_Y1_VB = 100;
const BOLT_CONN_Y2_VB = 168;

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
   Hero — outside-air, unit, house, separate electricity input
   ============================================================ */
function buildHero() {
  const el = document.createElement('div');
  el.className = 'energie-hero';

  // ---- SVG canvas
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('energie-canvas');
  svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  // Two arrow markers — one per mode color (avoids context-stroke compat issues)
  const defs = document.createElementNS(SVG_NS, 'defs');
  defs.innerHTML = `
    <marker id="ene-arrow-heat" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 Z" fill="#f6a000"/>
    </marker>
    <marker id="ene-arrow-cool" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 Z" fill="#2e7cf6"/>
    </marker>
  `;
  svg.appendChild(defs);

  // Cloud silhouette (left side, outside-air representation)
  const cloud = document.createElementNS(SVG_NS, 'g');
  cloud.setAttribute('class', 'energie-cloud');
  cloud.innerHTML = `
    <ellipse cx="${CLOUD_CENTER_X_VB}" cy="${MID_Y_VB}" rx="42" ry="22"
             fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.5)"
             stroke-width="1.6" vector-effect="non-scaling-stroke"/>
    <ellipse cx="${CLOUD_CENTER_X_VB - 18}" cy="${MID_Y_VB - 10}" rx="20" ry="16"
             fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.5)"
             stroke-width="1.6" vector-effect="non-scaling-stroke"/>
    <ellipse cx="${CLOUD_CENTER_X_VB + 16}" cy="${MID_Y_VB - 8}" rx="22" ry="16"
             fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.5)"
             stroke-width="1.6" vector-effect="non-scaling-stroke"/>
  `;
  svg.appendChild(cloud);

  // Left fan (cloud ↔ unit) — direction set per mode
  const leftFanGroup = document.createElementNS(SVG_NS, 'g');
  leftFanGroup.setAttribute('class', 'energie-fan-lines energie-fan-lines--left');
  const leftFanLines: SVGPathElement[] = [];
  for (let i = 0; i < HOUSE_FAN_LINES; i++) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    leftFanGroup.appendChild(path);
    leftFanLines.push(path);
  }
  svg.appendChild(leftFanGroup);

  // Right fan (unit ↔ house) — direction set per mode
  const rightFanGroup = document.createElementNS(SVG_NS, 'g');
  rightFanGroup.setAttribute('class', 'energie-fan-lines energie-fan-lines--right');
  const rightFanLines: SVGPathElement[] = [];
  for (let i = 0; i < HOUSE_FAN_LINES; i++) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    rightFanGroup.appendChild(path);
    rightFanLines.push(path);
  }
  svg.appendChild(rightFanGroup);

  // House silhouette
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

  // Electricity connector (dashed) from bolt downward to photo top
  const elecConnector = document.createElementNS(SVG_NS, 'line');
  elecConnector.setAttribute('class', 'energie-elec-connector');
  elecConnector.setAttribute('x1', String(BOLT_CONN_X_VB));
  elecConnector.setAttribute('y1', String(BOLT_CONN_Y1_VB));
  elecConnector.setAttribute('x2', String(BOLT_CONN_X_VB));
  elecConnector.setAttribute('y2', String(BOLT_CONN_Y2_VB));
  elecConnector.setAttribute('stroke', 'rgba(255,255,255,0.35)');
  elecConnector.setAttribute('stroke-width', '1.5');
  elecConnector.setAttribute('stroke-dasharray', '3 3');
  elecConnector.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.appendChild(elecConnector);

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

  // ---- Bolt + "1 kWh Strom" group (top center, separate from horizontal flow)
  const boltGroup = document.createElement('div');
  boltGroup.className = 'energie-bolt';
  boltGroup.innerHTML = `
    <svg class="energie-bolt__icon" viewBox="0 0 16 24" width="14" height="22" aria-hidden="true">
      <path d="M 9 0 L 0 14 L 6 14 L 5 24 L 16 9 L 9 9 Z" fill="currentColor"/>
    </svg>
    <span class="energie-bolt__label"></span>
  `;
  const boltLabelEl = boltGroup.querySelector('.energie-bolt__label') as HTMLSpanElement;
  el.appendChild(boltGroup);

  // ---- "Aussenluft" label under cloud
  const cloudLabel = document.createElement('div');
  cloudLabel.className = 'energie-cloud-label';
  el.appendChild(cloudLabel);

  // ---- Right big number + label (above house)
  const outLabel = document.createElement('div');
  outLabel.className = 'energie-label energie-label--out';
  outLabel.innerHTML = `<span class="num"></span><span class="unit"></span>`;
  const outNumEl = outLabel.querySelector('.num') as HTMLSpanElement;
  const outUnitEl = outLabel.querySelector('.unit') as HTMLSpanElement;
  el.appendChild(outLabel);

  // ---- Below-unit caption (mode-dependent)
  const captionBelow = document.createElement('div');
  captionBelow.className = 'energie-from-air';
  el.appendChild(captionBelow);

  return {
    el,
    update(s: KioskState, row: CopRow) {
      const dict = t(s.lang);
      const cop = row.cop;
      const arrows = row.arrows;

      el.dataset.mode = s.energieMode;
      hex.setState(s.energieMode === 'kuehlen' ? 'cool' : 'heat');

      boltLabelEl.textContent = dict.energie.electricityIn;
      cloudLabel.textContent = dict.energie.outsideAirLabel;

      // Right big number — value (COP) and mode-dependent label
      outNumEl.textContent = formatNum(cop);
      outUnitEl.textContent =
        s.energieMode === 'kuehlen' ? dict.energie.coolOut : dict.energie.heatOut;

      // Below-unit caption — heating shows "free heat from air" (COP-1),
      // cooling shows "moves N kWh outside" (COP).
      const captionN =
        s.energieMode === 'kuehlen' ? formatNum(cop) : formatNum(Math.max(0, cop - 1));
      captionBelow.innerHTML =
        s.energieMode === 'kuehlen'
          ? dict.energie.coolOutCaption(captionN)
          : dict.energie.fromAirCaption(captionN);

      // Fan paths — d-attribute carries the arrow direction; marker-end picks
      // the right colour for the mode.
      const markerUrl =
        s.energieMode === 'kuehlen' ? 'url(#ene-arrow-cool)' : 'url(#ene-arrow-heat)';

      leftFanLines.forEach((path, i) => {
        const d = leftFanD(
          i,
          s.energieMode === 'kuehlen' ? 'unit-to-cloud' : 'cloud-to-unit',
        );
        path.setAttribute('d', d);
        path.setAttribute('marker-end', markerUrl);
      });

      rightFanLines.forEach((path, i) => {
        const d = rightFanD(
          i,
          s.energieMode === 'kuehlen' ? 'house-to-unit' : 'unit-to-house',
        );
        path.setAttribute('d', d);
        path.setAttribute('marker-end', markerUrl);
      });

      // Light up `arrows` worth of fan lines on each side; partial COP fades
      // the next line proportionally.
      const lit = Math.min(arrows, HOUSE_FAN_LINES);
      const fractional = cop - Math.floor(cop);
      const setOpacity = (lines: SVGPathElement[]): void => {
        lines.forEach((p, idx) => {
          if (idx < lit) p.style.opacity = '1';
          else if (idx === lit && fractional > 0.05)
            p.style.opacity = String(0.25 + fractional * 0.5);
          else p.style.opacity = '0.08';
        });
      };
      setOpacity(leftFanLines);
      setOpacity(rightFanLines);
    },
  };
}

/* ============================================================
   Path helpers — same shape both modes, direction reversed by 'dir'
   ============================================================ */

function leftFanD(i: number, dir: 'cloud-to-unit' | 'unit-to-cloud'): string {
  const t = i / Math.max(1, HOUSE_FAN_LINES - 1);
  // Endpoints distributed across cloud body height
  const yCloud = CLOUD_TOP_VB + 12 + t * (CLOUD_BOT_VB - CLOUD_TOP_VB - 24);
  const xMid = (CLOUD_RIGHT_VB + PHOTO_LEFT_VB) / 2;
  const yCtrl = (yCloud + MID_Y_VB) / 2 + (t - 0.5) * 28;
  return dir === 'cloud-to-unit'
    ? `M ${CLOUD_RIGHT_VB} ${yCloud} Q ${xMid} ${yCtrl} ${PHOTO_LEFT_VB} ${MID_Y_VB}`
    : `M ${PHOTO_LEFT_VB} ${MID_Y_VB} Q ${xMid} ${yCtrl} ${CLOUD_RIGHT_VB} ${yCloud}`;
}

function rightFanD(i: number, dir: 'unit-to-house' | 'house-to-unit'): string {
  const t = i / Math.max(1, HOUSE_FAN_LINES - 1);
  const yHouse = HOUSE_TOP_VB + 18 + t * (HOUSE_BOT_VB - HOUSE_TOP_VB - 36);
  const xMid = (PHOTO_RIGHT_VB + HOUSE_LEFT_VB) / 2;
  const yCtrl = (MID_Y_VB + yHouse) / 2 + (t - 0.5) * 28;
  return dir === 'unit-to-house'
    ? `M ${PHOTO_RIGHT_VB} ${MID_Y_VB} Q ${xMid} ${yCtrl} ${HOUSE_LEFT_VB} ${yHouse}`
    : `M ${HOUSE_LEFT_VB} ${yHouse} Q ${xMid} ${yCtrl} ${PHOTO_RIGHT_VB} ${MID_Y_VB}`;
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
