// Funkcja Vercel: cała aplikacja Express (REST /api i MCP /mcp) ze skompilowanego backendu (npm run build).
// Baza w Supabase — wymaga zmiennych SUPABASE_URL i SUPABASE_SECRET_KEY w ustawieniach projektu Vercel.
import { app } from "../dist/server/app.js";

export default app;
