#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { utworzSerwerMcp } from "./server.js";

// Wejście stdio — dla Claude Desktop / Claude Code (`claude mcp add stolarnia -- npx tsx src/mcp/stdio.ts`).
// Dane w STOLARNIA_DATA (domyślnie ./data) — ten sam plik co aplikacja web.
const server = utworzSerwerMcp();
await server.connect(new StdioServerTransport());
console.error("Serwer MCP Stolarnia działa (stdio).");
