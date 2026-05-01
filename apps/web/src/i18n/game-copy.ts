import type { GameCatalogItem } from '@casual-game-world/shared';

import { currentLanguage, type LocalizedText, type SupportedLanguage, translate } from './language';

const heroJourneyCopy: {
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
} = {
  title: {
    ko: '용사의 여정',
    en: "Hero's Journey",
  },
  shortDescription: {
    ko: '기존 던전 4구간 이후 숲, 사막 협곡, 산길로 이어지는 저폴리 액션 RPG',
    en: 'A low-poly action RPG that starts in the dungeon, then expands into forest, desert canyon, and mountain pass stages.',
  },
  description: {
    ko: '용사의 여정은 기존 던전 액션 구조를 유지하면서 야외 환경 에셋 스테이지를 확장한 저폴리 액션 RPG입니다. 입구 회랑, 무너진 채석장, 오래된 금고, 오크 대장 방을 돌파한 뒤 숲의 들머리, 사막 협곡, 바람산 고갯길로 이어지는 여정을 진행합니다.',
    en: "Hero's Journey keeps the original dungeon action loop and adds outdoor stages built from the forest, desert canyon, and mountain assets. Clear the gate hall, collapsed quarry, old vault, and orc keep, then continue through the forest edge, sunken canyon, and wind pass.",
  },
};

const localizedGameCopies = new Map<string, typeof heroJourneyCopy>([['hero-journey', heroJourneyCopy]]);

export function getLocalizedGameCopy(game: GameCatalogItem, language: SupportedLanguage = currentLanguage.value) {
  const copy = localizedGameCopies.get(game.slug);
  if (!copy) {
    return {
      title: game.title,
      shortDescription: game.shortDescription,
      description: game.description,
    };
  }

  return {
    title: translate(copy.title, language),
    shortDescription: translate(copy.shortDescription, language),
    description: translate(copy.description, language),
  };
}

export function getLocalizedInputLabel(input: GameCatalogItem['inputs'][number], language: SupportedLanguage = currentLanguage.value) {
  const labels: Record<GameCatalogItem['inputs'][number], LocalizedText> = {
    keyboard: { ko: '키보드', en: 'Keyboard' },
    mouse: { ko: '마우스', en: 'Mouse' },
    touch: { ko: '터치', en: 'Touch' },
  };

  return translate(labels[input], language);
}

export function getLocalizedModeLabel(mode: GameCatalogItem['modes'][number], language: SupportedLanguage = currentLanguage.value) {
  const labels: Record<GameCatalogItem['modes'][number], LocalizedText> = {
    normal: { ko: '일반', en: 'Normal' },
    hard: { ko: '하드', en: 'Hard' },
    'time-attack': { ko: '타임어택', en: 'Time Attack' },
  };

  return translate(labels[mode], language);
}
