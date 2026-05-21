import { APPS_SCRIPT_URL, MAPA_LOJAS } from './config';

const n = v => parseFloat(String(v).replace(',', '.')) || 0;
const s = v => String(v ?? '').trim();

// ── Parser: ficha técnica ──────────────────────────────────
function parseFicha(r) {
  const codPa    = s(r.cod_pa);
  const codComp  = s(r.cod_componente);
  const cmvPct   = n(r.cmv_pct);
  const custoIngr = n(r.custo_ingr);
  const precoVenda = n(r.preco_venda);
  return {
    codPa,
    skuZig:       s(r.sku_zig),    // preenchido pelo Apps Script via cruzamento
    nomePa:       s(r.nome_pa),
    categoria:    s(r.categoria),
    subcategoria: s(r.subcategoria),
    tipo:         s(r.tipo),        // 'produto_final' ou 'ingrediente'
    // Ingrediente desta linha
    codComponente:  codComp,
    descComponente: s(r.desc_componente),
    qtd:            n(r.qtd),
    und:            s(r.und),
    custoUnit:      n(r.custo_unit),
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
  const unidade = s(r.unidade).toUpperCase().trim()
    .replace('CARINAS ', 'CARINAS').replace('AVARIAS ', 'AVARIAS');
  return {
    data:          s(r.data),
    mes:           s(r.mes).toLowerCase(),
    semana:        n(r.semana),
    unidade:       unidade,
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

// ── Parser: histórico CMV ──────────────────────────────────
function parseHistorico(r) {
  return {
    semanaISO:    s(r.semana_iso),
    dataRef:      s(r.data_ref),
    codPa:        s(r.cod_pa),
    nomePa:       s(r.nome_pa),
    categoria:    s(r.categoria),
    subcategoria: s(r.subcategoria),
    loja:         s(r.loja),
    canal:        s(r.canal),
    precoVenda:   n(r.preco_venda),
    custoCmv:     n(r.custo_cmv),
    cmvPct:       n(r.cmv_pct),
    cmvPctAnt:    n(r.cmv_pct_anterior),
    deltaPp:      n(r.delta_pp),
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
  const [resFichas, resHistorico, resDesperdicio] = await Promise.all([
    fetchTipo('fichas'),
    fetchTipo('historico'),
    fetchTipo('desperdicio'),
  ]);

  const fichas = (resFichas.fichas ?? [])
    .map(parseFicha)
    .filter(r => r.codPa && r.nomePa);

  const historico = (resHistorico.historico ?? [])
    .map(parseHistorico)
    .filter(r => r.semanaISO && r.nomePa);

  const desperdicio = (resDesperdicio.desperdicio ?? [])
    .map(parseDesperdicio)
    .filter(r => r.unidade && r.custoTotal > 0);

  console.log(`[CMV] fichas=${fichas.length} histórico=${historico.length} desperdício=${desperdicio.length}`);
  return { fichas, historico, desperdicio };
}
