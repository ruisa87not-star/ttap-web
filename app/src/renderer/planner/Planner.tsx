import {useEffect,useMemo,useRef,useState} from 'react';
import type {Project,Selection,SolveResult} from '../../shared/model';
import {SolverClient} from '../../workers/SolverClient';
import {CourseList} from './CourseList';
import {ConstraintsPanel} from './ConstraintsPanel';
import {TimetableView} from './TimetableView';

export function Planner({project,onChange}:{project:Project;onChange:(p:Project)=>void}){
  const client=useMemo(()=>new SolverClient(),[]);const run=useRef(0);
  const[result,setResult]=useState<SolveResult|null>(null);const[index,setIndex]=useState(0);const[week,setWeek]=useState(1);
  const[status,setStatus]=useState<'idle'|'running'|'stale'|'done'>('idle');const[error,setError]=useState('');
  const[panel,setPanel]=useState<'courses'|'timetable'|'conditions'>('timetable');
  // Cancel and invalidate whenever the actual Project changes, including imports.
  // https://react.dev/reference/react/useEffect#connecting-to-an-external-system
  useEffect(()=>{++run.current;client.cancel();setResult(null);setError('');setStatus(s=>s==='done'?'stale':'idle');},[project,client]);
  useEffect(()=>()=>{++run.current;client.dispose();},[client]);
  const weeks=[...new Set(project.courses.flatMap(c=>c.classes.flatMap(s=>s.meetings.flatMap(m=>m.weeks))))].sort((a,b)=>a-b);
  const shownWeek=weeks.includes(week)?week:weeks[0]??1;
  const change=(selection:Selection)=>onChange({...project,selection});
  async function generate(){
    const id=++run.current;setStatus('running');setError('');setResult(null);setPanel('timetable');
    try{const found=await client.solve({courses:project.courses,selection:project.selection});if(id!==run.current)return;setResult(found);setIndex(0);setStatus('done');}
    catch(e){if(id!==run.current)return;setStatus('idle');if(!(e instanceof DOMException && e.name==='AbortError'))setError(e instanceof Error?e.message:'The timetable search failed.');}
  }
  function cancel(){++run.current;client.cancel();setStatus('idle');setError('');}
  const count=result?.solutions.length??0;
  return <section className="planner">
    <div className="planner-title">
      <div><h1>Build your week.</h1><p>Choose courses, set your free time, then generate your options.</p></div>
      <div className="planner-actions">
        <p className="selection-count">{project.selection.courseCodes.length?<><strong>{project.selection.courseCodes.length}</strong> courses selected</>:'Choose a course to begin.'}</p>
        {status==='running'?<button className="primary" onClick={cancel}>Cancel calculation</button>:<button className="primary" disabled={!project.selection.courseCodes.length} onClick={generate}>Generate</button>}
      </div>
    </div>
    <nav className="mobile-panels" aria-label="Planner panels">{(['courses','timetable','conditions'] as const).map(p=><button key={p} aria-pressed={p===panel} onClick={()=>setPanel(p)}>{p==='courses'?'Courses':p==='timetable'?'Timetable':'Conditions'}</button>)}</nav>
    <div className={'planner-grid panel-'+panel}>
      <aside className="courses-panel"><CourseList project={project} onChange={change}/></aside>
      <div className="schedule-panel"><div className="schedule-toolbar"><h2>Your timetable</h2><label>Teaching week<select aria-label="Teaching week" value={shownWeek} onChange={e=>setWeek(Number(e.target.value))}>{(weeks.length?weeks:[1]).map(w=><option value={w} key={w}>Week {w}</option>)}</select></label></div>
        <div className="result-toolbar" aria-live="polite">
          {status==='running'?<span>Finding your options…</span>:count>0?<><button aria-label="Previous timetable" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>‹</button><strong>Option {index+1} of {count}</strong><button aria-label="Next timetable" disabled={index===count-1} onClick={()=>setIndex(i=>i+1)}>›</button></>:<span>{status==='stale'?'Conditions changed. Generate a new timetable.':'Your schedule will appear here.'}</span>}
        </div>
        {result?.truncated&&<p className="limit-note">Showing the first 500 options. Narrow your conditions to explore a smaller set.</p>}
        {result&&count===0&&<p className="no-results" role="status">No timetable matches your current conditions.</p>}
        {error&&<p role="alert" className="error">{error}</p>}
        <TimetableView courses={project.courses} timetable={result?.solutions[index]} week={shownWeek} blocked={project.selection.blocked}/>
        <p className="calendar-note">Classes are shown for week {shownWeek}. Select a class to see all its meetings.</p>
      </div>
      <aside className="conditions-panel"><ConstraintsPanel selection={project.selection} onChange={change}/></aside>
    </div>
  </section>;
}
