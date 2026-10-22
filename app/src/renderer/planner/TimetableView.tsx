import {useState} from 'react';
import type {BlockedPeriod,Course,Timetable} from '../../shared/model';
import {dayNames,formatTime} from './ConstraintsPanel';
import {typeName} from './CourseList';
export function TimetableView({courses,timetable,week,blocked=[]}:{courses:Course[];timetable?:Timetable;week:number;blocked?:BlockedPeriod[]}){
  const[detail,setDetail]=useState<string|null>(null);const ids=new Set(timetable?.classIds??[]);
  const options=courses.flatMap((course,tone)=>course.classes.filter(c=>ids.has(c.id)).map(option=>({course,option,tone})));
  const meetings=options.flatMap(item=>item.option.meetings.map(meeting=>({...item,meeting})));
  const first=Math.floor(Math.min(480,...meetings.map(m=>m.meeting.startMinute),...blocked.map(b=>b.startMinute))/60)*60;
  const last=Math.ceil(Math.max(1080,...meetings.map(m=>m.meeting.endMinute),...blocked.map(b=>b.endMinute))/60)*60;
  const hours=Array.from({length:(last-first)/60+1},(_,n)=>first+n*60);const height=last-first;
  const details=options.find(o=>o.option.id===detail);
  return <section aria-label="Weekly timetable" className="weekly-timetable">
    {!timetable?<div className="calendar-empty"><span aria-hidden="true">▦</span><h3>A week that works for you.</h3><p>Select your courses and generate a timetable to get started.</p></div>:<>
      <div className="calendar-scroll"><div className="calendar"><div className="calendar-head"><span>Time</span>{dayNames.map(d=><b key={d}>{d.slice(0,3)}</b>)}</div><div className="calendar-body" style={{height}}><div className="time-axis">{hours.slice(0,-1).map(t=><span key={t} style={{top:t-first}}>{formatTime(t)}</span>)}</div>
        {dayNames.map((day,i)=><div className="day-column" key={day}>
          {hours.slice(0,-1).map(t=><div className="hour-rule" key={t} style={{top:t-first}}/>)}
          {blocked.filter(b=>b.day===i+1).map((b,n)=><div className="blocked-block" key={'blocked'+n} style={{top:b.startMinute-first,height:b.endMinute-b.startMinute}}>Unavailable</div>)}
          {meetings.filter(m=>m.meeting.day===i+1 && m.meeting.weeks.includes(week)).map(({course,option,meeting,tone},n)=><button key={option.id+'-'+n} className={'meeting tone-'+tone%6} style={{top:meeting.startMinute-first,height:meeting.endMinute-meeting.startMinute}} onClick={()=>setDetail(option.id)} aria-expanded={detail===option.id} aria-label={`${course.code} ${course.name}, ${typeName(option.type)} group ${option.group}, ${formatTime(meeting.startMinute)} to ${formatTime(meeting.endMinute)}, ${meeting.room}`}><strong>{course.code}</strong><span>{option.type}{option.group} · {formatTime(meeting.startMinute)}</span>{meeting.endMinute-meeting.startMinute>=60&&<small>{meeting.room}</small>}</button>)}
        </div>)}</div></div></div>
      {meetings.every(m=>!m.meeting.weeks.includes(week))&&<p className="no-results">No classes in week {week}.</p>}
      {details&&<div className="class-details"><div><h3>{details.course.code} / {typeName(details.option.type)} group {details.option.group}</h3><button className="quiet" onClick={()=>setDetail(null)}>Close details</button></div><p>{details.course.name}</p><ul>{details.option.meetings.map((m,i)=><li key={i}>{dayNames[m.day-1]} {formatTime(m.startMinute)}–{formatTime(m.endMinute)} / {m.room||'Room not specified'} / Weeks {m.weeks.join(', ')}</li>)}</ul>{details.option.remark&&<p>{details.option.remark}</p>}</div>}
    </>}
  </section>;
}
