import { useEffect, useRef, useState } from "react";
import { request } from "../api";
import type { KitchenEstimate } from "../../../../src/core/kitchen-configuration";
import type { Draft } from "./model";

export const kitchenMoney = (v: number) =>
  `${v.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;
/** One keyed, abortable public estimate for both the editing strip and PDF summary. */
export function useKitchenEstimate(draft: Draft | null, disabled: boolean) {
  const key = draft ? JSON.stringify(draft) : "";
  const [attempt, setAttempt] = useState(0);
  const previous = useRef<{ key: string; gross: number } | null>(null);
  const [result, setResult] = useState<{
    key: string;
    data?: KitchenEstimate;
    error?: string;
    delta?: number;
  } | null>(null);
  useEffect(() => {
    if (disabled || !key) return;
    const c = new AbortController();
    const timer = setTimeout(() => {
      request<KitchenEstimate>("/api/public/kitchen-estimate", {
        method: "POST",
        body: key,
        signal: c.signal,
      })
        .then((data) => {
          if (c.signal.aborted) return;
          const delta =
            data.gross != null &&
            previous.current &&
            previous.current.key !== key
              ? data.gross - previous.current.gross
              : undefined;
          if (data.gross != null) previous.current = { key, gross: data.gross };
          setResult({ key, data, delta });
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
  const current = !disabled && result?.key === key ? result : null;
  return {
    key,
    data: current?.data,
    error: current?.error,
    delta: current?.delta,
    retry: () => setAttempt((n) => n + 1),
  };
}
export type KitchenEstimateState = ReturnType<typeof useKitchenEstimate>;
