import {act,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,it,vi} from 'vitest';
import {App} from '../../src/renderer/App';
import {makeProject} from '../fixtures/projects';
import {solveTimetables} from '../../src/core/solveTimetables';
import {validateProject} from '../../src/shared/project';
vi.mock('../../src/workers/SolverClient',()=>({SolverClient:class {solve=async(input:Parameters<typeof solveTimetables>[0])=>solveTimetables(input);cancel(){}dispose(){}}}));
vi.mock('../../src/renderer/planner/registrationImage',()=>({renderRegistrationImage:()=> 'data:image/png;base64,example'}));
const port=vi.hoisted(()=>({pickHtml:vi.fn(),openProject:vi.fn(),exportImage:vi.fn()}));
vi.mock('../../src/platform/files',()=>({getFilePort:()=>port}));
beforeEach(()=>{vi.clearAllMocks();port.openProject.mockResolvedValue({status:'cancelled'});port.exportImage.mockResolvedValue({status:'cancelled'});});
async function demo(){render(<App/>);await userEvent.click(screen.getByRole('button',{name:'Skip tutorial'}));await userEvent.click(screen.getByRole('button',{name:'Try demo'}));await userEvent.click(screen.getByRole('checkbox',{name:'TEST2023 DATA STRUCTURES'}));await screen.findByText('No clashes. Your selected courses fit together.');}
it('prompts for edits made after a clean project starts opening another file',async()=>{
  await demo();port.exportImage.mockResolvedValue({status:'ok',value:{kind:'saved',name:'current.png'}});
  await userEvent.click(screen.getByRole('button',{name:'Export image'}));expect(screen.getByText('Image exported')).toBeInTheDocument();
  let finish!:(value:unknown)=>void;port.openProject.mockImplementation(()=>new Promise(resolve=>finish=resolve));
  await userEvent.click(screen.getByRole('button',{name:'Open project'}));await userEvent.click(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'}));
  await act(async()=>finish({status:'ok',value:{name:'other.ttap.json',text:JSON.stringify(makeProject())}}));
  const dialog=await screen.findByRole('dialog',{name:'Keep your changes?'});expect(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'})).toBeChecked();
  await userEvent.click(within(dialog).getByRole('button',{name:'Cancel'}));expect(screen.getByText('Image not exported')).toBeInTheDocument();expect(screen.getByRole('checkbox',{name:'TEST2023 DATA STRUCTURES'})).toBeInTheDocument();
});
it('renders a validated external class type that is also an Object prototype property',async()=>{
  const project=makeProject();const option=project.courses[0].classes[0];option.type='__proto__';option.id=JSON.stringify([option.courseCode,option.type,option.number,option.group]);
  expect(validateProject(project).ok).toBe(true);port.openProject.mockResolvedValue({status:'ok',value:{name:'unusual.json',text:JSON.stringify(project)}});
  render(<App/>);await userEvent.click(screen.getByRole('button',{name:'Skip tutorial'}));await userEvent.click(screen.getByRole('button',{name:'Open project'}));expect(await screen.findByLabelText('__proto__ for TEST1013')).toBeInTheDocument();
});
it('keeps the current project on invalid input and cancelled open',async()=>{
  await demo();await userEvent.click(screen.getByRole('button',{name:'Open project'}));expect(screen.getByRole('checkbox',{name:'TEST2023 DATA STRUCTURES'})).toBeInTheDocument();
  port.openProject.mockResolvedValue({status:'ok',value:{name:'broken.json',text:'{'}});await userEvent.click(screen.getByRole('button',{name:'Open project'}));expect(await screen.findByRole('alert')).toHaveTextContent('valid JSON');expect(screen.getByRole('checkbox',{name:'TEST2023 DATA STRUCTURES'})).toBeInTheDocument();
});
it('does not replace dirty work when export is cancelled',async()=>{
  await demo();port.openProject.mockResolvedValue({status:'ok',value:{name:'other.ttap.json',text:JSON.stringify(makeProject())}});
  await userEvent.click(screen.getByRole('button',{name:'Open project'}));const dialog=await screen.findByRole('dialog',{name:'Keep your changes?'});
  await userEvent.click(within(dialog).getByRole('button',{name:'Export and continue'}));expect(dialog).toBeInTheDocument();expect(screen.getByRole('checkbox',{name:'TEST2023 DATA STRUCTURES'})).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole('button',{name:'Cancel'}));expect(screen.queryByRole('dialog')).toBeNull();
});
it('requires confirmation of a kept download before clearing dirty state',async()=>{
  await demo();port.exportImage.mockResolvedValue({status:'ok',value:{kind:'downloaded',name:'test.png'}});
  const before=new Event('beforeunload',{cancelable:true});window.dispatchEvent(before);expect(before.defaultPrevented).toBe(true);
  await userEvent.click(screen.getByRole('button',{name:'Export image'}));expect(await screen.findByRole('dialog',{name:'Keep your download'})).toBeInTheDocument();expect(screen.getByText('Image not exported')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'I kept the file'}));expect(screen.getByText('Image exported')).toBeInTheDocument();
  const after=new Event('beforeunload',{cancelable:true});window.dispatchEvent(after);expect(after.defaultPrevented).toBe(false);
});
it('does not clear changes made while an asynchronous save is in progress',async()=>{
  let finish!:(value:unknown)=>void;await demo();port.exportImage.mockImplementation(()=>new Promise(resolve=>finish=resolve));
  await userEvent.click(screen.getByRole('button',{name:'Export image'}));await userEvent.click(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'}));
  await act(async()=>finish({status:'ok',value:{kind:'saved',name:'test.png'}}));expect(screen.getByText('Image not exported')).toBeInTheDocument();
});
it('replaces a dirty project only after explicit discard',async()=>{
  await demo();port.openProject.mockResolvedValue({status:'ok',value:{name:'other.ttap.json',text:JSON.stringify(makeProject())}});
  await userEvent.click(screen.getByRole('button',{name:'Open project'}));await userEvent.click(await screen.findByRole('button',{name:'Discard changes'}));
  expect(screen.queryByRole('checkbox',{name:'TEST2023 DATA STRUCTURES'})).toBeNull();expect(screen.getByText('Image not exported')).toBeInTheDocument();
});
it('marks a different timetable option as unexported and disables export with no courses',async()=>{
  render(<App/>);await userEvent.click(screen.getByRole('button',{name:'Skip tutorial'}));await userEvent.click(screen.getByRole('button',{name:'Try demo'}));
  expect(screen.getByRole('button',{name:'Export image'})).toBeDisabled();expect(screen.queryByRole('button',{name:'Export project'})).toBeNull();
  await userEvent.click(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'}));await screen.findByText('Option 1 of 2');
  port.exportImage.mockResolvedValue({status:'ok',value:{kind:'saved',name:'current.png'}});await userEvent.click(screen.getByRole('button',{name:'Export image'}));expect(screen.getByText('Image exported')).toBeVisible();
  await userEvent.click(screen.getByRole('button',{name:'Next timetable'}));expect(screen.getByText('Image not exported')).toBeVisible();
  await userEvent.click(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'}));expect(screen.getByRole('button',{name:'Export image'})).toBeDisabled();
});
