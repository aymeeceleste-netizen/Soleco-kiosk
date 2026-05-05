import logoUrl from './assets/soleco-logo.svg';
import { formatRatedKwh, ratedCoolCop, ratedHeatCop } from './data';
import { mountEnergie } from './modes/energie';
import { mountGeraeusch } from './modes/geraeusch';
import { mountInnen } from './modes/innen';
import { mountKaelte } from './modes/kaelte';
import { mountKosten } from './modes/kosten';
import type { ModeFactory, ModeView } from './modes/_types';
import { t } from './i18n';
import type { EnergieMode, KioskState, Lang, Mode } from './state';
import { store } from './state';

const MODE_ORDER: Mode[] = ['energie', 'innen', 'kaelte', 'geraeusch', 'kosten'];

const MODE_FACTORIES: Record<Mode, ModeFactory> = {
  energie: mountEnergie,
  innen: mountInnen,
  kaelte: mountKaelte,
  geraeusch: mountGeraeusch,
  kosten: mountKosten,
};

export function mountShell(root: HTMLElement): void {
  root.innerHTML = '';

  const topbar = buildTopbar();
  const heroSlot = document.createElement('section');
  heroSlot.className = 'hero';

  const captionSlot = document.createElement('div');
  captionSlot.className = 'caption';

  const controlSlot = document.createElement('div');
  controlSlot.className = 'control';

  const modeStrip = buildModeStrip();

  const bottom = document.createElement('footer');
  bottom.className = 'bottom';
  bottom.append(captionSlot, controlSlot, modeStrip.el);

  root.append(topbar.el, heroSlot, bottom);

  // Mode mount/swap with cross-fade
  let current: { view: ModeView; mode: Mode } | null = null;

  const mountMode = (mode: Mode): void => {
    if (current?.mode === mode) return;
    const factory = MODE_FACTORIES[mode];
    const next = factory();

    // Wrap each slot's content in a fade element
    next.hero.classList.add('mode-slot', 'mode-slot--enter');
    next.caption.classList.add('mode-slot', 'mode-slot--enter');
    next.control.classList.add('mode-slot', 'mode-slot--enter');

    const prev = current;

    // Mount new (invisible)
    heroSlot.appendChild(next.hero);
    captionSlot.appendChild(next.caption);
    controlSlot.appendChild(next.control);

    // Trigger fade-in on next frame
    requestAnimationFrame(() => {
      next.hero.classList.remove('mode-slot--enter');
      next.caption.classList.remove('mode-slot--enter');
      next.control.classList.remove('mode-slot--enter');
      // Fade out previous
      if (prev) {
        prev.view.hero.classList.add('mode-slot--exit');
        prev.view.caption.classList.add('mode-slot--exit');
        prev.view.control.classList.add('mode-slot--exit');
      }
    });

    // Tear down previous after cross-fade
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

  // Top-level state subscription: react to mode, lang, and energieMode changes.
  const onState = (s: KioskState): void => {
    topbar.render(s.lang);
    modeStrip.render(s.mode, s.lang, s.energieMode);
    if (current?.mode !== s.mode) mountMode(s.mode);
  };
  store.subscribe(onState);

  // Initial mount
  mountMode(store.get().mode);
  onState(store.get());
}

/* ============================================================
   Top bar
   ============================================================ */
function buildTopbar() {
  const el = document.createElement('header');
  el.className = 'topbar';

  const logo = document.createElement('img');
  logo.className = 'topbar__logo';
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
    b.className = 'lang-toggle__btn';
    b.textContent = lang.toUpperCase();
    b.addEventListener('click', () => store.set({ lang }));
    buttons[lang] = b;
    toggle.appendChild(b);
  });

  el.append(logo, toggle);

  return {
    el,
    render(lang: Lang) {
      langs.forEach((l) => buttons[l].setAttribute('aria-pressed', String(l === lang)));
    },
  };
}

/* ============================================================
   Mode strip
   ============================================================ */
function buildModeStrip() {
  const el = document.createElement('nav');
  el.className = 'modestrip';
  el.setAttribute('aria-label', 'Modes');

  type CardRefs = {
    card: HTMLButtonElement;
    title: HTMLSpanElement;
    sub: HTMLSpanElement;
  };
  const cards = new Map<Mode, CardRefs>();

  MODE_ORDER.forEach((m, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mode-card';
    card.dataset.mode = m;
    card.addEventListener('click', () => store.set({ mode: m }));

    const index = document.createElement('span');
    index.className = 'mode-card__index';
    index.textContent = String(i + 1).padStart(2, '0');

    const title = document.createElement('span');
    title.className = 'mode-card__title';

    const sub = document.createElement('span');
    sub.className = 'mode-card__sub';

    card.append(index, title, sub);
    el.appendChild(card);
    cards.set(m, { card, title, sub });
  });

  return {
    el,
    render(mode: Mode, lang: Lang, energieMode: EnergieMode) {
      const dict = t(lang);
      MODE_ORDER.forEach((m) => {
        const refs = cards.get(m);
        if (!refs) return;
        refs.card.setAttribute('aria-current', String(m === mode));
        refs.title.textContent = dict.modes[m].label;
        if (m === 'energie') {
          // Subtitle is locked to the rated value (A7/W35 heating, +30 °C
          // placeholder for cooling — see data.ts) and toggles with the
          // Energie heizen/kuehlen state. Same data source as the headline.
          const rated = energieMode === 'kuehlen' ? ratedCoolCop() : ratedHeatCop();
          refs.sub.textContent = `1 kWh → ${formatRatedKwh(rated)} kWh`;
        } else {
          refs.sub.textContent = dict.modes[m].sub;
        }
      });
    },
  };
}
