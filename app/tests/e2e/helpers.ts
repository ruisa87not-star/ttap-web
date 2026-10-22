import {expect,type Page} from '@playwright/test';
import type {Project} from '../../src/shared/model';
import {decodeProject} from '../../src/shared/project';
import {solveTimetables} from '../../src/core/solveTimetables';
import {readFile} from 'node:fs/promises';
export async function demo(page:Page){
  await page.getByRole('button',{name:'Try demo'}).click();await page.getByRole('button',{name:'Use these courses'}).click();
  await expect(page.getByRole('checkbox',{name:/^TEST1013 /})).not.toBeChecked();
  await page.getByRole('checkbox',{name:/^TEST1013 /}).check();await page.getByRole('checkbox',{name:/^TEST2023 /}).check();
}
export async function configure(page:Page){
  await page.getByLabel('Tutorial for TEST1013').selectOption({label:'Group 1 / #3'});
  await page.getByRole('combobox',{name:'Day',exact:true}).selectOption('6');await page.getByRole('button',{name:'Add unavailable time'}).click();
}
export async function generate(page:Page){await page.getByRole('button',{name:'Generate',exact:true}).click();await expect(page.getByText('Option 1 of 2')).toBeVisible();}
export async function downloadProject(page:Page,path:string){
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export project'}).click();await (await event).saveAs(path);
  await page.getByRole('button',{name:'I kept the file'}).click();await expect(page.getByText('Project is up to date')).toBeVisible();
}
export async function openWebProject(page:Page,path:string){const event=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Open project'}).click();await (await event).setFiles(path);}
export async function readProject(path:string):Promise<Project>{const result=decodeProject(await readFile(path,'utf8'));if(!result.ok)throw new Error(result.errors.join(' '));return result.value;}
export async function expectCandidate(page:Page,project:Project,index=0){
  const timetable=solveTimetables({courses:project.courses,selection:project.selection}).solutions[index];
  const names=await page.getByRole('region',{name:'Weekly timetable'}).getByRole('button').evaluateAll(elements=>elements.map(e=>e.getAttribute('aria-label')??''));
  const types:Record<string,string>={L:'Lecture',T:'Tutorial',P:'Practical'};
  const actual=project.courses.flatMap(c=>c.classes.filter(o=>names.some(n=>n.startsWith(`${c.code} ${c.name}, ${types[o.type]??o.type} group ${o.group}, `))).map(o=>o.id)).sort();
  expect(actual).toEqual(timetable.classIds);
}
export function difficultProject():Project{
  const courses=Array.from({length:28},(_,i)=>{
    const code='LOAD'+String(i).padStart(2,'0');const slot=i===27?26:i;const startMinute=480+(slot%20)*30;
    return {code,name:'Cancellation fixture '+i,classes:[1,2].map(n=>({id:JSON.stringify([code,'L',String(n),String(n)]),courseCode:code,type:'L',number:String(n),group:String(n),meetings:[{day:1+Math.floor(slot/20),startMinute,endMinute:startMinute+30,weeks:[1],room:'Test'}]}))};
  });
  return {schemaVersion:1,sources:['Synthetic cancellation test'],courses,selection:{courseCodes:courses.map(c=>c.code),lockedClassIds:[],blocked:[]}};
}
