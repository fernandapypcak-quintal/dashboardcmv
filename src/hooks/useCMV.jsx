import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { loadCMVData } from '../data/loader';
import { META_CMV, LOJAS_ATIVAS } from '../data/config';

const Ctx = createContext(null);

const MESES_ORDER = ['janeiro','fevereiro','março','abril','maio','junho',
                     'julho','agosto','setembro','outubro','novembro','dezembro'];

function avg(arr) { return arr.length ? arr.reduce((s,v)=>s+v,0)/arr.length : 0; }

export function CMVProvider({ children }) {
  const [fichas,      setFichas]      = useState([]);
  const [historico,   setHistorico]   = useState([]);
  const [desperdicio, setDesperdicio] = useState([]);
  const [vendas,     setVendas]     = useState([]);
  const [histProd,   setHistProd]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Filtros ────────────────────────────────────────────
  const [filtroLoja,    setFiltroLoja]    = useState('Todas');
  const [filtroCanal,   setFiltroCanal]   = useState('CASA');
  const [filtroCat,     setFiltroCat]     = useState('Todas');
  const [filtroMes,     setFiltroMes]     = useState('Todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('Todos'); // Todos | Almoço | Jantar/Noite

  useEffect(() => {
    loadCMVData()
      .then(({ fichas, historico, histProd, desperdicio, vendas }) => {
        setFichas(fichas);
        setHistorico(historico);
        setDesperdicio(desperdicio);
        setVendas(vendas || []);
        setHistProd(histProd || []);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Filtro de loja: sempre as 10 lojas ativas, ordem fixa
  const opcoesLojas = useMemo(() =>
    ['Todas', ...LOJAS_ATIVAS],
  []);

  const opcoesCats = useMemo(() =>
    ['Todas', ...new Set(fichas.map(r=>r.categoria).filter(Boolean))].sort(),
  [fichas]);

  const opcoesMeses = useMemo(() => {
    const ms = [...new Set(desperdicio.map(r=>r.mes).filter(Boolean))];
    return ['Todos', ...ms.sort((a,b)=>MESES_ORDER.indexOf(a)-MESES_ORDER.indexOf(b))];
  }, [desperdicio]);

  // ── Produtos únicos (agrupados por PA, não por ingrediente) ───
  // Cada produto final aparece uma vez com seus totais
  const produtosUnicos = useMemo(() => {
    const map = new Map();
    fichas.forEach(r => {
      const key = r.codPa;
      if (!map.has(key)) {
        map.set(key, {
          codPa:        r.codPa,
          skuZig:       r.skuZig,
          nomePa:       r.nomePa,
          categoria:    r.categoria,
          subcategoria: r.subcategoria,
          precoVenda:   r.precoVenda,
          custoIngr:    0,
          cmvPct:       r.cmvPct,
          margemContribR:   r.margemContribR,
          margemContribPct: r.margemContribPct,
          precoSugerido:    r.precoSugerido,
          ingredientes: [],
        });
      }
      map.get(key).ingredientes.push({
        codComponente:  r.codComponente,
        descComponente: r.descComponente,
        qtd:            r.qtd,
        und:            r.und,
        custoUnit:      r.custoUnit,
        custoIngr:      r.custoIngr,
      });
    });
    // Recalcula custo total como soma dos ingredientes
    map.forEach(p => {
      p.custoIngr = p.ingredientes.reduce((s,i)=>s+i.custoIngr, 0);
    });
    return [...map.values()];
  }, [fichas]);

  // ── Filtros aplicados ──────────────────────────────────
  const produtosFiltrados = useMemo(() =>
    produtosUnicos.filter(r =>
      (filtroCat === 'Todas' || r.categoria === filtroCat)
    ),
  [produtosUnicos, filtroCat]);

  const historicoFiltrado = useMemo(() =>
    historico.filter(r =>
      (filtroLoja  === 'Todas' || r.loja  === filtroLoja) &&
      (filtroCanal === 'Todos' || r.canal === filtroCanal) &&
      (filtroCat   === 'Todas' || r.categoria === filtroCat)
    ),
  [historico, filtroLoja, filtroCanal, filtroCat]);

  const desperdicioFiltrado = useMemo(() =>
    desperdicio.filter(r =>
      (filtroLoja === 'Todas' || r.unidade === filtroLoja) &&
      (filtroMes  === 'Todos' || r.mes === filtroMes)
    ),
  [desperdicio, filtroLoja, filtroMes]);

  // ── Vendas filtradas ──────────────────────────────────────
  const vendasFiltradas = useMemo(() =>
    vendas.filter(r =>
      (filtroLoja  === 'Todas' || r.loja  === filtroLoja) &&
      (filtroCanal === 'Todos' || r.canal === filtroCanal) &&
      (filtroPeriodo === 'Todos' || r.periodo === (filtroPeriodo === 'Almoço' ? 'almoco' : 'jantar'))
    ),
  [vendas, filtroLoja, filtroCanal, filtroPeriodo]);

  // ── Volume × CMV cruzado (vendas + ficha técnica) ─────────
  const volumePorProduto = useMemo(() => {
    // Agrupa vendas por SKU
    const vendaMap = {};
    vendasFiltradas.forEach(v => {
      const sku = v.productSku;
      if (!vendaMap[sku]) vendaMap[sku] = { qtd: 0, receita: 0, nome: v.productName, categoria: v.productCategory, loja: v.loja, canal: v.canal };
      vendaMap[sku].qtd     += v.count || 0;
      vendaMap[sku].receita += (v.unitValue - v.discountValue) * (v.count || 0);
    });

    // Cruza com ficha técnica pelo SKU ZIG
    return produtosUnicos.map(p => {
      const venda = vendaMap[p.skuZig] || { qtd: 0, receita: 0 };
      const custoTotal  = venda.qtd * p.custoIngr;
      const receitaReal = venda.receita;
      const cmvReal     = receitaReal > 0 ? custoTotal / receitaReal : p.cmvPct;
      const margem      = receitaReal > 0 ? (receitaReal - custoTotal) / receitaReal : p.margemContribPct;
      return {
        codPa:        p.codPa,
        skuZig:       p.skuZig,
        nomePa:       p.nomePa,
        categoria:    p.categoria,
        subcategoria: p.subcategoria,
        precoVenda:   p.precoVenda,
        custoUnit:    p.custoIngr,
        cmvTeorico:   p.cmvPct,
        qtdVendida:   venda.qtd,
        receitaReal,
        custoTotal,
        cmvReal,
        margem,
        temVenda:     venda.qtd > 0,
      };
    }).sort((a, b) => b.custoTotal - a.custoTotal);
  }, [produtosUnicos, vendasFiltradas]);

  // ── KPIs home ─────────────────────────────────────────
  const kpis = useMemo(() => {
    const semanas = [...new Set(historicoFiltrado.map(r=>r.semanaISO))].sort();
    const semAtual = semanas.at(-1) ?? '';
    const semAnt   = semanas.at(-2) ?? '';
    const dadosAt  = historicoFiltrado.filter(r=>r.semanaISO===semAtual);
    const dadosAnt = historicoFiltrado.filter(r=>r.semanaISO===semAnt);

    const cmvAtual = avg(dadosAt.map(r=>r.cmvPct));
    const cmvAnt   = avg(dadosAnt.map(r=>r.cmvPct));
    const deltaCMV = cmvAtual - cmvAnt;

    const criticos = produtosFiltrados.filter(r=>r.cmvPct>1).length;
    const atencao  = produtosFiltrados.filter(r=>r.cmvPct>=META_CMV&&r.cmvPct<1).length;
    const okCount  = produtosFiltrados.filter(r=>r.cmvPct<META_CMV).length;

    const totalDesp = desperdicioFiltrado.reduce((s,r)=>s+r.custoTotal,0);
    const unidades  = new Set([
      ...dadosAt.map(r=>r.loja),
      ...desperdicioFiltrado.map(r=>r.unidade),
    ]).size;

    // Margem média
    const margem = avg(produtosFiltrados.map(r=>r.margemContribPct));

    return {
      cmvAtual, cmvAnt, deltaCMV,
      criticos, atencao, okCount,
      totalDesp, unidades, margem,
      semAtual,
    };
  }, [produtosFiltrados, historicoFiltrado, desperdicioFiltrado]);

  // ── Evolução semanal CMV ───────────────────────────────
  // ── Evolução semanal CMV (do historico_cmv) ───────────────
  const evolucaoCMV = useMemo(() => {
    const semanas = [...new Set(historico.map(r => r.semanaISO))].sort();
    return semanas.map(sem => {
      const rows = historico.filter(r => r.semanaISO === sem);
      const cmv  = avg(rows.map(r => r.cmvMedio));
      const porCat = {};
      [...new Set(rows.map(r => r.categoria))].forEach(cat => {
        const cr = rows.filter(r => r.categoria === cat);
        porCat[cat] = parseFloat((avg(cr.map(r => r.cmvMedio)) * 100).toFixed(1));
      });
      return { semana: sem.replace('2026-', ''), cmv: parseFloat((cmv * 100).toFixed(1)), ...porCat };
    });
  }, [historico]);

  // ── Variação semanal por produto (usando histProd) ───────
  const variacaoSemanal = useMemo(() => {
    if (histProd.length === 0) return [];
    const semanas  = [...new Set(histProd.map(r => r.semanaISO))].sort();
    const semAtual = semanas.at(-1) ?? '';
    const semAnt   = semanas.at(-2) ?? '';
    const dadosAt  = histProd.filter(r => r.semanaISO === semAtual);
    const dadosAnt = histProd.filter(r => r.semanaISO === semAnt);

    return dadosAt
      .filter(r => (filtroCat === 'Todas' || r.categoria === filtroCat))
      .map(r => {
        const ant = dadosAnt.find(a => a.codPa === r.codPa);
        return {
          nomePa:       r.nomePa,
          categoria:    r.categoria,
          subcategoria: r.subcategoria,
          cmvAtual:     r.cmvPct,
          cmvAnterior:  ant ? ant.cmvPct : r.cmvPct,
          deltaPp:      ant ? r.cmvPct - ant.cmvPct : 0,
          status:       r.status,
        };
      }).sort((a, b) => b.cmvAtual - a.cmvAtual);
  }, [histProd, filtroCat]);

  // ── Desperdício pivot por unidade ──────────────────────
  const desperdicioByUnidade = useMemo(() => {
    const mesesVisiveis = filtroMes === 'Todos'
      ? MESES_ORDER.filter(m => desperdicio.some(r=>r.mes===m))
      : [filtroMes];

    const unidades = [...new Set(desperdicioFiltrado.map(r=>r.unidade))].filter(Boolean).sort();
    return unidades.map(un => {
      const rows = desperdicioFiltrado.filter(r=>r.unidade===un);
      const porMes = {};
      mesesVisiveis.forEach(m => {
        porMes[m] = rows.filter(r=>r.mes===m).reduce((s,r)=>s+r.custoTotal,0);
      });
      return { unidade: un, porMes, total: rows.reduce((s,r)=>s+r.custoTotal,0) };
    }).sort((a,b)=>b.total-a.total);
  }, [desperdicio, desperdicioFiltrado, filtroMes]);

  // ── Desperdício por classificação ──────────────────────
  const desperdicioByClassificacao = useMemo(() => {
    const map = {};
    desperdicioFiltrado.forEach(r => {
      const k = r.classificacao || 'Sem classificação';
      map[k] = (map[k]||0) + r.custoTotal;
    });
    return Object.entries(map)
      .map(([k,v]) => ({ classificacao: k, total: v }))
      .sort((a,b)=>b.total-a.total);
  }, [desperdicioFiltrado]);

  // ── Margem por categoria ───────────────────────────────
  const margemPorCategoria = useMemo(() => {
    const cats = [...new Set(produtosFiltrados.map(r=>r.categoria))];
    return cats.map(cat => {
      const rows = produtosFiltrados.filter(r=>r.categoria===cat);
      return {
        categoria:    cat,
        cmvMedio:     avg(rows.map(r=>r.cmvPct)),
        margemMedia:  avg(rows.map(r=>r.margemContribPct)),
        qtdProdutos:  rows.length,
        criticos:     rows.filter(r=>r.cmvPct>1).length,
        atencao:      rows.filter(r=>r.cmvPct>=META_CMV&&r.cmvPct<1).length,
      };
    }).sort((a,b)=>b.cmvMedio-a.cmvMedio);
  }, [produtosFiltrados]);

  return (
    <Ctx.Provider value={{
      loading, error,
      // Dados
      produtos: produtosFiltrados,
      historico: historicoFiltrado,
      desperdicio: desperdicioFiltrado,
      // Derivados
      kpis, evolucaoCMV, variacaoSemanal, volumePorProduto, vendasFiltradas, histProd,
      desperdicioByUnidade, desperdicioByClassificacao,
      margemPorCategoria,
      // Filtros
      opcoesLojas, opcoesCats, opcoesMeses,
      filtroLoja,    setFiltroLoja,
      filtroCanal,   setFiltroCanal,
      filtroCat,     setFiltroCat,
      filtroMes,     setFiltroMes,
      filtroPeriodo, setFiltroPeriodo,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCMV() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCMV fora do CMVProvider');
  return ctx;
}
