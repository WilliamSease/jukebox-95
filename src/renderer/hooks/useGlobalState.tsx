import { useCallback, useState } from 'react';
import original from 'react95/dist/themes/original';
import { Theme } from 'react95/dist/types';
import { deepMerge, DeepPartial } from './helper';
import type { Child, SubsonicAPI as SubsonicAPIType } from 'subsonic-api' with {
  'resolution-mode': 'import',
};
import * as Themes from 'react95/dist/themes';

export type GlobalReducer = [
  GlobalState,
  (toModify: DeepPartial<GlobalState>) => void,
];

export type CachedSettingsType = [string, SettingsType][];

export interface SettingsType {
  theme: Theme;
  showBackgroundImage: boolean;
  backgroundImageBase64: string;
  backgroundSizeStrategy: string;
  backgroundCustomCSS: string;
  solidTextBackground: boolean;
  solidTextBackgroundOverride: string;
}

export const SettingsDefault: SettingsType = {
  theme: Object.entries(Themes.default).find(([str]) => str === 'original')![1],
  showBackgroundImage: false,
  backgroundImageBase64: '',
  backgroundSizeStrategy: 'cover',
  backgroundCustomCSS: '',
  solidTextBackground: false,
  solidTextBackgroundOverride: '',
};

export interface GlobalState {
  apiReady: boolean;
  settings: SettingsType;
  userCachedSettings: CachedSettingsType;

  useSubsonic: boolean;
  libraryPath: string;

  ui: {
    showTracksIndividually: boolean;
    showAlbumArt: boolean;
    errorMessage: string | null;
    leftPanelBigger: boolean;
  };
  player: {
    tracksInPlayer: Child[];
    nowPlaying: Child | null;
    progress: number;
  };
  windowOpen: {
    about: boolean;
    art: boolean;
    contact: boolean;
    focus: boolean;
    help: boolean;
    settings: boolean;
    tryMe: boolean;
    todo: boolean;
  };
}

const initialConfiguration: GlobalState = {
  apiReady: false,
  settings: SettingsDefault,
  userCachedSettings: [],
  useSubsonic: true,
  libraryPath: '',
  ui: {
    showTracksIndividually: false,
    showAlbumArt: true,
    errorMessage: null,
    leftPanelBigger: false,
  },
  player: {
    tracksInPlayer: [],
    nowPlaying: null,
    progress: 0,
  },
  windowOpen: {
    about: false,
    art: false,
    contact: false,
    focus: false,
    help: false,
    settings: false,
    todo: false,
    tryMe: false,
  },
};

export function useGlobalState(
  overrides?: DeepPartial<GlobalState>,
): GlobalReducer {
  const [configuration, setConfiguration] = useState<GlobalState>(() =>
    overrides
      ? deepMerge(initialConfiguration, overrides)
      : initialConfiguration,
  );

  const dispatch = useCallback((toModify: DeepPartial<GlobalState>) => {
    setConfiguration((prev) => deepMerge(prev, toModify));
  }, []);

  return [configuration, dispatch];
}

export default useGlobalState;
