import { useEffect, useState } from "react";
export function useCalculatorParameters<K extends string>(
  key: string,
  defaults: Record<K, string>,
) {
  const [form, setForm] = useState<Record<K, string>>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? "null");
      if (!value || typeof value !== "object") return defaults;
      const next = { ...defaults };
      for (const k of Object.keys(defaults) as K[])
        if (typeof value[k] === "string" && value[k].length <= 24)
          next[k] = value[k];
      return next;
    } catch {
      return defaults;
    }
  });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(form));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [key, form]);
  return { form, setForm, saved };
}
