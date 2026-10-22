import {contextBridge,ipcRenderer} from 'electron';
import type {DesktopBridge} from '../shared/bridge';
const bridge:DesktopBridge={
  pickHtml:()=>ipcRenderer.invoke('ttap:pick-html'),
  openProject:()=>ipcRenderer.invoke('ttap:open-project'),
  exportProject:project=>ipcRenderer.invoke('ttap:export-project',project),
  setDirty:dirty=>ipcRenderer.send('ttap:set-dirty',dirty),
  onCloseRequested(handler){const listener=()=>handler();ipcRenderer.on('ttap:close-requested',listener);return ()=>ipcRenderer.removeListener('ttap:close-requested',listener);},
  confirmClose:()=>ipcRenderer.invoke('ttap:confirm-close'),
};
contextBridge.exposeInMainWorld('ttap',bridge);
