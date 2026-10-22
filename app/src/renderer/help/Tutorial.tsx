import {useState} from 'react';
import {RegistrationLink} from './RegistrationLink';

const steps=[
  {title:'Get your course data.',body:<><p>Log in to the UTAR Course Registration System in your browser, then open <strong>Course Timetable Preview</strong>.</p><p>Save the course pages as HTML or copy their page source. Return here to import and review your courses. You can also try the demo first.</p><RegistrationLink/></>},
  {title:'Choose your courses and free time.',body:<><p>Select courses in the sidebar. Leave each lecture, tutorial or practical on <strong>Any group</strong>, or choose a specific group.</p><p>Use <strong>Hide courses</strong> to give the timetable more room. Add your unavailable times under <strong>Conditions</strong>. On smaller screens, use the three panel buttons.</p></>},
  {title:'Compare your options, then save.',body:<><p>Choose <strong>Generate</strong>, browse the timetable options and switch teaching weeks. Select a class to see all its meetings and rooms.</p><p>Use <strong>Export project</strong> to keep your choices and open them later in either version. Complete your actual course registration on the UTAR website.</p></>},
];

export function Tutorial({onDone}:{onDone:()=>void}){
  const[index,setIndex]=useState(0);const step=steps[index];
  return <section className="tutorial" aria-label="Getting started tutorial">
    <div className="tutorial-heading"><div><h1 tabIndex={-1}>A quick tour of TTAP.</h1><p>From your UTAR courses to a timetable you can compare.</p></div><button className="quiet" onClick={onDone}>Skip tutorial</button></div>
    <ol className="tutorial-progress" aria-label="Tutorial progress">{['Import courses','Choose classes','Compare timetables'].map((label,i)=><li key={label} aria-current={i===index?'step':undefined}><span>{i+1}</span>{label}</li>)}</ol>
    <div className="tutorial-step" aria-live="polite"><p className="step-count">Step {index+1} of {steps.length}</p><h2>{step.title}</h2>{step.body}</div>
    <div className="tutorial-actions"><button disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Previous step</button>{index===steps.length-1?<button className="primary" onClick={onDone}>Start planning</button>:<button className="primary" onClick={()=>setIndex(i=>i+1)}>Next step</button>}</div>
    <p className="tutorial-note">You can reopen this guide with the Tutorial button. Your current project stays in place.</p>
  </section>;
}
