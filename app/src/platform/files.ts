import type {ExportReceipt,FileOutcome,HtmlSource,Project} from '../shared/model';
import {browserFilePort} from './browser';
export interface FilePort {
  pickHtml():Promise<FileOutcome<HtmlSource[]>>;
  openProject():Promise<FileOutcome<{name:string;text:string}>>;
  exportProject(project:Project):Promise<FileOutcome<ExportReceipt>>;
}
export function getFilePort():FilePort{return browserFilePort;}
