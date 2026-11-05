import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {messages} from './translations';
export const LANGUAGE_KEY='hmusic-language';
const languages=['en','ja','zh-TW'];
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=Object.keys(messages).filter(key=>key.includes('{0}')).map(key=>({key,expression:new RegExp('^'+key.split(/\{\d+\}/).map(escape).join('(.+?)')+'$')}));
export function translate(text,language='en'){
 if(typeof text!=='string'||language==='zh-TW')return text;
 const column=language==='ja'?1:0;
 if(messages[text])return messages[text][column];
 for(const {key,expression} of patterns){const match=text.match(expression);if(match)return messages[key][column].replace(/\{(\d+)\}/g,(_,i)=>match[Number(i)+1]);}
 return text;
}
function savedLanguage(){try{const value=window.localStorage.getItem(LANGUAGE_KEY);return languages.includes(value)?value:'en';}catch{return 'en';}}
const I18nContext=createContext({language:'en',setLanguage:()=>{},t:text=>translate(text)});
export function I18nProvider({children}){
 const [language,setLanguage]=useState(savedLanguage);
 useEffect(()=>{document.documentElement.lang=language;try{window.localStorage.setItem(LANGUAGE_KEY,language);}catch{/* A blocked preference store should not prevent switching. */}},[language]);
 const value=useMemo(()=>({language,setLanguage:value=>{if(languages.includes(value))setLanguage(value);},t:text=>translate(text,language)}),[language]);
 return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export const useTranslation=()=>useContext(I18nContext);
