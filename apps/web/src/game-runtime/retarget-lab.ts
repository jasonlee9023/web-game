import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned, retargetClip } from 'three/examples/jsm/utils/SkeletonUtils.js';

const canvas = document.querySelector<HTMLCanvasElement>('#lab-canvas');
const compareGrid = document.querySelector<HTMLElement>('#compare-grid');
const characterSelect = document.querySelector<HTMLSelectElement>('#character-select');
const animationSelect = document.querySelector<HTMLSelectElement>('#animation-select');
const speedSelect = document.querySelector<HTMLSelectElement>('#speed-select');
const playToggle = document.querySelector<HTMLButtonElement>('#play-toggle');
const statusFile = document.querySelector<HTMLElement>('#status-file');
const statusNote = document.querySelector<HTMLElement>('#status-note');

if (!canvas || !compareGrid || !characterSelect || !animationSelect || !speedSelect || !playToggle || !statusFile || !statusNote) {
  throw new Error('Retarget Lab shell is incomplete');
}

const compareGridEl = compareGrid;
const characterSelectEl = characterSelect;
const animationSelectEl = animationSelect;
const speedSelectEl = speedSelect;
const playToggleEl = playToggle;
const statusFileEl = statusFile;
const statusNoteEl = statusNote;

type CharacterKey = 'character-human' | 'character-orc';
type RetargetMethodKey = 'node-tracks' | 'mesh-bones' | 'sample-raw' | 'sample-aligned';
type TemplateAsset = {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
};

type SourceAnimationDefinition = {
  key: string;
  label: string;
  file: string;
  note: string;
};

type MethodDefinition = {
  key: RetargetMethodKey;
  title: string;
  description: string;
  accent: string;
};

type SourceState = {
  root: THREE.Group;
  clip: THREE.AnimationClip;
  mixer: THREE.AnimationMixer;
  action: THREE.AnimationAction;
  bones: THREE.Bone[];
  skeleton: THREE.Skeleton;
  boneLookup: Map<string, THREE.Bone>;
  nameMap: Record<string, string>;
};

type SampleBinding = {
  target: THREE.Object3D;
  source: THREE.Bone;
  basePosition: THREE.Vector3;
  baseQuaternion: THREE.Quaternion;
  sourceBasePosition: THREE.Vector3;
  alignedOffset: THREE.Quaternion;
  useAlignment: boolean;
};

type PreviewRig = {
  method: MethodDefinition;
  root: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  action: THREE.AnimationAction | null;
  sampleBindings: SampleBinding[];
  status: 'loading' | 'ready' | 'error';
  detail: string;
};

const MODEL_ROOT = '/assets/dungeon-quest/models';
const ANIMATION_ROOT = '/assets/dungeon-quest/anims';
const FLOOR_SIZE = 44;
const CHARACTER_POSITIONS = [-12, -4, 4, 12];
const CHARACTER_OPTIONS: Array<{ key: CharacterKey; label: string }> = [
  { key: 'character-human', label: 'Human' },
  { key: 'character-orc', label: 'Orc' },
];
const ANIMATION_OPTIONS: SourceAnimationDefinition[] = [
  {
    key: 'falling-to-roll',
    label: 'Falling To Roll',
    file: 'falling-to-roll-v2.fbx',
    note: '현재 제공한 롤 FBX',
  },
  {
    key: 'great-sword-blocking',
    label: 'Great Sword Blocking',
    file: 'great-sword-blocking.fbx',
    note: '현재 제공한 막기 FBX',
  },
];
const METHOD_DEFINITIONS: MethodDefinition[] = [
  {
    key: 'node-tracks',
    title: 'A. Node Tracks',
    description: 'retargetClip 후 .bones[] 트랙을 현재 노드 경로로 변환해서 그룹 믹서에 적용합니다.',
    accent: '#8fd7ff',
  },
  {
    key: 'mesh-bones',
    title: 'B. Mesh Bones',
    description: 'retargetClip 결과를 그대로 body-mesh 믹서에 적용합니다.',
    accent: '#ffd36b',
  },
  {
    key: 'sample-raw',
    title: 'C. Sample Raw',
    description: '소스 본 로컬 회전을 매 프레임 직접 복사합니다.',
    accent: '#ff9cc0',
  },
  {
    key: 'sample-aligned',
    title: 'D. Sample Aligned',
    description: '첫 프레임 오프셋을 계산한 뒤 보정해서 매 프레임 복사합니다.',
    accent: '#9bffcf',
  },
];
const RETARGET_HEIGHT_OFFSETS: Partial<Record<RetargetMethodKey, number>> = {
  'node-tracks': 1.35,
  'mesh-bones': 1.35,
};

const WEAPON_PRESET = {
  mountPosition: new THREE.Vector3(-0.182, 0.124, 0.052),
  mountRotation: new THREE.Euler(THREE.MathUtils.degToRad(34), THREE.MathUtils.degToRad(66), THREE.MathUtils.degToRad(-61)),
  bladePosition: new THREE.Vector3(-0.008, -0.11, 0.006),
  bladeRotation: new THREE.Euler(THREE.MathUtils.degToRad(-7), THREE.MathUtils.degToRad(2), THREE.MathUtils.degToRad(70)),
  bladeScale: new THREE.Vector3(1.36, 1.36, 1.36),
};

const templateCache = new Map<string, Promise<TemplateAsset>>();
const cardRefs = new Map<RetargetMethodKey, { chip: HTMLElement; detail: HTMLElement }>();
const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();

const scene = new THREE.Scene();
scene.background = new THREE.Color('#071019');
scene.fog = new THREE.Fog('#071019', 16, 52);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 12.5, 29);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 2.4, 0);
controls.minDistance = 12;
controls.maxDistance = 52;
controls.maxPolarAngle = Math.PI * 0.48;

const ambientLight = new THREE.HemisphereLight('#e9f2ff', '#102033', 1.4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight('#fff3d6', 1.8);
sunLight.position.set(10, 16, 8);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -24;
sunLight.shadow.camera.right = 24;
sunLight.shadow.camera.top = 24;
sunLight.shadow.camera.bottom = -24;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 64;
scene.add(sunLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(FLOOR_SIZE * 0.5, 96),
  new THREE.MeshStandardMaterial({
    color: '#0f1d2c',
    metalness: 0.08,
    roughness: 0.9,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(FLOOR_SIZE, FLOOR_SIZE, '#2f4f6d', '#203449');
grid.position.y = 0.02;
scene.add(grid);

const previewGroup = new THREE.Group();
scene.add(previewGroup);

const clock = new THREE.Clock();

let currentSourceState: SourceState | null = null;
let currentPreviews: PreviewRig[] = [];
let isPlaying = true;
let speed = Number(speedSelectEl.value);
let buildVersion = 0;

renderCompareCards();
populateSelectOptions();
attachEvents();
void rebuildLab();
animate();

function renderCompareCards() {
  compareGridEl.innerHTML = '';
  cardRefs.clear();

  for (const method of METHOD_DEFINITIONS) {
    const article = document.createElement('article');
    article.className = 'compare-card panel';
    article.style.borderColor = `${method.accent}33`;
    article.innerHTML = `
      <span class="chip" data-state="loading" style="color:${method.accent}">Loading</span>
      <h2>${method.title}</h2>
      <p>${method.description}</p>
      <p class="detail">대기 중</p>
    `;

    const chip = article.querySelector<HTMLElement>('.chip');
    const detail = article.querySelector<HTMLElement>('.detail');
    if (!chip || !detail) {
      continue;
    }

    cardRefs.set(method.key, { chip, detail });
    compareGridEl.append(article);
  }
}

function populateSelectOptions() {
  characterSelectEl.innerHTML = CHARACTER_OPTIONS.map((item) => `<option value="${item.key}">${item.label}</option>`).join('');
  animationSelectEl.innerHTML = ANIMATION_OPTIONS.map((item) => `<option value="${item.key}">${item.label}</option>`).join('');
}

function attachEvents() {
  window.addEventListener('resize', onResize);
  characterSelectEl.addEventListener('change', () => {
    void rebuildLab();
  });
  animationSelectEl.addEventListener('change', () => {
    void rebuildLab();
  });
  speedSelectEl.addEventListener('change', () => {
    speed = Number(speedSelectEl.value);
    updatePlaybackSpeed();
  });
  playToggleEl.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playToggleEl.textContent = isPlaying ? 'Pause' : 'Play';
  });
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function modelUrl(key: CharacterKey | 'weapon-sword') {
  return `${MODEL_ROOT}/${key}.glb`;
}

function animationUrl(file: string) {
  return `${ANIMATION_ROOT}/${file}`;
}

function prepareTemplate(root: THREE.Group) {
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) {
      return;
    }

    node.castShadow = true;
    node.receiveShadow = true;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material || !('map' in material) || !material.map) {
        continue;
      }

      material.map.colorSpace = THREE.SRGBColorSpace;
    }
  });
}

function loadTemplate(key: CharacterKey | 'weapon-sword') {
  let promise = templateCache.get(key);
  if (!promise) {
    promise = gltfLoader.loadAsync(modelUrl(key)).then((gltf) => {
      prepareTemplate(gltf.scene);
      return {
        scene: gltf.scene,
        animations: gltf.animations,
      } satisfies TemplateAsset;
    });
    templateCache.set(key, promise);
  }

  return promise;
}

function cloneTemplate(asset: TemplateAsset, skinned = false) {
  return skinned ? (cloneSkinned(asset.scene) as THREE.Group) : asset.scene.clone(true);
}

function findSkinnedMesh(root: THREE.Object3D, preferredName?: string) {
  let fallback: THREE.SkinnedMesh | null = null;
  root.traverse((node) => {
    if (!(node instanceof THREE.SkinnedMesh)) {
      return;
    }

    if (preferredName && node.name === preferredName) {
      fallback = node;
      return;
    }

    if (!fallback) {
      fallback = node;
    }
  });
  return fallback;
}

function retargetedClipToNodeTracks(clip: THREE.AnimationClip) {
  const trackPattern = /^\.bones\[([^\]]+)\]\.(position|quaternion|scale)$/;
  const tracks = clip.tracks.map((track) => {
    const matched = track.name.match(trackPattern);
    if (!matched) {
      return track.clone();
    }

    const [, boneName, property] = matched;
    const clone = track.clone();
    clone.name = `${boneName}.${property}`;
    return clone;
  });

  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

function resolveSourceBoneName(sourceBones: THREE.Bone[], candidates: string[]) {
  const names = new Set(sourceBones.map((bone) => bone.name));
  return candidates.find((candidate) => names.has(candidate)) ?? candidates[0];
}

function createSourceNameMap(sourceBones: THREE.Bone[]) {
  return {
    root: resolveSourceBoneName(sourceBones, ['mixamorig:Hips', 'mixamorigHips']),
    torso: resolveSourceBoneName(sourceBones, ['mixamorig:Spine', 'mixamorigSpine']),
    head: resolveSourceBoneName(sourceBones, ['mixamorig:Head', 'mixamorigHead']),
    'arm-left': resolveSourceBoneName(sourceBones, ['mixamorig:LeftArm', 'mixamorigLeftArm']),
    'arm-right': resolveSourceBoneName(sourceBones, ['mixamorig:RightArm', 'mixamorigRightArm']),
    'leg-left': resolveSourceBoneName(sourceBones, ['mixamorig:LeftUpLeg', 'mixamorigLeftUpLeg']),
    'leg-right': resolveSourceBoneName(sourceBones, ['mixamorig:RightUpLeg', 'mixamorigRightUpLeg']),
  };
}

function attachWeapon(character: THREE.Group, weapon: THREE.Group) {
  const armRight = character.getObjectByName('arm-right');
  const mount = new THREE.Group();
  mount.name = 'retarget-lab-weapon-mount';
  mount.position.copy(WEAPON_PRESET.mountPosition);
  mount.rotation.copy(WEAPON_PRESET.mountRotation);
  weapon.position.copy(WEAPON_PRESET.bladePosition);
  weapon.rotation.copy(WEAPON_PRESET.bladeRotation);
  weapon.scale.copy(WEAPON_PRESET.bladeScale);

  (armRight ?? character).add(mount);
  mount.add(weapon);
}

function createShadow() {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 32),
    new THREE.MeshBasicMaterial({
      color: '#03070c',
      transparent: true,
      opacity: 0.28,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  return shadow;
}

function getAnimationDefinition() {
  return ANIMATION_OPTIONS.find((item) => item.key === animationSelectEl.value) ?? ANIMATION_OPTIONS[0];
}

async function loadSourceState() {
  const animationDefinition = getAnimationDefinition();
  const source = await fbxLoader.loadAsync(animationUrl(animationDefinition.file));
  const clip = source.animations[0];
  if (!clip) {
    throw new Error('FBX clip is missing');
  }

  const bones: THREE.Bone[] = [];
  source.traverse((node) => {
    if (node instanceof THREE.Bone) {
      bones.push(node);
    }
  });

  if (bones.length === 0) {
    throw new Error('FBX bones are missing');
  }

  const mixer = new THREE.AnimationMixer(source);
  const action = mixer.clipAction(clip);
  action.reset();
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.play();
  mixer.update(0);

  return {
    root: source,
    clip,
    mixer,
    action,
    bones,
    skeleton: new THREE.Skeleton(bones),
    boneLookup: new Map(bones.map((bone) => [bone.name, bone])),
    nameMap: createSourceNameMap(bones),
  } satisfies SourceState;
}

function buildRetargetClip(targetMesh: THREE.SkinnedMesh, sourceState: SourceState) {
  return retargetClip(targetMesh, sourceState.skeleton, sourceState.clip, {
    hip: 'root',
    preserveHipPosition: false,
    useFirstFramePosition: false,
    names: sourceState.nameMap,
  });
}

function createSampleBindings(character: THREE.Group, sourceState: SourceState, useAlignment: boolean) {
  const targetNames = ['root', 'torso', 'head', 'arm-left', 'arm-right', 'leg-left', 'leg-right'] as const;
  const bindings: SampleBinding[] = [];

  for (const targetName of targetNames) {
    const target = character.getObjectByName(targetName);
    const sourceKey =
      targetName === 'arm-left'
        ? 'arm-left'
        : targetName === 'arm-right'
          ? 'arm-right'
          : targetName === 'leg-left'
            ? 'leg-left'
            : targetName === 'leg-right'
              ? 'leg-right'
              : targetName;
    const source = sourceState.boneLookup.get(sourceState.nameMap[sourceKey]);
    if (!target || !source) {
      continue;
    }

    bindings.push({
      target,
      source,
      basePosition: target.position.clone(),
      baseQuaternion: target.quaternion.clone(),
      sourceBasePosition: source.position.clone(),
      alignedOffset: target.quaternion.clone().multiply(source.quaternion.clone().invert()),
      useAlignment,
    });
  }

  return bindings;
}

function applySampleBindings(bindings: SampleBinding[]) {
  for (const binding of bindings) {
    binding.target.position.copy(binding.basePosition);
    binding.target.quaternion.copy(binding.baseQuaternion);

    const targetQuaternion = binding.useAlignment
      ? binding.alignedOffset.clone().multiply(binding.source.quaternion)
      : binding.source.quaternion;

    binding.target.quaternion.copy(targetQuaternion);

    if (binding.target.name === 'root') {
      const deltaY = binding.source.position.y - binding.sourceBasePosition.y;
      binding.target.position.y = binding.basePosition.y + deltaY * 0.16;
    }
  }
}

function setCardState(method: RetargetMethodKey, state: 'loading' | 'ready' | 'error', detail: string) {
  const refs = cardRefs.get(method);
  if (!refs) {
    return;
  }

  refs.chip.dataset.state = state;
  refs.chip.textContent = state === 'ready' ? 'Ready' : state === 'error' ? 'Error' : 'Loading';
  refs.detail.textContent = detail;
}

async function buildPreview(method: MethodDefinition, index: number, characterKey: CharacterKey, sourceState: SourceState) {
  const [characterAsset, weaponAsset] = await Promise.all([loadTemplate(characterKey), loadTemplate('weapon-sword')]);

  const root = new THREE.Group();
  root.position.set(CHARACTER_POSITIONS[index], 0, 0);
  const character = cloneTemplate(characterAsset, true);
  const weapon = cloneTemplate(weaponAsset);
  const targetMesh = findSkinnedMesh(character, 'body-mesh');
  if (!targetMesh) {
    throw new Error('Target skinned mesh is missing');
  }

  root.add(character);
  root.add(createShadow());
  attachWeapon(character, weapon);
  previewGroup.add(root);

  const preview: PreviewRig = {
    method,
    root,
    mixer: null,
    action: null,
    sampleBindings: [],
    status: 'loading',
    detail: 'Loading',
  };

  try {
    character.position.y = RETARGET_HEIGHT_OFFSETS[method.key] ?? 0;

    if (method.key === 'node-tracks') {
      const clip = retargetedClipToNodeTracks(buildRetargetClip(targetMesh, sourceState));
      preview.mixer = new THREE.AnimationMixer(character);
      preview.action = preview.mixer.clipAction(clip);
    } else if (method.key === 'mesh-bones') {
      const clip = buildRetargetClip(targetMesh, sourceState);
      preview.mixer = new THREE.AnimationMixer(targetMesh);
      preview.action = preview.mixer.clipAction(clip);
    } else {
      preview.sampleBindings = createSampleBindings(character, sourceState, method.key === 'sample-aligned');
    }

    if (preview.action) {
      preview.action.reset();
      preview.action.setLoop(THREE.LoopRepeat, Infinity);
      preview.action.clampWhenFinished = false;
      preview.action.enabled = true;
      preview.action.play();
      preview.action.timeScale = speed;
    }

    preview.status = 'ready';
    preview.detail =
      preview.sampleBindings.length > 0
        ? `Mapped bones: ${preview.sampleBindings.length}`
        : `Clip tracks: ${preview.action?.getClip().tracks.length ?? 0}`;
  } catch (error) {
    preview.status = 'error';
    preview.detail = error instanceof Error ? error.message : 'Unknown error';
  }

  setCardState(method.key, preview.status, preview.detail);
  return preview;
}

function updatePlaybackSpeed() {
  currentSourceState?.action.setEffectiveTimeScale(speed);
  for (const preview of currentPreviews) {
    preview.action?.setEffectiveTimeScale(speed);
  }
}

async function rebuildLab() {
  buildVersion += 1;
  const version = buildVersion;
  const characterKey = (characterSelectEl.value as CharacterKey) || 'character-human';
  const animationDefinition = getAnimationDefinition();

  statusFileEl.textContent = `${animationDefinition.label} · ${CHARACTER_OPTIONS.find((item) => item.key === characterKey)?.label ?? characterKey}`;
  statusNoteEl.textContent = animationDefinition.note;

  previewGroup.clear();
  currentSourceState = null;
  currentPreviews = [];

  for (const method of METHOD_DEFINITIONS) {
    setCardState(method.key, 'loading', 'Rebuilding preview...');
  }

  try {
    const sourceState = await loadSourceState();
    if (version !== buildVersion) {
      return;
    }

    currentSourceState = sourceState;
    currentSourceState.action.setEffectiveTimeScale(speed);
    currentPreviews = await Promise.all(
      METHOD_DEFINITIONS.map((method, index) => buildPreview(method, index, characterKey, sourceState)),
    );
    if (version !== buildVersion) {
      return;
    }

    statusNoteEl.textContent = `${animationDefinition.note} · Source bones: ${sourceState.bones.length} · Clip: ${sourceState.clip.name || 'Unnamed'}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown source load error';
    statusNoteEl.textContent = message;
    for (const method of METHOD_DEFINITIONS) {
      setCardState(method.key, 'error', message);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 1 / 30);

  if (isPlaying && currentSourceState) {
    currentSourceState.mixer.update(delta * speed);
    for (const preview of currentPreviews) {
      preview.mixer?.update(delta * speed);
      if (preview.sampleBindings.length > 0) {
        applySampleBindings(preview.sampleBindings);
      }
    }
  } else {
    for (const preview of currentPreviews) {
      if (preview.sampleBindings.length > 0) {
        applySampleBindings(preview.sampleBindings);
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
}
