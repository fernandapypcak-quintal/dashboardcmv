import { useState } from 'react';
import { useCMV } from '../../hooks/useCMV';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

const pct = v => `${((v||0)*100).toFixed(1)}%`;
const brl = v => `R$ ${(v||0).toFixed(2)}`;
const CORES = ['#97A624','#D9B504','#8C1414','#2980b9','#e67e22','#9b59b6','#009e74'];

export default function Variacao() {
  const { variacaoSemanal, variacaoComponentes, evolucaoCMV, margemPorCategoria } = useCMV();
  const [aba, setAba] = useState('produtos'); // 'produtos' | 'componentes'

  const cats = margemPorCategoria.map(r => r.categoria);

  const maioresVar = [...variacaoSemanal]
    .filter(r => r.cmvAnterior > 0 && r.deltaPp !== 0)
    .sort((a, b) => Math.abs(b.deltaPp) - Math.abs(a.deltaPp))
    .slice(0, 8);

  return (
    <div className="p-5 space-y-4">

      {/* Gráfico evolução */}
      <div className="bg-white border border-surface-border rounded-xl">
        <div className="px-5 py-3.5 border-b border-surface-border">
          <p className="font-semibold text-brand-black text-sm">CMV semanal por categoria</p>
          <p className="text-xs text-zinc-400 mt-0.5">linha tracejada = meta 30%</p>
        </div>
        <div className="p-5">
          {evolucaoCMV.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucaoCMV} margin={{top:4,right:24,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false}/>
                <XAxis dataKey="semana" tick={{fontSize:11,fill:'#999'}} axisLine={false} tickLine={false}/>
                <YAxis domain={['auto','auto']} tick={{fontSize:11,fill:'#999'}} tickFormatter={v=>`${v}%`} axisLine={false} tickLine={false}/>
                <Tooltip formatter={(v,n)=>[`${Number(v).toFixed(1)}%`,n]}
                  contentStyle={{background:'#fff',border:'1px solid #e8e8e2',borderRadius:8,fontSize:12}}/>
                <ReferenceLine y={30} stroke="#ccc" strokeDasharray="5 4" strokeWidth={1.5}/>
                <Line type="monotone" dataKey="cmv" name="Geral" stroke="#0D0D0D" strokeWidth={2.5} dot={{fill:'#0D0D0D',r:3}} activeDot={{r:5}}/>
                {cats.map((cat,i) => (
                  <Line key={cat} type="monotone" dataKey={cat} stroke={CORES[i%CORES.length]}
                    strokeWidth={1.5} dot={false} activeDot={{r:4}}/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-zinc-400">
              Sem histórico disponível — grave o primeiro snapshot pelo menu da planilha
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setAba('produtos')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors
            ${aba === 'produtos' ? 'bg-brand-black text-white' : 'bg-white border border-surface-border text-zinc-500 hover:border-zinc-400'}`}>
          Variação por Produto
        </button>
        <button onClick={() => setAba('componentes')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors
            ${aba === 'componentes' ? 'bg-brand-black text-white' : 'bg-white border border-surface-border text-zinc-500 hover:border-zinc-400'}`}>
          Variação por Ingrediente
          {variacaoComponentes.length > 0 && (
            <span className="ml-2 bg-brand-crimson text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {variacaoComponentes.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Produtos */}
      {aba === 'produtos' && (
        <div className="space-y-4">
          {/* Maiores variações */}
          {maioresVar.length > 0 && (
            <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-surface-border">
                <p className="font-semibold text-brand-black text-sm">Maiores variações — semana atual vs anterior</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-muted">
                      {['Produto','Categoria','CMV Ant.','CMV Atual','Δ pp',''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {maioresVar.map((item, i) => {
                      const subiu = item.deltaPp > 0;
                      return (
                        <tr key={i} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                          <td className="px-4 py-2.5 font-medium text-brand-black">{item.nomePa}</td>
                          <td className="px-4 py-2.5 text-zinc-500 text-[12px]">{item.categoria}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{pct(item.cmvAnterior)}</td>
                          <td className={`px-4 py-2.5 text-right font-mono font-semibold ${item.cmvAtual>1?'text-brand-crimson':item.cmvAtual>=0.30?'text-amber-700':'text-brand-olive'}`}>
                            {pct(item.cmvAtual)}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-mono font-bold ${subiu?'text-brand-crimson':'text-brand-olive'}`}>
                            {subiu?'+':''}{pct(item.deltaPp)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-base">{subiu?'📈':'📉'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela completa */}
          <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-border">
              <p className="font-semibold text-brand-black text-sm">Todos os produtos — CMV atual</p>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-white border-b border-surface-border">
                  <tr>
                    {['Produto','Subcategoria','CMV Ant.','CMV Atual','Δ pp','Status'].map(h => (
                      <th key={h} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variacaoSemanal.map((item, i) => {
                    const subiu = item.deltaPp > 0;
                    return (
                      <tr key={i} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                        <td className="px-4 py-2 font-medium text-brand-black">{item.nomePa}</td>
                        <td className="px-4 py-2 text-zinc-500 text-[12px]">{item.subcategoria}</td>
                        <td className="px-4 py-2 text-right font-mono text-zinc-400">{pct(item.cmvAnterior)}</td>
                        <td className={`px-4 py-2 text-right font-mono font-semibold ${item.cmvAtual>1?'text-brand-crimson':item.cmvAtual>=0.30?'text-amber-700':'text-brand-olive'}`}>
                          {pct(item.cmvAtual)}
                        </td>
                        <td className={`px-4 py-2 text-right font-mono text-[12px] ${subiu?'text-brand-crimson':'text-brand-olive'}`}>
                          {item.deltaPp !== 0 ? (subiu?'+':'') + pct(item.deltaPp) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                            ${item.status==='Crítico'?'bg-red-50 text-brand-crimson border-red-100':
                              item.status==='Atenção'?'bg-amber-50 text-amber-700 border-amber-100':
                              'bg-green-50 text-brand-olive border-green-100'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Componentes */}
      {aba === 'componentes' && (
        <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-surface-border">
            <p className="font-semibold text-brand-black text-sm">Ingredientes que variaram de custo</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {variacaoComponentes.length > 0
                ? `${variacaoComponentes.length} ingredientes com variação — semana atual vs anterior`
                : 'Sem variação detectada — grave pelo menos 2 snapshots para comparar'}
            </p>
          </div>
          {variacaoComponentes.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">
              Grave o primeiro snapshot pelo menu da planilha e depois o segundo na semana seguinte.
              A variação aparecerá aqui automaticamente.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-white border-b border-surface-border">
                  <tr>
                    {['Produto','Ingrediente','Qtd','Custo Ant.','Custo Atual','Δ Custo','Part. Ant.','Part. Atual','Δ Part.'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variacaoComponentes.map((item, i) => {
                    const custoSubiu = item.deltaCusto > 0;
                    const participSubiu = item.deltaPartic > 0;
                    return (
                      <tr key={i} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-brand-black text-[12px]">{item.nomePa}</p>
                          <p className="text-[10px] text-zinc-400">{item.subcategoria}</p>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-700">{item.descComponente}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-zinc-500 text-[11px]">
                          {item.qtd} {item.und}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-zinc-400">{brl(item.custoUnitAnt)}</td>
                        <td className={`px-3 py-2.5 text-right font-mono font-semibold ${custoSubiu?'text-brand-crimson':'text-brand-olive'}`}>
                          {brl(item.custoUnit)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono font-bold text-[12px] ${custoSubiu?'text-brand-crimson':'text-brand-olive'}`}>
                          {custoSubiu?'+':''}{brl(item.deltaCusto)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-zinc-400 text-[11px]">
                          {pct(item.participacaoAnt)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-[11px] ${participSubiu?'text-brand-crimson':'text-brand-olive'}`}>
                          {pct(item.participacaoPct)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-[11px] font-semibold ${participSubiu?'text-brand-crimson':'text-brand-olive'}`}>
                          {participSubiu?'+':''}{pct(item.deltaPartic)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
