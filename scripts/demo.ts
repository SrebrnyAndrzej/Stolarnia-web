// Tworzy projekt demonstracyjny przez MCP po HTTP (serwer musi działać): `npx tsx scripts/demo.ts`
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = new URL(process.env.MCP_URL ?? "http://localhost:3210/mcp");
const client = new Client({ name: "demo", version: "1.0.0" });
await client.connect(new StreamableHTTPClientTransport(url));

const call = async (name: string, args: Record<string, unknown>) => {
  const r = await client.callTool({ name, arguments: args });
  const text = (r.content as { text: string }[])[0].text;
  if (r.isError) throw new Error(`${name}: ${text}`);
  return text;
};

const p = JSON.parse(
  await call("utworz_projekt", {
    nazwa: "Kuchnia pokazowa",
    klient: { nazwa: "Jan Kowalski", telefon: "600 000 000" },
    sciany: [{ nazwa: "Ściana z oknem", dlugoscMM: 3600 }, { nazwa: "Ściana boczna", dlugoscMM: 2200 }],
    materialKorpusuId: "egger-w1100-st9",
    materialFrontuId: "egger-h1180-st37",
    materialBlatuId: "blat-lam-38",
  }),
);
const [a, b] = p.pomieszczenia[0].sciany;
await call("wypelnij_sciane", { projektId: p.id, scianaId: a.id, katalogIds: ["tall-refrigerator-600", "base-drawers-600", "base-sink-800", "dishwasher-front-600", "base-oven-600", "base-cargo-300"] });
await call("wypelnij_sciane", { projektId: p.id, scianaId: a.id, katalogIds: ["wall-shelves-600", "wall-lift-up-800", "wall-hood-600", "wall-shelves-600"], odXMM: 600 });
await call("wypelnij_sciane", { projektId: p.id, scianaId: b.id, katalogIds: ["base-drawers-800", "base-shelves-600", "tall-pantry-600"] });
console.log(`Projekt ${p.id} utworzony.`);
console.log(await call("wycen_projekt", { projektId: p.id }));
await client.close();
