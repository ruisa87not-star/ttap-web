import {UTAR_REGISTRATION_URL} from '../../shared/registration';

export function RegistrationLink({onOpen}:{onOpen?:()=>void}){
  return <div className="registration-link"><a href={UTAR_REGISTRATION_URL} target="_blank" rel="noopener noreferrer" onClick={event=>{if(onOpen){event.preventDefault();onOpen();}}}>Open Course Registration System</a></div>;
}
