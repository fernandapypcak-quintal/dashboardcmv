import { useState, useMemo } from 'react';
import { useCMV } from '../../hooks/useCMV';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const pct  = v => `${((v||0)).toFixed(1)}%`;
const brl  = v => `R$ ${(v||0).toFixed(2)}`;
const pp   = v => v > 0 ? `+${v.toFixed(1)}pp` : `${v.toFixed(1)}pp`;

function DeltaBadge({ delta }) {
  if (Math.abs(delta) < 0.1) return <span className="text-zinc-400 text-[11px]">—</span>;
  const up = delta > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[12px] font-semibold ${up ? 'text-brand-crimson' : 'text-brand-olive'}`}>
      {up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
      {pp(delta)}
    </span>
  );
}

export default function Variacao() {
  const { loading, history = [] } = useCMV();
  const [tab, setTab] = useState('diaria');

  // Ordena por data
  const snapshots = useMemo(() =>
    [...history].sort((a, b) => new Date(a.ts) - new Date(b.ts)),
  [history]);

  const snapAtual = snapshots[snapshots.length - 1];
  const snapAnt   = snapshots[snapshots.length - 2];

  // ── Variação diária ────────────────────────────────────
  const variacaoDiaria = useMemo(() => {
    if (!snapAtual || !snapAnt) return { insumos: [], produtos: [] };

    const insAtual = snapAtual.snap?.insumos || {};
    const insAnt   = snapAnt.snap?.insumos   || {};

    // Insumos que mudaram
    const insumos = Object.entries(insAtual)
      .map(([cod, ins]) => {
        const ant = insAnt[cod];
        if (!ant) return null;
        const delta = ins.custo - ant.custo;
        if (Math.abs(delta) < 0.001) return null;
        return {
          cod,
          desc:      ins.desc,
          custoAnt:  ant.custo,
          custoAtual: ins.custo,
          delta,
          deltaPct:  ant.custo > 0 ? (delta / ant.custo * 100) : 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    // Produtos com CMV alterado
    const fichasAtual = snapAtual.snap?.fichas || {};
    const fichasAnt   = snapAnt.snap?.fichas   || {};

    const prods = Object.entries(fichasAtual)
      .map(([id, f]) => {
        const ant = Object.values(fichasAnt).find(a => a.codPA === f.codPA);
        if (!ant) return null;
        const delta = (f.cmv || 0) - (ant.cmv || 0);
        if (Math.abs(delta) < 0.01) return null;
        return {
          nome:    f.nome,
          cat:     f.cat,
          cmvAnt:  ant.cmv,
          cmvAtual: f.cmv,
          delta,
          custoAnt: ant.custoTotal,
          custoAtual: f.custoTotal,
        };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return { insumos, produtos: prods };
  }, [snapAtual, snapAnt]);

  // ── Variação semanal ────────────────────────────────────
  const variacaoSemanal = useMemo(() => {
    if (snapshots.length < 2) return { grafico: [], topProdutos: [] };

    // Agrupa snapshots por semana ISO
    const porSemana = {};
    snapshots.forEach(snap => {
      const d = new Date(snap.ts);
      const semana = `${d.getFullYear()}-W${String(Math.ceil((d - new Date(d.getFullYear(),0,1)) / 604800000)).padStart(2,'0')}`;
      if (!porSemana[semana] || new Date(snap.ts) > new Date(porSemana[semana].ts)) {
        porSemana[semana] = snap;
      }
    });

    const semanas = Object.keys(porSemana).sort();

    // CMV médio por categoria por semana
    const grafico = semanas.map(sem => {
      const snap = porSemana[sem];
      const fichas = Object.values(snap.snap?.fichas || {});
      const porCat = {};
      fichas.forEach(f => {
        if (!f.preco || !f.cmv) return;
        if (!porCat[f.cat]) porCat[f.cat] = [];
        porCat[f.cat].push(f.cmv);
      });
      const ponto = { semana: sem.replace(/\d{4}-/, '') };
      Object.entries(porCat).forEach(([cat, vals]) => {
        ponto[cat] = parseFloat((vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(1));
      });
      return ponto;
    });

    // Top produtos que mais variaram entre primeiro e último snapshot
    const primSnap = porSemana[semanas[0]];
    const ultSnap  = porSemana[semanas[semanas.length-1]];
    const fichasPrim = primSnap?.snap?.fichas || {};
    const fichasUlt  = ultSnap?.snap?.fichas  || {};

    const topProdutos = Object.entries(fichasUlt)
      .map(([id, f]) => {
        const prim = Object.values(fichasPrim).find(p => p.codPA === f.codPA);
        if (!prim) return null;
        const delta = (f.cmv||0) - (prim.cmv||0);
        return { nome: f.nome, cat: f.cat, cmvPrim: prim.cmv, cmvUlt: f.cmv, delta };
      })
      .filter(Boolean)
      .sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 20);

    return { grafico, topProdutos };
  }, [snapshots]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-olive border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const semData = snapAtual ? new Date(snapAtual.ts).toLocaleDateString('pt-BR') : '—';
  const semAntData = snapAnt ? new Date(snapAnt.ts).toLocaleDateString('pt-BR') : '—';

  const CORES_CAT = {
    'Espetos': '#8C1414', 'Bebidas Frias': '#2980b9', 'Drinks': '#9b59b6',
    'Guarnições': '#97A624', 'Saladas e Molhos': '#27ae60', 'Sobremesas': '#e67e22',
    'Delivery': '#f39c12', 'Cardápio Principal': '#16a085',
  };

  return (
    <div className="p-5 space-y-4">

      {/* Tabs */}
      <div className="flex gap-2">
        {[['diaria','Variação Diária'],['semanal','Variação Semanal']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 h-8 rounded-lg text-[13px] font-medium transition-colors border
              ${tab===k ? 'bg-brand-black text-white border-brand-black' : 'bg-white text-zinc-500 border-surface-border hover:border-zinc-400'}`}>
            {l}
          </button>
        ))}
        {snapshots.length === 0 && (
          <span className="ml-2 text-[12px] text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 self-center">
            Sem histórico ainda — aguardando próxima importação de notas no inventário
          </span>
        )}
      </div>

      {/* ── TAB DIÁRIA ── */}
      {tab === 'diaria' && (
        <div className="space-y-4">
          {snapshots.length < 2 ? (
            <div className="bg-white border border-surface-border rounded-xl p-8 text-center">
              <p className="text-zinc-400 text-sm">Precisa de pelo menos 2 importações de notas no inventário para ver a variação diária.</p>
              <p className="text-zinc-300 text-xs mt-2">Atual: {snapshots.length} importação{snapshots.length !== 1 ? 'ões' : ''} registrada{snapshots.length !== 1 ? 's' : ''}</p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-surface-border rounded-xl px-5 py-3 flex items-center gap-3">
                <p className="text-[12px] text-zinc-400">Comparando</p>
                <span className="text-[12px] font-semibold text-brand-black bg-surface-muted px-2 py-0.5 rounded">{semAntData}</span>
                <span className="text-zinc-300">→</span>
                <span className="text-[12px] font-semibold text-brand-black bg-surface-muted px-2 py-0.5 rounded">{semData}</span>
                {snapAtual?.detail && <span className="text-[11px] text-zinc-400 ml-2 truncate">{snapAtual.detail}</span>}
              </div>

              {/* Insumos */}
              <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between">
                  <p className="font-semibold text-brand-black text-sm">Insumos com variação de custo</p>
                  <span className="text-[11px] text-zinc-400">{variacaoDiaria.insumos.length} insumos</span>
                </div>
                {variacaoDiaria.insumos.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-400 text-center">Nenhum insumo variou neste período.</p>
                ) : (
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <table className="w-full text-[13px]">
                      <thead className="sticky top-0 bg-white border-b border-surface-border">
                        <tr>
                          {['Insumo','Custo Ant.','Custo Atual','Δ Valor','Δ %'].map(h => (
                            <th key={h} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {variacaoDiaria.insumos.map((ins, i) => (
                          <tr key={ins.cod} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                            <td className="px-4 py-2.5 font-medium text-brand-black">{ins.desc}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{brl(ins.custoAnt)}</td>
                            <td className={`px-4 py-2.5 text-right font-mono font-semibold ${ins.delta>0?'text-brand-crimson':'text-brand-olive'}`}>{brl(ins.custoAtual)}</td>
                            <td className="px-4 py-2.5 text-right"><DeltaBadge delta={ins.delta}/></td>
                            <td className={`px-4 py-2.5 text-right font-mono text-[12px] ${ins.delta>0?'text-brand-crimson':'text-brand-olive'}`}>
                              {ins.delta>0?'+':''}{ins.deltaPct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Produtos */}
              <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between">
                  <p className="font-semibold text-brand-black text-sm">Produtos com CMV alterado</p>
                  <span className="text-[11px] text-zinc-400">{variacaoDiaria.produtos.length} produtos</span>
                </div>
                {variacaoDiaria.produtos.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-400 text-center">Nenhum produto teve CMV alterado neste período.</p>
                ) : (
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <table className="w-full text-[13px]">
                      <thead className="sticky top-0 bg-white border-b border-surface-border">
                        <tr>
                          {['Produto','Categoria','Custo Ant.','Custo Atual','CMV Ant.','CMV Atual','Δ CMV'].map(h => (
                            <th key={h} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {variacaoDiaria.produtos.map((p, i) => (
                          <tr key={p.nome+i} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                            <td className="px-4 py-2.5 font-medium text-brand-black">{p.nome}</td>
                            <td className="px-4 py-2.5 text-zinc-500 text-[12px]">{p.cat}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{brl(p.custoAnt)}</td>
                            <td className={`px-4 py-2.5 text-right font-mono font-semibold ${p.delta>0?'text-brand-crimson':'text-brand-olive'}`}>{brl(p.custoAtual)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{pct(p.cmvAnt)}</td>
                            <td className={`px-4 py-2.5 text-right font-mono font-bold ${p.delta>0?'text-brand-crimson':'text-brand-olive'}`}>{pct(p.cmvAtual)}</td>
                            <td className="px-4 py-2.5 text-right"><DeltaBadge delta={p.delta}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB SEMANAL ── */}
      {tab === 'semanal' && (
        <div className="space-y-4">
          {snapshots.length < 2 ? (
            <div className="bg-white border border-surface-border rounded-xl p-8 text-center">
              <p className="text-zinc-400 text-sm">Precisa de pelo menos 2 importações de notas para ver a variação semanal.</p>
            </div>
          ) : (
            <>
              {/* Gráfico CMV por categoria */}
              <div className="bg-white border border-surface-border rounded-xl">
                <div className="px-5 py-3.5 border-b border-surface-border">
                  <p className="font-semibold text-brand-black text-sm">Evolução do CMV médio por categoria</p>
                  <p className="text-xs text-zinc-400 mt-0.5">baseado nas importações de notas do inventário</p>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={variacaoSemanal.grafico} margin={{top:4,right:16,left:-10,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false}/>
                      <XAxis dataKey="semana" tick={{fontSize:11,fill:'#999'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:'#999'}} tickFormatter={v=>`${v}%`} axisLine={false} tickLine={false}/>
                      <Tooltip formatter={(v,n)=>[`${v}%`,n]} contentStyle={{background:'#fff',border:'1px solid #e8e8e2',borderRadius:8,fontSize:12}}/>
                      <Legend wrapperStyle={{fontSize:11}}/>
                      {Object.keys(CORES_CAT).map(cat => (
                        variacaoSemanal.grafico.some(d => d[cat]) && (
                          <Line key={cat} type="monotone" dataKey={cat} stroke={CORES_CAT[cat]}
                            strokeWidth={2} dot={{r:3}} activeDot={{r:5}}/>
                        )
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top produtos que mais variaram */}
              <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-surface-border">
                  <p className="font-semibold text-brand-black text-sm">Top produtos — maior variação no período</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {snapshots.length > 0 && `${new Date(snapshots[0].ts).toLocaleDateString('pt-BR')} → ${new Date(snapshots[snapshots.length-1].ts).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-[13px]">
                    <thead className="sticky top-0 bg-white border-b border-surface-border">
                      <tr>
                        {['Produto','Categoria','CMV Inicial','CMV Final','Δ CMV'].map(h => (
                          <th key={h} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {variacaoSemanal.topProdutos.map((p, i) => (
                        <tr key={p.nome+i} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                          <td className="px-4 py-2.5 font-medium text-brand-black">{p.nome}</td>
                          <td className="px-4 py-2.5 text-zinc-500 text-[12px]">{p.cat}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{pct(p.cmvPrim)}</td>
                          <td className={`px-4 py-2.5 text-right font-mono font-bold ${p.delta>0?'text-brand-crimson':'text-brand-olive'}`}>{pct(p.cmvUlt)}</td>
                          <td className="px-4 py-2.5 text-right"><DeltaBadge delta={p.delta}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
