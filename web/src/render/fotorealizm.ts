import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { granice, punktNaRzucie, scianyNaRzucie, type ScianaNaRzucie } from "../../../src/core/geometry";
import type { Element, Modul, ZbudowanyModul } from "../../../src/core/types";
import type { Analiza, Material } from "../api";

// Wizualizacja ofertowa: ta sama geometria co produkcja (elementy z buildera), ale z materiałami PBR,
// światłem dziennym przez okno, cieniami, okluzją otoczenia (GTAO) i supersamplingiem.
// Dekory drewnopodobne są generowane proceduralnie w skali 1:1 (UV w metrach), jednolite — z próbki dekoru.

const M = 1 / 1000;

export interface Ujecie {
  id: string;
  tytul: string;
  /** Pozycja kamery i cel w metrach (X = rzut X, Z = rzut Y, Y = wysokość). */
  kamera: [number, number, number];
  cel: [number, number, number];
  fov: number;
  /** Widok „makiety” — bez sufitu i ścian od strony kamery. */
  makieta?: boolean;
  /** Otwarte drzwi i wysunięte półki systemu narożnego. */
  otwartyNaroznik?: boolean;
}

export interface Render {
  ujecie: Ujecie;
  /** JPEG jako data URL. */
  obraz: string;
}

// ---------- pomocnicze ----------

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashTekstu(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

async function sredniKolor(url: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = c.height = 24;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0, 24, 24);
    const d = g.getImageData(0, 0, 24, 24).data;
    let r = 0, gg = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i];
      gg += d[i + 1];
      b += d[i + 2];
    }
    const n = d.length / 4;
    return `rgb(${Math.round(r / n)},${Math.round(gg / n)},${Math.round(b / n)})`;
  } catch {
    return null;
  }
}

const SZER_DREWNA_M = 1.0; // tekstura drewna: 1 m w poprzek słojów (1 px ≈ 1 mm)
const DL_DREWNA_M = 2.0; // i 2 m wzdłuż

/**
 * Proceduralny dąb rustykalny (typu Artisan): deski 12–22 cm o różnym tonie, w każdej słoje prostymi liniami
 * albo „katedrami” (rysunek przekroju stycznego), pory dębu jako krótkie kreski i pojedyncze sęki. Słoje wzdłuż osi V.
 */
function teksturaDrewna(bazaCss: string, seed: number): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const W = 1024;
  const H = 2048;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const los = rng(seed);
  g.fillStyle = bazaCss;
  g.fillRect(0, 0, W, H);

  const linia = (pkt: [number, number][], kolor: string, grub: number) => {
    g.strokeStyle = kolor;
    g.lineWidth = grub;
    g.beginPath();
    pkt.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  };

  let x = 0;
  while (x < W) {
    const w = Math.min(W - x, 120 + los() * 100);
    // ton deski + miękki gradient w poprzek
    const ton = (los() - 0.5) * 0.3;
    g.fillStyle = ton > 0 ? `rgba(255,238,210,${ton * 0.8})` : `rgba(70,40,15,${-ton})`;
    g.fillRect(x, 0, w, H);
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, "rgba(60,35,12,0.06)");
    gr.addColorStop(0.5, "rgba(255,240,215,0.04)");
    gr.addColorStop(1, "rgba(60,35,12,0.06)");
    g.fillStyle = gr;
    g.fillRect(x, 0, w, H);

    const katedra = los() < 0.55;
    if (katedra) {
      // Rysunek „płomienny”: zagnieżdżone łuki z wierzchołkiem w losowym miejscu deski
      const cx = x + w * (0.3 + los() * 0.4);
      const wierzch = los() * H;
      for (let j = 1; j <= 16; j++) {
        const szer = j * (w / 34) * (0.9 + los() * 0.2);
        const wys = 90 + j * (55 + los() * 25);
        const pkt: [number, number][] = [];
        for (let t = -1; t <= 1.0001; t += 0.05) {
          const px = cx + t * szer + Math.sin(t * 9 + j) * 1.5;
          const py = wierzch - j * 26 + wys * Math.pow(Math.abs(t), 1.6);
          pkt.push([px, py]);
        }
        // proste przedłużenia łuku wzdłuż deski
        pkt.unshift([cx - szer + Math.sin(j) * 2, H + 50]);
        pkt.push([cx + szer + Math.cos(j) * 2, H + 50]);
        linia(pkt, `rgba(80,48,20,${0.07 + los() * 0.08})`, 1 + los() * 2.2);
      }
    }
    // Słoje proste (także obok katedry)
    const n = katedra ? 18 : 40;
    for (let i = 0; i < n; i++) {
      const x0 = x + los() * w;
      const amp = 0.5 + los() * 2.5;
      const f = ((0.5 + los() * 1.5) / H) * Math.PI * 2;
      const ph = los() * 6.28;
      const pkt: [number, number][] = [];
      for (let y = -20; y <= H + 20; y += 32) pkt.push([x0 + Math.sin(y * f + ph) * amp, y]);
      linia(pkt, los() < 0.7 ? `rgba(80,48,20,${0.05 + los() * 0.08})` : `rgba(255,240,215,${0.05 + los() * 0.06})`, 0.8 + los() * 2);
    }
    // Pory dębu
    for (let i = 0; i < w * 5; i++) {
      g.fillStyle = `rgba(50,28,10,${0.08 + los() * 0.14})`;
      g.fillRect(x + los() * w, los() * H, 0.9, 3 + los() * 9);
    }
    // Rzadki sęk
    if (los() < 0.35) {
      const kx = x + w * (0.2 + los() * 0.6);
      const ky = los() * H;
      const r = 5 + los() * 7;
      for (let i = 9; i >= 1; i--) {
        g.strokeStyle = `rgba(60,34,12,${i < 3 ? 0.35 : 0.07})`;
        g.lineWidth = 1.2;
        g.beginPath();
        g.ellipse(kx, ky, r * i * 0.5, r * i * 1.6, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.fillStyle = "rgba(55,30,10,0.6)";
      g.beginPath();
      g.ellipse(kx, ky, r * 0.7, r * 1.1, 0, 0, Math.PI * 2);
      g.fill();
    }
    // Styk desek
    g.fillStyle = "rgba(45,26,10,0.18)";
    g.fillRect(x + w - 1, 0, 1, H);
    x += w;
  }

  // Zmiękczenie (skan dekoru nie ma ostrych pikseli)
  const kopia = document.createElement("canvas");
  kopia.width = W;
  kopia.height = H;
  const k = kopia.getContext("2d")!;
  k.filter = "blur(0.7px)";
  k.drawImage(c, 0, 0);
  g.clearRect(0, 0, W, H);
  g.drawImage(kopia, 0, 0);

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1 / SZER_DREWNA_M, 1 / DL_DREWNA_M);
  map.anisotropy = 16;
  const bump = new THREE.CanvasTexture(c);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.copy(map.repeat);
  return { map, bump };
}

/** Mikrostruktura płyty jednobarwnej (SU / ST9 mat). */
function teksturaSzumu(seed: number, sila: number): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);
  const los = rng(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (los() - 0.5) * sila;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 0.25, 1 / 0.25);
  return t;
}

function teksturaPodlogi(): THREE.CanvasTexture {
  // Gres 60×120, jasny ciepły szary; 1024 px = 1,2 m
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const los = rng(7);
  for (const [x, y, w, h] of [[0, 0, 512, 1024], [512, -512, 512, 1024], [512, 512, 512, 1024]] as const) {
    const t = 214 + (los() - 0.5) * 10;
    g.fillStyle = `rgb(${t},${t - 5},${t - 12})`;
    g.fillRect(x, y, w, h);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${los() < 0.5 ? "255,255,255" : "120,110,100"},${0.02 + los() * 0.05})`;
      g.beginPath();
      g.ellipse(x + los() * w, y + los() * h, 6 + los() * 60, 3 + los() * 30, los() * 3, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.fillStyle = "rgba(150,142,132,1)";
  g.fillRect(0, 0, S, 2);
  g.fillRect(0, 0, 2, S);
  g.fillRect(512, 0, 2, S);
  g.fillRect(512, 512, 512, 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 1.2, 1 / 1.2);
  t.anisotropy = 16;
  return t;
}

function teksturaNieba(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#bcd6f2");
  gr.addColorStop(0.55, "#e9f1f7");
  gr.addColorStop(0.62, "#cfdcc5");
  gr.addColorStop(1, "#8fa77e");
  g.fillStyle = gr;
  g.fillRect(0, 0, 1024, 512);
  const los = rng(3);
  // rozmyte korony drzew
  g.filter = "blur(10px)";
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(${70 + los() * 40},${105 + los() * 40},${60 + los() * 30},${0.35 + los() * 0.4})`;
    g.beginPath();
    g.ellipse(los() * 1024, 300 + los() * 60, 40 + los() * 80, 30 + los() * 70, 0, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function teksturaPlyty(): THREE.CanvasTexture {
  // Płyta indukcyjna: czarne szkło z polami grzewczymi i panelem sterowania
  const c = document.createElement("canvas");
  c.width = 590;
  c.height = 520;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0b0b0c";
  g.fillRect(0, 0, 590, 520);
  g.strokeStyle = "rgba(200,200,200,0.35)";
  g.lineWidth = 2;
  for (const [x, y, r] of [[150, 150, 95], [440, 150, 80], [150, 360, 80], [440, 360, 95]]) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = "rgba(220,220,220,0.5)";
  for (let i = 0; i < 9; i++) g.fillRect(200 + i * 22, 492, 10, 3);
  return new THREE.CanvasTexture(c);
}

/** UV w metrach z rzutu płaskiego; oś V = kierunek słojów elementu. */
function uvWMetrach(geo: THREE.BufferGeometry, osSlojow: "x" | "y", przes: [number, number]) {
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const [ax, ay, az] = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
    let u: number, v: number;
    if (az >= ax && az >= ay) [u, v] = osSlojow === "y" ? [x, y] : [y, x];
    else if (ax >= ay) [u, v] = osSlojow === "y" ? [z, y] : [y, z];
    else [u, v] = osSlojow === "y" ? [x, z] : [z, x];
    uv[i * 2] = u + przes[0];
    uv[i * 2 + 1] = v + przes[1];
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

// ---------- materiały ----------

interface ZestawMaterialow {
  plyta: (id: string | undefined, zapas: string) => THREE.MeshStandardMaterial;
  bialy: THREE.MeshStandardMaterial;
  stal: THREE.MeshStandardMaterial;
  chrom: THREE.MeshStandardMaterial;
  czarnyMat: THREE.MeshStandardMaterial;
  szklo: THREE.MeshPhysicalMaterial;
}

const DREWNO = /dąb|dab|oak|orzech|walnut|buk|beech|jesion|ash|drewn|wood|artisan/i;

async function przygotujMaterialy(matMap: Map<string, Material>, ids: string[]): Promise<ZestawMaterialow> {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  for (const id of new Set(ids)) {
    const m = matMap.get(id);
    if (!m) continue;
    const drewno = DREWNO.test(`${m.nazwa} ${m.dekor} ${m.grupaDekoru ?? ""}`) || (m.kierunekDekoru && m.typ !== "blatLaminowany" ? DREWNO.test(m.nazwa) : false) || (m.typ === "blatLaminowany" && m.kolorHEX !== "#cccccc");
    let kolor = m.kolorHEX && m.kolorHEX.toLowerCase() !== "#cccccc" ? m.kolorHEX : null;
    if (m.zdjecieURL && (!kolor || !drewno)) kolor = (await sredniKolor(m.zdjecieURL)) ?? kolor;
    kolor ??= "#d8d2c8";
    const mat = drewno
      ? (() => {
          const t = teksturaDrewna(kolor, hashTekstu(id));
          return new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 0.6, roughness: m.typ === "blatLaminowany" ? 0.42 : 0.55 });
        })()
      : new THREE.MeshStandardMaterial({ color: new THREE.Color(kolor), roughness: /ST9|mat/i.test(`${m.struktura ?? ""} ${m.nazwa}`) ? 0.72 : 0.58, bumpMap: teksturaSzumu(hashTekstu(id), 40), bumpScale: 0.25 });
    cache.set(id, mat);
  }
  const zapasowe = new Map<string, THREE.MeshStandardMaterial>();
  return {
    plyta: (id, zapas) => (id && cache.get(id)) || zapasowe.get(zapas) || zapasowe.set(zapas, new THREE.MeshStandardMaterial({ color: new THREE.Color(zapas), roughness: 0.6 })).get(zapas)!,
    bialy: new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 0.5 }),
    stal: new THREE.MeshStandardMaterial({ color: 0xcfd2d4, metalness: 1, roughness: 0.28 }),
    chrom: new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 1, roughness: 0.08 }),
    czarnyMat: new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.45, metalness: 0.3 }),
    szklo: new THREE.MeshPhysicalMaterial({ color: 0x0a0a0b, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, map: teksturaPlyty() }),
  };
}

// ---------- scena ----------

function bryla(szer: number, wys: number, gl: number, mat: THREE.Material, promien = 1, osSlojow: "x" | "y" = "y", seed = 0): THREE.Mesh {
  const r = Math.min(promien, szer / 2 - 0.01, wys / 2 - 0.01, gl / 2 - 0.01) * M;
  const geo = r > 0.0002 ? new RoundedBoxGeometry(szer * M, wys * M, gl * M, 2, r) : new THREE.BoxGeometry(szer * M, wys * M, gl * M);
  const los = rng(seed);
  uvWMetrach(geo, osSlojow, [los() * 3, los() * 3]);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Grupa w układzie modułu: X wzdłuż ściany od lewej krawędzi, Z od lica ściany do pokoju, Y od podłogi. */
function grupaModulu(w: ScianaNaRzucie, m: Modul): THREE.Group {
  const g = new THREE.Group();
  const [x, z] = punktNaRzucie(w, m.pozycjaXMM, 0);
  g.position.set(x * M, 0, z * M);
  g.rotation.y = Math.atan2(-w.dy, w.dx);
  return g;
}

function osSlojow(e: Element): "x" | "y" {
  return e.rola === "front" || e.rola === "filler" || e.rola === "side" || e.rola === "back" ? "y" : "x";
}

function nerka(mat: ZestawMaterialow, dl = 780, gl = 440): THREE.Group {
  const r = gl / 2;
  const a = dl / 2 - r;
  const s = new THREE.Shape();
  s.moveTo(-a, -r);
  s.lineTo(a, -r);
  s.absarc(a, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.quadraticCurveTo(0, r - 110, -a, r);
  s.absarc(-a, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  const g = new THREE.Group();
  const dno = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 10, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.5 }));
  dno.rotation.x = -Math.PI / 2;
  dno.scale.setScalar(M);
  dno.castShadow = dno.receiveShadow = true;
  g.add(dno);
  const pkt = s.getSpacedPoints(90).map((p) => new THREE.Vector3(p.x * M * 0.985, 0.075, -p.y * M * 0.985));
  const reling = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pkt, true), 200, 0.005, 10, true), mat.chrom);
  reling.castShadow = true;
  g.add(reling);
  for (let i = 0; i < pkt.length - 1; i += 9) {
    const slupek = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.075, 8), mat.chrom);
    slupek.position.set(pkt[i].x, 0.0375, pkt[i].z);
    g.add(slupek);
  }
  return g;
}

function naczynie(mat: THREE.Material, r: number, h: number): THREE.Mesh {
  const pkt = [new THREE.Vector2(0, 0), new THREE.Vector2(r * 0.92, 0), new THREE.Vector2(r, h * 0.1), new THREE.Vector2(r, h), new THREE.Vector2(r * 0.95, h), new THREE.Vector2(r * 0.95, 0.004)];
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(pkt, 48), mat);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

interface Scena {
  scene: THREE.Scene;
  sciany: { mesh: THREE.Object3D; cx: number; cz: number; nx: number; nz: number }[];
  sufit: THREE.Object3D;
  naroznik: { drzwi: THREE.Object3D; otwarte: THREE.Object3D[]; kat: number }[];
  srodek: [number, number];
  /** Zajęte odcinki ścian przez szafki z blatem (do ustawiania dekoracji). */
  zajete: { scianaId: string; a0: number; a1: number }[];
}

export async function zbudujScene(analiza: Analiza, matMap: Map<string, Material>, pomieszczenieId?: string): Promise<Scena> {
  const scene = new THREE.Scene();
  const p = analiza.projekt;
  const pom = p.pomieszczenia.find((r) => r.id === pomieszczenieId) ?? p.pomieszczenia[0];
  const rzut = scianyNaRzucie(pom);
  const g = granice(rzut, 0);
  const wysPom = Math.max(...pom.sciany.map((s) => s.wysokoscMM)) * M;
  const zb = analiza.zbudowane.filter((z) => rzut.some((w) => w.sciana.id === z.modul.scianaId));
  const ids = [pom.materialKorpusuId, pom.materialFrontuId, pom.materialBlatuId, ...zb.flatMap((z) => [z.modul.materialKorpusuId, z.modul.materialFrontuId])].filter(Boolean) as string[];
  const mat = await przygotujMaterialy(matMap, ids);
  const sc: Scena = {
    scene,
    sciany: [],
    sufit: new THREE.Group(),
    naroznik: [],
    srodek: [(g.x + g.w / 2) * M, (g.y + g.h / 2) * M],
    zajete: zb.filter((z) => z.modul.konfiguracja.blat).map((z) => ({ scianaId: z.modul.scianaId, a0: z.modul.pozycjaXMM, a1: z.modul.pozycjaXMM + z.modul.szerokoscMM })),
  };

  // --- Otoczenie i światło ---
  RectAreaLightUniformsLib.init();
  scene.add(new THREE.HemisphereLight(0xf3f6ff, 0xb8a894, 0.18));

  // Podłoga
  const podloga = new THREE.Mesh(new THREE.PlaneGeometry(g.w * M + 1, g.h * M + 1), new THREE.MeshStandardMaterial({ map: teksturaPodlogi(), roughness: 0.42 }));
  podloga.rotation.x = -Math.PI / 2;
  podloga.position.set(sc.srodek[0], 0, sc.srodek[1]);
  podloga.receiveShadow = true;
  const uvP = podloga.geometry.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uvP.count; i++) uvP.setXY(i, uvP.getX(i) * (g.w * M + 1), uvP.getY(i) * (g.h * M + 1));
  scene.add(podloga);

  // Sufit
  const sufit = new THREE.Mesh(new THREE.BoxGeometry(g.w * M + 1, 0.1, g.h * M + 1), new THREE.MeshStandardMaterial({ color: 0xf7f6f3, roughness: 0.95 }));
  sufit.position.set(sc.srodek[0], wysPom + 0.05, sc.srodek[1]);
  sufit.castShadow = true;
  sufit.receiveShadow = true;
  scene.add(sufit);
  sc.sufit = sufit;

  // Ściany; ściana z oknem („okno” w nazwie) dostaje otwór okienny nad blatem
  const matSciany = new THREE.MeshStandardMaterial({ color: 0xeeebe5, roughness: 0.93 });
  const nieboTex = teksturaNieba();
  for (const w of rzut) {
    const L = w.sciana.dlugoscMM;
    const H = w.sciana.wysokoscMM;
    const grupa = new THREE.Group();
    const kawalek = (a0: number, a1: number, y0: number, y1: number) => {
      if (a1 - a0 <= 0 || y1 - y0 <= 0) return;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry((a1 - a0) * M, (y1 - y0) * M, 0.12), matSciany);
      const [cx, cz] = punktNaRzucie(w, (a0 + a1) / 2, -60);
      mesh.position.set(cx * M, ((y0 + y1) / 2) * M, cz * M);
      mesh.rotation.y = Math.atan2(-w.dy, w.dx);
      mesh.castShadow = mesh.receiveShadow = true;
      grupa.add(mesh);
    };
    const zOknem = /okno|okien|window/i.test(w.sciana.nazwa);
    if (zOknem) {
      const szerOkna = Math.min(1400, L - 600);
      const [o0, o1] = [(L - szerOkna) / 2, (L + szerOkna) / 2];
      const [s0, s1] = [1000, Math.min(2300, H - 250)];
      kawalek(-120, o0, 0, H);
      kawalek(o1, L + 120, 0, H);
      kawalek(o0, o1, 0, s0);
      kawalek(o0, o1, s1, H);
      const rot = Math.atan2(-w.dy, w.dx);
      const wOknie = (a: number, y: number, odLica: number) => {
        const [x, z] = punktNaRzucie(w, a, odLica);
        return new THREE.Vector3(x * M, y * M, z * M);
      };
      // Rama PCV z przeszkleniem dwuskrzydłowym, parapet
      const rama = new THREE.MeshStandardMaterial({ color: 0xf5f5f3, roughness: 0.35 });
      const profil = (a0: number, a1: number, y0: number, y1: number) => {
        const m = bryla(a1 - a0, y1 - y0, 80, rama, 3);
        m.position.copy(wOknie((a0 + a1) / 2, (y0 + y1) / 2, -80));
        m.rotation.y = rot;
        grupa.add(m);
      };
      profil(o0, o0 + 70, s0, s1);
      profil(o1 - 70, o1, s0, s1);
      profil(o0, o1, s0, s0 + 70);
      profil(o0, o1, s1 - 70, s1);
      profil((o0 + o1) / 2 - 45, (o0 + o1) / 2 + 45, s0, s1);
      const szyba = new THREE.Mesh(new THREE.PlaneGeometry((o1 - o0) * M, (s1 - s0) * M), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.02, metalness: 0, clearcoat: 1 }));
      szyba.position.copy(wOknie((o0 + o1) / 2, (s0 + s1) / 2, -80));
      szyba.rotation.y = rot;
      grupa.add(szyba);
      const parapet = bryla(o1 - o0 + 80, 25, 200, new THREE.MeshStandardMaterial({ color: 0xeae7e1, roughness: 0.3 }), 3);
      parapet.position.copy(wOknie((o0 + o1) / 2, s0 - 12, -30));
      parapet.rotation.y = rot;
      grupa.add(parapet);
      // Widok za oknem (świecąca plansza)
      const widok = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), new THREE.MeshBasicMaterial({ map: nieboTex, color: new THREE.Color(1.6, 1.6, 1.6) }));
      widok.position.copy(wOknie(L / 2, 1400, -3500));
      widok.rotation.y = rot;
      scene.add(widok);
      // Światło nieba z okna (miękkie) + słońce przez okno (ostre cienie)
      const niebo = new THREE.RectAreaLight(0xe4ecff, 14, (o1 - o0) * M, (s1 - s0) * M);
      niebo.position.copy(wOknie((o0 + o1) / 2, (s0 + s1) / 2, -40));
      niebo.lookAt(wOknie((o0 + o1) / 2, (s0 + s1) / 2, 2000));
      scene.add(niebo);
      // Słońce ~40° nad horyzontem, z boku: plama światła na blacie, frontach i podłodze
      const slonce = new THREE.DirectionalLight(0xffe9c8, 5.5);
      const srodekOkna = wOknie((o0 + o1) / 2, (s0 + s1) / 2, 0);
      const cel = wOknie((o0 + o1) / 2 + 800, 0, 1700);
      slonce.position.copy(srodekOkna.clone().add(srodekOkna.clone().sub(cel).multiplyScalar(3)));
      slonce.target.position.copy(cel);
      slonce.castShadow = true;
      slonce.shadow.mapSize.set(4096, 4096);
      slonce.shadow.bias = -0.0004;
      slonce.shadow.normalBias = 0.02;
      Object.assign(slonce.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 14 });
      scene.add(slonce, slonce.target);
    } else {
      kawalek(-120, L + 120, 0, H);
    }
    scene.add(grupa);
    const [cx, cz] = punktNaRzucie(w, L / 2, -60);
    sc.sciany.push({ mesh: grupa, cx: cx * M, cz: cz * M, nx: w.nx, nz: w.ny });
  }

  // Oczka halogenowe w suficie (ciepłe 3000 K)
  for (const [fx, fz] of [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) {
    const x = (g.x + g.w * fx) * M;
    const z = (g.y + g.h * fz) * M;
    const l = new THREE.PointLight(0xffd9a8, 1.1, 6, 2);
    l.position.set(x, wysPom - 0.08, z);
    scene.add(l);
    const oczko = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), new THREE.MeshBasicMaterial({ color: 0xfff1dc }));
    oczko.rotation.x = Math.PI / 2;
    oczko.position.set(x, wysPom - 0.001, z);
    scene.add(oczko);
  }

  // --- Meble ---
  zbudujBlaty(sc, zb, rzut, mat.plyta(pom.materialBlatuId, "#a98f6e"));
  for (const z of zb) dodajModul(sc, z, rzut, pom, mat);

  // Lodówka side-by-side w największej luce ciągu słupków
  for (const w of rzut) {
    const slupki = zb.filter((z) => z.modul.scianaId === w.sciana.id && z.modul.kategoria === "tall").map((z) => z.modul).sort((a, b) => a.pozycjaXMM - b.pozycjaXMM);
    for (let i = 0; i < slupki.length - 1; i++) {
      const a = slupki[i];
      const b = slupki[i + 1];
      const luka = b.pozycjaXMM - (a.pozycjaXMM + a.szerokoscMM);
      if (luka < 800 || !/lodów|chłodz/i.test(`${w.sciana.nazwa} ${a.uwagi ?? ""} ${b.uwagi ?? ""}`)) continue;
      const gr = grupaModulu(w, { ...a, pozycjaXMM: a.pozycjaXMM + a.szerokoscMM } as Modul);
      const szer = Math.min(luka - 20, 910);
      const x0 = (luka - szer) / 2;
      const korpus = bryla(szer, 1780, 660, mat.stal, 12, "y");
      korpus.position.set((x0 + szer / 2) * M, 0.02 + 0.89, 0.33);
      gr.add(korpus);
      const szczelina = new THREE.Mesh(new THREE.BoxGeometry(0.004, 1.74, 0.004), mat.czarnyMat);
      szczelina.position.set((x0 + szer * 0.42) * M, 0.91, 0.661);
      gr.add(szczelina);
      for (const hx of [szer * 0.42 - 45, szer * 0.42 + 45]) {
        const u = bryla(20, 900, 30, mat.stal, 8);
        u.position.set((x0 + hx) * M, 1.05, 0.69);
        gr.add(u);
      }
      sc.scene.add(gr);
    }
  }
  return sc;
}

/** Otwór pod komorę zlewu w układzie modułu: środek wzdłuż (cx) i od lica ściany (cz). */
function otworZlewu(e: Element, D: number) {
  const przod = D - e.z;
  return { ow: 440, od: 400, cx: e.x + e.szer / 2, cz: przod - 60 - 240 };
}

/** Jeden blat na każdy ciągły odcinek szafek przy ścianie, z otworami pod zlewy (bez łączeń co szafkę). */
function zbudujBlaty(sc: Scena, zb: ZbudowanyModul[], rzut: ScianaNaRzucie[], mat: THREE.Material) {
  for (const w of rzut) {
    const odcinki: { a0: number; a1: number; f0: number; f1: number; y: number; t: number; otwory: { cx: number; cz: number; ow: number; od: number }[] }[] = [];
    const blaty = zb
      .filter((z) => z.modul.scianaId === w.sciana.id)
      .flatMap((z) => z.elementy.filter((e) => e.rola === "worktop").map((e) => ({ z, e })))
      .sort((a, b) => a.z.modul.pozycjaXMM + a.e.x - (b.z.modul.pozycjaXMM + b.e.x));
    for (const { z, e } of blaty) {
      const m = z.modul;
      const D = m.glebokoscMM;
      const b = { a0: m.pozycjaXMM + e.x, a1: m.pozycjaXMM + e.x + e.szer, f0: D - e.z - e.gl, f1: D - e.z, y: m.pozycjaYMM + e.y, t: e.wys, otwory: [] as { cx: number; cz: number; ow: number; od: number }[] };
      if (m.konstrukcja === "sink") {
        const o = otworZlewu(e, D);
        b.otwory.push({ ...o, cx: m.pozycjaXMM + o.cx });
      }
      const ost = odcinki[odcinki.length - 1];
      if (ost && Math.abs(ost.a1 - b.a0) < 3 && ost.y === b.y && ost.t === b.t && ost.f0 === b.f0 && ost.f1 === b.f1) {
        ost.a1 = b.a1;
        ost.otwory.push(...b.otwory);
      } else odcinki.push(b);
    }
    for (const o of odcinki) {
      const s = new THREE.Shape();
      s.moveTo(o.a0, o.f0);
      s.lineTo(o.a1, o.f0);
      s.lineTo(o.a1, o.f1);
      s.lineTo(o.a0, o.f1);
      s.closePath();
      for (const h of o.otwory) {
        const r = 30;
        const [x0, x1, z0, z1] = [h.cx - h.ow / 2, h.cx + h.ow / 2, h.cz - h.od / 2, h.cz + h.od / 2];
        const p = new THREE.Path();
        p.moveTo(x0 + r, z0);
        p.lineTo(x1 - r, z0);
        p.quadraticCurveTo(x1, z0, x1, z0 + r);
        p.lineTo(x1, z1 - r);
        p.quadraticCurveTo(x1, z1, x1 - r, z1);
        p.lineTo(x0 + r, z1);
        p.quadraticCurveTo(x0, z1, x0, z1 - r);
        p.lineTo(x0, z0 + r);
        p.quadraticCurveTo(x0, z0, x0 + r, z0);
        s.holes.push(p);
      }
      const geo = new THREE.ExtrudeGeometry(s, { depth: o.t - 3, bevelEnabled: true, bevelSize: 1.5, bevelThickness: 1.5, bevelSegments: 2, curveSegments: 8 });
      geo.rotateX(Math.PI / 2); // kształt (wzdłuż, od lica) → (X, Z); wyciągnięcie w dół
      geo.scale(M, M, M);
      geo.translate(0, (o.y + o.t - 1.5) * M, 0);
      uvWMetrach(geo, "x", [hashTekstu(w.sciana.id) % 7, 0.3]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = mesh.receiveShadow = true;
      const grupa = new THREE.Group();
      const [x, z] = punktNaRzucie(w, 0, 0);
      grupa.position.set(x * M, 0, z * M);
      grupa.rotation.y = Math.atan2(-w.dy, w.dx);
      grupa.add(mesh);
      sc.scene.add(grupa);
    }
  }
}

function dodajModul(sc: Scena,z: ZbudowanyModul, rzut: ScianaNaRzucie[], pom: Analiza["projekt"]["pomieszczenia"][number], mat: ZestawMaterialow) {
  const m = z.modul;
  const w = rzut.find((q) => q.sciana.id === m.scianaId);
  if (!w) return;
  const gr = grupaModulu(w, m);
  const D = m.glebokoscMM;
  const Y = m.pozycjaYMM;
  const korpus = mat.plyta(m.materialKorpusuId ?? pom.materialKorpusuId, "#f1efe9");
  const front = mat.plyta(m.materialFrontuId ?? pom.materialFrontuId, "#c9b28f");
  const blat = mat.plyta(pom.materialBlatuId, "#a98f6e");
  const seed = hashTekstu(m.id);
  const lokalnie = (e: Element) => new THREE.Vector3((e.x + e.szer / 2) * M, (Y + e.y + e.wys / 2) * M, (D - (e.z + e.gl / 2)) * M);

  const zlew = m.konstrukcja === "sink";
  const plyta = /indukc|płyt[aęy] grzew|kuchenk/i.test(`${m.nazwa} ${m.uwagi ?? ""}`);
  const lemans = m.konfiguracja.systemNarozny === "lemans";

  for (const [i, e] of z.elementy.entries()) {
    if (e.rola === "drawerSide" || e.rola === "drawerFrontBack" || e.rola === "drawerBottom") continue;
    if (e.rola === "worktop") {
      const blatY = Y + e.y;
      const g = e.wys;
      // Blat jest budowany w całości dla ciągu szafek (zbudujBlaty) — tu tylko zlew i płyta
      if (zlew) {
        const { ow, od, cx: cxA, cz } = otworZlewu(e, D);
        const komora = new THREE.Mesh(new THREE.BoxGeometry(ow * M, 0.19, od * M), new THREE.MeshStandardMaterial({ color: 0xc9ccce, metalness: 1, roughness: 0.32, side: THREE.BackSide }));
        komora.position.set(cxA * M, (blatY + g) * M - 0.095 + 0.001, cz * M);
        komora.receiveShadow = true;
        gr.add(komora);
        // Rant komory (stal szczotkowana, 18 mm wokół otworu)
        const rant = new THREE.Shape();
        const [rw, rd] = [ow / 2 + 18, od / 2 + 18];
        rant.moveTo(-rw, -rd);
        rant.lineTo(rw, -rd);
        rant.lineTo(rw, rd);
        rant.lineTo(-rw, rd);
        rant.closePath();
        const dziura = new THREE.Path();
        dziura.moveTo(-ow / 2, -od / 2);
        dziura.lineTo(-ow / 2, od / 2);
        dziura.lineTo(ow / 2, od / 2);
        dziura.lineTo(ow / 2, -od / 2);
        dziura.closePath();
        rant.holes.push(dziura);
        const rantGeo = new THREE.ExtrudeGeometry(rant, { depth: 1.2, bevelEnabled: true, bevelSize: 0.8, bevelThickness: 0.6, bevelSegments: 2 });
        rantGeo.rotateX(-Math.PI / 2);
        rantGeo.scale(M, M, M);
        const rantMesh = new THREE.Mesh(rantGeo, new THREE.MeshStandardMaterial({ color: 0xd4d6d8, metalness: 1, roughness: 0.38 }));
        rantMesh.position.set(cxA * M, (blatY + g) * M, cz * M);
        rantMesh.receiveShadow = true;
        gr.add(rantMesh);
        const odplyw = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.004, 24), mat.chrom);
        odplyw.position.set(cxA * M, (blatY + g) * M - 0.188, cz * M);
        gr.add(odplyw);
        // Bateria
        const bx = cxA * M;
        const bz = (cz - od / 2 - 70) * M;
        const top = (blatY + g) * M;
        const trzon = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.3, 24), mat.chrom);
        trzon.position.set(bx, top + 0.15, bz);
        const wylewka = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CubicBezierCurve3(new THREE.Vector3(bx, top + 0.29, bz), new THREE.Vector3(bx, top + 0.42, bz), new THREE.Vector3(bx, top + 0.42, bz + 0.2), new THREE.Vector3(bx, top + 0.3, bz + 0.22)), 40, 0.011, 16),
          mat.chrom,
        );
        const dzwignia = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 12), mat.chrom);
        dzwignia.position.set(bx + 0.03, top + 0.2, bz);
        dzwignia.rotation.z = -1.1;
        for (const o of [trzon, wylewka, dzwignia]) {
          o.castShadow = true;
          gr.add(o);
        }
        continue;
      }
      if (plyta) {
        const pl = bryla(590, 6, 520, mat.szklo, 2, "x");
        const przod = D - e.z;
        pl.position.set((e.szer / 2) * M, (Y + e.y + e.wys + 3) * M, (przod - 60 - 260) * M);
        // UV płyty: 0..1 na górnej ścianie
        const pos = pl.geometry.getAttribute("position");
        const uv = pl.geometry.getAttribute("uv") as THREE.BufferAttribute;
        for (let j = 0; j < pos.count; j++) uv.setXY(j, pos.getX(j) / 0.59 + 0.5, pos.getZ(j) / 0.52 + 0.5);
        gr.add(pl);
      }
      continue;
    }
    const materialEl = e.materialRola === "front" ? front : e.materialRola === "plecy" ? mat.bialy : korpus;
    const b = bryla(e.szer, e.wys, e.gl, materialEl, e.materialRola === "front" ? 1.5 : 1, osSlojow(e), seed + i * 7);
    const poz = lokalnie(e);
    const drzwiLeMans = lemans && e.kod.startsWith("FRONT-D");
    if (drzwiLeMans) {
      // Drzwi na zawiasie: obrót wokół krawędzi zawiasowej (strona drzwi narożnika)
      const lewe = m.konfiguracja.stronaDrzwiNaroznika === "lewa";
      const oska = new THREE.Group();
      oska.position.set((lewe ? e.x : e.x + e.szer) * M, poz.y, (D - e.z) * M);
      const kier = lewe ? 1 : -1;
      b.position.set(((kier * e.szer) / 2) * M, 0, (-e.gl / 2) * M);
      oska.add(b);
      uchwytPionowy(oska, kier * (e.szer - 45) * M, (wysokoscUchwytu(e, m) - (Y + e.y + e.wys / 2)) * M, 0.022, mat);
      gr.add(oska);
      sc.naroznik.push({ drzwi: oska, otwarte: [], kat: -kier * 1.92 });
      continue;
    }
    b.position.copy(poz);
    gr.add(b);
    if (e.rola === "front" && e.kod !== "FRONT-AGD") dodajUchwytFrontu(gr, e, m, z, mat);
  }

  // Cokół cofnięty 50 mm
  if (m.konfiguracja.nogi && Y > 0) {
    const c = bryla(m.szerokoscMM, Y - 4, 16, front, 1, "x", seed + 99);
    c.position.set((m.szerokoscMM / 2) * M, ((Y - 4) / 2) * M, (D - 50) * M);
    gr.add(c);
  }

  // LeMans: dwie nerki — górna wysunięta przed szafkę, dolna w korpusie (widoczna przez otwarte drzwi)
  if (lemans) {
    const drzwi = z.elementy.find((e) => e.kod.startsWith("FRONT-D"));
    if (drzwi) {
      const lewe = m.konfiguracja.stronaDrzwiNaroznika === "lewa";
      const t = 18;
      // Wysunięta półka przed otworem, po stronie przeciwnej do zawiasów (bez kolizji z otwartymi drzwiami)
      const gorna = nerka(mat, 700, 420);
      const srodekX = drzwi.x + drzwi.szer / 2 + (lewe ? 40 : -40);
      gorna.position.set(srodekX * M, (Y + t + 360) * M, (D + 270) * M);
      const dolna = nerka(mat, 700, 420);
      dolna.position.set((lewe ? drzwi.x + 380 : drzwi.x + drzwi.szer - 380) * M, (Y + t + 50) * M, (D - 250) * M);
      // naczynia na wysuniętej półce
      const garnek = naczynie(mat.stal, 0.1, 0.13);
      garnek.position.set(-0.15, 0.012, 0.02);
      const rondel = naczynie(mat.stal, 0.085, 0.08);
      rondel.position.set(0.12, 0.012, -0.03);
      const miska = naczynie(new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.25 }), 0.09, 0.07);
      miska.position.set(0.28, 0.012, 0.06);
      gorna.add(garnek, rondel, miska);
      // kolumna mechanizmu
      const kolumna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, (m.wysokoscMM - 2 * t) * M, 16), mat.chrom);
      kolumna.position.set((lewe ? drzwi.x + drzwi.szer - 40 : drzwi.x + 40) * M, (Y + m.wysokoscMM / 2) * M, (D - 60) * M);
      const ramie = bryla(40, 20, 380, mat.chrom, 4);
      ramie.position.set((lewe ? drzwi.x + drzwi.szer - 40 : drzwi.x + 40) * M, (Y + t + 360) * M, (D + 130) * M);
      for (const o of [gorna, dolna, kolumna, ramie]) o.visible = false;
      gr.add(gorna, dolna, kolumna, ramie);
      const wpis = sc.naroznik[sc.naroznik.length - 1];
      if (wpis) wpis.otwarte.push(gorna, dolna, kolumna, ramie);
    }
  }

  // Dekoracja: misa z owocami na blacie obok zlewu (po stronie, gdzie stoi sąsiednia szafka z blatem)
  const blatZlewu = z.elementy.find((e) => e.rola === "worktop");
  const sasiadZLewej = zlew && sc.zajete.some((q) => q.scianaId === m.scianaId && Math.abs(q.a1 - m.pozycjaXMM) < 3);
  const sasiadZPrawej = zlew && sc.zajete.some((q) => q.scianaId === m.scianaId && Math.abs(q.a0 - (m.pozycjaXMM + m.szerokoscMM)) < 3);
  if (zlew && blatZlewu && (sasiadZLewej || sasiadZPrawej)) {
    const mx = sasiadZLewej ? -190 : m.szerokoscMM + 190;
    const my = (Y + blatZlewu.y + blatZlewu.wys) * M;
    const miska = naczynie(new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.2 }), 0.13, 0.08);
    miska.position.set(mx * M, my, (D - 200) * M);
    gr.add(miska);
    for (const [dx, dz, c] of [[0, 0, 0xe0a030], [0.05, 0.03, 0xd9822b], [-0.04, 0.035, 0xa7b83a]] as const) {
      const owoc = new THREE.Mesh(new THREE.SphereGeometry(0.036, 24, 16), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
      owoc.position.set(mx * M + dx, my + 0.045, (D - 200) * M + dz);
      owoc.castShadow = true;
      gr.add(owoc);
    }
  }
  sc.scene.add(gr);
}

const DL_UCHWYTU = 128 + 32; // uchwyt relingowy rozstaw 128 mm (jak w cenniku)

function dodajUchwytFrontu(gr: THREE.Group, e: Element, m: Modul, z: ZbudowanyModul, mat: ZestawMaterialow) {
  const drzwi = z.elementy.filter((q) => q.kod.startsWith("FRONT-D"));
  const zLica = (m.glebokoscMM - e.z + 22) * M;
  if (e.kod.startsWith("FRONT-D")) {
    const i = drzwi.indexOf(e);
    // Strona zawiasów jak w dokumentacji (technologia.ts) — uchwyt po stronie otwierania
    const zawiasyLewe = m.konstrukcja === "blindCorner" ? m.konfiguracja.stronaDrzwiNaroznika === "lewa" : drzwi.length === 1 ? true : i % 2 === 0;
    uchwytPionowy(gr, (zawiasyLewe ? e.x + e.szer - 45 : e.x + 45) * M, wysokoscUchwytu(e, m) * M, zLica, mat);
  } else if (e.kod.startsWith("FRONT-SZ") || e.kod.startsWith("FRONT-U")) {
    const dl = Math.min(320, e.szer * 0.5);
    const u = bryla(dl, 12, 12, mat.czarnyMat, 3);
    u.position.set((e.x + e.szer / 2) * M, (m.pozycjaYMM + e.y + e.wys - 45) * M, zLica);
    gr.add(u);
    for (const dx of [-dl / 2 + 16, dl / 2 - 16]) {
      const n = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.022, 10), mat.czarnyMat);
      n.rotation.x = Math.PI / 2;
      n.position.copy(u.position).add(new THREE.Vector3(dx * M, 0, -0.011));
      gr.add(n);
    }
  }
}

/** Wysokość środka uchwytu nad podłogą: szafki dolne u góry frontu, wysokie ok. 1050 mm. */
function wysokoscUchwytu(e: Element, m: Modul): number {
  const dol = m.pozycjaYMM + e.y;
  const wysoki = m.kategoria === "tall" || m.wysokoscMM > 1400;
  return wysoki ? Math.min(Math.max(1050, dol + DL_UCHWYTU), dol + e.wys - DL_UCHWYTU) : dol + e.wys - DL_UCHWYTU / 2 - 40;
}

/** Pionowy uchwyt relingowy 192 mm na dwóch wspornikach. */
function uchwytPionowy(rodzic: THREE.Object3D, x: number, y: number, z: number, mat: ZestawMaterialow) {
  const u = bryla(12, DL_UCHWYTU, 12, mat.czarnyMat, 3);
  u.position.set(x, y, z);
  rodzic.add(u);
  for (const dy of [-DL_UCHWYTU / 2 + 16, DL_UCHWYTU / 2 - 16]) {
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.022, 10), mat.czarnyMat);
    n.rotation.x = Math.PI / 2;
    n.position.set(x, y + dy * M, z - 0.011);
    rodzic.add(n);
  }
}

// ---------- ujęcia ----------

export function domyslneUjecia(analiza: Analiza, pomieszczenieId?: string): Ujecie[] {
  const p = analiza.projekt;
  const pom = p.pomieszczenia.find((r) => r.id === pomieszczenieId) ?? p.pomieszczenia[0];
  const rzut = scianyNaRzucie(pom);
  const g = granice(rzut, 0);
  const cx = (g.x + g.w / 2) * M;
  const cz = (g.y + g.h / 2) * M;
  const okno = rzut.find((w) => /okno|okien|window/i.test(w.sciana.nazwa)) ?? rzut[0];
  const naprzeciw = rzut.find((w) => Math.abs(w.nx + okno.nx) < 0.1 && Math.abs(w.ny + okno.ny) < 0.1) ?? rzut[2] ?? okno;
  const pkt = (w: ScianaNaRzucie, a: number, d: number, y: number): [number, number, number] => {
    const [x, z] = punktNaRzucie(w, a, d);
    return [x * M, y, z * M];
  };
  const glebokoscSlupkow = Math.max(0, ...analiza.zbudowane.filter((z) => z.modul.scianaId === naprzeciw.sciana.id).map((z) => z.modul.glebokoscMM + 25));
  const lemans = analiza.zbudowane.find((z) => z.modul.konfiguracja.systemNarozny === "lemans");
  const ujecia: Ujecie[] = [
    {
      id: "ogolny",
      tytul: "Widok ogólny",
      // Kamera poziomo (jak w fotografii wnętrz) — pionowe krawędzie mebli zostają pionowe
      kamera: pkt(naprzeciw, naprzeciw.sciana.dlugoscMM * 0.36, glebokoscSlupkow + 120, 1.3),
      cel: pkt(okno, okno.sciana.dlugoscMM / 2, 300, 1.12),
      fov: 62,
    },
  ];
  const drzwiLeMans = lemans?.elementy.find((e) => e.kod.startsWith("FRONT-D"));
  if (lemans && drzwiLeMans) {
    const w = rzut.find((q) => q.sciana.id === lemans.modul.scianaId)!;
    const srodekDrzwi = lemans.modul.pozycjaXMM + drzwiLeMans.x + drzwiLeMans.szer / 2;
    const zn = lemans.modul.konfiguracja.stronaDrzwiNaroznika === "lewa" ? 1 : -1;
    // Kamera od strony przeciwnej do zawiasów, żeby otwarte drzwi nie zasłaniały półek
    ujecia.push({
      id: "lemans",
      tytul: "Narożnik z systemem LeMans — półki wysunięte",
      kamera: pkt(w, srodekDrzwi + zn * 250, 2050, 1.5),
      cel: pkt(w, srodekDrzwi - zn * 60, 620, 0.5),
      fov: 55,
      otwartyNaroznik: true,
    });
  }
  ujecia.push({
    id: "slupki",
    tytul: "Zabudowa wysoka",
    kamera: pkt(okno, okno.sciana.dlugoscMM * 0.62, 760, 1.25),
    cel: pkt(naprzeciw, naprzeciw.sciana.dlugoscMM * 0.45, 0, 1.2),
    fov: 66,
  });
  // Makieta z góry od strony okna: niskie szafki widać z góry, słupki od frontu
  const [mx, , mz] = pkt(okno, okno.sciana.dlugoscMM / 2, -2600, 0);
  ujecia.push({
    id: "makieta",
    tytul: "Układ zabudowy",
    kamera: [mx, 5.4, mz],
    cel: [cx, 0.3, cz + (cz - mz) * 0.12],
    fov: 42,
    makieta: true,
  });
  return ujecia;
}

// ---------- renderowanie ----------

export async function renderuj(analiza: Analiza, matMap: Map<string, Material>, ujecia: Ujecie[], opcje: { szer?: number; wys?: number; postep?: (i: number, n: number) => void } = {}): Promise<Render[]> {
  const szer = opcje.szer ?? 1920;
  const wys = opcje.wys ?? 1080;
  const nad = 1.5; // supersampling
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(szer * nad, wys * nad, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const sc = await zbudujScene(analiza, matMap);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  sc.scene.environment = env;
  sc.scene.environmentIntensity = 0.32;
  sc.scene.background = new THREE.Color(0xf2f0ec);

  const wynik: Render[] = [];
  for (const [i, u] of ujecia.entries()) {
    opcje.postep?.(i, ujecia.length);
    await new Promise((r) => setTimeout(r, 30));
    const camera = new THREE.PerspectiveCamera(u.fov, szer / wys, 0.03, 60);
    camera.position.set(...u.kamera);
    camera.lookAt(...u.cel);
    camera.updateMatrixWorld();
    sc.sufit.visible = !u.makieta;
    for (const s of sc.sciany) {
      const vx = camera.position.x - s.cx;
      const vz = camera.position.z - s.cz;
      s.mesh.visible = !u.makieta || vx * s.nx + vz * s.nz > 0;
    }
    for (const n of sc.naroznik) {
      n.drzwi.rotation.y = u.otwartyNaroznik ? n.kat : 0;
      n.otwarte.forEach((o) => (o.visible = !!u.otwartyNaroznik));
    }
    sc.scene.background = u.makieta ? new THREE.Color(0xeeece8) : new THREE.Color(0xf2f0ec);
    renderer.shadowMap.needsUpdate = true;

    const rt = new THREE.WebGLRenderTarget(szer * nad, wys * nad, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(sc.scene, camera));
    const ao = new GTAOPass(sc.scene, camera, szer * nad, wys * nad);
    ao.blendIntensity = 0.9;
    ao.updateGtaoMaterial({ radius: 0.28, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 24 });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    composer.addPass(ao);
    composer.addPass(new OutputPass());
    composer.render();

    const c = document.createElement("canvas");
    c.width = szer;
    c.height = wys;
    const g = c.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.drawImage(renderer.domElement, 0, 0, szer, wys);
    // lekka winieta fotograficzna
    const v = g.createRadialGradient(szer / 2, wys / 2, wys * 0.45, szer / 2, wys / 2, wys * 1.05);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(20,14,8,0.22)");
    g.fillStyle = v;
    g.fillRect(0, 0, szer, wys);
    wynik.push({ ujecie: u, obraz: c.toDataURL("image/jpeg", 0.9) });
    composer.dispose();
    ao.dispose();
    rt.dispose();
  }
  opcje.postep?.(ujecia.length, ujecia.length);
  env.dispose();
  pmrem.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  return wynik;
}
