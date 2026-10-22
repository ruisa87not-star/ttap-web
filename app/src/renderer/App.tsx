import {useEffect,useRef,useState} from 'react';
import type {HtmlSource,Project} from '../shared/model';
import {decodeProject} from '../shared/project';
import {getFilePort} from '../platform/files';
import {ImportPanel} from './import/ImportPanel';
import {Planner} from './planner/Planner';
import {ProjectActions,ProjectDialog} from './ProjectActions';
import {Tutorial} from './help/Tutorial';
import {RegistrationScreen} from './registration/RegistrationScreen';

type View='tutorial'|'import'|'planner'|'registration';

export function App(){
  const [project,setProject]=useState<Project|null>(null);
  const [baseline,setBaseline]=useState('');const [views,setViews]=useState<View[]>(['tutorial']);
  const [importKey,setImportKey]=useState(0);const main=useRef<HTMLElement>(null);
  const [registrationSources,setRegistrationSources]=useState<HtmlSource[]|undefined>();
  const view=views.at(-1)!;
  function navigate(next:View){setViews(previous=>previous.at(-1)===next?previous:[...previous,next]);}
  function back(){setViews(previous=>previous.length>1?previous.slice(0,-1):previous);}
  function finishTutorial(){if(views.length===1)navigate('import');else back();}
  useEffect(()=>{main.current?.querySelector<HTMLElement>(`[data-view="${view}"] h1`)?.focus();},[view]);
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const [pending,setPending]=useState<{run:()=>void}|null>(null);
  const [download,setDownload]=useState<{snapshot:string;name:string;continueAfter:boolean}|null>(null);
  const current=useRef(project);current.current=project;
  const snapshot=project?JSON.stringify(project):'';const dirty=!!project&&snapshot!==baseline;
  const currentDirty=useRef(dirty);currentDirty.current=dirty;
  useEffect(()=>{
    if(window.ttap){window.ttap.setDirty(dirty);return;}
    if(!dirty)return;
    const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};
    window.addEventListener('beforeunload',warn);return ()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  useEffect(()=>window.ttap?.onCloseRequested(()=>{
    if(busy)return;
    const run=()=>{setPending(null);void window.ttap?.confirmClose();};
    if(dirty)setPending({run});else run();
  }),[dirty,busy]);
  function replace(next:Project,clean:boolean){
    const run=()=>{setProject(next);setBaseline(clean?JSON.stringify(next):'');navigate('planner');setPending(null);setError('');setNotice('');};
    if(currentDirty.current)setPending({run});else run();
  }
  async function open(){
    setBusy(true);setError('');
    try{
      const result=await getFilePort().openProject();
      if(result.status==='error')setError(result.message);
      if(result.status==='ok'){
        const decoded=decodeProject(result.value.text);
        if(decoded.ok)replace(decoded.value,true);else setError(decoded.errors.join(' '));
      }
    }catch{setError('The project could not be opened.');}finally{setBusy(false);}
  }
  async function exportCurrent(continueAfter=false){
    if(!project)return;
    const savedSnapshot=JSON.stringify(project);setBusy(true);setError('');
    try{
      const result=await getFilePort().exportProject(project);
      if(result.status==='error')setError(result.message);
      if(result.status==='ok'){
        if(result.value.kind==='downloaded')setDownload({snapshot:savedSnapshot,name:result.value.name,continueAfter});
        else{
          setBaseline(savedSnapshot);setNotice(`Saved ${result.value.name}.`);
          if(continueAfter&&JSON.stringify(current.current)===savedSnapshot)pending?.run();
        }
      }
    }catch{setError('The project could not be exported.');}finally{setBusy(false);}
  }
  function keptDownload(){
    if(!download)return;
    setBaseline(download.snapshot);setNotice(`Exported ${download.name}.`);setDownload(null);
    if(download.continueAfter&&JSON.stringify(current.current)===download.snapshot)pending?.run();
  }
  return <><header className="app-header"><div className="header-start">
      {views.length>1&&<button className="back-button quiet" aria-label="Go back" onClick={back}><span aria-hidden="true">←</span> Back</button>}
      <a className="brand" href="#" aria-label="TTAP UTAR timetable planner" onClick={e=>{e.preventDefault();navigate('import');}}><span className="brand-mark" aria-hidden="true">▦</span>TTAP<span className="brand-description">UTAR timetable planner</span></a>
    </div>{view!=='tutorial'&&<button className="quiet tutorial-button" onClick={()=>navigate('tutorial')}>Tutorial</button>}</header>
    <main ref={main}><div className="project-bar" hidden={view==='tutorial'||view==='registration'}><ProjectActions hasProject={!!project} dirty={dirty} busy={busy} onOpen={open} onImport={()=>{setImportKey(k=>k+1);setRegistrationSources(undefined);navigate('import');}} onExport={()=>exportCurrent()}/></div>
      {error&&!pending&&<p className="error app-message" role="alert">{error}</p>}{notice&&<p className="app-message" role="status">{notice}</p>}
      {view==='tutorial'&&<div className="screen-view" data-view="tutorial"><Tutorial onDone={finishTutorial} onRegistration={()=>navigate('registration')}/></div>}
      {view==='registration'&&<div className="screen-view" data-view="registration"><RegistrationScreen suspended={!!pending||!!download} onReturn={()=>navigate('import')} onSource={source=>{setRegistrationSources([source]);setImportKey(k=>k+1);navigate('import');}}/></div>}
      <div className="screen-view" data-view="import" hidden={view!=='import'}>{project?<div className="import-back"><div><h1 tabIndex={-1}>Import courses.</h1><p>Importing replaces the courses in this project.</p></div><button onClick={()=>navigate('planner')}>Back to planner</button></div>:<div className="welcome"><h1 tabIndex={-1}>Plan your semester.</h1><p>Import your UTAR courses to build and compare timetables.</p></div>}
        <ImportPanel key={importKey} initialSources={registrationSources} onRegistration={()=>navigate('registration')} onConfirm={r=>replace({schemaVersion:1,sources:r.sources,courses:r.courses,selection:{courseCodes:[],lockedClassIds:[],blocked:[]}},false)}/>
      </div>
      {project&&<div className="screen-view" data-view="planner" hidden={view!=='planner'}><Planner project={project} onChange={setProject}/></div>}
    </main>
    {pending&&!download&&<ProjectDialog title="Keep your changes?" onCancel={()=>{if(!busy)setPending(null);}}><p>Export your project before continuing, or discard the changes.</p>{error&&<p role="alert" className="error">{error}</p>}<div className="actions"><button disabled={busy} onClick={()=>setPending(null)}>Cancel</button><button disabled={busy} onClick={()=>pending.run()}>Discard changes</button><button className="primary" disabled={busy} onClick={()=>exportCurrent(true)}>Export and continue</button></div></ProjectDialog>}
    {download&&<ProjectDialog title="Keep your download" onCancel={()=>setDownload(null)}><p>Your browser started downloading {download.name}. Keep that file before marking your project as exported.</p><div className="actions"><button onClick={()=>setDownload(null)}>Keep editing</button><button className="primary" onClick={keptDownload}>I kept the file</button></div></ProjectDialog>}
  </>;
}
