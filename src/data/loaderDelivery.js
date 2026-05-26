// ── LOADER DELIVERY ────────────────────────────────────────
// Custo vem de duas fontes (em ordem de prioridade):
//   1. Ficha técnica principal (cruzamento por SKU ZIG)
//   2. mapa_delivery da planilha (custo calculado na planilha de delivery)
// Preço de venda: unitValue da ZIG (preço real praticado no iFood)

import { APPS_SCRIPT_URL } from './config';

const n = v => parseFloat(String(v ?? '').replace(',', '.')) || 0;
const s = v => String(v ?? '').trim();

async function fetchTipo(tipo) {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?tipo=${tipo}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[delivery] Falha ao buscar ${tipo}:`, e.message);
    return {};
  }
}

export async function loadDeliveryData(fichas = []) {
  // Mapa SKU ZIG → custo da ficha técnica principal
  const custoPorSkuFicha = {};
  fichas.forEach(f => {
    if (f.skuZig && !custoPorSkuFicha[f.skuZig]) {
      custoPorSkuFicha[f.skuZig] = {
        custo:        f.custoIngr,
        nomePa:       f.nomePa,
        categoria:    f.categoria,
        subcategoria: f.subcategoria,
        fonte:        'ficha_tecnica',
      };
    }
  });

  // Busca vendas delivery — já vêm com custoMapa do mapa_delivery
  const res    = await fetchTipo('vendas_delivery');
  const vendas = (res.vendas ?? []).filter(r => r.productSku && r.count > 0);

  // Agrupa por SKU
  const porProduto = new Map();

  vendas.forEach(v => {
    const sku     = s(v.productSku);
    const preco   = n(v.unitValue);
    const desc    = n(v.discountValue);
    const qtd     = n(v.count);
    const receita = Math.max(0, preco - desc) * qtd;

    // Prioridade de custo: ficha técnica > mapa_delivery
    const fichaCross = custoPorSkuFicha[sku];
    const custo      = fichaCross ? fichaCross.custo : n(v.custoMapa);
    const temFicha   = !!fichaCross || !!n(v.custoMapa);
    const fonte      = fichaCross ? 'ficha_tecnica' : (n(v.custoMapa) > 0 ? 'mapa_delivery' : 'sem_custo');

    const custoTotal = custo * qtd;

    if (!porProduto.has(sku)) {
      porProduto.set(sku, {
        skuZig:       sku,
        nomePa:       fichaCross?.nomePa    || s(v.productName),
        categoria:    fichaCross?.categoria || s(v.productCategory),
        subcategoria: fichaCross?.subcategoria || '',
        tipo:         s(v.tipo) || 'AVULSO',
        qtdTotal:     0,
        receitaTotal: 0,
        custoTotal:   0,
        precoMedio:   0,
        custoUnit:    custo,
        temFicha,
        fonte,
      });
    }

    const p = porProduto.get(sku);
    p.qtdTotal     += qtd;
    p.receitaTotal += receita;
    p.custoTotal   += custoTotal;
  });

  // Calcula CMV e métricas
  porProduto.forEach(p => {
    p.cmvReal    = p.receitaTotal > 0 ? p.custoTotal / p.receitaTotal : 0;
    p.precoMedio = p.qtdTotal > 0 ? p.receitaTotal / p.qtdTotal : 0;
    p.margemPct  = p.receitaTotal > 0 ? (p.receitaTotal - p.custoTotal) / p.receitaTotal : 0;
  });

  const lista = [...porProduto.values()]
    .sort((a, b) => b.custoTotal - a.custoTotal);

  // KPIs — só produtos com custo conhecido
  const comFicha       = lista.filter(r => r.temFicha);
  const semFicha       = lista.filter(r => !r.temFicha).length;
  const receitaTotal   = lista.reduce((s, r) => s + r.receitaTotal, 0);
  const custoTotal     = lista.reduce((s, r) => s + r.custoTotal, 0);
  const recComFicha    = comFicha.reduce((s, r) => s + r.receitaTotal, 0);
  const custoComFicha  = comFicha.reduce((s, r) => s + r.custoTotal, 0);
  const cmvGeral       = recComFicha > 0 ? custoComFicha / recComFicha : 0;

  console.log(`[Delivery] ${vendas.length} vendas | ${lista.length} produtos | com custo: ${comFicha.length} | sem custo: ${semFicha} | CMV: ${(cmvGeral*100).toFixed(1)}%`);

  return {
    vendas, porProduto: lista,
    receitaTotal, custoTotal,
    recComFicha, custoComFicha, cmvGeral,
    semFicha,
  };
}
