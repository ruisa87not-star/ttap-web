import {useState} from 'react';
import type {Project,Selection} from '../../shared/model';
const names:Record<string,string>={L:'Lecture',T:'Tutorial',P:'Practical'};
export const typeName=(type:string)=>names[type]??type;
export function CourseList({project,onChange}:{project:Project;onChange:(s:Selection)=>void}){
  const[search,setSearch]=useState('');const selected=new Set(project.selection.courseCodes);
  function toggle(code:string){
    const next=new Set(selected);if(next.has(code))next.delete(code);else next.add(code);
    const validIds=new Set(project.courses.filter(c=>next.has(c.code)).flatMap(c=>c.classes.map(s=>s.id)));
    onChange({...project.selection,courseCodes:[...next],lockedClassIds:project.selection.lockedClassIds.filter(id=>validIds.has(id))});
  }
  return <><div className="panel-heading"><h2>Courses</h2><span>{project.courses.length}</span></div><input className="search-input" type="search" aria-label="Search courses" placeholder="Search code or course name" value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="course-list">{project.courses.filter(c=>(c.code+' '+c.name).toLowerCase().includes(search.toLowerCase())).map(c=>{
      const isSelected=selected.has(c.code);
      return <article className={'course-card tone-'+project.courses.indexOf(c)%6+(isSelected?' selected':'')} key={c.code}>
        <label className="course-choice"><input type="checkbox" aria-label={c.code+' '+c.name} checked={isSelected} onChange={()=>toggle(c.code)}/><span><b>{c.code}</b><span className="course-name">{c.name}</span><small>{c.classes.length} classes{c.creditHours!==undefined?' / '+c.creditHours+' credits':''}</small></span></label>
        {isSelected&&<div className="class-choices">{[...new Set(c.classes.map(s=>s.type))].sort().map(type=>{
          const options=c.classes.filter(s=>s.type===type);const ids=new Set(options.map(s=>s.id));const fixed=project.selection.lockedClassIds.find(id=>ids.has(id))??'';
          return <label key={type}>{typeName(type)}<select aria-label={typeName(type)+' for '+c.code} value={fixed} onChange={e=>onChange({...project.selection,lockedClassIds:[...project.selection.lockedClassIds.filter(id=>!ids.has(id)),...(e.target.value?[e.target.value]:[])]})}><option value="">Any group</option>{options.map(o=><option key={o.id} value={o.id}>Group {o.group} / #{o.number}</option>)}</select></label>;
        })}</div>}
      </article>;
    })}</div>
  </>;
}
