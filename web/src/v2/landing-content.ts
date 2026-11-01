// Public copy adapted from the files supplied on 1 November 2026.
// Pending business/legal decisions and private source details are not published.
export const HOME_TITLE =
  "Meble na wymiar Zielona Góra — kuchnie, garderoby · Pan Stolarz";
export const HOME_DESCRIPTION =
  "Kuchnie, garderoby, szafy i zabudowy na wymiar. Przed produkcją widzisz mebel w 3D. Zielona Góra i okolice.";
export const PHONE = { label: "572 548 957", href: "tel:+48572548957" };
export const AREAS = [
  "Zielona Góra",
  "Nowa Sól",
  "Sulechów",
  "Świebodzin",
  "Głogów",
  "Lubin",
  "Polkowice",
  "Legnica",
];
export const SERVICES = [
  {
    kind: "kuchnia",
    title: "Kuchnie na wymiar",
    text: "Szafki, słupki na AGD, narożniki i szuflady systemowe zaplanowane centymetr po centymetrze. Zanim zamówisz, widzisz w 3D, gdzie stanie zmywarka, kosz i każda szuflada.",
  },
  {
    kind: "szafa",
    title: "Garderoby i szafy",
    text: "Szafy wnękowe, garderoby i zabudowy pod skosem. Wnętrze planujemy pod Twoje ubrania: drążki, półki, szuflady i miejsce na walizki.",
  },
  {
    kind: "inne",
    title: "Zabudowy wnęk",
    text: "Wnęki, przestrzeń pod schodami, zabudowy RTV i przedpokoje. Wykorzystujemy miejsca, z którymi gotowe meble sobie nie radzą.",
  },
];
export const PROCESS = [
  {
    title: "Rozmowa i pomiar",
    text: "Przyjeżdżamy i mierzymy sami. Sprawdzamy piony, kąty i podłogę, bo to one decydują o wymiarach, nie rzut z planu.",
  },
  {
    title: "Projekt i wizualizacja 3D",
    text: "Projektujemy mebel i renderujemy go w Twoim wnętrzu: z materiałami, frontami i otwartymi szufladami. Wizualizacja jest w cenie wyceny.",
  },
  {
    title: "Wycena i umowa",
    text: "Dostajesz wycenę do konkretnego projektu.",
  },
  {
    title: "Dokumentacja produkcyjna",
    text: "Każda formatka, czyli każdy element płyty, ma swój rysunek: wymiary, okleinowanie, otwory i okucia.",
  },
  {
    title: "Produkcja",
    text: "Tniemy i składamy według dokumentacji. Fronty wymiarujemy na miejscu, żeby szczeliny wyszły równe.",
  },
  {
    title: "Montaż i odbiór",
    text: "Montujemy według rysunków montażowych. Na odbiorze sprawdzamy z Tobą każdą szufladę i każde drzwi.",
  },
];
export const FAQ = [
  {
    question: "Ile kosztuje kuchnia albo szafa na wymiar?",
    answer:
      "Zależy od wymiarów, materiału frontów, okuć i liczby szuflad. Dlatego wycenę przygotowujemy do konkretnego projektu, po pomiarze, razem z wizualizacją 3D.",
  },
  {
    question: "Czy mogę zmienić projekt po zobaczeniu wizualizacji?",
    answer:
      "Tak. Po to jest wizualizacja: zmieniasz kolor, układ szuflad czy wysokość szafek, zanim cokolwiek wytniemy.",
  },
  {
    question: "Czy mogę zmierzyć sam i przysłać wymiary?",
    answer:
      "Wyślij je. Wystarczą do wstępnej wyceny. Do produkcji mierzymy zawsze sami, bo ściany rzadko są proste, a kilka milimetrów decyduje o tym, czy szafka wejdzie i czy szczeliny frontów będą równe.",
  },
  {
    question: "Laminat, lakier czy fornir na fronty?",
    answer:
      "Laminat jest odporny i tańszy. Lakier daje gładką, jednolitą powierzchnię i więcej kolorów, ale kosztuje więcej i dłużej się go robi. Fornir to prawdziwe drewno. Na pomiarze pokażemy próbki, a w wizualizacji zobaczysz wybrany dekor we własnym wnętrzu.",
  },
];
export const PENDING_CONTENT = {
  fixedPriceClause: null,
  guarantee: null,
  timeline: null,
  installationDuration: null,
  measurementFee: null,
  travelFee: null,
  bathroomOffer: null,
  documentOwnership: null,
  extraAbout: null,
  reviews: null,
  gallery: null,
  email: null,
  domain: null,
  responseTime: null,
  privacyPolicy: null,
};
export const BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: "Pan Stolarz",
  description:
    "Kuchnie, garderoby, szafy i zabudowy na wymiar z wizualizacją 3D i dokumentacją produkcyjną.",
  telephone: "+48572548957",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Zielona Góra",
    addressRegion: "lubuskie",
    addressCountry: "PL",
  },
  areaServed: AREAS.map((name) => ({ "@type": "City", name })),
};
