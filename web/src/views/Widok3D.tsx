import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { granice, punktNaRzucie, scianyNaRzucie } from "../../../src/core/geometry";
import type { Analiza, Material } from "../api";

interface Props {
  analiza: Analiza;
  pomieszczenieId: string;
  scianaId: string;
  wybrany: string | null;
  matMap: Map<string, Material>;
  onWybierz: (id: string | null) => void;
}

const M = 1 / 1000; // mm → m

/**
 * Wizualizacja 3D (three.js). Układ: X = rzut X, Z = rzut Y, Y = wysokość.
 * Moduł stoi tyłem do lica ściany; elementy z buildera (boki, półki, fronty, blat) jako bryły.
 */
export function Widok3D({ analiza, pomieszczenieId, scianaId, wybrany, matMap, onWybierz }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const stan = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    zawartosc: THREE.Group;
    sciany: { mesh: THREE.Object3D; cx: number; cz: number; nx: number; nz: number }[];
    kamUstawiona: string;
  } | null>(null);
  const onWybierzRef = useRef(onWybierz);
  onWybierzRef.current = onWybierz;

  // Inicjalizacja renderera (raz)
  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.495;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.6));
    const slonce = new THREE.DirectionalLight(0xffffff, 1.4);
    slonce.position.set(3, 6, 4);
    slonce.castShadow = true;
    slonce.shadow.mapSize.set(2048, 2048);
    Object.assign(slonce.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
    scene.add(slonce);

    const zawartosc = new THREE.Group();
    scene.add(zawartosc);
    stan.current = { renderer, scene, camera, controls, zawartosc, sciany: [], kamUstawiona: "" };

    const rozmiar = () => {
      const w = el.clientWidth;
      const h = Math.max(360, Math.round(w * 0.56));
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    rozmiar();
    const ro = new ResizeObserver(rozmiar);
    ro.observe(el);

    // Klik = zaznaczenie modułu (bez przeciągania kamery)
    let start = { x: 0, y: 0 };
    const down = (e: PointerEvent) => (start = { x: e.clientX, y: e.clientY });
    const up = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) return;
      const r = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const trafienie = ray.intersectObjects(zawartosc.children, true).find((i) => i.object.visible && i.object.userData.modulId);
      onWybierzRef.current(trafienie ? (trafienie.object.userData.modulId as string) : null);
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);

    let raf = 0;
    const petla = () => {
      raf = requestAnimationFrame(petla);
      controls.update();
      // Ściany między kamerą a wnętrzem znikają
      for (const s of stan.current!.sciany) {
        const vx = camera.position.x - s.cx;
        const vz = camera.position.z - s.cz;
        s.mesh.visible = vx * s.nx + vz * s.nz > 0;
      }
      renderer.render(scene, camera);
    };
    petla();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      stan.current = null;
    };
  }, []);

  // Budowa sceny przy każdej zmianie projektu
  useEffect(() => {
    const s = stan.current;
    if (!s) return;
    const { zawartosc } = s;
    zawartosc.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      }
    });
    zawartosc.clear();
    s.sciany = [];

    const p = analiza.projekt;
    const pom = p.pomieszczenia.find((r) => r.id === pomieszczenieId) ?? p.pomieszczenia[0];
    if (!pom) return;
    const rzut = scianyNaRzucie(pom);
    const g = granice(rzut, 0);

    // Podłoga
    const podloga = new THREE.Mesh(new THREE.PlaneGeometry(g.w * M + 2, g.h * M + 2), new THREE.MeshStandardMaterial({ color: 0xcfc6b8, roughness: 0.95 }));
    podloga.rotation.x = -Math.PI / 2;
    podloga.position.set((g.x + g.w / 2) * M, 0, (g.y + g.h / 2) * M);
    podloga.receiveShadow = true;
    zawartosc.add(podloga);

    // Ściany (0,1 m grubości za licem)
    const matSciany = new THREE.MeshStandardMaterial({ color: 0xece7df, roughness: 0.9 });
    const matAktywnej = new THREE.MeshStandardMaterial({ color: 0xf4e6d4, roughness: 0.9 });
    for (const w of rzut) {
      const L = w.sciana.dlugoscMM * M;
      const H = w.sciana.wysokoscMM * M;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(L, H, 0.1), w.sciana.id === scianaId ? matAktywnej : matSciany);
      const [cx, cz] = punktNaRzucie(w, w.sciana.dlugoscMM / 2, -50);
      mesh.position.set(cx * M, H / 2, cz * M);
      mesh.rotation.y = Math.atan2(-w.dy, w.dx);
      mesh.receiveShadow = true;
      zawartosc.add(mesh);
      s.sciany.push({ mesh, cx: cx * M, cz: cz * M, nx: w.nx, nz: w.ny });
    }

    // Moduły
    const kolor = (id: string | undefined, zapas: string) => new THREE.Color((id && matMap.get(id)?.kolorHEX) || zapas);
    const materialy = new Map<string, THREE.MeshStandardMaterial>();
    const mat = (hex: THREE.Color, sel: boolean) => {
      const k = `${hex.getHexString()}|${sel}`;
      if (!materialy.has(k)) materialy.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, emissive: sel ? new THREE.Color(0xd09a5e) : new THREE.Color(0), emissiveIntensity: sel ? 0.35 : 0 }));
      return materialy.get(k)!;
    };
    const krawedz = new THREE.LineBasicMaterial({ color: 0x3b3128, transparent: true, opacity: 0.35 });

    for (const z of analiza.zbudowane) {
      const m = z.modul;
      const w = rzut.find((q) => q.sciana.id === m.scianaId);
      if (!w) continue;
      const sel = m.id === wybrany;
      const barwy = {
        korpus: kolor(m.materialKorpusuId ?? pom.materialKorpusuId, "#f4f3ed"),
        front: kolor(m.materialFrontuId ?? pom.materialFrontuId, "#c9b28f"),
        plecy: new THREE.Color("#efeee9"),
        blat: kolor(pom.materialBlatuId, "#a98f6e"),
        szuflada: kolor(m.materialKorpusuId ?? pom.materialKorpusuId, "#f4f3ed"),
      };
      const grupa = new THREE.Group();
      grupa.rotation.y = Math.atan2(-w.dy, w.dx);
      for (const e of z.elementy) {
        if (e.rola === "drawerSide" || e.rola === "drawerFrontBack" || e.rola === "drawerBottom") continue; // niewidoczne za frontem
        const geo = new THREE.BoxGeometry(Math.max(e.szer, 1) * M, Math.max(e.wys, 1) * M, Math.max(e.gl, 1) * M);
        const mesh = new THREE.Mesh(geo, mat(barwy[e.materialRola], sel));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.modulId = m.id;
        // Lokalnie: x wzdłuż ściany, z od frontu (0) do tyłu (D) → odsunięcie od lica = D − z
        const wzdluz = m.pozycjaXMM + e.x + e.szer / 2;
        const odLica = m.glebokoscMM - (e.z + e.gl / 2);
        const [px, pz] = punktNaRzucie(w, wzdluz, odLica);
        const lok = new THREE.Vector3(px * M, (m.pozycjaYMM + e.y + e.wys / 2) * M, pz * M);
        mesh.position.copy(lok);
        mesh.rotation.y = grupa.rotation.y;
        const kr = new THREE.LineSegments(new THREE.EdgesGeometry(geo), krawedz);
        kr.position.copy(lok);
        kr.rotation.y = grupa.rotation.y;
        kr.userData.modulId = m.id;
        zawartosc.add(mesh, kr);
      }
      // Nogi / cokół jako ciemny pas pod szafką
      if (m.konfiguracja.nogi && m.pozycjaYMM > 0) {
        const geo = new THREE.BoxGeometry(m.szerokoscMM * M, m.pozycjaYMM * M, 0.018);
        const mesh = new THREE.Mesh(geo, mat(new THREE.Color("#4a4037"), false));
        const [px, pz] = punktNaRzucie(w, m.pozycjaXMM + m.szerokoscMM / 2, m.glebokoscMM - 55);
        mesh.position.set(px * M, (m.pozycjaYMM / 2) * M, pz * M);
        mesh.rotation.y = grupa.rotation.y;
        mesh.userData.modulId = m.id;
        zawartosc.add(mesh);
      }
    }

    // Kamera — ustaw raz na pomieszczenie, potem zostaw użytkownikowi
    if (s.kamUstawiona !== pom.id) {
      const cx = (g.x + g.w / 2) * M;
      const cz = (g.y + g.h / 2) * M;
      const aktywna = rzut.find((q) => q.sciana.id === scianaId) ?? rzut[0];
      const r = Math.max(g.w, g.h) * M;
      const [ax, az] = aktywna ? punktNaRzucie(aktywna, aktywna.sciana.dlugoscMM / 2, 0) : [cx / M, cz / M];
      const kx = aktywna ? ax * M + aktywna.nx * r * 1.1 : cx + r;
      const kz = aktywna ? az * M + aktywna.ny * r * 1.1 : cz + r;
      s.camera.position.set(kx, 1.9, kz);
      s.controls.target.set(aktywna ? ax * M : cx, 1.0, aktywna ? az * M : cz);
      s.controls.update();
      s.kamUstawiona = pom.id;
    }
  }, [analiza, pomieszczenieId, scianaId, wybrany, matMap]);

  return <div ref={host} className="widok3d" />;
}
