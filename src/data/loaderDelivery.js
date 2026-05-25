// ── LOADER DELIVERY ────────────────────────────────────────
// Preparado para quando a seção Delivery for ativada na sidebar
// Chama ?tipo=vendas_delivery que já explode combos via ficha técnica

import { APPS_SCRIPT_URL } from './config';

const n = v => parseFloat(String(v).replace(',', '.')) || 0;
const s = v => String(v ?? '').trim();

async function fetchDelivery() {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?tipo=vendas_delivery`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[delivery] Falha:', e.message);
    return {};
  }
}

function parseVendaDelivery(r) {
  return {
    txId:           s(r.txId),
    dataVenda:      s(r.dataVenda),
    loja:           s(r.loja),
    periodo:        s(r.periodo),
    tipo:           s(r.tipo),           // AVULSO | COMBO_FIXO | COMBO_MONTAVEL
    skuCombo:       s(r.skuCombo),
    nomeCombo:      s(r.nomeCombo),
    categoriaCombo: s(r.categoriaCombo),
    precoVenda:     n(r.precoVenda),
    descontoUnit:   n(r.descontoUnit),
    receitaUnit:    n(r.receitaUnit),
    qtd:            n(r.qtd),
    custoUnit:      n(r.custoUnit),
    cmvPct:         n(r.cmvPct),
    // Itens do combo (para combos fixos)
    itens: (r.itens || []).map(it => ({
      skuItem:         s(it.skuItem),
      nomeItem:        s(it.nomeItem),
      qtd:             n(it.qtd),
      custoItem:       n(it.custoItem),
      participacaoPct: n(it.participacaoPct),
    })),
  };
}

export async function loadDeliveryData() {
  const res = await fetchDelivery();
  const vendas = (res.vendas ?? [])
    .map(parseVendaDelivery)
    .filter(r => r.skuCombo && r.qtd > 0);

  // Agrupa por produto para análise de CMV
  const porProduto = new Map();
  vendas.forEach(v => {
    const key = v.skuCombo;
    if (!porProduto.has(key)) {
      porProduto.set(key, {
        skuCombo:       v.skuCombo,
        nomeCombo:      v.nomeCombo,
        categoriaCombo: v.categoriaCombo,
        tipo:           v.tipo,
        qtdTotal:       0,
        receitaTotal:   0,
        custoTotal:     0,
        cmvPct:         v.cmvPct,
        itens:          v.itens,
      });
    }
    const p = porProduto.get(key);
    p.qtdTotal    += v.qtd;
    p.receitaTotal += v.receitaUnit * v.qtd;
    p.custoTotal   += v.custoUnit * v.qtd;
  });

  // Recalcula CMV real com volume
  porProduto.forEach(p => {
    p.cmvReal = p.receitaTotal > 0 ? p.custoTotal / p.receitaTotal : p.cmvPct;
  });

  console.log(`[Delivery] ${vendas.length} transações | ${porProduto.size} produtos únicos`);
  return {
    vendas,
    porProduto: [...porProduto.values()].sort((a, b) => b.custoTotal - a.custoTotal),
  };
}
