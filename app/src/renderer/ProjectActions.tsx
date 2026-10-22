import {useEffect,useId,useRef,type ReactNode} from 'react';

export function ProjectActions({hasProject,dirty,busy,onOpen,onImport,onExport}:{hasProject:boolean;dirty:boolean;busy:boolean;onOpen:()=>void;onImport:()=>void;onExport:()=>void}){
  return <div className="project-actions"><span className={dirty?'dirty-label':'saved-label'} role="status">{hasProject?(dirty?'Unsaved changes':'Project is up to date'):'Your files stay on this device.'}</span><div className="actions">
    <button disabled={busy} onClick={onOpen}>Open project</button>{hasProject&&<><button disabled={busy} onClick={onImport}>Import courses</button><button className="primary" disabled={busy} onClick={onExport}>{busy?'Exporting…':'Export project'}</button></>}
  </div></div>;
}
export function ProjectDialog({title,onCancel,children}:{title:string;onCancel:()=>void;children:ReactNode}){
  const ref=useRef<HTMLDialogElement>(null);const id=useId();
  useEffect(()=>{const dialog=ref.current!;dialog.showModal();return ()=>dialog.close();},[]);
  return <dialog ref={ref} className="project-dialog" aria-labelledby={id} onCancel={e=>{e.preventDefault();onCancel();}}><h2 id={id}>{title}</h2>{children}</dialog>;
}
