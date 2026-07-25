import { useCallback, useState } from 'react';
import original from 'react95/dist/themes/original';
import { Theme } from 'react95/dist/types';
import { deepMerge, DeepPartial } from './helper';
import type { Child, SubsonicAPI as SubsonicAPIType } from 'subsonic-api' with {
  'resolution-mode': 'import',
};

export type GlobalReducer = [
  GlobalState,
  (toModify: DeepPartial<GlobalState>) => void,
];
export interface GlobalState {
  apiReady: boolean;
  config: {
    theme: Theme;
  };
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
    todo: boolean;
  };
}

const initialConfiguration: GlobalState = {
  apiReady: false,
  config: { theme: original },
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
