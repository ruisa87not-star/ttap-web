import {act,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,it,vi} from 'vitest';
import {App} from '../../src/renderer/App';
import {makeProject} from '../fixtures/projects';
import {validateProject} from '../../src/shared/project';
const port=vi.hoisted(()=>({pickHtml:vi.fn(),openProject:vi.fn(),exportProject:vi.fn()}));
vi.mock('../../src/platform/files',()=>({getFilePort:()=>port}));
beforeEach(()=>{vi.clearAllMocks();port.openProject.mockResolvedValue({status:'cancelled'});port.exportProject.mockResolvedValue({status:'cancelled'});});
async function demo(){render(<App/>);await userEvent.click(screen.getByRole('button',{name:'Skip tutorial'}));await userEvent.click(screen.getByRole('button',{name:'Try demo'}));}
it('prompts for edits made after a clean project starts opening another file',async()=>{
  await demo();port.exportProject.mockResolvedValue({status:'ok',value:{kind:'saved',name:'current.ttap.json'}});
  await userEvent.click(screen.getByRole('button',{name:'Export project'}));expect(screen.getByText('Project is up to date')).toBeInTheDocument();
  let finish!:(value:unknown)=>void;port.openProject.mockImplementation(()=>new Promise(resolve=>finish=resolve));
  await userEvent.click(screen.getByRole('button',{name:'Open project'}));await userEvent.click(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'}));
  await act(async()=>finish({status:'ok',value:{name:'other.ttap.json',text:JSON.stringify(makeProject())}}));
  const dialog=await screen.findByRole('dialog',{name:'Keep your changes?'});expect(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'})).toBeChecked();
  await userEvent.click(within(dialog).getByRole('button',{name:'Cancel'}));expect(screen.getByText('Unsaved changes')).toBeInTheDocument();expect(screen.getByRole('checkbox',{name:'TEST2023 DATA STRUCTURES'})).toBeInTheDocument();
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
  await demo();port.exportProject.mockResolvedValue({status:'ok',value:{kind:'downloaded',name:'test.ttap.json'}});
  const before=new Event('beforeunload',{cancelable:true});window.dispatchEvent(before);expect(before.defaultPrevented).toBe(true);
  await userEvent.click(screen.getByRole('button',{name:'Export project'}));expect(await screen.findByRole('dialog',{name:'Keep your download'})).toBeInTheDocument();expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'I kept the file'}));expect(screen.getByText('Project is up to date')).toBeInTheDocument();
  const after=new Event('beforeunload',{cancelable:true});window.dispatchEvent(after);expect(after.defaultPrevented).toBe(false);
});
it('does not clear changes made while an asynchronous save is in progress',async()=>{
  let finish!:(value:unknown)=>void;await demo();port.exportProject.mockImplementation(()=>new Promise(resolve=>finish=resolve));
  await userEvent.click(screen.getByRole('button',{name:'Export project'}));await userEvent.click(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'}));
  await act(async()=>finish({status:'ok',value:{kind:'saved',name:'test.ttap.json'}}));expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
});
it('replaces a dirty project only after explicit discard',async()=>{
  await demo();port.openProject.mockResolvedValue({status:'ok',value:{name:'other.ttap.json',text:JSON.stringify(makeProject())}});
  await userEvent.click(screen.getByRole('button',{name:'Open project'}));await userEvent.click(await screen.findByRole('button',{name:'Discard changes'}));
  expect(screen.queryByRole('checkbox',{name:'TEST2023 DATA STRUCTURES'})).toBeNull();expect(screen.getByText('Project is up to date')).toBeInTheDocument();
});
