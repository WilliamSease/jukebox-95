import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
document.getElementById('root')?.setAttribute('style', 'height:100%');
const root = createRoot(container);
root.render(
  <div
    style={{ width: '100%', height: '100%' }}
    onContextMenu={(e) => e.preventDefault()}
  >
    <App />
  </div>,
);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg: any) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
