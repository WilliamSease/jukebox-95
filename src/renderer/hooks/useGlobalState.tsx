import { useCallback, useState } from 'react';
import original from 'react95/dist/themes/original';
import { Theme } from 'react95/dist/types';
import { deepMerge, DeepPartial } from './helper';
import type { SubsonicAPI as SubsonicAPIType } from 'subsonic-api' with { 'resolution-mode': 'import' };

export type GlobalReducer = [
  GlobalState,
  (toModify: DeepPartial<GlobalState>) => void,
];
export interface GlobalState {
  api: SubsonicAPIType | null;
  config: {
    theme: Theme;
  };
  ui: {
    playerView: 'individual' | 'group';
    showAlbumArt: boolean;
    errorMessage: string | null;
    leftPanelBigger: boolean;
  };
  player: {
    tracksInPlayer: any[];
    nowPlaying: any;
  };
  windowOpen: {
    about: boolean;
    art: boolean;
    auth: boolean;
    contact: boolean;
    focus: boolean;
    help: boolean;
    network: boolean;
    settings: boolean;
    todo: boolean;
  };
}

const initialConfiguration: GlobalState = {
  api: null,
  config: { theme: original },
  ui: {
    playerView: 'individual',
    showAlbumArt: false,
    errorMessage: null,
    leftPanelBigger: false,
  },
  player: {
    tracksInPlayer: [],
    nowPlaying: {},
  },
  windowOpen: {
    about: false,
    art: false,
    auth: false,
    contact: false,
    focus: false,
    help: false,
    network: false,
    settings: false,
    todo: false,
  },
};

export function useConfiguration(
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

export default useConfiguration;
