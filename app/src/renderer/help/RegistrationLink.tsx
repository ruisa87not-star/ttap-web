import {useState,type MouseEvent} from 'react';
import {UTAR_REGISTRATION_URL} from '../../shared/registration';

export function RegistrationLink(){
  const[error,setError]=useState(false);
  async function open(event:MouseEvent<HTMLAnchorElement>){
    if(!window.ttap)return;
    event.preventDefault();setError(false);
    try{await window.ttap.openRegistration();}catch{setError(true);}
  }
  return <div className="registration-link"><a href={UTAR_REGISTRATION_URL} target="_blank" rel="noopener noreferrer" onClick={open}>Open Course Registration System<span aria-hidden="true"> ↗</span></a>
    {error&&<p className="error" role="alert">The website could not be opened. Open this address in your browser: {UTAR_REGISTRATION_URL}</p>}
  </div>;
}
