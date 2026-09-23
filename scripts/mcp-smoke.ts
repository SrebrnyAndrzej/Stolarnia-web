// Test dymny serwera MCP przez prawdziwego klienta stdio: `npx tsx scripts/mcp-smoke.ts`
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["--import", "tsx", "src/mcp/stdio.ts"],
  env: { ...process.env, STOLARNIA_DATA: mkdtempSync(join(tmpdir(), "stolarnia-mcp-")) } as Record<string, string>,
});
const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(transport);

const tekst = (r: unknown) => ((r as { content: { text: string }[] }).content[0].text);
const call = async (name: string, args: Record<string, unknown> = {}) => {
  const r = await client.callTool({ name, arguments: args });
  if (r.isError) throw new Error(`${name}: ${tekst(r)}`);
  return tekst(r);
};

const narzedzia = await client.listTools();
console.log(`Narzędzia (${narzedzia.tools.length}):`, narzedzia.tools.map((t) => t.name).join(", "));

const projekt = JSON.parse(await call("utworz_projekt", { nazwa: "Kuchnia MCP", sciany: [{ dlugoscMM: 3000 }], materialFrontuId: "kronospan-k003-pw" }));
const sc = projekt.pomieszczenia[0].sciany[0].id;
await call("wypelnij_sciane", { projektId: projekt.id, scianaId: sc, katalogIds: ["base-drawers-600", "base-sink-800", "dishwasher-front-600", "base-cargo-300"] });
await call("wypelnij_sciane", { projektId: projekt.id, scianaId: sc, katalogIds: ["wall-shelves-800", "wall-lift-up-600", "wall-shelves-600"] });
console.log("\nwaliduj_projekt:", await call("waliduj_projekt", { projektId: projekt.id }));
console.log("\nwycen_projekt:", await call("wycen_projekt", { projektId: projekt.id }));
console.log("\nrozkroj_plyt:", await call("rozkroj_plyt", { projektId: projekt.id }));
const bladny = await client.callTool({ name: "dodaj_modul", arguments: { projektId: projekt.id, katalogId: "nie-ma" } });
console.log("\nbłąd oczekiwany:", bladny.isError, tekst(bladny));
const prompty = await client.listPrompts();
console.log("Prompty:", prompty.prompts.map((p) => p.name).join(", "));
await client.close();
