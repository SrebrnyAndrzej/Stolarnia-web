import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  platePolygon,
  polygonArea,
  type FurnitureModel,
} from "../../../src/core/furniture";
import { Feedback } from "./ui";

type View = "right" | "left" | "front";
const MM = 0.001;
type Runtime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  parts: THREE.Group;
  bounds: THREE.Box3;
  draw: () => void;
  fit: (view?: View) => void;
};
function clearParts(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
  group.clear();
}

/** Opaque, depth-tested extrusions of the same clipped polygons used in 2D. */
export function FurnitureScene({
  model,
  selected,
  onSelect,
}: {
  model: FurnitureModel;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError(
        "Nie udało się uruchomić widoku 3D. Możesz nadal projektować w widoku Przód 2D.",
      );
      return;
    }
    setError("");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      "Bryła mebla 3D. Obracaj przeciągając; wybierz płytę kliknięciem. Dostępne są też przyciski kamery i lista płyt.",
    );
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI * 0.495;
    // Wheel scrolling belongs to the page; zoom has explicit buttons and touch pinch.
    controls.mouseButtons.MIDDLE = null;
    const wheel = (e: WheelEvent) => e.stopImmediatePropagation();
    renderer.domElement.addEventListener("wheel", wheel, { capture: true });
    scene.add(new THREE.HemisphereLight(0xffffff, 0x74716b, 2));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.normalBias = 0.002;
    key.shadow.bias = -0.0001;
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight(0xe5edf1, 0.8);
    fill.position.set(4, 3, -4);
    scene.add(fill);
    const parts = new THREE.Group();
    scene.add(parts);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShadowMaterial({ opacity: 0.16 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.003;
    ground.receiveShadow = true;
    scene.add(ground);
    const draw = () => renderer.render(scene, camera);
    const state: Runtime = {
      renderer,
      scene,
      camera,
      controls,
      parts,
      bounds: new THREE.Box3(),
      draw,
      fit: (view = "right") => {
        if (state.bounds.isEmpty()) return;
        const center = state.bounds.getCenter(new THREE.Vector3());
        const radius = Math.max(
          0.1,
          state.bounds.getBoundingSphere(new THREE.Sphere()).radius,
        );
        const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
        const direction = new THREE.Vector3(
          view === "front" ? 0 : view === "left" ? -0.9 : 0.9,
          view === "front" ? 0.04 : 0.55,
          1.65,
        ).normalize();
        const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
        const up = direction.clone().cross(right).normalize();
        let distance = radius;
        for (const x of [state.bounds.min.x, state.bounds.max.x])
          for (const y of [state.bounds.min.y, state.bounds.max.y])
            for (const z of [state.bounds.min.z, state.bounds.max.z]) {
              const corner = new THREE.Vector3(x, y, z).sub(center);
              distance = Math.max(
                distance,
                corner.dot(direction) +
                  Math.max(
                    Math.abs(corner.dot(right)) /
                      (Math.tan(halfFov) * camera.aspect),
                    Math.abs(corner.dot(up)) / Math.tan(halfFov),
                  ),
              );
            }
        distance *= 1.13;
        controls.target.copy(center);
        camera.position.copy(center).addScaledVector(direction, distance);
        camera.near = Math.max(0.001, radius / 500);
        camera.far = Math.max(100, distance * 20);
        camera.updateProjectionMatrix();
        controls.minDistance = radius * 1.1;
        controls.maxDistance = distance * 4;
        controls.update();
        const extent = Math.max(radius * 2, 1);
        Object.assign(key.shadow.camera, {
          left: -extent,
          right: extent,
          top: extent,
          bottom: -extent,
          far: 100,
        });
        key.shadow.camera.updateProjectionMatrix();
        key.target.position.copy(center);
        key.position
          .copy(center)
          .add(new THREE.Vector3(-extent, extent * 2, extent * 2));
        ground.scale.set(extent * 3, extent * 3, 1);
        ground.position.set(center.x, -0.003, center.z);
        draw();
      },
    };
    runtime.current = state;
    controls.addEventListener("change", draw);
    const resize = () => {
      const width = Math.max(1, el.clientWidth),
        height = Math.max(1, el.clientHeight);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      state.fit();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    let start: { x: number; y: number; id: number } | null = null;
    const down = (e: PointerEvent) => {
      start = e.isPrimary
        ? { x: e.clientX, y: e.clientY, id: e.pointerId }
        : null;
    };
    const cancel = () => {
      start = null;
    };
    const up = (e: PointerEvent) => {
      const origin = start;
      start = null;
      if (
        !origin ||
        origin.id !== e.pointerId ||
        Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 5 ||
        e.button !== 0
      )
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hit = ray
        .intersectObjects(parts.children, false)
        .find((h) => h.object instanceof THREE.Mesh);
      if (hit) select.current(hit.object.userData.plateId as string);
    };
    const lost = (e: Event) => {
      e.preventDefault();
      setError(
        "Widok 3D został przerwany. Spróbuj ponownie albo przełącz na Przód 2D; szkic pozostaje zachowany.",
      );
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      observer.disconnect();
      controls.removeEventListener("change", draw);
      controls.dispose();
      renderer.domElement.removeEventListener("wheel", wheel, true);
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", cancel);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      clearParts(parts);
      ground.geometry.dispose();
      ground.material.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      runtime.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    const initial = state.bounds.isEmpty();
    clearParts(state.parts);
    for (const plate of model.plates) {
      const polygon = platePolygon(model, plate);
      if (polygon.length < 3 || polygonArea(polygon) < 0.01 || plate.depth <= 0)
        continue;
      const shape = new THREE.Shape(
        polygon.map(([x, y]) => new THREE.Vector2(x * MM, y * MM)),
      );
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: plate.depth * MM,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 1,
      });
      geometry.translate(0, 0, plate.z * MM);
      const color =
        plate.kind === "drawer" || plate.kind === "door" ? 0xe2d9c8 : 0xc5ab83;
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { plateId: plate.id, color };
      mesh.castShadow = mesh.receiveShadow = true;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 25),
        new THREE.LineBasicMaterial({
          color: 0x756951,
          transparent: true,
          opacity: 0.65,
        }),
      );
      mesh.add(edges);
      state.parts.add(mesh);
    }
    state.bounds.setFromObject(state.parts);
    if (initial) state.fit();
    else state.draw();
  }, [model, attempt]);

  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    for (const object of state.parts.children) {
      const mesh = object as THREE.Mesh<
        THREE.ExtrudeGeometry,
        THREE.MeshStandardMaterial
      >;
      const active = mesh.userData.plateId === selected;
      mesh.material.color.setHex(
        active ? 0xa5b859 : (mesh.userData.color as number),
      );
      mesh.material.emissive.setHex(active ? 0x172000 : 0x000000);
    }
    state.draw();
  }, [selected, model, attempt]);

  const turn = (angle: number) => {
    const state = runtime.current;
    if (!state) return;
    const offset = state.camera.position.clone().sub(state.controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    state.camera.position.copy(state.controls.target).add(offset);
    state.controls.update();
  };
  const zoom = (factor: number) => {
    const state = runtime.current;
    if (!state) return;
    const offset = state.camera.position.clone().sub(state.controls.target);
    offset.setLength(
      THREE.MathUtils.clamp(
        offset.length() * factor,
        state.controls.minDistance,
        state.controls.maxDistance,
      ),
    );
    state.camera.position.copy(state.controls.target).add(offset);
    state.controls.update();
  };
  return (
    <div className="fc-scene">
      <div className="fc-camera" role="group" aria-label="Kamera 3D">
        <button
          disabled={!!error}
          onClick={() => runtime.current?.fit("right")}
        >
          Widok początkowy
        </button>
        <button disabled={!!error} onClick={() => runtime.current?.fit("left")}>
          Z lewej strony
        </button>
        <button
          disabled={!!error}
          onClick={() => runtime.current?.fit("front")}
        >
          Na wprost
        </button>
        <button
          disabled={!!error}
          onClick={() => turn(-Math.PI / 12)}
          aria-label="Obróć w lewo"
        >
          ↶
        </button>
        <button
          disabled={!!error}
          onClick={() => turn(Math.PI / 12)}
          aria-label="Obróć w prawo"
        >
          ↷
        </button>
        <button
          disabled={!!error}
          onClick={() => zoom(0.8)}
          aria-label="Przybliż mebel"
        >
          +
        </button>
        <button
          disabled={!!error}
          onClick={() => zoom(1.25)}
          aria-label="Oddal mebel"
        >
          −
        </button>
      </div>
      <div className="fc-scene-host" ref={host} data-testid="furniture-scene" />
      {error && (
        <div className="fc-scene-error">
          <Feedback>{error}</Feedback>
          <button onClick={() => setAttempt((a) => a + 1)}>
            Spróbuj uruchomić 3D ponownie
          </button>
        </div>
      )}
      <p className="fc-scene-hint">
        Przeciągnij, aby obrócić. Kliknij płytę, aby ją wybrać. Przybliżaj
        przyciskami lub gestem dwóch palców. Wymiary i pozycje zmieniaj w
        inspektorze.
      </p>
    </div>
  );
}
