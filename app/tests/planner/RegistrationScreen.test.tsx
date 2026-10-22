import {act,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import {RegistrationScreen} from '../../src/renderer/registration/RegistrationScreen';
import type {FileOutcome,HtmlSource} from '../../src/shared/model';
afterEach(()=>{delete window.ttap;});
function deferred(){
  let finish!:(value:FileOutcome<HtmlSource>)=>void;
  window.ttap={openRegistration:vi.fn().mockResolvedValue(undefined),setRegistrationBounds:vi.fn(),getRegistrationStatus:vi.fn().mockResolvedValue({loading:false,error:''}),reloadRegistration:vi.fn(),readRegistrationPage:vi.fn().mockImplementation(()=>new Promise(resolve=>{finish=resolve;})),pickHtml:vi.fn(),openProject:vi.fn(),exportProject:vi.fn(),setDirty:vi.fn(),onCloseRequested:()=>()=>{},confirmClose:vi.fn()};
  return {finish:()=>finish({status:'ok',value:{name:'Test schedule',text:'<table></table>'}})};
}
it('ignores a page capture that finishes after the user leaves registration',async()=>{
  const capture=deferred(),onSource=vi.fn();const view=render(<RegistrationScreen onSource={onSource} suspended={false}/>);
  await userEvent.click(screen.getByRole('button',{name:'Preview courses from this page'}));view.unmount();await act(async()=>capture.finish());expect(onSource).not.toHaveBeenCalled();
});
it('cancels pending capture while a parent dialog suspends registration',async()=>{
  const capture=deferred(),onSource=vi.fn();const view=render(<RegistrationScreen onSource={onSource} suspended={false}/>);
  await userEvent.click(screen.getByRole('button',{name:'Preview courses from this page'}));view.rerender(<RegistrationScreen onSource={onSource} suspended/>);
  await act(async()=>capture.finish());expect(onSource).not.toHaveBeenCalled();view.rerender(<RegistrationScreen onSource={onSource} suspended={false}/>);expect(screen.getByRole('button',{name:'Preview courses from this page'})).toBeEnabled();
});
