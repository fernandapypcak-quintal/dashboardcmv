// ── LOADER DELIVERY ────────────────────────────────────────
// Custo → ficha técnica principal (cruzamento por SKU ZIG)
// Preço de venda → ZIG (lojas "Delivery *" já têm preço delivery)

import { fetchTipo } from './loader';

const n = v => parseFloat(String(v ?? '').replace(',', '.')) || 0;
const s = v => String(v ?? '').trim();

export async function loadDeliveryData(fichas = [], semana = null) {
  // Mapa SKU ZIG → dados da ficha técnica
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

  // Busca vendas delivery
  const params = semana && semana !== 'atual' && semana !== 'anterior' ? { semana } : {};
  const res    = await fetchTipo('vendas_delivery', params);
  const vendas = (res.vendas ?? []).filter(r => r.productSku && r.count > 0);

  // Agrupa por SKU
  const porProduto = new Map();
  vendas.forEach(v => {
    const sku    = s(v.productSku);
    const preco  = n(v.unitValue);
    const desc   = n(v.discountValue);
    const qtd    = n(v.count);
    const ficha  = custoPorSku[sku];
    const custo  = ficha ? ficha.custo : 0;
    const receita = Math.max(0, preco - desc) * qtd;

    if (!porProduto.has(sku)) {
      porProduto.set(sku, {
        skuZig:       sku,
        nomePa:       ficha?.nomePa       || s(v.productName),
        categoria:    ficha?.categoria    || s(v.productCategory),
        subcategoria: ficha?.subcategoria || '',
        qtdTotal:     0,
        receitaTotal: 0,
        custoTotal:   0,
        custoUnit:    custo,
        temFicha:     !!ficha,
      });
    }

    const p = porProduto.get(sku);
    p.qtdTotal    += qtd;
    p.receitaTotal += receita;
    p.custoTotal   += custo * qtd;
  });

  porProduto.forEach(p => {
    p.cmvReal   = p.receitaTotal > 0 ? p.custoTotal / p.receitaTotal : 0;
    p.precoMedio = p.qtdTotal > 0 ? p.receitaTotal / p.qtdTotal : 0;
    p.margemPct  = p.receitaTotal > 0 ? (p.receitaTotal - p.custoTotal) / p.receitaTotal : 0;
  });

  const lista        = [...porProduto.values()].sort((a, b) => b.custoTotal - a.custoTotal);
  const comFicha     = lista.filter(r => r.temFicha);
  const semFicha     = lista.filter(r => !r.temFicha).length;
  const receitaTotal = lista.reduce((s, r) => s + r.receitaTotal, 0);
  const custoTotal   = lista.reduce((s, r) => s + r.custoTotal, 0);
  const recComFicha  = comFicha.reduce((s, r) => s + r.receitaTotal, 0);
  const custoComFicha = comFicha.reduce((s, r) => s + r.custoTotal, 0);
  const cmvGeral     = recComFicha > 0 ? custoComFicha / recComFicha : 0;

  console.log(`[Delivery] ${vendas.length} vendas | ${lista.length} produtos | com ficha: ${comFicha.length} | sem ficha: ${semFicha} | CMV: ${(cmvGeral*100).toFixed(1)}%`);

  return { vendas, porProduto: lista, receitaTotal, custoTotal, recComFicha, custoComFicha, cmvGeral, semFicha };
}
