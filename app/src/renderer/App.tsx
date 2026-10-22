import { useState } from 'react';
import type { Project } from '../shared/model';
import { ImportPanel } from './import/ImportPanel';
export function App() {
  const [project,setProject]=useState<Project|null>(null);
  return <><header className="app-header"><a className="brand" href="#"><span className="brand-mark" aria-hidden="true">▦</span>TTAP<span className="brand-description">UTAR timetable planner</span></a><span className="local-label">Made for your semester.</span></header>
    <main>{!project ? <><div className="welcome"><h1>A little planning.<br/>A better semester.</h1><p>Find a timetable that fits your week, with room for everything else.</p></div><ImportPanel onConfirm={r=>setProject({schemaVersion:1,sources:r.sources,courses:r.courses,selection:{courseCodes:[],lockedClassIds:[],blocked:[]}})}/></> :
      <section className="ready"><h1>Your courses are ready.</h1><p>{project.courses.length} courses imported.</p><ul>{project.courses.map(c=><li key={c.code}>{c.code} — {c.name}</li>)}</ul><button onClick={()=>setProject(null)}>Import another schedule</button></section>}</main>
  </>;
}
