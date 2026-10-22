import {useState} from 'react';
import {act,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,it,vi} from 'vitest';
import {Planner} from '../../src/renderer/planner/Planner';
import {TimetableView} from '../../src/renderer/planner/TimetableView';
import {solveTimetables} from '../../src/core/solveTimetables';
import type {Project,SolveResult} from '../../src/shared/model';
import {makeClass,makeMeeting,makeProject} from '../fixtures/projects';
const solver=vi.hoisted(()=>({solve:vi.fn(),cancel:vi.fn(),dispose:vi.fn()}));
vi.mock('../../src/workers/SolverClient',()=>({SolverClient:class {solve=solver.solve;cancel=solver.cancel;dispose=solver.dispose;}}));
beforeEach(()=>{vi.clearAllMocks();solver.solve.mockImplementation(async input=>solveTimetables(input));});
function Harness({initial=makeProject()}:{initial?:Project}){const[p,setP]=useState(initial);return <Planner project={p} onChange={setP}/>;}
it('hides and reopens the course sidebar without changing selected classes',async()=>{
  render(<Harness/>);await userEvent.selectOptions(screen.getByLabelText('Lecture for TEST1013'),makeProject().courses[0].classes[0].id);
  await userEvent.click(screen.getByRole('button',{name:'Hide courses'}));
  const show=screen.getByRole('button',{name:'Show courses'});expect(show).toHaveAttribute('aria-expanded','false');await userEvent.click(show);
  expect(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'})).toBeChecked();expect(screen.getByLabelText('Lecture for TEST1013')).toHaveValue(makeProject().courses[0].classes[0].id);
});
it('generates a timetable, then invalidates it after a condition change',async()=>{
  render(<Harness/>);await userEvent.click(screen.getByRole('button',{name:'Generate'}));
  const table=screen.getByRole('region',{name:'Weekly timetable'});expect(await within(table).findAllByText('TEST1013')).toHaveLength(2);
  await userEvent.click(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'}));
  expect(within(table).queryAllByText('TEST1013')).toHaveLength(0);expect(screen.getByRole('button',{name:'Generate'})).toBeDisabled();
});
it('keeps cancel available and ignores results after a condition change',async()=>{
  let finish!:(r:SolveResult)=>void;solver.solve.mockImplementation(()=>new Promise(resolve=>finish=resolve));
  render(<Harness/>);await userEvent.click(screen.getByRole('button',{name:'Generate'}));expect(screen.getByRole('button',{name:'Cancel calculation'})).toBeEnabled();
  await userEvent.click(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'}));
  await act(async()=>finish(solveTimetables({courses:makeProject().courses,selection:makeProject().selection})));
  expect(within(screen.getByRole('region',{name:'Weekly timetable'})).queryAllByText('TEST1013')).toHaveLength(0);
});
it('cancels without showing an error',async()=>{
  solver.solve.mockImplementation(()=>new Promise(()=>{}));render(<Harness/>);
  await userEvent.click(screen.getByRole('button',{name:'Generate'}));await userEvent.click(screen.getByRole('button',{name:'Cancel calculation'}));expect(screen.queryByRole('alert')).toBeNull();
});
it('passes a fixed class and unavailable time to the solver and reports no solution',async()=>{
  render(<Harness/>);await userEvent.selectOptions(screen.getByLabelText('Lecture for TEST1013'),makeProject().courses[0].classes[0].id);
  await userEvent.click(screen.getByRole('button',{name:'Add unavailable time'}));await userEvent.click(screen.getByRole('button',{name:'Generate'}));
  expect(await screen.findByText('No timetable matches your current conditions.')).toBeInTheDocument();
  expect(solver.solve.mock.calls.at(-1)?.[0].selection.lockedClassIds).toHaveLength(1);
});
it('shows a limit notice instead of claiming a complete result count',async()=>{
  solver.solve.mockResolvedValue({solutions:[{classIds:makeProject().courses[0].classes.map(c=>c.id)}],truncated:true});render(<Harness/>);
  await userEvent.click(screen.getByRole('button',{name:'Generate'}));expect(await screen.findByText(/Showing the first 500/)).toBeInTheDocument();
});
it('shows meetings only in their teaching week',()=>{
  const a=makeClass({meetings:[makeMeeting({weeks:[1]})]});const b=makeClass({courseCode:'OTHER1013',meetings:[makeMeeting({weeks:[2]})]});
  const courses=[{code:'TEST1013',name:'One',classes:[a]},{code:'OTHER1013',name:'Two',classes:[b]}];
  const props={courses,timetable:{classIds:[a.id,b.id]}};
  const view=render(<TimetableView {...props} week={1}/>);expect(screen.getByText('TEST1013')).toBeInTheDocument();expect(screen.queryByText('OTHER1013')).toBeNull();
  view.rerender(<TimetableView {...props} week={2}/>);expect(screen.queryByText('TEST1013')).toBeNull();expect(screen.getByText('OTHER1013')).toBeInTheDocument();
});
it('previews visual time constraints before applying them to the project',async()=>{
  render(<Harness/>);await userEvent.click(screen.getByRole('button',{name:'Generate'}));await screen.findByText('Option 1 of 1');
  await userEvent.click(screen.getByRole('button',{name:'Set time constraint'}));const dialog=screen.getByRole('dialog',{name:'Set time constraint'});
  await userEvent.click(within(dialog).getByRole('button',{name:'Monday 09:00–09:30'}));expect(dialog).toHaveTextContent('0 of 1 shown options remain');
  await userEvent.click(within(dialog).getByRole('button',{name:'Apply constraints'}));expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByRole('button',{name:'Remove unavailable time 1'})).toBeInTheDocument();
});
