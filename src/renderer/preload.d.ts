import { ElectronHandler, LocalLibraryBridge } from '../main/preload';
import { SubsonicBridge } from '../main/preload';
import { SettingsBridge } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    subsonic: SubsonicBridge;
    settings: SettingsBridge;
    localLibrary: LocalLibraryBridge;
  }
}

declare global {
  interface Window {
    appInfo: {
      getVersion: () => Promise<string>;
    };
  }
}