import { getKpis, getDesperdicioByUnidade, getVariacaoSemanal } from '@/lib/sheets/queries'
import KpiCard         from '@/components/ui/KpiCard'
import AlertBox        from '@/components/ui/AlertBox'
import DesperdicioTable from '@/components/ui/DesperdicioTable'
import CMVEvolucaoChart from '@/components/charts/CMVEvolucaoChart'

export const revalidate = 1800 // revalida a cada 30min

export default async function DashboardPage() {
  const [kpis, desperdicioByUnidade, variacao] = await Promise.all([
    getKpis(),
    getDesperdicioByUnidade(),
    getVariacaoSemanal(),
  ])

  const criticos = variacao.filter(v => v.status === 'Crítico').slice(0, 3)

  return (
    <div>
      {/* Banner info */}
      <div className="flex items-center gap-2 bg-[#fffbea] border border-[#f0d870]
                      rounded-lg px-4 py-2.5 mb-5 text-sm text-[#5a4500]">
        <span className="text-base">📅</span>
        <span>
          <strong>Mai/26 — dados até hoje.</strong>{' '}
          CMV Teórico calculado com base na ficha técnica Protheus · Última sync: terça-feira
        </span>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          label="CMV Teórico"
          value={`${(kpis.cmvTeorico * 100).toFixed(1)}%`}
          sub="meta 30% — desvio"
          subColor="red"
          icon="📊"
          iconBg="#fdf0ef"
        />
        <KpiCard
          label="Desperdício Mai"
          value={`R$ ${(kpis.desperdicio / 1000).toFixed(1)}k`}
          sub="↓ vs fev (pico R$ 64k)"
          subColor="green"
          icon="🗑"
          iconBg="#fdf0ef"
        />
        <KpiCard
          label="Delta CMV"
          value={`+${(kpis.deltaCmv * 100).toFixed(1)}pp`}
          sub={`CMV Real est. ${(kpis.cmvReal * 100).toFixed(1)}%`}
          subColor="red"
          icon="⚖"
          iconBg="#fdf6e3"
        />
        <KpiCard
          label="Itens críticos"
          value={String(kpis.itensCriticos)}
          sub="CMV acima de 50%"
          icon="⚠"
          iconBg="#f0f0ee"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Evolução CMV */}
        <div className="lg:col-span-2 bg-white border border-[#e8e8e6] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e8e8e6]">
            <div className="font-semibold text-[#111] text-sm">Evolução do CMV Teórico</div>
            <div className="text-xs text-[#888] mt-0.5">% mensal vs meta 30%</div>
          </div>
          <div className="p-5">
            <CMVEvolucaoChart />
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white border border-[#e8e8e6] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e8e8e6]">
            <div className="font-semibold text-[#111] text-sm">Alertas críticos</div>
          </div>
          <div className="p-4 space-y-2">
            {criticos.map(item => (
              <AlertBox
                key={item.produto}
                type="error"
                title={`${item.produto} — CMV ${(item.cmvAtual * 100).toFixed(1)}%`}
                body={
                  item.cmvAtual > 1
                    ? `Custo acima do preço de venda. Ajuste urgente.`
                    : `CMV ${(item.deltaPp * 100).toFixed(1)}pp vs semana anterior.`
                }
              />
            ))}
            {criticos.length === 0 && (
              <p className="text-sm text-[#888] text-center py-4">
                Nenhum alerta crítico esta semana ✓
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabela desperdício */}
      <div className="bg-white border border-[#e8e8e6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e8e8e6] flex items-center justify-between">
          <div>
            <div className="font-semibold text-[#111] text-sm">
              Desperdício por loja — Jan a Mai/26
            </div>
          </div>
          <span className="text-xs text-[#888]">acumulado</span>
        </div>
        <DesperdicioTable data={desperdicioByUnidade} />
      </div>
    </div>
  )
}
