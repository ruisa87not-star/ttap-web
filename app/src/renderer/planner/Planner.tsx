import {useEffect,useId,useMemo,useRef,useState} from 'react';
import type {Project,Selection,SolveResult,Timetable} from '../../shared/model';
import {SolverClient} from '../../workers/SolverClient';
import {CourseList} from './CourseList';
import {ConstraintsPanel} from './ConstraintsPanel';
import {TimetableView} from './TimetableView';
import {CourseSummary} from './CourseSummary';
import {TimeConstraintsDialog} from './TimeConstraintsDialog';

export function Planner({project,onChange,onTimetableChange}:{project:Project;onChange:(p:Project)=>void;onTimetableChange?:(project:Project,timetable:Timetable|undefined)=>void}){
  const client=useMemo(()=>new SolverClient(),[]);const run=useRef(0);
  const[completed,setCompleted]=useState<{project:Project;result:SolveResult}|null>(null);const[index,setIndex]=useState(0);
  const result=completed?.project===project?completed.result:null;
  const[status,setStatus]=useState<'idle'|'running'|'done'>('idle');const[error,setError]=useState('');
  const[panel,setPanel]=useState<'courses'|'timetable'|'conditions'>('timetable');
  const[collapsed,setCollapsed]=useState(false);const coursePanelId=useId();
  const[timeConstraints,setTimeConstraints]=useState(false);const[summary,setSummary]=useState(false);
  // Cancel and invalidate whenever the actual Project changes, including imports.
  // https://react.dev/reference/react/useEffect#connecting-to-an-external-system
  useEffect(()=>{void generate();return ()=>{++run.current;client.cancel();};},[project,client]);
  useEffect(()=>()=>{++run.current;client.dispose();},[client]);
  const timetable=result?.solutions[index];
  useEffect(()=>{onTimetableChange?.(project,timetable);},[project,timetable,onTimetableChange]);
  const change=(selection:Selection)=>onChange({...project,selection});
  async function generate(){
    const id=++run.current;client.cancel();setError('');setCompleted(null);setIndex(0);
    if(!project.selection.courseCodes.length){setStatus('idle');return;}
    setStatus('running');
    try{const found=await client.solve({courses:project.courses,selection:project.selection});if(id!==run.current)return;setCompleted({project,result:found});setIndex(0);setStatus('done');}
    catch(e){if(id!==run.current)return;setStatus('idle');if(!(e instanceof DOMException && e.name==='AbortError'))setError(e instanceof Error?e.message:'The timetable search failed.');}
  }
  function cancel(){++run.current;client.cancel();setStatus('idle');setError('');}
  const count=result?.solutions.length??0;
  return <section className="planner">
    <div className="planner-title">
      <div><h1 tabIndex={-1}>Build your week.</h1><p>{project.sources.some(s=>s.startsWith('Demo'))?`Demo catalog: ${project.courses.length} courses with sample groups and times.`:'Choose courses. Clashes and timetable options update automatically.'}</p></div>
      <div className="planner-actions">
        <button className="course-toggle" aria-expanded={!collapsed} aria-controls={coursePanelId} onClick={()=>setCollapsed(value=>!value)}>{collapsed?'Show courses':'Hide courses'}</button>
        <p className="selection-count">{project.selection.courseCodes.length?<><strong>{project.selection.courseCodes.length}</strong> courses selected</>:'Choose a course to begin.'}</p>
        {status==='running'?<button onClick={cancel}>Cancel calculation</button>:<button disabled={!project.selection.courseCodes.length} onClick={()=>{setPanel('timetable');void generate();}}>Generate</button>}
      </div>
    </div>
    <div className={'selection-feedback'+(result&&count===0?' has-clash':'')} role={result&&count===0?'alert':'status'}>{error|| (status==='running'?'Checking courses and groups…':count>0?'No clashes. Your selected courses fit together.':result?`Clash detected. No compatible combination for ${project.selection.courseCodes.slice(0,8).join(', ')}${project.selection.courseCodes.length>8?' and other selected courses':''}. Change a group, course or unavailable time.`:project.selection.courseCodes.length?'Check paused. Choose Generate to retry.':'Select courses to check for clashes automatically.')}</div>
    <nav className="mobile-panels" aria-label="Planner panels">{(['courses','timetable','conditions'] as const).map(p=><button key={p} aria-pressed={p===panel} onClick={()=>{setPanel(p);if(p==='courses')setCollapsed(false);}}>{p==='courses'?'Courses':p==='timetable'?'Timetable':'Conditions'}</button>)}</nav>
    <div className={'planner-grid panel-'+panel+(collapsed?' courses-collapsed':'')}>
      <aside className="courses-panel" id={coursePanelId}><CourseList project={project} onChange={change}/></aside>
      <div className={'schedule-panel'+(summary?' summary-open':'')}><div className="schedule-toolbar"><h2>Your timetable</h2><span>All class meetings</span></div>
        <div className="result-toolbar" aria-live="polite">
          {status==='running'?<span>Finding your options…</span>:count>0?<><button aria-label="Previous timetable" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>‹</button><strong>Option {index+1} of {count}</strong><button aria-label="Next timetable" disabled={index===count-1} onClick={()=>setIndex(i=>i+1)}>›</button></>:<span>Your schedule will appear here.</span>}
        </div>
        {result?.truncated&&<p className="limit-note">Showing the first 500 options. Narrow your conditions to explore a smaller set.</p>}
        {result&&count===0&&<p className="no-results" role="status">No timetable matches your current conditions.</p>}
        {error&&<p role="alert" className="error">{error}</p>}
        <TimetableView courses={project.courses} timetable={timetable} blocked={project.selection.blocked}/>
        {summary&&<CourseSummary courses={project.courses} selectedCodes={project.selection.courseCodes} timetable={result?.solutions[index]}/>}
        <div className="schedule-secondary"><button onClick={()=>setTimeConstraints(true)}>Set time constraint</button><button aria-expanded={summary} onClick={()=>setSummary(value=>!value)}>{summary?'Hide summary':'Show summary'}</button></div>
        <p className="calendar-note">All class meetings are shown. Select a class for rooms and dates.</p>
      </div>
      <aside className="conditions-panel"><ConstraintsPanel selection={project.selection} onChange={change}/></aside>
    </div>
    {timeConstraints&&<TimeConstraintsDialog courses={project.courses} timetables={result?.solutions??[]} blocked={project.selection.blocked} onCancel={()=>setTimeConstraints(false)} onApply={blocked=>{change({...project.selection,blocked});setTimeConstraints(false);}}/>}
  </section>;
}
