import type { Lang } from './state';

type Dict = {
  brand: string;
  modes: {
    energie: { label: string; sub: string };
    innen: { label: string; sub: string };
    kaelte: { label: string; sub: string };
    geraeusch: { label: string; sub: string };
    kosten: { label: string; sub: string };
  };
  shellPlaceholderCaption: string;
  shellPlaceholderControl: string;
  energie: {
    caption: string;
    captionCool: string;
    electricityIn: string;
    outsideAirLabel: string;
    fromAir: string;
    /** Heating below-unit caption HTML, e.g. "+ 4.01 kWh aus der Luft (gratis)" */
    fromAirCaption: (n: string) => string;
    /** Cooling below-unit caption HTML, e.g. "1 kWh Strom bewegt 4.30 kWh Wärme nach draussen" */
    coolOutCaption: (n: string) => string;
    heatOut: string;
    coolOut: string;
    heizen: string;
    kuehlen: string;
    cop: string;
    notAvailable: string;
  };
  kosten: {
    captionHeat: string;
    billOil: string;
    billHp: string;
    perMonth: string;
    perYear: string;
    saveHeadline: (chf: string, years: number) => string;
    saveSub: (perMonth: string) => string;
    tangiblesIntro: string;
    tangibleSki: string;
    tangibleSkiSub: string;
    tangibleCruise: string;
    tangibleCruiseSub: string;
    tangibleKitchen: string;
    tangibleKitchenSub: string;
    sizeKlein: string;
    sizeMittel: string;
    sizeGross: string;
    cta: string;
  };
  innen: {
    captionShort: string;
    modeHeat: string;
    modeCool: string;
    showHeatFlow: string;
    indoorAir: string;
    outdoorAir: string;
    brandLabel: string;
    indoorCoil: string;
    outdoorCoil: string;
    expansion: string;
    compressor: string;
    expansionSub: string;
    compressorSub: string;
    heat: {
      indoorSub1: string;
      indoorSub2: string;
      outdoorSub: string;
      explainer: string;
    };
    cool: {
      indoorSub1: string;
      indoorSub2: string;
      outdoorSub: string;
      explainer: string;
    };
  };
  kaelte: {
    caption: string;
    statusPill: (cop: string) => string;
    chartTitle: string;
    barHp: string;
    barOil: string;
    barElectric: string;
    perChf: string;
    objectionKill: string;
  };
  geraeusch: {
    caption: string;
    distance: (m: number) => string;
    refs: { gespraech: string; kuehlschrank: string; bibliothek: string; unhoerbar: string };
  };
  qr: {
    title: string;
    subtitle: string;
    close: string;
  };
  comingSoon: string;
};

const de: Dict = {
  brand: 'SOLECO',
  modes: {
    energie: { label: 'Energie', sub: '1 kWh → 5 kWh' },
    innen: { label: 'Innen', sub: 'Folge der Wärme' },
    kaelte: { label: 'Kälte', sub: 'Bis −25 °C' },
    geraeusch: { label: 'Geräusch', sub: 'Leiser als ein Kühlschrank' },
    kosten: { label: 'Kosten', sub: 'Ihre Ersparnis' },
  },
  shellPlaceholderCaption: 'Tippen Sie einen Modus, um zu starten.',
  shellPlaceholderControl: 'Modus wählen',
  energie: {
    caption:
      'Wärmepumpe macht keine Wärme — sie holt sie aus der Luft. Wie eine Velopumpe rückwärts.',
    captionCool: 'Im Sommer arbeitet sie umgekehrt: Sie holt Wärme aus dem Haus.',
    electricityIn: '1 kWh Strom',
    outsideAirLabel: 'Aussenluft',
    fromAir: 'aus der Luft (gratis)',
    fromAirCaption: (n) =>
      `<span class="plus">+</span> <span class="num">${n} kWh</span> aus der Luft (gratis)`,
    coolOutCaption: (n) =>
      `1 kWh Strom bewegt <span class="num">${n} kWh</span> Wärme nach draussen`,
    heatOut: 'kWh Wärme',
    coolOut: 'kWh Wärme abgegeben',
    heizen: 'Heizen',
    kuehlen: 'Kühlen',
    cop: 'COP',
    notAvailable: 'Bei dieser Aussentemperatur wird nicht gekühlt.',
  },
  kosten: {
    captionHeat: 'Heizkosten: Heizöl gegen Wärmepumpe',
    billOil: 'Heizöl',
    billHp: 'Wärmepumpe',
    perMonth: '/Monat',
    perYear: 'pro Jahr',
    saveHeadline: (chf, years) => `Sie sparen CHF ${chf} in ${years} Jahren`,
    saveSub: (perMonth) => `Berechnung: CHF ${perMonth}/Monat × 240 Monate`,
    tangiblesIntro: 'Damit zahlen Sie zum Beispiel:',
    tangibleSki: 'Ski-Saison',
    tangibleSkiSub: '4 Pässe Familie',
    tangibleCruise: 'Mittelmeer-Kreuzfahrt',
    tangibleCruiseSub: '4 Personen, 1 Woche',
    tangibleKitchen: 'neue Küche',
    tangibleKitchenSub: 'Schweizer Mittelklasse',
    sizeKlein: 'Klein 120 m²',
    sizeMittel: 'Mittel 180 m²',
    sizeGross: 'Gross 250 m²',
    cta: 'Berechnung mitnehmen →',
  },
  qr: {
    title: 'Scannen Sie den Code für Ihre persönliche Berechnung',
    subtitle: 'Inklusive einem unverbindlichen Beratungsangebot',
    close: 'Schliessen',
  },
  innen: {
    captionShort: 'Folge der Wärme — ein geschlossener Kreis.',
    modeHeat: 'Heizen (Winter)',
    modeCool: 'Kühlen (Sommer)',
    showHeatFlow: 'Wärmestrom anzeigen',
    indoorAir: 'INNENLUFT',
    outdoorAir: 'AUSSENLUFT',
    brandLabel: 'SOLECO Wärmepumpe',
    indoorCoil: 'Innenwärmetauscher',
    outdoorCoil: 'Aussenwärmetauscher',
    expansion: 'Expansionsventil',
    compressor: 'Kompressor',
    expansionSub: '(senkt den Druck)',
    compressorSub: '(erhöht den Druck)',
    heat: {
      indoorSub1: '(gibt Wärme',
      indoorSub2: 'in den Raum ab)',
      outdoorSub: '(holt Wärme aus der Aussenluft)',
      explainer:
        'In der <strong>Heizfunktion</strong> entzieht das Kältemittel der kalten Aussenluft Wärme, wird vom Kompressor heiss verdichtet und gibt die Wärme im Haus ab.',
    },
    cool: {
      indoorSub1: '(nimmt Wärme',
      indoorSub2: 'aus dem Raum auf)',
      outdoorSub: '(gibt Wärme an die Aussenluft ab)',
      explainer:
        'Im <strong>Kühlbetrieb</strong> läuft dieselbe Maschine <em>rückwärts</em>: Das Kältemittel nimmt Wärme aus der Innenluft auf, wird verdichtet und gibt die Wärme draussen ab.',
    },
  },
  kaelte: {
    caption: 'Funktioniert bis −25 °C. Wärmepumpe schlägt Öl und Strom bei jeder Temperatur.',
    statusPill: (cop) => `COP ${cop} — funktioniert`,
    chartTitle: 'Wärme pro 1 CHF Energie',
    barHp: 'Wärmepumpe',
    barOil: 'Heizöl',
    barElectric: 'Elektroheizung',
    perChf: 'kWh pro CHF',
    objectionKill: 'Auch im kältesten Winter führt die Wärmepumpe.',
  },
  geraeusch: {
    caption: 'Aussengerät, A-bewertet (EN 12102).',
    distance: (m) => `In ${m} m Abstand`,
    refs: {
      gespraech: 'wie ein leises Gespräch',
      kuehlschrank: 'leiser als ein Kühlschrank',
      bibliothek: 'wie eine Bibliothek',
      unhoerbar: 'fast unhörbar',
    },
  },
  comingSoon: 'In Vorbereitung',
};

const en: Dict = {
  brand: 'SOLECO',
  modes: {
    energie: { label: 'Energy', sub: '1 kWh → 5 kWh' },
    innen: { label: 'Inside', sub: 'Follow the heat' },
    kaelte: { label: 'Cold', sub: 'Down to −25 °C' },
    geraeusch: { label: 'Sound', sub: 'Quieter than a fridge' },
    kosten: { label: 'Cost', sub: 'Your savings' },
  },
  shellPlaceholderCaption: 'Tap a mode to begin.',
  shellPlaceholderControl: 'Pick a mode',
  energie: {
    caption: 'A heat pump doesn’t make heat — it moves it from the air. Like a bicycle pump in reverse.',
    captionCool: 'In summer it works in reverse: it pulls heat out of the house.',
    electricityIn: '1 kWh electricity',
    outsideAirLabel: 'Outdoor air',
    fromAir: 'from the air (free)',
    fromAirCaption: (n) =>
      `<span class="plus">+</span> <span class="num">${n} kWh</span> from the air (free)`,
    coolOutCaption: (n) =>
      `1 kWh of electricity moves <span class="num">${n} kWh</span> of heat outside`,
    heatOut: 'kWh heat',
    coolOut: 'kWh heat moved out',
    heizen: 'Heating',
    kuehlen: 'Cooling',
    cop: 'COP',
    notAvailable: 'Cooling is not used at this outside temperature.',
  },
  kosten: {
    captionHeat: 'Heating cost: oil vs. heat pump',
    billOil: 'Oil heating',
    billHp: 'Heat pump',
    perMonth: '/month',
    perYear: 'per year',
    saveHeadline: (chf, years) => `You save CHF ${chf} over ${years} years`,
    saveSub: (perMonth) => `Calculation: CHF ${perMonth}/month × 240 months`,
    tangiblesIntro: 'For example, that pays for:',
    tangibleSki: 'ski season',
    tangibleSkiSub: '4 family passes',
    tangibleCruise: 'Mediterranean cruise',
    tangibleCruiseSub: '4 people, 1 week',
    tangibleKitchen: 'new kitchen',
    tangibleKitchenSub: 'Swiss mid-range',
    sizeKlein: 'Small 120 m²',
    sizeMittel: 'Medium 180 m²',
    sizeGross: 'Large 250 m²',
    cta: 'Take it home →',
  },
  qr: {
    title: 'Scan the code for your personalised calculation',
    subtitle: 'Includes a non-binding consultation offer',
    close: 'Close',
  },
  innen: {
    captionShort: 'Follow the heat — one closed loop.',
    modeHeat: 'Heating (winter)',
    modeCool: 'Cooling (summer)',
    showHeatFlow: 'Show heat flow',
    indoorAir: 'INDOOR AIR',
    outdoorAir: 'OUTDOOR AIR',
    brandLabel: 'SOLECO heat pump',
    indoorCoil: 'Indoor coil',
    outdoorCoil: 'Outdoor coil',
    expansion: 'Expansion valve',
    compressor: 'Compressor',
    expansionSub: '(drops pressure)',
    compressorSub: '(raises pressure)',
    heat: {
      indoorSub1: '(releases heat',
      indoorSub2: 'into your room)',
      outdoorSub: '(grabs heat from outside air)',
      explainer:
        'In <strong>heating mode</strong>, refrigerant grabs heat from cold outdoor air, gets squeezed hot by the compressor, then drops the heat off inside the house.',
    },
    cool: {
      indoorSub1: '(grabs heat',
      indoorSub2: 'from your room)',
      outdoorSub: '(releases heat to outside air)',
      explainer:
        'In <strong>cooling mode</strong>, the same machine runs <em>backwards</em>: refrigerant grabs heat from indoor air, gets squeezed hot, and dumps the heat outside.',
    },
  },
  kaelte: {
    caption: 'Works down to −25 °C. The heat pump beats oil and electric heating at every temperature.',
    statusPill: (cop) => `COP ${cop} — running`,
    chartTitle: 'Heat per 1 CHF of energy',
    barHp: 'Heat pump',
    barOil: 'Oil heating',
    barElectric: 'Electric heater',
    perChf: 'kWh per CHF',
    objectionKill: 'Even in the coldest winter the heat pump leads.',
  },
  geraeusch: {
    caption: 'Outdoor unit, A-weighted (EN 12102).',
    distance: (m) => `At ${m} m distance`,
    refs: {
      gespraech: 'like a quiet conversation',
      kuehlschrank: 'quieter than a fridge',
      bibliothek: 'like a library',
      unhoerbar: 'almost inaudible',
    },
  },
  comingSoon: 'Coming soon',
};

const dicts: Record<Lang, Dict> = { de, en };

export function t(lang: Lang): Dict {
  return dicts[lang];
}
