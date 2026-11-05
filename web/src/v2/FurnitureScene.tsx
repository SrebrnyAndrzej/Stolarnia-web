import { furnitureFaceGuides } from "../../../src/core/furniture-face-guides";
import { createPortal } from "react-dom";
import { furniturePlateColor } from "../../../src/core/furniture-appearance";
import { compartmentBoxes } from "../../../src/core/furniture-compartments";
import { layoutCeiling } from "../../../src/core/furniture";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  platePolygon,
  polygonArea,
  type FurnitureModel,
} from "../../../src/core/furniture";
import { Feedback } from "./ui";
import { frontMotion } from "../../../src/core/furniture-review";

type View = "right" | "left" | "front";
const MM = 0.001;
type Runtime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  parts: THREE.Group;
  context: THREE.Group;
  compartments: THREE.Group;
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
  selectedCompartment = "",
  onSelectCompartment,
  onEditCompartment,
  controlsTarget,
  highlighted = [],
  marked = [],
}: {
  highlighted?: string[];
  marked?: string[];
  model: FurnitureModel;
  controlsTarget?: HTMLElement | null;
  selected: string;
  onSelect: (id: string) => void;
  selectedCompartment?: string;
  onSelectCompartment?: (id: string) => void;
  onEditCompartment?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const selectCompartment = useRef(onSelectCompartment);
  selectCompartment.current = onSelectCompartment;
  const [pickMode, setPickMode] = useState<"plates" | "compartments">("plates");
  const pickModeRef = useRef(pickMode);
  pickModeRef.current = pickMode;
  const boxes = compartmentBoxes(model).boxes.filter((b) => !b.node.split);
  const canSelectCompartment = Boolean(onSelectCompartment);
  const [error, setError] = useState("");
  const [captureReady, setCaptureReady] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [showFronts, setShowFronts] = useState(true),
    [openFronts, setOpenFronts] = useState(false),
    [exploded, setExploded] = useState(false);

  const [sectionAxis, setSectionAxis] = useState<"none" | "x" | "y" | "z">(
    "none",
  );
  const [sectionPercent, setSectionPercent] = useState(50);
  const [isolated, setIsolated] = useState(false);
  const [guides, setGuides] = useState(false);
  useEffect(() => {
    if (!selected) setIsolated(false);
  }, [selected]);
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
    const context = new THREE.Group();
    scene.add(context);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShadowMaterial({ opacity: 0.16 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.003;
    ground.receiveShadow = true;
    scene.add(ground);
    const draw = () => renderer.render(scene, camera);
    const compartments = new THREE.Group();
    scene.add(compartments);
    const state: Runtime = {
      compartments,
      renderer,
      scene,
      camera,
      controls,
      parts,
      context,
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
    setCaptureReady(true);
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
      if (pickModeRef.current === "compartments") {
        const hit = ray
          .intersectObjects(state.compartments.children, false)
          .find(
            (h) =>
              h.object instanceof THREE.Mesh &&
              h.object.userData.compartmentId &&
              renderer.clippingPlanes.every(
                (p) => p.distanceToPoint(h.point) >= 0,
              ),
          );
        selectCompartment.current?.(
          hit ? String(hit.object.userData.compartmentId) : "",
        );
        return;
      }
      const hit = ray
        .intersectObjects(parts.children, false)
        .find(
          (h) =>
            h.object instanceof THREE.Mesh &&
            h.object.visible &&
            h.object.userData.plateId &&
            renderer.clippingPlanes.every(
              (p) => p.distanceToPoint(h.point) >= 0,
            ),
        );
      select.current(hit ? String(hit.object.userData.plateId) : "");
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
      clearParts(context);
      clearParts(state.compartments);
      ground.geometry.dispose();
      ground.material.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      runtime.current = null;
      setCaptureReady(false);
    };
  }, [attempt]);
  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    const length =
      sectionAxis === "x"
        ? model.width
        : sectionAxis === "y"
          ? model.height
          : model.depth;
    const normal = new THREE.Vector3(
      sectionAxis === "x" ? -1 : 0,
      sectionAxis === "y" ? -1 : 0,
      sectionAxis === "z" ? -1 : 0,
    );
    state.renderer.shadowMap.enabled = sectionAxis === "none";
    state.renderer.clippingPlanes =
      sectionAxis === "none"
        ? []
        : [new THREE.Plane(normal, (length * MM * sectionPercent) / 100)];
    state.draw();
  }, [
    sectionAxis,
    sectionPercent,
    model.width,
    model.height,
    model.depth,
    attempt,
  ]);

  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    const initial = state.bounds.isEmpty();
    clearParts(state.parts);
    clearParts(state.context);
    if (model.installation) {
      const room = model.installation;
      const geometry = new THREE.BoxGeometry(
        room.width * MM,
        room.height * MM,
        room.depth * MM,
      );
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({
          color: 0x717780,
          transparent: true,
          opacity: 0.65,
        }),
      );
      geometry.dispose();
      edges.position.set(
        (room.width / 2 - room.left) * MM,
        (room.height / 2) * MM,
        (room.depth / 2) * MM,
      );
      state.context.add(edges);
      for (const obstacle of room.obstacles) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(
            obstacle.width * MM,
            obstacle.height * MM,
            obstacle.depth * MM,
          ),
          new THREE.MeshStandardMaterial({
            color: 0xb5634b,
            transparent: true,
            opacity: 0.55,
          }),
        );
        mesh.position.set(
          (obstacle.x + obstacle.width / 2) * MM,
          (obstacle.y + obstacle.height / 2) * MM,
          (obstacle.z + obstacle.depth / 2) * MM,
        );
        state.context.add(mesh);
      }
      for (const instance of room.furniture ?? [])
        for (const plate of instance.geometry.plates) {
          const polygon = platePolygon(instance.geometry, plate);
          if (polygon.length < 3 || polygonArea(polygon) < 0.01) continue;
          const shape = new THREE.Shape(
            polygon.map(([x, y]) => new THREE.Vector2(x * MM, y * MM)),
          );
          const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: plate.depth * MM,
            bevelEnabled: false,
            steps: 1,
            curveSegments: 1,
          });
          geometry.translate(
            instance.x * MM,
            instance.y * MM,
            (instance.z + plate.z) * MM,
          );
          const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
              color: 0xc9c6bd,
              roughness: 0.85,
            }),
          );
          mesh.castShadow = mesh.receiveShadow = true;
          state.context.add(mesh);
        }
    }
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
      const isFront = plate.kind === "door" || plate.kind === "drawer";
      const motion = frontMotion(model, plate);
      if (plate.kind === "door")
        geometry.translate(-motion.pivotX * MM, 0, -motion.pivotZ * MM);
      const color = new THREE.Color(furniturePlateColor(model, plate)).getHex();
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
      if (plate.kind === "door") {
        mesh.position.set(motion.pivotX * MM, 0, motion.pivotZ * MM);
        if (openFronts)
          mesh.rotation.y = ((motion.hinge === "right" ? 1 : -1) * Math.PI) / 2;
      }
      if (openFronts && plate.kind === "drawer")
        mesh.position.z += motion.travel * MM;
      if ((isFront && !showFronts) || (isolated && plate.id !== selected))
        mesh.visible = false;
      if (exploded) {
        mesh.position.x +=
          (plate.x + plate.width / 2 - model.width / 2) * MM * 0.18;
        mesh.position.y +=
          (plate.y + plate.height / 2 - model.height / 2) * MM * 0.18;
        mesh.position.z +=
          (plate.z + plate.depth / 2 - model.depth / 2) * MM * 0.3;
      }
      mesh.castShadow = mesh.receiveShadow = true;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 25),
        new THREE.LineBasicMaterial({
          color:
            new THREE.Color(color).getHSL({ h: 0, s: 0, l: 0 }).l < 0.35
              ? 0xb6c3bb
              : 0x435058,
          transparent: true,
          opacity: 0.65,
        }),
      );
      mesh.add(edges);
      if (guides && plate.id === selected)
        for (const guide of furnitureFaceGuides(model, plate)) {
          const points = guide.points.map(([x, y, z]) =>
            new THREE.Vector3(
              x - (plate.kind === "door" ? motion.pivotX : 0),
              y,
              z - (plate.kind === "door" ? motion.pivotZ : 0),
            ).multiplyScalar(MM),
          );
          mesh.add(
            new THREE.LineSegments(
              new THREE.BufferGeometry().setFromPoints(points),
              new THREE.LineBasicMaterial({
                color: guide.kind === "band" ? 0x008d86 : 0x205ac0,
                depthTest: true,
              }),
            ),
          );
        }
      state.parts.add(mesh);
    }
    state.bounds.setFromObject(state.parts);
    if (model.installation)
      state.bounds.union(new THREE.Box3().setFromObject(state.context));
    if (initial) state.fit();
    else state.draw();
  }, [
    model,
    attempt,
    showFronts,
    openFronts,
    exploded,
    isolated,
    selected,
    guides,
  ]);

  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    for (const object of state.parts.children) {
      const mesh = object as THREE.Mesh<
        THREE.ExtrudeGeometry,
        THREE.MeshStandardMaterial
      >;
      const collision = highlighted.includes(mesh.userData.plateId);
      const active =
        mesh.userData.plateId === selected ||
        marked.includes(mesh.userData.plateId);
      mesh.material.color.setHex(
        collision
          ? 0xca4f36
          : active
            ? 0xa5b859
            : (mesh.userData.color as number),
      );
      mesh.material.emissive.setHex(active ? 0x172000 : 0x000000);
    }
    state.draw();
  }, [
    selected,
    model,
    attempt,
    showFronts,
    openFronts,
    exploded,
    highlighted,
    marked,
    isolated,
    guides,
  ]);

  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    clearParts(state.compartments);
    state.renderer.domElement.setAttribute(
      "aria-label",
      pickMode === "compartments"
        ? "Bryła mebla 3D. Obracaj przeciągając; komorę wybierz kliknięciem we wnętrze lub z listy."
        : "Bryła mebla 3D. Obracaj przeciągając; wybierz płytę kliknięciem. Dostępne są też przyciski kamery i lista płyt.",
    );
    if (pickMode === "compartments" && canSelectCompartment) {
      for (const b of compartmentBoxes(model).boxes.filter(
        (b) => !b.node.split,
      )) {
        const height = Math.min(
          b.height,
          layoutCeiling(model, b.x, b.x + b.width) - b.y,
        );
        if (height <= 0) continue;
        const geometry = new THREE.BoxGeometry(
          b.width * MM,
          height * MM,
          b.depth * MM,
        );
        const active = b.node.id === selectedCompartment;
        const proxy = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            color: 0xa5b859,
            transparent: true,
            opacity: active ? 0.13 : 0,
            depthWrite: false,
          }),
        );
        proxy.position.set(
          (b.x + b.width / 2) * MM,
          (b.y + height / 2) * MM,
          (b.z + b.depth / 2) * MM,
        );
        proxy.userData.compartmentId = b.node.id;
        if (active) {
          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0x435058 }),
          );
          proxy.add(edges);
        }
        state.compartments.add(proxy);
      }
    }
    state.compartments.updateMatrixWorld(true);
    state.draw();
  }, [model, selectedCompartment, pickMode, attempt, canSelectCompartment]);

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
  const controls = (
    <>
      {onSelectCompartment && (
        <div className="fc-compartment-picking">
          <div
            className="fc-actions"
            role="group"
            aria-label="Wybór w widoku 3D"
          >
            <button
              aria-pressed={pickMode === "plates"}
              onClick={() => setPickMode("plates")}
            >
              Zaznaczaj płyty
            </button>
            <button
              disabled={!boxes.length}
              aria-pressed={pickMode === "compartments"}
              onClick={() => {
                setPickMode("compartments");
                setShowFronts(false);
              }}
            >
              Zaznaczaj komory
            </button>
          </div>
          {pickMode === "compartments" && (
            <>
              <label>
                Komora w widoku 3D
                <select
                  aria-label="Komora w widoku 3D"
                  value={selectedCompartment}
                  onChange={(e) => onSelectCompartment(e.target.value)}
                >
                  <option value="">Wybierz komorę…</option>
                  {boxes.map((b) => (
                    <option key={b.node.id} value={b.node.id}>
                      {b.node.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={!boxes.some((b) => b.node.id === selectedCompartment)}
                onClick={onEditCompartment}
              >
                Pokaż ustawienia komory
              </button>
              <p>
                Kliknij wnętrze komory w bryle lub wybierz ją z listy. Fronty
                zostały ukryte, aby odsłonić wnętrze.
              </p>
            </>
          )}
          {!boxes.length && (
            <p>Wybór komór jest dostępny po rozpoczęciu układu komór.</p>
          )}
        </div>
      )}
      <fieldset className="fc-section-controls">
        <legend>Przekrój i widoczność</legend>
        <label>
          Przekrój 3D
          <select
            aria-label="Przekrój 3D"
            value={sectionAxis}
            onChange={(e) =>
              setSectionAxis(e.target.value as typeof sectionAxis)
            }
          >
            <option value="none">Pełny mebel</option>
            <option value="x">Szerokość (X)</option>
            <option value="y">Wysokość (Y)</option>
            <option value="z">Głębokość (Z)</option>
          </select>
        </label>
        {sectionAxis !== "none" && (
          <label>
            Położenie przekroju · {sectionPercent}%
            <input
              aria-label="Położenie przekroju"
              type="range"
              min="1"
              max="99"
              value={sectionPercent}
              onChange={(e) => setSectionPercent(Number(e.target.value))}
            />
          </label>
        )}
        <label className="fc-check">
          <input
            type="checkbox"
            checked={isolated}
            disabled={!selected}
            onChange={(e) => setIsolated(e.target.checked)}
          />
          Tylko wybrana część
        </label>
        <label className="fc-check">
          <input
            type="checkbox"
            checked={guides}
            onChange={(e) => setGuides(e.target.checked)}
          />
          Obrzeża i usłojenie
        </label>
        {guides && (
          <p>
            Zielone linie: zapisane obrzeża. Niebieska strzałka: usłojenie
            wybranej płyty. Wybierz jej powierzchnię XY/XZ/YZ w materiale; skos
            wymaga osobnego rysunku.
          </p>
        )}
        {isolated && (
          <p>
            Izolacja nie zmienia projektu. Ukryte fronty włącz przyciskiem
            „Pokaż fronty”.
          </p>
        )}
      </fieldset>
      <div className="fc-camera" role="group" aria-label="Kamera 3D">
        <button
          disabled={!!error || !captureReady}
          onClick={() => {
            const state = runtime.current;
            if (!state) return;
            try {
              state.draw();
              const image = state.renderer.domElement.toDataURL("image/png");
              if (!image.startsWith("data:image/png")) throw new Error();
              const link = document.createElement("a");
              link.href = image;
              link.download = `${model.name.replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 80) || "mebel"}-podglad.png`;
              link.click();
              setCaptureError("");
            } catch {
              setCaptureError(
                "Nie udało się zapisać obrazu 3D. Spróbuj ponownie.",
              );
            }
          }}
        >
          Pobierz widok PNG
        </button>
        <label className="fc-check">
          <input
            type="checkbox"
            checked={showFronts}
            onChange={(e) => setShowFronts(e.target.checked)}
          />
          Pokaż fronty
        </label>
        <label className="fc-check">
          <input
            type="checkbox"
            checked={openFronts}
            onChange={(e) => setOpenFronts(e.target.checked)}
          />
          Otwórz fronty
        </label>
        <label className="fc-check">
          <input
            type="checkbox"
            checked={exploded}
            onChange={(e) => setExploded(e.target.checked)}
          />
          Widok rozstrzelony
        </label>
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
    </>
  );
  return (
    <div className="fc-scene">
      {controlsTarget ? createPortal(controls, controlsTarget) : controls}
      <div className="fc-scene-host" ref={host} data-testid="furniture-scene" />
      {captureError && <Feedback>{captureError}</Feedback>}
      {error && (
        <div className="fc-scene-error">
          <Feedback>{error}</Feedback>
          <button onClick={() => setAttempt((a) => a + 1)}>
            Spróbuj uruchomić 3D ponownie
          </button>
        </div>
      )}
      <p className="fc-scene-hint">
        Przeciągnij, aby obrócić.{" "}
        {pickMode === "compartments"
          ? "Kliknij wnętrze, aby wybrać komorę."
          : "Kliknij płytę, aby ją wybrać."}{" "}
        Przybliżaj przyciskami lub gestem dwóch palców. Wymiary i pozycje
        zmieniaj w inspektorze.
        {openFronts &&
          " Ruch frontów jest poglądowy: drzwi 90°, szuflady według NL lub poglądowego wysuwu. Skrzynki i okucia nie są jeszcze modelowane."}
      </p>
    </div>
  );
}
