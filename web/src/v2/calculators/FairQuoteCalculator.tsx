import { useEffect, useRef, useState } from "react";
import {
  fairQuote,
  fairQuoteSchema,
  type FairQuoteInput,
  type FairQuoteResult,
} from "../../../../src/core/fair-quote";
import { request } from "../api";
import { Feedback } from "../ui";
import { readDraft, STORAGE_KEY } from "../planner/model";
import type { fairKitchenSource } from "../../../../src/server/fair-kitchen-quote";
import "./calculators.css";
type Source = ReturnType<typeof fairKitchenSource>;
const defaults: Record<keyof FairQuoteInput, string> = {
  materialsNet: "",
  preparationNet: "0",
  productionHours: "",
  productionHourCostNet: "",
  overheadNet: "0",
  installationNet: "0",
  transportNet: "0",
  boughtWorktopNet: "0",
  worktopMarkupPercent: "10",
  materialMultiplier: "2",
  reservePercent: "3",
  minimumMarginPercent: "15",
  targetMarginPercent: "25",
  minimumProfitNet: "500",
  minimumOrderNet: "1500",
  vatPercent: "23",
  roundGrossTo: "50",
};
const money = (n: number) =>
  n.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 2,
  });
const percent = (n: number) =>
  `${n.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`;
const costFields: [keyof FairQuoteInput, string, string][] = [
  [
    "materialsNet",
    "Materiały i okucia netto (zł)",
    "Płyty z odpadem, fronty, obrzeże, AMIX, zawiasy Häfele, nóżki AXILO i materiały pomocnicze. Bez blatu z osobnej pozycji.",
  ],
  [
    "preparationNet",
    "Cięcie, oklejanie i inne usługi netto (zł)",
    "Aktualna oferta lub faktura dostawcy. Usługa oklejania i taśma tylko raz.",
  ],
  [
    "productionHours",
    "Produkcja — osobogodziny",
    "Dwie osoby po 8 godzin = 16 osobogodzin. Uwzględnij pomiar, projekt, przygotowanie, składanie i pakowanie.",
  ],
  [
    "productionHourCostNet",
    "Pełny koszt osobogodziny netto (zł)",
    "Twoje wynagrodzenie / pracownicy i przypadające koszty warsztatu. To koszt, nie stawka sprzedaży z doliczonym zyskiem.",
  ],
  [
    "installationNet",
    "Koszt montażu netto (zł)",
    "Koszt całej ekipy i zlecenia. Wpisz 0 dla oferty bez montażu.",
  ],
  [
    "transportNet",
    "Koszt transportu netto (zł)",
    "Dostawy, dojazdy, wniesienie — zakres tego zlecenia.",
  ],
  [
    "boughtWorktopNet",
    "Kupowany blat / element zewnętrzny netto (zł)",
    "Wyłączony z mnożnika ×2; np. blat od kamieniarza. Nie wpisuj go ponownie do materiałów.",
  ],
  [
    "overheadNet",
    "Pozostałe koszty zlecenia netto (zł)",
    "Wyłącznie koszty nieujęte w osobogodzinie i pozostałych pozycjach.",
  ],
];
const policyFields: [keyof FairQuoteInput, string][] = [
  ["materialMultiplier", "Mnożnik materiałów z przygotowaniem"],
  ["minimumMarginPercent", "Minimalna marża od ceny netto (%)"],
  ["targetMarginPercent", "Docelowa marża od ceny netto (%)"],
  ["minimumProfitNet", "Minimalny zysk kalkulacyjny netto (zł)"],
  ["minimumOrderNet", "Minimalna cena zlecenia netto (zł)"],
  ["reservePercent", "Jednorazowa rezerwa na ryzyko (%)"],
  ["worktopMarkupPercent", "Narzut na kupowany blat (%)"],
  ["vatPercent", "VAT do tej symulacji (%)"],
  ["roundGrossTo", "Zaokrąglenie brutto w górę do (zł, 0 = bez)"],
];
export function FairQuoteCalculator() {
  const [form, setForm] = useState(defaults),
    [result, setResult] = useState<FairQuoteResult | null>(null),
    [source, setSource] = useState<Source | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const controller = useRef<AbortController | null>(null),
    heading = useRef<HTMLHeadingElement>(null),
    formRef = useRef<HTMLFormElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const edit = (key: keyof FairQuoteInput, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setResult(null);
    setErrors((e) => ({ ...e, [key]: "" }));
    setError("");
  };
  const calculate = () => {
    const raw = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [
        k,
        v.trim() ? Number(v.replace(",", ".")) : NaN,
      ]),
    );
    const parsed = fairQuoteSchema.safeParse(raw);
    if (!parsed.success) {
      const next = Object.fromEntries(
        parsed.error.issues.map((i) => [
          String(i.path[0]),
          i.code === "custom"
            ? i.message
            : i.code === "too_small"
              ? `Minimalna wartość: ${i.minimum}.`
              : i.code === "too_big"
                ? `Maksymalna wartość: ${i.maximum}.`
                : "Wpisz poprawną liczbę; użyj 0, jeśli tej pozycji nie ma.",
        ]),
      );
      setErrors(next);
      setError(
        "Sprawdź wskazane pola. Koszty wpisuj netto, a marżę jako procent ceny sprzedaży.",
      );
      setResult(null);
      formRef.current
        ?.querySelector<HTMLInputElement>(
          `[name="${parsed.error.issues[0].path[0]}"]`,
        )
        ?.focus();
      return;
    }
    setErrors({});
    setError("");
    setResult(fairQuote(parsed.data));
    requestAnimationFrame(() => heading.current?.focus());
  };
  const load = async () => {
    if (busy) return;
    setError("");
    setBusy(true);
    setResult(null);
    const c = new AbortController();
    controller.current?.abort();
    controller.current = c;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw)
        throw new Error(
          "Najpierw zaprojektuj kuchnię w kreatorze albo wpisz koszty ręcznie.",
        );
      const draft = readDraft(raw);
      const s = await request<Source>("/api/v2/kitchen-pricing-source", {
        method: "POST",
        body: JSON.stringify(draft),
        signal: c.signal,
      });
      if (c.signal.aborted) return;
      setSource(s);
      setForm((f) => ({
        ...f,
        ...Object.fromEntries(
          costFields.map(([k]) => [k, String(s.inputs[k])]),
        ),
      }));
      setResult(null);
      setErrors({});
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  };
  const field = (key: keyof FairQuoteInput, label: string, help?: string) => (
    <label key={key} htmlFor={`fq-${key}`}>
      <span id={`fq-label-${key}`}>{label}</span>
      <input
        id={`fq-${key}`}
        name={key}
        aria-labelledby={`fq-label-${key}`}
        inputMode="decimal"
        value={form[key]}
        onChange={(e) => edit(key, e.target.value)}
        aria-invalid={!!errors[key]}
        aria-describedby={help || errors[key] ? `fq-help-${key}` : undefined}
      />
      {(help || errors[key]) && (
        <small
          id={`fq-help-${key}`}
          className={errors[key] ? "ps-field-error" : ""}
        >
          {errors[key] || help}
        </small>
      )}
    </label>
  );
  return (
    <section className="pc-main fq-page">
      <header className="fq-heading">
        <div>
          <span className="ps-eyebrow">Wycena wewnętrzna · właściciel</span>
          <h1>Materiał ×2 i kontrola zarobku</h1>
          <p>
            Mnożnik jest punktem startowym. Sprawdzamy koszty, minimalny zarobek
            i cenę wynikającą z docelowej marży.
          </p>
        </div>
        <a className="ps-button secondary" href="#/kreator-kuchni">
          Otwórz kreator kuchni
        </a>
      </header>
      <div className="fq-toolbar">
        <button className="ps-button secondary" disabled={busy} onClick={load}>
          {busy ? "Wczytywanie kosztów…" : "Wczytaj koszty bieżącej kuchni"}
        </button>
        <button
          className="ps-text-button"
          disabled={busy}
          onClick={() => {
            setForm({
              ...defaults,
              materialsNet: "5000",
              preparationNet: "800",
              productionHours: "24",
              productionHourCostNet: "70",
              installationNet: "1400",
              transportNet: "250",
              boughtWorktopNet: "1200",
            });
            setSource(null);
            setResult(null);
            setError("");
            setErrors({});
          }}
        >
          Wstaw przykład do porównania
        </button>
      </div>
      {source && (
        <Feedback>
          {source.source}. {source.cabinets} elementów; dotychczasowa oferta:{" "}
          {money(source.legacyGross!)}. Wczytane liczby możesz poprawić;
          źródłowy projekt pozostaje bez zmian.
        </Feedback>
      )}
      {error && <Feedback>{error}</Feedback>}
      <div className="fq-layout">
        <form
          ref={formRef}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            calculate();
          }}
        >
          <fieldset disabled={busy}>
            <legend>Koszty i czas tej realizacji</legend>
            <p>
              Kwoty netto. Zysk policzymy po zapłaceniu za Twoją pracę. Dane
              pozostają w tej karcie, dopóki nie pobierzesz kalkulacji.
            </p>
            <div className="pc-number-grid fq-fields">
              {costFields.map(([k, l, h]) => field(k, l, h))}
            </div>
            <details className="fq-policy">
              <summary>Zasady ceny i minimalnego zarobku</summary>
              <p>
                Startowo: mnożnik 2, minimalna marża 15%, docelowa 25%, rezerwa
                3%. To parametry robocze do dopasowania do firmy. Marża 25%
                oznacza dzielenie kosztu przez 0,75, a nie dodanie 25% do
                kosztu.
              </p>
              <div className="pc-number-grid fq-fields">
                {policyFields.map(([k, l]) => field(k, l))}
              </div>
            </details>
            <button className="ps-button" type="submit">
              Oblicz cenę i zarobek
            </button>
          </fieldset>
        </form>
        <aside className="fq-result" aria-live="polite">
          {result ? (
            <>
              <h2 ref={heading} tabIndex={-1}>
                Proponowana cena: {money(result.gross)} brutto
              </h2>
              <p>
                {money(result.net)} netto + {money(result.vat)} VAT
              </p>
              <dl>
                <div>
                  <dt>Zysk po kosztach pracy i rezerwie</dt>
                  <dd>{money(result.profitNet)} netto</dd>
                </div>
                <div>
                  <dt>Marża kalkulacyjna</dt>
                  <dd>{percent(result.marginPercent)}</dd>
                </div>
                <div>
                  <dt>Koszty wraz z rezerwą</dt>
                  <dd>{money(result.costs.protectedCostNet)} netto</dd>
                </div>
                <div>
                  <dt>W tym Twoja praca / produkcja</dt>
                  <dd>{money(result.costs.productionNet)} netto</dd>
                </div>
              </dl>
              <p className="fq-decision">
                {result.adjustment === "floor"
                  ? "Podniesiono do minimum zarobku — samo ×2 byłoby za niskie."
                  : result.adjustment === "cap"
                    ? "Ograniczono mnożnik do ceny wynikającej z kosztów i docelowej marży."
                    : "Mnożnik mieści się w przedziale kosztów i zarobku."}
              </p>
              <table>
                <caption>Porównanie metod — ta sama realizacja</caption>
                <thead>
                  <tr>
                    <th>Metoda</th>
                    <th>Cena brutto</th>
                  </tr>
                </thead>
                <tbody>
                  {source && (
                    <tr>
                      <td>Dotychczasowy kalkulator kuchni</td>
                      <td>{money(source.legacyGross!)}</td>
                    </tr>
                  )}
                  <tr>
                    <td>
                      Materiały z przygotowaniem ×{form.materialMultiplier},
                      osobno blat, montaż i transport
                    </td>
                    <td>{money(result.multiplier.gross)}</td>
                  </tr>
                  <tr>
                    <td>Po kontroli kosztów i zarobku</td>
                    <td>{money(result.gross)}</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Przy samym mnożniku zysk po rezerwie wyniósłby{" "}
                {money(result.multiplier.profitNet)} netto (
                {percent(result.multiplier.marginPercent)}).
              </p>
              {result.warnings.map((w) => (
                <p className="fq-note" key={w}>
                  {w}
                </p>
              ))}
              <button
                className="ps-button secondary"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob(
                      [
                        JSON.stringify(
                          {
                            type: "pan-stolarz-internal-quote",
                            ...result,
                            source: source
                              ? {
                                  label: source.source,
                                  legacyGross: source.legacyGross,
                                }
                              : null,
                          },
                          null,
                          2,
                        ),
                      ],
                      { type: "application/json" },
                    ),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "Pan-Stolarz-kalkulacja-wewnetrzna.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Pobierz kalkulację wewnętrzną JSON
              </button>
            </>
          ) : (
            <>
              <h2>Cena i zarobek</h2>
              <p>
                Wpisz koszty albo wczytaj kuchnię, a potem wybierz Oblicz cenę i
                zarobek. Zmiana pola ukrywa poprzedni wynik.
              </p>
            </>
          )}
        </aside>
      </div>
      <details className="fq-assumptions">
        <summary>Jak liczymy i co trzeba sprawdzić?</summary>
        <p>
          Materiał oznacza zakupione komponenty mebla oraz usługi przygotowania
          formatek. Mnożnik finansuje produkcję i część zarobku; pełnej
          robocizny produkcji nie doliczamy do niego drugi raz. Sprawdzamy
          jednak, czy ją pokrywa.
        </p>
        <p>
          Dolny próg to koszty z rezerwą podzielone przez (1 − minimalna marża),
          co najmniej koszt plus minimalny zysk oraz minimum zlecenia. Gdy ×2
          daje nadmierną cenę, ograniczamy ją do kosztów z docelową marżą; dolny
          próg zawsze ma pierwszeństwo. Na końcu naliczamy VAT i zaokrąglenie w
          górę.
        </p>
        <p>
          Blat z osobnej pozycji nie jest mnożony ×2. Każdy koszt wpisujesz
          tylko raz. Wynik nie potwierdza rentowności, gdy brakuje realnych
          faktur, godzin pracy lub kosztów stałych.
        </p>
        {source?.notes.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </details>
      <p className="fq-note">
        Symulator właściciela. Obliczenie ani pobranie pliku nie zmienia
        publicznego cennika, zapisanych ofert i zamówień.
      </p>
    </section>
  );
}
