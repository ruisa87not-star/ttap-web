import {render,screen} from '@testing-library/react';
import {expect,it} from 'vitest';
import {TimetableView} from '../../src/renderer/planner/TimetableView';
import {makeClass,makeMeeting} from '../fixtures/projects';

it('puts all seven weekdays in rows and 08:00–18:00 across the horizontal axis',()=>{
  const option=makeClass({meetings:[makeMeeting({startMinute:480,endMinute:540}),makeMeeting({day:5,startMinute:1020,endMinute:1080})]});
  const {container}=render(<TimetableView courses={[{code:'TEST1013',name:'School day',classes:[option]}]} timetable={{classIds:[option.id]}} week={1}/>);
  expect([...container.querySelectorAll('.day-label')].map(e=>e.textContent)).toEqual(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
  expect(container.querySelector('.time-axis')).toHaveTextContent('08:00');
  expect(screen.getByText('08:00',{exact:true})).toBeInTheDocument();
  expect(screen.getByText('18:00',{exact:true})).toBeInTheDocument();
});

it('keeps weekend and evening meetings visible when a timetable needs them',()=>{
  const option=makeClass({meetings:[makeMeeting({day:6,startMinute:1080,endMinute:1200})]});
  const {container}=render(<TimetableView courses={[{code:'TEST1013',name:'Evening class',classes:[option]}]} timetable={{classIds:[option.id]}} blocked={[{day:7,startMinute:420,endMinute:480}]} week={1}/>);
  expect(container.querySelectorAll('.day-row')).toHaveLength(7);
  expect(screen.getByText('07:00',{exact:true})).toBeInTheDocument();
  expect(screen.getByText('20:00',{exact:true})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/18:00 to 20:00/})).toBeInTheDocument();
  expect(screen.getByText('Unavailable')).toBeInTheDocument();
});
