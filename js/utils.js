// js/utils.js

function getToday(){

return new Date()
.toLocaleDateString(
'pt-BR'
);

}

function normalizeDate(date){
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDateKey(date = new Date()){
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getPtBrDateKey(date = new Date()){
  return date.toLocaleDateString('pt-BR');
}
