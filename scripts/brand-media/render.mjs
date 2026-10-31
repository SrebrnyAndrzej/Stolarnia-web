/** Offline display-only render: reads existing analysis, never updates the project or its engine. */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";
import { technicalView } from "../../dist/server/technical.js";
const root = process.cwd();
const inputs = process.argv.slice(2);
if (inputs.length !== 4)
  throw Error("Podaj trzy pliki analiz i plik materiałów.");
const mats = JSON.parse(fs.readFileSync(inputs[3], "utf8"));
const scenes = inputs.slice(0, 3).map((file, i) => {
  const a = JSON.parse(fs.readFileSync(file, "utf8"));
  const v = technicalView(
    { projekt: () => a.projekt, analiza: () => a, materialy: () => mats },
    a.projekt.id,
  );
  v.projekt.nazwa = `Projekt ${i + 1}`;
  return v;
});
const staticRoots = {
  "/three/": path.join(root, "node_modules/three"),
  "/core/": path.join(root, "dist/core"),
};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname === "/scene.json") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(scenes[Number(u.searchParams.get("index"))]));
    return;
  }
  let file;
  if (u.pathname === "/")
    file = path.join(root, "scripts/brand-media/studio.html");
  else {
    for (const [prefix, base] of Object.entries(staticRoots))
      if (u.pathname.startsWith(prefix)) {
        const found = path.resolve(base, u.pathname.slice(prefix.length));
        if (found.startsWith(base + path.sep)) file = found;
      }
  }
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    "Content-Type",
    file.endsWith(".html") ? "text/html" : "text/javascript",
  );
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(3299, "127.0.0.1", r));
const out = path.join(root, "web/public/renders");
const videoOut = path.join(root, "web/public/animations");
const frames = "/tmp/pan-stolarz-assembly-frames";
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(videoOut, { recursive: true });
fs.mkdirSync(frames, { recursive: true });
let browser;
try {
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? "/usr/bin/chromium",
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1200 },
  });
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto("http://127.0.0.1:3299");
  await page.waitForFunction(() => window.studioReady, {}, { timeout: 30000 });
  for (let i = 0; i < 3; i++) {
    const result = await page.evaluate((i) => window.renderProject(i), i);
    await page.screenshot({
      path: path.join(out, `projekt-${i + 1}.jpg`),
      type: "jpeg",
      quality: 94,
    });
    console.log(`Render ${i + 1}: ${result.parts} obiektów.`);
  }
  if (!process.env.RENDER_STILLS_ONLY) {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForFunction(() => window.studioReady);
    console.log(
      "Animacja:",
      await page.evaluate(() => window.prepareAssembly()),
    );
    for (let frame = 0; frame < 200; frame++) {
      const png = await page.evaluate(
        (p) => {
          window.assemblyFrame(p);
          return document
            .querySelector("canvas")
            .toDataURL("image/png")
            .split(",")[1];
        },
        Math.max(0, Math.min(1, (frame - 15) / 170)),
      );
      fs.writeFileSync(
        path.join(frames, `frame-${String(frame).padStart(3, "0")}.png`),
        Buffer.from(png, "base64"),
      );
      if (frame % 25 === 0) console.log(`Klatka ${frame}/200`);
    }
    fs.copyFileSync(
      path.join(frames, "frame-000.png"),
      path.join(videoOut, "skladanie-szafki-poster.png"),
    );
    execFileSync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-framerate",
      "25",
      "-i",
      path.join(frames, "frame-%03d.png"),
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "22",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      "-map_metadata",
      "-1",
      path.join(videoOut, "skladanie-szafki.mp4"),
    ]);
    console.log("Zapisano trzy rendery i animację 8 s.");
  }
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
