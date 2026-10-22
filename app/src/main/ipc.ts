import {dialog,ipcMain,shell,type BrowserWindow,type IpcMainInvokeEvent} from 'electron';
import {basename} from 'node:path';
import {validateProject} from '../shared/project';
import {readHtmlPaths,readProjectText,writeProjectAtomically} from './files';
import type {FileOutcome} from '../shared/model';
import {UTAR_REGISTRATION_URL} from '../shared/registration';

export function registerMainIpc(window:BrowserWindow,trustedURL:string,hooks:{setDirty:(dirty:boolean)=>void;confirmClose:()=>void}){
  function verify(event:Pick<IpcMainInvokeEvent,'sender'|'senderFrame'>){
    const actual=new URL(event.senderFrame?.url??'about:blank');actual.hash='';
    const expected=new URL(trustedURL);expected.hash='';
    if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||actual.href!==expected.href)throw new Error('Untrusted IPC sender.');
  }
  async function outcome<T>(action:()=>Promise<FileOutcome<T>>):Promise<FileOutcome<T>>{
    try{return await action();}catch{return {status:'error',message:'The file operation failed. Check the file format, size (10 MiB maximum), and folder permissions.'};}
  }
  // No renderer-supplied URL: this capability opens only the official login page.
  ipcMain.handle('ttap:open-registration',async event=>{verify(event);await shell.openExternal(UTAR_REGISTRATION_URL);});
  ipcMain.handle('ttap:pick-html',async event=>{verify(event);return outcome(async()=>{
    const result=await dialog.showOpenDialog(window,{title:'Import UTAR schedule',properties:['openFile','multiSelections'],filters:[{name:'HTML pages',extensions:['html','htm']}]});
    return result.canceled?{status:'cancelled'}:{status:'ok',value:await readHtmlPaths(result.filePaths)};
  });});
  ipcMain.handle('ttap:open-project',async event=>{verify(event);return outcome(async()=>{
    const result=await dialog.showOpenDialog(window,{title:'Open timetable project',properties:['openFile'],filters:[{name:'TTAP project',extensions:['ttap.json','json']}]});
    return result.canceled||!result.filePaths[0]?{status:'cancelled'}:{status:'ok',value:await readProjectText(result.filePaths[0])};
  });});
  ipcMain.handle('ttap:export-project',async(event,payload:unknown)=>{verify(event);const checked=validateProject(payload);
    if(!checked.ok)return {status:'error',message:checked.errors.join(' ')};
    return outcome(async()=>{
      const result=await dialog.showSaveDialog(window,{title:'Save timetable project',defaultPath:'my-timetable.ttap.json',filters:[{name:'TTAP project',extensions:['ttap.json']}]});
      if(result.canceled||!result.filePath)return {status:'cancelled'};
      await writeProjectAtomically(result.filePath,checked.value);return {status:'ok',value:{kind:'saved' as const,name:basename(result.filePath)}};
    });
  });
  ipcMain.on('ttap:set-dirty',(event,value:unknown)=>{try{verify(event);if(typeof value==='boolean')hooks.setDirty(value);}catch{/* Ignore unauthorized one-way messages. */}});
  ipcMain.handle('ttap:confirm-close',async event=>{verify(event);hooks.confirmClose();});
}
