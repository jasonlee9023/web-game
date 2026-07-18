import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

class NodeFileReader {
  result = null;
  onloadend = null;
  onerror = null;

  readAsArrayBuffer(blob) {
    blob
      .arrayBuffer()
      .then((result) => {
        this.result = result;
        this.onloadend?.();
      })
      .catch((error) => {
        this.onerror?.(error);
      });
  }
}

globalThis.FileReader ??= NodeFileReader;

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const biomeRoot = join(projectRoot, 'apps/web/public/assets/hero-journey/biomes');
const exporter = new GLTFExporter();

function createMatteMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}

function prepareGeometry(geometry) {
  const flatGeometry = geometry.index ? geometry.toNonIndexed() : geometry;
  flatGeometry.deleteAttribute('normal');
  flatGeometry.computeVertexNormals();
  flatGeometry.computeBoundingBox();
  flatGeometry.computeBoundingSphere();
  return flatGeometry;
}

function addMesh(root, geometry, color, options = {}) {
  const mesh = new THREE.Mesh(prepareGeometry(geometry), createMatteMaterial(color));
  mesh.name = options.name ?? 'mesh';
  mesh.position.set(...(options.position ?? [0, 0, 0]));
  mesh.rotation.set(...(options.rotation ?? [0, 0, 0]));
  mesh.scale.set(...(options.scale ?? [1, 1, 1]));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function addBoulder(root, options) {
  addMesh(
    root,
    new THREE.DodecahedronGeometry(options.radius, 0),
    options.color,
    {
      name: options.name ?? 'boulder',
      position: options.position,
      rotation: options.rotation ?? [-0.14, options.rotationY ?? 0, 0.18],
      scale: options.scale,
    },
  );
}

function addPeak(root, options) {
  const geometry = new THREE.ConeGeometry(1, options.height, options.segments, 1, false);
  geometry.translate(0, options.height / 2, 0);
  addMesh(root, geometry, options.color, {
    name: options.name ?? 'peak',
    position: options.position,
    rotation: [0, options.rotationY ?? 0, 0],
    scale: [options.radiusX, 1, options.radiusZ],
  });
}

function addSlab(root, options) {
  const geometry = new THREE.CylinderGeometry(options.radiusTop, options.radiusBottom, options.height, options.segments, 1, false);
  geometry.translate(0, options.height / 2, 0);
  addMesh(root, geometry, options.color, {
    name: options.name ?? 'slab',
    position: options.position,
    rotation: [0, options.rotationY ?? 0, 0],
    scale: options.scale ?? [1, 1, 1],
  });
}

function createRoot(name) {
  const root = new THREE.Group();
  root.name = name;
  return root;
}

function buildRock6() {
  const root = createRoot('rock-6');
  addBoulder(root, { radius: 0.56, color: '#7d8379', position: [-0.38, 0.42, 0], rotationY: 0.35, scale: [1.18, 0.74, 0.92] });
  addBoulder(root, { radius: 0.46, color: '#6f766f', position: [0.32, 0.38, -0.05], rotationY: 1.1, scale: [0.9, 0.84, 1.12] });
  addBoulder(root, { radius: 0.3, color: '#929688', position: [0.08, 0.23, 0.52], rotationY: -0.5, scale: [1.15, 0.64, 0.85] });
  return root;
}

function buildMountain1() {
  const root = createRoot('mountain-1');
  addPeak(root, { height: 1.95, radiusX: 1.28, radiusZ: 1.48, segments: 5, color: '#68716a', position: [-0.34, 0, 0.08], rotationY: 0.25 });
  addPeak(root, { height: 1.34, radiusX: 0.88, radiusZ: 1.05, segments: 4, color: '#56615d', position: [0.98, 0, -0.22], rotationY: 0.9 });
  addBoulder(root, { radius: 0.32, color: '#7f857a', position: [-1.42, 0.19, -0.76], rotationY: 0.45, scale: [1.25, 0.58, 0.9] });
  return root;
}

function buildMountain2() {
  const root = createRoot('mountain-2');
  addPeak(root, { height: 2.45, radiusX: 1.52, radiusZ: 1.5, segments: 5, color: '#6d766e', position: [0.15, 0, 0.02], rotationY: -0.22 });
  addPeak(root, { height: 1.48, radiusX: 0.98, radiusZ: 1.06, segments: 4, color: '#59645f', position: [-1.34, 0, -0.32], rotationY: 0.65 });
  addBoulder(root, { radius: 0.34, color: '#81877b', position: [1.78, 0.22, -0.46], rotationY: -0.8, scale: [1.12, 0.62, 0.88] });
  return root;
}

function buildMountain3() {
  const root = createRoot('mountain-3');
  addPeak(root, { height: 4.14, radiusX: 2.0, radiusZ: 1.45, segments: 5, color: '#626c68', position: [-0.2, 0, -0.12], rotationY: 0.45 });
  addPeak(root, { height: 2.2, radiusX: 1.05, radiusZ: 0.95, segments: 4, color: '#737b70', position: [-2.34, 0, 0.36], rotationY: -0.35 });
  addPeak(root, { height: 2.45, radiusX: 1.1, radiusZ: 1.0, segments: 4, color: '#515c59', position: [2.15, 0, 0.34], rotationY: 0.75 });
  return root;
}

function buildTerrain1() {
  const root = createRoot('terrain-1');
  addSlab(root, { radiusTop: 1, radiusBottom: 1.04, height: 0.18, segments: 8, color: '#b98555', position: [0, 0, 0], scale: [3, 1, 3], rotationY: 0.2 });
  addSlab(root, { radiusTop: 1, radiusBottom: 1.02, height: 0.08, segments: 7, color: '#c89a66', position: [-0.46, 0.16, 0.32], scale: [1.2, 1, 0.78], rotationY: -0.35 });
  addBoulder(root, { radius: 0.11, color: '#8f6d50', position: [1.02, 0.26, -0.72], rotationY: 0.7, scale: [1.35, 0.42, 0.82] });
  addBoulder(root, { radius: 0.08, color: '#a47a57', position: [-1.2, 0.22, 1.08], rotationY: -0.2, scale: [1.1, 0.36, 0.8] });
  return root;
}

function buildTerrain2() {
  const root = createRoot('terrain-2');
  addSlab(root, { radiusTop: 1, radiusBottom: 1.04, height: 0.16, segments: 8, color: '#65784c', position: [0, 0, 0], scale: [3, 1, 3], rotationY: -0.1 });
  addSlab(root, { radiusTop: 1, radiusBottom: 1.02, height: 0.08, segments: 7, color: '#7f9056', position: [0.56, 0.14, -0.36], scale: [1.05, 1, 0.72], rotationY: 0.5 });
  addBoulder(root, { radius: 0.09, color: '#6d5b43', position: [-1.25, 0.22, 0.82], rotationY: -0.4, scale: [1.1, 0.38, 0.88] });
  return root;
}

const modelBuilders = {
  'rock-6': buildRock6,
  'mountain-1': buildMountain1,
  'mountain-2': buildMountain2,
  'mountain-3': buildMountain3,
  'terrain-1': buildTerrain1,
  'terrain-2': buildTerrain2,
};

function countSceneTriangles(root) {
  let triangles = 0;
  root.traverse((node) => {
    if (!node.isMesh) {
      return;
    }

    const position = node.geometry?.getAttribute('position');
    if (!position) {
      return;
    }

    triangles += (node.geometry.index?.count ?? position.count) / 3;
  });
  return Math.round(triangles);
}

async function exportGlb(root, outputPath) {
  const result = await new Promise((resolve, reject) => {
    exporter.parse(root, resolve, reject, {
      binary: true,
      onlyVisible: true,
      truncateDrawRange: true,
    });
  });

  await writeFile(outputPath, Buffer.from(result));
}

for (const [name, buildModel] of Object.entries(modelBuilders)) {
  const root = buildModel();
  const outputPath = join(biomeRoot, `${name}.glb`);
  await exportGlb(root, outputPath);
  console.log(`${name}: ${countSceneTriangles(root)} triangles`);
}
