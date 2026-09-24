import { z } from "zod";

const tekst = (max = 200) => z.string().trim().max(max);
const wymagane = (max = 200) => tekst(max).min(1, "Uzupełnij wymagane pole.");
const data = tekst(10).refine(v => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v), "Nieprawidłowa data.");
const kwota = z.number().finite().min(0).max(100000000).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001, "Kwota może mieć najwyżej dwa miejsca po przecinku.");
export const schematUmowy = z.object({
  numer: wymagane(80), rodzaj: z.enum(["kuchnia", "schody", "inne"]),
  klient: wymagane(), adresKlienta: wymagane(400), firma: wymagane(400), adresFirmy: wymagane(400), nip: wymagane(20),
  miejsce: tekst(), adresMontazu: wymagane(400), data, termin: data,
  cena: kwota.refine(v => v > 0, "Cena musi być większa od zera."), zaliczka: kwota,
  zaliczkaZaplacona: z.boolean(), dataZaliczki: data,
  zakres: wymagane(5000), warunki: wymagane(12000),
}).strict().superRefine((v, ctx) => {
  if (v.zaliczka > v.cena) ctx.addIssue({ code: "custom", path: ["zaliczka"], message: "Zaliczka nie może przekraczać ceny." });
  if (v.data && v.termin && v.termin < v.data) ctx.addIssue({ code: "custom", path: ["termin"], message: "Termin nie może poprzedzać zawarcia umowy." });
  if (!v.zaliczkaZaplacona && v.dataZaliczki) ctx.addIssue({ code: "custom", path: ["dataZaliczki"], message: "Data wpłaty wymaga potwierdzenia otrzymania zaliczki." });
});
export type DaneUmowy = z.infer<typeof schematUmowy>;
export type Umowa = DaneUmowy & { id: string; utworzono: string };

export const ZAKRESY = {
  kuchnia: "Projekt, wykonanie, transport i montaż zabudowy kuchennej na wymiar. Układ frontów i szuflad, materiały, wymiary oraz wyposażenie zostaną uzgodnione w toku prac projektowych. Przed produkcją strony zatwierdzą projekt i specyfikację na piśmie lub e-mailem. Niniejsza umowa nie zatwierdza konkretnego układu zabudowy.",
  schody: "Wykonanie, dostawa i montaż drewnianej okładziny schodów. Gatunek drewna, liczba i wymiary stopni, zakres podstopnic i spoczników oraz sposób wykończenia zostaną określone w specyfikacji zatwierdzonej przez obie strony przed produkcją.",
  inne: "",
};
export const WARUNKI_UMOWY = `1. Realizacja i zmiany
Wykonawca przeprowadzi pomiar i przedstawi projekt do akceptacji przed rozpoczęciem produkcji. Uzgodniona cena obejmuje zakres opisany w umowie. Zmiany ceny, zakresu i terminów wymagają wyraźnej zgody obu stron na piśmie lub e-mailem. Samo uzgadnianie projektu nie zmienia ceny.

2. Montaż
Zamawiający zapewni dostęp do miejsca prac i energii elektrycznej oraz przekaże znane informacje o ukrytych instalacjach. Wykonawca oceni warunki montażu, zgłosi przeszkody, zabezpieczy miejsce prac, zamontuje i wyreguluje elementy oraz przekaże zasady pielęgnacji.

3. Odbiór i rozliczenie
Strony sporządzą protokół odbioru, wskazując ewentualne wady i uzgodniony termin ich usunięcia. Pozostała należność, po uwzględnieniu faktycznie otrzymanych wpłat, jest płatna w ciągu 7 dni od odbioru na rachunek wskazany przez Wykonawcę lub gotówką za pokwitowaniem. Odbiór nie oznacza rezygnacji z roszczeń dotyczących wad. Powyższe zasady nie ograniczają ustawowych praw Zamawiającego.

4. Zaliczka
Zaliczka stanowi część ceny, a nie zadatek. Nie przepada automatycznie. W przypadku zakończenia umowy przed wykonaniem dzieła rozliczenie następuje zgodnie z podstawą zakończenia i obowiązującymi przepisami.

5. Odpowiedzialność
Wykonawca odpowiada za zgodność wykonania z umową i za wady na zasadach ustawowych. Reklamacje można składać na adres Wykonawcy. Umowa nie wyłącza ani nie ogranicza ustawowych praw konsumenta, w tym prawa odstąpienia, jeżeli przysługuje.

6. Postanowienia końcowe
Stosuje się prawo polskie, w szczególności Kodeks cywilny i właściwe przepisy konsumenckie. Zatwierdzony później projekt i specyfikacja staną się załącznikiem do umowy. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej strony.`;
