import { app, s } from "./app.js";

// Lokalny serwer (npm start / npm run dev). Na Vercelu aplikację uruchamia api/index.js.
const port = Number(process.env.PORT ?? 3210);
app.listen(port, () => {
  console.log(`Stolarnia Online: http://localhost:${port}  (API /api, MCP /mcp, dane: ${s.magazyn.plik})`);
});
