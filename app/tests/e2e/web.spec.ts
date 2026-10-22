import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {demo,configure,generate,downloadImage,openWebProject,readProject,expectCandidate,difficultProject,expectPrimaryActionInViewport,schoolDayProject,expectSchoolDayInViewport} from './helpers';

test.beforeEach(async({page})=>{await page.route('https://unitreg.utar.edu.my/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><h1>UTAR embedded test fixture</h1>'}));await page.goto('/');await page.getByRole('button',{name:'Skip tutorial'}).click();});

test('Monday–Sunday rows and horizontal 08:00–18:00 fit after resizing',async({page},info)=>{
  const path=info.outputPath('school-day.ttap.json');await writeFile(path,JSON.stringify(schoolDayProject()));await openWebProject(page,path);
  await page.getByRole('button',{name:'Generate',exact:true}).click();await expect(page.getByText('Option 1 of 1')).toBeVisible();
  for(const size of [{width:1280,height:720},{width:1024,height:600},{width:375,height:667},{width:320,height:667}]){
    await page.setViewportSize(size);await expectSchoolDayInViewport(page);await page.screenshot({path:info.outputPath(`school-day-${size.width}.png`)});
  }
  await page.getByRole('region',{name:'Friday',exact:true}).getByRole('button').click();await expect(page.locator('.class-details').getByText('Full school day',{exact:true})).toBeVisible();await expectSchoolDayInViewport(page);await page.getByRole('button',{name:'Close details'}).click();await expectSchoolDayInViewport(page);
  await page.setViewportSize({width:1024,height:600});
  const extended=schoolDayProject();extended.courses[0].classes[0].meetings=[{day:6,startMinute:1080,endMinute:1200,weeks:[1],room:'Evening room'}];extended.selection.blocked=[{day:7,startMinute:420,endMinute:480}];
  const extendedPath=info.outputPath('weekend-evening.ttap.json');await writeFile(extendedPath,JSON.stringify(extended));await openWebProject(page,extendedPath);await page.getByRole('button',{name:'Discard changes'}).click();await expect(page.getByText('Option 1 of 1')).toBeVisible();
  await expect(page.getByRole('region',{name:'Saturday',exact:true}).getByRole('button',{name:/18:00 to 20:00/})).toBeInViewport();
  await expect(page.getByRole('region',{name:'Sunday',exact:true}).getByText('Unavailable')).toBeInViewport();
  await expect(page.locator('.time-axis').getByLabel('07:00',{exact:true})).toBeInViewport();await expect(page.locator('.time-axis').getByLabel('20:00',{exact:true})).toBeInViewport();
  expect(await page.locator('.calendar-scroll').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
  await page.screenshot({path:info.outputPath('weekend-evening.png')});
});

test('skip directly reveals a compact embedded registration and a dismissible manual dialog',async({page},info)=>{
  await expect(page.getByRole('region',{name:'Integrated course registration'})).toBeVisible();await expect(page.getByRole('link',{name:'Open Course Registration System'})).toHaveCount(0);
  await expect(page.frameLocator('iframe[title="UTAR Course Registration System"]').getByRole('heading',{name:'UTAR embedded test fixture'})).toBeVisible();
  const box=await page.locator('.registration-frame').boundingBox();expect(box!.width).toBeLessThanOrEqual(896);expect(box!.height).toBeLessThanOrEqual(340);await page.screenshot({path:info.outputPath('registration-home.png')});
  await page.getByRole('button',{name:'Add slots manually'}).click();const dialog=page.getByRole('dialog',{name:'Add slots manually'});await expect(dialog).toBeVisible();
  await dialog.getByText('View step-by-step screenshots',{exact:true}).click();
  expect(await dialog.locator('.guide-images img').evaluateAll(images=>images.length===2&&images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0))).toBe(true);
  await page.screenshot({path:info.outputPath('illustrated-guide.png')});
  await page.getByRole('button',{name:'Paste HTML'}).click();await expect(dialog).toBeVisible();await page.mouse.click(4,4);await expect(dialog).toHaveCount(0);await expect(page.getByRole('button',{name:'Add slots manually'})).toBeFocused();
  await page.getByRole('button',{name:'Add slots manually'}).click();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
});

test('demo opens a full catalog alongside the timetable, summary and visual constraints',async({page},info)=>{
  await page.setViewportSize({width:1280,height:720});await page.getByRole('button',{name:'Try demo'}).click();
  await expect(page.getByRole('checkbox')).toHaveCount(18);await expect(page.getByRole('region',{name:'Weekly timetable'})).toBeVisible();await expect(page.getByText('Sun',{exact:true})).toBeVisible();
  for(const code of ['MPU3143','MPU32013','MPU34072','UKMM1043'])await page.getByRole('checkbox',{name:new RegExp('^'+code+' ')}).check();
  await page.getByRole('button',{name:'Generate',exact:true}).click();await expect(page.getByText(/Option 1 of \d+/)).toBeVisible();await expect(page.getByRole('button',{name:'Next timetable'})).toBeEnabled();
  await page.getByRole('button',{name:'Show summary'}).click();await expect(page.getByRole('table',{name:'Course summary'})).toBeVisible();await expect(page.locator('.course-summary tfoot td')).toHaveText('11');
  expect.soft((await page.locator('.day-row').first().boundingBox())!.height).toBeGreaterThanOrEqual(24);
  await page.screenshot({path:info.outputPath('demo-summary.png')});await page.getByRole('button',{name:'Set time constraint'}).click();
  const dialog=page.getByRole('dialog',{name:'Set time constraint'});await dialog.getByRole('button',{name:'Sunday 17:30–18:00'}).click();await expect(dialog.getByRole('button',{name:'Sunday 17:30–18:00'})).toHaveAttribute('aria-pressed','true');
  expect.soft((await dialog.boundingBox())!.width).toBeGreaterThanOrEqual(1000);
  await page.screenshot({path:info.outputPath('demo-time-constraints.png')});await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('button',{name:'Remove unavailable time 1'})).toHaveCount(0);
});

test('the app frame fits short screens while long sections scroll internally',async({page})=>{
  for(const viewport of [{width:1280,height:720},{width:1024,height:600},{width:375,height:667}]){
    await page.setViewportSize(viewport);await page.reload();
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('button',{name:'Skip tutorial'}).click();await page.getByRole('button',{name:'Add slots manually'}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:1280,height:720});await demo(page);
  await page.setViewportSize({width:375,height:667});await page.getByRole('button',{name:'Timetable',exact:true}).click();
  await expect(page.getByRole('region',{name:'Sunday',exact:true})).toBeVisible();
  await page.setViewportSize({width:1280,height:720});await generate(page);
  const panel=await page.locator('.schedule-panel').boundingBox();expect(panel!.y+panel!.height).toBeLessThanOrEqual(720);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});

test('desktop collapse preserves an active narrow Courses panel when resizing',async({page})=>{
  await demo(page);await page.setViewportSize({width:720,height:900});await page.getByRole('button',{name:'Courses',exact:true}).click();
  await page.setViewportSize({width:1280,height:720});await page.getByRole('button',{name:'Hide courses'}).click();
  await page.setViewportSize({width:375,height:812});await expect(page.getByRole('button',{name:'Courses',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('checkbox',{name:/^TEST1013 /})).toBeVisible();await expect(page.getByRole('checkbox',{name:/^TEST1013 /})).toBeChecked();
});

test('tutorial, manual import guide, sidebar and Back preserve the current plan',async({page},info)=>{
  await page.setViewportSize({width:1280,height:720});await page.reload();await expect(page.getByRole('heading',{name:'A quick tour of TTAP.'})).toBeVisible();
  for(const width of [375,320]){
    await page.setViewportSize({width,height:900});await expect(page.getByRole('button',{name:'Skip tutorial'})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`tutorial-${width}.png`)});
  }
  await page.setViewportSize({width:1280,height:720});
  await expect(page.getByRole('button',{name:'Previous step'})).toBeDisabled();await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('button',{name:'Previous step'}).click();
  await page.screenshot({path:info.outputPath('tutorial.png')});await page.getByRole('button',{name:'Skip tutorial'}).click();
  await expect(page.getByRole('region',{name:'Integrated course registration'})).toBeVisible();
  await page.getByRole('button',{name:'Add slots manually'}).click();await expect(page.getByRole('region',{name:'Manual slot import guide'})).toContainText('Ctrl + U');
  await page.screenshot({path:info.outputPath('manual-guide.png'),fullPage:true});await page.keyboard.press('Escape');await demo(page);await generate(page);
  const before=await page.locator('.schedule-panel').boundingBox();await page.getByRole('button',{name:'Hide courses'}).click();await expect(page.getByRole('checkbox',{name:/^TEST1013 /})).toHaveCount(0);
  const after=await page.locator('.schedule-panel').boundingBox();expect(after!.width).toBeGreaterThan(before!.width);
  await page.screenshot({path:info.outputPath('expanded-timetable.png')});
  await page.getByRole('button',{name:'Go back'}).click();await expect(page.getByRole('region',{name:'Integrated course registration'})).toBeVisible();await expect(page.getByRole('heading',{name:'Import courses.'})).toBeFocused();await page.getByRole('button',{name:'Back to planner'}).click();await expect(page.getByText('Option 1 of 2')).toBeVisible();
  await page.getByRole('button',{name:'Show courses'}).click();await expect(page.getByRole('checkbox',{name:/^TEST1013 /})).toBeChecked();await page.getByRole('button',{name:'Tutorial',exact:true}).click();await page.getByRole('button',{name:'Skip tutorial'}).click();await expect(page.getByText('Option 1 of 2')).toBeVisible();
});

test('primary timetable action stays in view on desktop and every narrow panel',async({page},info)=>{
  await page.setViewportSize({width:1280,height:720});await demo(page);
  await page.getByRole('link',{name:'TTAP UTAR timetable planner'}).scrollIntoViewIfNeeded();await expectPrimaryActionInViewport(page);
  const schedule=await page.locator('.schedule-panel').boundingBox();expect(schedule!.y).toBeLessThan(240);
  await page.screenshot({path:info.outputPath('workbench-1280.png')});
  for(const width of [720,375,320]){
    await page.setViewportSize({width,height:900});await page.getByRole('link',{name:'TTAP UTAR timetable planner'}).scrollIntoViewIfNeeded();
    for(const panel of ['Courses','Timetable','Conditions']){
      await page.getByRole('button',{name:panel,exact:true}).click();await expectPrimaryActionInViewport(page);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    await page.getByRole('button',{name:'Timetable',exact:true}).click();await page.screenshot({path:info.outputPath(`workbench-${width}.png`)});
  }
});
test('course and timetable text remain readable at a laptop viewport',async({page},info)=>{
  await page.setViewportSize({width:1280,height:720});await demo(page);await generate(page);
  expect(await page.locator('.course-name').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(14);
  expect(await page.locator('.meeting strong').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(12);
  expect(await page.locator('.meeting small').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(11);
  await page.screenshot({path:info.outputPath('workbench-generated.png')});
});

test('imports the archived td/Mode and spanned-Remark layout with both meetings',async({page})=>{
  await page.getByRole('button',{name:'Add slots manually'}).click();
  await page.getByRole('button',{name:'Paste HTML'}).click();await page.getByLabel('UTAR course HTML').fill(await readFile('tests/fixtures/student-td-mode.html','utf8'));
  await page.getByRole('button',{name:'Preview import'}).click();await expect(page.getByText('1 courses',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Use these courses'}).click();await page.getByRole('checkbox',{name:/^TEST1013 /}).check();await page.getByRole('button',{name:'Generate',exact:true}).click();
  await expect(page.getByText('Option 1 of 1')).toBeVisible();const timetable=page.getByRole('region',{name:'Weekly timetable'});await expect(timetable.getByRole('button',{name:/Lecture group 1, 09:00/})).toBeVisible();await expect(timetable.getByRole('button',{name:/Lecture group 1, 10:00/})).toBeVisible();
});

test('course edits check clashes immediately and export the selected option as a PNG guide',async({page},info)=>{
  await demo(page);await configure(page);
  await expect(page.getByText('No clashes. Your selected courses fit together.')).toBeVisible();
  await expect(page.getByText('Option 1 of 2')).toBeVisible();
  await expect(page.getByRole('button',{name:'Export project'})).toHaveCount(0);await expect(page.getByLabel('Teaching week')).toHaveCount(0);
  await page.getByRole('button',{name:'Next timetable'}).click();await expect(page.getByText('Option 2 of 2')).toBeVisible();
  await downloadImage(page,info.outputPath('registration-guide.png'));
  await page.getByRole('button',{name:'Previous timetable'}).click();await expect(page.getByText('Image not exported',{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('planner.png')});
});

test('alternating-week meetings remain readable within a bounded calendar',async({page},info)=>{
  const courses=Array.from({length:8},(_,i)=>{const code='ALT'+(i+1),id=JSON.stringify([code,'L','1','1']);return {code,name:'Alternating week '+(i+1),classes:[{id,courseCode:code,type:'L',number:'1',group:'1',meetings:[{day:1,startMinute:540,endMinute:600,weeks:[i+1],room:'Sample room'}]}]};});
  const path=info.outputPath('alternating.json');await writeFile(path,JSON.stringify({schemaVersion:1,sources:[],courses,selection:{courseCodes:courses.map(c=>c.code),lockedClassIds:[],blocked:[]}}));
  await page.setViewportSize({width:1280,height:720});await openWebProject(page,path);await expect(page.getByText('No clashes. Your selected courses fit together.')).toBeVisible();
  for(const button of await page.getByRole('region',{name:'Monday',exact:true}).getByRole('button').all())expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(24);
  await page.getByRole('region',{name:'Monday',exact:true}).getByRole('button',{name:/ALT8 /}).scrollIntoViewIfNeeded();await page.getByRole('region',{name:'Monday',exact:true}).getByRole('button',{name:/ALT8 /}).click();
  await expect(page.locator('.class-details')).toContainText('Alternating week 8');
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('imports multiple dropped HTML pages, without executing scripts or fetching their resources',async({page})=>{
  await page.getByRole('button',{name:'Add slots manually'}).click();
  let probes=0;page.on('request',r=>{if(r.url().includes('/import-probe'))probes++;});
  const html=await readFile('tests/fixtures/student-v2.html','utf8');
  const data=await page.evaluateHandle(({html})=>{const data=new DataTransfer();data.items.add(new File([html+`<script>window.__importExecuted=true;fetch('/import-probe-script')</script><img src="/import-probe-image" onerror="window.__importExecuted=true"><iframe src="/import-probe-frame"></iframe>`],'first.html',{type:'text/html'}));data.items.add(new File([html],'second.htm',{type:'text/html'}));return data;},{html});
  await page.locator('.dropzone').dispatchEvent('drop',{dataTransfer:data});await expect(page.getByText('2 courses',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>Reflect.get(window,'__importExecuted'))).toBeUndefined();expect(probes).toBe(0);await page.getByRole('button',{name:'Use these courses'}).click();await expect(page.getByRole('checkbox',{name:/^TEST1013 /})).not.toBeChecked();
});
test('invalid imports and invalid projects preserve the current work',async({page},info)=>{
  await page.getByRole('button',{name:'Add slots manually'}).click();
  await page.getByRole('button',{name:'Paste HTML'}).click();await page.getByLabel('UTAR course HTML').fill('<html>Login required</html>');await page.getByRole('button',{name:'Preview import'}).click();await expect(page.getByRole('button',{name:'Use these courses'})).toBeDisabled();
  await page.getByRole('button',{name:'Cancel import'}).click();await page.keyboard.press('Escape');await demo(page);
  const path=info.outputPath('broken.json');await writeFile(path,'{"schemaVersion":999}');await openWebProject(page,path);await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('checkbox',{name:/^TEST2023 /})).toBeChecked();
});
test('zero results clears the calendar; cancellation permits an immediate new calculation',async({page},info)=>{
  await demo(page);await page.getByLabel('Until').fill('18:00');await page.getByRole('button',{name:'Add unavailable time'}).click();await page.getByLabel('Lecture for TEST1013').selectOption({label:'Group 1 / #1'});
  await page.getByRole('button',{name:'Generate',exact:true}).click();await expect(page.getByText('No timetable matches your current conditions.')).toBeVisible();
  const path=info.outputPath('difficult.json');await writeFile(path,JSON.stringify(difficultProject()));await openWebProject(page,path);await page.getByRole('button',{name:'Discard changes'}).click();
  await page.getByRole('button',{name:'Cancel calculation'}).click();
  await page.getByRole('checkbox',{name:'LOAD27 Cancellation fixture 27'}).uncheck();await expect(page.getByText('Option 1 of 500')).toBeVisible();await expect(page.getByText(/Showing the first 500/)).toBeVisible();
});
test('narrow layout supports keyboard course selection and panel changes',async({page})=>{
  await page.setViewportSize({width:720,height:900});await page.getByRole('button',{name:'Try demo'}).click();
  await page.getByRole('button',{name:'Courses',exact:true}).click();const checkbox=page.getByRole('checkbox',{name:/^TEST1013 /});await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();
  await page.getByRole('button',{name:'Conditions',exact:true}).click();await page.getByRole('button',{name:'Generate',exact:true}).click();await expect(page.getByRole('region',{name:'Weekly timetable'})).toContainText('TEST1013');await expect(page.getByRole('button',{name:'Timetable',exact:true})).toHaveAttribute('aria-pressed','true');
});
