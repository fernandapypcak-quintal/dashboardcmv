import { APPS_SCRIPT_URL, normalizaUnidade, LOJAS_ATIVAS } from './config';

const n = v => parseFloat(String(v).replace(',', '.')) || 0;
const s = v => String(v ?? '').trim();

// ── Parser: ficha técnica ──────────────────────────────────
function parseFicha(r) {
  const codPa     = s(r.cod_pa);
  const custoIngr = n(r.custo_ingr);
  const precoVenda = n(r.preco_venda);
  const cmvPct    = n(r.cmv_pct);
  return {
    codPa,
    skuZig:           s(r.sku_zig),
    nomePa:           s(r.nome_pa),
    categoria:        s(r.categoria),
    subcategoria:     s(r.subcategoria),
    codComponente:    s(r.cod_componente),
    descComponente:   s(r.desc_componente),
    qtd:              n(r.qtd),
    und:              s(r.und),
    custoUnit:        n(r.custo_unit),
    custoIngr,
    precoVenda,
    cmvPct,
    margemContribR:   precoVenda > 0 ? precoVenda - custoIngr : 0,
    margemContribPct: precoVenda > 0 ? (precoVenda - custoIngr) / precoVenda : 0,
    precoSugerido:    custoIngr > 0 ? custoIngr / 0.30 : 0,
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
    produto:       s(r.produto),
    quantidade:    n(r.quantidade),
    custoUnit:     n(r.custo_unit),
    custoTotal:    n(r.custo_total),
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
async function fetchTipo(tipo) {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?tipo=${tipo}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[loader] Falha ao buscar ${tipo}:`, e.message);
    return {};
  }
}

// ── Entry point ────────────────────────────────────────────
export async function loadCMVData() {
  const [resFichas, resDesperdicio, resHistorico, resHistProd, resVendas] = await Promise.all([
    fetchTipo('fichas'),
    fetchTipo('desperdicio'),
    fetchTipo('historico'),
    fetchTipo('hist_prod'),
    fetchTipo('vendas'),
  ]);

  const fichas = (resFichas.fichas ?? [])
    .map(parseFicha)
    .filter(r => r.codPa && r.nomePa);

  const historico = (resHistorico.historico ?? [])
    .filter(r => r.semana_iso && r.categoria)
    .map(r => ({
      semanaISO:    s(r.semana_iso),
      dataRef:      s(r.data_ref),
      categoria:    s(r.categoria),
      subcategoria: s(r.subcategoria),
      qtdProdutos:  n(r.qtd_produtos),
      cmvMedio:     n(r.cmv_medio),
      margemMedia:  n(r.margem_media),
      qtdCriticos:  n(r.qtd_criticos),
      status:       s(r.status) || 'OK',
    }));

  const desperdicio = (resDesperdicio.desperdicio ?? [])
    .map(parseDesperdicio)
    .filter(r => r.unidade && LOJAS_ATIVAS.includes(r.unidade) && r.custoTotal > 0);

  const histProd = (resHistProd.hist_prod ?? [])
    .filter(r => r.semana_iso && r.cod_pa)
    .map(parseHistProd);

  const vendas = (resVendas.vendas ?? [])
    .map(parseVenda)
    .filter(r => r.productSku && r.count > 0);

  console.log(`[CMV] fichas=${fichas.length} histórico=${historico.length} desperdício=${desperdicio.length} histProd=${histProd.length} vendas=${vendas.length}`);
  return { fichas, historico, desperdicio, histProd, vendas };
}
