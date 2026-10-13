/**
 * Jedyne miejsce z danymi produktu, cenami, dostawą i treściami sklepu.
 *
 * Wartości `null` oznaczają dane, których jeszcze nie potwierdzono.
 * Strona pokazuje je jako „do potwierdzenia” i nie udaje, że są gotowe.
 * Przed sprzedażą uzupełnij je zgodnie z README.md, sekcja „Przed uruchomieniem sprzedaży”.
 */

export const brand = {
  /** Nazwa sklepu (nie producenta produktu). */
  name: 'Sonno',
  /** `draft` pokazuje w stopce oznaczenie wersji roboczej. Zmień na `live` po wdrożeniu. */
  status: 'draft' as 'draft' | 'live',
} as const;

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const densityKgM3 = 45;

export const product = {
  /** Nazwa produktu podana przez właściciela sklepu. */
  name: 'JUSKYS XL — poduszka ortopedyczna z pianką memory',
  shortName: 'JUSKYS XL',
  headline: 'Komfort, który dopasowuje się do Twojego snu.',
  description:
    'Ergonomiczna poduszka z pianką memory, zaprojektowana z myślą o wygodnym podparciu głowy i szyi.',
  /** Kod EAN z ogłoszenia sprzedawcy. */
  ean: '5902600372844',
  /** Wymiary przybliżone, według opisu produktu (długość × szerokość × wysokość). */
  dimensionsCm: { length: 63, width: 41, height: 14 },
  weightKg: 1.16,
  densityKgM3,
  colour: 'biały / szary',
  filling: `pianka PU Memory Foam, gęstość ok. ${densityKgM3} kg/m³`,
  cover: 'poliester, zdejmowany',
  coverRemovable: true,
  /** Określenie z opisu sprzedawcy, nie certyfikat. Zweryfikuj przed publikacją reklam. */
  antiallergic: true,
  careCover: 'Pokrowiec zdejmij i wypierz zgodnie z zaleceniami na metce.',
  careCore: 'Rdzenia z pianki Memory Foam nie wolno prać ani wystawiać na bezpośrednie działanie promieni słonecznych.',
} as const;

/** Najważniejsze cechy, wyłącznie zweryfikowane z opisu produktu. */
export const keyFeatures = [
  'Wymiary około 63 × 41 × 14 cm',
  'Wypełnienie: pianka PU Memory Foam, gęstość ok. 45 kg/m³',
  'Pokrowiec z poliestru, zdejmowany',
  'Kolor biały / szary, waga około 1,16 kg',
] as const;

export const pricing = {
  currency: 'PLN',
  /** Cena jednej poduszki (brutto, zł). */
  singlePrice: 199,
  /** Liczba sztuk w zestawie. */
  bundleQuantity: 2,
  /** Cena zestawu (brutto, zł). */
  bundlePrice: 349,
} as const;

export const packageCopy = {
  single: {
    title: '1 poduszka',
    ctaLabel: 'Kup 1 poduszkę',
  },
  bundle: {
    title: '2 poduszki',
    ctaLabel: 'Kup zestaw 2 szt.',
    badge: 'Polecany wybór',
  },
} as const;

export type SenderData = {
  name: string;
  street: string;
  buildingNumber: string;
  city: string;
  postCode: string;
  email: string;
  phone: string;
};

/** Dane firmy do stopki i nadawcy przesyłek. `null` = do potwierdzenia. */
export const business = {
  legalName: null as string | null,
  address: null as string | null,
  email: null as string | null,
  phone: null as string | null,
  taxId: null as string | null,
  /** Adres nadawcy do ShipX. Bez kompletu danych przesyłki nie są tworzone. */
  sender: null as SenderData | null,
} as const;

/**
 * Dostawa InPost. `priceGross` w zł brutto. `null` = metoda niedostępna do czasu potwierdzenia ceny.
 * Kurier pojawia się w sklepie dopiero po ustawieniu jego ceny.
 */
export const shipping = {
  paczkomat: {
    label: 'Paczkomat InPost',
    description: 'Odbiór w wybranym paczkomacie InPost.',
    priceGross: null as number | null,
    service: 'inpost_locker_standard',
  },
  kurier: {
    label: 'Kurier InPost',
    description: 'Dostawa kurierem pod wskazany adres.',
    priceGross: null as number | null,
    service: 'inpost_courier_standard',
  },
  /** Rozmiar paczki dla ShipX. `weightKg` zostaje `null`, dopóki nie potwierdzisz ciężaru z opakowaniem. */
  parcel: {
    template: 'large' as const,
    weightKg: null as number | null,
  },
} as const;

/**
 * Ustawienia płatności (Stripe Checkout). Metody płatności (karta, BLIK, Przelewy24) wybiera się w Dashboardzie Stripe.
 * Opcjonalnie wskaż konfigurację przez zmienną STRIPE_PAYMENT_METHOD_CONFIGURATION.
 */
export const checkout = {
  currency: 'pln' as const,
  /** Czas życia sesji płatności w minutach (min. 30 wg Stripe). */
  sessionMinutes: 60,
};

/** Zasady zwrotów do potwierdzenia. `null` = nie publikujemy terminów, których nie potwierdzono. */
export const returnsPolicy = {
  summary: null as string | null,
  pending: 'Zasady zwrotów opublikujemy przed uruchomieniem sprzedaży.',
} as const;

export type ServiceItem = {
  id: string;
  title: string;
  value: string | null;
  pending: string;
};

export const service: ServiceItem[] = [
  {
    id: 'dostawa',
    title: 'Dostawa',
    value: null,
    pending: 'Ceny dostawy InPost pojawią się tutaj po ich potwierdzeniu.',
  },
  {
    id: 'zwroty',
    title: 'Zwroty',
    value: returnsPolicy.summary,
    pending: returnsPolicy.pending,
  },
  {
    id: 'platnosci',
    title: 'Płatności',
    value: null,
    pending: 'Płatności online pojawią się po uruchomieniu płatności.',
  },
  {
    id: 'obsluga',
    title: 'Obsługa klienta',
    value: null,
    pending: 'Dane kontaktowe obsługi znajdziesz w stopce po ich uzupełnieniu.',
  },
];

/** Zdjęcia i wideo galerii. `photosVerified` = true dopiero po podmianie na prawdziwe zdjęcia produktu. */
export const media = {
  photosVerified: false,
} as const;

export type GalleryItem =
  | {
      kind: 'image';
      id: string;
      src: string;
      thumb: string;
      width: number;
      height: number;
      alt: string;
      caption: string;
    }
  | {
      kind: 'video';
      id: string;
      src: string;
      webm: string;
      poster: string;
      thumb: string;
      width: number;
      height: number;
      alt: string;
      caption: string;
    }
  | {
      kind: 'diagram';
      id: string;
      alt: string;
      caption: string;
    };

export const gallery: GalleryItem[] = [
  {
    kind: 'image',
    id: 'sypialnia',
    src: '/images/hero-bedroom-square.webp',
    thumb: '/images/thumbs/hero-bedroom-square.webp',
    width: 1024,
    height: 1024,
    alt: 'Poduszka JUSKYS XL na łóżku w jasnej sypialni. Grafika poglądowa.',
    caption: 'Sypialnia',
  },
  {
    kind: 'image',
    id: 'ksztalt',
    src: '/images/product-ivory-studio.webp',
    thumb: '/images/thumbs/product-ivory-studio.webp',
    width: 1024,
    height: 1024,
    alt: 'Kształt poduszki JUSKYS XL na kremowym tle. Grafika poglądowa.',
    caption: 'Kształt',
  },
  {
    kind: 'image',
    id: 'pokrowiec',
    src: '/images/detail-contour-fabric.webp',
    thumb: '/images/thumbs/detail-contour-fabric.webp',
    width: 1024,
    height: 1024,
    alt: 'Zbliżenie na tkaninę pokrowca i kontur poduszki. Grafika poglądowa.',
    caption: 'Pokrowiec',
  },
  {
    kind: 'diagram',
    id: 'wymiary',
    alt: 'Wymiary poduszki: 63 cm długości, 41 cm szerokości, 14 cm wysokości.',
    caption: 'Wymiary',
  },
  {
    kind: 'video',
    id: 'film',
    src: '/videos/cinematic-pillow-16x9.mp4',
    webm: '/videos/cinematic-pillow-16x9.webm',
    poster: '/images/hero-bedroom-16x9.webp',
    thumb: '/images/thumbs/cinematic-poster.webp',
    width: 1280,
    height: 720,
    alt: 'Krótki film: poduszka na łóżku w naturalnym świetle. Bez dźwięku.',
    caption: 'Film',
  },
  {
    kind: 'image',
    id: 'odpoczynek',
    src: '/images/lifestyle-resting-person.webp',
    thumb: '/images/thumbs/lifestyle-resting-person.webp',
    width: 1024,
    height: 1024,
    alt: 'Osoba odpoczywa na poduszce JUSKYS XL. Grafika poglądowa.',
    caption: 'Odpoczynek',
  },
  {
    kind: 'image',
    id: 'bok',
    src: '/images/sleep-side-position.webp',
    thumb: '/images/thumbs/sleep-side-position.webp',
    width: 1024,
    height: 1024,
    alt: 'Osoba śpiąca na boku z głową na poduszce JUSKYS XL. Grafika poglądowa.',
    caption: 'Sen na boku',
  },
  {
    kind: 'image',
    id: 'plecy',
    src: '/images/sleep-back-position.webp',
    thumb: '/images/thumbs/sleep-back-position.webp',
    width: 1024,
    height: 1024,
    alt: 'Osoba leżąca na plecach z głową na poduszce JUSKYS XL. Grafika poglądowa.',
    caption: 'Sen na plecach',
  },
  {
    kind: 'image',
    id: 'zestaw',
    src: '/images/bundle-two-pillows.webp',
    thumb: '/images/thumbs/bundle-two-pillows.webp',
    width: 1024,
    height: 1024,
    alt: 'Dwie identyczne poduszki JUSKYS XL na jasnej pościeli. Grafika poglądowa.',
    caption: 'Zestaw 2 szt.',
  },
  {
    kind: 'image',
    id: 'wnetrze',
    src: '/images/editorial-bedroom-wide.webp',
    thumb: '/images/thumbs/editorial-bedroom-wide.webp',
    width: 1024,
    height: 1024,
    alt: 'Spokojna, minimalistyczna sypialnia z poduszką JUSKYS XL. Grafika poglądowa.',
    caption: 'Wnętrze',
  },
];

export type InfoPage = { title: string; intro: string };

/** Podstrony linkowane w stopce. Treść prawna musi zostać przygotowana i zatwierdzona przed sprzedażą. */
export const infoPages: Record<'dostawa' | 'zwroty' | 'prywatnosc' | 'regulamin', InfoPage> = {
  dostawa: {
    title: 'Dostawa',
    intro: 'Terminy, koszty i sposoby dostawy zostaną opublikowane przed uruchomieniem sprzedaży.',
  },
  zwroty: {
    title: 'Zwroty',
    intro: 'Zasady zwrotów zostaną opublikowane przed uruchomieniem sprzedaży.',
  },
  prywatnosc: {
    title: 'Polityka prywatności',
    intro: 'Treść polityki prywatności jest w przygotowaniu i nie została jeszcze zatwierdzona.',
  },
  regulamin: {
    title: 'Regulamin',
    intro: 'Regulamin sklepu jest w przygotowaniu i nie został jeszcze zatwierdzony.',
  },
};

/** Wartości przekazywane do odpowiedzi FAQ. Liczone z tej samej konfiguracji co reszta strony. */
export type FaqValues = {
  dimensions: string;
  density: number;
  singlePrice: string;
  bundlePrice: string;
  bundleUnitPrice: string;
  bundleSavings: string;
  paczkomatPrice: string;
  paymentsLine: string;
};

export type FaqEntry = { question: string; answer: (values: FaqValues) => string };

export const faq: FaqEntry[] = [
  {
    question: 'Jakie wymiary ma poduszka?',
    answer: ({ dimensions }) =>
      `Według opisu produktu wymiary wynoszą około ${dimensions} (długość × szerokość × wysokość). To dane przybliżone.`,
  },
  {
    question: 'Czym jest pianka memory?',
    answer: ({ density }) =>
      `Pianka memory to elastyczna pianka poliuretanowa. Pod wpływem nacisku powoli dopasowuje się do kształtu głowy i szyi, a po zmianie pozycji wraca do pierwotnej formy. Gęstość pianki w tym modelu wynosi około ${density} kg/m³.`,
  },
  {
    question: 'Jak dbać o poduszkę?',
    answer: () =>
      'Pokrowiec zdejmij i wypierz zgodnie z zaleceniami na metce. Rdzenia z pianki memory nie wolno prać ani wystawiać na bezpośrednie działanie promieni słonecznych. Poduszkę suszysz w przewiewnym miejscu.',
  },
  {
    question: 'Czy pokrowiec można zdjąć i wyprać?',
    answer: () =>
      'Tak. Pokrowiec z poliestru jest zdejmowany. Dokładne zalecenia dotyczące prania znajdziesz na metce produktu.',
  },
  {
    question: 'Który zestaw wybrać?',
    answer: ({ singlePrice, bundlePrice, bundleUnitPrice, bundleSavings }) =>
      `Jeśli potrzebujesz jednej poduszki, wybierz wariant 1 sztuki za ${singlePrice}. Zestaw 2 szt. za ${bundlePrice} to ${bundleUnitPrice} za sztukę, czyli oszczędność ${bundleSavings} względem zakupu dwóch pojedynczych sztuk.`,
  },
  {
    question: 'Jak wygląda dostawa?',
    answer: ({ paczkomatPrice }) =>
      `Dostarczamy przez InPost. Dostawa do paczkomatu kosztuje ${paczkomatPrice}. Numer przesyłki wyślemy e-mailem, gdy paczka zostanie nadana.`,
  },
  {
    question: 'Jakie są metody płatności?',
    answer: ({ paymentsLine }) => paymentsLine,
  },
  {
    question: 'Jak wygląda zwrot?',
    answer: () =>
      'Zasady zwrotów opublikujemy przed uruchomieniem sprzedaży. Na tym etapie nie podajemy terminów, których jeszcze nie możemy potwierdzić.',
  },
];
