/** Small bounded arithmetic grammar. No JavaScript evaluation or implicit units. */
export function dimensionExpression(source: string): number {
  if (source.length > 160)
    throw new Error("Działanie może mieć najwyżej 160 znaków.");
  const text = source.replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/");
  let i = 0;
  const space = () => {
    while (/\s/.test(text[i] ?? "") && i < text.length) i++;
  };
  const error = () =>
    new Error(
      "Wpisz wymiar lub działanie, np. (600-2*18)/3. Dozwolone: + − * / i nawiasy.",
    );
  const checked = (v: number) => {
    if (!Number.isFinite(v) || Math.abs(v) > 1e9)
      throw new Error("Wynik działania jest zbyt duży lub nieprawidłowy.");
    return v;
  };
  function atom(depth: number): number {
    if (depth > 24)
      throw new Error("Za dużo zagnieżdżonych nawiasów lub znaków.");
    space();
    if (text[i] === "+" || text[i] === "-" || text[i] === "−") {
      const sign = text[i++];
      return checked((sign === "+" ? 1 : -1) * atom(depth + 1));
    }
    if (text[i] === "(") {
      i++;
      const v = sum(depth + 1);
      space();
      if (text[i++] !== ")") throw error();
      return v;
    }
    const number = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(text.slice(i));
    if (!number) throw error();
    i += number[0].length;
    return checked(Number(number[0]));
  }
  function product(depth: number): number {
    let v = atom(depth);
    space();
    while (text[i] === "*" || text[i] === "/") {
      const op = text[i++],
        right = atom(depth);
      if (op === "/" && right === 0)
        throw new Error("Nie można dzielić przez zero.");
      v = checked(op === "*" ? v * right : v / right);
      space();
    }
    return v;
  }
  function sum(depth: number): number {
    let v = product(depth);
    space();
    while (text[i] === "+" || text[i] === "-" || text[i] === "−") {
      const op = text[i++],
        right = product(depth);
      v = checked(op === "+" ? v + right : v - right);
      space();
    }
    return v;
  }
  const result = sum(0);
  space();
  if (i !== text.length) throw error();
  // Keep sub-millimetre values without floating-point tails in the editor.
  return Math.round(result * 1e6) / 1e6;
}
