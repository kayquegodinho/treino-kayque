// js/storage.js

function save(key,value){

localStorage.setItem(
key,
JSON.stringify(value)
);

}

function load(key,fallback){

const data =
localStorage.getItem(key);

if(!data){
return fallback;
}

try{

return JSON.parse(data);

}catch{

return fallback;

}

}