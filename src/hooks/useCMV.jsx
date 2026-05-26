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
  const [histComp,   setHistComp]   = useState([]);
  const [parametros, setParametros] = useState({ taxa_ifood: 24.8, embalagem_padrao: 3.0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Filtros ────────────────────────────────────────────
  const [filtroLoja,    setFiltroLoja]    = useState('Todas');
  const [filtroCanal,   setFiltroCanal]   = useState('CASA');
  const [filtroCat,     setFiltroCat]     = useState('Todas');
  const [filtroMes,     setFiltroMes]     = useState('Todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('Todos'); // Todos | Almoço | Jantar/Noite
  const [filtroSemana,  setFiltroSemana]  = useState('atual'); // atual | anterior | 2semanas

  useEffect(() => {
    loadCMVData()
      .then(({ fichas, historico, histProd, histComp, desperdicio, vendas, parametros }) => {
        setFichas(fichas);
        setHistorico(historico);
        setDesperdicio(desperdicio);
        setVendas(vendas || []);
        setHistProd(histProd || []);
        setHistComp(histComp || []);
        setParametros(parametros || { taxa_ifood: 24.8, embalagem_padrao: 3.0 });
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Filtro de loja: deriva dos dados reais
  const opcoesLojas = useMemo(() => {
    const lojas = new Set([
      ...desperdicio.map(r => r.unidade),
    ].filter(Boolean));
    return ['Todas', ...[...lojas].sort()];
  }, [desperdicio]);

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
    // Exceção: produto com 1 único ingrediente usa custo_unit (evita erro de pacote vs unitário)
    map.forEach(p => {
      if (p.ingredientes.length === 1) {
        // Produto com ingrediente único — custo é unitário (ex: Bovino In Natura = 1 espeto)
        p.custoIngr = p.ingredientes[0].custoUnit;
      } else {
        // Produto composto — soma todos os ingredientes normalmente
        p.custoIngr = p.ingredientes.reduce((s,i) => s + i.custoIngr, 0);
      }
      // Recalcula CMV e margem com custo correto
      if (p.precoVenda > 0) {
        p.cmvPct          = p.custoIngr / p.precoVenda;
        p.margemContribR  = p.precoVenda - p.custoIngr;
        p.margemContribPct = (p.precoVenda - p.custoIngr) / p.precoVenda;
        p.precoSugerido   = p.custoIngr > 0 ? p.custoIngr / 0.30 : p.precoVenda;
      }
    });
    return [...map.values()];
  }, [fichas]);

  // ── Filtros aplicados ──────────────────────────────────
  const produtosFiltrados = useMemo(() =>
    produtosUnicos.filter(r =>
      (filtroCat === 'Todas' || (Array.isArray(filtroCat) ? filtroCat.includes(r.categoria) : r.categoria === filtroCat))
    ),
  [produtosUnicos, filtroCat]);

  const historicoFiltrado = useMemo(() =>
    historico.filter(r =>
      (filtroLoja  === 'Todas' || r.loja  === filtroLoja) &&
      (filtroCanal === 'Todos' || r.canal === filtroCanal) &&
      (filtroCat === 'Todas' || (Array.isArray(filtroCat) ? filtroCat.includes(r.categoria) : r.categoria === filtroCat))
    ),
  [historico, filtroLoja, filtroCanal, filtroCat]);

  const desperdicioFiltrado = useMemo(() =>
    desperdicio.filter(r =>
      r.unidade &&
      (filtroLoja === 'Todas' || r.unidade === filtroLoja) &&
      (filtroMes  === 'Todos' || r.mes === filtroMes)
    ),
  [desperdicio, filtroLoja, filtroMes]);

  // ── Semanas disponíveis nas vendas ────────────────────────
  const semanasDisponiveis = useMemo(() => {
    const sems = [...new Set(vendas.map(r => r.semanaISO || '').filter(Boolean))].sort().reverse();
    return sems;
  }, [vendas]);

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
      if (!sku) return;
      if (!vendaMap[sku]) vendaMap[sku] = { qtd: 0, receita: 0, nome: v.productName, categoria: v.productCategory };
      const qtd = v.count || 0;
      const valorUnit = v.unitValue || 0;
      const desconto  = v.discountValue || 0;
      vendaMap[sku].qtd     += qtd;
      vendaMap[sku].receita += Math.max(0, valorUnit - desconto) * qtd;
    });
    console.log('[Volume] SKUs com venda:', Object.keys(vendaMap).length, '| Total itens:', Object.values(vendaMap).reduce((s,v)=>s+v.qtd,0));

    // Cruza com ficha técnica pelo SKU ZIG (respeitando filtro de categoria)
    return produtosFiltrados.map(p => {
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
  }, [produtosFiltrados, vendasFiltradas]);

  // ── KPIs home ─────────────────────────────────────────
  const kpis = useMemo(() => {
    // CMV atual vem direto das fichas técnicas (fonte mais confiável)
    const cmvAtual = avg(produtosFiltrados.map(r => r.cmvPct));

    // Delta vem do histórico se disponível
    const semanas  = [...new Set(historico.map(r => r.semanaISO))].sort();
    const semAtual = semanas.at(-1) ?? '';
    const semAnt   = semanas.at(-2) ?? '';
    const dadosAnt = historico.filter(r => r.semanaISO === semAnt);
    const cmvAnt   = dadosAnt.length > 0
      ? avg(dadosAnt.map(r => r.cmvMedio))
      : cmvAtual;
    const deltaCMV = cmvAtual - cmvAnt;

    const criticos = produtosFiltrados.filter(r => r.cmvPct > 1).length;
    const atencao  = produtosFiltrados.filter(r => r.cmvPct >= META_CMV && r.cmvPct < 1).length;
    const okCount  = produtosFiltrados.filter(r => r.cmvPct < META_CMV).length;
    const margem   = avg(produtosFiltrados.map(r => r.margemContribPct));
    const totalDesp = desperdicioFiltrado.reduce((s, r) => s + r.custoTotal, 0);

    return {
      cmvAtual, cmvAnt, deltaCMV,
      criticos, atencao, okCount,
      totalDesp, margem, semAtual,
    };
  }, [produtosFiltrados, historico, desperdicioFiltrado]);

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
      .filter(r => (filtroCat === 'Todas' || (Array.isArray(filtroCat) ? filtroCat.includes(r.categoria) : r.categoria === filtroCat)))
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

  // ── Variação de componentes entre semanas ─────────────
  const variacaoComponentes = useMemo(() => {
    if (histComp.length === 0) return [];
    const semanas  = [...new Set(histComp.map(r => r.semanaISO))].sort();
    const semAtual = semanas.at(-1) ?? '';
    const semAnt   = semanas.at(-2) ?? '';
    const dadosAt  = histComp.filter(r => r.semanaISO === semAtual);
    const dadosAnt = histComp.filter(r => r.semanaISO === semAnt);

    return dadosAt
      .filter(r => (filtroCat === 'Todas' || (Array.isArray(filtroCat) ? filtroCat.includes(r.categoria) : r.categoria === filtroCat)))
      .map(r => {
        const ant = dadosAnt.find(a => a.codPa === r.codPa && a.codComponente === r.codComponente);
        const deltaCusto = ant ? r.custoUnit - ant.custoUnit : 0;
        const deltaPartic = ant ? r.participacaoPct - ant.participacaoPct : 0;
        return {
          semanaISO:      r.semanaISO,
          codPa:          r.codPa,
          nomePa:         r.nomePa,
          categoria:      r.categoria,
          subcategoria:   r.subcategoria,
          codComponente:  r.codComponente,
          descComponente: r.descComponente,
          qtd:            r.qtd,
          und:            r.und,
          custoUnit:      r.custoUnit,
          custoUnitAnt:   ant ? ant.custoUnit : r.custoUnit,
          deltaCusto,
          custoIngr:      r.custoIngr,
          custoTotalPa:   r.custoTotalPa,
          participacaoPct: r.participacaoPct,
          participacaoAnt: ant ? ant.participacaoPct : r.participacaoPct,
          deltaPartic,
          variou:         Math.abs(deltaCusto) > 0.01,
        };
      })
      .filter(r => r.variou) // só os que variaram
      .sort((a, b) => Math.abs(b.deltaCusto) - Math.abs(a.deltaCusto));
  }, [histComp, filtroCat]);

  return (
    <Ctx.Provider value={{
      loading, error,
      // Dados
      produtos: produtosFiltrados,
      historico: historicoFiltrado,
      desperdicio: desperdicioFiltrado,
      desperdicioRaw: desperdicio,
      // Derivados
      kpis, evolucaoCMV, variacaoSemanal, variacaoComponentes, volumePorProduto, vendasFiltradas, histProd, histComp, parametros,
      desperdicioByUnidade, desperdicioByClassificacao,
      margemPorCategoria,
      // Filtros
      opcoesLojas, opcoesCats, opcoesMeses,
      filtroLoja,    setFiltroLoja,
      filtroCanal,   setFiltroCanal,
      filtroCat,     setFiltroCat,
      filtroMes,     setFiltroMes,
      filtroPeriodo, setFiltroPeriodo,
      filtroSemana,  setFiltroSemana,
      semanasDisponiveis,
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
