import { useId } from "react";
import type { MocowanieFrontu } from "../../../../src/core/catalog/drawers";
import { mm } from "./model";

export function RysunekFrontu({ mocowanie, szerokosc, wysokosc }: { mocowanie?: MocowanieFrontu; szerokosc?: number; wysokosc: number }) {
  const id = useId().replace(/:/g, "");
  const w = szerokosc && szerokosc > 0 ? szerokosc : 600;
  const h = wysokosc > 0 ? wysokosc : 357;
  const width = 250, height = Math.min(190, Math.max(90, width * h / w));
  const left = 48, top = 54 + (190 - height) / 2;
  const xL = mocowanie?.odLewejKrawedziMM, xP = mocowanie?.odPrawejKrawedziMM;
  const y = mocowanie?.odDolnejKrawedziMM;
  const gotowe = szerokosc !== undefined && xL !== undefined && xP !== undefined && y && mocowanie?.status !== "kolizja";
  const osL = left + (xL ?? 0) / w * width, osP = left + width - (xP ?? 0) / w * width;
  return <svg className="drawer-drawing" viewBox="0 0 360 310" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>Wiercenia na tylnej stronie frontu</title>
    <desc id={`${id}-desc`}>{gotowe ? `Lewa oś ${mm(xL)} mm od lewej krawędzi, prawa ${mm(xP)} mm od prawej. Otwory od dołu: ${y.map(mm).join(", ")} mm.` : "Schemat frontu. Wpisz szerokość frontu i pozycję pierwszego otworu, aby zobaczyć osie wierceń."}</desc>
    <defs>
      <pattern id={`${id}-grid`} width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.6" className="drawing-grid-dot" /></pattern>
      <marker id={`${id}-arrow`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" /></marker>
    </defs>
    <rect x="0" y="0" width="360" height="310" rx="10" fill={`url(#${id}-grid)`} />
    <rect x={left} y={top} width={width} height={height} rx="2" className="drawing-board" />
    <text x={left + width / 2} y={top + height / 2 - 5} textAnchor="middle" className="drawing-caption">TYŁ FRONTU</text>
    <text x={left + width / 2} y={top + height / 2 + 14} textAnchor="middle" className="drawing-small">{szerokosc ? `${mm(szerokosc)} × ${mm(h)} mm` : "Podaj wymiary frontu"}</text>
    <text x={left - 13} y={top + height / 2} textAnchor="middle" className="drawing-side">L</text>
    <text x={left + width + 13} y={top + height / 2} textAnchor="middle" className="drawing-side">P</text>
    {gotowe ? <>
      {[osL, osP].map((x, i) => <line key={i} x1={x} x2={x} y1={top - 8} y2={top + height + 8} className="drawing-axis" />)}
      {y.map((value, i) => {
        const cy = top + height - value / h * height;
        return <g key={value}>
          {[osL, osP].map((x, side) => <g key={side}><circle cx={x} cy={cy} r="4.5" className="drawing-hole" /><line x1={x - 7} x2={x + 7} y1={cy} y2={cy} className="drawing-cross" /><line x1={x} x2={x} y1={cy - 7} y2={cy + 7} className="drawing-cross" /></g>)}
          <text x={osL + 11} y={cy + 4} className="drawing-small">{i + 1}</text>
        </g>;
      })}
      {[{ x1: left, x2: osL, label: mm(xL) }, { x1: osP, x2: left + width, label: mm(xP) }].map((d, i) => <g key={i}>
        <line x1={d.x1} x2={d.x1} y1={top - 28} y2={top - 4} className="drawing-guide" />
        <line x1={d.x2} x2={d.x2} y1={top - 28} y2={top - 4} className="drawing-guide" />
        <line x1={d.x1} x2={d.x2} y1={top - 22} y2={top - 22} className="drawing-measure" markerStart={`url(#${id}-arrow)`} markerEnd={`url(#${id}-arrow)`} />
        <text x={(d.x1 + d.x2) / 2} y={top - 33} textAnchor="middle" className="drawing-value">{d.label}</text>
      </g>)}
    </> : <text x="180" y={top + height + 27} textAnchor="middle" className="drawing-small">Osie pojawią się po uzupełnieniu danych</text>}
    <line x1={left} x2={left + width} y1={top + height} y2={top + height} className="drawing-bottom" />
    <text x="180" y="294" textAnchor="middle" className="drawing-small">DOLNA KRAWĘDŹ · od niej mierz wysokości</text>
  </svg>;
}
