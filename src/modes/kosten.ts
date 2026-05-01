import heatpumpUrl from '../assets/soleco-heatpump.png';
import { COSTS, TANGIBLES } from '../data';
import { t } from '../i18n';
import { showQrModal } from '../qr';
import type { HouseSize, KioskState, Lang } from '../state';
import { store } from '../state';
import type { ModeView } from './_types';

const SIZE_ORDER: HouseSize[] = ['klein', 'mittel', 'gross'];
const TAKEHOME_BASE = 'https://soleco.ch/expo';

const chf = new Intl.NumberFormat('de-CH');

export function mountKosten(): ModeView {
  // Cooling state isn't relevant in Kosten — reset to heating on entry.
  if (store.get().energieMode === 'kuehlen') {
    store.set({ energieMode: 'heizen', hpState: 'heat' });
  }

  const hero = buildHero();
  const captionEl = document.createElement('div');
  captionEl.className = 'mode-caption kosten-caption';
  const controlEl = buildControl();

  const render = (s: KioskState): void => {
    const dict = t(s.lang);
    const cost = COSTS[s.houseSize];
    const monthlyDiff = cost.oilPerMonth - cost.hpPerMonth;

    captionEl.textContent = dict.kosten.captionHeat;
    hero.update(s);
    controlEl.update(s);

    void monthlyDiff; // numbers updated inside hero.update
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
   Hero — bills + photo + saving headline + tangibles
   ============================================================ */
function buildHero() {
  const el = document.createElement('div');
  el.className = 'kosten-hero';

  // Row 1: bills + photo + bills
  const row1 = document.createElement('div');
  row1.className = 'kosten-row kosten-row--bills';

  const billOil = buildBill('oil');
  const billHp = buildBill('hp');

  const stage = document.createElement('div');
  stage.className = 'kosten-stage';
  const photo = document.createElement('img');
  photo.src = heatpumpUrl;
  photo.alt = '';
  photo.className = 'kosten-photo';
  stage.appendChild(photo);

  // Connector lines (dashed) between bills and photo
  const connectorLeft = document.createElement('div');
  connectorLeft.className = 'kosten-connector';
  const connectorRight = document.createElement('div');
  connectorRight.className = 'kosten-connector';

  row1.append(billOil.el, connectorLeft, stage, connectorRight, billHp.el);

  // Row 2: saving headline
  const saveBlock = document.createElement('div');
  saveBlock.className = 'kosten-save';
  const saveHeadline = document.createElement('div');
  saveHeadline.className = 'kosten-save__headline';
  const saveSub = document.createElement('div');
  saveSub.className = 'kosten-save__sub';
  saveBlock.append(saveHeadline, saveSub);

  // Row 3: tangibles
  const tangBlock = document.createElement('div');
  tangBlock.className = 'kosten-tangibles';

  const tangIntro = document.createElement('div');
  tangIntro.className = 'kosten-tangibles__intro';

  const tangRow = document.createElement('div');
  tangRow.className = 'kosten-tangibles__row';
  const tangCards = [
    buildTangible('ski'),
    buildTangible('cruise'),
    buildTangible('kitchen'),
  ];
  tangCards.forEach((c) => tangRow.appendChild(c.el));

  tangBlock.append(tangIntro, tangRow);

  el.append(row1, saveBlock, tangBlock);

  return {
    el,
    update(s: KioskState) {
      const dict = t(s.lang);
      const cost = COSTS[s.houseSize];
      const monthlyDiff = cost.oilPerMonth - cost.hpPerMonth;

      billOil.update(cost.oilPerMonth, cost.oilPerYear, dict.kosten.billOil, dict);
      billHp.update(cost.hpPerMonth, cost.hpPerYear, dict.kosten.billHp, dict);

      saveHeadline.textContent = dict.kosten.saveHeadline(chf.format(cost.saving20Years), 20);
      saveSub.textContent = dict.kosten.saveSub(chf.format(monthlyDiff));

      tangIntro.textContent = dict.kosten.tangiblesIntro;
      tangCards[0]!.update(
        Math.round(cost.saving20Years / TANGIBLES.skiSeasonChf),
        dict.kosten.tangibleSki,
        dict.kosten.tangibleSkiSub,
      );
      tangCards[1]!.update(
        Math.round(cost.saving20Years / TANGIBLES.cruiseChf),
        dict.kosten.tangibleCruise,
        dict.kosten.tangibleCruiseSub,
      );
      tangCards[2]!.update(
        Math.max(1, Math.round(cost.saving20Years / TANGIBLES.kitchenChf)),
        dict.kosten.tangibleKitchen,
        dict.kosten.tangibleKitchenSub,
      );
    },
  };
}

function buildBill(kind: 'oil' | 'hp') {
  const el = document.createElement('div');
  el.className = `kosten-bill kosten-bill--${kind}`;

  const header = document.createElement('div');
  header.className = 'kosten-bill__header';
  const headerLabel = document.createElement('span');
  header.appendChild(headerLabel);

  const body = document.createElement('div');
  body.className = 'kosten-bill__body';
  const monthly = document.createElement('div');
  monthly.className = 'kosten-bill__monthly';
  const monthlyAmount = document.createElement('span');
  monthlyAmount.className = 'kosten-bill__amount';
  const monthlyUnit = document.createElement('span');
  monthlyUnit.className = 'kosten-bill__unit';
  monthly.append(monthlyAmount, monthlyUnit);

  const yearly = document.createElement('div');
  yearly.className = 'kosten-bill__yearly';

  body.append(monthly, yearly);
  el.append(header, body);

  return {
    el,
    update(perMonth: number, perYear: number, headerText: string, dict: ReturnType<typeof t>) {
      headerLabel.textContent = headerText;
      monthlyAmount.textContent = `CHF ${chf.format(perMonth)}`;
      monthlyUnit.textContent = dict.kosten.perMonth;
      yearly.textContent = `CHF ${chf.format(perYear)} ${dict.kosten.perYear}`;
    },
  };
}

function buildTangible(_kind: 'ski' | 'cruise' | 'kitchen') {
  const el = document.createElement('div');
  el.className = 'kosten-tangible';
  const count = document.createElement('div');
  count.className = 'kosten-tangible__count';
  const text = document.createElement('div');
  text.className = 'kosten-tangible__text';
  const label = document.createElement('div');
  label.className = 'kosten-tangible__label';
  const sub = document.createElement('div');
  sub.className = 'kosten-tangible__sub';
  text.append(label, sub);
  el.append(count, text);

  return {
    el,
    update(n: number, labelText: string, subText: string) {
      count.textContent = `${n}×`;
      label.textContent = labelText;
      sub.textContent = subText;
    },
  };
}

/* ============================================================
   Control — size selector + CTA
   ============================================================ */
function buildControl() {
  const el = document.createElement('div');
  el.className = 'mode-control kosten-control';

  const sizes = document.createElement('div');
  sizes.className = 'kosten-sizes';

  type SizeRefs = { btn: HTMLButtonElement };
  const sizeRefs = new Map<HouseSize, SizeRefs>();
  SIZE_ORDER.forEach((sz) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kosten-size-btn';
    btn.dataset.size = sz;
    btn.addEventListener('click', () => store.set({ houseSize: sz }));
    sizes.appendChild(btn);
    sizeRefs.set(sz, { btn });
  });

  const cta = document.createElement('button');
  cta.type = 'button';
  cta.className = 'kosten-cta';
  cta.addEventListener('click', () => {
    const s = store.get();
    const url = `${TAKEHOME_BASE}?size=${s.houseSize}&lang=${s.lang}`;
    showQrModal({ url });
  });

  el.append(sizes, cta);

  return {
    el,
    update(s: KioskState) {
      const dict = t(s.lang);
      cta.textContent = dict.kosten.cta;
      const labels: Record<HouseSize, string> = {
        klein: dict.kosten.sizeKlein,
        mittel: dict.kosten.sizeMittel,
        gross: dict.kosten.sizeGross,
      };
      SIZE_ORDER.forEach((sz) => {
        const refs = sizeRefs.get(sz);
        if (!refs) return;
        refs.btn.textContent = labels[sz];
        refs.btn.setAttribute('aria-pressed', String(sz === s.houseSize));
      });
    },
  };
}

function _formatLang(lang: Lang): Lang {
  return lang;
}
void _formatLang;
