import heatpumpUrl from '../assets/soleco-heatpump.png';
import { SOUND_DB_AT_M, SOUND_DISTANCES, type SoundRow } from '../data';
import { t } from '../i18n';
import type { KioskState } from '../state';
import { store } from '../state';
import type { ModeView } from './_types';

export function mountGeraeusch(): ModeView {
  if (store.get().energieMode === 'kuehlen') {
    store.set({ energieMode: 'heizen', hpState: 'heat' });
  }

  const hero = buildHero();
  const captionEl = document.createElement('div');
  captionEl.className = 'mode-caption';
  const controlEl = buildControl();

  const render = (s: KioskState): void => {
    const dict = t(s.lang);
    const row = pickRow(s.geraeuschDistanceM);
    captionEl.textContent = dict.geraeusch.refs[row.refKey];
    hero.update(s, row);
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
   Hero — sound rings + photo + big dB number
   ============================================================ */
function buildHero() {
  const el = document.createElement('div');
  el.className = 'geraeusch-hero';

  // Concentric sound waves (rings) emanating from photo
  const rings = document.createElement('div');
  rings.className = 'geraeusch-rings';
  for (let i = 0; i < 4; i++) {
    const ring = document.createElement('span');
    ring.className = 'geraeusch-ring';
    ring.style.animationDelay = `${i * 0.6}s`;
    rings.appendChild(ring);
  }
  el.appendChild(rings);

  // Photo
  const stage = document.createElement('div');
  stage.className = 'geraeusch-stage';
  const photo = document.createElement('img');
  photo.src = heatpumpUrl;
  photo.alt = '';
  photo.className = 'geraeusch-photo';
  stage.appendChild(photo);
  el.appendChild(stage);

  // Big dB number above photo
  const big = document.createElement('div');
  big.className = 'geraeusch-big';
  big.innerHTML = `<span class="geraeusch-big__num"></span><span class="geraeusch-big__unit">dB(A)</span>`;
  const numEl = big.querySelector('.geraeusch-big__num') as HTMLSpanElement;
  el.appendChild(big);

  // Distance label
  const distLabel = document.createElement('div');
  distLabel.className = 'geraeusch-dist';
  el.appendChild(distLabel);

  return {
    el,
    update(s: KioskState, row: SoundRow) {
      const dict = t(s.lang);
      numEl.textContent = String(row.db);
      distLabel.textContent = dict.geraeusch.distance(row.distance);
      // Ring intensity scales with closeness
      const tnorm = 1 - (row.distance - 1) / (20 - 1); // 1 at 1m, 0 at 20m
      el.style.setProperty('--ring-intensity', String(0.2 + tnorm * 0.7));
    },
  };
}

/* ============================================================
   Control — distance slider with 4 ticks
   ============================================================ */
function buildControl() {
  const el = document.createElement('div');
  el.className = 'mode-control geraeusch-control';

  const wrap = document.createElement('div');
  wrap.className = 'slider-wrap';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = String(SOUND_DISTANCES.length - 1);
  slider.step = '1';
  slider.className = 'slider';
  slider.addEventListener('input', () => {
    const idx = Number(slider.value);
    const m = SOUND_DISTANCES[idx];
    if (m !== undefined) store.set({ geraeuschDistanceM: m });
  });

  const ticks = document.createElement('div');
  ticks.className = 'slider-ticks';
  const tickEls: HTMLSpanElement[] = SOUND_DISTANCES.map((m) => {
    const span = document.createElement('span');
    span.className = 'slider-tick';
    span.textContent = `${m} m`;
    span.addEventListener('click', () => store.set({ geraeuschDistanceM: m }));
    ticks.appendChild(span);
    return span;
  });

  wrap.append(slider, ticks);
  el.appendChild(wrap);

  return {
    el,
    update(s: KioskState) {
      const idx = SOUND_DISTANCES.indexOf(s.geraeuschDistanceM);
      if (idx >= 0) slider.value = String(idx);
      tickEls.forEach((t, i) => t.classList.toggle('is-active', i === idx));
    },
  };
}

function pickRow(m: number): SoundRow {
  return SOUND_DB_AT_M.find((r) => r.distance === m) ?? SOUND_DB_AT_M[0]!;
}
