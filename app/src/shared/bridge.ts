import type {FilePort} from '../platform/files';
export interface DesktopBridge extends FilePort{
  openRegistration():Promise<void>;
  setDirty(dirty:boolean):void;
  onCloseRequested(handler:()=>void):()=>void;
  confirmClose():Promise<void>;
}
declare global{interface Window{ttap?:DesktopBridge;}}
