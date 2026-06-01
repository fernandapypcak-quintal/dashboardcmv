import { APPS_SCRIPT_URL, normalizaUnidade } from './config';

const n = v => parseFloat(String(v).replace(',', '.')) || 0;
const s = v => String(v ?? '').trim();

// ── Parser: ficha técnica ──────────────────────────────────
function parseFicha(r) {
  // Só parseia campos brutos — cálculos (CMV, margem) feitos no hook após agrupar ingredientes
  return {
    codPa:          s(r.cod_pa),
    skuZig:         s(r.sku_zig),
    nomePa:         s(r.nome_pa),
    categoria:      s(r.categoria),
    subcategoria:   s(r.subcategoria),
    codComponente:  s(r.cod_componente),
    descComponente: s(r.desc_componente),
    qtd:            n(r.qtd),
    und:            s(r.und),
    custoUnit:      n(r.custo_unit),
    custoIngr:      n(r.custo_ingr),
    precoVenda:     n(r.preco_venda),
  };
}

// ── Parser: desperdício ────────────────────────────────────
function parseDesperdicio(r) {
  return {
    data:          s(r.data),
    mes:           s(r.mes).toLowerCase(),
    semana:        n(r.semana),
    unidade:       normalizaUnidade(s(r.unidade)),
    funcionario:   s(r.funcionario),
    produto:       s(r.nome_produto || r.produto),
    quantidade:    n(r.quantidade),
    custoUnit:     n(r.custo_unit),
    custoTotal:    n(r.custo_total) || n(r.valor_de_custo_total) || n(r.valor_total),
    valorVenda:    n(r.valor_venda),
    classificacao: s(r.classificacao).trim(),
    justificativa: s(r.justificativa),
  };
}

// ── Parser: vendas ZIG ─────────────────────────────────────
function parseVenda(r) {
  return {
    transactionId:   s(r.transaction_id),
    transactionDate: s(r.transaction_date),
    eventDate:       s(r.event_date),
    productSku:      s(r.product_sku),
    productName:     s(r.product_name),
    productCategory: s(r.product_category),
    unitValue:       n(r.unit_value),
    count:           n(r.count),
    discountValue:   n(r.discount_value),
    loja:            s(r.loja),
    canal:           s(r.canal),
    periodo:         s(r.periodo),
  };
}

// ── Parser: histórico por produto ─────────────────────────
function parseHistProd(r) {
  return {
    semanaISO:    s(r.semana_iso),
    dataRef:      s(r.data_ref),
    codPa:        s(r.cod_pa),
    skuZig:       s(r.sku_zig),
    nomePa:       s(r.nome_pa),
    categoria:    s(r.categoria),
    subcategoria: s(r.subcategoria),
    precoVenda:   n(r.preco_venda),
    custoIngr:    n(r.custo_ingr),
    cmvPct:       n(r.cmv_pct),
    margemPct:    n(r.margem_contrib_pct),
    status:       s(r.status),
  };
}

// ── Fetch com fallback ─────────────────────────────────────
export async function fetchTipo(tipo, params = {}) {
  try {
    const qs = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const url = `${APPS_SCRIPT_URL}?tipo=${tipo}${qs ? '&' + qs : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[loader] Falha ao buscar ${tipo}:`, e.message);
    return {};
  }
}

// ── Salva parâmetros no Apps Script ───────────────────────────
export async function saveParametros(params) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ tipo: 'salvar_parametros', parametros: params }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[loader] Falha ao salvar parâmetros:', e.message);
    return { erro: e.message };
  }
}

// ── Entry point ────────────────────────────────────────────
export async function loadCMVData() {
  const [resFichas, resDesperdicio, resVendas, resParams, resHistory] = await Promise.all([
    fetchTipo('fichas'),
    fetchTipo('desperdicio'),
    fetchTipo('vendas'),
    fetchTipo('parametros'),
    fetchTipo('history'),
  ]);

  const fichas = (resFichas.fichas ?? [])
    .map(parseFicha)
    .filter(r => r.codPa && r.nomePa);

  // historico/histProd/histComp substituídos pelo history.json do inventário
  const historico = [];

  const desperdicio = (resDesperdicio.desperdicio ?? [])
    .map(parseDesperdicio)
    .filter(r => r.unidade);
  console.log('[desperdicio] parsed:', desperdicio.length, '| exemplo unidade:', desperdicio[0]?.unidade, '| custo:', desperdicio[0]?.custoTotal);

  const histProd = [];
  const histComp = [];
  const history  = resHistory.history ?? [];

  const vendas = (resVendas.vendas ?? [])
    .map(parseVenda)
    .filter(r => r.productSku && r.count > 0);

  const parametros = resParams.parametros ?? { taxa_ifood: 24.8, embalagem_padrao: 3.0 };

  console.log(`[CMV] fichas=${fichas.length} desperdício=${desperdicio.length} vendas=${vendas.length} history=${history.length}`);
  return { fichas, historico, desperdicio, histProd, histComp, vendas, parametros, history };
}
