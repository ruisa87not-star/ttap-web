import {session,WebContentsView,type BrowserWindow} from 'electron';
import type {FileOutcome,HtmlSource} from '../shared/model';
import {UTAR_REGISTRATION_URL,type RegistrationBounds,type RegistrationStatus} from '../shared/registration';

export interface RegistrationPort{
  open():void;
  setBounds(bounds:unknown):void;
  status():RegistrationStatus;
  reload():void;
  readPage():Promise<FileOutcome<HtmlSource>>;
}

export function isRegistrationURL(value:string):boolean{
  try{const url=new URL(value);return url.origin==='https://unitreg.utar.edu.my'&&!url.username&&!url.password;}catch{return false;}
}
export function isScheduleURL(value:string):boolean{
  return isRegistrationURL(value)&&new URL(value).pathname==='/portal/courseRegStu/schedule/masterSchedule.jsp';
}

// Presentation only: keep UTAR's real form, scripts, CAPTCHA and submission intact.
const loginCSS=`
  html, body { margin:0 !important; padding:0 !important; min-width:0 !important; background:white; }
  body { padding:12px 0 8px !important; }
  #body_col { width:100% !important; }
  #body_col > table, body > br, body > table { display:none !important; }
  #body_col h2 { margin:0 0 32px !important; text-align:center; font-size:32px; font-weight:400; }
  body > div:not(#body_col):not(:has(form)):not(:has(>strong)) { display:none !important; }
  form { margin:0; }
  form > table { width:calc(100% - 32px) !important; max-width:824px; table-layout:fixed; }
  form input:not([type=hidden]):not([type=submit]):not([type=reset]) { width:min(256px, 96%); box-sizing:border-box; }
  form img { max-width:96%; height:auto; }
  body > div:has(>strong) { margin-top:8px; text-align:center; }
  @media(max-width:480px) { #body_col h2 { font-size:24px; margin-bottom:20px !important; } form > table { width:calc(100% - 12px) !important; } form td { overflow-wrap:anywhere; } }
`;

export function createRegistrationView(window:BrowserWindow):RegistrationPort{
  let view:WebContentsView|undefined;let loading=false;let error='';
  function load(){
    if(!view||view.webContents.isDestroyed())return;
    loading=true;error='';
    void view.webContents.loadURL(UTAR_REGISTRATION_URL).catch(()=>{loading=false;error='UTAR could not be loaded. Check your connection and choose Reload.';});
  }
  function open(){
    if(view&&!view.webContents.isDestroyed())return;
    const isolated=session.fromPartition('ttap-registration',{cache:false});
    isolated.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
    isolated.setPermissionCheckHandler(()=>false);
    isolated.on('will-download',event=>event.preventDefault());
    view=new WebContentsView({webPreferences:{session:isolated,sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,allowRunningInsecureContent:false,webviewTag:false}});
    view.setBackgroundColor('#ffffff');view.setVisible(false);window.contentView.addChildView(view);
    const wc=view.webContents;
    const guard=(event:Electron.Event,url:string)=>{if(!isRegistrationURL(url)){event.preventDefault();error='This page tried to leave the UTAR registration website. Use Reload to return.';view?.setVisible(false);}};
    wc.on('will-navigate',guard);wc.on('will-redirect',guard);
    wc.setWindowOpenHandler(({url})=>{if(isRegistrationURL(url))void wc.loadURL(url).catch(()=>{error='The UTAR page could not be loaded.';});return {action:'deny'};});
    wc.on('did-start-loading',()=>{loading=true;});
    wc.on('did-stop-loading',()=>{loading=false;});
    wc.on('did-finish-load',()=>{error='';});
    wc.on('dom-ready',()=>{
      if(isRegistrationURL(wc.getURL())&&new URL(wc.getURL()).pathname==='/portal/courseRegStu/login.jsp'){
        void wc.insertCSS(loginCSS).catch(()=>{ /* The original page remains usable if its presentation changes. */ });
      }
    });
    wc.on('did-fail-load',(_event,code,_description,_url,isMainFrame)=>{if(isMainFrame&&code!==-3){loading=false;error='UTAR could not be loaded. Check your connection and choose Reload.';view?.setVisible(false);}});
    wc.on('will-attach-webview',event=>event.preventDefault());
    load();
  }
  function setBounds(value:unknown){
    if(!view||view.webContents.isDestroyed())return;
    if(!value||typeof value!=='object'){view.setVisible(false);return;}
    const {x,y,width,height}=value as RegistrationBounds;
    const [contentWidth,contentHeight]=window.getContentSize();
    if(![x,y,width,height].every(Number.isFinite)||x<0||y<48||width<1||height<1||x+width>contentWidth+1||y+height>contentHeight+1){view.setVisible(false);return;}
    view.setBounds({x:Math.ceil(x),y:Math.ceil(y),width:Math.max(1,Math.floor(Math.min(width,contentWidth-Math.ceil(x)))),height:Math.max(1,Math.floor(Math.min(height,contentHeight-Math.ceil(y))))});
    view.setVisible(!error);
  }
  window.on('resize',()=>view?.setVisible(false));
  window.on('closed',()=>{if(view&&!view.webContents.isDestroyed())view.webContents.close();view=undefined;});
  async function readPage():Promise<FileOutcome<HtmlSource>>{
    if(!view||view.webContents.isDestroyed())return {status:'error',message:'Open the registration page first.'};
    const wc=view.webContents;const url=wc.getURL();
    if(!isScheduleURL(url))return {status:'error',message:'Open Course Timetable Preview in UTAR before importing. Login pages are not imported.'};
    try{
      const text:unknown=await wc.executeJavaScript(`(()=>{
        if(document.querySelector('input[type="password"]'))return null;
        const table=document.querySelector('#overviewSector table');
        return table?'<div id="overviewSector">'+table.outerHTML+'</div>':null;
      })()`);
      if(wc.isDestroyed()||wc.getURL()!==url)return {status:'error',message:'The page changed. Open the timetable preview and try again.'};
      if(text===null)return {status:'error',message:'UTAR is showing a login form or no course table. Sign in and open Course Timetable Preview.'};
      if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>10*1024*1024)return {status:'error',message:'The course page exceeds the 10 MiB import limit.'};
      return {status:'ok',value:{name:'UTAR course schedule',text}};
    }catch{return {status:'error',message:'The timetable page could not be read. Try Reload, or import saved HTML.'};}
  }
  return {open,setBounds,status:()=>({loading,error}),reload:()=>{open();load();},readPage};
}
