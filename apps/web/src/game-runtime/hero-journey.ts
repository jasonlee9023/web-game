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
const menuNoteNode = document.querySelector<HTMLElement>('#menu-note');
const languageSelectNode = document.querySelector<HTMLSelectElement>('#language-select');
const languageSelectLabelNode = document.querySelector<HTMLElement>('#language-select-label');
const menuMatchButtonNode = document.querySelector<HTMLButtonElement>('#menu-match-button');
const soundToggleNode = document.querySelector<HTMLButtonElement>('#sound-toggle');
const objectiveNode = document.querySelector<HTMLElement>('#objective-text');
const questNode = document.querySelector<HTMLElement>('#quest-text');
const statusNode = document.querySelector<HTMLElement>('#status-text');
const duelResultPanelNode = document.querySelector<HTMLElement>('#duel-result-panel');
const duelResultBadgeNode = document.querySelector<HTMLElement>('#duel-result-badge');
const duelResultTitleNode = document.querySelector<HTMLElement>('#duel-result-title');
const duelResultSummaryNode = document.querySelector<HTMLElement>('#duel-result-summary');
const duelRematchButtonNode = document.querySelector<HTMLButtonElement>('#duel-rematch-button');
const duelLobbyButtonNode = document.querySelector<HTMLButtonElement>('#duel-lobby-button');
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
const p2pRematchButtonNode = document.querySelector<HTMLButtonElement>('#p2p-rematch-button');
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
  !menuNoteNode ||
  !languageSelectNode ||
  !languageSelectLabelNode ||
  !menuMatchButtonNode ||
  !soundToggleNode ||
  !objectiveNode ||
  !questNode ||
  !statusNode ||
  !duelResultPanelNode ||
  !duelResultBadgeNode ||
  !duelResultTitleNode ||
  !duelResultSummaryNode ||
  !duelRematchButtonNode ||
  !duelLobbyButtonNode ||
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
  !p2pRematchButtonNode ||
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
  throw new Error('Hero Journey UI shell is incomplete');
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
const menuNoteEl = menuNoteNode;
const languageSelectEl = languageSelectNode;
const languageSelectLabelEl = languageSelectLabelNode;
const menuMatchButton = menuMatchButtonNode;
const soundToggleButton = soundToggleNode;
const objectiveEl = objectiveNode;
const questEl = questNode;
const statusEl = statusNode;
const duelResultPanelEl = duelResultPanelNode;
const duelResultBadgeEl = duelResultBadgeNode;
const duelResultTitleEl = duelResultTitleNode;
const duelResultSummaryEl = duelResultSummaryNode;
const duelRematchButtonEl = duelRematchButtonNode;
const duelLobbyButtonEl = duelLobbyButtonNode;
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
const p2pRematchButtonEl = p2pRematchButtonNode;
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
const startsInEditorMode = urlParams.get('editor') === '1';

type GameLanguage = 'ko' | 'en';
type LocalizedText = Record<GameLanguage, string>;

const LANGUAGE_STORAGE_KEY = 'cgw-language';
const RUNTIME_COPY = {
  ko: {
    documentTitle: '용사의 여정 Runtime',
    gameTitle: '용사의 여정',
    loadingQuest: '여정을 준비하는 중입니다...',
    menuLabel: '메뉴',
    menuNote: '이동: WASD / 터치 이동<br />공격: Space<br />마법: Shift<br />구르기: C<br />막기: F',
    language: '언어',
    soundOn: '사운드 On',
    soundOff: '사운드 Off',
    soundEnabled: '사운드를 켰습니다. 첫 입력 이후 배경음악과 효과음이 재생됩니다.',
    soundDisabled: '사운드를 껐습니다.',
    onlineMatch: '온라인 매치',
    closeOnlineMatch: '온라인 매치 닫기',
    attack: '공격',
    magic: '마법',
    block: '막기',
    dodge: '구르기',
    p2pOpen: '열기',
    p2pClose: '닫기',
    offline: '오프라인',
    loadingLobby: '로비 불러오는 중',
    creatingRoom: '방 만드는 중',
    joining: '참가 중',
    waitingPeer: '참가 대기',
    connecting: '연결 중',
    connected: '연결됨',
    error: '오류',
    matchJoined: '매치 참가됨',
    createRoom: '방 만들기',
    joinRoom: '참가하기',
    copyLink: '링크 복사',
    rematch: '다시 대전',
    acceptRematch: '재대전 수락',
    waitingRequest: '요청 대기중',
    disconnect: '연결 종료',
    cancelWaiting: '대기 취소',
    endMatch: '매치 종료',
    newRoomName: '새 방 이름',
    roomNamePlaceholder: '예: Seoul Raid Room',
    refreshLobby: '로비 새로고침',
    p2pDefaultHelp: '로비에서 방을 만들면 서버가 offer/answer 신호를 중계합니다. 호스트 heartbeat가 멈추면 방은 자동으로 정리됩니다.',
    noRooms: '활성 방이 없습니다. 먼저 방을 만들거나 잠시 후 새로고침하세요.',
    guestWaiting: '방에 참가 요청을 보냈습니다. 호스트 연결을 기다리는 중입니다.',
    matchPreparing: '매치 연결을 준비하는 중입니다.',
    myRoom: '내 방',
    me: '나',
    roomOwnedByMe: '내가 만든 방',
    guestJoined: '{name} 참가',
    matchConnected: '매치 연결됨',
    guestConnecting: '{label} · 연결 중',
    guestAnswerPending: '{label} · 응답 확인 중',
    connectionPreparing: '연결 준비 중',
    waitingGuest: '참가자 대기중',
    roomOpen: '입장 가능',
    roomJoining: '입장 처리 중',
    roomFighting: '전투 중',
    hostAccepted: '호스트가 참가 요청을 확인했습니다. 브라우저 P2P 연결을 여는 중입니다.',
    hostReopened: '호스트가 방을 다시 열었습니다. 참가를 다시 시도해 주세요.',
    roomStatusFailed: '방 상태를 확인하지 못했습니다. 호스트가 방을 닫았을 수 있습니다.',
    chooseRoom: '방을 만들거나 로비 목록에서 참가할 방을 선택하세요.',
    lobbyLoadingHelp: '활성 방 목록을 새로 불러오는 중입니다.',
    lobbyRefreshed: '로비 목록을 새로고침했습니다.',
    lobbyLoadFailed: '로비 목록을 불러오지 못했습니다. 잠시 후 다시 시도하세요.',
    leftOnline: '온라인 매치를 종료하고 싱글 플레이로 돌아왔습니다.',
    hostRoomCreated: '내 방이 생성되었습니다. 초대 링크를 공유하고 참가자를 기다리는 중입니다.',
    hostRoomOverlay: '방 대기실을 만들었습니다. 참가자를 기다립니다.',
    hostRoomFailed: '방 생성에 실패했습니다. 다시 시도하세요.',
    publishingOffer: '방을 만들고 로비에 오퍼를 게시하는 중입니다.',
    hostSignalFailed: '호스트 신호 확인이 반복 실패했습니다. 방을 다시 만들어 주세요.',
    hostSignalDelayed: '호스트 신호 확인이 잠시 지연되고 있습니다. 자동으로 재시도합니다.',
    peerJoinedStatus: '{name} 님이 참가했습니다. P2P 연결을 준비하는 중입니다.',
    peerJoinedOverlay: '{name} 님이 온라인 매치에 참가했습니다.',
    answerApplied: '참가자의 answer를 적용했습니다. 데이터 채널이 열리면 매치가 시작됩니다.',
    selectRoomFirst: '참가할 방을 먼저 선택하세요.',
    preparingJoin: '선택한 방 정보를 확인하고 참가를 준비하는 중입니다.',
    applyingOffer: '선택한 방의 오퍼를 적용하고 answer를 서버에 등록하는 중입니다.',
    joinRequested: '방 참가를 요청했습니다. 호스트 브라우저가 응답을 확인하면 매치가 시작됩니다.',
    selectedRoomJoinOverlay: '선택한 방에 참가 요청을 보냈습니다. 연결을 기다립니다.',
    roomJoinFailed: '방 참가에 실패했습니다. 이미 가득 찼거나 사라졌을 수 있습니다.',
    roomCreateFailed: '방 생성에 실패했습니다.',
    shareJoinRequested: '공유 링크의 방에 참가를 요청했습니다. 연결을 기다립니다.',
    shareJoinFailed: '공유 링크로 방에 참가하지 못했습니다.',
    refreshFailed: '로비 새로고침에 실패했습니다.',
    createRoomBeforeCopy: '먼저 방을 만든 뒤 링크를 복사하세요.',
    inviteCopied: '초대 링크를 복사했습니다.',
    inviteShareTitle: '용사의 여정 온라인 매치 초대',
    inviteShareText: '용사의 여정 온라인 매치에 참가하세요.',
    shareOpened: '공유 메뉴를 열었습니다.',
    inviteCopyFailed: '초대 링크 복사에 실패했습니다.',
    peerConnected: '연결되었습니다. 두 플레이어 모두 같은 전장에서 실시간으로 대전합니다.',
    dataChannelError: '데이터 채널 오류가 발생했습니다. 연결을 끊고 다시 시도하세요.',
    peerConnecting: '상대 응답을 확인 중입니다. 연결이 성립되면 자동으로 매치가 시작됩니다.',
    networkUnstable: '네트워크가 잠시 불안정합니다. 자동으로 재연결을 확인하는 중입니다.',
    peerMessageFailed: '상대 메시지를 해석하지 못했습니다.',
    rematchPeerRequested: '상대가 재대전을 요청했습니다. 수락하면 같은 연결로 새 라운드가 시작됩니다.',
    rematchPeerSummary: '상대가 재대전을 요청했습니다. 다시 대전을 누르면 즉시 새 라운드가 시작됩니다.',
    rematchPeerOverlay: '상대가 재대전을 요청했습니다.',
    rematchDisconnectedStart: '상대 연결이 끊겨 재대전을 시작할 수 없습니다.',
    rematchStarted: '재대전이 시작되었습니다. 같은 연결로 새 라운드를 진행합니다.',
    rematchStartOverlay: '재대전 시작!',
    rematchAvailableAfterEnd: '매치가 끝난 뒤 같은 연결에서 재대전을 요청할 수 있습니다.',
    rematchDisconnectedRequest: '상대 연결이 끊겨 재대전을 요청할 수 없습니다.',
    rematchRequested: '재대전을 요청했습니다. 상대 수락을 기다리는 중입니다.',
    rematchRequestedSummary: '재대전을 요청했습니다. 상대가 수락하면 바로 새 라운드가 시작됩니다.',
    rematchRequestedHelp: '재대전 요청을 보냈습니다.',
    win: '승리',
    lose: '패배',
    victory: '승리했습니다. 다시 대전을 요청할 수 있습니다.',
    defeat: '패배했습니다. 다시 대전을 요청할 수 있습니다.',
    duelWinSummary: '상대를 제압했습니다. 같은 연결로 바로 재대전을 요청할 수 있습니다.',
    duelLoseSummary: '이번 라운드는 패배했습니다. 재대전을 요청해 바로 다시 붙어보세요.',
    duelObjective: '용사의 여정 대전',
    remoteHud: '상대 HP {hp}/100 · Mana {mana}/80',
    waitingRemote: '상대 연결 대기 중',
    guardianProgress: '수호자 {defeated}/{total}',
    openChest: '보물상자 열기',
    escapeStairs: '북쪽 계단으로 탈출',
    nextGate: '북쪽 게이트로 다음 층',
    coins: '코인 {count}/{total}',
    custom: 'Custom',
    fallbackJourney: '여정',
    nextFloorFallback: '다음 층',
    loadingAssets: '여정 에셋과 씬을 준비하는 중입니다...',
    startHint: '화면을 터치하거나 WASD로 이동해 모험을 시작하세요.',
    finalChestOpened: '마지막 상자를 열었습니다. 북쪽 계단으로 탈출하세요.',
    chestOpened: '상자를 열었습니다. 북쪽 게이트로 다음 층에 진입하세요.',
    escapedScoreSubmitted: '탈출 성공. 점수를 제출했습니다.',
    runEndedScoreSubmitted: '모험 종료. 점수를 제출했습니다.',
    reviveOffer: '광고 시청을 선택하면 같은 전투 상태에서 1회 부활합니다.',
    reviveDone: '부활 완료. 상자를 챙기고 게이트로 탈출하세요.',
    noReviveEnded: '부활 없이 모험을 종료했습니다.',
    allGuardiansDown: '모든 수호자를 처치했습니다. 보물상자를 여세요.',
    defeatedEnemy: '{enemy}을 쓰러뜨렸습니다. 남은 적 {remaining}명',
    enemyHit: '{enemy}을 가격했습니다. 남은 체력 {hp}/{maxHp}',
    emptySwing: '허공을 가르기만 했습니다. 적에게 더 가까이 붙으세요.',
    peerTooFar: '상대와 거리가 멉니다. 더 가까이 붙으세요.',
    peerDefeated: '상대를 쓰러뜨렸습니다.',
    peerMeleeHit: '검격 적중. 상대 체력 {hp} 남음',
    peerMagicDefeated: '마법으로 상대를 쓰러뜨렸습니다.',
    peerMagicHit: '마법 적중. 상대 체력 {hp} 남음',
    incomingMagic: '상대 마법 적중. 체력 {hp} 남음',
    incomingMelee: '상대 검격 적중. 체력 {hp} 남음',
    dodgeMagic: '구르기로 마법을 회피했습니다.',
    dodgeAttack: '구르기로 공격을 회피했습니다.',
    blockMelee: '칼로 공격을 막아냈습니다.',
    blockSuccess: '막기 성공. 체력 {hp} 남음',
    rollMissing: '구르기 애니메이션을 아직 불러오지 못했습니다.',
    rollNeedsDirection: '구르려면 이동 방향을 먼저 입력하세요.',
    rolling: '구르기로 회피합니다.',
    manaLow: '마나가 부족합니다. 잠시 기다리면 다시 회복됩니다.',
    magicCast: '왼손 마법탄을 발사했습니다.',
    enemyAttack: '{enemy}의 공격을 맞았습니다. 체력 {hp} 남음',
    coinCollected: '코인을 회수했습니다. {count}/{total}',
    magicLastGuardian: '마법으로 마지막 수호자를 쓰러뜨렸습니다. 보물상자를 여세요.',
    magicEnemyDefeated: '마법으로 {enemy}을 쓰러뜨렸습니다. 남은 적 {remaining}명',
    magicEnemyHit: '{enemy}에게 마법탄 적중. 남은 체력 {hp}/{maxHp}',
    pursuePeer: '상대를 추적합니다. 사거리 안으로 들어가면 자동으로 근접 공격합니다.',
    pursueEnemy: '적을 추적합니다. 사거리 안으로 들어가면 자동 공격합니다.',
    enemyScout: '정찰병',
    enemySpearman: '창병',
    enemyBrute: '방패병',
    enemyWarden: '오크 대장',
    enemyGuard: '오크 경비병',
    languageChanged: '언어가 변경되었습니다.',
  },
  en: {
    documentTitle: "Hero's Journey Runtime",
    gameTitle: "Hero's Journey",
    loadingQuest: 'Preparing the journey...',
    menuLabel: 'Menu',
    menuNote: 'Move: WASD / touch move<br />Attack: Space<br />Magic: Shift<br />Dodge: C<br />Block: F',
    language: 'Language',
    soundOn: 'Sound On',
    soundOff: 'Sound Off',
    soundEnabled: 'Sound enabled. Music and effects will play after the first input.',
    soundDisabled: 'Sound disabled.',
    onlineMatch: 'Online Match',
    closeOnlineMatch: 'Close Online Match',
    attack: 'Attack',
    magic: 'Magic',
    block: 'Block',
    dodge: 'Dodge',
    p2pOpen: 'Open',
    p2pClose: 'Close',
    offline: 'Offline',
    loadingLobby: 'Loading lobby',
    creatingRoom: 'Creating room',
    joining: 'Joining',
    waitingPeer: 'Waiting for player',
    connecting: 'Connecting',
    connected: 'Connected',
    error: 'Error',
    matchJoined: 'Match joined',
    createRoom: 'Create Room',
    joinRoom: 'Join',
    copyLink: 'Copy Link',
    rematch: 'Rematch',
    acceptRematch: 'Accept Rematch',
    waitingRequest: 'Waiting...',
    disconnect: 'Disconnect',
    cancelWaiting: 'Cancel Wait',
    endMatch: 'End Match',
    newRoomName: 'New Room Name',
    roomNamePlaceholder: 'e.g. Seoul Raid Room',
    refreshLobby: 'Refresh Lobby',
    p2pDefaultHelp: 'Create a room and the server relays offer/answer signals. Rooms are cleaned up automatically when the host heartbeat stops.',
    noRooms: 'No active rooms. Create one first or refresh again shortly.',
    guestWaiting: 'Join request sent. Waiting for the host connection.',
    matchPreparing: 'Preparing the match connection.',
    myRoom: 'My Room',
    me: 'Me',
    roomOwnedByMe: 'Hosted by me',
    guestJoined: '{name} joined',
    matchConnected: 'Match connected',
    guestConnecting: '{label} · connecting',
    guestAnswerPending: '{label} · checking response',
    connectionPreparing: 'Preparing connection',
    waitingGuest: 'Waiting for guest',
    roomOpen: 'Open',
    roomJoining: 'Joining',
    roomFighting: 'In battle',
    hostAccepted: 'The host confirmed your request. Opening the browser P2P connection.',
    hostReopened: 'The host reopened the room. Try joining again.',
    roomStatusFailed: 'Could not check room status. The host may have closed the room.',
    chooseRoom: 'Create a room or choose one from the lobby.',
    lobbyLoadingHelp: 'Refreshing active rooms.',
    lobbyRefreshed: 'Lobby refreshed.',
    lobbyLoadFailed: 'Could not load the lobby. Try again shortly.',
    leftOnline: 'Online match ended. Returned to solo play.',
    hostRoomCreated: 'Your room was created. Share the invite link and wait for a guest.',
    hostRoomOverlay: 'Room lobby created. Waiting for a guest.',
    hostRoomFailed: 'Could not create the room. Try again.',
    publishingOffer: 'Creating room and publishing the offer to the lobby.',
    hostSignalFailed: 'Host signaling repeatedly failed. Create the room again.',
    hostSignalDelayed: 'Host signaling is delayed. Retrying automatically.',
    peerJoinedStatus: '{name} joined. Preparing the P2P connection.',
    peerJoinedOverlay: '{name} joined the online match.',
    answerApplied: 'Guest answer applied. The match starts when the data channel opens.',
    selectRoomFirst: 'Select a room first.',
    preparingJoin: 'Checking the selected room and preparing to join.',
    applyingOffer: 'Applying the room offer and registering your answer.',
    joinRequested: 'Join request sent. The match starts when the host browser confirms it.',
    selectedRoomJoinOverlay: 'Join request sent to the selected room. Waiting for connection.',
    roomJoinFailed: 'Could not join the room. It may be full or gone.',
    roomCreateFailed: 'Could not create the room.',
    shareJoinRequested: 'Join request sent from the shared link. Waiting for connection.',
    shareJoinFailed: 'Could not join from the shared link.',
    refreshFailed: 'Failed to refresh the lobby.',
    createRoomBeforeCopy: 'Create a room before copying the invite link.',
    inviteCopied: 'Invite link copied.',
    inviteShareTitle: "Hero's Journey Online Match Invite",
    inviteShareText: "Join a Hero's Journey online match.",
    shareOpened: 'Share menu opened.',
    inviteCopyFailed: 'Could not copy the invite link.',
    peerConnected: 'Connected. Both players are now in the same real-time arena.',
    dataChannelError: 'Data channel error. Disconnect and try again.',
    peerConnecting: 'Checking peer response. The match starts automatically when connected.',
    networkUnstable: 'Network is unstable. Checking reconnection automatically.',
    peerMessageFailed: 'Could not parse the peer message.',
    rematchPeerRequested: 'Opponent requested a rematch. Accept to start a new round on the same connection.',
    rematchPeerSummary: 'Opponent requested a rematch. Press rematch to start immediately.',
    rematchPeerOverlay: 'Opponent requested a rematch.',
    rematchDisconnectedStart: 'Cannot start a rematch because the opponent disconnected.',
    rematchStarted: 'Rematch started. Playing a new round on the same connection.',
    rematchStartOverlay: 'Rematch start!',
    rematchAvailableAfterEnd: 'You can request a rematch after the match ends.',
    rematchDisconnectedRequest: 'Cannot request a rematch because the opponent disconnected.',
    rematchRequested: 'Rematch requested. Waiting for opponent acceptance.',
    rematchRequestedSummary: 'Rematch requested. A new round starts when the opponent accepts.',
    rematchRequestedHelp: 'Rematch request sent.',
    win: 'Victory',
    lose: 'Defeat',
    victory: 'You won. You can request a rematch.',
    defeat: 'You lost. You can request a rematch.',
    duelWinSummary: 'You defeated the opponent. You can request a rematch on the same connection.',
    duelLoseSummary: 'You lost this round. Request a rematch and fight again.',
    duelObjective: "Hero's Journey Duel",
    remoteHud: 'Opponent HP {hp}/100 · Mana {mana}/80',
    waitingRemote: 'Waiting for opponent connection',
    guardianProgress: 'Guardians {defeated}/{total}',
    openChest: 'Open chest',
    escapeStairs: 'Escape by the north stairs',
    nextGate: 'Use the north gate',
    coins: 'Coins {count}/{total}',
    custom: 'Custom',
    fallbackJourney: 'Journey',
    nextFloorFallback: 'next floor',
    loadingAssets: 'Preparing journey assets and scene...',
    startHint: 'Touch the screen or move with WASD to begin the adventure.',
    finalChestOpened: 'Final chest opened. Escape by the north stairs.',
    chestOpened: 'Chest opened. Enter the next floor through the north gate.',
    escapedScoreSubmitted: 'Escape successful. Score submitted.',
    runEndedScoreSubmitted: 'Adventure ended. Score submitted.',
    reviveOffer: 'Watch a reward ad to revive once in the same combat state.',
    reviveDone: 'Revived. Grab the chest and escape through the gate.',
    noReviveEnded: 'Adventure ended without revive.',
    allGuardiansDown: 'All guardians defeated. Open the treasure chest.',
    defeatedEnemy: '{enemy} defeated. {remaining} enemies left',
    enemyHit: 'Hit {enemy}. HP {hp}/{maxHp} left',
    emptySwing: 'You only cut the air. Move closer to the enemy.',
    peerTooFar: 'Opponent is too far. Move closer.',
    peerDefeated: 'Opponent defeated.',
    peerMeleeHit: 'Melee hit. Opponent HP {hp} left',
    peerMagicDefeated: 'Opponent defeated with magic.',
    peerMagicHit: 'Magic hit. Opponent HP {hp} left',
    incomingMagic: 'Opponent magic hit. HP {hp} left',
    incomingMelee: 'Opponent strike hit. HP {hp} left',
    dodgeMagic: 'Dodged the magic with a roll.',
    dodgeAttack: 'Dodged the attack with a roll.',
    blockMelee: 'Blocked the attack with your sword.',
    blockSuccess: 'Block succeeded. HP {hp} left',
    rollMissing: 'Roll animation is still loading.',
    rollNeedsDirection: 'Choose a movement direction before rolling.',
    rolling: 'Rolling to evade.',
    manaLow: 'Not enough mana. Wait briefly to recover.',
    magicCast: 'Fired a left-hand magic bolt.',
    enemyAttack: '{enemy} hit you. HP {hp} left',
    coinCollected: 'Coin collected. {count}/{total}',
    magicLastGuardian: 'Last guardian defeated with magic. Open the treasure chest.',
    magicEnemyDefeated: '{enemy} defeated with magic. {remaining} enemies left',
    magicEnemyHit: 'Magic bolt hit {enemy}. HP {hp}/{maxHp} left',
    pursuePeer: 'Chasing opponent. Auto melee attacks when in range.',
    pursueEnemy: 'Chasing enemy. Auto attacks when in range.',
    enemyScout: 'Scout',
    enemySpearman: 'Spearman',
    enemyBrute: 'Shield Guard',
    enemyWarden: 'Orc Warden',
    enemyGuard: 'Orc Guard',
    languageChanged: 'Language changed.',
  },
} as const;

let currentLanguage: GameLanguage = resolveRuntimeLanguage();

function normalizeRuntimeLanguage(value: unknown): GameLanguage | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'ko' || normalized.startsWith('ko-')) {
    return 'ko';
  }
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  return null;
}

function resolveRuntimeLanguage(): GameLanguage {
  try {
    const storedLanguage = normalizeRuntimeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (storedLanguage) {
      return storedLanguage;
    }
  } catch {
    // Ignore storage failures in private mode.
  }

  return [...navigator.languages, navigator.language].map(normalizeRuntimeLanguage).find(Boolean) ?? 'ko';
}

function t(key: keyof typeof RUNTIME_COPY.ko, values: Record<string, string | number> = {}) {
  const template = RUNTIME_COPY[currentLanguage][key] ?? RUNTIME_COPY.ko[key];
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
}

function localize(text: LocalizedText) {
  return text[currentLanguage] ?? text.ko;
}

type ModelKey =
  | 'banner'
  | 'barrel'
  | 'character-human'
  | 'character-orc'
  | 'chest'
  | 'coin'
  | 'column'
  | 'dirt'
  | 'floor'
  | 'floor-detail'
  | 'gate'
  | 'rocks'
  | 'shield-rectangle'
  | 'shield-round'
  | 'stairs'
  | 'stones'
  | 'trap'
  | 'wall'
  | 'wall-half'
  | 'wall-narrow'
  | 'wall-opening'
  | 'weapon-spear'
  | 'weapon-sword'
  | 'wood-structure'
  | 'wood-support';

type BiomeModelKey =
  | 'forest-pack'
  | 'tree-1'
  | 'tree-2'
  | 'tree-3'
  | 'bush-1'
  | 'bush-2'
  | 'bush-3'
  | 'grass-1'
  | 'grass-2'
  | 'plant-1'
  | 'plant-4'
  | 'plant-5'
  | 'rock-1'
  | 'rock-3'
  | 'rock-6'
  | 'mountain-1'
  | 'mountain-2'
  | 'mountain-3'
  | 'terrain-1'
  | 'terrain-2';

type TemplateKey = ModelKey | BiomeModelKey;

type CircleObstacle = {
  x: number;
  z: number;
  radius: number;
};

type RectObstacle = {
  x: number;
  z: number;
  halfWidth: number;
  halfDepth: number;
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
  shield: THREE.Group | null;
  rig: CharacterRig;
  kind?: EnemyKind;
  label: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  aggroRange: number;
  attackRange: number;
  attackIntervalMs: number;
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
  levelIndex: number;
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
    }
  | {
      type: 'REMATCH_REQUEST';
    }
  | {
      type: 'REMATCH_ACCEPT';
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
  hostHeartbeatFailures: number;
  guestRoomPollTimerId: number | null;
  lobbyRefreshTimerId: number | null;
  peerDisconnectTimerId: number | null;
  pendingRemoteAnswer: string | null;
  rematchRequested: boolean;
  peerRematchRequested: boolean;
};

type MapTool =
  | 'erase'
  | 'floor'
  | 'floor-detail'
  | 'wall'
  | 'wall-half'
  | 'wall-narrow'
  | 'wall-opening'
  | 'banner'
  | 'column'
  | 'barrel'
  | 'dirt'
  | 'rocks'
  | 'stones'
  | 'forest-pack'
  | 'tree-1'
  | 'tree-2'
  | 'tree-3'
  | 'bush-1'
  | 'bush-2'
  | 'bush-3'
  | 'grass-1'
  | 'grass-2'
  | 'plant-1'
  | 'plant-4'
  | 'plant-5'
  | 'rock-1'
  | 'rock-3'
  | 'rock-6'
  | 'mountain-1'
  | 'mountain-2'
  | 'mountain-3'
  | 'terrain-1'
  | 'terrain-2'
  | 'trap'
  | 'wood-structure'
  | 'wood-support'
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
  narrow?: boolean;
  opening?: boolean;
};

type BuiltInPropKey =
  | 'banner'
  | 'barrel'
  | 'column'
  | 'dirt'
  | 'rocks'
  | 'stones'
  | 'trap'
  | 'wood-structure'
  | 'wood-support';

type JourneyPropKey = BuiltInPropKey | BiomeModelKey;

type PropConfig = GridPoint & {
  key: JourneyPropKey;
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
  kind?: EnemyKind;
  weapon?: EnemyWeaponKey;
  shield?: EnemyShieldKey;
  damage?: number;
  radius?: number;
  aggroRange?: number;
  attackRange?: number;
  attackIntervalMs?: number;
  scale?: number;
  rotationQuarter?: number;
};

type EnemyKind = 'guard' | 'scout' | 'spearman' | 'brute' | 'warden';
type EnemyWeaponKey = 'sword' | 'spear';
type EnemyShieldKey = 'round' | 'rectangle';

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

type JourneyBiome = 'forest' | 'desert' | 'mountain' | 'ruin';

type DungeonLevelConfig = {
  id: string;
  name: LocalizedText;
  biome: JourneyBiome;
  quest: LocalizedText;
  intro: LocalizedText;
  clearText: LocalizedText;
  map: DungeonMapConfig;
};

const GAME_SLUG = 'hero-journey';
const GAME_PLAY_PATH = `/games/${GAME_SLUG}/play`;
const MODEL_ROOT = '/assets/dungeon-quest/models';
const ANIMATION_ROOT = '/assets/dungeon-quest/anims';
const BIOME_MODEL_ROOT = '/assets/hero-journey/biomes';
const WEAPON_EDITOR_STORAGE_KEY = 'dungeon-quest:weapon-editor:v1';
const MAP_EDITOR_STORAGE_KEY = 'dungeon-quest:map-editor:v3';
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
const BIOME_MODEL_CONFIGS: Record<BiomeModelKey, { file: string; scale: number; stripMeshes?: string[] }> = {
  'forest-pack': { file: 'forest-pack.fbx', scale: 0.0005, stripMeshes: ['Plane'] },
  'tree-1': { file: 'tree-1.fbx', scale: 0.004 },
  'tree-2': { file: 'tree-2.fbx', scale: 0.004 },
  'tree-3': { file: 'tree-3.fbx', scale: 0.004 },
  'bush-1': { file: 'bush-1.fbx', scale: 0.006 },
  'bush-2': { file: 'bush-2.fbx', scale: 0.006 },
  'bush-3': { file: 'bush-3.fbx', scale: 0.006 },
  'grass-1': { file: 'grass-1.fbx', scale: 0.01 },
  'grass-2': { file: 'grass-2.fbx', scale: 0.01 },
  'plant-1': { file: 'plant-1.fbx', scale: 0.006 },
  'plant-4': { file: 'plant-4.fbx', scale: 0.006 },
  'plant-5': { file: 'plant-5.fbx', scale: 0.006 },
  'rock-1': { file: 'rock-1.fbx', scale: 0.006 },
  'rock-3': { file: 'rock-3.fbx', scale: 0.006 },
  'rock-6': { file: 'rock-6.fbx', scale: 0.006 },
  'mountain-1': { file: 'mountain-1.fbx', scale: 0.0025 },
  'mountain-2': { file: 'mountain-2.fbx', scale: 0.0025 },
  'mountain-3': { file: 'mountain-3.fbx', scale: 0.0028 },
  'terrain-1': { file: 'terrain-1.fbx', scale: 0.0035 },
  'terrain-2': { file: 'terrain-2.fbx', scale: 0.0035 },
};
const JOURNEY_THEMES: Record<
  JourneyBiome,
  {
    background: string;
    fog: string;
    fogNear: number;
    fogFar: number;
    sky: string;
    ground: string;
    ambientIntensity: number;
    sun: string;
    sunIntensity: number;
    sunPosition: [number, number, number];
  }
> = {
  forest: {
    background: '#071710',
    fog: '#0b2117',
    fogNear: 12,
    fogFar: 34,
    sky: '#d9fff2',
    ground: '#12341f',
    ambientIntensity: 1.35,
    sun: '#fff1bd',
    sunIntensity: 1.85,
    sunPosition: [4.5, 10.5, 3.6],
  },
  desert: {
    background: '#1b140c',
    fog: '#6f4a24',
    fogNear: 13,
    fogFar: 38,
    sky: '#fff0ca',
    ground: '#6d4324',
    ambientIntensity: 1.2,
    sun: '#ffd08a',
    sunIntensity: 2.1,
    sunPosition: [6.5, 11.5, 0.8],
  },
  mountain: {
    background: '#101824',
    fog: '#30465a',
    fogNear: 14,
    fogFar: 42,
    sky: '#e3f5ff',
    ground: '#263849',
    ambientIntensity: 1.18,
    sun: '#f6fbff',
    sunIntensity: 1.9,
    sunPosition: [2.8, 12, 5.5],
  },
  ruin: {
    background: '#071019',
    fog: '#071019',
    fogNear: 14,
    fogFar: 40,
    sky: '#f4f8ff',
    ground: '#112338',
    ambientIntensity: 1.2,
    sun: '#fff2d8',
    sunIntensity: 1.75,
    sunPosition: [5, 10, 2],
  },
};
const MAP_TOOL_LABELS: Record<MapTool, string> = {
  erase: 'Erase',
  floor: 'Floor',
  'floor-detail': 'Floor Detail',
  wall: 'Wall',
  'wall-half': 'Wall Half',
  'wall-narrow': 'Wall Narrow',
  'wall-opening': 'Wall Opening',
  banner: 'Banner',
  column: 'Column',
  barrel: 'Barrel',
  dirt: 'Dirt',
  rocks: 'Rocks',
  stones: 'Stones',
  'forest-pack': 'Forest Pack',
  'tree-1': 'Tree 1',
  'tree-2': 'Tree 2',
  'tree-3': 'Tree 3',
  'bush-1': 'Bush 1',
  'bush-2': 'Bush 2',
  'bush-3': 'Bush 3',
  'grass-1': 'Grass 1',
  'grass-2': 'Grass 2',
  'plant-1': 'Plant 1',
  'plant-4': 'Plant 4',
  'plant-5': 'Plant 5',
  'rock-1': 'Rock 1',
  'rock-3': 'Rock 3',
  'rock-6': 'Rock 6',
  'mountain-1': 'Mountain 1',
  'mountain-2': 'Mountain 2',
  'mountain-3': 'Mountain 3',
  'terrain-1': 'Terrain 1',
  'terrain-2': 'Terrain 2',
  trap: 'Trap',
  'wood-structure': 'Wood Structure',
  'wood-support': 'Wood Support',
  coin: 'Coin',
  enemy: 'Enemy',
  'player-spawn': 'Player Spawn',
  chest: 'Chest',
  gate: 'Gate',
  exit: 'Exit',
};
const DUNGEON_LEVELS = createDungeonLevels();
const DEFAULT_MAP_CONFIG = cloneMapConfig(DUNGEON_LEVELS[0]?.map ?? createDefaultMapConfig());
const DUEL_MAP_CONFIG = cloneMapConfig(DEFAULT_MAP_CONFIG);
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
const SOLO_TOTAL_TIME_MS = 660_000;
const P2P_SNAPSHOT_INTERVAL_MS = 60;
const P2P_ICE_GATHERING_TIMEOUT_MS = 2_500;
const P2P_HOST_HEARTBEAT_INTERVAL_MS = 1_500;
const P2P_HOST_HEARTBEAT_FAILURE_LIMIT = 3;
const P2P_GUEST_ROOM_POLL_INTERVAL_MS = 1_750;
const P2P_DISCONNECT_GRACE_MS = 8_000;
const DEFAULT_P2P_HELP_TEXT = RUNTIME_COPY.ko.p2pDefaultHelp;
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

const templates = new Map<TemplateKey, TemplateAsset>();
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
const wallObstacles: RectObstacle[] = [];
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
  hostHeartbeatFailures: 0,
  guestRoomPollTimerId: null,
  lobbyRefreshTimerId: null,
  peerDisconnectTimerId: null,
  pendingRemoteAnswer: null,
  rematchRequested: false,
  peerRematchRequested: false,
};

const state: GameState = {
  started: false,
  running: false,
  finished: false,
  waitingReward: false,
  reviveAvailable: true,
  finalized: false,
  score: 0,
  totalTimeMs: SOLO_TOTAL_TIME_MS,
  elapsedMs: 0,
  levelIndex: 0,
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
let dungeonMapConfig = startsInEditorMode ? loadMapConfig() : cloneMapConfig(DEFAULT_MAP_CONFIG);
const weaponEditorState = loadWeaponEditorState();
let currentEditorMode: EditorMode = 'transform';
let p2pHelpFlashMessage: string | null = null;
let p2pHelpFlashTimerId: number | null = null;
let currentEditorPreset: EditorPresetKey = 'mount';
let currentMapTool: MapTool = 'floor';
let currentMapRotationQuarter = 0;
let currentHoverPoint: GridPoint | null = null;
let pursuedEnemy: EnemyUnit | null = null;
let editorVisible = startsInEditorMode;
let utilityMenuOpen = false;
let pursuedRemotePeer = false;
let remotePeerAvatar: RemotePeerAvatar | null = null;
const transformHandleModes: Partial<Record<keyof WeaponEditorState, TransformHandleStepMode>> = {};

function modelUrl(name: ModelKey) {
  return `${MODEL_ROOT}/${name}.glb`;
}

function biomeModelUrl(name: BiomeModelKey) {
  return `${BIOME_MODEL_ROOT}/${BIOME_MODEL_CONFIGS[name].file}`;
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

function pushHorizontalWalls(
  walls: WallSegmentConfig[],
  z: number,
  fromX: number,
  toX: number,
  options: Partial<Pick<WallSegmentConfig, 'half' | 'narrow' | 'opening'>> = {},
) {
  for (let x = fromX; x <= toX; x += 1) {
    walls.push({ x, z, rotationQuarter: 0, ...options });
  }
}

function pushVerticalWalls(
  walls: WallSegmentConfig[],
  x: number,
  fromZ: number,
  toZ: number,
  options: Partial<Pick<WallSegmentConfig, 'half' | 'narrow' | 'opening'>> = {},
) {
  for (let z = fromZ; z <= toZ; z += 1) {
    walls.push({ x, z, rotationQuarter: 1, ...options });
  }
}

function createRoomShell(detailOffset = 0) {
  const floorTiles: FloorTileConfig[] = [];
  for (let x = -10; x <= 10; x += 1) {
    for (let z = -12; z <= 11; z += 1) {
      floorTiles.push({ x, z, detail: Math.abs(x * 2 + z + detailOffset) % 5 === 0 });
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

  return { floorTiles, walls };
}

function createEnemy(
  kind: EnemyKind,
  x: number,
  z: number,
  overrides: Partial<Omit<EnemyConfig, 'kind' | 'x' | 'z'>> = {},
) {
  const archetypes: Record<EnemyKind, Omit<EnemyConfig, 'x' | 'z'>> = {
    guard: {
      kind: 'guard',
      hp: 3,
      speed: 1.28,
      value: 150,
      weapon: 'sword',
      damage: 14,
      attackIntervalMs: 1220,
      aggroRange: 4.7,
      attackRange: 1.16,
      radius: 0.38,
    },
    scout: {
      kind: 'scout',
      hp: 2,
      speed: 1.72,
      value: 140,
      weapon: 'sword',
      damage: 11,
      attackIntervalMs: 920,
      aggroRange: 5.8,
      attackRange: 1.1,
      radius: 0.34,
      scale: 0.92,
    },
    spearman: {
      kind: 'spearman',
      hp: 3,
      speed: 1.38,
      value: 190,
      weapon: 'spear',
      damage: 16,
      attackIntervalMs: 1320,
      aggroRange: 5.3,
      attackRange: 1.42,
      radius: 0.39,
      scale: 1.02,
    },
    brute: {
      kind: 'brute',
      hp: 6,
      speed: 1.04,
      value: 260,
      weapon: 'sword',
      shield: 'round',
      damage: 20,
      attackIntervalMs: 1500,
      aggroRange: 4.2,
      attackRange: 1.24,
      radius: 0.46,
      scale: 1.16,
    },
    warden: {
      kind: 'warden',
      hp: 12,
      speed: 1.12,
      value: 720,
      weapon: 'spear',
      shield: 'rectangle',
      damage: 24,
      attackIntervalMs: 1380,
      aggroRange: 6.4,
      attackRange: 1.54,
      radius: 0.52,
      scale: 1.28,
    },
  };

  return {
    x,
    z,
    ...archetypes[kind],
    ...overrides,
    kind,
  } satisfies EnemyConfig;
}

function createDefaultMapConfig(): DungeonMapConfig {
  return cloneMapConfig(createDungeonLevels()[0].map);
}

function createDungeonLevels(): DungeonLevelConfig[] {
  const entrance = createRoomShell(0);
  pushHorizontalWalls(entrance.walls, 3.5, -8, -4, { half: true });
  pushHorizontalWalls(entrance.walls, 3.5, 4, 8, { half: true });
  pushHorizontalWalls(entrance.walls, -3.5, -7, -5, { narrow: true });
  pushHorizontalWalls(entrance.walls, -3.5, 5, 7, { narrow: true });

  const quarry = createRoomShell(2);
  pushVerticalWalls(quarry.walls, -4.5, -9, -6, { narrow: true });
  pushVerticalWalls(quarry.walls, 4.5, -9, -6, { narrow: true });
  pushHorizontalWalls(quarry.walls, -1.5, -9, -6, { half: true });
  pushHorizontalWalls(quarry.walls, -1.5, 6, 9, { half: true });
  pushVerticalWalls(quarry.walls, 0.5, 2, 6, { opening: true });

  const vault = createRoomShell(4);
  pushVerticalWalls(vault.walls, -6.5, -7, 5, { narrow: true });
  pushVerticalWalls(vault.walls, 6.5, -7, 5, { narrow: true });
  pushHorizontalWalls(vault.walls, 5.5, -6, -2, { half: true });
  pushHorizontalWalls(vault.walls, 5.5, 2, 6, { half: true });
  pushHorizontalWalls(vault.walls, -5.5, -5, -2, { narrow: true });
  pushHorizontalWalls(vault.walls, -5.5, 2, 5, { narrow: true });

  const keep = createRoomShell(6);
  pushHorizontalWalls(keep.walls, 6.5, -8, -5, { narrow: true });
  pushHorizontalWalls(keep.walls, 6.5, 5, 8, { narrow: true });
  pushVerticalWalls(keep.walls, -7.5, -6, 2, { half: true });
  pushVerticalWalls(keep.walls, 7.5, -6, 2, { half: true });
  pushHorizontalWalls(keep.walls, -6.5, -3, 3, { half: true });

  return [{
    id: 'gate-hall',
    name: { ko: '입구 회랑', en: 'Gate Hall' },
    biome: 'ruin',
    quest: { ko: '흩어진 경비를 제압하고 첫 보물상자를 여세요.', en: 'Defeat the scattered guards and open the first treasure chest.' },
    intro: { ko: '1층 입구 회랑입니다. 기본 경비를 정리하고 북쪽 통로를 여세요.', en: 'Floor 1: Gate Hall. Clear the guards and open the north passage.' },
    clearText: { ko: '입구 회랑 돌파. 무너진 채석장으로 내려갑니다.', en: 'Gate Hall cleared. Descending to the collapsed quarry.' },
    map: {
      ...entrance,
      props: [
        { key: 'column', x: -6.4, z: -4.1, radius: 0.44, rotationQuarter: 0 },
        { key: 'column', x: 6.4, z: -4.1, radius: 0.44, rotationQuarter: 0 },
        { key: 'column', x: -6.4, z: 4.1, radius: 0.44, rotationQuarter: 0 },
        { key: 'column', x: 6.4, z: 4.1, radius: 0.44, rotationQuarter: 0 },
        { key: 'barrel', x: 8.2, z: 6.8, radius: 0.42, rotationQuarter: 0 },
        { key: 'barrel', x: -8.1, z: 6.5, radius: 0.42, rotationQuarter: 0 },
        { key: 'rocks', x: -4.8, z: -8.2, radius: 0.58, rotationQuarter: 0 },
        { key: 'rocks', x: 4.9, z: -8.0, radius: 0.58, rotationQuarter: 0 },
        { key: 'banner', x: -2.2, z: -10.5, radius: 0.18, rotationQuarter: 0 },
        { key: 'banner', x: 2.2, z: -10.5, radius: 0.18, rotationQuarter: 0 },
      ],
      coins: [
        { x: -9.1, z: 9.0, value: 70 },
        { x: -6.1, z: 4.7, value: 70 },
        { x: -4.0, z: -5.9, value: 70 },
        { x: -1.5, z: 1.2, value: 70 },
        { x: 1.9, z: -8.9, value: 70 },
        { x: 3.6, z: 6.7, value: 70 },
        { x: 6.7, z: -3.7, value: 70 },
        { x: 8.9, z: 8.7, value: 70 },
      ],
      enemies: [
        createEnemy('guard', -8.2, -8.5),
        createEnemy('guard', 8.1, -8.4),
        createEnemy('guard', -7.8, 7.4),
        createEnemy('guard', 8.0, 7.3),
        createEnemy('scout', -3.8, -2.6),
        createEnemy('scout', 3.9, -2.4),
      ],
      playerSpawn: { x: 0, z: 9.35 },
      chest: { x: 0, z: -1.8 },
      gate: { x: 0, z: -11.55 },
      exit: { x: 0, z: -12.35 },
    },
  },
  {
    id: 'broken-quarry',
    name: { ko: '무너진 채석장', en: 'Collapsed Quarry' },
    biome: 'ruin',
    quest: { ko: '잔해와 함정을 지나 빠른 정찰병을 끊어내세요.', en: 'Move through rubble and traps, then take down the fast scouts.' },
    intro: { ko: '2층은 무너진 채석장입니다. 흙바닥, 돌무더기, 함정이 길을 좁힙니다.', en: 'Floor 2: Collapsed Quarry. Dirt, rock piles, and traps narrow your route.' },
    clearText: { ko: '채석장 통로 확보. 오래된 금고로 진입합니다.', en: 'Quarry route secured. Entering the old vault.' },
    map: {
      ...quarry,
      props: [
        { key: 'dirt', x: -8, z: -8, radius: 0, rotationQuarter: 0 },
        { key: 'dirt', x: -7, z: -8, radius: 0, rotationQuarter: 0 },
        { key: 'dirt', x: 7, z: -7, radius: 0, rotationQuarter: 0 },
        { key: 'stones', x: -6.8, z: -6.4, radius: 0.54, rotationQuarter: 1 },
        { key: 'stones', x: 6.8, z: -6.1, radius: 0.54, rotationQuarter: 0 },
        { key: 'rocks', x: -8.2, z: 1.6, radius: 0.58, rotationQuarter: 0 },
        { key: 'rocks', x: 8.0, z: 1.4, radius: 0.58, rotationQuarter: 0 },
        { key: 'wood-support', x: -4.7, z: 7.2, radius: 0.34, rotationQuarter: 1 },
        { key: 'wood-support', x: 4.7, z: 7.2, radius: 0.34, rotationQuarter: 3 },
        { key: 'wood-structure', x: 0, z: -8.0, radius: 0.62, rotationQuarter: 0 },
        { key: 'trap', x: -2.5, z: 2.8, radius: 0.52, rotationQuarter: 0 },
        { key: 'trap', x: 2.5, z: 2.8, radius: 0.52, rotationQuarter: 0 },
        { key: 'trap', x: 0, z: -4.7, radius: 0.52, rotationQuarter: 0 },
      ],
      coins: [
        { x: -8.9, z: 8.8, value: 85 },
        { x: -6.2, z: -2.8, value: 85 },
        { x: -4.2, z: -8.6, value: 85 },
        { x: -1.2, z: 5.9, value: 85 },
        { x: 1.4, z: -9.4, value: 85 },
        { x: 4.8, z: 5.6, value: 85 },
        { x: 7.9, z: -2.5, value: 85 },
        { x: 8.4, z: 8.2, value: 85 },
        { x: 0, z: -0.2, value: 120 },
      ],
      enemies: [
        createEnemy('scout', -7.7, 7.4),
        createEnemy('scout', 7.7, 7.2),
        createEnemy('spearman', -7.3, -7.4),
        createEnemy('spearman', 7.2, -7.2),
        createEnemy('guard', -3.0, 0.6),
        createEnemy('guard', 3.0, 0.8),
        createEnemy('brute', 0, -7.0, { hp: 5, value: 235 }),
      ],
      playerSpawn: { x: 0, z: 9.3 },
      chest: { x: 0, z: -2.2 },
      gate: { x: 0, z: -11.55 },
      exit: { x: 0, z: -12.35 },
    },
  },
  {
    id: 'old-vault',
    name: { ko: '오래된 금고', en: 'Old Vault' },
    biome: 'ruin',
    quest: { ko: '방패병과 창병을 분리해서 금고 중심을 장악하세요.', en: 'Split the shield guards and spearmen, then control the vault center.' },
    intro: { ko: '3층 금고입니다. 방패병이 길목을 막고 창병이 긴 사거리로 압박합니다.', en: 'Floor 3: Old Vault. Shield guards block lanes while spearmen pressure from range.' },
    clearText: { ko: '금고 봉인 해제. 마지막 오크 대장 방으로 향합니다.', en: 'Vault seal broken. Moving toward the orc warden’s chamber.' },
    map: {
      ...vault,
      props: [
        { key: 'column', x: -4.2, z: -6.8, radius: 0.44, rotationQuarter: 0 },
        { key: 'column', x: 4.2, z: -6.8, radius: 0.44, rotationQuarter: 0 },
        { key: 'column', x: -4.2, z: 1.2, radius: 0.44, rotationQuarter: 0 },
        { key: 'column', x: 4.2, z: 1.2, radius: 0.44, rotationQuarter: 0 },
        { key: 'barrel', x: -8.0, z: 8.4, radius: 0.42, rotationQuarter: 0 },
        { key: 'barrel', x: 8.0, z: 8.4, radius: 0.42, rotationQuarter: 0 },
        { key: 'stones', x: -8.4, z: -3.4, radius: 0.54, rotationQuarter: 0 },
        { key: 'stones', x: 8.4, z: -3.4, radius: 0.54, rotationQuarter: 0 },
        { key: 'trap', x: -2.2, z: -3.8, radius: 0.52, rotationQuarter: 0 },
        { key: 'trap', x: 2.2, z: -3.8, radius: 0.52, rotationQuarter: 0 },
        { key: 'banner', x: -1.8, z: -10.4, radius: 0.18, rotationQuarter: 0 },
        { key: 'banner', x: 1.8, z: -10.4, radius: 0.18, rotationQuarter: 0 },
      ],
      coins: [
        { x: -8.6, z: 8.7, value: 95 },
        { x: -8.1, z: -6.2, value: 95 },
        { x: -5.2, z: 2.4, value: 95 },
        { x: -2.0, z: -8.6, value: 95 },
        { x: 0, z: 5.8, value: 130 },
        { x: 2.0, z: -8.6, value: 95 },
        { x: 5.2, z: 2.4, value: 95 },
        { x: 8.1, z: -6.2, value: 95 },
        { x: 8.6, z: 8.7, value: 95 },
      ],
      enemies: [
        createEnemy('brute', -7.8, 6.6),
        createEnemy('brute', 7.8, 6.6),
        createEnemy('spearman', -7.8, -6.4),
        createEnemy('spearman', 7.8, -6.4),
        createEnemy('guard', -2.2, 1.0),
        createEnemy('guard', 2.2, 1.0),
        createEnemy('scout', -1.8, -8.4),
        createEnemy('scout', 1.8, -8.4),
      ],
      playerSpawn: { x: 0, z: 9.2 },
      chest: { x: 0, z: -1.2 },
      gate: { x: 0, z: -11.55 },
      exit: { x: 0, z: -12.35 },
    },
  },
  {
    id: 'orc-keep',
    name: { ko: '오크 대장 방', en: 'Orc Warden Keep' },
    biome: 'ruin',
    quest: { ko: '대장을 호위병과 떼어내고 마지막 상자를 여세요.', en: 'Separate the warden from the guards and open the final dungeon chest.' },
    intro: { ko: '최종층입니다. 오크 대장과 호위대가 북쪽 성소를 지키고 있습니다.', en: 'Final dungeon floor. The orc warden and escorts guard the northern shrine.' },
    clearText: { ko: '오크 대장을 쓰러뜨렸습니다. 성채 밖 숲길이 열렸습니다.', en: 'Orc warden defeated. The forest path beyond the keep is open.' },
    map: {
      ...keep,
      props: [
        { key: 'banner', x: -4.8, z: -9.7, radius: 0.18, rotationQuarter: 0 },
        { key: 'banner', x: 4.8, z: -9.7, radius: 0.18, rotationQuarter: 0 },
        { key: 'column', x: -6.0, z: -3.4, radius: 0.44, rotationQuarter: 0 },
        { key: 'column', x: 6.0, z: -3.4, radius: 0.44, rotationQuarter: 0 },
        { key: 'column', x: -3.4, z: 3.2, radius: 0.44, rotationQuarter: 0 },
        { key: 'column', x: 3.4, z: 3.2, radius: 0.44, rotationQuarter: 0 },
        { key: 'wood-structure', x: -8.1, z: 8.0, radius: 0.62, rotationQuarter: 1 },
        { key: 'wood-structure', x: 8.1, z: 8.0, radius: 0.62, rotationQuarter: 3 },
        { key: 'barrel', x: -8.0, z: -7.8, radius: 0.42, rotationQuarter: 0 },
        { key: 'barrel', x: 8.0, z: -7.8, radius: 0.42, rotationQuarter: 0 },
        { key: 'trap', x: -2.7, z: -5.0, radius: 0.52, rotationQuarter: 0 },
        { key: 'trap', x: 2.7, z: -5.0, radius: 0.52, rotationQuarter: 0 },
        { key: 'stones', x: 0, z: 7.0, radius: 0.54, rotationQuarter: 0 },
      ],
      coins: [
        { x: -8.5, z: 8.6, value: 120 },
        { x: -7.2, z: -6.6, value: 120 },
        { x: -4.0, z: 0.2, value: 120 },
        { x: -1.3, z: -9.0, value: 150 },
        { x: 1.3, z: -9.0, value: 150 },
        { x: 4.0, z: 0.2, value: 120 },
        { x: 7.2, z: -6.6, value: 120 },
        { x: 8.5, z: 8.6, value: 120 },
      ],
      enemies: [
        createEnemy('warden', 0, -7.2, { rotationQuarter: 2 }),
        createEnemy('brute', -5.8, -5.1),
        createEnemy('brute', 5.8, -5.1),
        createEnemy('spearman', -7.6, 1.2),
        createEnemy('spearman', 7.6, 1.2),
        createEnemy('guard', -4.8, 6.8),
        createEnemy('guard', 4.8, 6.8),
        createEnemy('scout', -1.8, 4.2),
        createEnemy('scout', 1.8, 4.2),
      ],
      playerSpawn: { x: 0, z: 9.4 },
      chest: { x: 0, z: -3.2 },
      gate: { x: 0, z: -11.55 },
      exit: { x: 0, z: -12.35 },
    },
  },
  {
    id: 'forest-road',
    name: { ko: '숲의 들머리', en: 'Forest Edge' },
    biome: 'forest',
    quest: { ko: '성채 밖 숲길의 정찰병을 제압하고 보급 상자를 여세요.', en: 'Defeat scouts on the forest road and open the supply chest.' },
    intro: { ko: '성채를 빠져나오자 숲길이 이어집니다. 나무와 덤불 사이의 정찰병을 정리하세요.', en: 'Beyond the keep, the road enters the forest. Clear scouts between trees and bushes.' },
    clearText: { ko: '숲길을 돌파했습니다. 사막 협곡으로 향합니다.', en: 'Forest path cleared. Heading for the desert canyon.' },
    map: {
      ...entrance,
      props: [
        { key: 'forest-pack', x: 0, z: -15.0, radius: 0, rotationQuarter: 0 },
        { key: 'tree-1', x: -8.6, z: 8.0, radius: 0.62, rotationQuarter: 1 },
        { key: 'tree-2', x: 8.5, z: 8.2, radius: 0.62, rotationQuarter: 3 },
        { key: 'tree-3', x: -8.2, z: -8.2, radius: 0.62, rotationQuarter: 0 },
        { key: 'bush-1', x: 7.8, z: -7.8, radius: 0.42, rotationQuarter: 2 },
        { key: 'bush-2', x: -5.2, z: 6.7, radius: 0.42, rotationQuarter: 0 },
        { key: 'bush-3', x: 5.2, z: -3.6, radius: 0.42, rotationQuarter: 1 },
        { key: 'grass-1', x: -2.8, z: 6.0, radius: 0, rotationQuarter: 0 },
        { key: 'grass-2', x: 2.9, z: 6.1, radius: 0, rotationQuarter: 0 },
        { key: 'grass-1', x: 0.2, z: -6.4, radius: 0, rotationQuarter: 2 },
        { key: 'barrel', x: 8.2, z: 6.8, radius: 0.42, rotationQuarter: 0 },
        { key: 'barrel', x: -8.1, z: 6.5, radius: 0.42, rotationQuarter: 0 },
      ],
      coins: [
        { x: -9.1, z: 9.0, value: 95 },
        { x: -6.1, z: 4.7, value: 95 },
        { x: -4.0, z: -5.9, value: 95 },
        { x: -1.5, z: 1.2, value: 95 },
        { x: 1.9, z: -8.9, value: 95 },
        { x: 3.6, z: 6.7, value: 95 },
        { x: 6.7, z: -3.7, value: 95 },
        { x: 8.9, z: 8.7, value: 95 },
      ],
      enemies: [
        createEnemy('scout', -8.2, -8.5),
        createEnemy('scout', 8.1, -8.4),
        createEnemy('guard', -7.8, 7.4),
        createEnemy('guard', 8.0, 7.3),
        createEnemy('spearman', -3.8, -2.6),
        createEnemy('spearman', 3.9, -2.4),
      ],
      playerSpawn: { x: 0, z: 9.35 },
      chest: { x: 0, z: -1.8 },
      gate: { x: 0, z: -11.55 },
      exit: { x: 0, z: -12.35 },
    },
  },
  {
    id: 'sunken-canyon',
    name: { ko: '사막 협곡', en: 'Sunken Canyon' },
    biome: 'desert',
    quest: { ko: '메마른 협곡의 바위와 함정을 지나 길잡이 몹을 끊어내세요.', en: 'Cross rocks and traps in the dry canyon, then cut down the pathfinders.' },
    intro: { ko: '뜨거운 사막 협곡입니다. 바위, 마른 풀, 함정이 길을 좁힙니다.', en: 'A hot desert canyon. Rocks, dry plants, and traps squeeze the route.' },
    clearText: { ko: '사막 협곡을 벗어났습니다. 바람산 고갯길로 진입합니다.', en: 'Desert canyon escaped. Entering Wind Pass.' },
    map: {
      ...quarry,
      props: [
        { key: 'terrain-1', x: -6.6, z: -7.9, radius: 0, rotationQuarter: 0 },
        { key: 'terrain-2', x: 6.5, z: 6.6, radius: 0, rotationQuarter: 2 },
        { key: 'rock-1', x: -8.1, z: 2.2, radius: 0.58, rotationQuarter: 0 },
        { key: 'rock-3', x: 8.0, z: 1.9, radius: 0.58, rotationQuarter: 1 },
        { key: 'rock-6', x: 6.9, z: -8.2, radius: 0.58, rotationQuarter: 2 },
        { key: 'plant-1', x: -8.7, z: 7.8, radius: 0, rotationQuarter: 0 },
        { key: 'plant-4', x: 8.8, z: 7.2, radius: 0, rotationQuarter: 0 },
        { key: 'plant-5', x: -3.8, z: -7.8, radius: 0, rotationQuarter: 0 },
        { key: 'dirt', x: -8, z: -8, radius: 0, rotationQuarter: 0 },
        { key: 'dirt', x: -7, z: -8, radius: 0, rotationQuarter: 0 },
        { key: 'dirt', x: 7, z: -7, radius: 0, rotationQuarter: 0 },
        { key: 'stones', x: -6.8, z: -6.4, radius: 0.54, rotationQuarter: 1 },
        { key: 'stones', x: 6.8, z: -6.1, radius: 0.54, rotationQuarter: 0 },
        { key: 'wood-support', x: -4.7, z: 7.2, radius: 0.34, rotationQuarter: 1 },
        { key: 'wood-support', x: 4.7, z: 7.2, radius: 0.34, rotationQuarter: 3 },
        { key: 'trap', x: -2.5, z: 2.8, radius: 0.52, rotationQuarter: 0 },
        { key: 'trap', x: 2.5, z: 2.8, radius: 0.52, rotationQuarter: 0 },
        { key: 'trap', x: 0, z: -4.7, radius: 0.52, rotationQuarter: 0 },
      ],
      coins: [
        { x: -8.9, z: 8.8, value: 105 },
        { x: -6.2, z: -2.8, value: 105 },
        { x: -4.2, z: -8.6, value: 105 },
        { x: -1.2, z: 5.9, value: 105 },
        { x: 1.4, z: -9.4, value: 105 },
        { x: 4.8, z: 5.6, value: 105 },
        { x: 7.9, z: -2.5, value: 105 },
        { x: 8.4, z: 8.2, value: 105 },
        { x: 0, z: -0.2, value: 150 },
      ],
      enemies: [
        createEnemy('scout', -7.7, 7.4),
        createEnemy('scout', 7.7, 7.2),
        createEnemy('spearman', -7.3, -7.4),
        createEnemy('spearman', 7.2, -7.2),
        createEnemy('guard', -3.0, 0.6),
        createEnemy('guard', 3.0, 0.8),
        createEnemy('brute', 0, -7.0, { hp: 6, value: 275 }),
      ],
      playerSpawn: { x: 0, z: 9.3 },
      chest: { x: 0, z: -2.2 },
      gate: { x: 0, z: -11.55 },
      exit: { x: 0, z: -12.35 },
    },
  },
  {
    id: 'wind-pass',
    name: { ko: '바람산 고갯길', en: 'Wind Pass' },
    biome: 'mountain',
    quest: { ko: '산길의 창병과 방패병을 분리해 마지막 고개를 장악하세요.', en: 'Separate the spearmen and shield guards to claim the final mountain pass.' },
    intro: { ko: '차가운 바람산 고갯길입니다. 산등성이와 돌무더기가 시야와 동선을 가릅니다.', en: 'A cold mountain pass. Ridges and stone piles split sightlines and movement.' },
    clearText: { ko: '고갯길을 넘어섰습니다. 출구 계단으로 여정을 마무리하세요.', en: 'Wind Pass crossed. Finish the journey at the exit stairs.' },
    map: {
      ...vault,
      props: [
        { key: 'mountain-1', x: -8.3, z: -7.4, radius: 1.15, rotationQuarter: 0 },
        { key: 'mountain-2', x: 8.2, z: -7.2, radius: 1.15, rotationQuarter: 2 },
        { key: 'mountain-3', x: 0, z: 7.6, radius: 1.15, rotationQuarter: 1 },
        { key: 'rock-3', x: -8.2, z: 2.8, radius: 0.58, rotationQuarter: 0 },
        { key: 'rock-6', x: 8.1, z: 2.8, radius: 0.58, rotationQuarter: 3 },
        { key: 'tree-3', x: -4.8, z: 7.2, radius: 0.62, rotationQuarter: 1 },
        { key: 'bush-3', x: 4.8, z: 7.2, radius: 0.42, rotationQuarter: 0 },
        { key: 'stones', x: -8.4, z: -3.4, radius: 0.54, rotationQuarter: 0 },
        { key: 'stones', x: 8.4, z: -3.4, radius: 0.54, rotationQuarter: 0 },
        { key: 'trap', x: -2.2, z: -3.8, radius: 0.52, rotationQuarter: 0 },
        { key: 'trap', x: 2.2, z: -3.8, radius: 0.52, rotationQuarter: 0 },
        { key: 'banner', x: -1.8, z: -10.4, radius: 0.18, rotationQuarter: 0 },
        { key: 'banner', x: 1.8, z: -10.4, radius: 0.18, rotationQuarter: 0 },
      ],
      coins: [
        { x: -8.6, z: 8.7, value: 120 },
        { x: -8.1, z: -6.2, value: 120 },
        { x: -5.2, z: 2.4, value: 120 },
        { x: -2.0, z: -8.6, value: 120 },
        { x: 0, z: 5.8, value: 170 },
        { x: 2.0, z: -8.6, value: 120 },
        { x: 5.2, z: 2.4, value: 120 },
        { x: 8.1, z: -6.2, value: 120 },
        { x: 8.6, z: 8.7, value: 120 },
      ],
      enemies: [
        createEnemy('warden', 0, -7.2, { rotationQuarter: 2, value: 420 }),
        createEnemy('brute', -7.8, 6.6, { hp: 6 }),
        createEnemy('brute', 7.8, 6.6, { hp: 6 }),
        createEnemy('spearman', -7.8, -6.4),
        createEnemy('spearman', 7.8, -6.4),
        createEnemy('guard', -2.2, 1.0),
        createEnemy('guard', 2.2, 1.0),
        createEnemy('scout', -1.8, -8.4),
        createEnemy('scout', 1.8, -8.4),
      ],
      playerSpawn: { x: 0, z: 9.2 },
      chest: { x: 0, z: -1.2 },
      gate: { x: 0, z: -11.55 },
      exit: { x: 0, z: -12.35 },
    },
  }];
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

function isCustomMapMode() {
  return startsInEditorMode;
}

function getActiveLevel() {
  return DUNGEON_LEVELS[state.levelIndex] ?? DUNGEON_LEVELS[0];
}

function applyLevelVisualTheme() {
  const theme = JOURNEY_THEMES[getActiveLevel()?.biome ?? 'ruin'];
  scene.background = new THREE.Color(theme.background);
  scene.fog = new THREE.Fog(theme.fog, theme.fogNear, theme.fogFar);
  ambientLight.color.set(theme.sky);
  ambientLight.groundColor.set(theme.ground);
  ambientLight.intensity = theme.ambientIntensity;
  sunLight.color.set(theme.sun);
  sunLight.intensity = theme.sunIntensity;
  sunLight.position.set(...theme.sunPosition);
}

function applyLevelMap(levelIndex: number) {
  if (isCustomMapMode()) {
    return;
  }

  const level = DUNGEON_LEVELS[levelIndex] ?? DUNGEON_LEVELS[0];
  dungeonMapConfig = cloneMapConfig(level.map);
}

function isFinalLevel() {
  return state.levelIndex >= DUNGEON_LEVELS.length - 1;
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
  soundToggleButton.textContent = audioState.enabled ? t('soundOn') : t('soundOff');
}

function syncRuntimeText() {
  document.documentElement.lang = currentLanguage;
  document.title = t('documentTitle');
  languageSelectEl.value = currentLanguage;
  languageSelectLabelEl.textContent = t('language');
  menuToggleButton.setAttribute('aria-label', t('menuLabel'));
  menuNoteEl.innerHTML = t('menuNote');
  attackButton.textContent = t('attack');
  magicButton.textContent = t('magic');
  mobileAttackButton.textContent = t('attack');
  mobileMagicButton.textContent = t('magic');
  dodgeButton.textContent = t('dodge');
  blockButton.textContent = t('block');
  duelLobbyButtonEl.textContent = t('onlineMatch');
  p2pHostButtonEl.textContent = t('createRoom');
  p2pJoinButtonEl.textContent = t('joinRoom');
  p2pCopyInviteButtonEl.textContent = t('copyLink');
  p2pRefreshButtonEl.textContent = t('refreshLobby');
  p2pRoomNameGroupEl.querySelector('label')!.textContent = t('newRoomName');
  p2pRoomNameEl.placeholder = t('roomNamePlaceholder');
  p2pState.helpText = t('p2pDefaultHelp');
  for (const enemy of enemies) {
    enemy.label = getEnemyLabel(enemy.kind);
  }
  syncSoundToggleUi();
  syncUtilityMenu();
  syncP2pUi();
  syncHud();
}

function setRuntimeLanguage(language: GameLanguage, options: { persist?: boolean; announce?: boolean } = {}) {
  const changed = language !== currentLanguage;
  currentLanguage = language;

  if (options.persist !== false) {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage failures in private mode.
    }
  }

  syncRuntimeText();
  if (options.announce && changed) {
    setOverlay(t('languageChanged'));
  }
}

window.addEventListener('storage', (event) => {
  if (event.key !== LANGUAGE_STORAGE_KEY) {
    return;
  }

  const nextLanguage = normalizeRuntimeLanguage(event.newValue);
  if (nextLanguage) {
    setRuntimeLanguage(nextLanguage, { persist: false, announce: true });
  }
});

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
    setOverlay(t('soundEnabled'));
    return;
  }

  setMasterVolume(0, 0.08);
  setOverlay(t('soundDisabled'));
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

function hideDuelResultPanel() {
  duelResultPanelEl.hidden = true;
}

function showDuelResultPanel(result: 'win' | 'lose') {
  duelResultPanelEl.hidden = false;
  duelResultPanelEl.dataset.result = result;
  duelResultBadgeEl.textContent = result === 'win' ? 'VICTORY' : 'DEFEAT';
  duelResultTitleEl.textContent = result === 'win' ? t('win') : t('lose');
  duelResultSummaryEl.textContent = result === 'win' ? t('duelWinSummary') : t('duelLoseSummary');
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
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the legacy copy path for browsers that expose the API but reject the call.
    }
  }

  const textarea = document.createElement('textarea');
  const selection = document.getSelection();
  const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.border = '0';
  textarea.style.padding = '0';
  textarea.style.opacity = '0.01';
  textarea.style.fontSize = '16px';
  document.body.append(textarea);
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand('copy');
  textarea.remove();
  if (selection && selectedRange) {
    selection.removeAllRanges();
    selection.addRange(selectedRange);
  }

  if (!copied) {
    throw new Error('Clipboard copy failed');
  }
}

function buildInviteLink(roomId: string) {
  return new URL(`${GAME_PLAY_PATH}?room=${encodeURIComponent(roomId)}`, window.location.origin).toString();
}

async function copyInviteLink() {
  if (p2pState.role !== 'host' || !p2pState.roomId) {
    flashP2pHelp(t('createRoomBeforeCopy'));
    return;
  }

  const inviteLink = buildInviteLink(p2pState.roomId);
  try {
    await copyTextToClipboard(inviteLink);
    flashP2pHelp(t('inviteCopied'));
  } catch {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('inviteShareTitle'),
          text: t('inviteShareText'),
          url: inviteLink,
        });
        flashP2pHelp(t('shareOpened'));
        return;
      } catch {
        // Keep the copy failure message when the share sheet is unavailable or canceled.
      }
    }
    flashP2pHelp(t('inviteCopyFailed'));
  }
}

function syncUtilityMenu() {
  menuPanel.hidden = !utilityMenuOpen;
  menuToggleButton.setAttribute('aria-expanded', String(utilityMenuOpen));
  menuMatchButton.textContent = p2pPanelEl.hidden ? t('onlineMatch') : t('closeOnlineMatch');
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

function revealP2pPanel() {
  p2pPanelEl.hidden = false;
  p2pState.collapsed = false;
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
      return t('loadingLobby');
    case 'creating-room':
      return t('creatingRoom');
    case 'joining':
      return t('joining');
    case 'waiting-peer':
      return t('waitingPeer');
    case 'connecting':
      return t('connecting');
    case 'connected':
      return t('connected');
    case 'error':
      return t('error');
    default:
      return t('offline');
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
  p2pConnectedIndicatorTextEl.textContent = t('matchJoined');
}

function enterCompactMatchModeUi() {
  p2pPanelEl.hidden = true;
  p2pState.collapsed = true;
  utilityMenuOpen = false;
}

function syncP2pUi() {
  const canCopyInvite = p2pState.role === 'host' && p2pState.roomId !== null;
  const isRoomContext = p2pState.roomId !== null;
  const canRematch = p2pState.connected && gameMode === 'duel' && state.finished;
  p2pPanelEl.dataset.collapsed = String(p2pState.collapsed);
  p2pPanelEl.dataset.context = isRoomContext ? 'room' : 'lobby';
  p2pToggleEl.textContent = p2pState.collapsed ? t('p2pOpen') : t('p2pClose');
  p2pToggleEl.setAttribute('aria-expanded', String(!p2pState.collapsed));
  p2pStatusEl.textContent = getStatusLabel(p2pState.status);
  p2pRoleEl.textContent = getRoleLabel(p2pState.role);
  p2pLobbyActionsEl.hidden = isRoomContext;
  p2pRoomActionsEl.hidden = !isRoomContext;
  p2pRoomNameGroupEl.hidden = isRoomContext;
  p2pLobbyToolsEl.hidden = isRoomContext;
  p2pCopyInviteButtonEl.hidden = !canCopyInvite;
  p2pCopyInviteButtonEl.disabled = !canCopyInvite || p2pState.status === 'creating-room';
  const isWaitingForRematch = p2pState.rematchRequested && !p2pState.peerRematchRequested;
  p2pRematchButtonEl.hidden = !canRematch;
  p2pRematchButtonEl.disabled = !canRematch || isWaitingForRematch;
  p2pRematchButtonEl.textContent = p2pState.peerRematchRequested
    ? t('acceptRematch')
    : p2pState.rematchRequested
      ? t('waitingRequest')
      : t('rematch');
  duelRematchButtonEl.textContent = p2pState.peerRematchRequested
    ? t('acceptRematch')
    : p2pState.rematchRequested
      ? t('waitingRequest')
      : t('rematch');
  duelRematchButtonEl.disabled = !canRematch || isWaitingForRematch;
  p2pDisconnectButtonEl.textContent =
    p2pState.status === 'waiting-peer' ? t('cancelWaiting') : p2pState.connected ? t('endMatch') : t('disconnect');
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
      position: new THREE.Vector3(3.2, 0, -8.2),
      rotationY: 0,
    };
  }

  return {
    position: new THREE.Vector3(-3.2, 0, 8.2),
    rotationY: Math.PI,
  };
}

function getRemoteSpawnPosition(localRole: P2PRole) {
  return getDuelSpawnPosition(localRole === 'guest' ? 'host' : 'guest');
}

function waitForIceGatheringComplete(peerConnection: RTCPeerConnection, timeoutMs = P2P_ICE_GATHERING_TIMEOUT_MS) {
  return new Promise<void>((resolve) => {
    let resolved = false;
    let timeoutId: number | null = null;
    const finish = () => {
      if (resolved) {
        return;
      }
      resolved = true;
      peerConnection.removeEventListener('icegatheringstatechange', onStateChange);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      resolve();
    };
    const onStateChange = () => {
      if (peerConnection.iceGatheringState === 'complete') {
        finish();
      }
    };

    if (peerConnection.iceGatheringState === 'complete') {
      finish();
      return;
    }

    peerConnection.addEventListener('icegatheringstatechange', onStateChange);
    timeoutId = window.setTimeout(finish, timeoutMs);
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
  p2pState.hostHeartbeatFailures = 0;
  p2pState.pendingRemoteAnswer = null;
  p2pState.rematchRequested = false;
  p2pState.peerRematchRequested = false;
}

function clearPeerDisconnectTimer() {
  if (p2pState.peerDisconnectTimerId !== null) {
    window.clearTimeout(p2pState.peerDisconnectTimerId);
    p2pState.peerDisconnectTimerId = null;
  }
}

function schedulePeerDisconnectGrace(peerConnection: RTCPeerConnection) {
  if (p2pState.peerDisconnectTimerId !== null) {
    return;
  }

  p2pState.peerDisconnectTimerId = window.setTimeout(() => {
    p2pState.peerDisconnectTimerId = null;
    if (peerConnection.connectionState === 'disconnected' || peerConnection.iceConnectionState === 'disconnected') {
      disconnectP2P(true);
    }
  }, P2P_DISCONNECT_GRACE_MS);
}

function closePeerConnectionOnly() {
  clearPeerDisconnectTimer();
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
    p2pState.peerConnection.oniceconnectionstatechange = null;
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
  p2pState.hostHeartbeatFailures = 0;
}

function stopLobbyRefresh() {
  if (p2pState.lobbyRefreshTimerId !== null) {
    window.clearInterval(p2pState.lobbyRefreshTimerId);
    p2pState.lobbyRefreshTimerId = null;
  }
}

function stopGuestRoomPoll() {
  if (p2pState.guestRoomPollTimerId !== null) {
    window.clearInterval(p2pState.guestRoomPollTimerId);
    p2pState.guestRoomPollTimerId = null;
  }
}

function startGuestRoomPoll(roomId: string) {
  stopGuestRoomPoll();
  let failures = 0;
  p2pState.guestRoomPollTimerId = window.setInterval(async () => {
    if (p2pState.role !== 'guest' || p2pState.roomId !== roomId || p2pState.connected) {
      stopGuestRoomPoll();
      return;
    }

    try {
      const response = await fetchLobbyRoom(roomId);
      failures = 0;
      if (response.room.status === 'connected') {
        setP2pStatus('connecting', t('hostAccepted'));
        syncP2pUi();
      } else if (response.room.status === 'open') {
        setP2pStatus('error', t('hostReopened'));
        stopGuestRoomPoll();
        syncP2pUi();
      }
    } catch {
      failures += 1;
      if (failures >= 3) {
        setP2pStatus('error', t('roomStatusFailed'));
        stopGuestRoomPoll();
        syncP2pUi();
      }
    }
  }, P2P_GUEST_ROOM_POLL_INTERVAL_MS);
}

function roomTimeLabel(room: MultiplayerRoomSummary) {
  return new Date(room.updatedAt).toLocaleTimeString(currentLanguage === 'en' ? 'en-US' : 'ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function roomStatusLabel(room: MultiplayerRoomSummary) {
  if (room.status === 'open') {
    return t('roomOpen');
  }
  if (room.status === 'joining') {
    return t('roomJoining');
  }
  return t('roomFighting');
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
      gameSlug: GAME_SLUG,
      title: p2pRoomNameEl.value.trim() || t('myRoom'),
      hostDisplayName: t('me'),
      status: 'open',
      createdAt: now,
      updatedAt: now,
      lastHeartbeatAt: now,
    } satisfies MultiplayerRoomSummary);
  const item = document.createElement('div');
  item.className = 'p2p-room-card p2p-room-card--owned';
  const guestLabel = room.guestDisplayName ? t('guestJoined', { name: room.guestDisplayName }) : '';
  const statusLabel = p2pState.connected
    ? t('matchConnected')
    : guestLabel
      ? p2pState.status === 'connecting'
        ? t('guestConnecting', { label: guestLabel })
        : t('guestAnswerPending', { label: guestLabel })
      : p2pState.status === 'connecting'
        ? t('connectionPreparing')
        : t('waitingGuest');
  appendRoomCardContent(item, room, statusLabel, t('roomOwnedByMe'));
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
          ? t('guestWaiting')
          : t('matchPreparing')
        : t('noRooms');
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
        setOverlay(t('selectedRoomJoinOverlay'));
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        setP2pStatus('error', message || t('roomJoinFailed'));
        syncP2pUi();
        setOverlay(message || t('roomJoinFailed'));
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
  setP2pStatus('loading-lobby', t('lobbyLoadingHelp'));
  syncP2pUi();
  try {
    p2pState.rooms = (await fetchLobbyRooms(GAME_SLUG)).filter((room) => room.id !== p2pState.roomId);
    if (p2pState.selectedRoomId && !p2pState.rooms.some((room) => room.id === p2pState.selectedRoomId)) {
      p2pState.selectedRoomId = p2pState.rooms[0]?.id ?? null;
    }
    if (!p2pState.selectedRoomId && p2pState.rooms[0]) {
      p2pState.selectedRoomId = p2pState.rooms[0].id;
    }
    setP2pStatus('offline', t('chooseRoom'));
    syncP2pUi();
    if (showOverlay) {
      setOverlay(t('lobbyRefreshed'));
    }
  } catch {
    p2pState.rooms = [];
    setP2pStatus('error', t('lobbyLoadFailed'));
    syncP2pUi();
    if (showOverlay) {
      setOverlay(t('lobbyLoadFailed'));
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
  resetState();
  createSceneAssets();
  updateCamera();
  syncHud();
}

function disconnectP2P(showOverlay = true) {
  const roomId = p2pState.roomId;
  closePeerConnectionOnly();
  stopHostHeartbeat();
  stopGuestRoomPoll();
  leaveDuelMode();
  p2pState.role = 'solo';
  if (roomId) {
    void closeLobbyRoom(roomId).catch(() => undefined);
  }
  setP2pStatus('offline', t('chooseRoom'));
  clearP2pRuntimeState();
  void refreshLobby(false);
  syncP2pUi();
  if (roomId) {
    notifyMultiplayerRoomCleared();
  }
  if (showOverlay) {
    setOverlay(t('leftOnline'));
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

  setOverlay(kind === 'magic' ? t('incomingMagic', { hp: Math.round(state.health) }) : t('incomingMelee', { hp: Math.round(state.health) }));
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

      const targetPosition = fromNetVector3(message.payload.position);
      applyObstacleCollisions(targetPosition, PLAYER_RADIUS);
      remotePeerAvatar.targetPosition.copy(targetPosition);
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
    case 'REMATCH_REQUEST':
      if (!state.finished) {
        return;
      }

      if (p2pState.rematchRequested) {
        acceptRematch();
        return;
      }

      p2pState.peerRematchRequested = true;
      revealP2pPanel();
      setP2pStatus('connected', t('rematchPeerRequested'));
      duelResultSummaryEl.textContent = t('rematchPeerSummary');
      setOverlay(t('rematchPeerOverlay'));
      syncP2pUi();
      return;
    case 'REMATCH_ACCEPT':
      if (!state.finished) {
        return;
      }

      restartDuelMatch();
      return;
    default:
      return;
  }
}

function setupDataChannel(channel: RTCDataChannel) {
  p2pState.dataChannel = channel;
  channel.onopen = () => {
    clearPeerDisconnectTimer();
    stopGuestRoomPoll();
    p2pState.connected = true;
    setP2pStatus('connected', t('peerConnected'));
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
    setP2pStatus('error', t('dataChannelError'));
    syncP2pUi();
  };
  channel.onmessage = (event) => {
    try {
      handleP2pMessage(JSON.parse(String(event.data)) as P2PMessage);
    } catch {
      setOverlay(t('peerMessageFailed'));
    }
  };
}

function attachPeerConnectionHandlers(peerConnection: RTCPeerConnection) {
  const syncPeerConnectionState = () => {
    if (peerConnection.connectionState === 'connected') {
      clearPeerDisconnectTimer();
      p2pState.connected = true;
      setP2pStatus('connected', t('peerConnected'));
    } else if (peerConnection.connectionState === 'connecting') {
      setP2pStatus('connecting', t('peerConnecting'));
    } else if (peerConnection.connectionState === 'disconnected') {
      p2pState.connected = false;
      setP2pStatus('connecting', t('networkUnstable'));
      schedulePeerDisconnectGrace(peerConnection);
    } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
      disconnectP2P(true);
    }
    syncP2pUi();
  };

  peerConnection.onconnectionstatechange = syncPeerConnectionState;
  peerConnection.oniceconnectionstatechange = () => {
    if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
      clearPeerDisconnectTimer();
      return;
    }

    if (peerConnection.iceConnectionState === 'disconnected') {
      p2pState.connected = false;
      setP2pStatus('connecting', t('networkUnstable'));
      schedulePeerDisconnectGrace(peerConnection);
      syncP2pUi();
    } else if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
      disconnectP2P(true);
    }
  };

  peerConnection.ondatachannel = (event) => {
    setupDataChannel(event.channel);
  };
}

function createPeerConnection(role: Exclude<P2PRole, 'solo'>) {
  closePeerConnectionOnly();
  stopGuestRoomPoll();
  p2pState.role = role;
  p2pState.connected = false;
  const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
  p2pState.peerConnection = peerConnection;
  attachPeerConnectionHandlers(peerConnection);

  if (role === 'host') {
    setupDataChannel(peerConnection.createDataChannel(`${GAME_SLUG}-duel`));
  }

  syncP2pUi();
  return peerConnection;
}

async function createHostRoom() {
  const peerConnection = createPeerConnection('host');
  setP2pStatus('creating-room', t('publishingOffer'));
  syncP2pUi();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  await waitForIceGatheringComplete(peerConnection);
  const localDescription = peerConnection.localDescription;
  if (!localDescription) {
    throw new Error('Failed to create room offer');
  }

  const response = await createLobbyRoom({
    gameSlug: GAME_SLUG,
    offer: JSON.stringify(localDescription.toJSON()),
    title: p2pRoomNameEl.value.trim() || undefined,
  });
  p2pState.roomId = response.room.id;
  p2pState.hostedRoom = response.room;
  p2pState.selectedRoomId = null;
  p2pState.rooms = p2pState.rooms.filter((room) => room.id !== response.room.id);
  setP2pStatus('waiting-peer', t('hostRoomCreated'));
  stopHostHeartbeat();
  p2pState.hostHeartbeatTimerId = window.setInterval(() => {
    void heartbeatHostRoom();
  }, P2P_HOST_HEARTBEAT_INTERVAL_MS);
  void heartbeatHostRoom();
  syncP2pUi();
  notifyMultiplayerRoomCreated(response.room.id);
}

function failHostHeartbeatRoom(roomId: string) {
  closePeerConnectionOnly();
  stopHostHeartbeat();
  stopGuestRoomPoll();
  leaveDuelMode();
  p2pState.role = 'solo';
  void closeLobbyRoom(roomId).catch(() => undefined);
  clearP2pRuntimeState();
  setP2pStatus('error', t('hostSignalFailed'));
  revealP2pPanel();
  syncP2pUi();
  notifyMultiplayerRoomCleared();
}

async function heartbeatHostRoom() {
  if (!p2pState.roomId || p2pState.role !== 'host' || !p2pState.peerConnection) {
    return;
  }

  try {
    const response = await heartbeatLobbyRoom(p2pState.roomId);
    p2pState.hostHeartbeatFailures = 0;
    p2pState.hostedRoom = response.room;
    p2pState.rooms = p2pState.rooms.filter((room) => room.id !== response.room.id);
    if (response.room.guestDisplayName && !p2pState.connected && p2pState.status === 'waiting-peer') {
      setP2pStatus('connecting', t('peerJoinedStatus', { name: response.room.guestDisplayName }));
      revealP2pPanel();
      setOverlay(t('peerJoinedOverlay', { name: response.room.guestDisplayName }));
    }
    if (response.answer && response.answer !== p2pState.pendingRemoteAnswer) {
      await p2pState.peerConnection.setRemoteDescription(JSON.parse(response.answer) as RTCSessionDescriptionInit);
      p2pState.pendingRemoteAnswer = response.answer;
      setP2pStatus('connecting', t('answerApplied'));
      revealP2pPanel();
      syncP2pUi();
    }
    syncP2pUi();
  } catch {
    p2pState.hostHeartbeatFailures += 1;
    if (p2pState.hostHeartbeatFailures < P2P_HOST_HEARTBEAT_FAILURE_LIMIT) {
      setP2pStatus('connecting', t('hostSignalDelayed'));
      syncP2pUi();
      return;
    }

    failHostHeartbeatRoom(p2pState.roomId);
  }
}

async function joinRoomById(roomId: string) {
  if (!roomId) {
    setOverlay(t('selectRoomFirst'));
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

  setP2pStatus('joining', t('preparingJoin'));
  syncP2pUi();

  const roomSignal = await fetchLobbyRoom(roomId);
  if (!roomSignal.offer) {
    throw new Error('Room offer missing');
  }

  const peerConnection = createPeerConnection('guest');
  p2pState.roomId = roomSignal.room.id;
  p2pState.selectedRoomId = roomSignal.room.id;
  setP2pStatus('joining', t('applyingOffer'));
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
  setP2pStatus('connecting', t('joinRequested'));
  startGuestRoomPoll(roomSignal.room.id);
  syncP2pUi();
}

async function joinSelectedRoom() {
  if (!p2pState.selectedRoomId) {
    setOverlay(t('selectRoomFirst'));
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
  const defaults = cloneMapConfig(getActiveLevel()?.map ?? DEFAULT_MAP_CONFIG);
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
    resetState({ preserveLevel: true, preserveMap: true });
    createSceneAssets();
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

function stripSceneHelpers(root: THREE.Group) {
  const removable: THREE.Object3D[] = [];
  root.traverse((node) => {
    if (node instanceof THREE.Light || node instanceof THREE.Camera) {
      removable.push(node);
    }
  });

  for (const node of removable) {
    node.parent?.remove(node);
  }
}

function stripNamedMeshes(root: THREE.Group, names: string[]) {
  const nameSet = new Set(names);
  const removable: THREE.Object3D[] = [];
  root.traverse((node) => {
    if (node instanceof THREE.Mesh && nameSet.has(node.name)) {
      removable.push(node);
    }
  });

  for (const node of removable) {
    node.parent?.remove(node);
  }
}

function normalizeBiomeTemplate(root: THREE.Group, config: { scale: number; stripMeshes?: string[] }) {
  stripSceneHelpers(root);
  if (config.stripMeshes?.length) {
    stripNamedMeshes(root, config.stripMeshes);
  }

  root.scale.setScalar(config.scale);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= box.min.y;
  root.position.z -= center.z;

  const wrapper = new THREE.Group();
  wrapper.add(root);
  prepareTemplate(wrapper);
  return wrapper;
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
    'banner',
    'barrel',
    'character-human',
    'character-orc',
    'chest',
    'coin',
    'column',
    'dirt',
    'floor',
    'floor-detail',
    'gate',
    'rocks',
    'shield-rectangle',
    'shield-round',
    'stairs',
    'stones',
    'trap',
    'wall',
    'wall-half',
    'wall-narrow',
    'wall-opening',
    'weapon-spear',
    'weapon-sword',
    'wood-structure',
    'wood-support',
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

  await Promise.all(
    (Object.keys(BIOME_MODEL_CONFIGS) as BiomeModelKey[]).map(async (key) => {
      const root = await fbxLoader.loadAsync(biomeModelUrl(key));
      templates.set(key, {
        scene: normalizeBiomeTemplate(root, BIOME_MODEL_CONFIGS[key]),
        animations: [],
      });
    }),
  );

  await loadHumanRollAnimation().catch(() => undefined);
}

function cloneTemplate(name: TemplateKey, skinned = false) {
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

function tuneEnemyWeapon(weapon: THREE.Group, weaponKey: EnemyWeaponKey) {
  if (weaponKey !== 'spear') {
    return;
  }

  weapon.position.y -= 0.04;
  weapon.rotation.z += degToRad(8);
  weapon.scale.multiplyScalar(1.14);
}

function attachShieldToLeftArm(mesh: THREE.Group, shield: THREE.Group, shieldKey: EnemyShieldKey) {
  const mount = new THREE.Group();
  mount.name = 'shield-mount';
  const armLeft = mesh.getObjectByName('arm-left');

  if (armLeft) {
    armLeft.add(mount);
  } else {
    mesh.add(mount);
  }

  mount.position.set(0.14, 0.08, 0.02);
  mount.rotation.set(degToRad(16), degToRad(-42), degToRad(72));
  shield.position.set(0, 0, 0);
  shield.rotation.set(degToRad(2), degToRad(0), degToRad(shieldKey === 'rectangle' ? 88 : 78));
  shield.scale.setScalar(shieldKey === 'rectangle' ? 1.1 : 0.92);
  mount.add(shield);
  return mount;
}

function getEnemyLabel(kind: EnemyKind | undefined) {
  switch (kind) {
    case 'scout':
      return t('enemyScout');
    case 'spearman':
      return t('enemySpearman');
    case 'brute':
      return t('enemyBrute');
    case 'warden':
      return t('enemyWarden');
    default:
      return t('enemyGuard');
  }
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

function pushOutOfRectObstacle(position: THREE.Vector3, radius: number, obstacle: RectObstacle) {
  const minX = obstacle.x - obstacle.halfWidth;
  const maxX = obstacle.x + obstacle.halfWidth;
  const minZ = obstacle.z - obstacle.halfDepth;
  const maxZ = obstacle.z + obstacle.halfDepth;
  const closestX = THREE.MathUtils.clamp(position.x, minX, maxX);
  const closestZ = THREE.MathUtils.clamp(position.z, minZ, maxZ);
  const dx = position.x - closestX;
  const dz = position.z - closestZ;
  const distanceSq = dx * dx + dz * dz;

  if (distanceSq > radius * radius) {
    return;
  }

  if (distanceSq > 0.000001) {
    const distance = Math.sqrt(distanceSq);
    const push = (radius - distance) / distance;
    position.x += dx * push;
    position.z += dz * push;
    return;
  }

  const distances = [
    { axis: 'x' as const, direction: -1, value: Math.abs(position.x - minX) },
    { axis: 'x' as const, direction: 1, value: Math.abs(maxX - position.x) },
    { axis: 'z' as const, direction: -1, value: Math.abs(position.z - minZ) },
    { axis: 'z' as const, direction: 1, value: Math.abs(maxZ - position.z) },
  ].sort((left, right) => left.value - right.value);
  const nearest = distances[0];
  if (!nearest) {
    return;
  }

  if (nearest.axis === 'x') {
    position.x = nearest.direction < 0 ? minX - radius : maxX + radius;
    return;
  }

  position.z = nearest.direction < 0 ? minZ - radius : maxZ + radius;
}

function applyObstacleCollisions(position: THREE.Vector3, radius: number, skip?: CircleObstacle) {
  for (let pass = 0; pass < 2; pass += 1) {
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

    for (const obstacle of wallObstacles) {
      pushOutOfRectObstacle(position, radius, obstacle);
    }
  }

  clampToRoom(position, radius);
}

function isBlockedByRectObstacle(position: THREE.Vector3, radius: number, obstacle: RectObstacle) {
  const closestX = THREE.MathUtils.clamp(position.x, obstacle.x - obstacle.halfWidth, obstacle.x + obstacle.halfWidth);
  const closestZ = THREE.MathUtils.clamp(position.z, obstacle.z - obstacle.halfDepth, obstacle.z + obstacle.halfDepth);
  const dx = position.x - closestX;
  const dz = position.z - closestZ;
  return dx * dx + dz * dz <= radius * radius;
}

function isBlockedByObstacle(position: THREE.Vector3, radius: number) {
  for (const obstacle of obstacles) {
    const dx = position.x - obstacle.x;
    const dz = position.z - obstacle.z;
    if (dx * dx + dz * dz <= (obstacle.radius + radius) * (obstacle.radius + radius)) {
      return true;
    }
  }

  for (const obstacle of wallObstacles) {
    if (isBlockedByRectObstacle(position, radius, obstacle)) {
      return true;
    }
  }

  return false;
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

function addWallObstacle(wall: WallSegmentConfig) {
  if (wall.opening) {
    return;
  }

  const vertical = THREE.MathUtils.euclideanModulo(wall.rotationQuarter, 2) === 1;
  const halfLength = wall.half ? 0.48 : 0.56;
  const halfThickness = wall.narrow ? 0.16 : wall.half ? 0.18 : 0.22;
  wallObstacles.push({
    x: wall.x,
    z: wall.z,
    halfWidth: vertical ? halfThickness : halfLength,
    halfDepth: vertical ? halfLength : halfThickness,
  });
}

function addFloorTile(world: THREE.Group, x: number, z: number, detail = false) {
  const tile = cloneTemplate(detail ? 'floor-detail' : 'floor');
  tile.position.set(x, 0, z);
  world.add(tile);
}

function addWallSegment(world: THREE.Group, x: number, z: number, rotationY = 0, half = false, opening = false, narrow = false) {
  const wall = cloneTemplate(opening ? 'wall-opening' : half ? 'wall-half' : narrow ? 'wall-narrow' : 'wall');
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
    case 'forest-pack':
    case 'grass-1':
    case 'grass-2':
    case 'plant-1':
    case 'plant-4':
    case 'plant-5':
    case 'terrain-1':
    case 'terrain-2':
      return 0;
    case 'tree-1':
    case 'tree-2':
    case 'tree-3':
      return 0.62;
    case 'bush-1':
    case 'bush-2':
    case 'bush-3':
      return 0.42;
    case 'rock-1':
    case 'rock-3':
    case 'rock-6':
      return 0.58;
    case 'mountain-1':
    case 'mountain-2':
    case 'mountain-3':
      return 1.15;
    case 'banner':
      return 0.18;
    case 'column':
      return 0.44;
    case 'barrel':
      return 0.42;
    case 'dirt':
      return 0;
    case 'rocks':
      return 0.58;
    case 'stones':
      return 0.54;
    case 'trap':
      return 0.52;
    case 'wood-structure':
      return 0.62;
    case 'wood-support':
      return 0.34;
    default:
      return 0.4;
  }
}

function isWallLikeTool(tool: MapTool) {
  return tool === 'wall' || tool === 'wall-half' || tool === 'wall-narrow' || tool === 'wall-opening' || tool === 'gate';
}

function snapCenterPoint(point: THREE.Vector3) {
  return {
    x: THREE.MathUtils.clamp(Math.round(point.x), -10, 10),
    z: THREE.MathUtils.clamp(Math.round(point.z), -12, 11),
  } satisfies GridPoint;
}

function snapWallPoint(point: THREE.Vector3, rotationQuarter: number) {
  const vertical = THREE.MathUtils.euclideanModulo(rotationQuarter, 2) === 1;
  return vertical
    ? ({
        x: THREE.MathUtils.clamp(Math.floor(point.x) + 0.5, -10.5, 10.5),
        z: THREE.MathUtils.clamp(Math.round(point.z), -11, 11),
      } satisfies GridPoint)
    : ({
        x: THREE.MathUtils.clamp(Math.round(point.x), -10, 10),
        z: THREE.MathUtils.clamp(Math.floor(point.z) + 0.5, -11.5, 11.5),
      } satisfies GridPoint);
}

function getSnappedPointForTool(point: THREE.Vector3, tool: MapTool, rotationQuarter = currentMapRotationQuarter) {
  if (tool === 'gate') {
    return {
      x: THREE.MathUtils.clamp(Math.round(point.x), -10, 10),
      z: -11.55,
    } satisfies GridPoint;
  }

  if (tool === 'exit') {
    return {
      x: THREE.MathUtils.clamp(Math.round(point.x), -10, 10),
      z: -12.35,
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
  resetState({ preserveLevel: true, preserveMap: true });
  createSceneAssets();
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
    case 'wall-narrow':
    case 'wall-opening': {
      dungeonMapConfig.walls = dungeonMapConfig.walls.filter(
        (wall) => Math.abs(wall.x - snapped.x) > 0.001 || Math.abs(wall.z - snapped.z) > 0.001,
      );
      dungeonMapConfig.walls.push({
        ...snapped,
        rotationQuarter: currentMapRotationQuarter,
        half: currentMapTool === 'wall-half',
        narrow: currentMapTool === 'wall-narrow',
        opening: currentMapTool === 'wall-opening',
      });
      break;
    }
    case 'column':
    case 'banner':
    case 'barrel':
    case 'dirt':
    case 'rocks':
    case 'stones':
    case 'wood-structure':
    case 'wood-support':
    case 'forest-pack':
    case 'tree-1':
    case 'tree-2':
    case 'tree-3':
    case 'bush-1':
    case 'bush-2':
    case 'bush-3':
    case 'grass-1':
    case 'grass-2':
    case 'plant-1':
    case 'plant-4':
    case 'plant-5':
    case 'rock-1':
    case 'rock-3':
    case 'rock-6':
    case 'mountain-1':
    case 'mountain-2':
    case 'mountain-3':
    case 'terrain-1':
    case 'terrain-2':
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
  applyLevelVisualTheme();
  const world = new THREE.Group();
  obstacles.length = 0;
  wallObstacles.length = 0;
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
      wall.narrow,
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
    if (prop.radius > 0) {
      addCircularObstacle(prop.x, prop.z, prop.radius);
    }
  }

  if (!isDuelMode) {
    addCircularObstacle(dungeonMapConfig.chest.x, dungeonMapConfig.chest.z, 0.66);
  }

  for (const wall of dungeonMapConfig.walls) {
    addWallObstacle(wall);
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
      const weaponKey = spot.weapon ?? (spot.kind === 'spearman' || spot.kind === 'warden' ? 'spear' : 'sword');
      const shieldKey = spot.shield ?? (spot.kind === 'brute' ? 'round' : spot.kind === 'warden' ? 'rectangle' : undefined);
      const weapon = cloneTemplate(weaponKey === 'spear' ? 'weapon-spear' : 'weapon-sword');
      const shield = shieldKey ? cloneTemplate(shieldKey === 'rectangle' ? 'shield-rectangle' : 'shield-round') : null;
      const animations = getTemplateAnimations('character-orc');
      mesh.position.copy(getMapPointVector(spot));
      mesh.rotation.y = rotationQuarterToRadians(spot.rotationQuarter ?? (index % 2 === 0 ? 1 : 3));
      mesh.scale.setScalar(spot.scale ?? 1);
      const weaponMount = attachWeaponToRightArm(mesh, weapon);
      tuneEnemyWeapon(weapon, weaponKey);
      if (shield && shieldKey) {
        attachShieldToLeftArm(mesh, shield, shieldKey);
      }
      const rig = createCharacterRig(mesh, weaponMount, weapon, animations);
      world.add(mesh);
      enemies.push({
        mesh,
        weapon,
        shield,
        rig,
        kind: spot.kind,
        label: getEnemyLabel(spot.kind),
        hp: spot.hp,
        maxHp: spot.hp,
        speed: spot.speed,
        damage: spot.damage ?? 14,
        radius: spot.radius ?? ENEMY_RADIUS,
        aggroRange: spot.aggroRange ?? 4.8,
        attackRange: spot.attackRange ?? 1.18,
        attackIntervalMs: spot.attackIntervalMs ?? 1200,
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
  applyObstacleCollisions(player.position, PLAYER_RADIUS);
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

function resetState(options: { preserveLevel?: boolean; preserveMap?: boolean } = {}) {
  const nextLevelIndex = options.preserveLevel ? state.levelIndex : 0;
  state.running = false;
  state.started = false;
  state.finished = false;
  state.waitingReward = false;
  state.reviveAvailable = true;
  state.finalized = false;
  state.score = 0;
  state.elapsedMs = 0;
  state.levelIndex = nextLevelIndex;
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
  state.totalTimeMs = gameMode === 'duel' ? DUEL_TOTAL_TIME_MS : SOLO_TOTAL_TIME_MS;
  if (gameMode === 'solo' && !options.preserveMap) {
    applyLevelMap(state.levelIndex);
  }
  updateVirtualJoystickUi();
  hideDuelResultPanel();
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
  applyObstacleCollisions(mesh.position, PLAYER_RADIUS);
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
    targetPosition: mesh.position.clone(),
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
  dungeonMapConfig = cloneMapConfig(DUEL_MAP_CONFIG);
  p2pState.rematchRequested = false;
  p2pState.peerRematchRequested = false;
  resetState({ preserveMap: true });
  createSceneAssets();
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
    applyObstacleCollisions(sceneAssets.player.position, PLAYER_RADIUS);
  }
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

function restartDuelMatch() {
  if (!p2pState.connected || !p2pState.dataChannel || p2pState.dataChannel.readyState !== 'open') {
    setOverlay(t('rematchDisconnectedStart'));
    return;
  }

  startDuelMode();
  enterCompactMatchModeUi();
  setP2pStatus('connected', t('rematchStarted'));
  setOverlay(t('rematchStartOverlay'));
  sendDuelSnapshot();
  syncP2pUi();
}

function acceptRematch() {
  if (!p2pState.connected) {
    return;
  }

  if (!sendP2pMessage({ type: 'REMATCH_ACCEPT' })) {
    setOverlay(t('rematchDisconnectedStart'));
    syncP2pUi();
    return;
  }

  restartDuelMatch();
}

function requestRematch() {
  if (!p2pState.connected || gameMode !== 'duel' || !state.finished) {
    flashP2pHelp(t('rematchAvailableAfterEnd'));
    return;
  }

  if (p2pState.peerRematchRequested) {
    acceptRematch();
    return;
  }

  if (!sendP2pMessage({ type: 'REMATCH_REQUEST' })) {
    setOverlay(t('rematchDisconnectedRequest'));
    syncP2pUi();
    return;
  }

  p2pState.rematchRequested = true;
  setP2pStatus('connected', t('rematchRequested'));
  duelResultSummaryEl.textContent = t('rematchRequestedSummary');
  flashP2pHelp(t('rematchRequestedHelp'));
  syncP2pUi();
}

function finishDuel(result: 'win' | 'lose') {
  if (gameMode !== 'duel' || state.finished) {
    return;
  }

  state.running = false;
  state.finished = true;
  state.finalized = true;
  pursuedRemotePeer = false;
  p2pState.rematchRequested = false;
  p2pState.peerRematchRequested = false;
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
    setOverlay(t('victory'));
  } else {
    playCue('defeat');
    setOverlay(t('defeat'));
  }
  showDuelResultPanel(result);
  revealP2pPanel();
  syncP2pUi();
}

function syncHud() {
  if (gameMode === 'duel') {
    const remoteHealth = remotePeerAvatar ? Math.max(0, Math.round(remotePeerAvatar.health)) : 100;
    const remoteMana = remotePeerAvatar ? Math.max(0, Math.round(remotePeerAvatar.mana)) : 80;
    objectiveEl.textContent = t('duelObjective');
    questEl.textContent = p2pState.connected
      ? t('remoteHud', { hp: remoteHealth, mana: remoteMana })
      : t('waitingRemote');
    scoreEl.textContent = state.score.toLocaleString();
    timerEl.textContent = formatTime(state.totalTimeMs - state.elapsedMs);
    healthFillEl.style.width = `${(state.health / state.maxHealth) * 100}%`;
    healthLabelEl.textContent = `${Math.max(0, Math.round(state.health))} / ${state.maxHealth}`;
    manaFillEl.style.width = `${(state.mana / state.maxMana) * 100}%`;
    manaLabelEl.textContent = `${Math.max(0, Math.round(state.mana))} / ${state.maxMana}`;
    return;
  }

  const aliveEnemies = enemies.filter((enemy) => enemy.alive).length;
  const activeLevel = getActiveLevel();
  const levelLabel = isCustomMapMode()
    ? t('custom')
    : `${state.levelIndex + 1}/${DUNGEON_LEVELS.length} ${activeLevel ? localize(activeLevel.name) : t('fallbackJourney')}`;
  const stageText = aliveEnemies > 0
    ? t('guardianProgress', { defeated: state.enemiesDefeated, total: enemies.length })
    : !state.chestOpen
      ? t('openChest')
      : isFinalLevel()
        ? t('escapeStairs')
        : t('nextGate');

  objectiveEl.textContent = `${t('gameTitle')} · ${levelLabel}`;
  questEl.textContent = `${stageText} · ${t('coins', { count: state.coinsCollected, total: coins.length })}`;
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
    setOverlay(t('peerTooFar'));
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
  setOverlay(remotePeerAvatar.health <= 0 ? t('peerDefeated') : t('peerMeleeHit', { hp: Math.round(remotePeerAvatar.health) }));
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
  addScore(isFinalLevel() ? 620 : 420);
  playCue('chest');
  spawnEffect(getMapPointVector(dungeonMapConfig.chest), '#ffe27a');
  setOverlay(isFinalLevel() ? t('finalChestOpened') : t('chestOpened'));
  return true;
}

function advanceToNextLevel() {
  if (!sceneAssets || isFinalLevel()) {
    return false;
  }

  const clearedLevel = getActiveLevel();
  const nextLevelIndex = state.levelIndex + 1;
  const preservedScore = state.score + 540 + nextLevelIndex * 180;
  const preservedElapsedMs = state.elapsedMs;
  const preservedReviveAvailable = state.reviveAvailable;
  const nextHealth = Math.min(state.maxHealth, state.health + 24);
  const nextMana = Math.min(state.maxMana, state.mana + 42);

  state.levelIndex = nextLevelIndex;
  applyLevelMap(nextLevelIndex);
  state.gateOpen = false;
  state.chestOpen = false;
  state.coinsCollected = 0;
  state.enemiesDefeated = 0;
  state.moveTarget = null;
  state.attackCooldownMs = 0;
  state.magicCooldownMs = 0;
  state.playerHurtMs = 0;
  state.rollCooldownMs = 0;
  state.reviveAvailable = preservedReviveAvailable;
  clearPursuedEnemy();
  clearMagicProjectiles();
  createSceneAssets();
  state.score = preservedScore;
  state.elapsedMs = preservedElapsedMs;
  state.health = nextHealth;
  state.mana = nextMana;
  state.started = true;
  state.running = true;
  state.finished = false;
  state.waitingReward = false;
  state.finalized = false;
  updateCamera();
  syncHud();
  playCue('victory');
  spawnEffect(sceneAssets.player.position, '#7dffb3');
  setOverlay(clearedLevel ? localize(clearedLevel.clearText) : t('nextFloorFallback'));
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
      levelIndex: state.levelIndex,
      levelName: getActiveLevel() ? localize(getActiveLevel()!.name) : 'custom',
      levelsCompleted: reason === 'escaped' ? DUNGEON_LEVELS.length : state.levelIndex,
      coinsCollected: state.coinsCollected,
      enemiesDefeated: state.enemiesDefeated,
      chestOpened: state.chestOpen,
      gateOpened: state.gateOpen,
    },
  });

  if (allowRevive && state.reviveAvailable) {
    state.waitingReward = true;
    setOverlay(t('reviveOffer'));
    requestRewardedAd('REVIVE');
    return;
  }

  state.finalized = true;
  setOverlay(reason === 'escaped' ? t('escapedScoreSubmitted') : t('runEndedScoreSubmitted'));
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
  setOverlay(t('reviveDone'));
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
    preferredEnemy && preferredEnemy.alive && preferredEnemy.mesh.position.distanceTo(sceneAssets.player.position) <= 1.08 + preferredEnemy.radius
      ? preferredEnemy
      : getNearestAliveEnemy(1.42);

  state.attackCooldownMs = 540;
  sceneAssets.playerRig.attackMs = sceneAssets.playerRig.attackDurationMs;
  playCue('attack');
  const attackOrigin = sceneAssets.player.position.clone();
  attackOrigin.y = 0.08;
  spawnEffect(attackOrigin, '#8fd7ff');

  if (!enemy) {
    playCue('miss');
    setOverlay(t('emptySwing'));
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
        ? t('allGuardiansDown')
        : t('defeatedEnemy', { enemy: enemy.label, remaining: enemies.length - state.enemiesDefeated }),
    );
    if (pursuedEnemy === enemy) {
      clearPursuedEnemy();
    }
    return true;
  }

  addScore(36);
  setOverlay(t('enemyHit', { enemy: enemy.label, hp: enemy.hp, maxHp: enemy.maxHp }));
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
    setOverlay(kind === 'magic' ? t('dodgeMagic') : t('dodgeAttack'));
    return false;
  }

  let actualDamage = amount;
  if (isPlayerBlockingAgainst(sourcePosition)) {
    actualDamage = kind === 'magic' ? Math.max(2, Math.round(amount * 0.45)) : 0;
    playCue('miss');
    spawnEffect(sceneAssets.player.position.clone().add(new THREE.Vector3(0, 0.08, 0)), '#cbe7ff');
    if (actualDamage <= 0) {
      setOverlay(t('blockMelee'));
      return false;
    }
    setOverlay(t('blockSuccess', { hp: Math.max(0, Math.round(state.health - actualDamage)) }));
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
    setOverlay(t('rollMissing'));
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
    setOverlay(t('rollNeedsDirection'));
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
  setOverlay(t('rolling'));
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
    setOverlay(t('manaLow'));
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
  setOverlay(t('magicCast'));
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
  const next = current.clone();
  const distance = Math.max(0, speed * deltaSeconds);
  const steps = Math.max(1, Math.ceil(distance / 0.18));
  const stepDistance = distance / steps;

  for (let step = 0; step < steps; step += 1) {
    next.addScaledVector(desiredDirection, stepDistance);
    applyObstacleCollisions(next, radius);
  }

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
      if (targetDistance <= 0.94 + pursuedEnemy.radius) {
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
    if (planarDistance < enemy.aggroRange) {
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

    if (desiredDirection.lengthSq() > 0 && planarDistance > enemy.attackRange) {
      const previousPosition = enemy.mesh.position.clone();
      const nextPosition = moveCharacterWithCollision(enemy.mesh.position, desiredDirection, enemy.speed, deltaSeconds, enemy.radius);
      enemy.mesh.position.copy(nextPosition);
      faceDirection(enemy.mesh, desiredDirection);
      enemy.rig.moveSpeed = previousPosition.distanceTo(nextPosition) / Math.max(deltaSeconds, 0.0001);
    } else {
      enemy.rig.moveSpeed = 0;
    }

    enemy.mesh.position.y = 0;

    if (planarDistance <= enemy.attackRange && enemy.attackCooldownMs <= 0) {
      enemy.attackCooldownMs = enemy.attackIntervalMs;
      enemy.rig.attackMs = enemy.rig.attackDurationMs;
      const applied = resolveIncomingPlayerDamage(enemy.damage, 'melee', enemy.mesh.position);
      if (!applied) {
        continue;
      }
      setOverlay(t('enemyAttack', { enemy: enemy.label, hp: Math.round(state.health) }));

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
      setOverlay(t('coinCollected', { count: state.coinsCollected, total: coins.length }));
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

      const blockedByObstacle = isBlockedByObstacle(position, projectile.radius * 0.72);

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
            setOverlay(remotePeerAvatar.health <= 0 ? t('peerMagicDefeated') : t('peerMagicHit', { hp: Math.round(remotePeerAvatar.health) }));
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
          if (distance > projectile.radius + enemy.radius + 0.18) {
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
                ? t('magicLastGuardian')
                : t('magicEnemyDefeated', { enemy: enemy.label, remaining: enemies.length - state.enemiesDefeated }),
            );
          } else {
            addScore(28);
            setOverlay(t('magicEnemyHit', { enemy: enemy.label, hp: enemy.hp, maxHp: enemy.maxHp }));
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
    if (advanceToNextLevel()) {
      return;
    }
    addScore(1400 + Math.max(0, Math.round((state.totalTimeMs - state.elapsedMs) / 150)));
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
        setOverlay(t('pursuePeer'));
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
    if (sceneAssets && tappedEnemy.mesh.position.distanceTo(sceneAssets.player.position) <= 1.02 + tappedEnemy.radius) {
      attemptEnemyAttack(tappedEnemy);
    } else {
      setOverlay(t('pursueEnemy'));
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
  languageSelectEl.addEventListener('change', (event) => {
    event.stopPropagation();
    const nextLanguage = normalizeRuntimeLanguage((event.target as HTMLSelectElement).value);
    if (nextLanguage) {
      setRuntimeLanguage(nextLanguage, { announce: true });
    }
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
      setOverlay(t('hostRoomOverlay'));
    } catch {
      setP2pStatus('error', t('hostRoomFailed'));
      syncP2pUi();
      setOverlay(t('roomCreateFailed'));
    }
  });
  p2pJoinButtonEl.addEventListener('pointerdown', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      void unlockAudio();
      await joinSelectedRoom();
      setP2pCollapsed(false);
      setOverlay(t('selectedRoomJoinOverlay'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setP2pStatus('error', message || t('roomJoinFailed'));
      syncP2pUi();
      setOverlay(message || t('roomJoinFailed'));
    }
  });
  p2pRefreshButtonEl.addEventListener('pointerdown', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await refreshLobby(true);
    } catch {
      setOverlay(t('refreshFailed'));
    }
  });
  p2pCopyInviteButtonEl.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await copyInviteLink();
  });
  p2pRematchButtonEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void unlockAudio();
    requestRematch();
  });
  duelRematchButtonEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void unlockAudio();
    requestRematch();
  });
  duelLobbyButtonEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    revealP2pPanel();
    setP2pCollapsed(false);
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
    setOverlay(t('shareJoinRequested'));
  } catch (error) {
    const message = error instanceof Error ? error.message : t('shareJoinFailed');
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
      setOverlay(t('noReviveEnded'));
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
  syncRuntimeText();
  syncSoundToggleUi();
  syncP2pUi();
  setOverlay(t('loadingAssets'));
  await loadTemplates();
  resetState();
  createSceneAssets();
  resizeRenderer();
  updateCamera();
  syncHud();
  setOverlay(getActiveLevel() ? localize(getActiveLevel()!.intro) : t('startHint'));
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
