// URL do Apps Script — substitua após publicar
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyisrFoxxf9vYV0Kj2Hm_Iwu5a5KxUczTOWVYENU4PU6_vmVnzvzUgKOE73OABYp26Xg/exec';

// Mapa de lojas ZIG → loja normalizada + canal
export const MAPA_LOJAS = {
  'Quintal do Espeto Carinás':          { loja: 'CARINAS',       canal: 'CASA' },
  'Delivery Carinás':                   { loja: 'CARINAS',       canal: 'DELIVERY' },
  'Quintal do Espeto Lapa ':            { loja: 'LAPA',          canal: 'CASA' },
  'Delivery Lapa':                      { loja: 'LAPA',          canal: 'DELIVERY' },
  'Quintal do Espeto  V. Mariana':      { loja: 'VILA MARIANA',  canal: 'CASA' },
  'Delivery V. Mariana':                { loja: 'VILA MARIANA',  canal: 'DELIVERY' },
  'Quintal do Espeto Chac Sto Antonio': { loja: 'CHACARA',       canal: 'CASA' },
  'Delivery Chac. Sto Antonio':         { loja: 'CHACARA',       canal: 'DELIVERY' },
  'Quintal do Espeto Santo André':      { loja: 'SANTO ANDRE',   canal: 'CASA' },
  'Delivery Santo André':               { loja: 'SANTO ANDRE',   canal: 'DELIVERY' },
  'Quintal do Espeto Pavão':            { loja: 'PAVAO',         canal: 'CASA' },
  'Delivery Pavão':                     { loja: 'PAVAO',         canal: 'DELIVERY' },
  'Quintal do Espeto  V. Madalena':     { loja: 'VILA MADALENA', canal: 'CASA' },
  'Delivery Vila Madalena':             { loja: 'VILA MADALENA', canal: 'DELIVERY' },
  'Quintal do Espeto Perdizes':         { loja: 'PERDIZES',      canal: 'CASA' },
  'Delivery Perdizes':                  { loja: 'PERDIZES',      canal: 'DELIVERY' },
  'Quintal do Espeto Tatuapé':          { loja: 'TATUAPE',       canal: 'CASA' },
  'Delivery Tatuapé':                   { loja: 'TATUAPE',       canal: 'DELIVERY' },
  'Quintal do Espeto Santana':          { loja: 'SANTANA',       canal: 'CASA' },
  'Delivery Santana':                   { loja: 'SANTANA',       canal: 'DELIVERY' },
};

export const LOJAS = [...new Set(Object.values(MAPA_LOJAS).map(v => v.loja))].sort();

// Almoço: seg–sex, 11h–15h
export const ALMOCO_INICIO = 11;
export const ALMOCO_FIM    = 15;

// Meta CMV global
export const META_CMV = 0.30;
