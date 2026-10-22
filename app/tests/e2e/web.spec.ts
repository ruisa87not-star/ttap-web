import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {demo,configure,generate,downloadProject,openWebProject,readProject,expectCandidate,difficultProject} from './helpers';

test('imports the archived td/Mode and spanned-Remark layout with both meetings',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Paste HTML'}).click();await page.getByLabel('UTAR course HTML').fill(await readFile('tests/fixtures/student-td-mode.html','utf8'));
  await page.getByRole('button',{name:'Preview import'}).click();await expect(page.getByText('1 courses',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Use these courses'}).click();await page.getByRole('checkbox',{name:/^TEST1013 /}).check();await page.getByRole('button',{name:'Generate',exact:true}).click();
  await expect(page.getByText('Option 1 of 1')).toBeVisible();const timetable=page.getByRole('region',{name:'Weekly timetable'});await expect(timetable.getByRole('button',{name:/Lecture group 1, 09:00/})).toBeVisible();await expect(timetable.getByRole('button',{name:/Lecture group 1, 10:00/})).toBeVisible();
});

test('demo workflow exports and reopens courses, fixed classes, blocked time and equivalent candidates',async({page},info)=>{
  await page.goto('/');await demo(page);await configure(page);await generate(page);
  await page.getByRole('button',{name:'Next timetable'}).click();await expect(page.getByText('Option 2 of 2')).toBeVisible();await page.getByLabel('Teaching week').selectOption('2');
  const path=info.outputPath('web.ttap.json');await downloadProject(page,path);const project=await readProject(path);expect(project.selection.lockedClassIds).toHaveLength(1);expect(project.selection.blocked).toEqual([{day:6,startMinute:540,endMinute:600}]);
  await page.getByLabel('Teaching week').selectOption('1');await expectCandidate(page,project,1);
  await openWebProject(page,path);await generate(page);await expectCandidate(page,project);await expect(page.getByRole('checkbox',{name:/^TEST2023 /})).toBeChecked();
  await page.screenshot({path:info.outputPath('planner.png'),fullPage:true});
});
test('imports multiple dropped HTML pages, without executing scripts or fetching their resources',async({page})=>{
  await page.goto('/');let probes=0;page.on('request',r=>{if(r.url().includes('/import-probe'))probes++;});
  const html=await readFile('tests/fixtures/student-v2.html','utf8');
  const data=await page.evaluateHandle(({html})=>{const data=new DataTransfer();data.items.add(new File([html+`<script>window.__importExecuted=true;fetch('/import-probe-script')</script><img src="/import-probe-image" onerror="window.__importExecuted=true"><iframe src="/import-probe-frame"></iframe>`],'first.html',{type:'text/html'}));data.items.add(new File([html],'second.htm',{type:'text/html'}));return data;},{html});
  await page.locator('.dropzone').dispatchEvent('drop',{dataTransfer:data});await expect(page.getByText('2 courses',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>Reflect.get(window,'__importExecuted'))).toBeUndefined();expect(probes).toBe(0);await page.getByRole('button',{name:'Use these courses'}).click();await expect(page.getByRole('checkbox',{name:/^TEST1013 /})).not.toBeChecked();
});
test('invalid imports and invalid projects preserve the current work',async({page},info)=>{
  await page.goto('/');await page.getByRole('button',{name:'Paste HTML'}).click();await page.getByLabel('UTAR course HTML').fill('<html>Login required</html>');await page.getByRole('button',{name:'Preview import'}).click();await expect(page.getByRole('button',{name:'Use these courses'})).toBeDisabled();
  await page.getByRole('button',{name:'Cancel import'}).click();await demo(page);
  const path=info.outputPath('broken.json');await writeFile(path,'{"schemaVersion":999}');await openWebProject(page,path);await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('checkbox',{name:/^TEST2023 /})).toBeChecked();
});
test('zero results clears the calendar; cancellation permits an immediate new calculation',async({page},info)=>{
  await page.goto('/');await demo(page);await page.getByLabel('Until').fill('18:00');await page.getByRole('button',{name:'Add unavailable time'}).click();await page.getByLabel('Lecture for TEST1013').selectOption({label:'Group 1 / #1'});
  await page.getByRole('button',{name:'Generate',exact:true}).click();await expect(page.getByText('No timetable matches your current conditions.')).toBeVisible();
  const path=info.outputPath('difficult.json');await writeFile(path,JSON.stringify(difficultProject()));await openWebProject(page,path);await page.getByRole('button',{name:'Discard changes'}).click();
  await page.getByRole('button',{name:'Generate',exact:true}).click();await page.getByRole('button',{name:'Cancel calculation'}).click();
  await page.getByRole('checkbox',{name:'LOAD27 Cancellation fixture 27'}).uncheck();await page.getByRole('button',{name:'Generate',exact:true}).click();await expect(page.getByText('Option 1 of 500')).toBeVisible();await expect(page.getByText(/Showing the first 500/)).toBeVisible();
});
test('narrow layout supports keyboard course selection and panel changes',async({page})=>{
  await page.setViewportSize({width:720,height:900});await page.goto('/');await page.getByRole('button',{name:'Try demo'}).click();await page.getByRole('button',{name:'Use these courses'}).click();
  await page.getByRole('button',{name:'Courses',exact:true}).click();const checkbox=page.getByRole('checkbox',{name:/^TEST1013 /});await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();
  await page.getByRole('button',{name:'Conditions',exact:true}).click();await page.getByRole('button',{name:'Generate',exact:true}).click();await expect(page.getByRole('region',{name:'Weekly timetable'})).toContainText('TEST1013');await expect(page.getByRole('button',{name:'Timetable',exact:true})).toHaveAttribute('aria-pressed','true');
});
