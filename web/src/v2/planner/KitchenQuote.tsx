import { useEffect, useState } from "react";
import { request } from "../api";
import { Feedback } from "../ui";
import {
  kitchenOptions,
  type KitchenEstimate,
  type KitchenQuoteOptions,
} from "../../../../src/core/kitchen-configuration";
import type { Draft } from "./model";

const money = (v: number) =>
  `${v.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;
export function KitchenQuote({
  draft,
  onChange,
  disabled,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  disabled: boolean;
}) {
  const key = JSON.stringify(draft);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: KitchenEstimate;
    error?: string;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  useEffect(() => {
    if (disabled) return;
    const c = new AbortController();
    const timer = setTimeout(() => {
      request<KitchenEstimate>("/api/public/kitchen-estimate", {
        method: "POST",
        body: key,
        signal: c.signal,
      })
        .then((data) => {
          if (!c.signal.aborted) setResult({ key, data });
        })
        .catch((e) => {
          if (!c.signal.aborted)
            setResult({ key, error: (e as Error).message });
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [key, disabled, attempt]);
  const current = result?.key === key ? result : null;
  const data = disabled ? undefined : current?.data;
  const select = (field: "front" | "worktop" | "drawers", label: string) => (
    <label className="kp-quote-field">
      {label}
      <select
        value={draft.quote[field]}
        disabled={disabled}
        onChange={(e) =>
          onChange({
            ...draft,
            quote: {
              ...draft.quote,
              [field]: e.target.value,
            } as KitchenQuoteOptions,
          })
        }
      >
        {Object.entries(kitchenOptions[field]).map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
  const download = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const blob = await request<Blob>(
        "/api/public/kitchen-estimate/pdf",
        { method: "POST", body: key },
        "pdf",
      );
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "Pan-Stolarz-wstepna-wycena-kuchni.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setDownloadError((e as Error).message);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <section className="kp-quote" aria-labelledby="kp-quote-title">
      <h2 id="kp-quote-title">Twoja wstępna wycena</h2>
      <div className="kp-quote-price" aria-live="polite" aria-atomic="true">
        <span>CENA KALKULACYJNA CAŁOŚCI</span>
        <strong>
          {disabled
            ? "Popraw układ"
            : data?.gross != null
              ? money(data.gross)
              : current?.error
                ? "Cena niedostępna"
                : data?.status === "blocked"
                  ? "Uzupełnij szkic"
                  : "Obliczamy cenę…"}
        </strong>
        <small>
          brutto ·{" "}
          {draft.quote.installation
            ? "z transportem lokalnym i montażem"
            : "z transportem lokalnym, bez montażu"}
        </small>
      </div>
      <fieldset disabled={downloading}>
        <legend>Materiały i wyposażenie</legend>
        {select("front", "Wykończenie frontów")}
        {select("worktop", "Rodzaj blatu")}
        {select("drawers", "Szuflady i zawiasy")}
        <label className="kp-quote-check">
          <input
            type="checkbox"
            checked={draft.quote.installation}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...draft,
                quote: { ...draft.quote, installation: e.target.checked },
              })
            }
          />{" "}
          Z montażem mebli
        </label>
      </fieldset>

      {data?.status === "estimated" && (
        <>
          <dl className="kp-quote-groups">
            {data.groups.map((g) => (
              <div key={g.label}>
                <dt>{g.label}</dt>
                <dd>{money(g.gross)}</dd>
              </div>
            ))}
          </dl>
          <p className="kp-muted">
            Cena orientacyjna na stawkach modelowych. Potwierdzimy ją po
            pomiarze i wyborze materiałów.
          </p>
          <details>
            <summary>Zakres i założenia wyceny</summary>
            {data.notes.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </details>
        </>
      )}
      {data?.issues.map((issue) => (
        <p key={issue} className="kp-muted">
          {issue}
        </p>
      ))}
      {current?.error && !disabled && (
        <Feedback>
          {current.error}{" "}
          <button
            className="ps-text-button"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Ponów wycenę
          </button>
        </Feedback>
      )}
      <button
        className="ps-button"
        onClick={download}
        disabled={disabled || downloading || data?.status !== "estimated"}
      >
        {downloading ? "Przygotowujemy PDF…" : "Pobierz wycenę PDF"}
      </button>
      {downloadError && <Feedback>{downloadError}</Feedback>}
      <p className="kp-muted">
        PDF: wycena i zakres na pierwszej stronie, projekt z wymiarami na
        drugiej. Bez AGD, zlewu, baterii i podłączeń.
      </p>
    </section>
  );
}
