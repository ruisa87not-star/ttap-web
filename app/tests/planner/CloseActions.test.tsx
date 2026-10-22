import {act,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import {App} from '../../src/renderer/App';
afterEach(()=>{delete window.ttap;});
it('keeps a dirty desktop open when saving is cancelled, then closes after explicit discard',async()=>{
  let request!:()=>void;const confirmClose=vi.fn().mockResolvedValue(undefined);
  window.ttap={openRegistration:vi.fn(),pickHtml:vi.fn(),openProject:vi.fn(),exportProject:vi.fn().mockResolvedValue({status:'cancelled'}),setDirty:vi.fn(),onCloseRequested:handler=>{request=handler;return ()=>{};},confirmClose};
  render(<App/>);await userEvent.click(screen.getByRole('button',{name:'Skip tutorial'}));await userEvent.click(screen.getByRole('button',{name:'Try demo'}));await userEvent.click(await screen.findByRole('button',{name:'Use these courses'}));
  act(()=>request());const dialog=await screen.findByRole('dialog',{name:'Keep your changes?'});await userEvent.click(within(dialog).getByRole('button',{name:'Export and continue'}));expect(confirmClose).not.toHaveBeenCalled();expect(dialog).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole('button',{name:'Discard changes'}));expect(confirmClose).toHaveBeenCalledOnce();
});
