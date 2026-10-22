import {useEffect,useId,useRef,type ReactNode} from 'react';

export function ProjectActions({hasProject,dirty,busy,onOpen,onImport,onExport}:{hasProject:boolean;dirty:boolean;busy:boolean;onOpen:()=>void;onImport:()=>void;onExport:()=>void}){
  return <div className="project-actions"><span className={dirty?'dirty-label':'saved-label'} role="status">{hasProject?(dirty?'Unsaved changes':'Project is up to date'):'Your files stay on this device.'}</span><div className="actions">
    <button disabled={busy} onClick={onOpen}>Open project</button>{hasProject&&<><button disabled={busy} onClick={onImport}>Import courses</button><button disabled={busy} onClick={onExport}>{busy?'Exporting…':'Export project'}</button></>}
  </div></div>;
}
export function ProjectDialog({title,onCancel,children,dismissOnBackdrop=false,className=''}:{title:string;onCancel:()=>void;children:ReactNode;dismissOnBackdrop?:boolean;className?:string}){
  const ref=useRef<HTMLDialogElement>(null);const id=useId();
  const outside=useRef(false);
  function isOutside(event:React.MouseEvent<HTMLDialogElement>|React.PointerEvent<HTMLDialogElement>){const rect=event.currentTarget.getBoundingClientRect();return event.target===event.currentTarget&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom);}
  useEffect(()=>{const dialog=ref.current!,previous=document.activeElement;dialog.showModal();return ()=>{dialog.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};},[]);
  return <dialog ref={ref} className={'project-dialog '+className} aria-labelledby={id} onPointerDown={e=>{outside.current=isOutside(e);}} onClick={e=>{if(dismissOnBackdrop&&outside.current&&isOutside(e))onCancel();}} onCancel={e=>{e.preventDefault();onCancel();}}><h2 id={id}>{title}</h2>{children}</dialog>;
}
