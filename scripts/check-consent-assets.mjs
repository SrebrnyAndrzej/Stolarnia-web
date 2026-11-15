import { readdirSync } from "node:fs";
import { join } from "node:path";
const root = process.argv[2] ?? "web/public";
function scan(path) {
  const blocked = [];
  for (const item of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, item.name);
    if (item.name.toUpperCase().startsWith("ZGODA-KLIENTA_"))
      blocked.push(file);
    if (item.isDirectory()) blocked.push(...scan(file));
  }
  return blocked;
}
const blocked = scan(root);
if (blocked.length) {
  console.error("Build wstrzymany: materiały oczekujące na zgodę klienta.");
  for (const file of blocked) console.error(file);
  process.exitCode = 1;
} else console.log("check:zgody — brak plików z prefiksem ZGODA-KLIENTA_.");
