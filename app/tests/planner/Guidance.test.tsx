import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it,vi} from 'vitest';
import {App} from '../../src/renderer/App';
import {ImportPanel} from '../../src/renderer/import/ImportPanel';
import {solveTimetables} from '../../src/core/solveTimetables';
vi.mock('../../src/workers/SolverClient',()=>({SolverClient:class {solve=async(input:Parameters<typeof solveTimetables>[0])=>solveTimetables(input);cancel(){}dispose(){}}}));

it('starts with a tutorial that supports next, previous, skip and replay',async()=>{
  render(<App/>);expect(screen.getByRole('heading',{name:'A quick tour of TTAP.'})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Previous step'})).toBeDisabled();
  await userEvent.click(screen.getByRole('button',{name:'Next step'}));expect(screen.getByRole('heading',{name:'Choose your courses and free time.'})).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Previous step'}));expect(screen.getByRole('heading',{name:'Get your course data.'})).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Skip tutorial'}));expect(screen.getByRole('region',{name:'Import courses'})).toBeVisible();
  await userEvent.click(screen.getByRole('button',{name:'Tutorial'}));await userEvent.click(screen.getByRole('button',{name:'Next step'}));await userEvent.click(screen.getByRole('button',{name:'Next step'}));await userEvent.click(screen.getByRole('button',{name:'Start planning'}));
  expect(screen.getByRole('region',{name:'Import courses'})).toBeVisible();
});

it('returns from planner to import and back without losing selection or generated options',async()=>{
  render(<App/>);await userEvent.click(screen.getByRole('button',{name:'Skip tutorial'}));
  await userEvent.click(screen.getByRole('button',{name:'Try demo'}));await userEvent.click(await screen.findByRole('button',{name:'Use these courses'}));
  await userEvent.click(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'}));await userEvent.click(screen.getByRole('button',{name:'Generate'}));
  expect(await screen.findByText('Option 1 of 2')).toBeVisible();
  await userEvent.click(screen.getByRole('button',{name:'Go back'}));expect(screen.getByRole('region',{name:'Import courses'})).toBeVisible();
  expect(screen.getByRole('heading',{name:'Import courses.'})).toHaveFocus();
  await userEvent.click(screen.getByRole('button',{name:'Tutorial'}));await userEvent.click(screen.getByRole('button',{name:'Skip tutorial'}));expect(screen.getByRole('heading',{name:'Import courses.'})).toHaveFocus();
  await userEvent.click(screen.getByRole('button',{name:'Back to planner'}));expect(screen.getByRole('checkbox',{name:'TEST1013 COMPUTING & SOCIETY'})).toBeChecked();expect(screen.getByText('Option 1 of 2')).toBeVisible();
  await userEvent.click(screen.getByRole('button',{name:'Tutorial'}));await userEvent.click(screen.getByRole('button',{name:'Skip tutorial'}));expect(screen.getByText('Option 1 of 2')).toBeVisible();
});

it('explains the original manual-slot workflow beside the real UTAR login link',async()=>{
  render(<ImportPanel onConfirm={vi.fn()}/>);
  const login=screen.getByRole('link',{name:'Open Course Registration System'});
  expect(login).toHaveAttribute('href','https://unitreg.utar.edu.my/portal/courseRegStu/login.jsp');expect(login).toHaveAttribute('target','_blank');expect(login.getAttribute('rel')).toContain('noopener');
  await userEvent.click(screen.getByText('How to add slots manually?'));
  const guide=screen.getByRole('region',{name:'Manual slot import guide'});
  expect(within(guide).getByText('Course Timetable Preview',{exact:false})).toBeVisible();expect(within(guide).getByText('Ctrl + U')).toBeVisible();expect(within(guide).getByText(/all pages together/)).toBeVisible();
});
