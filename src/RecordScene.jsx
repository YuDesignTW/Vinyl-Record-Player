import { useTranslation } from "./i18n";
import { memo, useEffect, useRef, useState } from "react";
import { gatefoldPosition } from "./gatefold";
import { vinylArtwork } from "./vinylArtwork";
import * as THREE from "three";

async function artworkTexture(config, side, sleeve = false, name = "") {
  const canvas = document.createElement("canvas");canvas.width = canvas.height = 1024;
  const c = canvas.getContext("2d");
  c.fillStyle = config.color;c.fillRect(0, 0, 1024, 1024);
  if (config.image) {
    const img = new Image();img.src = config.image;await img.decode();
    const scale = Math.max(1024 / img.width, 1024 / img.height),w = img.width * scale,h = img.height * scale;
    c.drawImage(img, (1024 - w) / 2, (1024 - h) / 2, w, h);
  } else {
    c.fillStyle = "#262626";c.textAlign = "center";
    if (sleeve) {
      c.font = "500 24px sans-serif";c.fillText("h d a m e   R E C O R D S", 512, 90);
      c.font = "500 72px sans-serif";const title = side === "insideLeft" ? "SIDE C / D" : side === "insideRight" ? "SIDE A / B" : name || "Untitled";c.fillText(title, 512, 510, 850);
      c.font = "20px sans-serif";c.fillText(side.startsWith("inside") ? name || "YOUR COLLECTION" : "A LITTLE TIME FOR MUSIC", 512, 570, 850);
      c.font = "16px sans-serif";c.fillText({ front: "FRONT COVER", back: "BACK COVER", insideLeft: "INNER LEFT  /  C · D", insideRight: "INNER RIGHT  /  A · B" }[side] || "PERSONAL COLLECTION", 512, 945);
    } else {
      c.font = "600 124px sans-serif";c.fillText("hMusic", 512, 350);
      c.font = "500 40px sans-serif";c.fillText(config.title || "YOUR OWN RECORD", 512, 665, 760);
      c.font = "30px sans-serif";c.fillText(`SIDE ${side}   /   STEREO`, 512, 750);
      c.font = "22px sans-serif";c.fillText("A LITTLE TIME FOR MUSIC", 512, 815);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);texture.colorSpace = THREE.SRGBColorSpace;texture.anisotropy = 4;
  return texture;
}
function makeDisc(texture) {
  const disc = new THREE.Group();
  const geometry = new THREE.CylinderGeometry(2.6, 2.6, .036, 160);geometry.rotateX(Math.PI / 2);
  const edge = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: "#161616", roughness: .25, metalness: .2 }));disc.add(edge);
  const faces = [],labels = [];
  for (const back of [false, true]) {
    const face = new THREE.Mesh(new THREE.CircleGeometry(2.6, 160), new THREE.MeshBasicMaterial({ map: texture, transparent: true, color: "#ffffff" }));
    face.position.z = back ? -.023 : .023;face.rotation.y = back ? Math.PI : 0;disc.add(face);faces.push(face);
    const label = new THREE.Mesh(new THREE.CircleGeometry(.89, 96), new THREE.MeshBasicMaterial({ color: "#e9e8e4" }));
    label.position.z = back ? -.028 : .028;label.rotation.y = back ? Math.PI : 0;disc.add(label);labels.push(label);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(.037, 32), new THREE.MeshBasicMaterial({ color: "#19191b" }));hole.position.z = back ? -.031 : .031;hole.rotation.y = back ? Math.PI : 0;disc.add(hole);
  }
  return { group: disc, faces, labels, edge };
}
function makeSleeve(left = false) {
  const group = new THREE.Group();const frontMat = new THREE.MeshStandardMaterial({ color: "#e5e3df", roughness: .85 });const backMat = frontMat.clone();
  const front = new THREE.Mesh(new THREE.BoxGeometry(5.48, 5.48, .018), frontMat);front.position.z = .105;group.add(front);
  const back = new THREE.Mesh(new THREE.BoxGeometry(5.48, 5.48, .018), backMat);back.position.z = -.105;back.rotation.y = Math.PI;group.add(back);
  const seam = new THREE.MeshStandardMaterial({ color: "#bbb9b4", roughness: 1 });
  for (const y of [-2.735, 2.735]) {const wall = new THREE.Mesh(new THREE.BoxGeometry(5.48, .02, .21), seam);wall.position.y = y;group.add(wall);}
  const spine = new THREE.Mesh(new THREE.BoxGeometry(.025, 5.48, .21), seam);spine.position.x = left ? 2.735 : -2.735;group.add(spine);
  return { group, frontMat, backMat };
}
function makeTonearm() {
  const group = new THREE.Group(),arm = new THREE.Group();group.position.set(2.6, 2.1, .3);group.add(arm);
  const black = new THREE.MeshStandardMaterial({ color: "#202225", metalness: .12, roughness: .6 });
  const silver = new THREE.MeshStandardMaterial({ color: "#d4d7d9", metalness: .65, roughness: .3 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(.38, .44, .14), black);base.position.set(0, .08, .03);base.rotation.z = -.22;group.add(base);
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .12, 40), black);pivot.rotation.x = Math.PI / 2;group.add(pivot);
  const start = new THREE.Vector3(0, -.12, .11),end = new THREE.Vector3(-.88, -3.664, .11),direction = end.clone().sub(start);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, direction.length(), 24), silver);rod.position.copy(start.clone().add(end).multiplyScalar(.5));rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());arm.add(rod);
  const socket = new THREE.Mesh(new THREE.BoxGeometry(.22, .46, .16), black);socket.position.set(-.02, -.12, .11);socket.rotation.z = -.24;arm.add(socket);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.28, .58, .13), black);head.position.copy(end);head.rotation.z = -.52;arm.add(head);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .16, 12), silver);tip.rotation.x = Math.PI / 2;tip.position.set(-1, -3.864, -.01);arm.add(tip);
  return { group, arm };
}
export const RecordScene = memo(function RecordScene({ record, tab, side, playing, rotate, extracted, sleeveView, sleeveOpen, appearance, resetKey }) {const { t: tr, language } = useTranslation();
  const host = useRef(null),engine = useRef(null),live = useRef({}),[failed, setFailed] = useState(false);
  live.current = { record, tab, side, playing, rotate, extracted, sleeveView, sleeveOpen, appearance };
  useEffect(() => {
    let renderer;
    try {renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });} catch {setFailed(true);return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));renderer.setClearColor(0, 0);renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.current.appendChild(renderer.domElement);renderer.domElement.setAttribute("aria-label", tr("可拖曳的 3D 黑膠唱片與封套"));renderer.domElement.setAttribute("role", "img");
    const scene = new THREE.Scene(),camera = new THREE.PerspectiveCamera(35, 1, .1, 100);camera.position.set(0, 0, 14.5);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x88888c, 2.3));const light = new THREE.DirectionalLight(0xffffff, 2.7);light.position.set(-4, 6, 8);scene.add(light);
    const texture = new THREE.TextureLoader().load("/assets/vinyl.png");texture.colorSpace = THREE.SRGBColorSpace;texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const root = new THREE.Group(),pose = new THREE.Group(),assembly = new THREE.Group();scene.add(root);root.add(pose);pose.add(assembly);
    const first = makeDisc(texture),second = makeDisc(texture);assembly.add(first.group, second.group);
    const sleeve = makeSleeve(),wing = makeSleeve(true);assembly.add(sleeve.group, wing.group);
    const tonearm = makeTonearm();pose.add(tonearm.group);tonearm.group.visible = false;
    const drag = { x: 0, y: 0, active: false, pointer: null };let frame,previous = performance.now(),spin = 0,velocity = 0,fold = Math.PI,gateExtraction = 0,entrySeen = 0,disposed = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const state = { renderer, scene, camera, root, pose, first, second, sleeve, wing, drag, disposed: false, appearanceEntry: 0 };engine.current = state;
    function resize() {const { width, height } = host.current.getBoundingClientRect();renderer.setSize(width, height);camera.aspect = width / height;camera.updateProjectionMatrix();}
    const observer = new ResizeObserver(resize);observer.observe(host.current);resize();
    const lerp = (a, b, k) => a + (b - a) * k;
    function render(now) {
      if (disposed) return;frame = requestAnimationFrame(render);const dt = Math.min((now - previous) / 1000, .05);previous = now;
      if (document.hidden) return;
      const p = live.current;const appearance = p.tab === "外觀" && p.appearance === "封套",labelEdit = p.tab === "外觀" && p.appearance === "標籤",library = p.tab === "唱片庫",music = p.tab === "音樂" || p.tab === "外觀" && p.appearance === "唱片",double = p.record.sleeve.type === "double";
      const listening = p.tab === "聆聽",fixedMusic = p.tab === "音樂";
      const back = p.side === "B" || p.side === "D",disc2 = p.side === "C" || p.side === "D";const k = reduced.matches ? 1 : 1 - Math.exp(-dt * 8);
      const aspect = camera.aspect;const small = aspect < 1 || renderer.domElement.clientWidth < 700;
      if (entrySeen !== state.appearanceEntry) {
        entrySeen = state.appearanceEntry;
        // Replay only the presentation, never alter saved appearance or playback.
        fold = Math.PI;gateExtraction = 0;
        sleeve.group.userData.fade = 0;wing.group.userData.fade = 0;
      }
      const entryProgress = reduced.matches ? 1 : Math.min(1, Math.max(0, (now - state.appearanceEntry) / 850));
      const entrance = p.tab === "外觀" ? Math.pow(1 - entryProgress, 2) : 0;
      const opened = double && p.sleeveOpen;
      const openness = double ? 1 - fold / Math.PI : 0;
      const targetScale = appearance ? double ? 1.12 - .34 * openness : 1.12 : library ? 1.05 : fixedMusic ? 1.66 : music ? 1.5 : labelEdit ? Math.min(1.78, 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - .15) * Math.min(aspect, 1) / 5.2 * .95) * 1.5 : listening ? 1.42 : 1.2;
      const scale = targetScale * (1 - .18 * entrance) * (small ? appearance ? double ? .7 - .18 * openness : .7 : .95 : 1);
      root.scale.setScalar(lerp(root.scale.x, scale, k));
      root.position.x = lerp(root.position.x, appearance ? double ? 0 : -1.15 : 0, k);root.position.y = lerp(root.position.y, appearance ? -.05 : .1, k);
      const rx = listening ? 0 : (appearance ? 0 : fixedMusic ? -.70 : music ? .18 : labelEdit ? 0 : -.06) + (fixedMusic ? 0 : drag.x),ry = listening ? 0 : (appearance ? double && p.sleeveView === "back" ? Math.PI : 0 : fixedMusic ? 0 : music ? -.46 : labelEdit ? 0 : -.12) + (fixedMusic ? 0 : drag.y);
      pose.rotation.x = lerp(pose.rotation.x, rx, k);pose.rotation.y = lerp(pose.rotation.y, ry + .24 * entrance, k);pose.rotation.z = lerp(pose.rotation.z, fixedMusic ? 0 : music ? .12 : 0, k);
      const targetVelocity = p.playing && p.rotate && !reduced.matches ? p.record.rpm * Math.PI / 30 : 0;
      velocity = lerp(velocity, targetVelocity, 1 - Math.exp(-dt * 5));
      spin -= velocity * dt;
      const faceAngle = back ? Math.PI : 0;
      first.group.rotation.y = lerp(first.group.rotation.y, faceAngle, k);second.group.rotation.y = lerp(second.group.rotation.y, faceAngle, k);
      first.group.rotation.z = spin;second.group.rotation.z = spin;
      // A shared spine hinge joins the two pockets; retract discs before closing.
      const extractionTarget = appearance && opened && fold < .015 ? p.extracted : 0;
      gateExtraction = lerp(gateExtraction, extractionTarget, k);
      const foldTarget = opened && entryProgress > .2 ? 0 : gateExtraction < .005 ? Math.PI : fold;
      fold = lerp(fold, foldTarget, k);
      const angle = appearance && double ? fold : 0;

      // Both pocket and enclosed disc use the same rigid hinge transform.
      // The hinge sits on the inner paper surface: open leaves are coplanar.
      const { x: wingX, z: wingZ } = gatefoldPosition(angle);
      const discPosition = gatefoldPosition(angle, gateExtraction);
      assembly.position.x = lerp(assembly.position.x, appearance && double ? -(2.75 + wingX) / 2 : 0, k);
      assembly.position.z = lerp(assembly.position.z, appearance && double ? -wingZ / 2 : 0, k);
      if (appearance && double) {
        first.group.position.set(2.75 + gateExtraction * 3.9, 0, 0);
        second.group.position.set(discPosition.x, 0, discPosition.z);
        first.group.rotation.y = 0;second.group.rotation.y = angle;
      } else {
        first.group.position.x = lerp(first.group.position.x, appearance ? p.extracted * 3.9 : 0, k);
        second.group.position.x = lerp(second.group.position.x, 0, k);
        first.group.position.z = appearance ? 0 : .15;second.group.position.z = .15;
      }
      const discsExposed = !double || gateExtraction > .005;
      first.group.visible = appearance ? discsExposed : !disc2;
      second.group.visible = double && (appearance ? discsExposed : disc2);
      for (const [jacket, wanted] of [[sleeve, appearance], [wing, appearance && double]]) {jacket.group.userData.fade = lerp(jacket.group.userData.fade || 0, wanted ? 1 : 0, reduced.matches ? 1 : 1 - Math.exp(-dt * (wanted ? 10 : 24)));jacket.group.visible = jacket.group.userData.fade > .01;jacket.group.traverse((o) => {if (o.material) {o.material.transparent = jacket.group.userData.fade < .999;o.material.opacity = jacket.group.userData.fade;}});}
      sleeve.group.position.x = double ? 2.75 : 0;
      wing.group.position.set(wingX, 0, wingZ);
      sleeve.group.rotation.y = lerp(sleeve.group.rotation.y, !double && p.sleeveView === "back" ? Math.PI : 0, k);
      wing.group.rotation.y = angle;wing.group.rotation.z = 0;
      const armVisibility = lerp(tonearm.group.userData.reveal || 0, listening ? 1 : 0, k);
      tonearm.group.userData.reveal = armVisibility;tonearm.group.visible = armVisibility > .01;
      tonearm.group.traverse((o) => {if (o.material) {o.material.transparent = armVisibility < .999;o.material.opacity = armVisibility;}});
      tonearm.group.scale.setScalar(.85 + .15 * armVisibility);
      tonearm.group.position.z = .3 + (1 - armVisibility) * 1.2;
      tonearm.group.position.x = lerp(tonearm.group.position.x, p.playing ? 2.6 : 3.1, k);
      tonearm.arm.rotation.z = lerp(tonearm.arm.rotation.z, p.playing ? 0 : Math.atan(1.1 / 4.43), k);
      tonearm.arm.position.z = lerp(tonearm.arm.position.z, p.playing ? 0 : .12, k);
      renderer.render(scene, camera);
    }
    const down = (e) => {if (["聆聽", "音樂"].includes(live.current.tab) || drag.active || e.button !== 0) return;drag.active = true;drag.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, rx: drag.x, ry: drag.y };renderer.domElement.setPointerCapture(e.pointerId);};
    const move = (e) => {if (!drag.active || e.pointerId !== drag.pointer.id) return;drag.x = Math.max(-.5, Math.min(.5, drag.pointer.rx + (e.clientY - drag.pointer.y) * .004));drag.y = drag.pointer.ry + (e.clientX - drag.pointer.x) * .008;};
    const up = () => {drag.active = false;};
    renderer.domElement.addEventListener("pointerdown", down);renderer.domElement.addEventListener("pointermove", move);renderer.domElement.addEventListener("pointerup", up);renderer.domElement.addEventListener("pointercancel", up);
    frame = requestAnimationFrame(render);
    return () => {disposed = true;state.disposed = true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener("pointerdown", down);renderer.domElement.removeEventListener("pointermove", move);renderer.domElement.removeEventListener("pointerup", up);renderer.domElement.removeEventListener("pointercancel", up);scene.traverse((o) => {o.geometry?.dispose();if (o.material) {for (const m of Array.isArray(o.material) ? o.material : [o.material]) {if (m.map !== texture) m.map?.dispose();m.dispose();}}});texture.dispose();renderer.dispose();renderer.domElement.remove();engine.current = null;};
  }, []);
  useEffect(() => {engine.current?.renderer.domElement.setAttribute("aria-label", tr(tab === "聆聽" ? "固定角度的黑膠唱片與唱針" : tab === "音樂" ? "固定傾斜角度的黑膠唱片" : "可拖曳的 3D 黑膠唱片與封套"));}, [tab, language]);
  useEffect(() => {if (tab === "外觀" && engine.current) engine.current.appearanceEntry = performance.now();}, [tab]);
  useEffect(() => {if (engine.current) {engine.current.drag.x = 0;engine.current.drag.y = 0;engine.current.drag.active = false;}}, [resetKey, tab, appearance, sleeveView]);
  useEffect(() => {
    const e = engine.current;if (!e) return;let cancelled = false;
    async function update() {
      const labelMeshes = [...e.first.labels, ...e.second.labels];
      await Promise.all(["A", "B", "C", "D"].map(async (side, i) => {
        const mesh = labelMeshes[i],config = record.labels[side];
        if (mesh.userData.config === config) return;
        const texture = await artworkTexture(config, side);
        if (cancelled || e.disposed) {texture.dispose();return;}
        mesh.material.map?.dispose();mesh.material.map = texture;mesh.material.color.set("#ffffff");mesh.material.needsUpdate = true;mesh.userData.config = config;
      }));
      const bindings = record.sleeve.type === "double" ?
      [["insideRight", e.sleeve.frontMat], ["back", e.sleeve.backMat], ["insideLeft", e.wing.frontMat], ["front", e.wing.backMat]] :
      [["front", e.sleeve.frontMat], ["back", e.sleeve.backMat]];
      await Promise.all(bindings.map(async ([face, mat]) => {
        const key = JSON.stringify([face, record.sleeve.color, record.sleeve[face] || "", record.name]);
        if (mat.userData.artworkKey === key) return;
        const texture = await artworkTexture({ color: record.sleeve.color, image: record.sleeve[face] || "" }, face, true, record.name);
        if (cancelled || e.disposed) {texture.dispose();return;}
        mat.map?.dispose();mat.map = texture;mat.color.set("#ffffff");mat.needsUpdate = true;mat.userData.artworkKey = key;
      }));
    }
    update().catch(() => setFailed(true));return () => {cancelled = true;};
  }, [record.labels, record.sleeve, record.name]);
  useEffect(() => {
    const e = engine.current;if (!e) return;let cancelled = false,owned;
    new THREE.TextureLoader().load(vinylArtwork(record), (texture) => {
      if (cancelled || e.disposed) {texture.dispose();return;}
      owned = texture;texture.colorSpace = THREE.SRGBColorSpace;texture.anisotropy = 4;
      for (const disc of [e.first, e.second]) {
        for (const mesh of disc.faces) {mesh.material.map = texture;mesh.material.color.set("#ffffff");mesh.material.opacity = record.vinylFinish === "transparent" ? .42 : 1;mesh.material.depthWrite = record.vinylFinish !== "transparent";mesh.material.needsUpdate = true;}
        disc.edge.visible = record.vinylFinish !== "transparent";
        disc.edge.material.color.set(record.vinylFinish === "transparent" ? "#c8d0d9" : record.vinylColor);
        disc.edge.material.transparent = record.vinylFinish === "transparent";disc.edge.material.opacity = record.vinylFinish === "transparent" ? .15 : 1;
      }
    });
    return () => {cancelled = true;owned?.dispose();};
  }, [record.vinylColor, record.vinylFinish, record.vinylPattern, record.vinylAccent]);
  return <div className="three-stage" ref={host}>{failed && <div className="scene-error">{tr("3D 預覽無法啟動。請啟用瀏覽器硬體加速；音樂仍可正常播放。")}</div>}</div>;
});
