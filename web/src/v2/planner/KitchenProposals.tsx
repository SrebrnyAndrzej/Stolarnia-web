import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconCheck, IconX } from "@tabler/icons-react";
import type { KitchenProposal } from "../../../../src/core/kitchen-proposals";
import { useKitchenEstimate, kitchenMoney } from "./useKitchenEstimate";
import type { Draft } from "./model";
import { Feedback } from "../ui";

function ProposalCard({
  proposal,
  active,
  disabled,
  first,
  onUse,
}: {
  proposal: KitchenProposal<Draft>;
  active: boolean;
  disabled: boolean;
  first: boolean;
  onUse: () => void;
}) {
  const estimate = useKitchenEstimate(proposal.draft, disabled);
  const { stats } = proposal;
  return (
    <article
      className="kp-proposal-card"
      data-active={active}
      aria-label={proposal.title}
    >
      <span className="kp-proposal-kicker">
        {first ? "Twój wybrany priorytet" : "Inna możliwość"}
      </span>
      <h3>{proposal.title}</h3>
      <p>{proposal.description}</p>
      <div className="kp-proposal-price" aria-live="polite" aria-atomic="true">
        <strong>
          {disabled
            ? "Odśwież propozycje"
            : estimate.data?.gross != null
              ? kitchenMoney(estimate.data.gross)
              : estimate.error
                ? "Cena niedostępna"
                : estimate.data?.status === "blocked"
                  ? "Wymaga sprawdzenia"
                  : "Obliczamy cenę…"}
        </strong>
        <small>
          Orientacyjnie brutto ·{" "}
          {proposal.draft.quote.installation ? "z montażem" : "bez montażu"}
        </small>
      </div>
      {estimate.error && !disabled && (
        <div className="kp-proposal-error">
          <span>{estimate.error}</span>
          <button
            type="button"
            className="ps-text-button"
            onClick={estimate.retry}
          >
            Ponów wycenę
          </button>
        </div>
      )}
      {estimate.data?.status === "blocked" && (
        <p className="kp-proposal-error">
          {estimate.data.issues.join(" ") ||
            "Sprawdź układ przed wyborem tej propozycji."}
        </p>
      )}
      <dl>
        <div>
          <dt>Szuflady łącznie</dt>
          <dd>{stats.drawers}</dd>
        </div>
        <div>
          <dt>Szafki z półkami</dt>
          <dd>{stats.shelfCabinets}</dd>
        </div>
        <div>
          <dt>Najszersza szafka robocza</dt>
          <dd>{stats.widestWorkCabinet / 10} cm</dd>
        </div>
      </dl>
      <p className="kp-muted">
        {stats.pendingNeeds
          ? stats.pendingNeeds === 1
            ? "1 potrzeba wymaga doprecyzowania wyposażenia."
            : `${stats.pendingNeeds} ${stats.pendingNeeds < 5 ? "potrzeby wymagają" : "potrzeb wymaga"} doprecyzowania wyposażenia.`
          : proposal.draft.needs?.storage.length
            ? "Każda wybrana potrzeba przechowywania ma wskazaną szafkę."
            : "Rzeczy do przechowywania wybierzesz w pierwszym kroku."}{" "}
        Wymiary przechowywanych rzeczy sprawdzimy osobno.
      </p>
      {proposal.alsoMatches.length > 0 && (
        <p className="kp-proposal-same">
          <IconCheck size={16} aria-hidden="true" />
          Taki sam układ otrzymasz też dla: {proposal.alsoMatches.join(", ")}.
        </p>
      )}
      <button
        type="button"
        className="ps-button"
        disabled={disabled || estimate.data?.status === "blocked"}
        onClick={onUse}
      >
        Wybierz tę kuchnię <IconArrowRight size={18} />
      </button>
    </article>
  );
}

export function KitchenProposals({
  options,
  unavailable,
  stale,
  hasKitchen,
  onUse,
  onClose,
}: {
  options: KitchenProposal<Draft>[];
  unavailable: { title: string; reason: string }[];
  stale: boolean;
  hasKitchen: boolean;
  onUse: (next: Draft) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [active, setActive] = useState(options[0]?.id);
  useEffect(() => {
    const current = dialog.current!;
    current.showModal();
    title.current?.focus();
    return () => current.close();
  }, []);
  const currentActive = options.some((o) => o.id === active)
    ? active
    : options[0]?.id;
  return (
    <dialog
      ref={dialog}
      className="kp-dialog kp-proposals-dialog"
      aria-labelledby="kp-proposals-title"
      aria-describedby="kp-proposals-help"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="kp-proposals-header">
        <div>
          <h2 id="kp-proposals-title" ref={title} tabIndex={-1}>
            Wybierz swoją kuchnię
          </h2>
          <p id="kp-proposals-help">
            Porównaj wyposażenie i orientacyjną cenę. Dopiero wybór propozycji
            zmieni projekt.
            <span className="kp-proposals-scope">
              Cena mebli na stawkach modelowych, bez AGD, zlewu, baterii i
              podłączeń.
            </span>
          </p>
        </div>
        <button
          type="button"
          className="ps-text-button"
          onClick={onClose}
          aria-label="Zamknij porównanie"
        >
          <IconX size={23} />
        </button>
      </header>
      {stale && (
        <Feedback>
          Projekt lub stan edycji zmienił się podczas porównywania. Wróć bez
          zmian, sprawdź szkic i porównaj propozycje ponownie.
        </Feedback>
      )}
      <div
        className="kp-proposals-tabs"
        role="group"
        aria-label="Wybierz propozycję do porównania"
      >
        {options.map((p, n) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.id === currentActive}
            onClick={() => setActive(p.id)}
          >
            {n + 1}. {p.title}
          </button>
        ))}
      </div>
      <div className="kp-proposals-grid">
        {options.map((p, n) => (
          <ProposalCard
            key={JSON.stringify(p.draft)}
            proposal={p}
            first={n === 0}
            active={p.id === currentActive}
            disabled={stale}
            onUse={() => {
              if (!stale) onUse(structuredClone(p.draft));
            }}
          />
        ))}
      </div>
      {unavailable.length > 0 && (
        <details className="kp-proposals-unavailable">
          <summary>Dlaczego nie ma pozostałych propozycji?</summary>
          {unavailable.map((r, n) => (
            <p key={n}>
              <strong>{r.title}:</strong> {r.reason}
            </p>
          ))}
        </details>
      )}
      <footer>
        <p className="kp-muted">
          {hasKitchen
            ? "Wybór zastąpi obecną zabudowę przy ścianach. Cofnij przywróci poprzedni projekt."
            : "Wybraną kuchnię dopracujesz na kolejnym ekranie."}
        </p>
        <button type="button" className="ps-button secondary" onClick={onClose}>
          Wróć bez zmian
        </button>
      </footer>
    </dialog>
  );
}
