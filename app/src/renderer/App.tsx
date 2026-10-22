import {useEffect,useRef,useState} from 'react';
import type {Project} from '../shared/model';
import {decodeProject} from '../shared/project';
import {getFilePort} from '../platform/files';
import {ImportPanel} from './import/ImportPanel';
import {Planner} from './planner/Planner';
import {ProjectActions,ProjectDialog} from './ProjectActions';

export function App(){
  const [project,setProject]=useState<Project|null>(null);
  const [baseline,setBaseline]=useState('');const [importing,setImporting]=useState(false);
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
    const run=()=>{setProject(next);setBaseline(clean?JSON.stringify(next):'');setImporting(false);setPending(null);setError('');setNotice('');};
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
  return <><header className="app-header"><a className="brand" href="#"><span className="brand-mark" aria-hidden="true">▦</span>TTAP<span className="brand-description">UTAR timetable planner</span></a><span className="local-label">Made for your semester.</span></header>
    <main><ProjectActions hasProject={!!project} dirty={dirty} busy={busy} onOpen={open} onImport={()=>setImporting(true)} onExport={()=>exportCurrent()}/>
      {error&&!pending&&<p className="error app-message" role="alert">{error}</p>}{notice&&<p className="app-message" role="status">{notice}</p>}
      {!project||importing?<>{project?<div className="import-back"><button onClick={()=>setImporting(false)}>Back to planner</button><p>Importing replaces the courses in this project.</p></div>:<div className="welcome"><h1>Plan your semester.</h1><p>Import your UTAR courses to build and compare timetables.</p></div>}
        <ImportPanel onConfirm={r=>replace({schemaVersion:1,sources:r.sources,courses:r.courses,selection:{courseCodes:[],lockedClassIds:[],blocked:[]}},false)}/></>:<Planner project={project} onChange={setProject}/>}
    </main>
    {pending&&!download&&<ProjectDialog title="Keep your changes?" onCancel={()=>{if(!busy)setPending(null);}}><p>Export your project before continuing, or discard the changes.</p>{error&&<p role="alert" className="error">{error}</p>}<div className="actions"><button disabled={busy} onClick={()=>setPending(null)}>Cancel</button><button disabled={busy} onClick={()=>pending.run()}>Discard changes</button><button className="primary" disabled={busy} onClick={()=>exportCurrent(true)}>Export and continue</button></div></ProjectDialog>}
    {download&&<ProjectDialog title="Keep your download" onCancel={()=>setDownload(null)}><p>Your browser started downloading {download.name}. Keep that file before marking your project as exported.</p><div className="actions"><button onClick={()=>setDownload(null)}>Keep editing</button><button className="primary" onClick={keptDownload}>I kept the file</button></div></ProjectDialog>}
  </>;
}
