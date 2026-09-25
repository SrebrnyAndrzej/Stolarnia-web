import * as THREE from "three";

// Studyjne HDRI generowane w przeglądarce: cyklorama z miękkim gradientem i softboxy o jasności HDR (> 1),
// przeliczone przez PMREM na mapę środowiska (odbicia + oświetlenie rozproszone). Bez pobierania plików .hdr.

/** Kierunek głównego softboxu — to samo miejsce ma światło kierunkowe rzucające cienie. */
export const KIERUNEK_KLUCZA = new THREE.Vector3(3, 6, 4).normalize();

function softbox(scena: THREE.Scene, pozycja: THREE.Vector3, szer: number, wys: number, jasnosc: number, barwa = 0xffffff) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(barwa).multiplyScalar(jasnosc), side: THREE.DoubleSide });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(szer, wys), mat);
  panel.position.copy(pozycja);
  panel.lookAt(0, 1, 0);
  scena.add(panel);
}

export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scena = new THREE.Scene();

  // Cyklorama: jasny sufit, neutralny horyzont, ciemniejsza podłoga (w liniowych jednostkach).
  const kula = new THREE.SphereGeometry(20, 48, 24);
  const kolory: number[] = [];
  const poz = kula.getAttribute("position");
  const gora = new THREE.Color(0.55, 0.55, 0.56);
  const horyzont = new THREE.Color(0.24, 0.235, 0.23);
  const dol = new THREE.Color(0.06, 0.057, 0.055);
  const c = new THREE.Color();
  for (let i = 0; i < poz.count; i++) {
    const t = poz.getY(i) / 20; // −1..1
    if (t >= 0) c.copy(horyzont).lerp(gora, Math.pow(t, 0.7));
    else c.copy(horyzont).lerp(dol, Math.min(1, -t * 2.2));
    kolory.push(c.r, c.g, c.b);
  }
  kula.setAttribute("color", new THREE.Float32BufferAttribute(kolory, 3));
  scena.add(new THREE.Mesh(kula, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

  // Softboxy: klucz (duży, ciepły), wypełnienie, górny, kontra z tyłu i paski dla refleksów na frontach.
  softbox(scena, KIERUNEK_KLUCZA.clone().multiplyScalar(9), 6, 4.5, 6, 0xfff4e6);
  softbox(scena, new THREE.Vector3(-8, 3.5, 3), 4, 4, 1.6, 0xeef3ff);
  softbox(scena, new THREE.Vector3(0, 10, 0), 7, 7, 2.2);
  softbox(scena, new THREE.Vector3(-2, 4, -9), 8, 2, 2);
  softbox(scena, new THREE.Vector3(9, 2.5, -2), 1.2, 6, 3.5);
  softbox(scena, new THREE.Vector3(-9, 2.5, -3), 1.2, 6, 2.5);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const tekstura = pmrem.fromScene(scena, 0.035).texture;
  pmrem.dispose();
  scena.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return tekstura;
}
