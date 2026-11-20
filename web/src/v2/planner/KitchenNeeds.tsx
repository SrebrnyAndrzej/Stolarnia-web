import { useEffect, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconToolsKitchen2,
  IconUsers,
} from "@tabler/icons-react";
import {
  kitchenNeedsSchema,
  kitchenPriorityLabels,
  kitchenStorageLabels,
  type KitchenNeeds as Needs,
} from "../../../../src/core/kitchen-needs-schema";
import { kitchenPlanningSchema } from "../../../../src/core/kitchen-configuration";
import { reviewKitchenNeeds } from "../../../../src/core/kitchen-needs";
import type { Draft } from "./model";

export function KitchenNeeds({
  draft,
  disabled,
  onApply,
  onDirtyChange,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (d: Draft) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const original = draft.needs ?? kitchenNeedsSchema.parse({});
  const [value, setValue] = useState<Needs>(original);
  const originalDishwasher = draft.planning?.dishwasher ?? "600";
  const [dishwasher, setDishwasher] = useState(originalDishwasher);
  const [editing, setEditing] = useState(!draft.needs);
  const [page, setPage] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const dirty =
    editing &&
    (JSON.stringify(value) !== JSON.stringify(original) ||
      dishwasher !== originalDishwasher);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  const next = (n: number) => {
    setPage(n);
    requestAnimationFrame(() => title.current?.focus());
  };
  const cancel = () => {
    setValue(original);
    setDishwasher(originalDishwasher);
    setEditing(false);
    setPage(0);
    requestAnimationFrame(() => editButton.current?.focus());
  };
  return (
    <section className="kp-needs" aria-label="Potrzeby domowników">
      <div className="kp-needs-heading">
        <IconToolsKitchen2 size={22} aria-hidden="true" />
        <span>Kuchnia po Twojemu</span>
      </div>
      {!editing ? (
        <>
          <h2>Co ma się zmieścić w Twojej kuchni?</h2>
          <p className="kp-muted">
            {draft.needs
              ? kitchenPriorityLabels[draft.needs.priority]
              : "Krótki wybór potrzeb pomoże nam zaproponować wnętrza szafek."}
          </p>
          {draft.needs?.storage.length ? (
            <ul className="kp-needs-tags">
              {draft.needs.storage.map((s) => (
                <li key={s}>{kitchenStorageLabels[s]}</li>
              ))}
            </ul>
          ) : null}
          <button
            ref={editButton}
            type="button"
            disabled={disabled}
            className="ps-button secondary"
            onClick={() => {
              setEditing(true);
              next(0);
            }}
          >
            {draft.needs ? "Zmień potrzeby" : "Dopasuj do moich potrzeb"}
          </button>
          <p className="kp-muted">
            {draft.items.length
              ? "Nowe potrzeby zapisujemy bez zmiany szafek. Możesz potem świadomie ułożyć nową propozycję."
              : "Możesz też zacząć od wymiarów i wrócić tutaj później."}
          </p>
        </>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (page < 2) {
              next(page + 1);
              return;
            }
            onApply({
              ...draft,
              needs: kitchenNeedsSchema.parse(value),
              planning: {
                ...kitchenPlanningSchema.parse(draft.planning ?? {}),
                dishwasher,
              },
            });
            setEditing(false);
          }}
        >
          <div
            className="kp-needs-progress"
            aria-label={`Pytanie ${page + 1} z 3`}
          >
            <span>{page + 1} / 3</span>
            {[0, 1, 2].map((n) => (
              <i key={n} data-current={n <= page} />
            ))}
          </div>
          <h2 ref={title} tabIndex={-1}>
            {
              [
                "Jak korzystasz z kuchni?",
                "Co chcesz przechowywać?",
                "Co jest najważniejsze?",
              ][page]
            }
          </h2>
          <fieldset disabled={disabled}>
            <legend className="sr-only">
              {
                [
                  "Domownicy i gotowanie",
                  "Rzeczy do przechowywania",
                  "Priorytet i zmywarka",
                ][page]
              }
            </legend>
            {page === 0 && (
              <>
                <p className="kp-muted">
                  Nie musisz znać się na meblach. Wybierz to, co opisuje Twój
                  dom.
                </p>
                <label>
                  <IconUsers size={18} aria-hidden="true" /> Ile osób korzysta z
                  kuchni?
                  <select
                    value={value.household}
                    onChange={(e) =>
                      setValue({
                        ...value,
                        household: e.target.value as Needs["household"],
                      })
                    }
                  >
                    <option value="unknown">Jeszcze nie wiem</option>
                    <option value="1-2">1–2 osoby</option>
                    <option value="3-4">3–4 osoby</option>
                    <option value="5+">5 lub więcej osób</option>
                  </select>
                </label>
                <label>
                  Jak często gotujesz?
                  <select
                    value={value.cooking}
                    onChange={(e) =>
                      setValue({
                        ...value,
                        cooking: e.target.value as Needs["cooking"],
                      })
                    }
                  >
                    <option value="unknown">Jeszcze nie wiem</option>
                    <option value="occasional">Od czasu do czasu</option>
                    <option value="daily">Codziennie</option>
                    <option value="enthusiast">Często i dużo</option>
                  </select>
                </label>
              </>
            )}
            {page === 1 && (
              <>
                <p className="kp-muted">
                  Zaznacz kilka rzeczy. Podpowiemy szuflady i półki; szczegóły
                  dopracujesz na projekcie.
                </p>
                <div className="kp-needs-choices">
                  {Object.entries(kitchenStorageLabels).map(([id, label]) => (
                    <label
                      key={id}
                      data-selected={value.storage.includes(
                        id as Needs["storage"][number],
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={value.storage.includes(
                          id as Needs["storage"][number],
                        )}
                        onChange={(e) =>
                          setValue({
                            ...value,
                            storage: e.target.checked
                              ? [
                                  ...value.storage,
                                  id as Needs["storage"][number],
                                ]
                              : value.storage.filter((s) => s !== id),
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="kp-muted">
                  Wymiary małego AGD i dobór kosza potwierdzimy osobno. Sam
                  wybór nie dodaje tych produktów do ceny.
                </p>
              </>
            )}
            {page === 2 && (
              <>
                <div className="kp-needs-priorities">
                  {Object.entries(kitchenPriorityLabels).map(([id, label]) => (
                    <label key={id} data-selected={value.priority === id}>
                      <input
                        type="radio"
                        name="kitchen-priority"
                        value={id}
                        checked={value.priority === id}
                        onChange={() =>
                          setValue({
                            ...value,
                            priority: id as Needs["priority"],
                          })
                        }
                      />
                      <span>
                        {label}
                        <small>
                          {
                            {
                              balanced: "Szuflady i półki",
                              storage: "Więcej wygodnych szuflad",
                              worktop: "Szukaj miejsca na szafkę roboczą 90 cm",
                              economy: "Mniej dodatkowych zestawów szuflad",
                            }[id]
                          }
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <label>
                  Zmywarka
                  <select
                    value={dishwasher}
                    onChange={(e) =>
                      setDishwasher(e.target.value as typeof dishwasher)
                    }
                  >
                    <option value="600">Standardowa · 60 cm</option>
                    <option value="450">Wąska · 45 cm</option>
                    <option value="none">Bez zmywarki</option>
                  </select>
                </label>
                <p className="kp-muted">
                  Propozycja zawiera też lodówkę, zlew oraz piekarnik z płytą i
                  okapem. Modele AGD dobierzemy osobno.
                </p>
              </>
            )}
          </fieldset>
          {dirty && (
            <p className="kp-needs-pending" role="status">
              Twoje odpowiedzi czekają na zapisanie.
            </p>
          )}
          <div className="kp-needs-actions">
            {page > 0 && (
              <button
                type="button"
                className="ps-text-button"
                disabled={disabled}
                onClick={() => next(page - 1)}
              >
                <IconArrowLeft size={17} /> Wstecz
              </button>
            )}
            <button
              type="submit"
              className="ps-button"
              data-save-needs
              disabled={disabled}
            >
              {page === 2 ? (
                <>
                  <IconCheck size={18} /> Zapisz potrzeby
                </>
              ) : (
                <>
                  Dalej <IconArrowRight size={18} />
                </>
              )}
            </button>
          </div>
          <button
            type="button"
            className="ps-text-button kp-needs-cancel"
            disabled={disabled}
            onClick={cancel}
          >
            {dirty ? "Anuluj odpowiedzi" : "Na razie pomiń"}
          </button>
        </form>
      )}
    </section>
  );
}

export function KitchenNeedsReview({
  draft,
  onSelect,
  onEdit,
}: {
  draft: Draft;
  onSelect: (id: string) => void;
  onEdit: () => void;
}) {
  const review = reviewKitchenNeeds(draft);
  if (!review) return null;
  return (
    <details className="kp-needs-review" open>
      <summary>Twoje potrzeby i proponowane miejsca</summary>
      <p className="kp-muted">
        To propozycja przeznaczenia obecnych szafek, nie potwierdzenie
        pojemności ani dodatkowych akcesoriów.
      </p>
      <ul>
        {review.assignments.map((row) => (
          <li key={row.need}>
            <strong>{row.label}</strong>
            <span>{row.description}</span>
            {row.id ? (
              <button
                className="ps-text-button"
                onClick={() => onSelect(row.id!)}
              >
                Pokaż szafkę <IconArrowRight size={16} />
              </button>
            ) : (
              <small>Do doprecyzowania</small>
            )}
          </li>
        ))}
      </ul>
      {review.reasons.map((reason) => (
        <p key={reason} className="kp-muted">
          {reason}
        </p>
      ))}
      <button className="ps-text-button" onClick={onEdit}>
        Zmień potrzeby domowników
      </button>
    </details>
  );
}
