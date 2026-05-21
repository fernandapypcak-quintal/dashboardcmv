// URL do Apps Script da planilha CMV
// Após publicar o Apps Script, cole a URL aqui
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyisrFoxxf9vYV0Kj2Hm_Iwu5a5KxUczTOWVYENU4PU6_vmVnzvzUgKOE73OABYp26Xg/exec';

const pct = v => parseFloat(v) || 0;
const brl = v => parseFloat(String(v).replace(',', '.')) || 0;

function parseFicha(r) {
  return {
    codPa:        String(r.cod_pa || r.COD_PA || '').trim(),
    nomePa:       String(r.nome_pa || r.NOME_PA || '').trim(),
    categoria:    String(r.categoria || r.CATEGORIA || '').trim(),
    subcategoria: String(r.subcategoria || r.SUBCATEGORIA || '').trim(),
    precoVenda:   brl(r.preco_venda || r.PRECO_VENDA),
    custoIngr:    brl(r.custo_ingr || r.CUSTO_INGR),
    cmvPct:       pct(r.cmv_pct || r.CMV_PCT),
    precoSugerido: brl(r.preco_suge_30pct || r.PRECO_SUGE_30PCT),
  };
}

function parseHistorico(r) {
  return {
    semanaISO:    String(r.semana_iso || r.SEMANA_ISO || '').trim(),
    dataRef:      String(r.data_ref || r.DATA_REF || '').trim(),
    codPa:        String(r.cod_pa || r.COD_PA || '').trim(),
    nomePa:       String(r.nome_pa || r.NOME_PA || '').trim(),
    categoria:    String(r.categoria || r.CATEGORIA || '').trim(),
    subcategoria: String(r.subcategoria || r.SUBCATEGORIA || '').trim(),
    loja:         String(r.loja || r.LOJA || '').trim(),
    precoVenda:   brl(r.preco_venda || r.PRECO_VENDA),
    custoCmv:     brl(r.custo_cmv || r.CUSTO_CMV),
    cmvPct:       pct(r.cmv_pct || r.CMV_PCT),
    cmvPctAnt:    pct(r.cmv_pct_anterior || r.CMV_PCT_ANTERIOR),
    deltaPp:      pct(r.delta_pp || r.DELTA_PP),
    status:       String(r.status || r.STATUS || 'OK').trim(),
    alerta:       String(r.alerta || r.ALERTA || 'NÃO').trim(),
  };
}

function parseDesperdicio(r) {
  return {
    id:            String(r.id || r.ID || '').trim(),
    data:          String(r.data || r.DATA || '').trim(),
    mes:           String(r.mes || r.MES || '').trim().toLowerCase(),
    unidade:       String(r.unidade || r.UNIDADE || '').trim(),
    produto:       String(r.produto || r.PRODUTO || '').trim(),
    quantidade:    brl(r.quantidade || r.QUANTIDADE),
    custoTotal:    brl(r.custo_total || r.CUSTO_TOTAL),
    classificacao: String(r.classificacao || r.CLASSIFICACAO || '').trim(),
  };
}

export async function loadCMVData() {
  const [resFichas, resHistorico, resDesperdicio] = await Promise.allSettled([
    fetch(`${APPS_SCRIPT_URL}?tipo=fichas`).then(r => r.json()),
    fetch(`${APPS_SCRIPT_URL}?tipo=historico`).then(r => r.json()),
    fetch(`${APPS_SCRIPT_URL}?tipo=desperdicio`).then(r => r.json()),
  ]);

  const fichas = resFichas.status === 'fulfilled' && resFichas.value?.fichas
    ? resFichas.value.fichas.map(parseFicha).filter(r => r.codPa && r.nomePa)
    : [];

  const historico = resHistorico.status === 'fulfilled' && resHistorico.value?.historico
    ? resHistorico.value.historico.map(parseHistorico).filter(r => r.semanaISO && r.nomePa)
    : [];

  const desperdicio = resDesperdicio.status === 'fulfilled' && resDesperdicio.value?.desperdicio
    ? resDesperdicio.value.desperdicio.map(parseDesperdicio).filter(r => r.unidade)
    : [];

  console.log(`[CMV loader] Fichas: ${fichas.length} | Histórico: ${historico.length} | Desperdício: ${desperdicio.length}`);

  return { fichas, historico, desperdicio };
}
