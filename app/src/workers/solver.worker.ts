import {solveTimetables} from '../core/solveTimetables';
import type {SolveInput} from '../shared/model';
self.onmessage=(event:MessageEvent<{requestId:number;input:SolveInput}>)=>{
  const {requestId,input}=event.data;
  try{self.postMessage({requestId,result:solveTimetables(input)});}
  catch(error){self.postMessage({requestId,error:error instanceof Error?error.message:'The timetable search failed.'});}
};
