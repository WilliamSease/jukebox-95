import { createSlice, createSelector, configureStore } from '@reduxjs/toolkit';
import original from 'react95/dist/themes/original';
import { Theme } from 'react95/dist/types';
interface appState {
  theme: Theme;
  tracksInPlayer: any[];
  playerView: 'individual' | 'group';
  showAlbumArt: boolean;
  errorMessage: string | null;
}

const initialState: appState = {
  theme: original,
  tracksInPlayer: [],
  playerView: 'individual',
  showAlbumArt: true,
  errorMessage: null,

};

const appSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setToPlayer: (state, action) => {
      state.tracksInPlayer = action.payload;
    },
    appendToPlayer: (state, action) => {
      state.tracksInPlayer.push(...action.payload);
    },
    togglePlayerView: (state) => {
      state.playerView =
        state.playerView === 'individual' ? 'group' : 'individual';
    },
    toggleShowAlbumArt: (state) => {
      state.showAlbumArt = !state.showAlbumArt;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
  },
});

export const {
  setTheme,
  setToPlayer,
  appendToPlayer,
  togglePlayerView,
  toggleShowAlbumArt,
  setErrorMessage
} = appSlice.actions;

export const selectTheme = createSelector(
  (state: appState) => state.theme,
  (theme) => theme,
);

export const selectTracksInPlayer = createSelector(
  (state: appState) => state.tracksInPlayer,
  (tracksInPlayer) => tracksInPlayer,
);

export const selectPlayerView = createSelector(
  (state: appState) => state.playerView,
  (playerView) => playerView,
);

export const selectShowAlbumArt = createSelector(
  (state: appState) => state.showAlbumArt,
  (showAlbumArt) => showAlbumArt,
);

export const selectErrorMessage = createSelector(
  (state: appState) => state.errorMessage,
  (errorMessage) => errorMessage
);

const store = configureStore({
  reducer: appSlice.reducer,
});

export default store;
