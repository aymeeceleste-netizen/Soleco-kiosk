import logoUrl from './assets/soleco-logo.svg';
import { formatRatedKwh, ratedHeatCop } from './data';
import { mountEnergie } from './modes/energie';
import { mountGeraeusch } from './modes/geraeusch';
import { mountInnen } from './modes/innen';
import { mountKaelte } from './modes/kaelte';
import { mountKosten } from './modes/kosten';
import type { ModeFactory, ModeView } from './modes/_types';
import { t } from './i18n';
import type { KioskState, Lang, Mode } from './state';
import { store } from './state';

const MODE_ORDER: Mode[] = ['energie', 'innen', 'kaelte', 'geraeusch', 'kosten'];

const MODE_FACTORIES: Record<Mode, ModeFactory> = {
  energie: mountEnergie,
  innen: mountInnen,
  kaelte: mountKaelte,
  geraeusch: mountGeraeusch,
  kosten: mountKosten,
};

/**
 * Inline glow-tab icons (24×24 viewBox), one per mode. Stroke-only,
 * `currentColor` so the active-state amber tint comes from the .glow-tab
 * .active rule. Sourced from Soleco_Energie_D_Final.html and
 * Soleco_Innen_D_Final.html.
 */
const MODE_ICONS: Record<Mode, string> = {
  energie:
    '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke-linecap="round" stroke-linejoin="round"/>',
  innen:
    '<path d="M3 12L12 4l9 8v9H3z" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21v-6h6v6" stroke-linecap="round" stroke-linejoin="round"/>',
  kaelte:
    '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" stroke-linecap="round"/>',
  geraeusch:
    '<path d="M11 5L6 9H2v6h4l5 4z" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 010 7" stroke-linecap="round"/>',
  kosten: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
};

/**
 * The label on the rail under each glow-tab icon. Brief renames "Geräusch"
 * → "Lärm" at the visible-label level only (internal mode key stays
 * `geraeusch` — see `src/modes/geraeusch.ts` and `state.ts`).
 */
function railLabel(mode: Mode, dict: ReturnType<typeof t>): string {
  if (mode === 'geraeusch') return 'Lärm';
  return dict.modes[mode].label;
}

export function mountShell(root: HTMLElement): void {
  root.innerHTML = '';

  // ---- Frame + header ------------------------------------------------------
  const frame = document.createElement('div');
  frame.className = 'kiosk-frame';

  const header = buildKioskHeader();
  frame.appendChild(header.el);

  // ---- vD-grid: rail | content --------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'vD-grid';
  frame.appendChild(grid);

  const rail = buildRail();
  grid.appendChild(rail.el);

  const content = document.createElement('div');
  content.className = 'vD-content';
  grid.appendChild(content);

  // vD-content has 3 rows: header / canvas-area / controls.
  const tabHeader = document.createElement('div');
  tabHeader.className = 'vD-header';
  content.appendChild(tabHeader);

  const canvasArea = document.createElement('div');
  canvasArea.className = 'vD-canvas-area';
  content.appendChild(canvasArea);

  const controlsRow = document.createElement('div');
  controlsRow.className = 'vD-controls';
  content.appendChild(controlsRow);

  // The two slot wrappers are intentionally unstyled `<div>`s — the .vD-controls
  // grid (1.4fr / 1fr) lays them out; the legacy `.caption` / `.control` CSS
  // would conflict with the new editorial frame.
  const captionSlot = document.createElement('div');
  captionSlot.style.position = 'relative';
  captionSlot.style.minWidth = '0';
  const controlSlot = document.createElement('div');
  controlSlot.style.position = 'relative';
  controlSlot.style.minWidth = '0';
  controlsRow.append(captionSlot, controlSlot);

  root.appendChild(frame);

  // ---- Per-tab header (heroline) ------------------------------------------
  // Heroline reads from the existing dict.modes[m].sub. Each mode redesign in
  // Phase 1+ can replace this with a richer per-tab header (e.g. live-updated
  // COP in Energie's heroline).
  const tabHeaderRender = (mode: Mode, lang: Lang): void => {
    const dict = t(lang);
    tabHeader.innerHTML = `
      <div>
        <h1 class="heroline">${dict.modes[mode].sub}</h1>
      </div>
    `;
  };

  // ---- Mode mount/swap with cross-fade ------------------------------------
  let current: { view: ModeView; mode: Mode } | null = null;

  const mountMode = (mode: Mode): void => {
    if (current?.mode === mode) return;
    const factory = MODE_FACTORIES[mode];
    const next = factory();

    next.hero.classList.add('mode-slot', 'mode-slot--enter');
    next.caption.classList.add('mode-slot', 'mode-slot--enter');
    next.control.classList.add('mode-slot', 'mode-slot--enter');

    const prev = current;

    // Per-tab header: if the mode supplies one, mount it into vD-header;
    // otherwise the shell-generated default (set by tabHeaderRender below)
    // already lives there.
    if (next.header) {
      tabHeader.replaceChildren(next.header);
    }

    canvasArea.appendChild(next.hero);
    captionSlot.appendChild(next.caption);
    controlSlot.appendChild(next.control);

    requestAnimationFrame(() => {
      next.hero.classList.remove('mode-slot--enter');
      next.caption.classList.remove('mode-slot--enter');
      next.control.classList.remove('mode-slot--enter');
      if (prev) {
        prev.view.hero.classList.add('mode-slot--exit');
        prev.view.caption.classList.add('mode-slot--exit');
        prev.view.control.classList.add('mode-slot--exit');
      }
    });

    if (prev) {
      window.setTimeout(() => {
        prev.view.destroy();
        prev.view.hero.remove();
        prev.view.caption.remove();
        prev.view.control.remove();
      }, 360);
    }

    current = { view: next, mode };
  };

  // ---- Top-level subscription ---------------------------------------------
  const onState = (s: KioskState): void => {
    header.render(s.lang);
    rail.render(s.mode, s.lang);
    if (current?.mode !== s.mode) mountMode(s.mode);
    // Modes that supplied their own `header` already wrote it via
    // `tabHeader.replaceChildren()` inside mountMode. For modes without a
    // header (Phase 0 holdouts), render the default kicker + heroline. Their
    // own `render()` (subscribed to the store) keeps it fresh on lang change.
    if (!current?.view.header) tabHeaderRender(s.mode, s.lang);
  };
  store.subscribe(onState);

  mountMode(store.get().mode);
  onState(store.get());
}

/* ============================================================
   Kiosk header — logo + lang-toggle, hairline below
   ============================================================ */
function buildKioskHeader() {
  const el = document.createElement('header');
  el.className = 'kiosk-header';

  const logo = document.createElement('img');
  logo.className = 'kiosk-logo';
  logo.src = logoUrl;
  logo.alt = 'SOLECO';

  const toggle = document.createElement('div');
  toggle.className = 'lang-toggle';
  toggle.setAttribute('role', 'group');
  toggle.setAttribute('aria-label', 'Language');

  const langs: Lang[] = ['de', 'en'];
  const buttons: Record<Lang, HTMLButtonElement> = {} as Record<Lang, HTMLButtonElement>;
  langs.forEach((lang) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = lang.toUpperCase();
    b.addEventListener('click', () => store.set({ lang }));
    buttons[lang] = b;
    toggle.appendChild(b);
  });

  el.append(logo, toggle);

  return {
    el,
    render(lang: Lang) {
      langs.forEach((l) => {
        buttons[l].classList.toggle('on', l === lang);
        buttons[l].setAttribute('aria-pressed', String(l === lang));
      });
    },
  };
}

/* ============================================================
   Vertical rail of 5 glow-tabs
   ============================================================ */
function buildRail() {
  const el = document.createElement('nav');
  el.className = 'vD-rail';
  el.setAttribute('aria-label', 'Modes');

  type CardRefs = { btn: HTMLButtonElement; label: HTMLDivElement };
  const cards = new Map<Mode, CardRefs>();

  MODE_ORDER.forEach((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'glow-tab';
    btn.dataset.mode = m;
    btn.addEventListener('click', () => store.set({ mode: m }));

    btn.innerHTML = `
      <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${MODE_ICONS[m]}</svg>
      <div class="tab-label"></div>
    `;
    const label = btn.querySelector<HTMLDivElement>('.tab-label')!;

    el.appendChild(btn);
    cards.set(m, { btn, label });
  });

  return {
    el,
    render(mode: Mode, lang: Lang) {
      const dict = t(lang);
      MODE_ORDER.forEach((m) => {
        const refs = cards.get(m);
        if (!refs) return;
        refs.btn.classList.toggle('active', m === mode);
        refs.btn.setAttribute('aria-current', String(m === mode));
        refs.label.textContent = railLabel(m, dict);
      });
    },
  };
}

// `formatRatedKwh` and `ratedHeatCop` are imported above so the redesigned
// mode-strip subtitle (Energie's "1 kWh → X kWh") can be re-introduced when
// each tab gains its own redesigned header in Phase 1+.
void formatRatedKwh;
void ratedHeatCop;
