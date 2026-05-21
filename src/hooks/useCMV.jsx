import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { loadCMVData } from '../data/loader';

const Ctx = createContext(null);

const MESES_ORDER = ['janeiro','fevereiro','março','abril','maio','junho',
                     'julho','agosto','setembro','outubro','novembro','dezembro'];

export function CMVProvider({ children }) {
  const [fichas,      setFichas]      = useState([]);
  const [historico,   setHistorico]   = useState([]);
  const [desperdicio, setDesperdicio] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Filtros
  const [lojaFiltro,      setLojaFiltro]      = useState('Todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [mesFiltro,       setMesFiltro]       = useState('Todos');

  useEffect(() => {
    loadCMVData()
      .then(({ fichas, historico, desperdicio }) => {
        setFichas(fichas);
        setHistorico(historico);
        setDesperdicio(desperdicio);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Listas de opções para filtros
  const lojas = useMemo(() =>
    ['Todas', ...new Set(historico.map(r => r.loja))].filter(Boolean),
  [historico]);

  const categorias = useMemo(() =>
    ['Todas', ...new Set(fichas.map(r => r.categoria))].filter(Boolean),
  [fichas]);

  const meses = useMemo(() => {
    const ms = [...new Set(desperdicio.map(r => r.mes))].filter(Boolean);
    return ['Todos', ...ms.sort((a,b) => MESES_ORDER.indexOf(a) - MESES_ORDER.indexOf(b))];
  }, [desperdicio]);

  // Dados filtrados
  const fichasFiltradas = useMemo(() =>
    fichas.filter(r =>
      (categoriaFiltro === 'Todas' || r.categoria === categoriaFiltro)
    ),
  [fichas, categoriaFiltro]);

  const historicoFiltrado = useMemo(() =>
    historico.filter(r =>
      (lojaFiltro === 'Todas' || r.loja === lojaFiltro) &&
      (categoriaFiltro === 'Todas' || r.categoria === categoriaFiltro)
    ),
  [historico, lojaFiltro, categoriaFiltro]);

  const desperdicioFiltrado = useMemo(() =>
    desperdicio.filter(r =>
      (lojaFiltro === 'Todas' || r.unidade === lojaFiltro) &&
      (mesFiltro === 'Todos' || r.mes === mesFiltro)
    ),
  [desperdicio, lojaFiltro, mesFiltro]);

  // KPIs consolidados
  const kpis = useMemo(() => {
    const semanas = [...new Set(historicoFiltrado.map(r => r.semanaISO))].sort();
    const semanaAtual = semanas.at(-1) ?? '';
    const dadosAtuais = historicoFiltrado.filter(r => r.semanaISO === semanaAtual);

    const cmvMedio = dadosAtuais.length
      ? dadosAtuais.reduce((s,r) => s + r.cmvPct, 0) / dadosAtuais.length
      : 0;

    const criticos = fichasFiltradas.filter(r => r.cmvPct > 1).length;
    const atencao  = fichasFiltradas.filter(r => r.cmvPct >= 0.3 && r.cmvPct < 1).length;

    const totalDesp = desperdicioFiltrado.reduce((s,r) => s + r.custoTotal, 0);
    const unidades  = new Set(historicoFiltrado.map(r => r.loja)).size;

    return { cmvMedio, criticos, atencao, totalDesp, unidades, semanaAtual };
  }, [fichasFiltradas, historicoFiltrado, desperdicioFiltrado]);

  // Desperdício por unidade (pivot mensal)
  const desperdicioByUnidade = useMemo(() => {
    const mesesVisiveis = mesFiltro === 'Todos'
      ? MESES_ORDER.filter(m => desperdicio.some(r => r.mes === m))
      : [mesFiltro];

    const unidades = [...new Set(desperdicio.map(r => r.unidade))].filter(Boolean);
    return unidades.map(un => {
      const rows = desperdicioFiltrado.filter(r => r.unidade === un);
      const porMes = {};
      mesesVisiveis.forEach(m => {
        porMes[m] = rows.filter(r => r.mes === m).reduce((s,r) => s + r.custoTotal, 0);
      });
      return { unidade: un, porMes, total: rows.reduce((s,r) => s + r.custoTotal, 0) };
    }).sort((a,b) => b.total - a.total);
  }, [desperdicio, desperdicioFiltrado, mesFiltro]);

  // Evolução CMV mensal (para gráfico)
  const evolucaoCMV = useMemo(() => {
    const semanas = [...new Set(historicoFiltrado.map(r => r.semanaISO))].sort();
    return semanas.map(sem => {
      const rows = historicoFiltrado.filter(r => r.semanaISO === sem);
      const cmv  = rows.length ? rows.reduce((s,r) => s + r.cmvPct, 0) / rows.length : 0;
      return { semana: sem, cmv: parseFloat((cmv * 100).toFixed(1)) };
    });
  }, [historicoFiltrado]);

  return (
    <Ctx.Provider value={{
      loading, error,
      fichas: fichasFiltradas,
      historico: historicoFiltrado,
      desperdicio: desperdicioFiltrado,
      desperdicioByUnidade,
      evolucaoCMV,
      kpis,
      lojas, categorias, meses,
      lojaFiltro,      setLojaFiltro,
      categoriaFiltro, setCategoriaFiltro,
      mesFiltro,       setMesFiltro,
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
