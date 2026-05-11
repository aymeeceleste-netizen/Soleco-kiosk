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
  /** Rev. 2 redesign: editorial kicker template, e.g. "Kapitel 01 · Energie". */
  chapter: (idx: string, label: string) => string;
  shellPlaceholderCaption: string;
  shellPlaceholderControl: string;
  energie: {
    caption: string;
    /** Rev. 2 heroline — "1 kWh rein. <em>5 kWh</em> raus." (live-updates with COP) */
    heroline: (kwhOut: number) => string;
    /** Rev. 2 left stat kicker — "Aus der Luft · gratis" */
    statKickerAir: string;
    /** Rev. 2 slider header — "Aussentemperatur · ziehen zum Erkunden" */
    sliderHeader: string;
    /** Rev. 2 COP echo — "Energieverhältnis bei +7°C" */
    copEcho: (tempStr: string) => string;
    /** "STROM" pill above the unit */
    electricityLabel: string;
    /** "1 kWh Strom" / "1 kWh electricity" — the value next to the bolt */
    electricityIn: string;
    /** "AUSSENLUFT" / "OUTDOOR AIR" — drawn on the canvas */
    outsideAirLabel: string;
    /** Left stat header — "Aus der Luft" / "From the air" */
    fromAirLabel: string;
    /** Right stat header — "Wärme" / "Heat" */
    heatLabel: string;
    /** Right stat unit — "kWh Wärme" / "kWh heat" */
    heatOut: string;
    /** Left stat tag — "GRATIS" / "FREE" */
    free: string;
    cop: string;
    /** Multiplier bar legend — paid electricity */
    paidElectricity: string;
    /** Multiplier bar legend — free environmental energy */
    freeEnvEnergy: string;
    /** Slider section header — "Aussentemperatur" / "Outside temperature" */
    outsideTemp: string;
    /** Multiplier bar inner label, e.g. "+ 4.01 kWh Luft" */
    airBarLabel: (n: string) => string;
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
    /** Hint under the schematic, e.g. "Tippe Kompressor oder Expansionsventil für eine Nahaufnahme." */
    hintCaption: string;
    indoorAir: string;
    outdoorAir: string;
    brandLabel: string;
    indoorCoil: string;
    outdoorCoil: string;
    expansion: string;
    compressor: string;
    expansionSub: string;
    compressorSub: string;
    /** Close button label for component close-up modal. */
    modalClose: string;
    /** Component close-up modal payload (title, description, analogy,
       disclaimer, and on-canvas labels) per component. */
    popup: {
      compressor: {
        title: string;
        desc: string;
        analogy: string;
        disclaimer: string;
        labels: {
          coolIn: string;
          hotOut: string;
          cool: string;
          warming: string;
          hot: string;
          chamberLabel: string;
        };
      };
      expansion: {
        title: string;
        desc: string;
        analogy: string;
        disclaimer: string;
        labels: {
          warm: string;
          cold: string;
          lowPressureSide: string;
        };
      };
    };
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
  chapter: (idx, label) => `Kapitel ${idx} · ${label}`,
  shellPlaceholderCaption: 'Tippen Sie einen Modus, um zu starten.',
  shellPlaceholderControl: 'Modus wählen',
  energie: {
    caption:
      'Wärmepumpe macht keine Wärme — sie holt sie aus der Luft. Wie eine Velopumpe rückwärts.',
    heroline: (kwh) => `1 kWh rein. <em>${kwh} kWh</em> raus.`,
    statKickerAir: 'Aus der Luft · gratis',
    sliderHeader: 'Aussentemperatur · ziehen zum Erkunden',
    copEcho: (tempStr) => `Energieverhältnis bei ${tempStr}`,
    electricityLabel: 'Strom',
    electricityIn: '1 kWh',
    outsideAirLabel: 'Aussenluft',
    fromAirLabel: 'Aus der Luft',
    heatLabel: 'Wärme',
    heatOut: 'kWh Wärme',
    free: 'GRATIS',
    cop: 'COP',
    paidElectricity: 'Bezahlter Strom',
    freeEnvEnergy: 'Gratis Umweltenergie',
    outsideTemp: 'Aussentemperatur',
    airBarLabel: (n) => `+ ${n} kWh Luft`,
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
    hintCaption: 'Tippe Kompressor oder Expansionsventil für eine Nahaufnahme.',
    indoorAir: 'INNENLUFT',
    outdoorAir: 'AUSSENLUFT',
    brandLabel: 'SOLECO Wärmepumpe',
    indoorCoil: 'Innenwärmetauscher',
    outdoorCoil: 'Aussenwärmetauscher',
    expansion: 'Expansionsventil',
    compressor: 'Kompressor',
    expansionSub: '(senkt den Druck)',
    compressorSub: '(erhöht den Druck)',
    modalClose: 'Schliessen',
    popup: {
      compressor: {
        title: 'Der Kompressor',
        desc: 'Kühles Gas strömt in den Kompressor. Der Kompressor verdichtet es. Heisses Gas unter hohem Druck strömt zum Innenwärmetauscher.',
        analogy:
          '💡 Wie eine Velopumpe — wenn du Luft in einen engen Raum drückst, wird sie heiss. Genau das macht der Kompressor mit dem Kältemittel.',
        disclaimer:
          'Konzeptuelle Animation — Ihr System arbeitet nach demselben Prinzip, der innere Aufbau unterscheidet sich jedoch.',
        labels: {
          coolIn: '← Kühles Gas',
          hotOut: '← Heisses, verdichtetes Gas',
          cool: 'Kühl · Niederdruck',
          warming: 'Wird warm · Druck steigt',
          hot: 'Heiss · Hochdruck',
          chamberLabel: 'Verdichterkammer',
        },
      },
      expansion: {
        title: 'Das Expansionsventil',
        desc: 'Heisse Flüssigkeit dicht gepackt auf der Hochdruckseite. Sie wird durch die Drosselöffnung gedrückt und entweicht in die Niederdruckseite — sie verteilt sich und kühlt ab.',
        analogy:
          '💡 Wie beim Sprühen einer Deospraydose — das Gas dehnt sich aus und die Düse wird eiskalt. Das Expansionsventil funktioniert nach demselben Prinzip.',
        disclaimer:
          'Konzeptuelle Animation — Ihr System arbeitet nach demselben Prinzip, der innere Aufbau unterscheidet sich jedoch.',
        labels: {
          warm: 'Warm · Hochdruck',
          cold: 'Kalt · Niederdruck',
          lowPressureSide: 'Niederdruckseite',
        },
      },
    },
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
  chapter: (idx, label) => `Chapter ${idx} · ${label}`,
  shellPlaceholderCaption: 'Tap a mode to begin.',
  shellPlaceholderControl: 'Pick a mode',
  energie: {
    caption: 'A heat pump doesn’t make heat — it moves it from the air. Like a bicycle pump in reverse.',
    heroline: (kwh) => `1 kWh in. <em>${kwh} kWh</em> out.`,
    statKickerAir: 'From the air · free',
    sliderHeader: 'Outdoor temp · drag to explore',
    copEcho: (tempStr) => `Energy ratio at ${tempStr}`,
    electricityLabel: 'Electricity',
    electricityIn: '1 kWh',
    outsideAirLabel: 'Outdoor air',
    fromAirLabel: 'From the air',
    heatLabel: 'Heat',
    heatOut: 'kWh heat',
    free: 'FREE',
    cop: 'COP',
    paidElectricity: 'Paid electricity',
    freeEnvEnergy: 'Free environmental energy',
    outsideTemp: 'Outside temperature',
    airBarLabel: (n) => `+ ${n} kWh air`,
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
    hintCaption: 'Tap the compressor or expansion valve for a close-up.',
    indoorAir: 'INDOOR AIR',
    outdoorAir: 'OUTDOOR AIR',
    brandLabel: 'SOLECO heat pump',
    indoorCoil: 'Indoor coil',
    outdoorCoil: 'Outdoor coil',
    expansion: 'Expansion valve',
    compressor: 'Compressor',
    expansionSub: '(drops pressure)',
    compressorSub: '(raises pressure)',
    modalClose: 'Close',
    popup: {
      compressor: {
        title: 'The compressor',
        desc: 'Cool gas flows into the compressor. The compressor squeezes it. Hot, high-pressure gas streams out toward the indoor coil.',
        analogy:
          "💡 Think of a bicycle pump — when you squeeze air into a tight space, it heats up. That's what the compressor does to the refrigerant.",
        disclaimer:
          'This is a conceptual animation — your system works on the same principle, but the internal mechanics differ.',
        labels: {
          coolIn: '← Cool gas in',
          hotOut: '← Hot compressed gas out',
          cool: 'Cool · Low pressure',
          warming: 'Warming · Pressure rising',
          hot: 'Hot · High pressure',
          chamberLabel: 'Compression chamber',
        },
      },
      expansion: {
        title: 'The expansion valve',
        desc: 'Hot liquid packed tight on the high-pressure side. It squeezes through the orifice and escapes into the low-pressure side — spreading out and cooling down.',
        analogy:
          '💡 Like spraying a compressed deodorant can — the gas expands and the nozzle gets ice cold. The expansion valve works the same way.',
        disclaimer:
          'This is a conceptual animation — your system works on the same principle, but the internal mechanics differ.',
        labels: {
          warm: 'Hot · High pressure',
          cold: 'Cold · Low pressure',
          lowPressureSide: 'Low-pressure side',
        },
      },
    },
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
