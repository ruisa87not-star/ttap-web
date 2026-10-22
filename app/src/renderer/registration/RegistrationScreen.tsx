import {useEffect,useRef,useState} from 'react';
import type {HtmlSource} from '../../shared/model';
import {UTAR_REGISTRATION_URL,type RegistrationStatus} from '../../shared/registration';

export function RegistrationScreen({onSource,suspended}:{onSource:(source:HtmlSource)=>void;suspended:boolean}){
  const slot=useRef<HTMLDivElement>(null);const[status,setStatus]=useState<RegistrationStatus>({loading:true,error:''});
  const[error,setError]=useState('');const[busy,setBusy]=useState(false);const bridge=window.ttap;
  const request=useRef(0);
  useEffect(()=>()=>{++request.current;},[]);
  useEffect(()=>{if(suspended){++request.current;setBusy(false);}},[suspended]);
  useEffect(()=>{
    if(!bridge)return;
    if(suspended){bridge.setRegistrationBounds(null);return;}
    let active=true;let failed=false;
    const measure=()=>{const rect=slot.current?.getBoundingClientRect();if(active)bridge.setRegistrationBounds(rect&&!failed?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null);};
    async function poll(){
      try{const next=await bridge!.getRegistrationStatus();if(active){failed=!!next.error;setStatus(next);measure();}}
      catch{if(active){failed=true;setStatus({loading:false,error:'The registration view is unavailable. Return to import and try again.'});measure();}}
    }
    const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(measure);if(slot.current)observer?.observe(slot.current);
    window.addEventListener('resize',measure);
    void bridge.openRegistration().then(()=>{if(active){measure();void poll();}}).catch(()=>{if(active)setStatus({loading:false,error:'The registration view could not be opened.'});});
    const timer=setInterval(()=>void poll(),1000);
    return ()=>{active=false;clearInterval(timer);observer?.disconnect();window.removeEventListener('resize',measure);bridge.setRegistrationBounds(null);};
  },[bridge,suspended]);
  async function preview(){
    if(!bridge)return;const id=++request.current;setBusy(true);setError('');
    try{const result=await bridge.readRegistrationPage();if(id!==request.current)return;if(result.status==='ok')onSource(result.value);else if(result.status==='error')setError(result.message);}
    catch{if(id===request.current)setError('The course page could not be read. Try again or import saved HTML.');}finally{if(id===request.current)setBusy(false);}
  }
  async function reload(){
    ++request.current;setBusy(false);setError('');setStatus({loading:true,error:''});
    try{await bridge?.reloadRegistration();}catch{setStatus({loading:false,error:'The registration page could not be reloaded.'});}
  }
  return <section className="registration-screen" aria-label="Integrated course registration">
    <div className="registration-toolbar"><div><h2>Course Registration System</h2><p>Sign in below, then open Course Timetable Preview.</p></div><div className="actions">
      {bridge&&<><button onClick={reload}>Reload</button><button className="primary" disabled={busy} onClick={preview}>{busy?'Reading page…':'Preview courses from this page'}</button></>}
    </div></div>
    {error&&<p className="error" role="alert">{error}</p>}
    {bridge?<><p className="registration-status" role="status">{status.error|| (status.loading?'Loading the official UTAR website…':'UTAR website · Your login stays in this isolated view.')}</p>
      <div className="registration-slot" ref={slot}>{status.error&&<div className="registration-error"><h2>UTAR is unavailable</h2><p>Check your connection, then choose Reload. You can also return to import saved HTML.</p></div>}</div></>:
      <><p className="registration-status">If UTAR blocks embedding in your browser, <a href={UTAR_REGISTRATION_URL} target="_blank" rel="noopener noreferrer">open the official page</a>, then import its saved HTML. Browser pages cannot be read across sites.</p><iframe className="registration-frame" title="UTAR Course Registration System" src={UTAR_REGISTRATION_URL} sandbox="allow-scripts allow-forms allow-same-origin" referrerPolicy="no-referrer" hidden={suspended}/></>}
  </section>;
}
