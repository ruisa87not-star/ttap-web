import {test,expect,_electron,type ElectronApplication} from '@playwright/test';
import {resolve} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {demo,configure,generate,downloadProject,openWebProject,readProject,expectCandidate,expectPrimaryActionInViewport} from './helpers';
let app:ElectronApplication;
test.beforeEach(async()=>{app=await _electron.launch({executablePath:resolve('release/win-unpacked/TTAP-Planner.exe')});const page=await app.firstWindow();await page.getByRole('button',{name:'Skip tutorial'}).click();});
test.afterEach(async()=>{if(app){await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>w.destroy())).catch(()=>{});await app.close();}});

test('official login, manual guide and reversible navigation work in the packaged app',async({},info)=>{
  const page=await app.firstWindow();await app.evaluate(({shell})=>{shell.openExternal=async url=>{Reflect.set(globalThis,'__ttapTestRegistrationURL',url);};});
  await page.getByRole('link',{name:'Open Course Registration System'}).click();expect(await app.evaluate(()=>Reflect.get(globalThis,'__ttapTestRegistrationURL'))).toBe('https://unitreg.utar.edu.my/portal/courseRegStu/login.jsp');
  await page.getByText('How to add slots manually?',{exact:true}).click();await expect(page.getByRole('region',{name:'Manual slot import guide'})).toContainText('Ctrl + U');
  await demo(page);await generate(page);await page.getByRole('button',{name:'Hide courses'}).click();await expect(page.getByRole('button',{name:'Show courses'})).toHaveAttribute('aria-expanded','false');
  await page.screenshot({path:info.outputPath('desktop-expanded.png')});await page.getByRole('button',{name:'Go back'}).click();await page.getByRole('button',{name:'Back to planner'}).click();await expect(page.getByText('Option 1 of 2')).toBeVisible();
  await page.getByRole('button',{name:'Show courses'}).click();await expect(page.getByRole('checkbox',{name:/^TEST1013 /})).toBeChecked();await page.getByRole('button',{name:'Tutorial',exact:true}).click();await page.getByRole('button',{name:'Skip tutorial'}).click();await expect(page.getByText('Option 1 of 2')).toBeVisible();
});
test('primary action remains visible in a compact Windows window',async()=>{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1280,720));const page=await app.firstWindow();await demo(page);
  await page.getByRole('link',{name:'TTAP UTAR timetable planner'}).scrollIntoViewIfNeeded();await expectPrimaryActionInViewport(page);
});
test('native HTML import preserves the archived spanned-Remark layout',async()=>{
  const page=await app.firstWindow();await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},resolve('tests/fixtures/student-td-mode.html'));
  await page.getByRole('button',{name:'Choose HTML files'}).click();await expect(page.getByText('1 courses',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Use these courses'}).click();await page.getByRole('checkbox',{name:/^TEST1013 /}).check();await page.getByRole('button',{name:'Generate',exact:true}).click();
  await expect(page.getByText('Option 1 of 1')).toBeVisible();const timetable=page.getByRole('region',{name:'Weekly timetable'});await expect(timetable.getByRole('button',{name:/Lecture group 1, 09:00/})).toBeVisible();await expect(timetable.getByRole('button',{name:/Lecture group 1, 10:00/})).toBeVisible();
});
test('web download and native save round-trip with matching canonical candidates',async({page},info)=>{
  await page.goto('/');await page.getByRole('button',{name:'Skip tutorial'}).click();await demo(page);await configure(page);await generate(page);const webPath=info.outputPath('from-web.ttap.json');await downloadProject(page,webPath);const original=await readProject(webPath);
  const desktop=await app.firstWindow();await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},webPath);
  await desktop.getByRole('button',{name:'Open project'}).click();await generate(desktop);await expectCandidate(desktop,original);
  const nativePath=info.outputPath('from-desktop.ttap.json');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},nativePath);
  await desktop.getByRole('button',{name:'Export project'}).click();await expect(desktop.getByText('Saved from-desktop.ttap.json.')).toBeVisible();expect(await readProject(nativePath)).toEqual(original);
  await openWebProject(page,nativePath);await generate(page);await expectCandidate(page,original);
  await desktop.screenshot({path:info.outputPath('desktop.png'),fullPage:true});
});
test('packaged importer cannot execute HTML or fetch its resources, and protocol rejects other files',async({},info)=>{
  const page=await app.firstWindow();let probes=0;page.on('request',r=>{if(r.url().includes('import-probe'))probes++;});
  const path=info.outputPath('untrusted.html');const html=await readFile('tests/fixtures/student-v2.html','utf8');
  await writeFile(path,html+`<script>window.__importExecuted=true;fetch('https://example.com/import-probe-script')</script><img src="https://example.com/import-probe-image"><iframe src="https://example.com/import-probe-frame"></iframe>`);
  await app.evaluate(({dialog},filePath)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filePath]});},path);
  await page.getByRole('button',{name:'Choose HTML files'}).click();await expect(page.getByText('2 courses',{exact:true})).toBeVisible();expect(await page.evaluate(()=>Reflect.get(window,'__importExecuted'))).toBeUndefined();expect(probes).toBe(0);
  expect(await app.evaluate(async({net})=>{const response=await net.fetch('ttap://app/main/index.js');return response.status;})).toBe(404);
});
test('packaged demo, native HTML picker and cancelled save preserve dirty-close protection',async()=>{
  const page=await app.firstWindow();const paths=[resolve('tests/fixtures/student-v2.html'),resolve('tests/fixtures/paginated.html')];
  await app.evaluate(({dialog},filePaths)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths});dialog.showSaveDialog=async()=>({canceled:true,filePath:''});},paths);
  await page.getByRole('button',{name:'Choose HTML files'}).click();await expect(page.getByText('2 courses',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Use these courses'}).click();await page.getByRole('checkbox',{name:/^TEST1013 /}).check();
  await page.getByRole('button',{name:'Generate',exact:true}).click();await expect(page.getByRole('region',{name:'Weekly timetable'})).toContainText('TEST1013');
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await page.getByRole('button',{name:'Export and continue'}).click();await expect(page.getByRole('dialog',{name:'Keep your changes?'})).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByText('Unsaved changes')).toBeVisible();
  const prefs=await app.evaluate(({BrowserWindow})=>{const wc=BrowserWindow.getAllWindows()[0].webContents as Electron.WebContents&{getLastWebPreferences:()=>Electron.WebPreferences};const p=wc.getLastWebPreferences();return {sandbox:p.sandbox,contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration,webSecurity:p.webSecurity};});expect(prefs).toEqual({sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true});
  expect(await page.evaluate(()=>({require:typeof Reflect.get(window,'require'),process:typeof Reflect.get(window,'process'),bridge:Object.keys(window.ttap??{}).sort()}))).toEqual({require:'undefined',process:'undefined',bridge:['confirmClose','exportProject','onCloseRequested','openProject','openRegistration','pickHtml','setDirty']});
});
