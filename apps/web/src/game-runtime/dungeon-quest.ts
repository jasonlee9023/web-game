import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned, retargetClip } from 'three/examples/jsm/utils/SkeletonUtils.js';

import type { MultiplayerRoomSummary } from '@casual-game-world/shared';
import {
  notifyMultiplayerRoomCleared,
  notifyMultiplayerRoomCreated,
  notifyReady,
  notifyStart,
  onHostMessage,
  requestRewardedAd,
  submitScore,
} from '@casual-game-world/game-sdk';
import {
  closeRoom as closeLobbyRoom,
  createRoom as createLobbyRoom,
  fetchRoom as fetchLobbyRoom,
  fetchRooms as fetchLobbyRooms,
  heartbeatRoom as heartbeatLobbyRoom,
  joinRoom as joinLobbyRoom,
} from '../api/multiplayer.api';

const canvasNode = document.querySelector<HTMLCanvasElement>('#game');
const attackButtonNode = document.querySelector<HTMLButtonElement>('#attack-button');
const magicButtonNode = document.querySelector<HTMLButtonElement>('#magic-button');
const mobileAttackButtonNode = document.querySelector<HTMLButtonElement>('#mobile-attack-button');
const mobileMagicButtonNode = document.querySelector<HTMLButtonElement>('#mobile-magic-button');
const dodgeButtonNode = document.querySelector<HTMLButtonElement>('#dodge-button');
const blockButtonNode = document.querySelector<HTMLButtonElement>('#block-button');
const virtualJoystickNode = document.querySelector<HTMLElement>('#virtual-joystick');
const virtualJoystickThumbNode = document.querySelector<HTMLElement>('#virtual-joystick-thumb');
const utilityMenuNode = document.querySelector<HTMLElement>('#utility-menu');
const menuToggleNode = document.querySelector<HTMLButtonElement>('#menu-toggle');
const menuPanelNode = document.querySelector<HTMLElement>('#menu-panel');
const menuMatchButtonNode = document.querySelector<HTMLButtonElement>('#menu-match-button');
const soundToggleNode = document.querySelector<HTMLButtonElement>('#sound-toggle');
const objectiveNode = document.querySelector<HTMLElement>('#objective-text');
const questNode = document.querySelector<HTMLElement>('#quest-text');
const statusNode = document.querySelector<HTMLElement>('#status-text');
const healthFillNode = document.querySelector<HTMLElement>('#health-fill');
const healthLabelNode = document.querySelector<HTMLElement>('#health-label');
const manaFillNode = document.querySelector<HTMLElement>('#mana-fill');
const manaLabelNode = document.querySelector<HTMLElement>('#mana-label');
const scoreNode = document.querySelector<HTMLElement>('#score-value');
const timerNode = document.querySelector<HTMLElement>('#timer-value');
const p2pConnectedIndicatorNode = document.querySelector<HTMLElement>('#p2p-connected-indicator');
const p2pConnectedIndicatorTextNode = document.querySelector<HTMLElement>('#p2p-connected-indicator-text');
const p2pPanelNode = document.querySelector<HTMLElement>('#p2p-panel');
const p2pToggleNode = document.querySelector<HTMLButtonElement>('#p2p-toggle');
const p2pStatusNode = document.querySelector<HTMLElement>('#p2p-status');
const p2pRoleNode = document.querySelector<HTMLElement>('#p2p-role');
const p2pLobbyActionsNode = document.querySelector<HTMLElement>('#p2p-lobby-actions');
const p2pRoomActionsNode = document.querySelector<HTMLElement>('#p2p-room-actions');
const p2pHostButtonNode = document.querySelector<HTMLButtonElement>('#p2p-host-button');
const p2pJoinButtonNode = document.querySelector<HTMLButtonElement>('#p2p-join-button');
const p2pDisconnectButtonNode = document.querySelector<HTMLButtonElement>('#p2p-disconnect-button');
const p2pRefreshButtonNode = document.querySelector<HTMLButtonElement>('#p2p-refresh-button');
const p2pCopyInviteButtonNode = document.querySelector<HTMLButtonElement>('#p2p-copy-invite-button');
const p2pRoomNameGroupNode = document.querySelector<HTMLElement>('#p2p-room-name-group');
const p2pLobbyToolsNode = document.querySelector<HTMLElement>('#p2p-lobby-tools');
const p2pRoomNameNode = document.querySelector<HTMLInputElement>('#p2p-room-name');
const p2pRoomListNode = document.querySelector<HTMLElement>('#p2p-room-list');
const p2pHelpTextNode = document.querySelector<HTMLElement>('#p2p-help-text');
const editorPanelNode = document.querySelector<HTMLElement>('#editor-panel');
const editorModeNode = document.querySelector<HTMLSelectElement>('#editor-mode');
const editorPresetLabelNode = document.querySelector<HTMLElement>('#editor-preset-label');
const editorPresetNode = document.querySelector<HTMLSelectElement>('#editor-preset');
const editorControlsNode = document.querySelector<HTMLElement>('#editor-controls');
const editorCloseNode = document.querySelector<HTMLButtonElement>('#editor-close');
const editorResetNode = document.querySelector<HTMLButtonElement>('#editor-reset');
const editorCopyNode = document.querySelector<HTMLButtonElement>('#editor-copy');

if (
  !canvasNode ||
  !attackButtonNode ||
  !magicButtonNode ||
  !mobileAttackButtonNode ||
  !mobileMagicButtonNode ||
  !dodgeButtonNode ||
  !blockButtonNode ||
  !virtualJoystickNode ||
  !virtualJoystickThumbNode ||
  !utilityMenuNode ||
  !menuToggleNode ||
  !menuPanelNode ||
  !menuMatchButtonNode ||
  !soundToggleNode ||
  !objectiveNode ||
  !questNode ||
  !statusNode ||
  !healthFillNode ||
  !healthLabelNode ||
  !manaFillNode ||
  !manaLabelNode ||
  !scoreNode ||
  !timerNode ||
  !p2pConnectedIndicatorNode ||
  !p2pConnectedIndicatorTextNode ||
  !p2pPanelNode ||
  !p2pToggleNode ||
  !p2pStatusNode ||
  !p2pRoleNode ||
  !p2pLobbyActionsNode ||
  !p2pRoomActionsNode ||
  !p2pHostButtonNode ||
  !p2pJoinButtonNode ||
  !p2pDisconnectButtonNode ||
  !p2pRefreshButtonNode ||
  !p2pCopyInviteButtonNode ||
  !p2pRoomNameGroupNode ||
  !p2pLobbyToolsNode ||
  !p2pRoomNameNode ||
  !p2pRoomListNode ||
  !p2pHelpTextNode ||
  !editorPanelNode ||
  !editorModeNode ||
  !editorPresetLabelNode ||
  !editorPresetNode ||
  !editorControlsNode ||
  !editorCloseNode ||
  !editorResetNode ||
  !editorCopyNode
) {
  throw new Error('Dungeon Quest UI shell is incomplete');
}

const canvas = canvasNode;
const attackButton = attackButtonNode;
const magicButton = magicButtonNode;
const mobileAttackButton = mobileAttackButtonNode;
const mobileMagicButton = mobileMagicButtonNode;
const dodgeButton = dodgeButtonNode;
const blockButton = blockButtonNode;
const virtualJoystick = virtualJoystickNode;
const virtualJoystickThumb = virtualJoystickThumbNode;
const utilityMenu = utilityMenuNode;
const menuToggleButton = menuToggleNode;
const menuPanel = menuPanelNode;
const menuMatchButton = menuMatchButtonNode;
const soundToggleButton = soundToggleNode;
const objectiveEl = objectiveNode;
const questEl = questNode;
const statusEl = statusNode;
const healthFillEl = healthFillNode;
const healthLabelEl = healthLabelNode;
const manaFillEl = manaFillNode;
const manaLabelEl = manaLabelNode;
const scoreEl = scoreNode;
const timerEl = timerNode;
const p2pConnectedIndicatorEl = p2pConnectedIndicatorNode;
const p2pConnectedIndicatorTextEl = p2pConnectedIndicatorTextNode;
const p2pPanelEl = p2pPanelNode;
const p2pToggleEl = p2pToggleNode;
const p2pStatusEl = p2pStatusNode;
const p2pRoleEl = p2pRoleNode;
const p2pLobbyActionsEl = p2pLobbyActionsNode;
const p2pRoomActionsEl = p2pRoomActionsNode;
const p2pHostButtonEl = p2pHostButtonNode;
const p2pJoinButtonEl = p2pJoinButtonNode;
const p2pDisconnectButtonEl = p2pDisconnectButtonNode;
const p2pRefreshButtonEl = p2pRefreshButtonNode;
const p2pCopyInviteButtonEl = p2pCopyInviteButtonNode;
const p2pRoomNameGroupEl = p2pRoomNameGroupNode;
const p2pLobbyToolsEl = p2pLobbyToolsNode;
const p2pRoomNameEl = p2pRoomNameNode;
const p2pRoomListEl = p2pRoomListNode;
const p2pHelpTextEl = p2pHelpTextNode;
const editorPanelEl = editorPanelNode;
const editorModeEl = editorModeNode;
const editorPresetLabelEl = editorPresetLabelNode;
const editorPresetEl = editorPresetNode;
const editorControlsEl = editorControlsNode;
const editorCloseEl = editorCloseNode;
const editorResetEl = editorResetNode;
const editorCopyEl = editorCopyNode;
const rootStyle = document.documentElement.style;
const visualViewport = window.visualViewport;
const coarsePointerMedia = window.matchMedia('(pointer: coarse)');
const urlParams = new URLSearchParams(window.location.search);

type ModelKey =
  | 'barrel'
  | 'character-human'
  | 'character-orc'
  | 'chest'
  | 'coin'
  | 'column'
  | 'floor'
  | 'floor-detail'
  | 'gate'
  | 'rocks'
  | 'stairs'
  | 'trap'
  | 'wall'
  | 'wall-half'
  | 'wall-opening'
  | 'weapon-sword';

type CircleObstacle = {
  x: number;
  z: number;
  radius: number;
};

type CoinPickup = {
  mesh: THREE.Group;
  collected: boolean;
  baseY: number;
  pulseOffset: number;
  value: number;
};

type RigBoneKey = 'root' | 'torso' | 'armLeft' | 'armRight' | 'legLeft' | 'legRight' | 'head';

type RigBoneState = {
  node: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
};

type CharacterAnimationName =
  | 'idle'
  | 'walk'
  | 'holding-right'
  | 'holding-both'
  | 'attack-melee-right'
  | 'roll';

type TemplateAsset = {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
};

type CharacterRig = {
  actor: {
    node: THREE.Group;
  };
  bones: Partial<Record<RigBoneKey, RigBoneState>>;
  weapon: {
    node: THREE.Group;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    blade: THREE.Group;
    bladePosition: THREE.Vector3;
    bladeRotation: THREE.Euler;
    bladeScale: THREE.Vector3;
  };
  mixer: THREE.AnimationMixer;
  actions: Partial<Record<CharacterAnimationName, THREE.AnimationAction>>;
  locomotion: 'idle' | 'walk';
  attacking: boolean;
  guarding: boolean;
  blocking: boolean;
  rolling: boolean;
  rollVisualLift: number;
  rollRecoverMs: number;
  moveSpeed: number;
  attackMs: number;
  attackDurationMs: number;
  castMs: number;
  castDurationMs: number;
  hurtMs: number;
  rollMs: number;
  rollDurationMs: number;
};

type EnemyUnit = {
  mesh: THREE.Group;
  weapon: THREE.Group;
  rig: CharacterRig;
  hp: number;
  maxHp: number;
  speed: number;
  attackCooldownMs: number;
  hurtMs: number;
  home: THREE.Vector3;
  alive: boolean;
  value: number;
};

type EffectPulse = {
  mesh: THREE.Mesh;
  maxLifeMs: number;
  remainingMs: number;
};

type MatchMode = 'solo' | 'duel';

type MagicProjectileOwner = 'local' | 'remote';

type MagicProjectile = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  radius: number;
  damage: number;
  remainingMs: number;
  owner: MagicProjectileOwner;
};

type SceneAssets = {
  world: THREE.Group;
  player: THREE.Group;
  playerWeapon: THREE.Group;
  playerRig: CharacterRig;
  chest: THREE.Group;
  gate: THREE.Group;
  exitStairs: THREE.Group;
};

type GameState = {
  started: boolean;
  running: boolean;
  finished: boolean;
  waitingReward: boolean;
  reviveAvailable: boolean;
  finalized: boolean;
  score: number;
  totalTimeMs: number;
  elapsedMs: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attackCooldownMs: number;
  magicCooldownMs: number;
  playerHurtMs: number;
  rollCooldownMs: number;
  gateOpen: boolean;
  chestOpen: boolean;
  coinsCollected: number;
  enemiesDefeated: number;
  moveTarget: THREE.Vector3 | null;
  overlayText: string;
};

type ResponsiveViewport = {
  width: number;
  height: number;
  aspect: number;
  isPortrait: boolean;
  isMobile: boolean;
  compactUi: boolean;
  viewSize: number;
  renderScale: number;
  cameraOffset: THREE.Vector3;
  cameraLookOffset: THREE.Vector3;
};

type AudioCue =
  | 'attack'
  | 'miss'
  | 'hit'
  | 'enemy-defeat'
  | 'coin'
  | 'chest'
  | 'hurt'
  | 'revive'
  | 'victory'
  | 'defeat'
  | 'magic-cast'
  | 'magic-hit'
  | 'mana-empty';

type AudioSystem = {
  enabled: boolean;
  context: AudioContext | null;
  masterGain: GainNode | null;
  musicGain: GainNode | null;
  sfxGain: GainNode | null;
  nextMusicTime: number;
  musicStep: number;
};

type EditableVector3 = {
  x: number;
  y: number;
  z: number;
};

type EditorPresetKey = 'mount' | 'blade' | 'swing';

type EditorMode = 'transform' | 'map';
type TransformHandleStepMode = 'fine' | 'coarse';

type P2PRole = 'solo' | 'host' | 'guest';
type P2PStatus = 'offline' | 'loading-lobby' | 'creating-room' | 'joining' | 'waiting-peer' | 'connecting' | 'connected' | 'error';

type NetVector3 = {
  x: number;
  y: number;
  z: number;
};

type P2PMessage =
  | {
      type: 'SNAPSHOT';
      payload: {
        position: NetVector3;
        rotationY: number;
        health: number;
        mana: number;
        moveSpeed: number;
        blocking: boolean;
        rolling: boolean;
        finished: boolean;
        result: 'win' | 'lose' | null;
      };
    }
  | {
      type: 'MELEE_SWING';
      payload: {
        rotationY: number;
      };
    }
  | {
      type: 'MAGIC_CAST';
      payload: {
        origin: NetVector3;
        direction: NetVector3;
      };
    }
  | {
      type: 'DAMAGE';
      payload: {
        amount: number;
        kind: 'melee' | 'magic';
      };
    }
  | {
      type: 'RESULT';
      payload: {
        result: 'win' | 'lose';
      };
    };

type RemotePeerAvatar = {
  mesh: THREE.Group;
  weapon: THREE.Group;
  rig: CharacterRig;
  marker: THREE.Mesh;
  targetPosition: THREE.Vector3;
  targetRotationY: number;
  moveSpeed: number;
  health: number;
  mana: number;
  finished: boolean;
  result: 'win' | 'lose' | null;
  lastSnapshotAt: number;
};

type P2PState = {
  collapsed: boolean;
  role: P2PRole;
  status: P2PStatus;
  helpText: string;
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  connected: boolean;
  snapshotAccumulatorMs: number;
  roomId: string | null;
  hostedRoom: MultiplayerRoomSummary | null;
  rooms: MultiplayerRoomSummary[];
  selectedRoomId: string | null;
  hostHeartbeatTimerId: number | null;
  lobbyRefreshTimerId: number | null;
  pendingRemoteAnswer: string | null;
};

type MapTool =
  | 'erase'
  | 'floor'
  | 'floor-detail'
  | 'wall'
  | 'wall-half'
  | 'wall-opening'
  | 'column'
  | 'barrel'
  | 'rocks'
  | 'trap'
  | 'coin'
  | 'enemy'
  | 'player-spawn'
  | 'chest'
  | 'gate'
  | 'exit';

type WeaponEditorState = {
  mountPosition: EditableVector3;
  mountRotationDeg: EditableVector3;
  bladePosition: EditableVector3;
  bladeRotationDeg: EditableVector3;
  bladeScale: EditableVector3;
  swingPosition: EditableVector3;
  swingRotationDeg: EditableVector3;
  swingBladeRotationDeg: EditableVector3;
};

type EditorField = {
  key: keyof WeaponEditorState;
  label: string;
  min: number;
  max: number;
  step: number;
};

type GridPoint = {
  x: number;
  z: number;
};

type FloorTileConfig = GridPoint & {
  detail?: boolean;
};

type WallSegmentConfig = GridPoint & {
  rotationQuarter: number;
  half?: boolean;
  opening?: boolean;
};

type PropConfig = GridPoint & {
  key: 'column' | 'barrel' | 'rocks' | 'trap';
  radius: number;
  rotationQuarter?: number;
};

type CoinConfig = GridPoint & {
  value: number;
};

type EnemyConfig = GridPoint & {
  hp: number;
  speed: number;
  value: number;
  rotationQuarter?: number;
};

type DungeonMapConfig = {
  floorTiles: FloorTileConfig[];
  walls: WallSegmentConfig[];
  props: PropConfig[];
  coins: CoinConfig[];
  enemies: EnemyConfig[];
  playerSpawn: GridPoint;
  chest: GridPoint;
  gate: GridPoint;
  exit: GridPoint;
};

const MODEL_ROOT = '/assets/dungeon-quest/models';
const ANIMATION_ROOT = '/assets/dungeon-quest/anims';
const WEAPON_EDITOR_STORAGE_KEY = 'dungeon-quest:weapon-editor:v1';
const MAP_EDITOR_STORAGE_KEY = 'dungeon-quest:map-editor:v2';
const SOUND_SETTINGS_STORAGE_KEY = 'dungeon-quest:sound:v1';
const MUSIC_STEP_SECONDS = 0.38;
const MUSIC_BASS_NOTES = [110, 123.47, 98, 110, 130.81, 146.83, 110, 98];
const MUSIC_LEAD_NOTES = [220, 246.94, 261.63, 293.66, 329.63, 293.66, 261.63, 246.94];
const DEFAULT_WEAPON_EDITOR_STATE: WeaponEditorState = {
  mountPosition: { x: -0.182, y: 0.124, z: 0.052 },
  mountRotationDeg: { x: 34, y: 66, z: -61 },
  bladePosition: { x: -0.008, y: -0.11, z: 0.006 },
  bladeRotationDeg: { x: -7, y: 2, z: 70 },
  bladeScale: { x: 1.36, y: 1.36, z: 1.36 },
  swingPosition: { x: 0.009, y: 0.016, z: 0.024 },
  swingRotationDeg: { x: -7, y: 0, z: 29 },
  swingBladeRotationDeg: { x: 0, y: 0, z: 10 },
};
const EDITOR_PRESET_FIELDS: Record<EditorPresetKey, EditorField[]> = {
  mount: [
    { key: 'mountPosition', label: 'Position', min: -0.5, max: 0.5, step: 0.002 },
    { key: 'mountRotationDeg', label: 'Rotation', min: -180, max: 180, step: 1 },
  ],
  blade: [
    { key: 'bladePosition', label: 'Position', min: -0.4, max: 0.4, step: 0.002 },
    { key: 'bladeRotationDeg', label: 'Rotation', min: -180, max: 180, step: 1 },
    { key: 'bladeScale', label: 'Scale', min: 0.3, max: 2.2, step: 0.01 },
  ],
  swing: [
    { key: 'swingPosition', label: 'Swing Pos', min: -0.12, max: 0.12, step: 0.001 },
    { key: 'swingRotationDeg', label: 'Swing Rot', min: -90, max: 90, step: 1 },
    { key: 'swingBladeRotationDeg', label: 'Blade Rot', min: -90, max: 90, step: 1 },
  ],
};
const MAP_TOOL_LABELS: Record<MapTool, string> = {
  erase: 'Erase',
  floor: 'Floor',
  'floor-detail': 'Floor Detail',
  wall: 'Wall',
  'wall-half': 'Wall Half',
  'wall-opening': 'Wall Opening',
  column: 'Column',
  barrel: 'Barrel',
  rocks: 'Rocks',
  trap: 'Trap',
  coin: 'Coin',
  enemy: 'Enemy',
  'player-spawn': 'Player Spawn',
  chest: 'Chest',
  gate: 'Gate',
  exit: 'Exit',
};
const DEFAULT_MAP_CONFIG = createDefaultMapConfig();
const ROOM_BOUNDS = {
  minX: -10.4,
  maxX: 10.4,
  minZClosed: -10.85,
  minZOpen: -12.4,
  maxZ: 11.4,
};
const PLAYER_RADIUS = 0.34;
const ENEMY_RADIUS = 0.38;
const DUEL_MELEE_DAMAGE = 18;
const DUEL_MAGIC_DAMAGE = 14;
const DUEL_TOTAL_TIME_MS = 180_000;
const P2P_SNAPSHOT_INTERVAL_MS = 60;
const DEFAULT_P2P_HELP_TEXT =
  '로비에서 방을 만들면 서버가 offer/answer 신호를 중계합니다. 호스트 heartbeat가 멈추면 방은 자동으로 정리됩니다.';
const PLAYER_MOVE_SPEED = 3.45;
const PLAYER_BLOCK_SPEED = 1.72;
const PLAYER_ROLL_COOLDOWN_MS = 880;
const PLAYER_BLOCK_ARC_DOT = 0.1;
const PLAYER_ROLL_ROOT_Y_SCALE = 0.72;
const PLAYER_ROLL_ROOT_Y_OFFSET = 0.46;
const PLAYER_ROLL_DISTANCE = 3.15;
const PLAYER_ROLL_ANIMATION_SPEED = 1.38;
const PLAYER_ROLL_MOVE_PHASE = 0.58;
const PLAYER_ROLL_VISUAL_LIFT_BASE = 0.1;
const PLAYER_ROLL_VISUAL_LIFT_PEAK = 0.38;
const PLAYER_ROLL_EXIT_BLEND_MS = 120;
const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302'],
    },
  ],
};

const scene = new THREE.Scene();
scene.background = new THREE.Color('#071019');
scene.fog = new THREE.Fog('#071019', 14, 40);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 80);
const baseCameraOffset = new THREE.Vector3(7.4, 9.6, 7.2);
const baseCameraLookOffset = new THREE.Vector3(0, 0.8, -0.8);
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();

const ambientLight = new THREE.HemisphereLight('#f4f8ff', '#112338', 1.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight('#fff2d8', 1.75);
sunLight.position.set(5, 10, 2);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.left = -24;
sunLight.shadow.camera.right = 24;
sunLight.shadow.camera.top = 24;
sunLight.shadow.camera.bottom = -24;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 52;
scene.add(sunLight);

const editorGrid = new THREE.GridHelper(24, 24, '#8fd7ff', '#33516d');
editorGrid.position.set(0, 0.04, -0.5);
const editorGridMaterials = Array.isArray(editorGrid.material) ? editorGrid.material : [editorGrid.material];
for (const material of editorGridMaterials) {
  material.transparent = true;
  material.opacity = 0.38;
}
editorGrid.visible = false;
scene.add(editorGrid);

const editorCursor = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    color: '#8fd7ff',
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  }),
);
editorCursor.rotation.x = -Math.PI / 2;
editorCursor.position.y = 0.06;
editorCursor.visible = false;
scene.add(editorCursor);

const templates = new Map<ModelKey, TemplateAsset>();
const loader = new GLTFLoader();
const fbxLoader = new FBXLoader();

const keyboard = {
  up: false,
  down: false,
  left: false,
  right: false,
  block: false,
};

const virtualJoystickState = {
  active: false,
  pointerId: null as number | null,
  x: 0,
  y: 0,
};

const obstacles: CircleObstacle[] = [];
const effects: EffectPulse[] = [];
const magicProjectiles: MagicProjectile[] = [];
const coins: CoinPickup[] = [];
const enemies: EnemyUnit[] = [];

let sceneAssets: SceneAssets | null = null;
let gameMode: MatchMode = 'solo';
let viewportState: ResponsiveViewport = {
  width: Math.max(360, window.innerWidth),
  height: Math.max(360, window.innerHeight),
  aspect: Math.max(360, window.innerWidth) / Math.max(360, window.innerHeight),
  isPortrait: window.innerHeight >= window.innerWidth,
  isMobile: coarsePointerMedia.matches || window.innerWidth <= 860,
  compactUi: window.innerWidth <= 430 || window.innerHeight <= 760,
  viewSize: 12.4,
  renderScale: 1,
  cameraOffset: baseCameraOffset.clone(),
  cameraLookOffset: baseCameraLookOffset.clone(),
};
const p2pState: P2PState = {
  collapsed: true,
  role: 'solo',
  status: 'offline',
  helpText: DEFAULT_P2P_HELP_TEXT,
  peerConnection: null,
  dataChannel: null,
  connected: false,
  snapshotAccumulatorMs: 0,
  roomId: null,
  hostedRoom: null,
  rooms: [],
  selectedRoomId: null,
  hostHeartbeatTimerId: null,
  lobbyRefreshTimerId: null,
  pendingRemoteAnswer: null,
};

const state: GameState = {
  started: false,
  running: false,
  finished: false,
  waitingReward: false,
  reviveAvailable: true,
  finalized: false,
  score: 0,
  totalTimeMs: 240_000,
  elapsedMs: 0,
  health: 100,
  maxHealth: 100,
  mana: 80,
  maxMana: 80,
  attackCooldownMs: 0,
  magicCooldownMs: 0,
  playerHurtMs: 0,
  rollCooldownMs: 0,
  gateOpen: false,
  chestOpen: false,
  coinsCollected: 0,
  enemiesDefeated: 0,
  moveTarget: null,
  overlayText: '',
};
const audioState: AudioSystem = {
  enabled: loadSoundEnabled(),
  context: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  nextMusicTime: 0,
  musicStep: 0,
};
const dungeonMapConfig = loadMapConfig();
const weaponEditorState = loadWeaponEditorState();
let currentEditorMode: EditorMode = 'transform';
let p2pHelpFlashMessage: string | null = null;
let p2pHelpFlashTimerId: number | null = null;
let currentEditorPreset: EditorPresetKey = 'mount';
let currentMapTool: MapTool = 'floor';
let currentMapRotationQuarter = 0;
let currentHoverPoint: GridPoint | null = null;
let pursuedEnemy: EnemyUnit | null = null;
let editorVisible = urlParams.get('editor') === '1';
let utilityMenuOpen = false;
let pursuedRemotePeer = false;
let remotePeerAvatar: RemotePeerAvatar | null = null;
const transformHandleModes: Partial<Record<keyof WeaponEditorState, TransformHandleStepMode>> = {};

function modelUrl(name: ModelKey) {
  return `${MODEL_ROOT}/${name}.glb`;
}

function animationUrl(name: string) {
  return `${ANIMATION_ROOT}/${name}`;
}

function cloneEditorVector(source: EditableVector3): EditableVector3 {
  return { x: source.x, y: source.y, z: source.z };
}

function cloneWeaponEditorState(source: WeaponEditorState): WeaponEditorState {
  return {
    mountPosition: cloneEditorVector(source.mountPosition),
    mountRotationDeg: cloneEditorVector(source.mountRotationDeg),
    bladePosition: cloneEditorVector(source.bladePosition),
    bladeRotationDeg: cloneEditorVector(source.bladeRotationDeg),
    bladeScale: cloneEditorVector(source.bladeScale),
    swingPosition: cloneEditorVector(source.swingPosition),
    swingRotationDeg: cloneEditorVector(source.swingRotationDeg),
    swingBladeRotationDeg: cloneEditorVector(source.swingBladeRotationDeg),
  };
}

function cloneGridPoint(source: GridPoint): GridPoint {
  return { x: source.x, z: source.z };
}

function cloneMapConfig(source: DungeonMapConfig): DungeonMapConfig {
  return {
    floorTiles: source.floorTiles.map((tile) => ({ ...tile })),
    walls: source.walls.map((wall) => ({ ...wall })),
    props: source.props.map((prop) => ({ ...prop })),
    coins: source.coins.map((coin) => ({ ...coin })),
    enemies: source.enemies.map((enemy) => ({ ...enemy })),
    playerSpawn: cloneGridPoint(source.playerSpawn),
    chest: cloneGridPoint(source.chest),
    gate: cloneGridPoint(source.gate),
    exit: cloneGridPoint(source.exit),
  };
}

function createDefaultMapConfig(): DungeonMapConfig {
  const floorTiles: FloorTileConfig[] = [];
  for (let x = -10; x <= 10; x += 1) {
    for (let z = -12; z <= 11; z += 1) {
      floorTiles.push({ x, z, detail: Math.abs(x + z) % 4 === 0 });
    }
  }

  const walls: WallSegmentConfig[] = [];
  for (let x = -10; x <= 10; x += 1) {
    if (x <= -2 || x >= 2) {
      walls.push({ x, z: -11.5, rotationQuarter: 0 });
    }
    walls.push({ x, z: 11.5, rotationQuarter: 0 });
  }

  for (let z = -11; z <= 11; z += 1) {
    walls.push({ x: -10.5, z, rotationQuarter: 1 });
    walls.push({ x: 10.5, z, rotationQuarter: 1 });
  }

  walls.push({ x: -1.5, z: -11.5, rotationQuarter: 0, half: true });
  walls.push({ x: 1.5, z: -11.5, rotationQuarter: 0, half: true });

  return {
    floorTiles,
    walls,
    props: [
      { key: 'column', x: -6.4, z: -4.1, radius: 0.44, rotationQuarter: 0 },
      { key: 'column', x: 6.4, z: -4.1, radius: 0.44, rotationQuarter: 0 },
      { key: 'column', x: -6.4, z: 4.1, radius: 0.44, rotationQuarter: 0 },
      { key: 'column', x: 6.4, z: 4.1, radius: 0.44, rotationQuarter: 0 },
      { key: 'column', x: -2.5, z: -0.8, radius: 0.44, rotationQuarter: 0 },
      { key: 'column', x: 2.5, z: -0.8, radius: 0.44, rotationQuarter: 0 },
      { key: 'barrel', x: 8.2, z: 6.8, radius: 0.42, rotationQuarter: 0 },
      { key: 'barrel', x: -8.1, z: 6.5, radius: 0.42, rotationQuarter: 0 },
      { key: 'barrel', x: 8.1, z: -7.1, radius: 0.42, rotationQuarter: 0 },
      { key: 'barrel', x: -8.2, z: -7.4, radius: 0.42, rotationQuarter: 0 },
      { key: 'rocks', x: -4.8, z: -8.2, radius: 0.58, rotationQuarter: 0 },
      { key: 'rocks', x: 4.9, z: -8.0, radius: 0.58, rotationQuarter: 0 },
      { key: 'rocks', x: -7.4, z: 1.8, radius: 0.58, rotationQuarter: 0 },
      { key: 'rocks', x: 7.3, z: 2.1, radius: 0.58, rotationQuarter: 0 },
      { key: 'trap', x: 0, z: 3.4, radius: 0.52, rotationQuarter: 0 },
      { key: 'trap', x: 0, z: -4.3, radius: 0.52, rotationQuarter: 0 },
      { key: 'trap', x: -3.2, z: 7.1, radius: 0.52, rotationQuarter: 0 },
      { key: 'trap', x: 3.2, z: 7.1, radius: 0.52, rotationQuarter: 0 },
    ],
    coins: [
      { x: -9.1, z: 9.0, value: 80 },
      { x: -6.1, z: 4.7, value: 80 },
      { x: -4.0, z: -5.9, value: 80 },
      { x: -1.5, z: 1.2, value: 80 },
      { x: 0.6, z: -10.1, value: 80 },
      { x: 1.9, z: -8.9, value: 80 },
      { x: 3.6, z: 6.7, value: 80 },
      { x: 5.6, z: 1.5, value: 80 },
      { x: 6.7, z: -3.7, value: 80 },
      { x: 7.9, z: -9.3, value: 80 },
      { x: 8.9, z: 8.7, value: 80 },
      { x: -8.8, z: -1.3, value: 80 },
      { x: -6.8, z: -9.5, value: 80 },
      { x: -2.4, z: 8.4, value: 80 },
    ],
    enemies: [
      { x: -8.2, z: -8.5, rotationQuarter: 0, hp: 4, speed: 1.22, value: 155 },
      { x: 8.1, z: -8.4, rotationQuarter: 0, hp: 4, speed: 1.24, value: 155 },
      { x: -7.8, z: 7.4, rotationQuarter: 0, hp: 4, speed: 1.26, value: 155 },
      { x: 8.0, z: 7.3, rotationQuarter: 0, hp: 4, speed: 1.28, value: 155 },
      { x: -4.6, z: 3.6, rotationQuarter: 0, hp: 3, speed: 1.33, value: 155 },
      { x: 4.8, z: 3.5, rotationQuarter: 0, hp: 3, speed: 1.35, value: 155 },
      { x: -3.8, z: -2.6, rotationQuarter: 0, hp: 3, speed: 1.39, value: 155 },
      { x: 3.9, z: -2.4, rotationQuarter: 0, hp: 3, speed: 1.41, value: 155 },
    ],
    playerSpawn: { x: 0, z: 9.35 },
    chest: { x: 0, z: -1.8 },
    gate: { x: 0, z: -11.55 },
    exit: { x: 0, z: -12.35 },
  };
}

function loadMapConfig() {
  try {
    const raw = window.localStorage.getItem(MAP_EDITOR_STORAGE_KEY);
    if (!raw) {
      return cloneMapConfig(DEFAULT_MAP_CONFIG);
    }

    const parsed = JSON.parse(raw) as Partial<DungeonMapConfig>;
    const defaults = cloneMapConfig(DEFAULT_MAP_CONFIG);
    return {
      floorTiles: Array.isArray(parsed.floorTiles) ? parsed.floorTiles.map((tile) => ({ ...tile })) : defaults.floorTiles,
      walls: Array.isArray(parsed.walls) ? parsed.walls.map((wall) => ({ ...wall })) : defaults.walls,
      props: Array.isArray(parsed.props) ? parsed.props.map((prop) => ({ ...prop })) : defaults.props,
      coins: Array.isArray(parsed.coins) ? parsed.coins.map((coin) => ({ ...coin })) : defaults.coins,
      enemies: Array.isArray(parsed.enemies) ? parsed.enemies.map((enemy) => ({ ...enemy })) : defaults.enemies,
      playerSpawn: { ...defaults.playerSpawn, ...parsed.playerSpawn },
      chest: { ...defaults.chest, ...parsed.chest },
      gate: { ...defaults.gate, ...parsed.gate },
      exit: { ...defaults.exit, ...parsed.exit },
    };
  } catch {
    return cloneMapConfig(DEFAULT_MAP_CONFIG);
  }
}

function persistMapConfig() {
  window.localStorage.setItem(MAP_EDITOR_STORAGE_KEY, JSON.stringify(dungeonMapConfig));
}

function loadSoundEnabled() {
  try {
    const raw = window.localStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

function persistSoundEnabled() {
  try {
    window.localStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, String(audioState.enabled));
  } catch {
    // Ignore storage failures in private mode.
  }
}

function loadWeaponEditorState() {
  try {
    const raw = window.localStorage.getItem(WEAPON_EDITOR_STORAGE_KEY);
    if (!raw) {
      return cloneWeaponEditorState(DEFAULT_WEAPON_EDITOR_STATE);
    }

    const parsed = JSON.parse(raw) as Partial<WeaponEditorState>;
    return {
      mountPosition: { ...DEFAULT_WEAPON_EDITOR_STATE.mountPosition, ...parsed.mountPosition },
      mountRotationDeg: { ...DEFAULT_WEAPON_EDITOR_STATE.mountRotationDeg, ...parsed.mountRotationDeg },
      bladePosition: { ...DEFAULT_WEAPON_EDITOR_STATE.bladePosition, ...parsed.bladePosition },
      bladeRotationDeg: { ...DEFAULT_WEAPON_EDITOR_STATE.bladeRotationDeg, ...parsed.bladeRotationDeg },
      bladeScale: { ...DEFAULT_WEAPON_EDITOR_STATE.bladeScale, ...parsed.bladeScale },
      swingPosition: { ...DEFAULT_WEAPON_EDITOR_STATE.swingPosition, ...parsed.swingPosition },
      swingRotationDeg: { ...DEFAULT_WEAPON_EDITOR_STATE.swingRotationDeg, ...parsed.swingRotationDeg },
      swingBladeRotationDeg: { ...DEFAULT_WEAPON_EDITOR_STATE.swingBladeRotationDeg, ...parsed.swingBladeRotationDeg },
    };
  } catch {
    return cloneWeaponEditorState(DEFAULT_WEAPON_EDITOR_STATE);
  }
}

function persistWeaponEditorState() {
  window.localStorage.setItem(WEAPON_EDITOR_STORAGE_KEY, JSON.stringify(weaponEditorState));
}

function syncSoundToggleUi() {
  soundToggleButton.dataset.enabled = String(audioState.enabled);
  soundToggleButton.setAttribute('aria-pressed', String(audioState.enabled));
  soundToggleButton.textContent = audioState.enabled ? '사운드 On' : '사운드 Off';
}

function ensureAudioSystem() {
  if (audioState.context) {
    return audioState.context;
  }

  const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  const context = new AudioContextCtor();
  const masterGain = context.createGain();
  const musicGain = context.createGain();
  const sfxGain = context.createGain();

  masterGain.gain.value = audioState.enabled ? 0.88 : 0;
  musicGain.gain.value = 0.16;
  sfxGain.gain.value = 0.46;

  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(context.destination);

  audioState.context = context;
  audioState.masterGain = masterGain;
  audioState.musicGain = musicGain;
  audioState.sfxGain = sfxGain;
  audioState.nextMusicTime = context.currentTime + 0.05;
  audioState.musicStep = 0;

  return context;
}

function setMasterVolume(target: number, fadeSeconds = 0.08) {
  if (!audioState.context || !audioState.masterGain) {
    return;
  }

  const now = audioState.context.currentTime;
  audioState.masterGain.gain.cancelScheduledValues(now);
  audioState.masterGain.gain.setValueAtTime(audioState.masterGain.gain.value, now);
  audioState.masterGain.gain.linearRampToValueAtTime(target, now + fadeSeconds);
}

async function unlockAudio() {
  const context = ensureAudioSystem();
  if (!context) {
    return;
  }

  try {
    if (context.state !== 'running') {
      await context.resume();
    }
  } catch {
    return;
  }

  setMasterVolume(audioState.enabled ? 0.88 : 0);
}

function playToneAt(
  bus: 'music' | 'sfx',
  when: number,
  frequency: number,
  duration: number,
  options: {
    endFrequency?: number;
    gain?: number;
    type?: OscillatorType;
    attack?: number;
    release?: number;
  } = {},
) {
  if (!audioState.context) {
    return;
  }

  const busNode = bus === 'music' ? audioState.musicGain : audioState.sfxGain;
  if (!busNode) {
    return;
  }

  const oscillator = audioState.context.createOscillator();
  const gainNode = audioState.context.createGain();
  oscillator.type = options.type ?? 'triangle';
  oscillator.frequency.setValueAtTime(frequency, when);
  if (options.endFrequency && options.endFrequency > 0) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, when + duration);
  }

  const attack = options.attack ?? 0.01;
  const release = options.release ?? Math.max(0.04, duration * 0.68);
  const peak = options.gain ?? 0.16;

  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), when + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + release);

  oscillator.connect(gainNode);
  gainNode.connect(busNode);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.05);
}

function playCue(cue: AudioCue) {
  const context = ensureAudioSystem();
  if (!context || !audioState.enabled || context.state !== 'running') {
    return;
  }

  const now = context.currentTime + 0.002;

  switch (cue) {
    case 'attack':
      playToneAt('sfx', now, 360, 0.12, { endFrequency: 180, gain: 0.12, type: 'sawtooth', attack: 0.004, release: 0.1 });
      break;
    case 'miss':
      playToneAt('sfx', now, 220, 0.08, { endFrequency: 130, gain: 0.09, type: 'triangle', attack: 0.003, release: 0.07 });
      break;
    case 'hit':
      playToneAt('sfx', now, 180, 0.09, { endFrequency: 92, gain: 0.16, type: 'square', attack: 0.003, release: 0.08 });
      playToneAt('sfx', now + 0.012, 520, 0.07, { endFrequency: 260, gain: 0.06, type: 'triangle', attack: 0.003, release: 0.06 });
      break;
    case 'enemy-defeat':
      playToneAt('sfx', now, 240, 0.18, { endFrequency: 96, gain: 0.18, type: 'sawtooth', attack: 0.004, release: 0.16 });
      playToneAt('sfx', now + 0.03, 520, 0.22, { endFrequency: 180, gain: 0.1, type: 'triangle', attack: 0.01, release: 0.2 });
      break;
    case 'coin':
      playToneAt('sfx', now, 880, 0.08, { endFrequency: 1174, gain: 0.1, type: 'triangle', attack: 0.003, release: 0.07 });
      playToneAt('sfx', now + 0.045, 1174, 0.09, { endFrequency: 1568, gain: 0.08, type: 'sine', attack: 0.003, release: 0.08 });
      break;
    case 'chest':
      playToneAt('sfx', now, 196, 0.22, { endFrequency: 293.66, gain: 0.14, type: 'triangle', attack: 0.01, release: 0.2 });
      playToneAt('sfx', now + 0.1, 392, 0.25, { endFrequency: 587.33, gain: 0.1, type: 'sine', attack: 0.01, release: 0.24 });
      break;
    case 'hurt':
      playToneAt('sfx', now, 160, 0.14, { endFrequency: 92, gain: 0.16, type: 'square', attack: 0.003, release: 0.12 });
      break;
    case 'magic-cast':
      playToneAt('sfx', now, 420, 0.16, { endFrequency: 760, gain: 0.12, type: 'sine', attack: 0.006, release: 0.14 });
      playToneAt('sfx', now + 0.03, 260, 0.18, { endFrequency: 520, gain: 0.08, type: 'triangle', attack: 0.01, release: 0.16 });
      break;
    case 'magic-hit':
      playToneAt('sfx', now, 620, 0.12, { endFrequency: 220, gain: 0.12, type: 'triangle', attack: 0.004, release: 0.1 });
      playToneAt('sfx', now + 0.02, 980, 0.1, { endFrequency: 320, gain: 0.08, type: 'sine', attack: 0.004, release: 0.08 });
      break;
    case 'mana-empty':
      playToneAt('sfx', now, 180, 0.08, { endFrequency: 140, gain: 0.08, type: 'square', attack: 0.003, release: 0.07 });
      break;
    case 'revive':
      playToneAt('sfx', now, 220, 0.18, { endFrequency: 440, gain: 0.14, type: 'triangle', attack: 0.01, release: 0.16 });
      playToneAt('sfx', now + 0.08, 329.63, 0.22, { endFrequency: 659.25, gain: 0.1, type: 'sine', attack: 0.01, release: 0.2 });
      break;
    case 'victory':
      playToneAt('sfx', now, 261.63, 0.16, { gain: 0.12, type: 'triangle', attack: 0.01, release: 0.15 });
      playToneAt('sfx', now + 0.12, 392, 0.16, { gain: 0.1, type: 'triangle', attack: 0.01, release: 0.15 });
      playToneAt('sfx', now + 0.24, 523.25, 0.22, { gain: 0.12, type: 'sine', attack: 0.01, release: 0.21 });
      break;
    case 'defeat':
      playToneAt('sfx', now, 196, 0.18, { endFrequency: 146.83, gain: 0.12, type: 'triangle', attack: 0.01, release: 0.17 });
      playToneAt('sfx', now + 0.14, 146.83, 0.24, { endFrequency: 98, gain: 0.12, type: 'sawtooth', attack: 0.01, release: 0.22 });
      break;
    default:
      break;
  }
}

function scheduleMusicStep(when: number, step: number) {
  const bass = MUSIC_BASS_NOTES[step % MUSIC_BASS_NOTES.length];
  const lead = MUSIC_LEAD_NOTES[step % MUSIC_LEAD_NOTES.length];

  playToneAt('music', when, bass, 0.28, {
    endFrequency: bass * 0.98,
    gain: step % 2 === 0 ? 0.085 : 0.065,
    type: 'triangle',
    attack: 0.02,
    release: 0.24,
  });

  if (step % 2 === 0) {
    playToneAt('music', when + 0.03, lead, 0.22, {
      endFrequency: lead * 1.015,
      gain: 0.032,
      type: 'sine',
      attack: 0.015,
      release: 0.2,
    });
  }

  if (step % 4 === 0) {
    playToneAt('music', when + 0.05, bass * 1.5, 0.46, {
      endFrequency: bass * 1.48,
      gain: 0.028,
      type: 'triangle',
      attack: 0.04,
      release: 0.42,
    });
  }
}

function updateAudio() {
  const context = audioState.context;
  if (!context || context.state !== 'running' || !audioState.musicGain) {
    return;
  }

  const musicTarget = audioState.enabled
    ? state.finished
      ? 0.08
      : state.waitingReward
        ? 0.1
        : isMapEditorActive()
          ? 0.1
          : state.running
            ? 0.17
            : 0.13
    : 0;

  audioState.musicGain.gain.cancelScheduledValues(context.currentTime);
  audioState.musicGain.gain.linearRampToValueAtTime(musicTarget, context.currentTime + 0.18);

  if (!audioState.enabled) {
    return;
  }

  if (audioState.nextMusicTime < context.currentTime) {
    audioState.nextMusicTime = context.currentTime + 0.04;
  }

  const scheduleUntil = context.currentTime + 0.28;
  while (audioState.nextMusicTime < scheduleUntil) {
    scheduleMusicStep(audioState.nextMusicTime, audioState.musicStep);
    audioState.nextMusicTime += MUSIC_STEP_SECONDS;
    audioState.musicStep += 1;
  }
}

function toggleSound() {
  audioState.enabled = !audioState.enabled;
  persistSoundEnabled();
  syncSoundToggleUi();
  if (audioState.enabled) {
    void unlockAudio();
    setOverlay('사운드를 켰습니다. 첫 입력 이후 배경음악과 효과음이 재생됩니다.');
    return;
  }

  setMasterVolume(0, 0.08);
  setOverlay('사운드를 껐습니다.');
}

function degToRad(value: number) {
  return THREE.MathUtils.degToRad(value);
}

function updateScore(value: number) {
  state.score = Math.max(0, Math.round(value));
}

function addScore(value: number) {
  updateScore(state.score + value);
}

function setOverlay(message: string) {
  state.overlayText = message;
  statusEl.textContent = message;
}

function syncP2pHelpText() {
  p2pHelpTextEl.textContent = p2pHelpFlashMessage ?? p2pState.helpText;
}

function flashP2pHelp(message: string, durationMs = 1_800) {
  if (p2pHelpFlashTimerId !== null) {
    window.clearTimeout(p2pHelpFlashTimerId);
  }

  p2pHelpFlashMessage = message;
  syncP2pHelpText();
  p2pHelpFlashTimerId = window.setTimeout(() => {
    p2pHelpFlashMessage = null;
    p2pHelpFlashTimerId = null;
    syncP2pHelpText();
  }, durationMs);
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the legacy copy path for browsers that expose the API but reject the call.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Clipboard copy failed');
  }
}

function buildInviteLink(roomId: string) {
  return new URL(`/games/dungeon-quest/play?room=${encodeURIComponent(roomId)}`, window.location.origin).toString();
}

async function copyInviteLink() {
  if (p2pState.role !== 'host' || !p2pState.roomId) {
    flashP2pHelp('먼저 방을 만든 뒤 링크를 복사하세요.');
    return;
  }

  try {
    await copyTextToClipboard(buildInviteLink(p2pState.roomId));
    flashP2pHelp('초대 링크를 복사했습니다.');
  } catch {
    flashP2pHelp('초대 링크 복사에 실패했습니다.');
  }
}

function syncUtilityMenu() {
  menuPanel.hidden = !utilityMenuOpen;
  menuToggleButton.setAttribute('aria-expanded', String(utilityMenuOpen));
  menuMatchButton.textContent = p2pPanelEl.hidden ? '온라인 매치' : '온라인 매치 닫기';
}

function setUtilityMenuOpen(next: boolean) {
  utilityMenuOpen = next;
  syncUtilityMenu();
}

function toggleP2pPanelVisibility() {
  const nextHidden = !p2pPanelEl.hidden;
  p2pPanelEl.hidden = nextHidden;
  if (!nextHidden) {
    setP2pCollapsed(false);
  }
  syncUtilityMenu();
}

function isMenuTarget(target: EventTarget | null) {
  return target instanceof Node && utilityMenu.contains(target);
}

function isP2pTarget(target: EventTarget | null) {
  return target instanceof Node && p2pPanelEl.contains(target);
}

function isFormFieldTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function getRoleLabel(role: P2PRole) {
  switch (role) {
    case 'host':
      return 'Host';
    case 'guest':
      return 'Guest';
    default:
      return 'Solo';
  }
}

function getStatusLabel(status: P2PStatus) {
  switch (status) {
    case 'loading-lobby':
      return '로비 불러오는 중';
    case 'creating-room':
      return '방 만드는 중';
    case 'joining':
      return '참가 중';
    case 'waiting-peer':
      return '참가 대기';
    case 'connecting':
      return '연결 중';
    case 'connected':
      return '연결됨';
    case 'error':
      return '오류';
    default:
      return '오프라인';
  }
}

function setP2pStatus(status: P2PStatus, helpText?: string) {
  p2pState.status = status;
  if (helpText) {
    p2pState.helpText = helpText;
  }
  p2pStatusEl.textContent = getStatusLabel(status);
  syncP2pHelpText();
}

function syncP2pConnectedIndicator() {
  const visible = p2pState.connected && gameMode === 'duel' && p2pPanelEl.hidden;
  p2pConnectedIndicatorEl.hidden = !visible;
  p2pConnectedIndicatorTextEl.textContent = '매치 참가됨';
}

function enterCompactMatchModeUi() {
  p2pPanelEl.hidden = true;
  p2pState.collapsed = true;
  utilityMenuOpen = false;
}

function syncP2pUi() {
  const canCopyInvite = p2pState.role === 'host' && p2pState.roomId !== null;
  const isRoomContext = p2pState.roomId !== null;
  p2pPanelEl.dataset.collapsed = String(p2pState.collapsed);
  p2pPanelEl.dataset.context = isRoomContext ? 'room' : 'lobby';
  p2pToggleEl.textContent = p2pState.collapsed ? '열기' : '닫기';
  p2pToggleEl.setAttribute('aria-expanded', String(!p2pState.collapsed));
  p2pStatusEl.textContent = getStatusLabel(p2pState.status);
  p2pRoleEl.textContent = getRoleLabel(p2pState.role);
  p2pLobbyActionsEl.hidden = isRoomContext;
  p2pRoomActionsEl.hidden = !isRoomContext;
  p2pRoomNameGroupEl.hidden = isRoomContext;
  p2pLobbyToolsEl.hidden = isRoomContext;
  p2pCopyInviteButtonEl.hidden = !canCopyInvite;
  p2pCopyInviteButtonEl.disabled = !canCopyInvite || p2pState.status === 'creating-room';
  p2pDisconnectButtonEl.textContent =
    p2pState.status === 'waiting-peer' ? '대기 취소' : p2pState.connected ? '매치 종료' : '연결 종료';
  syncP2pConnectedIndicator();
  syncP2pHelpText();
  renderP2pRoomList();
  p2pDisconnectButtonEl.disabled = !p2pState.peerConnection && !p2pState.connected;
  p2pRefreshButtonEl.disabled = p2pState.roomId !== null || p2pState.status === 'creating-room' || p2pState.status === 'joining';
  p2pHostButtonEl.disabled =
    p2pState.status === 'creating-room' ||
    p2pState.status === 'joining' ||
    p2pState.status === 'connecting' ||
    p2pState.roomId !== null;
  p2pJoinButtonEl.disabled =
    p2pState.selectedRoomId === null ||
    p2pState.status === 'creating-room' ||
    p2pState.status === 'joining' ||
    p2pState.status === 'connecting' ||
    p2pState.roomId !== null;
  syncUtilityMenu();
}

function setP2pCollapsed(next: boolean) {
  p2pState.collapsed = next;
  syncP2pUi();
}

function markStarted() {
  if (gameMode === 'duel') {
    state.started = true;
    state.running = true;
    return;
  }

  if (state.started) {
    return;
  }

  state.started = true;
  state.running = true;
  notifyStart();
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function toNetVector3(vector: THREE.Vector3): NetVector3 {
  return {
    x: Number(vector.x.toFixed(3)),
    y: Number(vector.y.toFixed(3)),
    z: Number(vector.z.toFixed(3)),
  };
}

function fromNetVector3(vector: NetVector3) {
  return new THREE.Vector3(vector.x, vector.y, vector.z);
}

function getDuelSpawnPosition(role: P2PRole) {
  if (role === 'guest') {
    return {
      position: new THREE.Vector3(2.7, 0, 3.7),
      rotationY: Math.PI,
    };
  }

  return {
    position: new THREE.Vector3(-2.7, 0, -3.7),
    rotationY: 0,
  };
}

function getRemoteSpawnPosition(localRole: P2PRole) {
  return getDuelSpawnPosition(localRole === 'guest' ? 'host' : 'guest');
}

function waitForIceGatheringComplete(peerConnection: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (peerConnection.iceGatheringState === 'complete') {
      resolve();
      return;
    }

    const onStateChange = () => {
      if (peerConnection.iceGatheringState !== 'complete') {
        return;
      }

      peerConnection.removeEventListener('icegatheringstatechange', onStateChange);
      resolve();
    };

    peerConnection.addEventListener('icegatheringstatechange', onStateChange);
  });
}

function sendP2pMessage(message: P2PMessage) {
  if (!p2pState.connected || !p2pState.dataChannel || p2pState.dataChannel.readyState !== 'open') {
    return false;
  }

  p2pState.dataChannel.send(JSON.stringify(message));
  return true;
}

function clearP2pRuntimeState() {
  p2pState.snapshotAccumulatorMs = 0;
  p2pState.roomId = null;
  p2pState.hostedRoom = null;
  p2pState.selectedRoomId = null;
  p2pState.pendingRemoteAnswer = null;
}

function closePeerConnectionOnly() {
  if (p2pState.dataChannel) {
    p2pState.dataChannel.onopen = null;
    p2pState.dataChannel.onclose = null;
    p2pState.dataChannel.onmessage = null;
    p2pState.dataChannel.onerror = null;
    p2pState.dataChannel.close();
    p2pState.dataChannel = null;
  }

  if (p2pState.peerConnection) {
    p2pState.peerConnection.onconnectionstatechange = null;
    p2pState.peerConnection.ondatachannel = null;
    p2pState.peerConnection.close();
    p2pState.peerConnection = null;
  }

  p2pState.connected = false;
}

function stopHostHeartbeat() {
  if (p2pState.hostHeartbeatTimerId !== null) {
    window.clearInterval(p2pState.hostHeartbeatTimerId);
    p2pState.hostHeartbeatTimerId = null;
  }
}

function stopLobbyRefresh() {
  if (p2pState.lobbyRefreshTimerId !== null) {
    window.clearInterval(p2pState.lobbyRefreshTimerId);
    p2pState.lobbyRefreshTimerId = null;
  }
}

function roomTimeLabel(room: MultiplayerRoomSummary) {
  return new Date(room.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function roomStatusLabel(room: MultiplayerRoomSummary) {
  if (room.status === 'open') {
    return '입장 가능';
  }
  if (room.status === 'joining') {
    return '입장 처리 중';
  }
  return '전투 중';
}

function appendRoomCardContent(item: HTMLElement, room: MultiplayerRoomSummary, statusLabel: string, ownerLabel: string) {
  const titleRow = document.createElement('div');
  titleRow.className = 'p2p-room-meta';

  const title = document.createElement('strong');
  title.textContent = room.title;
  const owner = document.createElement('small');
  owner.textContent = ownerLabel;
  titleRow.append(title, owner);

  const statusRow = document.createElement('div');
  statusRow.className = 'p2p-room-meta';

  const status = document.createElement('span');
  status.textContent = statusLabel;
  const time = document.createElement('span');
  time.textContent = roomTimeLabel(room);
  statusRow.append(status, time);

  item.append(titleRow, statusRow);
}

function renderHostedRoomCard() {
  if (p2pState.role !== 'host' || !p2pState.roomId) {
    return false;
  }

  const now = new Date().toISOString();
  const room =
    p2pState.hostedRoom ??
    ({
      id: p2pState.roomId,
      gameSlug: 'dungeon-quest',
      title: p2pRoomNameEl.value.trim() || '내 방',
      hostDisplayName: '나',
      status: 'open',
      createdAt: now,
      updatedAt: now,
      lastHeartbeatAt: now,
    } satisfies MultiplayerRoomSummary);
  const item = document.createElement('div');
  item.className = 'p2p-room-card p2p-room-card--owned';
  appendRoomCardContent(item, room, p2pState.status === 'connecting' ? '연결 준비 중' : '참가자 대기중', '내가 만든 방');
  p2pRoomListEl.append(item);
  return true;
}

function renderP2pRoomList() {
  p2pRoomListEl.replaceChildren();

  const hasHostedRoom = renderHostedRoomCard();
  const joinableRooms = p2pState.rooms.filter((room) => room.id !== p2pState.roomId);

  if (joinableRooms.length === 0) {
    if (hasHostedRoom) {
      return;
    }

    const empty = document.createElement('div');
    empty.className = 'p2p-empty';
    empty.textContent =
      p2pState.roomId !== null
        ? p2pState.role === 'guest'
          ? '방에 참가 요청을 보냈습니다. 호스트 연결을 기다리는 중입니다.'
          : '매치 연결을 준비하는 중입니다.'
        : '활성 방이 없습니다. 먼저 방을 만들거나 잠시 후 새로고침하세요.';
    p2pRoomListEl.append(empty);
    return;
  }

  for (const room of joinableRooms) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'p2p-room-card';
    item.dataset.selected = String(p2pState.selectedRoomId === room.id);
    item.style.textAlign = 'left';
    item.style.cursor = 'pointer';
    item.style.borderColor =
      p2pState.selectedRoomId === room.id ? 'rgba(143, 215, 255, 0.32)' : 'rgba(255, 255, 255, 0.08)';
    appendRoomCardContent(item, room, roomStatusLabel(room), room.hostDisplayName);
    item.addEventListener('pointerdown', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      p2pState.selectedRoomId = room.id;
      syncP2pUi();
      if (p2pState.roomId !== null || p2pState.status === 'creating-room' || p2pState.status === 'joining' || p2pState.status === 'connecting') {
        return;
      }
      try {
        void unlockAudio();
        await joinSelectedRoom();
        setP2pCollapsed(false);
        setOverlay('선택한 방에 참가 요청을 보냈습니다. 연결을 기다립니다.');
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        setP2pStatus('error', message || '방 참가에 실패했습니다. 이미 가득 찼거나 사라졌을 수 있습니다.');
        syncP2pUi();
        setOverlay(message || '방 참가에 실패했습니다.');
      }
    });
    p2pRoomListEl.append(item);
  }
}

function startLobbyRefreshLoop() {
  stopLobbyRefresh();
  p2pState.lobbyRefreshTimerId = window.setInterval(() => {
    if (p2pState.roomId || p2pState.connected || p2pState.status === 'creating-room' || p2pState.status === 'joining') {
      return;
    }
    void refreshLobby(false);
  }, 5_000);
}

async function refreshLobby(showOverlay = false) {
  setP2pStatus('loading-lobby', '활성 방 목록을 새로 불러오는 중입니다.');
  syncP2pUi();
  try {
    p2pState.rooms = (await fetchLobbyRooms('dungeon-quest')).filter((room) => room.id !== p2pState.roomId);
    if (p2pState.selectedRoomId && !p2pState.rooms.some((room) => room.id === p2pState.selectedRoomId)) {
      p2pState.selectedRoomId = p2pState.rooms[0]?.id ?? null;
    }
    if (!p2pState.selectedRoomId && p2pState.rooms[0]) {
      p2pState.selectedRoomId = p2pState.rooms[0].id;
    }
    setP2pStatus('offline', '방을 만들거나 로비 목록에서 참가할 방을 선택하세요.');
    syncP2pUi();
    if (showOverlay) {
      setOverlay('로비 목록을 새로고침했습니다.');
    }
  } catch {
    p2pState.rooms = [];
    setP2pStatus('error', '로비 목록을 불러오지 못했습니다. 잠시 후 다시 시도하세요.');
    syncP2pUi();
    if (showOverlay) {
      setOverlay('로비 목록을 불러오지 못했습니다.');
    }
  }
}

function leaveDuelMode() {
  if (gameMode !== 'duel') {
    return;
  }

  gameMode = 'solo';
  pursuedRemotePeer = false;
  remotePeerAvatar = null;
  createSceneAssets();
  resetState();
  updateCamera();
  syncHud();
}

function disconnectP2P(showOverlay = true) {
  const roomId = p2pState.roomId;
  closePeerConnectionOnly();
  stopHostHeartbeat();
  leaveDuelMode();
  p2pState.role = 'solo';
  if (roomId) {
    void closeLobbyRoom(roomId).catch(() => undefined);
  }
  setP2pStatus('offline', '방을 만들거나 로비 목록에서 참가할 방을 선택하세요.');
  clearP2pRuntimeState();
  void refreshLobby(false);
  syncP2pUi();
  if (roomId) {
    notifyMultiplayerRoomCleared();
  }
  if (showOverlay) {
    setOverlay('온라인 매치를 종료하고 싱글 플레이로 돌아왔습니다.');
  }
}

function handleIncomingPeerDamage(amount: number, kind: 'melee' | 'magic') {
  if (!sceneAssets || gameMode !== 'duel' || state.finished) {
    return;
  }

  const applied = resolveIncomingPlayerDamage(amount, kind, remotePeerAvatar?.mesh.position ?? null);
  if (!applied) {
    return;
  }

  if (state.health <= 0) {
    finishDuel('lose');
    return;
  }

  setOverlay(kind === 'magic' ? `상대 마법 적중. 체력 ${Math.round(state.health)} 남음` : `상대 검격 적중. 체력 ${Math.round(state.health)} 남음`);
}

function handleP2pMessage(message: P2PMessage) {
  if (!sceneAssets || gameMode !== 'duel') {
    return;
  }

  switch (message.type) {
    case 'SNAPSHOT': {
      if (!remotePeerAvatar) {
        return;
      }

      remotePeerAvatar.targetPosition.copy(fromNetVector3(message.payload.position));
      remotePeerAvatar.targetRotationY = message.payload.rotationY;
      remotePeerAvatar.moveSpeed = message.payload.moveSpeed;
      remotePeerAvatar.health = message.payload.health;
      remotePeerAvatar.mana = message.payload.mana;
      remotePeerAvatar.rig.blocking = message.payload.blocking;
      if (message.payload.rolling && !remotePeerAvatar.rig.rolling) {
        remotePeerAvatar.rig.rollMs = remotePeerAvatar.rig.rollDurationMs;
      }
      remotePeerAvatar.finished = message.payload.finished;
      remotePeerAvatar.result = message.payload.result;
      remotePeerAvatar.lastSnapshotAt = performance.now();

      if (message.payload.finished && message.payload.result === 'lose' && !state.finished) {
        finishDuel('win');
      }
      return;
    }
    case 'MELEE_SWING': {
      if (!remotePeerAvatar) {
        return;
      }

      remotePeerAvatar.mesh.rotation.y = message.payload.rotationY;
      remotePeerAvatar.rig.attackMs = remotePeerAvatar.rig.attackDurationMs;
      return;
    }
    case 'MAGIC_CAST': {
      if (!remotePeerAvatar) {
        return;
      }

      remotePeerAvatar.rig.castMs = remotePeerAvatar.rig.castDurationMs;
      playCue('magic-cast');
      spawnMagicProjectile(fromNetVector3(message.payload.direction), 'remote', fromNetVector3(message.payload.origin));
      return;
    }
    case 'DAMAGE':
      handleIncomingPeerDamage(message.payload.amount, message.payload.kind);
      return;
    case 'RESULT':
      if (message.payload.result === 'lose' && !state.finished) {
        finishDuel('win');
      } else if (message.payload.result === 'win' && !state.finished) {
        finishDuel('lose');
      }
      return;
    default:
      return;
  }
}

function setupDataChannel(channel: RTCDataChannel) {
  p2pState.dataChannel = channel;
  channel.onopen = () => {
    p2pState.connected = true;
    setP2pStatus('connected', '연결되었습니다. 두 플레이어 모두 같은 던전에서 실시간으로 대전합니다.');
    startDuelMode();
    enterCompactMatchModeUi();
    setOverlay('');
    sendDuelSnapshot();
    syncP2pUi();
  };
  channel.onclose = () => {
    if (p2pState.status !== 'offline') {
      disconnectP2P(true);
    }
  };
  channel.onerror = () => {
    setP2pStatus('error', '데이터 채널 오류가 발생했습니다. 연결을 끊고 다시 시도하세요.');
    syncP2pUi();
  };
  channel.onmessage = (event) => {
    try {
      handleP2pMessage(JSON.parse(String(event.data)) as P2PMessage);
    } catch {
      setOverlay('상대 메시지를 해석하지 못했습니다.');
    }
  };
}

function attachPeerConnectionHandlers(peerConnection: RTCPeerConnection) {
  peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === 'connected') {
      p2pState.connected = true;
      setP2pStatus('connected', '연결되었습니다. 두 플레이어 모두 같은 던전에서 실시간으로 대전합니다.');
    } else if (peerConnection.connectionState === 'connecting') {
      setP2pStatus('connecting', '상대 응답을 확인 중입니다. 연결이 성립되면 자동으로 매치가 시작됩니다.');
    } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
      disconnectP2P(true);
    }
    syncP2pUi();
  };

  peerConnection.ondatachannel = (event) => {
    setupDataChannel(event.channel);
  };
}

function createPeerConnection(role: Exclude<P2PRole, 'solo'>) {
  closePeerConnectionOnly();
  p2pState.role = role;
  p2pState.connected = false;
  const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
  p2pState.peerConnection = peerConnection;
  attachPeerConnectionHandlers(peerConnection);

  if (role === 'host') {
    setupDataChannel(peerConnection.createDataChannel('dungeon-quest-duel'));
  }

  syncP2pUi();
  return peerConnection;
}

async function createHostRoom() {
  const peerConnection = createPeerConnection('host');
  setP2pStatus('creating-room', '방을 만들고 로비에 오퍼를 게시하는 중입니다.');
  syncP2pUi();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  await waitForIceGatheringComplete(peerConnection);
  const localDescription = peerConnection.localDescription;
  if (!localDescription) {
    throw new Error('Failed to create room offer');
  }

  const response = await createLobbyRoom({
    gameSlug: 'dungeon-quest',
    offer: JSON.stringify(localDescription.toJSON()),
    title: p2pRoomNameEl.value.trim() || undefined,
  });
  p2pState.roomId = response.room.id;
  p2pState.hostedRoom = response.room;
  p2pState.selectedRoomId = null;
  p2pState.rooms = p2pState.rooms.filter((room) => room.id !== response.room.id);
  setP2pStatus('waiting-peer', '내 방이 생성되었습니다. 초대 링크를 공유하고 참가자를 기다리는 중입니다.');
  stopHostHeartbeat();
  p2pState.hostHeartbeatTimerId = window.setInterval(() => {
    void heartbeatHostRoom();
  }, 4_000);
  syncP2pUi();
  notifyMultiplayerRoomCreated(response.room.id);
}

async function heartbeatHostRoom() {
  if (!p2pState.roomId || p2pState.role !== 'host' || !p2pState.peerConnection) {
    return;
  }

  try {
    const response = await heartbeatLobbyRoom(p2pState.roomId);
    p2pState.hostedRoom = response.room;
    p2pState.rooms = p2pState.rooms.filter((room) => room.id !== response.room.id);
    if (response.answer && response.answer !== p2pState.pendingRemoteAnswer) {
      p2pState.pendingRemoteAnswer = response.answer;
      await p2pState.peerConnection.setRemoteDescription(JSON.parse(response.answer) as RTCSessionDescriptionInit);
      setP2pStatus('connecting', '참가자의 answer를 적용했습니다. 데이터 채널이 열리면 매치가 시작됩니다.');
      syncP2pUi();
    }
  } catch {
    disconnectP2P(false);
    setP2pStatus('error', '호스트 heartbeat가 끊겨 방이 종료되었습니다.');
    syncP2pUi();
  }
}

async function joinRoomById(roomId: string) {
  if (!roomId) {
    setOverlay('참가할 방을 먼저 선택하세요.');
    return;
  }

  if (p2pState.roomId === roomId) {
    return;
  }

  if (p2pState.status === 'joining' || p2pState.status === 'connecting' || p2pState.status === 'creating-room') {
    return;
  }

  if (p2pState.roomId !== null) {
    disconnectP2P(false);
  }

  p2pPanelEl.hidden = false;
  setP2pCollapsed(false);
  p2pState.selectedRoomId = roomId;

  setP2pStatus('joining', '선택한 방 정보를 확인하고 참가를 준비하는 중입니다.');
  syncP2pUi();

  const roomSignal = await fetchLobbyRoom(roomId);
  if (!roomSignal.offer) {
    throw new Error('Room offer missing');
  }

  const peerConnection = createPeerConnection('guest');
  p2pState.roomId = roomSignal.room.id;
  p2pState.selectedRoomId = roomSignal.room.id;
  setP2pStatus('joining', '선택한 방의 오퍼를 적용하고 answer를 서버에 등록하는 중입니다.');
  syncP2pUi();
  await peerConnection.setRemoteDescription(JSON.parse(roomSignal.offer) as RTCSessionDescriptionInit);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  await waitForIceGatheringComplete(peerConnection);
  const localDescription = peerConnection.localDescription;
  if (!localDescription) {
    throw new Error('Failed to create answer');
  }

  await joinLobbyRoom(roomSignal.room.id, {
    answer: JSON.stringify(localDescription.toJSON()),
  });
  p2pState.rooms = p2pState.rooms.filter((room) => room.id !== roomSignal.room.id);
  setP2pStatus('connecting', '방 참가를 요청했습니다. 호스트 heartbeat가 answer를 적용하면 연결이 성립됩니다.');
  syncP2pUi();
}

async function joinSelectedRoom() {
  if (!p2pState.selectedRoomId) {
    setOverlay('참가할 방을 먼저 선택하세요.');
    return;
  }

  await joinRoomById(p2pState.selectedRoomId);
}

function isMapEditorActive() {
  return editorVisible && currentEditorMode === 'map';
}

function syncEditorSceneHelpers() {
  const active = isMapEditorActive();
  editorGrid.visible = active;
  editorCursor.visible = active && currentHoverPoint !== null;
  if (active) {
    state.running = false;
    state.moveTarget = null;
    keyboard.up = false;
    keyboard.down = false;
    keyboard.left = false;
    keyboard.right = false;
  }
  updateEditorCursor();
}

function syncEditorVisibility() {
  editorPanelEl.hidden = !editorVisible;
  syncEditorSceneHelpers();
}

function isEditorTarget(target: EventTarget | null) {
  return target instanceof Node && editorPanelEl.contains(target);
}

function isVirtualControlTarget(target: EventTarget | null) {
  return (
    target instanceof Node &&
    (virtualJoystick.contains(target) ||
      mobileAttackButton.contains(target) ||
      mobileMagicButton.contains(target) ||
      dodgeButton.contains(target) ||
      blockButton.contains(target))
  );
}

function isTouchHandleEditorEnabled() {
  return coarsePointerMedia.matches || viewportState.width <= 860;
}

function getTransformHandleSteps(field: EditorField) {
  if (field.key === 'bladeScale') {
    return { fine: field.step, coarse: 0.05 };
  }

  if (String(field.key).includes('RotationDeg')) {
    return { fine: Math.max(1, field.step), coarse: 5 };
  }

  return {
    fine: field.step,
    coarse: field.step <= 0.001 ? 0.005 : 0.01,
  };
}

function bindRepeatEditorButton(button: HTMLButtonElement, callback: () => void) {
  let intervalId: number | null = null;
  let delayId: number | null = null;

  const clearTimers = () => {
    if (delayId !== null) {
      window.clearTimeout(delayId);
      delayId = null;
    }
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    callback();
    delayId = window.setTimeout(() => {
      intervalId = window.setInterval(callback, 72);
    }, 220);
  });

  button.addEventListener('pointerup', clearTimers);
  button.addEventListener('pointercancel', clearTimers);
  button.addEventListener('pointerleave', clearTimers);
  button.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
}

function buildEditorVectorGroup(field: EditorField) {
  const wrapper = document.createElement('section');
  wrapper.className = 'editor-group';

  const header = document.createElement('div');
  header.className = 'editor-row-head';
  header.innerHTML = `<strong>${field.label}</strong><small>${String(field.key)}</small>`;
  wrapper.append(header);

  const stateKey = field.key;
  const vector = weaponEditorState[stateKey] as EditableVector3;
  const axisInputs = {} as Record<'x' | 'y' | 'z', { range: HTMLInputElement; number: HTMLInputElement }>;

  for (const axis of ['x', 'y', 'z'] as const) {
    const row = document.createElement('label');
    row.className = 'editor-control';

    const label = document.createElement('span');
    label.textContent = axis.toUpperCase();

    const range = document.createElement('input');
    range.className = 'editor-range';
    range.type = 'range';
    range.min = String(field.min);
    range.max = String(field.max);
    range.step = String(field.step);
    range.value = String(vector[axis]);

    const number = document.createElement('input');
    number.className = 'editor-number';
    number.type = 'number';
    number.min = String(field.min);
    number.max = String(field.max);
    number.step = String(field.step);
    number.value = String(vector[axis]);

    const apply = (nextValue: number) => {
      vector[axis] = nextValue;
      range.value = String(nextValue);
      number.value = String(nextValue);
      persistWeaponEditorState();
    };

    range.addEventListener('input', () => {
      apply(Number(range.value));
    });

    number.addEventListener('input', () => {
      const next = Number(number.value);
      if (!Number.isFinite(next)) {
        return;
      }
      apply(THREE.MathUtils.clamp(next, field.min, field.max));
    });

    row.append(label, range, number);
    wrapper.append(row);
    axisInputs[axis] = { range, number };
  }

  if (isTouchHandleEditorEnabled()) {
    const handleCard = document.createElement('div');
    handleCard.className = 'editor-handle-card';

    const handleHead = document.createElement('div');
    handleHead.className = 'editor-handle-head';

    const handleLabel = document.createElement('span');
    handleLabel.textContent = 'Mobile Handle';

    const stepLabel = document.createElement('small');

    const stepToggle = document.createElement('div');
    stepToggle.className = 'editor-step-toggle';

    const fineButton = document.createElement('button');
    fineButton.className = 'editor-step-button';
    fineButton.type = 'button';
    fineButton.textContent = 'Fine';

    const coarseButton = document.createElement('button');
    coarseButton.className = 'editor-step-button';
    coarseButton.type = 'button';
    coarseButton.textContent = 'Coarse';

    const handleGrid = document.createElement('div');
    handleGrid.className = 'editor-handle-grid';

    const steps = getTransformHandleSteps(field);
    const getMode = () => transformHandleModes[field.key] ?? 'fine';
    const getStep = () => (getMode() === 'fine' ? steps.fine : steps.coarse);

    const updateStepUi = () => {
      const mode = getMode();
      fineButton.dataset.active = String(mode === 'fine');
      coarseButton.dataset.active = String(mode === 'coarse');
      stepLabel.textContent = `step ${getStep().toFixed(3)}`;
    };

    fineButton.addEventListener('click', () => {
      transformHandleModes[field.key] = 'fine';
      updateStepUi();
    });

    coarseButton.addEventListener('click', () => {
      transformHandleModes[field.key] = 'coarse';
      updateStepUi();
    });

    for (const axis of ['x', 'y', 'z'] as const) {
      const minusButton = document.createElement('button');
      minusButton.className = 'editor-handle-button';
      minusButton.type = 'button';
      minusButton.textContent = `${axis.toUpperCase()} -`;
      bindRepeatEditorButton(minusButton, () => {
        const nextValue = THREE.MathUtils.clamp(vector[axis] - getStep(), field.min, field.max);
        vector[axis] = Number(nextValue.toFixed(4));
        axisInputs[axis].range.value = String(vector[axis]);
        axisInputs[axis].number.value = String(vector[axis]);
        persistWeaponEditorState();
      });

      const plusButton = document.createElement('button');
      plusButton.className = 'editor-handle-button';
      plusButton.type = 'button';
      plusButton.textContent = `${axis.toUpperCase()} +`;
      bindRepeatEditorButton(plusButton, () => {
        const nextValue = THREE.MathUtils.clamp(vector[axis] + getStep(), field.min, field.max);
        vector[axis] = Number(nextValue.toFixed(4));
        axisInputs[axis].range.value = String(vector[axis]);
        axisInputs[axis].number.value = String(vector[axis]);
        persistWeaponEditorState();
      });

      handleGrid.append(minusButton, plusButton);
    }

    stepToggle.append(fineButton, coarseButton);
    handleHead.append(handleLabel, stepLabel, stepToggle);
    handleCard.append(handleHead, handleGrid);
    updateStepUi();
    wrapper.append(handleCard);
  }

  return wrapper;
}

function buildEditorNote(text: string, className = 'editor-note') {
  const note = document.createElement('p');
  note.className = className;
  note.textContent = text;
  return note;
}

function renderTransformControls() {
  editorControlsEl.replaceChildren();
  for (const field of EDITOR_PRESET_FIELDS[currentEditorPreset]) {
    editorControlsEl.append(buildEditorVectorGroup(field));
  }
}

function resetWeaponEditorState() {
  const defaults = cloneWeaponEditorState(DEFAULT_WEAPON_EDITOR_STATE);
  for (const [key, value] of Object.entries(defaults) as Array<[keyof WeaponEditorState, EditableVector3]>) {
    weaponEditorState[key] = value;
  }
  persistWeaponEditorState();
  renderTransformControls();
}

async function copyWeaponEditorState() {
  const json = JSON.stringify(weaponEditorState, null, 2);
  try {
    await copyTextToClipboard(json);
    setOverlay('튜닝 JSON을 클립보드에 복사했습니다.');
  } catch {
    setOverlay('클립보드 복사에 실패했습니다.');
  }
}

function renderEditorPresetOptions() {
  editorPresetEl.replaceChildren();
  const options =
    currentEditorMode === 'transform'
      ? (['mount', 'blade', 'swing'] as const).map((preset) => ({
          value: preset,
          label: preset === 'mount' ? 'Weapon Mount' : preset === 'blade' ? 'Weapon Blade' : 'Attack Swing',
        }))
      : (Object.keys(MAP_TOOL_LABELS) as MapTool[]).map((tool) => ({
          value: tool,
          label: MAP_TOOL_LABELS[tool],
        }));

  for (const optionConfig of options) {
    const option = document.createElement('option');
    option.value = optionConfig.value;
    option.textContent = optionConfig.label;
    editorPresetEl.append(option);
  }

  editorPresetLabelEl.textContent = currentEditorMode === 'transform' ? 'Preset' : 'Tool';
  editorPresetEl.value = currentEditorMode === 'transform' ? currentEditorPreset : currentMapTool;
}

function rotateMapTool(step: number) {
  currentMapRotationQuarter = THREE.MathUtils.euclideanModulo(currentMapRotationQuarter + step, 4);
  currentHoverPoint = null;
  renderEditorControls();
  updateEditorCursor();
}

function renderMapControls() {
  editorControlsEl.replaceChildren();

  const stack = document.createElement('div');
  stack.className = 'editor-stack';

  const statusText = currentHoverPoint
    ? `Cursor ${currentHoverPoint.x.toFixed(1)}, ${currentHoverPoint.z.toFixed(1)} · Tool ${MAP_TOOL_LABELS[currentMapTool]}`
    : `Tool ${MAP_TOOL_LABELS[currentMapTool]} · 커서를 바닥에 올리면 좌표가 표시됩니다.`;
  stack.append(buildEditorNote(statusText, 'editor-status'));

  const rotationCard = document.createElement('section');
  rotationCard.className = 'editor-group';

  const rotationHead = document.createElement('div');
  rotationHead.className = 'editor-row-head';
  rotationHead.innerHTML = `<strong>Rotation</strong><small>${currentMapRotationQuarter * 90}deg</small>`;
  rotationCard.append(rotationHead);

  const rotationButtons = document.createElement('div');
  rotationButtons.className = 'editor-inline-buttons';

  const rotateLeft = document.createElement('button');
  rotateLeft.className = 'editor-button';
  rotateLeft.type = 'button';
  rotateLeft.textContent = 'Rotate -90';
  rotateLeft.addEventListener('click', () => {
    rotateMapTool(-1);
  });

  const rotateRight = document.createElement('button');
  rotateRight.className = 'editor-button';
  rotateRight.type = 'button';
  rotateRight.textContent = 'Rotate +90';
  rotateRight.addEventListener('click', () => {
    rotateMapTool(1);
  });

  rotationButtons.append(rotateLeft, rotateRight);
  rotationCard.append(rotationButtons);
  stack.append(rotationCard);

  const stats = buildEditorNote(
    `Floor ${dungeonMapConfig.floorTiles.length} · Wall ${dungeonMapConfig.walls.length} · Prop ${dungeonMapConfig.props.length} · Coin ${dungeonMapConfig.coins.length} · Enemy ${dungeonMapConfig.enemies.length}`,
  );
  stack.append(stats);

  const tips = buildEditorNote('좌클릭 배치, 우클릭 삭제, R/F 회전. 수정 내용은 브라우저에 저장됩니다.');
  stack.append(tips);

  editorControlsEl.append(stack);
}

function renderEditorControls() {
  if (currentEditorMode === 'transform') {
    renderTransformControls();
    editorResetEl.textContent = '리셋';
    editorCopyEl.textContent = 'JSON 복사';
    return;
  }

  renderMapControls();
  editorResetEl.textContent = '기본 맵';
  editorCopyEl.textContent = '맵 JSON 복사';
}

function resetMapConfig() {
  const defaults = cloneMapConfig(DEFAULT_MAP_CONFIG);
  dungeonMapConfig.floorTiles = defaults.floorTiles;
  dungeonMapConfig.walls = defaults.walls;
  dungeonMapConfig.props = defaults.props;
  dungeonMapConfig.coins = defaults.coins;
  dungeonMapConfig.enemies = defaults.enemies;
  dungeonMapConfig.playerSpawn = defaults.playerSpawn;
  dungeonMapConfig.chest = defaults.chest;
  dungeonMapConfig.gate = defaults.gate;
  dungeonMapConfig.exit = defaults.exit;
  persistMapConfig();
}

async function copyMapConfig() {
  const json = JSON.stringify(dungeonMapConfig, null, 2);
  try {
    await copyTextToClipboard(json);
    setOverlay('맵 JSON을 클립보드에 복사했습니다.');
  } catch {
    setOverlay('클립보드 복사에 실패했습니다.');
  }
}

function mountEditorUi() {
  for (const mode of ['transform', 'map'] as EditorMode[]) {
    const option = document.createElement('option');
    option.value = mode;
    option.textContent = mode === 'transform' ? 'Transform' : 'Map';
    editorModeEl.append(option);
  }

  editorModeEl.value = currentEditorMode;
  renderEditorPresetOptions();

  editorModeEl.addEventListener('change', () => {
    currentEditorMode = editorModeEl.value as EditorMode;
    currentHoverPoint = null;
    renderEditorPresetOptions();
    renderEditorControls();
    syncEditorSceneHelpers();
  });

  editorPresetEl.addEventListener('change', () => {
    if (currentEditorMode === 'transform') {
      currentEditorPreset = editorPresetEl.value as EditorPresetKey;
    } else {
      currentMapTool = editorPresetEl.value as MapTool;
      currentHoverPoint = null;
    }
    renderEditorControls();
    syncEditorSceneHelpers();
  });

  editorCloseEl.addEventListener('click', () => {
    editorVisible = false;
    syncEditorVisibility();
  });

  editorResetEl.addEventListener('click', () => {
    if (currentEditorMode === 'transform') {
      resetWeaponEditorState();
      return;
    }

    resetMapConfig();
    createSceneAssets();
    resetState();
    updateCamera();
    syncHud();
    renderEditorControls();
    setOverlay('맵을 기본 레이아웃으로 되돌렸습니다.');
  });

  editorCopyEl.addEventListener('click', () => {
    void (currentEditorMode === 'transform' ? copyWeaponEditorState() : copyMapConfig());
  });

  renderEditorControls();
  syncEditorVisibility();
}

function getViewportSize() {
  const width = Math.round(visualViewport?.width ?? window.innerWidth);
  const height = Math.round(visualViewport?.height ?? window.innerHeight);

  return {
    width: Math.max(320, width),
    height: Math.max(320, height),
  };
}

function computeViewportState(width: number, height: number): ResponsiveViewport {
  const aspect = width / height;
  const isPortrait = height >= width;
  const isMobile = coarsePointerMedia.matches || width <= 860;
  const compactUi = isMobile && (width <= 430 || height <= 760);

  let viewSize = 12.4;
  if (aspect < 1.3) {
    viewSize = 13.3;
  }
  if (aspect < 1) {
    viewSize = 14.4;
  }
  if (aspect < 0.72) {
    viewSize = 15.4;
  }
  if (aspect < 0.56) {
    viewSize = 16;
  }

  let renderScale = 1;
  if (isMobile) {
    renderScale = width * height > 900_000 ? 0.78 : 0.9;
    if (aspect < 0.72) {
      renderScale -= 0.06;
    }
    if (compactUi) {
      renderScale -= 0.04;
    }
  }

  return {
    width,
    height,
    aspect,
    isPortrait,
    isMobile,
    compactUi,
    viewSize,
    renderScale: THREE.MathUtils.clamp(renderScale, 0.7, 1),
    cameraOffset:
      aspect < 0.72
        ? new THREE.Vector3(6.1, 11.8, 9.4)
        : aspect < 1
          ? new THREE.Vector3(6.7, 10.7, 8.4)
          : baseCameraOffset.clone(),
    cameraLookOffset:
      aspect < 0.72
        ? new THREE.Vector3(0, 0.95, -1.08)
        : aspect < 1
          ? new THREE.Vector3(0, 0.85, -0.96)
          : baseCameraLookOffset.clone(),
  };
}

function syncViewportCss(viewport: ResponsiveViewport) {
  rootStyle.setProperty('--app-width', `${viewport.width}px`);
  rootStyle.setProperty('--app-height', `${viewport.height}px`);
  document.body.classList.toggle('is-compact-ui', viewport.compactUi);
  document.body.classList.toggle('is-portrait-ui', viewport.isPortrait);
}

function resizeRenderer() {
  const { width, height } = getViewportSize();
  viewportState = computeViewportState(width, height);
  syncViewportCss(viewportState);

  renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * viewportState.renderScale, viewportState.isMobile ? 1.75 : 2));
  renderer.setSize(viewportState.width, viewportState.height, false);

  camera.left = (-viewportState.viewSize * viewportState.aspect) / 2;
  camera.right = (viewportState.viewSize * viewportState.aspect) / 2;
  camera.top = viewportState.viewSize / 2;
  camera.bottom = -viewportState.viewSize / 2;
  camera.updateProjectionMatrix();

  if (editorVisible) {
    renderEditorControls();
  }
}

function prepareTemplate(root: THREE.Group) {
  root.traverse((node: THREE.Object3D) => {
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

function sanitizeCharacterAnimations(animations: THREE.AnimationClip[]) {
  return animations.map((clip) => {
    if (clip.name === 'roll') {
      return clip;
    }

    const filteredTracks = clip.tracks.filter(
      (track) => !track.name.endsWith('.position') && !track.name.endsWith('.scale'),
    );

    if (filteredTracks.length === clip.tracks.length) {
      return clip;
    }

    return new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
  });
}

function retargetedClipToNodeTracks(clip: THREE.AnimationClip) {
  const trackPattern = /^\.bones\[([^\]]+)\]\.(position|quaternion|scale)$/;
  const tracks = clip.tracks.flatMap((track) => {
    const matched = track.name.match(trackPattern);
    if (!matched) {
      return [];
    }

    const [, boneName, property] = matched;
    const cloned = track.clone();
    cloned.name = `${boneName}.${property}`;

    if (boneName === 'root' && property === 'position' && 'values' in cloned && Array.isArray(cloned.values) === false) {
      const values = cloned.values as Float32Array | number[];
      const baseX = values[0] ?? 0;
      const baseY = values[1] ?? 0;
      const baseZ = values[2] ?? 0;
      for (let index = 1; index < values.length; index += 3) {
        const deltaY = values[index] - baseY;
        values[index - 1] = baseX;
        values[index] = baseY + Math.max(0, deltaY) * PLAYER_ROLL_ROOT_Y_SCALE + PLAYER_ROLL_ROOT_Y_OFFSET;
        values[index + 1] = baseZ;
      }
    }

    return [cloned];
  });

  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

function resolveSourceBoneName(sourceBones: THREE.Bone[], candidates: string[]) {
  const boneNames = new Set(sourceBones.map((bone) => bone.name));
  return candidates.find((candidate) => boneNames.has(candidate)) ?? candidates[0];
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

async function loadHumanRollAnimation() {
  const humanTemplate = templates.get('character-human');
  if (!humanTemplate) {
    return;
  }

  const targetMesh = findSkinnedMesh(humanTemplate.scene, 'body-mesh');
  if (!targetMesh) {
    return;
  }

  const source = await fbxLoader.loadAsync(animationUrl('falling-to-roll-v2.fbx'));

  const sourceBones: THREE.Bone[] = [];
  source.traverse((node) => {
    if (node instanceof THREE.Bone) {
      sourceBones.push(node);
    }
  });

  if (sourceBones.length === 0 || source.animations.length === 0) {
    return;
  }

  const sourceSkeleton = new THREE.Skeleton(sourceBones);
  const retargetedRoll = retargetClip(targetMesh, sourceSkeleton, source.animations[0], {
    hip: 'root',
    preserveHipPosition: false,
    useFirstFramePosition: false,
    names: {
      root: resolveSourceBoneName(sourceBones, ['mixamorig:Hips', 'mixamorigHips']),
      torso: resolveSourceBoneName(sourceBones, ['mixamorig:Spine', 'mixamorigSpine']),
      head: resolveSourceBoneName(sourceBones, ['mixamorig:Head', 'mixamorigHead']),
      'arm-left': resolveSourceBoneName(sourceBones, ['mixamorig:LeftArm', 'mixamorigLeftArm']),
      'arm-right': resolveSourceBoneName(sourceBones, ['mixamorig:RightArm', 'mixamorigRightArm']),
      'leg-left': resolveSourceBoneName(sourceBones, ['mixamorig:LeftUpLeg', 'mixamorigLeftUpLeg']),
      'leg-right': resolveSourceBoneName(sourceBones, ['mixamorig:RightUpLeg', 'mixamorigRightUpLeg']),
    },
  });

  const normalizedRoll = retargetedClipToNodeTracks(retargetedRoll);
  normalizedRoll.name = 'roll';
  humanTemplate.animations = sanitizeCharacterAnimations([
    ...humanTemplate.animations.filter((clip) => clip.name !== 'roll'),
    normalizedRoll,
  ]);
  (targetMesh as THREE.SkinnedMesh).skeleton.pose();
  humanTemplate.scene.updateMatrixWorld(true);
}

async function loadTemplates() {
  const keys: ModelKey[] = [
    'barrel',
    'character-human',
    'character-orc',
    'chest',
    'coin',
    'column',
    'floor',
    'floor-detail',
    'gate',
    'rocks',
    'stairs',
    'trap',
    'wall',
    'wall-half',
    'wall-opening',
    'weapon-sword',
  ];

  await Promise.all(
    keys.map(async (key) => {
      const gltf = await loader.loadAsync(modelUrl(key));
      prepareTemplate(gltf.scene);
      templates.set(key, {
        scene: gltf.scene,
        animations:
          key === 'character-human' || key === 'character-orc'
            ? sanitizeCharacterAnimations(gltf.animations)
            : gltf.animations,
      });
    }),
  );

  await loadHumanRollAnimation().catch(() => undefined);
}

function cloneTemplate(name: ModelKey, skinned = false) {
  const template = templates.get(name);

  if (!template) {
    throw new Error(`Missing template: ${name}`);
  }

  return skinned ? (cloneSkinned(template.scene) as THREE.Group) : template.scene.clone(true);
}

function getTemplateAnimations(name: ModelKey) {
  return templates.get(name)?.animations ?? [];
}

function faceDirection(mesh: THREE.Object3D, direction: THREE.Vector3) {
  if (direction.lengthSq() < 1e-6) {
    return;
  }

  mesh.rotation.y = Math.atan2(direction.x, direction.z);
}

function createRigBone(node: THREE.Object3D | undefined) {
  if (!node) {
    return undefined;
  }

  return {
    node,
    position: node.position.clone(),
    rotation: node.rotation.clone(),
  } satisfies RigBoneState;
}

function attachWeaponToRightArm(mesh: THREE.Group, weapon: THREE.Group) {
  const mount = new THREE.Group();
  mount.name = 'weapon-mount';
  const armRight = mesh.getObjectByName('arm-right');

  if (armRight) {
    armRight.add(mount);
  } else {
    mesh.add(mount);
  }

  mount.position.set(
    weaponEditorState.mountPosition.x,
    weaponEditorState.mountPosition.y,
    weaponEditorState.mountPosition.z,
  );
  mount.rotation.set(
    degToRad(weaponEditorState.mountRotationDeg.x),
    degToRad(weaponEditorState.mountRotationDeg.y),
    degToRad(weaponEditorState.mountRotationDeg.z),
  );

  weapon.position.set(
    weaponEditorState.bladePosition.x,
    weaponEditorState.bladePosition.y,
    weaponEditorState.bladePosition.z,
  );
  weapon.rotation.set(
    degToRad(weaponEditorState.bladeRotationDeg.x),
    degToRad(weaponEditorState.bladeRotationDeg.y),
    degToRad(weaponEditorState.bladeRotationDeg.z),
  );
  weapon.scale.set(
    weaponEditorState.bladeScale.x,
    weaponEditorState.bladeScale.y,
    weaponEditorState.bladeScale.z,
  );
  
  mount.add(weapon);

  return mount;
}

function createCharacterRig(
  mesh: THREE.Group,
  weaponMount: THREE.Group,
  weapon: THREE.Group,
  animations: THREE.AnimationClip[],
) {
  const mixer = new THREE.AnimationMixer(mesh);
  const actions = Object.fromEntries(
    (['idle', 'walk', 'holding-right', 'holding-both', 'attack-melee-right', 'roll'] as CharacterAnimationName[])
      .map((name) => {
        const clip = animations.find((item) => item.name === name);
        if (!clip) {
          return [name, undefined];
        }

        const action = mixer.clipAction(clip);
        action.enabled = true;
        if (name === 'attack-melee-right' || name === 'roll') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        } else {
          action.setLoop(THREE.LoopRepeat, Infinity);
        }
        return [name, action];
      }),
  ) as Partial<Record<CharacterAnimationName, THREE.AnimationAction>>;

  actions.idle?.play();
  actions['holding-right']?.setEffectiveWeight(0.95).play();
  const attackClip = animations.find((item) => item.name === 'attack-melee-right');
  const rollClip = animations.find((item) => item.name === 'roll');

  return {
    actor: {
      node: mesh,
    },
    bones: {
      root: createRigBone(mesh.getObjectByName('root') ?? undefined),
      torso: createRigBone(mesh.getObjectByName('torso') ?? undefined),
      armLeft: createRigBone(mesh.getObjectByName('arm-left') ?? undefined),
      armRight: createRigBone(mesh.getObjectByName('arm-right') ?? undefined),
      legLeft: createRigBone(mesh.getObjectByName('leg-left') ?? undefined),
      legRight: createRigBone(mesh.getObjectByName('leg-right') ?? undefined),
      head: createRigBone(mesh.getObjectByName('head') ?? undefined),
    },
    weapon: {
      node: weaponMount,
      position: weaponMount.position.clone(),
      rotation: weaponMount.rotation.clone(),
      blade: weapon,
      bladePosition: weapon.position.clone(),
      bladeRotation: weapon.rotation.clone(),
      bladeScale: weapon.scale.clone(),
    },
    mixer,
    actions,
    locomotion: 'idle',
    attacking: false,
    guarding: false,
    blocking: false,
    rolling: false,
    rollVisualLift: 0,
    rollRecoverMs: 0,
    moveSpeed: 0,
    attackMs: 0,
    attackDurationMs: attackClip ? attackClip.duration * 1000 : 360,
    castMs: 0,
    castDurationMs: 280,
    hurtMs: 0,
    rollMs: 0,
    rollDurationMs: rollClip ? Math.max(220, (rollClip.duration * 1000 * 0.68) / PLAYER_ROLL_ANIMATION_SPEED) : 280,
  } satisfies CharacterRig;
}

function resetRigPose(rig: CharacterRig) {
  for (const bone of Object.values(rig.bones)) {
    if (!bone) {
      continue;
    }

    bone.node.position.copy(bone.position);
    bone.node.rotation.copy(bone.rotation);
  }

  rig.weapon.node.position.copy(rig.weapon.position);
  rig.weapon.node.rotation.copy(rig.weapon.rotation);
  rig.weapon.blade.position.copy(rig.weapon.bladePosition);
  rig.weapon.blade.rotation.copy(rig.weapon.bladeRotation);
  rig.weapon.blade.scale.copy(rig.weapon.bladeScale);
  rig.rollVisualLift = 0;
  rig.rollRecoverMs = 0;
}

function transitionLocomotion(rig: CharacterRig, next: 'idle' | 'walk', fadeMs = 140) {
  const nextAction = rig.actions[next];
  if (rig.locomotion === next && nextAction?.isRunning()) {
    return;
  }

  if (rig.locomotion !== next) {
    rig.actions[rig.locomotion]?.fadeOut(fadeMs / 1000);
  }

  nextAction?.reset().fadeIn(fadeMs / 1000).play();
  rig.locomotion = next;
}

function startAttackAnimation(rig: CharacterRig) {
  if (rig.attacking || rig.rolling) {
    return;
  }

  const attack = rig.actions['attack-melee-right'];
  if (!attack) {
    return;
  }

  rig.attacking = true;
  rig.actions['holding-right']?.fadeOut(0.05);
  attack.reset();
  attack.enabled = true;
  attack.setLoop(THREE.LoopOnce, 1);
  attack.clampWhenFinished = true;
  attack.crossFadeFrom(rig.actions[rig.locomotion] ?? attack, 0.06, false);
  attack.play();
}

function startRollAnimation(rig: CharacterRig) {
  if (rig.rolling) {
    return;
  }

  const roll = rig.actions.roll;
  if (!roll) {
    return;
  }

  rig.rolling = true;
  rig.attacking = false;
  rig.guarding = false;
  rig.rollRecoverMs = 0;
  rig.actions.idle?.stop();
  rig.actions.walk?.stop();
  rig.actions['holding-right']?.fadeOut(0.03);
  rig.actions['holding-both']?.fadeOut(0.03);
  rig.actions['holding-right']?.stop();
  rig.actions['holding-both']?.stop();
  rig.actions['attack-melee-right']?.stop();
  roll.reset();
  roll.enabled = true;
  roll.setEffectiveWeight(1);
  roll.setEffectiveTimeScale(PLAYER_ROLL_ANIMATION_SPEED);
  roll.setLoop(THREE.LoopOnce, 1);
  roll.clampWhenFinished = true;
  roll.play();
}

function updateRigAnimation(
  rig: CharacterRig,
  deltaMs: number,
  options: {
    baseMoveSpeed: number;
    aggressive?: boolean;
  },
) {
  const deltaSeconds = deltaMs / 1000;
  const walkStrength = THREE.MathUtils.clamp(options.baseMoveSpeed / 3.4, 0, 1);

  rig.moveSpeed = THREE.MathUtils.lerp(rig.moveSpeed, options.baseMoveSpeed, Math.min(1, deltaSeconds * 10));
  rig.attackMs = Math.max(0, rig.attackMs - deltaMs);
  rig.castMs = Math.max(0, rig.castMs - deltaMs);
  rig.hurtMs = Math.max(0, rig.hurtMs - deltaMs);
  rig.rollMs = Math.max(0, rig.rollMs - deltaMs);
  rig.rollRecoverMs = Math.max(0, rig.rollRecoverMs - deltaMs);

  const walkAction = rig.actions.walk;
  if (walkAction) {
    walkAction.setEffectiveTimeScale(THREE.MathUtils.clamp(options.baseMoveSpeed / (options.aggressive ? 1.6 : 2), 0.85, 1.7));
  }

  if (rig.rollMs > 0) {
    startRollAnimation(rig);
  } else if (rig.attackMs > 0) {
    startAttackAnimation(rig);
  } else if (!rig.attacking && !rig.rolling && rig.rollRecoverMs <= 0) {
    transitionLocomotion(rig, walkStrength > 0.08 ? 'walk' : 'idle');
  }

  rig.mixer.update(deltaSeconds);

  rig.actor.node.position.y = 0;
  rig.actor.node.rotation.x = 0;
  rig.actor.node.rotation.z = 0;

  const rollProgress =
    rig.rollDurationMs > 0
      ? THREE.MathUtils.clamp(1 - rig.rollMs / Math.max(1, rig.rollDurationMs), 0, 1)
      : 0;

  rig.weapon.position.set(
    weaponEditorState.mountPosition.x,
    weaponEditorState.mountPosition.y,
    weaponEditorState.mountPosition.z,
  );
  rig.weapon.rotation.set(
    degToRad(weaponEditorState.mountRotationDeg.x),
    degToRad(weaponEditorState.mountRotationDeg.y),
    degToRad(weaponEditorState.mountRotationDeg.z),
  );
  rig.weapon.bladePosition.set(
    weaponEditorState.bladePosition.x,
    weaponEditorState.bladePosition.y,
    weaponEditorState.bladePosition.z,
  );
  rig.weapon.bladeRotation.set(
    degToRad(weaponEditorState.bladeRotationDeg.x),
    degToRad(weaponEditorState.bladeRotationDeg.y),
    degToRad(weaponEditorState.bladeRotationDeg.z),
  );
  rig.weapon.bladeScale.set(
    weaponEditorState.bladeScale.x,
    weaponEditorState.bladeScale.y,
    weaponEditorState.bladeScale.z,
  );

  rig.weapon.node.position.copy(rig.weapon.position);
  rig.weapon.node.rotation.copy(rig.weapon.rotation);
  rig.weapon.blade.position.copy(rig.weapon.bladePosition);
  rig.weapon.blade.rotation.copy(rig.weapon.bladeRotation);
  rig.weapon.blade.scale.copy(rig.weapon.bladeScale);

  const rollAction = rig.actions.roll;
  let targetRollVisualLift = 0;
  if (rig.rolling) {
    targetRollVisualLift =
      PLAYER_ROLL_VISUAL_LIFT_BASE + Math.sin(rollProgress * Math.PI) * PLAYER_ROLL_VISUAL_LIFT_PEAK;
    if (rig.rollMs <= 0) {
      rig.rolling = false;
      rig.rollRecoverMs = PLAYER_ROLL_EXIT_BLEND_MS;
      const nextLocomotion = walkStrength > 0.08 ? 'walk' : 'idle';
      const nextAction = rig.actions[nextLocomotion];
      if (rollAction && nextAction) {
        nextAction.enabled = true;
        nextAction.reset().play();
        rollAction.crossFadeTo(nextAction, PLAYER_ROLL_EXIT_BLEND_MS / 1000, false);
        rig.locomotion = nextLocomotion;
      } else {
        rollAction?.fadeOut(PLAYER_ROLL_EXIT_BLEND_MS / 1000);
        transitionLocomotion(rig, nextLocomotion, PLAYER_ROLL_EXIT_BLEND_MS);
      }
      if (rig.blocking) {
        rig.actions['holding-both']?.reset().fadeIn(PLAYER_ROLL_EXIT_BLEND_MS / 1000).play();
        rig.guarding = true;
      } else {
        rig.actions['holding-right']?.reset().fadeIn(PLAYER_ROLL_EXIT_BLEND_MS / 1000).play();
        rig.guarding = false;
      }
    } else {
      rig.rollVisualLift = THREE.MathUtils.lerp(
        rig.rollVisualLift,
        targetRollVisualLift,
        Math.min(1, deltaSeconds * 26),
      );
      rig.actor.node.position.y = rig.rollVisualLift;
      return;
    }
  }

  rig.rollVisualLift = THREE.MathUtils.lerp(rig.rollVisualLift, targetRollVisualLift, Math.min(1, deltaSeconds * 14));
  rig.actor.node.position.y = rig.rollVisualLift;
  if (!rig.rolling && rig.rollRecoverMs <= 0) {
    rollAction?.stop();
  }

  const attackAction = rig.actions['attack-melee-right'];
  const attackProgress =
    rig.attacking && attackAction ? THREE.MathUtils.clamp(attackAction.time / attackAction.getClip().duration, 0, 1) : 0;
  const attackSwing = Math.sin(attackProgress * Math.PI);
  const castProgress =
    rig.castMs > 0 ? THREE.MathUtils.clamp(1 - rig.castMs / Math.max(1, rig.castDurationMs), 0, 1) : 0;
  const castStrength = Math.sin(castProgress * Math.PI);
  const blockStrength = !rig.rolling && !rig.attacking && rig.blocking ? 1 : 0;

  if (blockStrength > 0) {
    rig.weapon.node.position.x -= 0.05 * blockStrength;
    rig.weapon.node.position.y += 0.07 * blockStrength;
    rig.weapon.node.position.z += 0.05 * blockStrength;
    rig.weapon.node.rotation.x += degToRad(-18) * blockStrength;
    rig.weapon.node.rotation.y += degToRad(-10) * blockStrength;
    rig.weapon.node.rotation.z += degToRad(44) * blockStrength;
  }

  if (attackSwing > 0) {
    rig.weapon.node.position.x += attackSwing * weaponEditorState.swingPosition.x * (options.aggressive ? 1.35 : 1);
    rig.weapon.node.position.y += attackSwing * weaponEditorState.swingPosition.y * (options.aggressive ? 1.2 : 1);
    rig.weapon.node.position.z += attackSwing * weaponEditorState.swingPosition.z * (options.aggressive ? 1.2 : 1);
    rig.weapon.node.rotation.x += degToRad(weaponEditorState.swingRotationDeg.x) * attackSwing * (options.aggressive ? 1.2 : 1);
    rig.weapon.node.rotation.y += degToRad(weaponEditorState.swingRotationDeg.y) * attackSwing * (options.aggressive ? 1.1 : 1);
    rig.weapon.node.rotation.z += degToRad(weaponEditorState.swingRotationDeg.z) * attackSwing * (options.aggressive ? 1.2 : 1);
    rig.weapon.blade.rotation.x += degToRad(weaponEditorState.swingBladeRotationDeg.x) * attackSwing;
    rig.weapon.blade.rotation.y += degToRad(weaponEditorState.swingBladeRotationDeg.y) * attackSwing;
    rig.weapon.blade.rotation.z += degToRad(weaponEditorState.swingBladeRotationDeg.z) * attackSwing;
  }

  if (rig.attacking && attackAction && attackAction.time >= attackAction.getClip().duration - 0.02) {
    attackAction.stop();
    rig.attacking = false;
    if (rig.blocking) {
      rig.actions['holding-both']?.reset().fadeIn(0.08).play();
      rig.guarding = true;
    } else {
      rig.actions['holding-right']?.reset().fadeIn(0.08).play();
      rig.guarding = false;
    }
    transitionLocomotion(rig, walkStrength > 0.08 ? 'walk' : 'idle', 80);
  }

  if (blockStrength > 0 && !rig.guarding) {
    rig.actions['holding-right']?.fadeOut(0.08);
    rig.actions['holding-both']?.reset().fadeIn(0.08).play();
    rig.guarding = true;
  } else if (blockStrength <= 0 && rig.guarding && !rig.attacking && !rig.rolling) {
    rig.actions['holding-both']?.fadeOut(0.08);
    rig.actions['holding-right']?.reset().fadeIn(0.08).play();
    rig.guarding = false;
  }

  const armLeft = rig.bones.armLeft;
  const armRight = rig.bones.armRight;
  const torso = rig.bones.torso;
  const head = rig.bones.head;
  if (armLeft && castStrength > 0) {
    armLeft.node.rotation.copy(armLeft.rotation);
    armLeft.node.rotation.x -= 1.05 * castStrength;
    armLeft.node.rotation.y -= 0.12 * castStrength;
    armLeft.node.rotation.z += 0.72 * castStrength;
  }

  if (torso && castStrength > 0) {
    torso.node.rotation.copy(torso.rotation);
    torso.node.rotation.y -= 0.2 * castStrength;
    torso.node.rotation.z += 0.08 * castStrength;
  }

  if (head && castStrength > 0) {
    head.node.rotation.copy(head.rotation);
    head.node.rotation.y -= 0.14 * castStrength;
  }

  const root = rig.bones.root;
  const hurtPulse = rig.hurtMs > 0 ? Math.sin((rig.hurtMs / 90) * Math.PI * 2) : 0;
  if (root) {
    root.node.position.copy(root.position);
    if (rig.hurtMs > 0) {
      root.node.position.x += hurtPulse * 0.03;
    }
    root.node.rotation.copy(root.rotation);
  }

  if (torso && blockStrength > 0) {
    torso.node.rotation.copy(torso.rotation);
    torso.node.rotation.y += 0.16 * blockStrength;
    torso.node.rotation.z += 0.08 * blockStrength;
  }

  if (armLeft && blockStrength > 0) {
    armLeft.node.rotation.copy(armLeft.rotation);
    armLeft.node.rotation.x -= 0.56 * blockStrength;
    armLeft.node.rotation.y -= 0.18 * blockStrength;
    armLeft.node.rotation.z += 0.34 * blockStrength;
  }

  if (armRight && blockStrength > 0) {
    armRight.node.rotation.copy(armRight.rotation);
    armRight.node.rotation.x -= 0.24 * blockStrength;
    armRight.node.rotation.y += 0.08 * blockStrength;
    armRight.node.rotation.z -= 0.22 * blockStrength;
  }

  if (head && blockStrength > 0) {
    head.node.rotation.copy(head.rotation);
    head.node.rotation.y += 0.08 * blockStrength;
  }
}

function clampToRoom(position: THREE.Vector3, radius: number) {
  position.x = THREE.MathUtils.clamp(position.x, ROOM_BOUNDS.minX + radius, ROOM_BOUNDS.maxX - radius);
  const minZ = state.gateOpen ? ROOM_BOUNDS.minZOpen : ROOM_BOUNDS.minZClosed;
  position.z = THREE.MathUtils.clamp(position.z, minZ + radius, ROOM_BOUNDS.maxZ - radius);
}

function applyObstacleCollisions(position: THREE.Vector3, radius: number, skip?: CircleObstacle) {
  for (const obstacle of obstacles) {
    if (skip && obstacle === skip) {
      continue;
    }

    const dx = position.x - obstacle.x;
    const dz = position.z - obstacle.z;
    const distance = Math.hypot(dx, dz) || 0.0001;
    const minimum = obstacle.radius + radius;

    if (distance >= minimum) {
      continue;
    }

    const push = (minimum - distance) / distance;
    position.x += dx * push;
    position.z += dz * push;
  }

  clampToRoom(position, radius);
}

function spawnEffect(position: THREE.Vector3, color: string) {
  const geometry = new THREE.RingGeometry(0.32, 0.55, 20);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(position).add(new THREE.Vector3(0, 0.08, 0));
  scene.add(mesh);
  effects.push({
    mesh,
    maxLifeMs: 340,
    remainingMs: 340,
  });
}

function getPlayerCastOrigin() {
  if (!sceneAssets) {
    return null;
  }

  const armLeft = sceneAssets.playerRig.bones.armLeft?.node;
  if (!armLeft) {
    return sceneAssets.player.position.clone().add(new THREE.Vector3(-0.26, 0.82, 0.18));
  }

  const worldOrigin = new THREE.Vector3();
  armLeft.getWorldPosition(worldOrigin);
  return worldOrigin.add(new THREE.Vector3(-0.08, 0.06, 0.08));
}

function clearMagicProjectiles() {
  for (const projectile of magicProjectiles.splice(0, magicProjectiles.length)) {
    scene.remove(projectile.mesh);
    projectile.mesh.geometry.dispose();
    if (projectile.mesh.material instanceof THREE.Material) {
      projectile.mesh.material.dispose();
    }
  }
}

function spawnMagicProjectile(direction: THREE.Vector3, owner: MagicProjectileOwner, explicitOrigin?: THREE.Vector3) {
  const origin = explicitOrigin ?? getPlayerCastOrigin();
  if (!origin) {
    return;
  }

  const geometry = new THREE.SphereGeometry(0.16, 14, 14);
  const material = new THREE.MeshBasicMaterial({
    color: '#7ae2ff',
    transparent: true,
    opacity: 0.96,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(origin);
  scene.add(mesh);
  magicProjectiles.push({
    mesh,
    velocity: direction.clone().multiplyScalar(7.6),
    radius: 0.28,
    damage: owner === 'local' && gameMode === 'duel' ? DUEL_MAGIC_DAMAGE : 2,
    remainingMs: 1300,
    owner,
  });
}

function addCircularObstacle(x: number, z: number, radius: number) {
  obstacles.push({ x, z, radius });
}

function addFloorTile(world: THREE.Group, x: number, z: number, detail = false) {
  const tile = cloneTemplate(detail ? 'floor-detail' : 'floor');
  tile.position.set(x, 0, z);
  world.add(tile);
}

function addWallSegment(world: THREE.Group, x: number, z: number, rotationY = 0, half = false, opening = false) {
  const wall = cloneTemplate(opening ? 'wall-opening' : half ? 'wall-half' : 'wall');
  wall.position.set(x, 0, z);
  wall.rotation.y = rotationY;
  world.add(wall);
}

function rotationQuarterToRadians(rotationQuarter = 0) {
  return THREE.MathUtils.euclideanModulo(rotationQuarter, 4) * (Math.PI / 2);
}

function getPointDistance(point: THREE.Vector3 | GridPoint, target: GridPoint) {
  return Math.hypot(point.x - target.x, point.z - target.z);
}

function getMapPointVector(point: GridPoint, y = 0) {
  return new THREE.Vector3(point.x, y, point.z);
}

function getPropRadius(key: PropConfig['key']) {
  switch (key) {
    case 'column':
      return 0.44;
    case 'barrel':
      return 0.42;
    case 'rocks':
      return 0.58;
    case 'trap':
      return 0.52;
    default:
      return 0.4;
  }
}

function isWallLikeTool(tool: MapTool) {
  return tool === 'wall' || tool === 'wall-half' || tool === 'wall-opening' || tool === 'gate';
}

function snapCenterPoint(point: THREE.Vector3) {
  return {
    x: THREE.MathUtils.clamp(Math.round(point.x), -5, 5),
    z: THREE.MathUtils.clamp(Math.round(point.z), -6, 5),
  } satisfies GridPoint;
}

function snapWallPoint(point: THREE.Vector3, rotationQuarter: number) {
  const vertical = THREE.MathUtils.euclideanModulo(rotationQuarter, 2) === 1;
  return vertical
    ? ({
        x: THREE.MathUtils.clamp(Math.floor(point.x) + 0.5, -5.5, 5.5),
        z: THREE.MathUtils.clamp(Math.round(point.z), -5, 5),
      } satisfies GridPoint)
    : ({
        x: THREE.MathUtils.clamp(Math.round(point.x), -5, 5),
        z: THREE.MathUtils.clamp(Math.floor(point.z) + 0.5, -6.5, 5.5),
      } satisfies GridPoint);
}

function getSnappedPointForTool(point: THREE.Vector3, tool: MapTool, rotationQuarter = currentMapRotationQuarter) {
  if (tool === 'gate') {
    return {
      x: THREE.MathUtils.clamp(Math.round(point.x), -5, 5),
      z: -5.5,
    } satisfies GridPoint;
  }

  if (tool === 'exit') {
    return {
      x: THREE.MathUtils.clamp(Math.round(point.x), -5, 5),
      z: -6.35,
    } satisfies GridPoint;
  }

  if (isWallLikeTool(tool)) {
    return snapWallPoint(point, rotationQuarter);
  }

  return snapCenterPoint(point);
}

function updateEditorCursor() {
  if (!isMapEditorActive() || !currentHoverPoint) {
    editorCursor.visible = false;
    return;
  }

  editorCursor.visible = true;
  editorCursor.position.set(currentHoverPoint.x, 0.06, currentHoverPoint.z);
  editorCursor.rotation.x = -Math.PI / 2;
  editorCursor.rotation.y =
    currentMapTool === 'gate'
      ? 0
      : isWallLikeTool(currentMapTool)
        ? rotationQuarterToRadians(currentMapRotationQuarter)
        : 0;
  editorCursor.scale.set(1, isWallLikeTool(currentMapTool) ? 0.26 : 1, 1);
}

function syncMapHoverFromWorldPoint(point: THREE.Vector3 | null) {
  if (!point || !isMapEditorActive()) {
    if (currentHoverPoint) {
      currentHoverPoint = null;
      renderEditorControls();
    }
    updateEditorCursor();
    return;
  }

  const snapped = getSnappedPointForTool(point, currentMapTool, currentMapRotationQuarter);
  const changed =
    !currentHoverPoint ||
    Math.abs(currentHoverPoint.x - snapped.x) > 0.001 ||
    Math.abs(currentHoverPoint.z - snapped.z) > 0.001;

  currentHoverPoint = snapped;
  updateEditorCursor();

  if (changed) {
    renderEditorControls();
  }
}

function getGroundPointFromClient(clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
  const destination = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(groundPlane, destination)) {
    return null;
  }

  destination.y = 0;
  return destination;
}

function rebuildSceneFromMapEdit(message: string) {
  createSceneAssets();
  resetState();
  updateCamera();
  syncHud();
  renderEditorControls();
  syncEditorSceneHelpers();
  updateEditorCursor();
  setOverlay(message);
}

function removeNearestMapItem(point: THREE.Vector3) {
  let changed = false;
  let bestDistance = Infinity;
  let bestCandidate: { kind: 'floor' | 'wall' | 'prop' | 'coin' | 'enemy'; index: number } | null = null;

  for (const [index, tile] of dungeonMapConfig.floorTiles.entries()) {
    const distance = getPointDistance(point, tile);
    if (distance <= 0.72 && distance < bestDistance) {
      bestDistance = distance;
      bestCandidate = { kind: 'floor', index };
    }
  }

  for (const [index, wall] of dungeonMapConfig.walls.entries()) {
    const distance = getPointDistance(point, wall);
    if (distance <= 0.82 && distance < bestDistance) {
      bestDistance = distance;
      bestCandidate = { kind: 'wall', index };
    }
  }

  for (const [index, prop] of dungeonMapConfig.props.entries()) {
    const distance = getPointDistance(point, prop);
    if (distance <= 0.72 && distance < bestDistance) {
      bestDistance = distance;
      bestCandidate = { kind: 'prop', index };
    }
  }

  for (const [index, coin] of dungeonMapConfig.coins.entries()) {
    const distance = getPointDistance(point, coin);
    if (distance <= 0.72 && distance < bestDistance) {
      bestDistance = distance;
      bestCandidate = { kind: 'coin', index };
    }
  }

  for (const [index, enemy] of dungeonMapConfig.enemies.entries()) {
    const distance = getPointDistance(point, enemy);
    if (distance <= 0.72 && distance < bestDistance) {
      bestDistance = distance;
      bestCandidate = { kind: 'enemy', index };
    }
  }

  if (!bestCandidate) {
    return false;
  }

  switch (bestCandidate.kind) {
    case 'floor':
      dungeonMapConfig.floorTiles.splice(bestCandidate.index, 1);
      changed = true;
      break;
    case 'wall':
      dungeonMapConfig.walls.splice(bestCandidate.index, 1);
      changed = true;
      break;
    case 'prop':
      dungeonMapConfig.props.splice(bestCandidate.index, 1);
      changed = true;
      break;
    case 'coin':
      dungeonMapConfig.coins.splice(bestCandidate.index, 1);
      changed = true;
      break;
    case 'enemy':
      dungeonMapConfig.enemies.splice(bestCandidate.index, 1);
      changed = true;
      break;
    default:
      break;
  }

  return changed;
}

function applyMapToolAtPoint(point: THREE.Vector3, erase = false) {
  if (erase || currentMapTool === 'erase') {
    const removed = removeNearestMapItem(point);
    if (!removed) {
      return;
    }
    persistMapConfig();
    rebuildSceneFromMapEdit('맵 오브젝트를 삭제했습니다.');
    return;
  }

  const snapped = getSnappedPointForTool(point, currentMapTool, currentMapRotationQuarter);

  switch (currentMapTool) {
    case 'floor':
    case 'floor-detail': {
      dungeonMapConfig.floorTiles = dungeonMapConfig.floorTiles.filter(
        (tile) => Math.abs(tile.x - snapped.x) > 0.001 || Math.abs(tile.z - snapped.z) > 0.001,
      );
      dungeonMapConfig.floorTiles.push({
        ...snapped,
        detail: currentMapTool === 'floor-detail',
      });
      break;
    }
    case 'wall':
    case 'wall-half':
    case 'wall-opening': {
      dungeonMapConfig.walls = dungeonMapConfig.walls.filter(
        (wall) => Math.abs(wall.x - snapped.x) > 0.001 || Math.abs(wall.z - snapped.z) > 0.001,
      );
      dungeonMapConfig.walls.push({
        ...snapped,
        rotationQuarter: currentMapRotationQuarter,
        half: currentMapTool === 'wall-half',
        opening: currentMapTool === 'wall-opening',
      });
      break;
    }
    case 'column':
    case 'barrel':
    case 'rocks':
    case 'trap': {
      dungeonMapConfig.props = dungeonMapConfig.props.filter(
        (prop) => Math.abs(prop.x - snapped.x) > 0.001 || Math.abs(prop.z - snapped.z) > 0.001,
      );
      dungeonMapConfig.props.push({
        key: currentMapTool,
        x: snapped.x,
        z: snapped.z,
        radius: getPropRadius(currentMapTool),
        rotationQuarter: currentMapRotationQuarter,
      });
      break;
    }
    case 'coin': {
      dungeonMapConfig.coins = dungeonMapConfig.coins.filter(
        (coin) => Math.abs(coin.x - snapped.x) > 0.001 || Math.abs(coin.z - snapped.z) > 0.001,
      );
      dungeonMapConfig.coins.push({ ...snapped, value: 80 });
      break;
    }
    case 'enemy': {
      dungeonMapConfig.enemies = dungeonMapConfig.enemies.filter(
        (enemy) => Math.abs(enemy.x - snapped.x) > 0.001 || Math.abs(enemy.z - snapped.z) > 0.001,
      );
      dungeonMapConfig.enemies.push({
        ...snapped,
        hp: 3,
        speed: 1.3,
        value: 155,
        rotationQuarter: currentMapRotationQuarter,
      });
      break;
    }
    case 'player-spawn':
      dungeonMapConfig.playerSpawn = snapped;
      break;
    case 'chest':
      dungeonMapConfig.chest = snapped;
      break;
    case 'gate':
      dungeonMapConfig.gate = snapped;
      break;
    case 'exit':
      dungeonMapConfig.exit = snapped;
      break;
    default:
      break;
  }

  persistMapConfig();
  rebuildSceneFromMapEdit(`${MAP_TOOL_LABELS[currentMapTool]} 배치를 반영했습니다.`);
}

function buildEnvironment() {
  const world = new THREE.Group();
  obstacles.length = 0;
  coins.length = 0;
  enemies.length = 0;
  const isDuelMode = gameMode === 'duel';

  for (const tile of dungeonMapConfig.floorTiles) {
    addFloorTile(world, tile.x, tile.z, tile.detail);
  }

  for (const wall of dungeonMapConfig.walls) {
    addWallSegment(
      world,
      wall.x,
      wall.z,
      rotationQuarterToRadians(wall.rotationQuarter),
      wall.half,
      wall.opening,
    );
  }

  const gate = cloneTemplate('gate');
  gate.position.copy(getMapPointVector(dungeonMapConfig.gate));
  gate.rotation.y = 0;
  gate.visible = !isDuelMode;
  world.add(gate);

  const stairs = cloneTemplate('stairs');
  stairs.position.copy(getMapPointVector(dungeonMapConfig.exit));
  stairs.rotation.y = Math.PI;
  stairs.visible = !isDuelMode;
  world.add(stairs);

  const chest = cloneTemplate('chest');
  chest.position.copy(getMapPointVector(dungeonMapConfig.chest));
  chest.visible = !isDuelMode;
  world.add(chest);

  for (const prop of dungeonMapConfig.props) {
    const mesh = cloneTemplate(prop.key);
    mesh.position.copy(getMapPointVector(prop));
    mesh.rotation.y = rotationQuarterToRadians(prop.rotationQuarter);
    world.add(mesh);
    addCircularObstacle(prop.x, prop.z, prop.radius);
  }

  if (!isDuelMode) {
    addCircularObstacle(dungeonMapConfig.chest.x, dungeonMapConfig.chest.z, 0.66);
  }

  for (const wall of dungeonMapConfig.walls) {
    if (wall.opening) {
      continue;
    }
    const vertical = THREE.MathUtils.euclideanModulo(wall.rotationQuarter, 2) === 1;
    const offsets = wall.half ? [0] : [-0.34, 0, 0.34];
    for (const offset of offsets) {
      addCircularObstacle(
        vertical ? wall.x : wall.x + offset,
        vertical ? wall.z + offset : wall.z,
        wall.half ? 0.24 : 0.22,
      );
    }
  }

  if (!isDuelMode) {
    dungeonMapConfig.coins.forEach((spot, index) => {
      const coin = cloneTemplate('coin');
      coin.position.copy(getMapPointVector(spot, 0.28));
      world.add(coin);
      coins.push({
        mesh: coin,
        collected: false,
        baseY: coin.position.y,
        pulseOffset: index * 0.8,
        value: spot.value,
      });
    });

    dungeonMapConfig.enemies.forEach((spot, index) => {
      const mesh = cloneTemplate('character-orc', true);
      const weapon = cloneTemplate('weapon-sword');
      const animations = getTemplateAnimations('character-orc');
      mesh.position.copy(getMapPointVector(spot));
      mesh.rotation.y = rotationQuarterToRadians(spot.rotationQuarter ?? (index % 2 === 0 ? 1 : 3));
      const weaponMount = attachWeaponToRightArm(mesh, weapon);
      const rig = createCharacterRig(mesh, weaponMount, weapon, animations);
      world.add(mesh);
      enemies.push({
        mesh,
        weapon,
        rig,
        hp: spot.hp,
        maxHp: spot.hp,
        speed: spot.speed,
        attackCooldownMs: 400,
        hurtMs: 0,
        home: getMapPointVector(spot),
        alive: true,
        value: spot.value,
      });
    });
  }

  const player = cloneTemplate('character-human', true);
  const playerWeapon = cloneTemplate('weapon-sword');
  const playerAnimations = getTemplateAnimations('character-human');
  player.position.copy(isDuelMode ? getDuelSpawnPosition(p2pState.role).position : getMapPointVector(dungeonMapConfig.playerSpawn));
  if (isDuelMode) {
    player.rotation.y = getDuelSpawnPosition(p2pState.role).rotationY;
  }
  const playerWeaponMount = attachWeaponToRightArm(player, playerWeapon);
  const playerRig = createCharacterRig(player, playerWeaponMount, playerWeapon, playerAnimations);
  world.add(player);

  const heroShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 24),
    new THREE.MeshBasicMaterial({
      color: '#071019',
      transparent: true,
      opacity: 0.26,
    }),
  );
  heroShadow.rotation.x = -Math.PI / 2;
  heroShadow.position.set(0, 0.01, 0);
  player.add(heroShadow);

  scene.add(world);

  return {
    world,
    player,
    playerWeapon,
    playerRig,
    chest,
    gate,
    exitStairs: stairs,
  } satisfies SceneAssets;
}

function destroyWorld() {
  if (!sceneAssets) {
    clearEffects();
    clearMagicProjectiles();
    remotePeerAvatar = null;
    return;
  }

  scene.remove(sceneAssets.world);
  sceneAssets = null;
  remotePeerAvatar = null;
  clearEffects();
  clearMagicProjectiles();
}

function clearEffects() {
  for (const effect of effects.splice(0, effects.length)) {
    scene.remove(effect.mesh);
    effect.mesh.geometry.dispose();
    if (effect.mesh.material instanceof THREE.Material) {
      effect.mesh.material.dispose();
    }
  }
}

function resetState() {
  state.running = false;
  state.started = false;
  state.finished = false;
  state.waitingReward = false;
  state.reviveAvailable = true;
  state.finalized = false;
  state.score = 0;
  state.elapsedMs = 0;
  state.health = 100;
  state.mana = 80;
  state.attackCooldownMs = 0;
  state.magicCooldownMs = 0;
  state.playerHurtMs = 0;
  state.rollCooldownMs = 0;
  state.gateOpen = false;
  state.chestOpen = false;
  state.coinsCollected = 0;
  state.enemiesDefeated = 0;
  state.moveTarget = null;
  setBlockInput(false);
  virtualJoystickState.x = 0;
  virtualJoystickState.y = 0;
  virtualJoystickState.active = false;
  clearPursuedEnemy();
  pursuedRemotePeer = false;
  state.totalTimeMs = gameMode === 'duel' ? DUEL_TOTAL_TIME_MS : 240_000;
  updateVirtualJoystickUi();
  setOverlay('');
}

function createSceneAssets() {
  destroyWorld();
  sceneAssets = buildEnvironment();
}

function ensureRemotePeerAvatar() {
  if (!sceneAssets || remotePeerAvatar) {
    return remotePeerAvatar;
  }

  const mesh = cloneTemplate('character-human', true);
  const weapon = cloneTemplate('weapon-sword');
  const animations = getTemplateAnimations('character-human');
  const spawn = getRemoteSpawnPosition(p2pState.role);
  mesh.position.copy(spawn.position);
  mesh.rotation.y = spawn.rotationY;
  const weaponMount = attachWeaponToRightArm(mesh, weapon);
  const rig = createCharacterRig(mesh, weaponMount, weapon, animations);

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.62, 28),
    new THREE.MeshBasicMaterial({
      color: '#8fd7ff',
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.04;
  mesh.add(marker);

  sceneAssets.world.add(mesh);
  remotePeerAvatar = {
    mesh,
    weapon,
    rig,
    marker,
    targetPosition: spawn.position.clone(),
    targetRotationY: spawn.rotationY,
    moveSpeed: 0,
    health: 100,
    mana: 80,
    finished: false,
    result: null,
    lastSnapshotAt: performance.now(),
  };
  return remotePeerAvatar;
}

function startDuelMode() {
  gameMode = 'duel';
  createSceneAssets();
  resetState();
  state.started = true;
  state.running = true;
  state.finished = false;
  state.waitingReward = false;
  state.finalized = false;
  state.totalTimeMs = DUEL_TOTAL_TIME_MS;
  state.health = state.maxHealth;
  state.mana = state.maxMana;
  state.score = 0;
  sceneAssets?.player.position.copy(getDuelSpawnPosition(p2pState.role).position);
  if (sceneAssets) {
    sceneAssets.player.rotation.y = getDuelSpawnPosition(p2pState.role).rotationY;
    sceneAssets.playerRig.moveSpeed = 0;
    sceneAssets.playerRig.attackMs = 0;
    sceneAssets.playerRig.castMs = 0;
    sceneAssets.playerRig.rollMs = 0;
    sceneAssets.playerRig.blocking = false;
  }
  ensureRemotePeerAvatar();
  updateCamera();
  syncHud();
}

function finishDuel(result: 'win' | 'lose') {
  if (gameMode !== 'duel' || state.finished) {
    return;
  }

  state.running = false;
  state.finished = true;
  state.finalized = true;
  pursuedRemotePeer = false;
  clearMagicProjectiles();
  void sendP2pMessage({
    type: 'RESULT',
    payload: {
      result,
    },
  });
  if (result === 'win') {
    playCue('victory');
    addScore(1500);
    setOverlay('승리했습니다. 상대를 쓰러뜨렸습니다.');
  } else {
    playCue('defeat');
    setOverlay('패배했습니다. 체력이 모두 소진되었습니다.');
  }
}

function syncHud() {
  if (gameMode === 'duel') {
    const remoteHealth = remotePeerAvatar ? Math.max(0, Math.round(remotePeerAvatar.health)) : 100;
    const remoteMana = remotePeerAvatar ? Math.max(0, Math.round(remotePeerAvatar.mana)) : 80;
    objectiveEl.textContent = 'Dungeon Quest Duel';
    questEl.textContent = p2pState.connected
      ? `상대 HP ${remoteHealth}/100 · Mana ${remoteMana}/80`
      : '상대 연결 대기 중';
    scoreEl.textContent = state.score.toLocaleString();
    timerEl.textContent = formatTime(state.totalTimeMs - state.elapsedMs);
    healthFillEl.style.width = `${(state.health / state.maxHealth) * 100}%`;
    healthLabelEl.textContent = `${Math.max(0, Math.round(state.health))} / ${state.maxHealth}`;
    manaFillEl.style.width = `${(state.mana / state.maxMana) * 100}%`;
    manaLabelEl.textContent = `${Math.max(0, Math.round(state.mana))} / ${state.maxMana}`;
    return;
  }

  const aliveEnemies = enemies.filter((enemy) => enemy.alive).length;
  const stageText = aliveEnemies > 0
    ? `오크 수호자 처치 ${state.enemiesDefeated}/${enemies.length}`
    : !state.chestOpen
      ? '중앙 보물상자를 열어 게이트 열쇠 획득'
      : '북쪽 게이트로 탈출';

  objectiveEl.textContent = `Dungeon Quest`;
  questEl.textContent = `${stageText} · 코인 ${state.coinsCollected}/${coins.length}`;
  scoreEl.textContent = state.score.toLocaleString();
  timerEl.textContent = formatTime(state.totalTimeMs - state.elapsedMs);
  healthFillEl.style.width = `${(state.health / state.maxHealth) * 100}%`;
  healthLabelEl.textContent = `${Math.max(0, Math.round(state.health))} / ${state.maxHealth}`;
  manaFillEl.style.width = `${(state.mana / state.maxMana) * 100}%`;
  manaLabelEl.textContent = `${Math.max(0, Math.round(state.mana))} / ${state.maxMana}`;
}

function getNearestAliveEnemy(range: number) {
  if (!sceneAssets) {
    return null;
  }

  let nearest: EnemyUnit | null = null;
  let bestDistance = range;

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    const distance = enemy.mesh.position.distanceTo(sceneAssets.player.position);
    if (distance >= bestDistance) {
      continue;
    }

    bestDistance = distance;
    nearest = enemy;
  }

  return nearest;
}

function getEnemyAtClient(clientX: number, clientY: number) {
  if (!sceneAssets) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);

  const aliveRoots = enemies.filter((enemy) => enemy.alive).map((enemy) => enemy.mesh);
  if (aliveRoots.length === 0) {
    return null;
  }

  const hits = raycaster.intersectObjects(aliveRoots, true);
  for (const hit of hits) {
    let node: THREE.Object3D | null = hit.object;
    while (node) {
      const matched = enemies.find((enemy) => enemy.alive && enemy.mesh === node);
      if (matched) {
        return matched;
      }
      node = node.parent;
    }
  }

  return null;
}

function getRemotePeerAtClient(clientX: number, clientY: number) {
  if (!remotePeerAvatar) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects([remotePeerAvatar.mesh], true);
  return hits.length > 0 ? remotePeerAvatar : null;
}

function clearPursuedEnemy() {
  pursuedEnemy = null;
}

function setPursuedEnemy(enemy: EnemyUnit | null) {
  pursuedEnemy = enemy && enemy.alive ? enemy : null;
}

function sendDuelSnapshot() {
  if (!sceneAssets || gameMode !== 'duel') {
    return;
  }

  void sendP2pMessage({
    type: 'SNAPSHOT',
    payload: {
      position: toNetVector3(sceneAssets.player.position),
      rotationY: sceneAssets.player.rotation.y,
      health: Math.round(state.health),
      mana: Math.round(state.mana),
      moveSpeed: Number(sceneAssets.playerRig.moveSpeed.toFixed(3)),
      blocking: sceneAssets.playerRig.blocking,
      rolling: sceneAssets.playerRig.rolling,
      finished: state.finished,
      result: state.finished ? (state.health > 0 ? 'win' : 'lose') : null,
    },
  });
}

function attemptPeerAttack() {
  if (!sceneAssets || !remotePeerAvatar || state.finished || state.waitingReward) {
    return false;
  }

  if (state.attackCooldownMs > 0 || sceneAssets.playerRig.rolling) {
    return false;
  }

  state.attackCooldownMs = 540;
  sceneAssets.playerRig.blocking = false;
  sceneAssets.playerRig.attackMs = sceneAssets.playerRig.attackDurationMs;
  playCue('attack');
  spawnEffect(sceneAssets.player.position.clone().add(new THREE.Vector3(0, 0.08, 0)), '#8fd7ff');
  faceDirection(sceneAssets.player, remotePeerAvatar.mesh.position.clone().sub(sceneAssets.player.position));
  void sendP2pMessage({
    type: 'MELEE_SWING',
    payload: {
      rotationY: sceneAssets.player.rotation.y,
    },
  });

  const distance = remotePeerAvatar.mesh.position.distanceTo(sceneAssets.player.position);
  if (distance > 1.42) {
    playCue('miss');
    setOverlay('상대와 거리가 멉니다. 더 가까이 붙으세요.');
    return false;
  }

  remotePeerAvatar.health = Math.max(0, remotePeerAvatar.health - DUEL_MELEE_DAMAGE);
  remotePeerAvatar.rig.hurtMs = 240;
  playCue('hit');
  spawnEffect(remotePeerAvatar.mesh.position, '#ff8d77');
  void sendP2pMessage({
    type: 'DAMAGE',
    payload: {
      amount: DUEL_MELEE_DAMAGE,
      kind: 'melee',
    },
  });
  setOverlay(remotePeerAvatar.health <= 0 ? '상대를 쓰러뜨렸습니다.' : `검격 적중. 상대 체력 ${Math.round(remotePeerAvatar.health)} 남음`);
  if (remotePeerAvatar.health <= 0) {
    finishDuel('win');
  }
  return true;
}

function openChest() {
  if (!sceneAssets || state.chestOpen || enemies.some((enemy) => enemy.alive)) {
    return false;
  }

  if (sceneAssets.player.position.distanceTo(getMapPointVector(dungeonMapConfig.chest)) > 1.22) {
    return false;
  }

  state.chestOpen = true;
  state.gateOpen = true;
  sceneAssets.gate.position.y = 1.05;
  sceneAssets.chest.rotation.y += Math.PI * 0.24;
  sceneAssets.chest.position.y = 0.12;
  addScore(420);
  playCue('chest');
  spawnEffect(getMapPointVector(dungeonMapConfig.chest), '#ffe27a');
  setOverlay('상자를 열었습니다. 북쪽 게이트가 열렸습니다.');
  return true;
}

function finishRun(reason: string, allowRevive: boolean) {
  if (state.finalized) {
    return;
  }

  clearPursuedEnemy();
  state.running = false;
  state.finished = !allowRevive;
  if (reason === 'escaped') {
    playCue('victory');
  } else if (!(allowRevive && state.reviveAvailable)) {
    playCue('defeat');
  }

  submitScore({
    score: state.score,
    playTimeMs: Math.round(state.elapsedMs),
    mode: 'normal',
    metadata: {
      reason,
      reviveAvailable: allowRevive,
      coinsCollected: state.coinsCollected,
      enemiesDefeated: state.enemiesDefeated,
      chestOpened: state.chestOpen,
      gateOpened: state.gateOpen,
    },
  });

  if (allowRevive && state.reviveAvailable) {
    state.waitingReward = true;
    setOverlay('광고 시청을 선택하면 같은 전투 상태에서 1회 부활합니다.');
    requestRewardedAd('REVIVE');
    return;
  }

  state.finalized = true;
  setOverlay(reason === 'escaped' ? '탈출 성공. 점수를 제출했습니다.' : '모험 종료. 점수를 제출했습니다.');
}

function revivePlayer() {
  if (!sceneAssets) {
    return;
  }

  state.waitingReward = false;
  state.finished = false;
  state.running = true;
  state.reviveAvailable = false;
  state.health = 62;
  state.mana = Math.max(32, state.maxMana * 0.5);
  state.attackCooldownMs = 0;
  state.magicCooldownMs = 0;
  state.playerHurtMs = 0;
  state.rollCooldownMs = 0;
  sceneAssets.player.position.copy(getMapPointVector(dungeonMapConfig.playerSpawn));
  sceneAssets.playerRig.attackMs = 0;
  sceneAssets.playerRig.castMs = 0;
  sceneAssets.playerRig.hurtMs = 0;
  sceneAssets.playerRig.rollMs = 0;
  sceneAssets.playerRig.rollRecoverMs = 0;
  sceneAssets.playerRig.blocking = false;
  sceneAssets.playerRig.moveSpeed = 0;
  state.moveTarget = null;
  clearPursuedEnemy();
  clearMagicProjectiles();
  playCue('revive');
  spawnEffect(sceneAssets.player.position, '#7dffb3');
  setOverlay('부활 완료. 상자를 챙기고 게이트로 탈출하세요.');
}

function attemptEnemyAttack(preferredEnemy?: EnemyUnit | null) {
  if (gameMode === 'duel') {
    return attemptPeerAttack();
  }

  if (!sceneAssets || state.finished || state.waitingReward) {
    return false;
  }

  if (state.attackCooldownMs > 0) {
    return false;
  }

  const enemy =
    preferredEnemy && preferredEnemy.alive && preferredEnemy.mesh.position.distanceTo(sceneAssets.player.position) <= 1.42
      ? preferredEnemy
      : getNearestAliveEnemy(1.38);

  state.attackCooldownMs = 540;
  sceneAssets.playerRig.attackMs = sceneAssets.playerRig.attackDurationMs;
  playCue('attack');
  const attackOrigin = sceneAssets.player.position.clone();
  attackOrigin.y = 0.08;
  spawnEffect(attackOrigin, '#8fd7ff');

  if (!enemy) {
    playCue('miss');
    setOverlay('허공을 가르기만 했습니다. 오크에게 더 가까이 붙으세요.');
    return false;
  }

  enemy.hp -= 1;
  enemy.hurtMs = 240;
  playCue(enemy.hp <= 0 ? 'enemy-defeat' : 'hit');
  faceDirection(sceneAssets.player, enemy.mesh.position.clone().sub(sceneAssets.player.position));
  if (enemy.hp <= 0) {
    enemy.alive = false;
    enemy.mesh.visible = false;
    state.enemiesDefeated += 1;
    addScore(enemy.value);
    spawnEffect(enemy.mesh.position, '#ff8d77');
    setOverlay(
      state.enemiesDefeated === enemies.length
        ? '모든 수호자를 처치했습니다. 중앙 보물상자를 여세요.'
        : `수호자를 쓰러뜨렸습니다. 남은 적 ${enemies.length - state.enemiesDefeated}명`,
    );
    if (pursuedEnemy === enemy) {
      clearPursuedEnemy();
    }
    return true;
  }

  addScore(36);
  setOverlay(`오크를 가격했습니다. 남은 체력 ${enemy.hp}/${enemy.maxHp}`);
  return true;
}

function getPlayerFacingDirection() {
  if (!sceneAssets) {
    return null;
  }

  return new THREE.Vector3(
    Math.sin(sceneAssets.player.rotation.y),
    0,
    Math.cos(sceneAssets.player.rotation.y),
  ).normalize();
}

function getManualMoveDirection() {
  const direction = new THREE.Vector3();

  if (keyboard.up) {
    direction.z -= 1;
  }
  if (keyboard.down) {
    direction.z += 1;
  }
  if (keyboard.left) {
    direction.x -= 1;
  }
  if (keyboard.right) {
    direction.x += 1;
  }

  direction.x += virtualJoystickState.x;
  direction.z += virtualJoystickState.y;

  if (direction.lengthSq() > 1) {
    direction.normalize();
  }

  return direction;
}

function getPlayerIntentDirection() {
  if (!sceneAssets) {
    return null;
  }

  const manual = getManualMoveDirection();
  if (manual.lengthSq() > 0.0001) {
    return manual.normalize();
  }

  if (gameMode === 'duel' && pursuedRemotePeer && remotePeerAvatar && !remotePeerAvatar.finished) {
    const direction = remotePeerAvatar.mesh.position.clone().sub(sceneAssets.player.position).setY(0);
    if (direction.lengthSq() > 0.001) {
      return direction.normalize();
    }
  }

  if (pursuedEnemy?.alive) {
    const direction = pursuedEnemy.mesh.position.clone().sub(sceneAssets.player.position).setY(0);
    if (direction.lengthSq() > 0.001) {
      return direction.normalize();
    }
  }

  if (state.moveTarget) {
    const direction = state.moveTarget.clone().sub(sceneAssets.player.position).setY(0);
    if (direction.lengthSq() > 0.001) {
      return direction.normalize();
    }
  }

  return getPlayerFacingDirection();
}

function isPlayerBlockingAgainst(sourcePosition: THREE.Vector3 | null) {
  if (!sceneAssets) {
    return false;
  }

  if (
    !sceneAssets.playerRig.blocking ||
    sceneAssets.playerRig.attacking ||
    sceneAssets.playerRig.rolling ||
    sceneAssets.playerRig.castMs > 0
  ) {
    return false;
  }

  if (!sourcePosition) {
    return true;
  }

  const facing = getPlayerFacingDirection();
  if (!facing) {
    return false;
  }

  const toSource = sourcePosition.clone().sub(sceneAssets.player.position).setY(0);
  if (toSource.lengthSq() <= 0.0001) {
    return true;
  }

  return facing.dot(toSource.normalize()) >= PLAYER_BLOCK_ARC_DOT;
}

function resolveIncomingPlayerDamage(amount: number, kind: 'melee' | 'magic', sourcePosition: THREE.Vector3 | null) {
  if (!sceneAssets || state.finished) {
    return false;
  }

  if (sceneAssets.playerRig.rolling && sceneAssets.playerRig.rollMs >= sceneAssets.playerRig.rollDurationMs * 0.18) {
    playCue('miss');
    spawnEffect(sceneAssets.player.position.clone().add(new THREE.Vector3(0, 0.08, 0)), '#8fd7ff');
    setOverlay(kind === 'magic' ? '구르기로 마법을 회피했습니다.' : '구르기로 공격을 회피했습니다.');
    return false;
  }

  let actualDamage = amount;
  if (isPlayerBlockingAgainst(sourcePosition)) {
    actualDamage = kind === 'magic' ? Math.max(2, Math.round(amount * 0.45)) : 0;
    playCue('miss');
    spawnEffect(sceneAssets.player.position.clone().add(new THREE.Vector3(0, 0.08, 0)), '#cbe7ff');
    if (actualDamage <= 0) {
      setOverlay('칼로 공격을 막아냈습니다.');
      return false;
    }
    setOverlay(`막기 성공. 체력 ${Math.max(0, Math.round(state.health - actualDamage))} 남음`);
  }

  state.health = Math.max(0, state.health - actualDamage);
  state.playerHurtMs = 240;
  sceneAssets.playerRig.hurtMs = 240;
  playCue(kind === 'magic' ? 'magic-hit' : 'hurt');
  spawnEffect(sceneAssets.player.position, kind === 'magic' ? '#7ae2ff' : '#ff7d8a');
  return actualDamage > 0;
}

function attemptRoll() {
  if (!sceneAssets || state.finished || state.waitingReward) {
    return false;
  }

  if (!sceneAssets.playerRig.actions.roll) {
    setOverlay('구르기 애니메이션을 아직 불러오지 못했습니다.');
    return false;
  }

  if (
    state.rollCooldownMs > 0 ||
    sceneAssets.playerRig.rolling ||
    sceneAssets.playerRig.attacking ||
    sceneAssets.playerRig.attackMs > 0 ||
    sceneAssets.playerRig.castMs > 0
  ) {
    return false;
  }

  const direction = getPlayerIntentDirection();
  if (!direction || direction.lengthSq() <= 0.0001) {
    setOverlay('구르려면 이동 방향을 먼저 입력하세요.');
    return false;
  }

  markStarted();
  state.rollCooldownMs = PLAYER_ROLL_COOLDOWN_MS;
  state.moveTarget = null;
  clearPursuedEnemy();
  pursuedRemotePeer = false;
  sceneAssets.playerRig.rollMs = sceneAssets.playerRig.rollDurationMs;
  sceneAssets.playerRig.blocking = false;
  faceDirection(sceneAssets.player, direction);
  playCue('miss');
  setOverlay('구르기로 회피합니다.');
  return true;
}

function getMagicDirection() {
  if (!sceneAssets) {
    return null;
  }

  return new THREE.Vector3(
    Math.sin(sceneAssets.player.rotation.y),
    0.08,
    Math.cos(sceneAssets.player.rotation.y),
  ).normalize();
}

function castLeftHandMagic() {
  if (!sceneAssets || state.finished || state.waitingReward) {
    return false;
  }

  markStarted();

  if (state.magicCooldownMs > 0 || sceneAssets.playerRig.rolling) {
    return false;
  }

  const manaCost = 24;
  if (state.mana < manaCost) {
    playCue('mana-empty');
    setOverlay('마나가 부족합니다. 잠시 기다리면 다시 회복됩니다.');
    return false;
  }

  const direction = getMagicDirection();
  if (!direction) {
    return false;
  }

  faceDirection(sceneAssets.player, new THREE.Vector3(direction.x, 0, direction.z));
  state.mana = Math.max(0, state.mana - manaCost);
  state.magicCooldownMs = 420;
  sceneAssets.playerRig.blocking = false;
  sceneAssets.playerRig.castMs = sceneAssets.playerRig.castDurationMs;
  playCue('magic-cast');
  const origin = getPlayerCastOrigin();
  spawnMagicProjectile(direction, 'local', origin ?? undefined);
  if (gameMode === 'duel' && origin) {
    void sendP2pMessage({
      type: 'MAGIC_CAST',
      payload: {
        origin: toNetVector3(origin),
        direction: toNetVector3(direction),
      },
    });
  }
  runtimeMagicFlash(sceneAssets.player.position);
  setOverlay('왼손 마법탄을 발사했습니다.');
  return true;
}

function runtimeMagicFlash(position: THREE.Vector3) {
  spawnEffect(position.clone().add(new THREE.Vector3(0, 0.22, 0)), '#7ae2ff');
}

function attemptAction() {
  if (!sceneAssets || state.finished || state.waitingReward) {
    return;
  }

  if (sceneAssets.playerRig.rolling) {
    return;
  }

  markStarted();

  if (gameMode === 'duel') {
    attemptPeerAttack();
    return;
  }

  if (openChest()) {
    return;
  }

  attemptEnemyAttack();
}

function triggerMovementFromPointer(clientX: number, clientY: number) {
  const destination = getGroundPointFromClient(clientX, clientY);
  if (!destination) {
    return;
  }

  clampToRoom(destination, PLAYER_RADIUS);
  state.moveTarget = destination;
  clearPursuedEnemy();
  pursuedRemotePeer = false;
  markStarted();
}

function moveCharacterWithCollision(
  current: THREE.Vector3,
  desiredDirection: THREE.Vector3,
  speed: number,
  deltaSeconds: number,
  radius: number,
) {
  const next = current.clone().addScaledVector(desiredDirection, speed * deltaSeconds);
  applyObstacleCollisions(next, radius);
  return next;
}

function getRollTravelProgress(progress: number) {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  const normalized = THREE.MathUtils.clamp(clamped / PLAYER_ROLL_MOVE_PHASE, 0, 1);
  return 1 - (1 - normalized) * (1 - normalized);
}

function updatePlayer(deltaMs: number) {
  if (!sceneAssets) {
    return;
  }

  const deltaSeconds = deltaMs / 1000;
  const previousPosition = sceneAssets.player.position.clone();
  const moveDirection = new THREE.Vector3();
  const attackRange = 1.24;
  const manualMoveDirection = getManualMoveDirection();

  if (sceneAssets.playerRig.rolling) {
    const currentProgress = THREE.MathUtils.clamp(
      1 - sceneAssets.playerRig.rollMs / Math.max(1, sceneAssets.playerRig.rollDurationMs),
      0,
      1,
    );
    const nextProgress = THREE.MathUtils.clamp(
      1 - Math.max(sceneAssets.playerRig.rollMs - deltaMs, 0) / Math.max(1, sceneAssets.playerRig.rollDurationMs),
      0,
      1,
    );
    const travelDelta =
      (getRollTravelProgress(nextProgress) - getRollTravelProgress(currentProgress)) * PLAYER_ROLL_DISTANCE;
    if (travelDelta > 0.0001) {
      const facing = new THREE.Vector3(
        Math.sin(sceneAssets.player.rotation.y),
        0,
        Math.cos(sceneAssets.player.rotation.y),
      ).normalize();
      const nextPosition = moveCharacterWithCollision(
        sceneAssets.player.position,
        facing,
        travelDelta / Math.max(deltaSeconds, 0.0001),
        deltaSeconds,
        PLAYER_RADIUS,
      );
      sceneAssets.player.position.copy(nextPosition);
    }
    moveDirection.set(0, 0, 0);
  } else if (manualMoveDirection.lengthSq() > 0) {
    moveDirection.copy(manualMoveDirection.normalize());
    state.moveTarget = null;
    clearPursuedEnemy();
    pursuedRemotePeer = false;
  } else if (!keyboard.block && gameMode === 'duel' && pursuedRemotePeer && remotePeerAvatar && !remotePeerAvatar.finished) {
    moveDirection.subVectors(remotePeerAvatar.mesh.position, sceneAssets.player.position);
    moveDirection.y = 0;
    const targetDistance = moveDirection.length();
    if (targetDistance <= attackRange) {
      moveDirection.set(0, 0, 0);
      state.moveTarget = null;
      faceDirection(sceneAssets.player, remotePeerAvatar.mesh.position.clone().sub(sceneAssets.player.position));
      if (!state.finished && !state.waitingReward && state.attackCooldownMs <= 0) {
        attemptPeerAttack();
      }
    } else if (targetDistance > 0.001) {
      moveDirection.normalize();
      state.moveTarget = null;
    }
  } else if (!keyboard.block && pursuedEnemy) {
    if (!pursuedEnemy.alive) {
      clearPursuedEnemy();
    } else {
      moveDirection.subVectors(pursuedEnemy.mesh.position, sceneAssets.player.position);
      moveDirection.y = 0;
      const targetDistance = moveDirection.length();
      if (targetDistance <= attackRange) {
        moveDirection.set(0, 0, 0);
        state.moveTarget = null;
        faceDirection(sceneAssets.player, pursuedEnemy.mesh.position.clone().sub(sceneAssets.player.position));
        if (!state.finished && !state.waitingReward && state.attackCooldownMs <= 0) {
          attemptEnemyAttack(pursuedEnemy);
        }
      } else if (targetDistance > 0.001) {
        moveDirection.normalize();
        state.moveTarget = null;
      }
    }
  } else if (!keyboard.block && state.moveTarget) {
    moveDirection.subVectors(state.moveTarget, sceneAssets.player.position);
    moveDirection.y = 0;
    if (moveDirection.lengthSq() < 0.04) {
      state.moveTarget = null;
      moveDirection.set(0, 0, 0);
    } else {
      moveDirection.normalize();
    }
  }

  sceneAssets.playerRig.blocking =
    keyboard.block &&
    !sceneAssets.playerRig.rolling &&
    !sceneAssets.playerRig.attacking &&
    sceneAssets.playerRig.attackMs <= 0 &&
    sceneAssets.playerRig.castMs <= 0 &&
    !state.finished &&
    !state.waitingReward;

  if (moveDirection.lengthSq() > 0) {
    const moveSpeed = sceneAssets.playerRig.blocking ? PLAYER_BLOCK_SPEED : PLAYER_MOVE_SPEED;
    const nextPosition = moveCharacterWithCollision(sceneAssets.player.position, moveDirection, moveSpeed, deltaSeconds, PLAYER_RADIUS);
    sceneAssets.player.position.copy(nextPosition);
    faceDirection(sceneAssets.player, moveDirection);
  }

  const movedDistance = previousPosition.distanceTo(sceneAssets.player.position);
  sceneAssets.playerRig.moveSpeed = movedDistance > 0 ? movedDistance / Math.max(deltaSeconds, 0.0001) : 0;
  sceneAssets.player.position.y = 0;
}

function updateEnemies(deltaMs: number) {
  if (!sceneAssets) {
    return;
  }

  const deltaSeconds = deltaMs / 1000;
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    enemy.attackCooldownMs = Math.max(0, enemy.attackCooldownMs - deltaMs);
    enemy.hurtMs = Math.max(0, enemy.hurtMs - deltaMs);

    const toPlayer = sceneAssets.player.position.clone().sub(enemy.mesh.position);
    const planarDistance = Math.hypot(toPlayer.x, toPlayer.z);

    let desiredDirection = new THREE.Vector3();
    if (planarDistance < 4.8) {
      desiredDirection.copy(toPlayer).setY(0);
      if (desiredDirection.lengthSq() > 0) {
        desiredDirection.normalize();
      }
    } else {
      const toHome = enemy.home.clone().sub(enemy.mesh.position);
      if (toHome.lengthSq() > 0.09) {
        desiredDirection.copy(toHome).setY(0).normalize();
      }
    }

    if (desiredDirection.lengthSq() > 0 && planarDistance > 1.15) {
      const previousPosition = enemy.mesh.position.clone();
      const nextPosition = moveCharacterWithCollision(enemy.mesh.position, desiredDirection, enemy.speed, deltaSeconds, ENEMY_RADIUS);
      enemy.mesh.position.copy(nextPosition);
      faceDirection(enemy.mesh, desiredDirection);
      enemy.rig.moveSpeed = previousPosition.distanceTo(nextPosition) / Math.max(deltaSeconds, 0.0001);
    } else {
      enemy.rig.moveSpeed = 0;
    }

    enemy.mesh.position.y = 0;

    if (planarDistance <= 1.18 && enemy.attackCooldownMs <= 0) {
      enemy.attackCooldownMs = 1200;
      enemy.rig.attackMs = enemy.rig.attackDurationMs;
      const applied = resolveIncomingPlayerDamage(15, 'melee', enemy.mesh.position);
      if (!applied) {
        continue;
      }
      setOverlay(`오크의 공격을 맞았습니다. 체력 ${Math.round(state.health)} 남음`);

      if (state.health <= 0) {
        finishRun('defeated', state.reviveAvailable);
        return;
      }
    }
  }
}

function updateCharacterAnimation(deltaMs: number) {
  if (!sceneAssets) {
    return;
  }

  updateRigAnimation(sceneAssets.playerRig, deltaMs, {
    baseMoveSpeed: sceneAssets.playerRig.moveSpeed,
  });

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    enemy.rig.hurtMs = Math.max(enemy.rig.hurtMs, enemy.hurtMs);
    updateRigAnimation(enemy.rig, deltaMs, {
      baseMoveSpeed: enemy.rig.moveSpeed,
      aggressive: true,
    });
  }

  if (remotePeerAvatar) {
    updateRigAnimation(remotePeerAvatar.rig, deltaMs, {
      baseMoveSpeed: remotePeerAvatar.moveSpeed,
    });
    remotePeerAvatar.mesh.position.lerp(remotePeerAvatar.targetPosition, Math.min(1, (deltaMs / 1000) * 12));
    remotePeerAvatar.mesh.rotation.y = THREE.MathUtils.lerp(
      remotePeerAvatar.mesh.rotation.y,
      remotePeerAvatar.targetRotationY,
      Math.min(1, (deltaMs / 1000) * 14),
    );
  }
}

function updateVirtualJoystickUi() {
  virtualJoystick.dataset.active = virtualJoystickState.active ? 'true' : 'false';
  virtualJoystickThumb.style.transform = `translate(${virtualJoystickState.x * 28}px, ${virtualJoystickState.y * 28}px)`;
}

function resetVirtualJoystick() {
  virtualJoystickState.active = false;
  virtualJoystickState.pointerId = null;
  virtualJoystickState.x = 0;
  virtualJoystickState.y = 0;
  updateVirtualJoystickUi();
}

function updateVirtualJoystickFromPointer(clientX: number, clientY: number) {
  const rect = virtualJoystick.getBoundingClientRect();
  const centerX = rect.left + rect.width * 0.5;
  const centerY = rect.top + rect.height * 0.5;
  const radius = Math.max(24, Math.min(rect.width, rect.height) * 0.32);
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const scale = distance > radius ? radius / Math.max(distance, 0.0001) : 1;
  virtualJoystickState.x = THREE.MathUtils.clamp((dx * scale) / radius, -1, 1);
  virtualJoystickState.y = THREE.MathUtils.clamp((dy * scale) / radius, -1, 1);
  updateVirtualJoystickUi();
}

function setBlockInput(active: boolean) {
  keyboard.block = active;
  blockButton.dataset.active = active ? 'true' : 'false';
}

function updateCoins(deltaMs: number) {
  if (!sceneAssets) {
    return;
  }

  const elapsedSeconds = state.elapsedMs / 1000;
  for (const coin of coins) {
    if (coin.collected) {
      continue;
    }

    coin.mesh.rotation.y += (deltaMs / 1000) * 2.4;
    coin.mesh.position.y = coin.baseY + Math.sin(elapsedSeconds * 4 + coin.pulseOffset) * 0.07;

    if (coin.mesh.position.distanceTo(sceneAssets.player.position) <= 0.72) {
      coin.collected = true;
      coin.mesh.visible = false;
      state.coinsCollected += 1;
      addScore(coin.value);
      playCue('coin');
      spawnEffect(coin.mesh.position, '#ffe27a');
      setOverlay(`코인을 회수했습니다. ${state.coinsCollected}/${coins.length}`);
    }
  }
}

function updateMagic(deltaMs: number) {
  if (!sceneAssets) {
    return;
  }

  const deltaSeconds = deltaMs / 1000;
  for (let index = magicProjectiles.length - 1; index >= 0; index -= 1) {
    const projectile = magicProjectiles[index];
    projectile.remainingMs -= deltaMs;
    projectile.mesh.position.addScaledVector(projectile.velocity, deltaSeconds);
    projectile.mesh.rotation.y += deltaSeconds * 6;
    projectile.mesh.position.y += Math.sin((state.elapsedMs + index * 90) * 0.02) * 0.002;

    let consumed = projectile.remainingMs <= 0;

    if (!consumed) {
      const position = projectile.mesh.position;
      const blockedByRoom =
        position.x < ROOM_BOUNDS.minX - 0.4 ||
        position.x > ROOM_BOUNDS.maxX + 0.4 ||
        position.z < ROOM_BOUNDS.minZOpen - 0.4 ||
        position.z > ROOM_BOUNDS.maxZ + 0.4;

      const blockedByObstacle = obstacles.some((obstacle) => {
        const distance = Math.hypot(position.x - obstacle.x, position.z - obstacle.z);
        return distance <= obstacle.radius + projectile.radius * 0.72;
      });

      consumed = blockedByRoom || blockedByObstacle;
    }

    if (!consumed) {
      if (gameMode === 'duel') {
        if (projectile.owner === 'local' && remotePeerAvatar && !remotePeerAvatar.finished) {
          const distance = remotePeerAvatar.mesh.position.distanceTo(projectile.mesh.position);
          if (distance <= projectile.radius + PLAYER_RADIUS + 0.18) {
            consumed = true;
            remotePeerAvatar.health = Math.max(0, remotePeerAvatar.health - projectile.damage);
            remotePeerAvatar.rig.hurtMs = 260;
            playCue('magic-hit');
            spawnEffect(projectile.mesh.position.clone(), '#7ae2ff');
            void sendP2pMessage({
              type: 'DAMAGE',
              payload: {
                amount: projectile.damage,
                kind: 'magic',
              },
            });
            setOverlay(remotePeerAvatar.health <= 0 ? '마법으로 상대를 쓰러뜨렸습니다.' : `마법 적중. 상대 체력 ${Math.round(remotePeerAvatar.health)} 남음`);
            if (remotePeerAvatar.health <= 0) {
              finishDuel('win');
            }
          }
        } else if (projectile.owner === 'remote') {
          const distance = sceneAssets.player.position.distanceTo(projectile.mesh.position);
          if (distance <= projectile.radius + PLAYER_RADIUS + 0.14) {
            consumed = true;
            spawnEffect(projectile.mesh.position.clone(), '#7ae2ff');
          }
        }
      } else {
        for (const enemy of enemies) {
          if (!enemy.alive) {
            continue;
          }

          const distance = enemy.mesh.position.distanceTo(projectile.mesh.position);
          if (distance > projectile.radius + ENEMY_RADIUS + 0.18) {
            continue;
          }

          consumed = true;
          enemy.hp -= projectile.damage;
          enemy.hurtMs = 260;
          playCue(enemy.hp <= 0 ? 'enemy-defeat' : 'magic-hit');
          spawnEffect(projectile.mesh.position.clone(), '#7ae2ff');

          if (enemy.hp <= 0) {
            enemy.alive = false;
            enemy.mesh.visible = false;
            state.enemiesDefeated += 1;
            addScore(enemy.value);
            if (pursuedEnemy === enemy) {
              clearPursuedEnemy();
            }
            setOverlay(
              state.enemiesDefeated === enemies.length
                ? '마법으로 마지막 수호자를 쓰러뜨렸습니다. 중앙 보물상자를 여세요.'
                : `마법이 적중했습니다. 남은 적 ${enemies.length - state.enemiesDefeated}명`,
            );
          } else {
            addScore(28);
            setOverlay(`마법탄 적중. 남은 체력 ${enemy.hp}/${enemy.maxHp}`);
          }

          break;
        }
      }
    }

    if (!consumed) {
      continue;
    }

    scene.remove(projectile.mesh);
    projectile.mesh.geometry.dispose();
    if (projectile.mesh.material instanceof THREE.Material) {
      projectile.mesh.material.dispose();
    }
    magicProjectiles.splice(index, 1);
  }
}

function updateEffects(deltaMs: number) {
  for (let index = effects.length - 1; index >= 0; index -= 1) {
    const effect = effects[index];
    effect.remainingMs -= deltaMs;

    const progress = 1 - effect.remainingMs / effect.maxLifeMs;
    effect.mesh.scale.setScalar(1 + progress * 0.8);

    const material = effect.mesh.material;
    if (material instanceof THREE.MeshBasicMaterial) {
      material.opacity = Math.max(0, 0.85 - progress * 0.85);
    }

    if (effect.remainingMs > 0) {
      continue;
    }

    scene.remove(effect.mesh);
    effect.mesh.geometry.dispose();
    if (effect.mesh.material instanceof THREE.Material) {
      effect.mesh.material.dispose();
    }
    effects.splice(index, 1);
  }
}

function updateChestAndGate(deltaMs: number) {
  if (!sceneAssets || gameMode === 'duel') {
    return;
  }

  sceneAssets.chest.rotation.y += deltaMs * 0.00018;
  sceneAssets.exitStairs.position.y = Math.sin(state.elapsedMs * 0.0016) * 0.04;

  if (state.chestOpen && sceneAssets.player.position.distanceTo(getMapPointVector(dungeonMapConfig.exit)) <= 0.9) {
    addScore(1000 + Math.max(0, Math.round((state.totalTimeMs - state.elapsedMs) / 150)));
    finishRun('escaped', false);
  }
}

function updateCamera() {
  if (!sceneAssets) {
    return;
  }

  const target = sceneAssets.player.position.clone().add(viewportState.cameraLookOffset);
  const desired = target.clone().add(viewportState.cameraOffset);
  camera.position.lerp(desired, 0.08);
  camera.lookAt(target);
}

function renderScene() {
  renderer.render(scene, camera);
}

function gameLoop() {
  const deltaMs = Math.min(33, clock.getDelta() * 1000);

  if (sceneAssets) {
    if (state.running) {
      state.elapsedMs += deltaMs;
      state.attackCooldownMs = Math.max(0, state.attackCooldownMs - deltaMs);
      state.magicCooldownMs = Math.max(0, state.magicCooldownMs - deltaMs);
      state.rollCooldownMs = Math.max(0, state.rollCooldownMs - deltaMs);
      state.playerHurtMs = Math.max(0, state.playerHurtMs - deltaMs);
      state.mana = Math.min(state.maxMana, state.mana + (deltaMs / 1000) * 14);

      updatePlayer(deltaMs);
      if (gameMode === 'solo') {
        updateEnemies(deltaMs);
        updateCoins(deltaMs);
      }
      updateMagic(deltaMs);
      updateChestAndGate(deltaMs);

      if (gameMode === 'duel') {
        p2pState.snapshotAccumulatorMs += deltaMs;
        if (p2pState.snapshotAccumulatorMs >= P2P_SNAPSHOT_INTERVAL_MS) {
          p2pState.snapshotAccumulatorMs = 0;
          sendDuelSnapshot();
        }
      }

      if (state.elapsedMs >= state.totalTimeMs && !state.finalized) {
        if (gameMode === 'duel') {
          finishDuel(state.health >= (remotePeerAvatar?.health ?? 0) ? 'win' : 'lose');
        } else {
          finishRun('timer', false);
        }
      }
    }

    updateEffects(deltaMs);
    updateCharacterAnimation(deltaMs);
    updateAudio();
    updateCamera();
    syncHud();
    renderScene();
  }

  requestAnimationFrame(gameLoop);
}

function onPointerDown(event: PointerEvent) {
  void unlockAudio();

  if (utilityMenuOpen && !isMenuTarget(event.target)) {
    setUtilityMenuOpen(false);
  }

  if (
    event.target === attackButton ||
    event.target === magicButton ||
    event.target === mobileAttackButton ||
    event.target === mobileMagicButton ||
    event.target === dodgeButton ||
    event.target === blockButton ||
    event.target === soundToggleButton ||
    isMenuTarget(event.target) ||
    isVirtualControlTarget(event.target) ||
    isP2pTarget(event.target) ||
    isEditorTarget(event.target)
  ) {
    return;
  }

  if (isMapEditorActive()) {
    const groundPoint = getGroundPointFromClient(event.clientX, event.clientY);
    syncMapHoverFromWorldPoint(groundPoint);
    if (groundPoint) {
      event.preventDefault();
      applyMapToolAtPoint(groundPoint, event.button === 2);
    }
    return;
  }

  if (state.finished || state.waitingReward) {
    return;
  }

  if (gameMode === 'duel') {
    const tappedPeer = getRemotePeerAtClient(event.clientX, event.clientY);
    if (tappedPeer) {
      event.preventDefault();
      pursuedRemotePeer = true;
      state.moveTarget = null;
      markStarted();
      if (sceneAssets) {
        faceDirection(sceneAssets.player, tappedPeer.mesh.position.clone().sub(sceneAssets.player.position));
      }
      if (sceneAssets && tappedPeer.mesh.position.distanceTo(sceneAssets.player.position) <= 1.32) {
        attemptPeerAttack();
      } else {
        setOverlay('상대를 추적합니다. 사거리 안으로 들어가면 자동으로 근접 공격합니다.');
      }
      return;
    }
  }

  const tappedEnemy = getEnemyAtClient(event.clientX, event.clientY);
  if (tappedEnemy) {
    event.preventDefault();
    setPursuedEnemy(tappedEnemy);
    state.moveTarget = null;
    markStarted();
    if (sceneAssets) {
      faceDirection(sceneAssets.player, tappedEnemy.mesh.position.clone().sub(sceneAssets.player.position));
    }
    if (sceneAssets && tappedEnemy.mesh.position.distanceTo(sceneAssets.player.position) <= 1.32) {
      attemptEnemyAttack(tappedEnemy);
    } else {
      setOverlay('적을 추적합니다. 사거리 안으로 들어가면 자동 공격합니다.');
    }
    return;
  }

  triggerMovementFromPointer(event.clientX, event.clientY);
}

function onPointerMove(event: PointerEvent) {
  if (
    !isMapEditorActive() ||
    isEditorTarget(event.target) ||
    isP2pTarget(event.target) ||
    isVirtualControlTarget(event.target) ||
    isMenuTarget(event.target)
  ) {
    return;
  }

  syncMapHoverFromWorldPoint(getGroundPointFromClient(event.clientX, event.clientY));
}

function onTouchMove(event: TouchEvent) {
  void unlockAudio();

  if (isEditorTarget(event.target) || isP2pTarget(event.target) || isVirtualControlTarget(event.target) || isMenuTarget(event.target)) {
    return;
  }

  const touch = event.touches[0];
  if (!touch) {
    return;
  }

  if (isMapEditorActive()) {
    syncMapHoverFromWorldPoint(getGroundPointFromClient(touch.clientX, touch.clientY));
    return;
  }

  if (state.finished || state.waitingReward) {
    return;
  }

  triggerMovementFromPointer(touch.clientX, touch.clientY);
}

function onContextMenu(event: MouseEvent) {
  if (isMenuTarget(event.target)) {
    return;
  }

  if (!isMapEditorActive() || isP2pTarget(event.target)) {
    return;
  }

  event.preventDefault();
}

function onKeyDown(event: KeyboardEvent) {
  void unlockAudio();

  if (isFormFieldTarget(event.target)) {
    return;
  }

  if (event.code === 'Escape' && utilityMenuOpen) {
    event.preventDefault();
    setUtilityMenuOpen(false);
    return;
  }

  if (event.code === 'KeyE' && event.shiftKey) {
    event.preventDefault();
    editorVisible = !editorVisible;
    syncEditorVisibility();
    return;
  }

  if (event.code === 'KeyM' && event.shiftKey) {
    event.preventDefault();
    editorVisible = true;
    currentEditorMode = 'map';
    currentHoverPoint = null;
    editorModeEl.value = currentEditorMode;
    renderEditorPresetOptions();
    renderEditorControls();
    syncEditorVisibility();
    return;
  }

  if (isMapEditorActive()) {
    if (event.code === 'KeyR') {
      event.preventDefault();
      rotateMapTool(1);
      updateEditorCursor();
    } else if (event.code === 'KeyF') {
      event.preventDefault();
      rotateMapTool(-1);
      updateEditorCursor();
    }
    return;
  }

  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      keyboard.up = true;
      clearPursuedEnemy();
      pursuedRemotePeer = false;
      markStarted();
      break;
    case 'ArrowDown':
    case 'KeyS':
      keyboard.down = true;
      clearPursuedEnemy();
      pursuedRemotePeer = false;
      markStarted();
      break;
    case 'ArrowLeft':
    case 'KeyA':
      keyboard.left = true;
      clearPursuedEnemy();
      pursuedRemotePeer = false;
      markStarted();
      break;
    case 'ArrowRight':
    case 'KeyD':
      keyboard.right = true;
      clearPursuedEnemy();
      pursuedRemotePeer = false;
      markStarted();
      break;
    case 'Space':
    case 'Enter':
    case 'KeyJ':
      event.preventDefault();
      attemptAction();
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      event.preventDefault();
      castLeftHandMagic();
      break;
    case 'KeyC':
      event.preventDefault();
      void attemptRoll();
      break;
    case 'KeyF':
      setBlockInput(true);
      markStarted();
      break;
    default:
      break;
  }
}

function onKeyUp(event: KeyboardEvent) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      keyboard.up = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      keyboard.down = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      keyboard.left = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keyboard.right = false;
      break;
    case 'KeyF':
      setBlockInput(false);
      break;
    default:
      break;
  }
}

function mountEvents() {
  mountEditorUi();
  syncSoundToggleUi();
  syncP2pUi();
  startLobbyRefreshLoop();
  resizeRenderer();
  window.addEventListener('resize', resizeRenderer);
  window.addEventListener('orientationchange', resizeRenderer);
  visualViewport?.addEventListener('resize', resizeRenderer);
  visualViewport?.addEventListener('scroll', resizeRenderer);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  for (const eventName of ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend', 'mousedown', 'mouseup'] as const) {
    utilityMenu.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  }
  menuToggleButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setUtilityMenuOpen(!utilityMenuOpen);
  });
  menuMatchButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleP2pPanelVisibility();
    setUtilityMenuOpen(false);
  });
  soundToggleButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void unlockAudio();
    toggleSound();
    setUtilityMenuOpen(false);
  });
  const bindInstantActionButton = (button: HTMLButtonElement, action: () => void) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void unlockAudio();
      if (isMapEditorActive()) {
        return;
      }
      action();
    });
  };
  bindInstantActionButton(magicButton, () => {
    castLeftHandMagic();
  });
  bindInstantActionButton(attackButton, () => {
    attemptAction();
  });
  bindInstantActionButton(mobileMagicButton, () => {
    castLeftHandMagic();
  });
  bindInstantActionButton(mobileAttackButton, () => {
    attemptAction();
  });
  bindInstantActionButton(dodgeButton, () => {
    void attemptRoll();
  });
  const releaseBlock = () => {
    setBlockInput(false);
  };
  blockButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void unlockAudio();
    if (isMapEditorActive()) {
      return;
    }
    setBlockInput(true);
    markStarted();
    blockButton.setPointerCapture?.(event.pointerId);
  });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    blockButton.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      releaseBlock();
    });
  }
  for (const eventName of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click', 'touchstart', 'touchend', 'mousedown', 'mouseup'] as const) {
    virtualJoystick.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  }
  virtualJoystick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    void unlockAudio();
    if (isMapEditorActive()) {
      return;
    }
    virtualJoystickState.active = true;
    virtualJoystickState.pointerId = event.pointerId;
    updateVirtualJoystickFromPointer(event.clientX, event.clientY);
    virtualJoystick.setPointerCapture?.(event.pointerId);
    markStarted();
  });
  virtualJoystick.addEventListener('pointermove', (event) => {
    if (!virtualJoystickState.active || virtualJoystickState.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    updateVirtualJoystickFromPointer(event.clientX, event.clientY);
  });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    virtualJoystick.addEventListener(eventName, (event) => {
      if ('pointerId' in event && virtualJoystickState.pointerId !== null && event.pointerId !== virtualJoystickState.pointerId) {
        return;
      }
      resetVirtualJoystick();
    });
  }
  for (const eventName of ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend', 'mousedown', 'mouseup'] as const) {
    p2pPanelEl.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  }
  p2pToggleEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setP2pCollapsed(!p2pState.collapsed);
  });
  p2pHostButtonEl.addEventListener('pointerdown', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      void unlockAudio();
      await createHostRoom();
      setP2pCollapsed(false);
      setOverlay('방 대기실을 만들었습니다. 참가자를 기다립니다.');
    } catch {
      setP2pStatus('error', '방 생성에 실패했습니다. 다시 시도하세요.');
      syncP2pUi();
      setOverlay('방 생성에 실패했습니다.');
    }
  });
  p2pJoinButtonEl.addEventListener('pointerdown', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      void unlockAudio();
      await joinSelectedRoom();
      setP2pCollapsed(false);
      setOverlay('선택한 방에 참가 요청을 보냈습니다. 연결을 기다립니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setP2pStatus('error', message || '방 참가에 실패했습니다. 이미 가득 찼거나 사라졌을 수 있습니다.');
      syncP2pUi();
      setOverlay(message || '방 참가에 실패했습니다.');
    }
  });
  p2pRefreshButtonEl.addEventListener('pointerdown', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await refreshLobby(true);
    } catch {
      setOverlay('로비 새로고침에 실패했습니다.');
    }
  });
  p2pCopyInviteButtonEl.addEventListener('pointerdown', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await copyInviteLink();
  });
  p2pDisconnectButtonEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    disconnectP2P(true);
  });
}

async function handleJoinRoomRequest(roomId: string) {
  if (!roomId || p2pState.roomId === roomId) {
    return;
  }

  try {
    await joinRoomById(roomId);
    setOverlay('공유 링크의 방에 참가를 요청했습니다. 연결을 기다립니다.');
  } catch (error) {
    const message = error instanceof Error ? error.message : '공유 링크로 방에 참가하지 못했습니다.';
    setP2pStatus('error', message);
    syncP2pUi();
    setOverlay(message);
    notifyMultiplayerRoomCleared();
  }
}

function bindHostMessages() {
  onHostMessage((event) => {
    if (event.data.type === 'REWARD_GRANTED') {
      revivePlayer();
      return;
    }

    if (event.data.type === 'REWARD_CANCELED') {
      state.waitingReward = false;
      state.finished = true;
      state.finalized = true;
      playCue('defeat');
      setOverlay('부활 없이 모험을 종료했습니다.');
      return;
    }

    if (event.data.type === 'MULTIPLAYER_JOIN_ROOM') {
      void handleJoinRoomRequest(event.data.payload.roomId);
    }
  });
}

async function initialize() {
  attackButton.disabled = true;
  magicButton.disabled = true;
  mobileAttackButton.disabled = true;
  mobileMagicButton.disabled = true;
  dodgeButton.disabled = true;
  blockButton.disabled = true;
  syncSoundToggleUi();
  syncP2pUi();
  setOverlay('던전 에셋과 씬을 준비하는 중입니다...');
  await loadTemplates();
  createSceneAssets();
  resetState();
  resizeRenderer();
  updateCamera();
  syncHud();
  attackButton.disabled = false;
  magicButton.disabled = false;
  mobileAttackButton.disabled = false;
  mobileMagicButton.disabled = false;
  dodgeButton.disabled = false;
  blockButton.disabled = false;
  bindHostMessages();
  mountEvents();
  await refreshLobby(false);
  notifyReady();
  gameLoop();
}

void initialize();
