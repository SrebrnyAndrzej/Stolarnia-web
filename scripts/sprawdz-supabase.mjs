// Odczytowa kontrola konfiguracji; nie tworzy ani nie modyfikuje danych.
const raw = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!raw || !key) {
  console.error("Brak SUPABASE_URL lub SUPABASE_SECRET_KEY. Ustaw obie zmienne backendu.");
  process.exit(1);
}
let base;
try {
  base = new URL(raw);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || !base.hostname.endsWith(".supabase.co")) throw new Error();
} catch {
  console.error("SUPABASE_URL musi być adresem HTTPS nowego projektu *.supabase.co.");
  process.exit(1);
}
try {
  const res = await fetch(new URL("/rest/v1/stolarnia_baza?select=id,wersja,zmieniono&limit=1", base), {
    headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const hints = { 401: "Nieprawidłowy klucz projektu.", 403: "Brak uprawnień klucza serwerowego.", 404: "Brak tabeli stolarnia_baza — wykonaj migrację SQL." };
    console.error(`Supabase: HTTP ${res.status}. ${hints[res.status] ?? "Sprawdź stan projektu i migrację w panelu Supabase."}`);
    process.exitCode = 1;
  } else {
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error();
    console.log(`Połączenie i odczyt tabeli działają. ${rows.length ? "Baza zawiera dane." : "Tabela jest pusta; aplikacja zainicjuje dane przy pierwszym żądaniu."}`);
  }
} catch {
  console.error("Nie udało się połączyć z Supabase. Sprawdź adres projektu, sieć i czy projekt jest uruchomiony.");
  process.exitCode = 1;
}
