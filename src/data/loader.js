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
  const [resFichas, resDesperdicio, resHistorico, resHistProd, resHistComp, resVendas, resParams] = await Promise.all([
    fetchTipo('fichas'),
    fetchTipo('desperdicio'),
    fetchTipo('historico'),
    fetchTipo('hist_prod'),
    fetchTipo('hist_comp'),
    fetchTipo('vendas'),
    fetchTipo('parametros'),
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
    .filter(r => r.unidade);
  console.log('[desperdicio] parsed:', desperdicio.length, '| exemplo unidade:', desperdicio[0]?.unidade, '| custo:', desperdicio[0]?.custoTotal);

  const histProd = (resHistProd.hist_prod ?? [])
    .filter(r => r.semana_iso && r.cod_pa)
    .map(parseHistProd);

  const histComp = (resHistComp.hist_comp ?? [])
    .filter(r => r.semana_iso && r.cod_pa && r.cod_componente)
    .map(r => ({
      semanaISO:      String(r.semana_iso        || '').trim(),
      dataRef:        String(r.data_ref          || '').trim(),
      codPa:          String(r.cod_pa            || '').trim(),
      nomePa:         String(r.nome_pa           || '').trim(),
      categoria:      String(r.categoria         || '').trim(),
      subcategoria:   String(r.subcategoria      || '').trim(),
      codComponente:  String(r.cod_componente    || '').trim(),
      descComponente: String(r.desc_componente   || '').trim(),
      qtd:            n(r.qtd),
      und:            String(r.und               || '').trim(),
      custoUnit:      n(r.custo_unit),
      custoIngr:      n(r.custo_ingr),
      custoTotalPa:   n(r.custo_total_pa),
      participacaoPct: n(r.participacao_pct),
    }));

  const vendas = (resVendas.vendas ?? [])
    .map(parseVenda)
    .filter(r => r.productSku && r.count > 0);

  const parametros = resParams.parametros ?? { taxa_ifood: 24.8, embalagem_padrao: 3.0 };

  console.log(`[CMV] fichas=${fichas.length} histórico=${historico.length} desperdício=${desperdicio.length} histProd=${histProd.length} histComp=${histComp.length} vendas=${vendas.length}`);
  return { fichas, historico, desperdicio, histProd, histComp, vendas, parametros };
}
