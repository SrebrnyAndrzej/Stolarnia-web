import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { RysunekFrontu } from "./szuflady/RysunekFrontu";
import { frontSzer, frontWys, mm, n, wewnetrzny, zaDrzwiami, type FormularzSzuflad } from "./szuflady/model";
import { useKalkulator } from "./szuflady/useKalkulator";

function Pole({ label, value, onChange, error, hint, optional = false }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; optional?: boolean;
}) {
  const id = useId();
  return <div className="field drawer-field">
    <label htmlFor={id}>{label}{optional && <span className="drawer-optional"> opcjonalnie</span>}</label>
    <div className="drawer-input-wrap"><input id={id} className="input num" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-help` : undefined} autoComplete="off" /><span aria-hidden="true">mm</span></div>
    {(error || hint) && <span id={`${id}-help`} className={error ? "drawer-field-error" : "drawer-help"}>{error ?? hint}</span>}
  </div>;
}

function Wybor({ selected, onClick, title, children, icon }: { selected: boolean; onClick: () => void; title: string; children: ReactNode; icon: "outer" | "inner" }) {
  return <button type="button" className={`drawer-type ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={onClick}>
    <svg viewBox="0 0 44 38" aria-hidden="true"><path d="M5 6h34v26H5z" className="type-cabinet" /><path d={icon === "outer" ? "M2 3h40v32H2z" : "M11 11h22v16H11z"} className="type-front" /><path d="M17 16h10" className="type-handle" /></svg>
    <span><strong>{title}</strong><small>{children}</small></span><span className="drawer-radio" aria-hidden="true" />
  </button>;
}

export function PrzelicznikSzuflad() {
  const { form: f, ustaw, errors, systemy, bladKatalogu, blad, pamiec, liczenie, dane, ponow } = useKalkulator();
  const results = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [kopiowanie, setKopiowanie] = useState("");
  const internal = wewnetrzny(f), behind = zaDrzwiami(f);
  const system = systemy.find((s) => s.id === f.system);
  const w = dane?.wyniki[0];
  const mocowanie = w?.mocowanieFrontu;
  const szerKey = internal ? "frontWewSzer" : "frontZewSzer";
  const otworKey = internal ? "otworWew" : "otworZew";
  const wysKey = internal ? "frontWewWys" : "frontZewWys";
  const errorKeys = Object.keys(errors);
  const ready = !!dane && !!w && !liczenie && !errorKeys.length && !blad;
  const status = errorKeys.length ? "Popraw zaznaczone pola" : liczenie ? "Przeliczanie…" : blad ? "Nie udało się obliczyć" : "Wymiary przeliczone";
  const producent = w?.producent ?? system?.producent;
  const nazwa = `${producent === "AMIX" ? "Amix" : producent === "BLUM" ? "Blum" : producent ?? ""} ${w?.system ?? system?.system ?? f.system}`.trim();

  useEffect(() => { document.title = "Kalkulator szuflad · Stolarnia Online"; }, []);
  useEffect(() => setKopiowanie(""), [dane]);

  const pole = (key: keyof FormularzSzuflad, label: string, hint?: string, optional = false) => <Pole label={label} value={String(f[key])} onChange={(v) => ustaw(key, v)} error={errors[key]} hint={hint} optional={optional} />;
  const doWynikow = () => {
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid) { invalid.focus(); return; }
    results.current?.scrollIntoView({ block: "start", behavior: "instant" });
    results.current?.focus({ preventScroll: true });
  };
  const doDanych = () => {
    formRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
  };
  const kopiuj = async () => {
    if (!ready || !w || !dane) return;
    const tekst = [
      `${nazwa} H${w.wariant} · ${internal ? "front wewnętrzny" : "front zewnętrzny"}`,
      `LW montażowe ${mm(dane.LW)} mm, NL ${mm(dane.NL)} mm`,
      `Dno: ${mm(w.dno.szer)} × ${mm(w.dno.gl)} × ${mm(w.grubosc)} mm (szer. × gł. × gr.)`,
      `Plecy: ${mm(w.plecy.szer)} × ${mm(w.plecy.wys)} × ${mm(w.grubosc)} mm (szer. × wys. × gr.)`,
      `Front: ${frontSzer(f).trim() ? mm(n(frontSzer(f))) : "brak szerokości"} × ${mm(n(frontWys(f)))} mm (szer. × wys.)`,
      ...(mocowanie?.status === "kolizja" ? ["Wiercenia zablokowane: kolizja."] : [
        `Front: lewa oś ${mocowanie?.odLewejKrawedziMM === undefined ? "brak danych" : mm(mocowanie.odLewejKrawedziMM) + " mm od lewej krawędzi"}, prawa ${mocowanie?.odPrawejKrawedziMM === undefined ? "brak danych" : mm(mocowanie.odPrawejKrawedziMM) + " mm od prawej krawędzi"}.`,
        `Otwory od dołu frontu: ${mocowanie?.odDolnejKrawedziMM?.map(mm).join(" / ") ?? "nieustalone — wpisz pierwszy otwór"} mm. Widok od tyłu.`,
      ]),
      ...(dane.zaDrzwiami ? [`Dystans lewy/prawy: ${dane.zaDrzwiami.dystansLewy}/${dane.zaDrzwiami.dystansPrawy} mm. ${dane.zaDrzwiami.kolizje.opis}`] : []),
      ...(f.rozstaw && dane.montaz ? [`Prowadnice od wieńca do dolnej krawędzi: ${dane.montaz.prowadnice.map((p) => mm(p.dolnaKrawedzMM)).join(" / ")} mm.`] : []),
      "Pozycje robocze. Średnica i głębokość otworów zaczepów wymagają potwierdzenia.",
    ].join("\n");
    try { await navigator.clipboard.writeText(tekst); setKopiowanie("Skopiowano wymiary i punkty pomiaru."); }
    catch { setKopiowanie("Nie udało się skopiować. Możesz zaznaczyć wymiary na ekranie."); }
  };

  return <div className="drawer-calculator">
    <header className="drawer-page-head">
      <div><p className="drawer-eyebrow">Narzędzia warsztatowe</p><h1>Kalkulator szuflad</h1><p className="muted">Rozkrój i wiercenia. Wszystkie wymiary w milimetrach.</p></div>
      <span className="drawer-unit-badge">mm</span>
    </header>
    <div className="drawer-layout">
      <form className="drawer-form" ref={formRef} noValidate onSubmit={(e) => { e.preventDefault(); doWynikow(); }}>
        <section className="card drawer-panel">
          <div className="drawer-panel-heading"><span className="drawer-step">1</span><h2>Szuflada i korpus</h2></div>
          <label className="field drawer-field"><span id="drawer-system-label">System szuflady</span><select className="input" aria-labelledby="drawer-system-label" value={f.system} onChange={(e) => ustaw("system", e.target.value)}>
            {!systemy.length && <option value={f.system}>{f.system === "amix-elite-standard" ? "Amix Elite Box" : f.system}</option>}
            {systemy.map((s) => <option key={s.id} value={s.id}>{s.producent === "AMIX" ? "Amix" : s.producent === "BLUM" ? "Blum" : s.producent} {s.system}</option>)}
          </select></label>
          {bladKatalogu && <p className="drawer-field-error">{bladKatalogu} <button type="button" className="drawer-link" onClick={ponow}>Ponów</button></p>}
          <div className="drawer-width-mode" role="group" aria-label="Sposób pomiaru szerokości">
            <button type="button" aria-pressed={f.szerokoscTryb === "lw"} onClick={() => ustaw("szerokoscTryb", "lw")}>Światło między bokami</button>
            <button type="button" aria-pressed={f.szerokoscTryb === "korpus"} onClick={() => ustaw("szerokoscTryb", "korpus")}>Wymiar zewnętrzny</button>
          </div>
          <div className="drawer-fields">
            {f.szerokoscTryb === "lw" ? pole("lw", "Światło korpusu LW", "Zmierz między bokami, przed dystansem.") : <>{pole("korpus", "Szerokość korpusu")}{pole("bok", "Grubość boku korpusu")}</>}
            {pole("nl", "Długość prowadnicy NL", "To długość prowadnicy, nie szafki.")}
          </div>
          <fieldset className="drawer-variant"><legend>Wysokość boku szuflady</legend><div className="drawer-chips" role="group" aria-label="Wysokość boku">
            {(system?.warianty ?? []).map((v) => <button type="button" key={v.wariant} aria-pressed={f.wariant === v.wariant} onClick={() => ustaw("wariant", v.wariant)}>{v.wariant}</button>)}
            <button type="button" aria-pressed={!f.wariant} onClick={() => ustaw("wariant", "")}>Auto</button>
          </div></fieldset>
          {f.system === "blum-tandembox-antaro-m-wood" && <label className="field drawer-field"><span id="drawer-back-label">Ścianka tylna</span><select className="input" aria-labelledby="drawer-back-label" value={f.scianka} onChange={(e) => ustaw("scianka", e.target.value as FormularzSzuflad["scianka"])}><option value="drewniana">Drewniana</option><option value="stalowa">Stalowa</option></select></label>}
        </section>

        <section className="card drawer-panel">
          <div className="drawer-panel-heading"><span className="drawer-step">2</span><h2>Front i zaczepy</h2></div>
          <div className="drawer-types" role="group" aria-label="Rodzaj frontu">
            <Wybor selected={!internal} onClick={() => ustaw("typFrontu", "zewnetrzny")} title="Zewnętrzny" icon="outer">Nakładany na korpus</Wybor>
            <Wybor selected={internal} onClick={() => ustaw("typFrontu", "wewnetrzny")} title="Wewnętrzny" icon="inner">Za drzwiami lub wpuszczany</Wybor>
          </div>
          {internal && <label className="field drawer-field"><span id="drawer-internal-label">Montaż frontu wewnętrznego</span><select className="input" aria-labelledby="drawer-internal-label" value={f.montazWewnetrzny} onChange={(e) => ustaw("montazWewnetrzny", e.target.value as FormularzSzuflad["montazWewnetrzny"])}><option value="zaDrzwiami">Za drzwiami · zwykłe zawiasy · dystans 36 mm</option><option value="zlicowany">Wpuszczany · zlicowany z korpusem</option></select></label>}
          <div className="drawer-fields">{pole(szerKey, "Szerokość frontu", "Osobny wymiar — bez potrącania 36 mm.", true)}{pole(wysKey, "Wysokość frontu")}</div>
          {pole(otworKey, "Pierwszy otwór od dołu frontu", system?.mocowanieFrontuMinMM !== undefined ? `Min. ${mm(system.mocowanieFrontuMinMM)} mm. Pozycja zależy od nałożenia frontu.` : "Dokładna pozycja wymaga schematu wybranego systemu.", true)}
          <p className="drawer-inline-note">Mierz na <strong>tylnej stronie frontu</strong>. Po wpisaniu szerokości i pierwszego otworu zobaczysz wszystkie pozycje wiercenia.</p>
          {internal && !behind && pole("frontGrubosc", "Grubość frontu", "O tyle cofamy prowadnice względem montażu standardowego.")}
          {behind && <div className="drawer-hinge-settings">
            <div className="drawer-callout"><strong>Dno i plecy węższe o 36 mm</strong><span>Dystans tylko po stronie zawiasów. Wymiar frontu pozostaje osobny.</span></div>
            <div className="drawer-chips" role="group" aria-label="Strona zawiasów"><button type="button" aria-pressed={f.stronaZawiasow === "lewa"} onClick={() => ustaw("stronaZawiasow", "lewa")}>Zawiasy z lewej</button><button type="button" aria-pressed={f.stronaZawiasow === "prawa"} onClick={() => ustaw("stronaZawiasow", "prawa")}>Zawiasy z prawej</button></div>
            {pole("wystawanie", "Wystawanie zawiasu w światło", "Największy obrys podczas wysuwania, z karty lub pomiaru.", true)}
            <details className="drawer-details"><summary>Luz i przesunięcie frontu</summary><div className="drawer-fields">{pole("luzZawiasu", "Luz od zawiasu")}{pole("przesuniecie", "Przesunięcie frontu", "0 = środek nowego światła; + w prawo.")}</div></details>
          </div>}
        </section>

        <section className="card drawer-panel drawer-spacing">
          <label className="drawer-check"><input type="checkbox" checked={f.rozstaw} onChange={(e) => ustaw("rozstaw", e.target.checked)} /><span><strong>Rozstaw kilku szuflad</strong><small>Wysokości prowadnic przy równych frontach</small></span></label>
          {f.rozstaw && <><label className="field drawer-field"><span id="drawer-count-label">Liczba szuflad</span><select className="input" aria-labelledby="drawer-count-label" value={f.liczba} onChange={(e) => ustaw("liczba", e.target.value)}>{Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}</select></label><div className="drawer-fields">{pole("szczelina", "Szczelina między frontami")}{pole("dolna", "Dolna prowadnica nad wieńcem")}{pole("swiatloWys", "Wysokość światła", undefined, true)}</div></>}
        </section>
        <button type="submit" className="drawer-primary">Pokaż rozkrój i wiercenia <span aria-hidden="true">↓</span></button>
        <p className="drawer-memory">{pamiec ? "Ostatnie wymiary zapamiętane na tym urządzeniu." : "Wymiary pozostają w formularzu podczas pracy."}</p>
      </form>

      <section className="drawer-results" ref={results} tabIndex={-1} aria-label="Wyniki kalkulatora" aria-busy={liczenie}>
        <div className="drawer-result-head"><div><p className="drawer-eyebrow">Wynik do pracy</p><h2>{internal ? "Front wewnętrzny" : "Front zewnętrzny"}</h2></div><div className="drawer-result-actions"><span className={`drawer-status ${ready ? "is-ready" : ""}`} role="status" aria-live="polite">{status}</span><button type="button" className="drawer-link" onClick={doDanych}>Zmień dane ↑</button></div></div>
        {errorKeys.length > 0 && <div className="alert blad" role="alert">Popraw zaznaczone pola. Wpisane wymiary zostały zachowane.</div>}
        {blad && <div className="alert blad" role="alert"><strong>Nie udało się obliczyć.</strong><p>{blad}</p><button type="button" className="btn" onClick={ponow}>Spróbuj ponownie</button></div>}
        {!ready ? <div className="card drawer-wait"><span className={liczenie ? "drawer-spinner" : "drawer-wait-mark"} aria-hidden="true">{liczenie ? "" : "↗"}</span><h3>{liczenie ? "Obliczam wymiary" : "Tutaj pojawi się rozkrój i wiercenia"}</h3><p>{liczenie ? "Wynik za chwilę będzie gotowy." : "Uzupełnij lub popraw dane szuflady po lewej, a na telefonie — powyżej."}</p></div> : <>
          <div className="drawer-result-meta"><strong>{nazwa} · H{w.wariant}</strong><span>LW montażowe {mm(dane.LW)} · NL {mm(dane.NL)} · płyta {mm(w.grubosc)} mm</span></div>
          {dane.zaDrzwiami && <div className="drawer-callout"><strong>Światło skrzynki: {mm(dane.zaDrzwiami.LWPrzedDystansami)} − {mm(dane.zaDrzwiami.potracenieMM)} = {mm(dane.LW)} mm</strong><span>Dystans z lewej {mm(dane.zaDrzwiami.dystansLewy)} mm / z prawej {mm(dane.zaDrzwiami.dystansPrawy)} mm. Szerokość frontu pozostaje osobna.</span></div>}
          <section className="drawer-cut-grid" aria-label="Wymiary do cięcia">
            <div className="card drawer-cut"><span className="drawer-cut-label"><svg viewBox="0 0 30 24" aria-hidden="true"><path d="M3 18 12 5h15l-9 13z" /></svg>Dno</span><strong className="num">{mm(w.dno.szer)} <span>×</span> {mm(w.dno.gl)}</strong><small>szerokość × głębokość · mm</small></div>
            <div className="card drawer-cut"><span className="drawer-cut-label"><svg viewBox="0 0 30 24" aria-hidden="true"><path d="M4 4h22v16H4z" /></svg>Plecy</span><strong className="num">{mm(w.plecy.szer)} <span>×</span> {mm(w.plecy.wys)}</strong><small>szerokość × wysokość · mm</small></div>
          </section>
          {dane.zaDrzwiami && <div className={`drawer-collision ${dane.zaDrzwiami.kolizje.status === "kolizja" ? "has-collision" : ""}`} role={dane.zaDrzwiami.kolizje.status === "kolizja" ? "alert" : undefined}><strong>{dane.zaDrzwiami.kolizje.status === "kolizja" ? "Kolizja — wiercenia zablokowane" : dane.zaDrzwiami.kolizje.status === "brakDanych" ? "Prześwit jeszcze niesprawdzony" : "Boczny prześwit sprawdzony"}</strong><p>{dane.zaDrzwiami.kolizje.opis}</p></div>}
          <section className="card drawer-drilling" aria-label="Wiercenia frontu">
            <div className="drawer-drilling-head"><h2>Wiercenia frontu</h2><span className="drawer-back-badge">Widok od tyłu</span></div>
            {mocowanie?.status === "kolizja" ? <div className="drawer-no-drill"><strong>Nie wierć według tej konfiguracji.</strong><p>Zmień dystans, wymiar lub położenie frontu, aby ominąć zawias. Współrzędne otworów są ukryte.</p></div> : mocowanie?.status === "brakDanych" ? <div className="drawer-no-drill"><strong>Brak schematu zaczepów dla tego systemu.</strong><p>Rozkrój jest dostępny. Pozycje otworów wymagają instrukcji producenta dla wybranego mocowania.</p></div> : <>
              <RysunekFrontu mocowanie={mocowanie} szerokosc={frontSzer(f).trim() ? n(frontSzer(f)) : undefined} wysokosc={n(frontWys(f))} />
              <div className="drawer-axis-values"><div><span>Od lewej krawędzi</span><strong className="num">{mocowanie?.odLewejKrawedziMM === undefined ? "—" : mm(mocowanie.odLewejKrawedziMM)}<small> mm</small></strong></div><div><span>Od prawej krawędzi</span><strong className="num">{mocowanie?.odPrawejKrawedziMM === undefined ? "—" : mm(mocowanie.odPrawejKrawedziMM)}<small> mm</small></strong></div></div>
              <div className="drawer-hole-list"><h3>Od dolnej krawędzi frontu</h3>{mocowanie?.odDolnejKrawedziMM ? <ol>{mocowanie.odDolnejKrawedziMM.map((y, i) => <li key={y}><span>Otwór {i + 1}</span><strong className="num">{mm(y)} <small>mm</small></strong></li>)}</ol> : <p className="drawer-inline-note">Wpisz pozycję pierwszego otworu od dołu frontu. Minimum {mocowanie?.minimalneOdDolnejKrawedziMM?.[0] !== undefined ? `${mm(mocowanie.minimalneOdDolnejKrawedziMM[0])} mm` : "z instrukcji"} nie wyznacza jego dokładnego położenia.</p>}</div>
              {!frontSzer(f).trim() && <p className="drawer-inline-note">Dodaj szerokość frontu, aby otrzymać odległości osi od krawędzi bocznych.</p>}
              <p className="drawer-drill-footnote">Te same wysokości otworów na obu osiach. Ø i głębokość wiercenia: do potwierdzenia dla zaczepu.</p>
            </>}
          </section>
          {internal && !behind && dane.montaz && <div className="drawer-callout"><strong>Cofnij prowadnice dodatkowo o {mm(dane.montaz.cofniecieMM)} mm</strong><span>Względem montażu standardowego, aby front był zlicowany z korpusem.</span></div>}
          {f.rozstaw && dane.montaz && <section className="card drawer-panel" aria-label="Wysokości prowadnic"><h2>Wysokości prowadnic</h2><p className="drawer-help">Od górnej powierzchni wieńca dolnego do dolnej krawędzi prowadnicy — nie do osi wkrętów.</p><ol className="drawer-runner-list">{dane.montaz.prowadnice.map((p) => <li key={p.numer}><span>Szuflada {p.numer} od dołu</span><strong className="num">{mm(p.dolnaKrawedzMM)} mm</strong></li>)}</ol></section>}
          <button type="button" className="drawer-copy" onClick={kopiuj}>Kopiuj wymiary i wiercenia <span aria-hidden="true">↗</span></button><p className="drawer-copy-status" role="status">{kopiowanie}</p>
          <details className="drawer-details drawer-source"><summary>Źródło i założenia obliczeń</summary><p>{w.zrodlo.dokument}, strona {w.zrodlo.strona}. {mocowanie?.zrodlo && <>Zaczepy: {mocowanie.zrodlo.dokument}, strona {mocowanie.zrodlo.strona}.</>}</p><p>Wymiary przycięcia płyty bez obrzeża. Front ma własną szerokość. Dane zaczepów Amix dotyczą frontu z płyty, nie stalowego panelu wewnętrznego.</p><p>{mocowanie?.opis}</p>{w.uwagi.map((u) => <p key={u}>{u}</p>)}<p>Wynik roboczy. Nie zatwierdza kompletu wierceń CNC ani zgodności SKU.</p></details>
        </>}
      </section>
    </div>
  </div>;
}
