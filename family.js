const defaults={name:'Capitán',cat:'Pipa',dog:'Trébol',friend:'Noa'};
const fields={nombre:'name',gata:'cat',perro:'dog',amiga:'friend'};
const key='brote-bravo.familia.v1';
function clean(value){
  return typeof value==='string' ? Array.from(value.replace(/[\u0000-\u001f\u007f<>]/g,'').trim()).slice(0,30).join('') : '';
}
export function readFamily(){
  const family={...defaults};
  let personalized=false;
  try{
    const saved=JSON.parse(localStorage.getItem(key));
    if(saved && clean(saved.name)){
      personalized=true;
      for(const field of Object.keys(defaults))family[field]=clean(saved[field]) || defaults[field];
    }
  }catch{}
  const fragment=new URLSearchParams(location.hash.slice(1));
  const embedded=new URLSearchParams(document.querySelector('meta[name="brote-familia"]')?.content||'');
  const supplied=clean(fragment.get('nombre')) ? fragment : embedded;
  if(clean(supplied.get('nombre'))){
    personalized=true;
    for(const [parameter,field] of Object.entries(fields))family[field]=clean(supplied.get(parameter))||defaults[field];
    try{localStorage.setItem(key,JSON.stringify(family));}catch{}
  }
  return {family,personalized};
}
