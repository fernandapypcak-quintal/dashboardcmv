// ── LOADER DELIVERY ────────────────────────────────────────
// Fonte de dados:
//   Custo      → ficha_tecnica (mesma do salão, cruzada por SKU ZIG)
//   Preço venda → ZIG (lojas "Delivery *" já têm preço delivery)
//   Volume     → ZIG saida-produtos canal DELIVERY
//
// Combos: itens dentro do combo vêm via campo `additions` da ZIG
// e cruzam com a ficha técnica pelo SKU de cada item.

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
  // fichas já vem do useCMV — não busca de novo
  // Monta mapa SKU ZIG → custo unitário da ficha técnica
  const custoPorSku = {};
  fichas.forEach(f => {
    if (f.skuZig && !custoPorSku[f.skuZig]) {
      custoPorSku[f.skuZig] = {
        custo:        f.custoIngr,
        nomePa:       f.nomePa,
        categoria:    f.categoria,
        subcategoria: f.subcategoria,
      };
    }
  });

  // Busca vendas do canal delivery da aba zig_vendas
  const res = await fetchTipo('vendas_delivery');
  const vendas = (res.vendas ?? []).filter(r => r.productSku && r.count > 0);

  // Agrupa por SKU e calcula CMV com custo da ficha técnica
  const porProduto = new Map();

  vendas.forEach(v => {
    const sku    = s(v.productSku);
    const preco  = n(v.unitValue);
    const desc   = n(v.discountValue);
    const qtd    = n(v.count);
    const ficha  = custoPorSku[sku];
    const custo  = ficha ? ficha.custo : 0;
    const receita = Math.max(0, preco - desc) * qtd;
    const custoTotal = custo * qtd;

    if (!porProduto.has(sku)) {
      porProduto.set(sku, {
        skuZig:       sku,
        nomePa:       ficha?.nomePa       || s(v.productName),
        categoria:    ficha?.categoria    || s(v.productCategory),
        subcategoria: ficha?.subcategoria || '',
        tipo:         s(v.tipo) || 'AVULSO',
        qtdTotal:     0,
        receitaTotal: 0,
        custoTotal:   0,
        precoMedio:   0,
        custoUnit:    custo,
        temFicha:     !!ficha,
      });
    }

    const p = porProduto.get(sku);
    p.qtdTotal    += qtd;
    p.receitaTotal += receita;
    p.custoTotal   += custoTotal;
  });

  // Calcula CMV real e preço médio de venda
  porProduto.forEach(p => {
    p.cmvReal   = p.receitaTotal > 0 ? p.custoTotal / p.receitaTotal : 0;
    p.precoMedio = p.qtdTotal > 0 ? p.receitaTotal / p.qtdTotal : 0;
    p.margemPct  = p.receitaTotal > 0 ? (p.receitaTotal - p.custoTotal) / p.receitaTotal : 0;
  });

  const lista = [...porProduto.values()]
    .sort((a, b) => b.custoTotal - a.custoTotal);

  // KPIs consolidados do delivery
  const receitaTotal = lista.reduce((s, r) => s + r.receitaTotal, 0);
  const custoTotal   = lista.reduce((s, r) => s + r.custoTotal, 0);
  const cmvGeral     = receitaTotal > 0 ? custoTotal / receitaTotal : 0;
  const semFicha     = lista.filter(r => !r.temFicha).length;

  console.log(`[Delivery] ${vendas.length} vendas | ${lista.length} produtos | CMV ${(cmvGeral*100).toFixed(1)}% | sem ficha: ${semFicha}`);

  return { vendas, porProduto: lista, receitaTotal, custoTotal, cmvGeral, semFicha };
}
