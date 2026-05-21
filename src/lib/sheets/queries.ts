import { readRange, rowsToObjects, SHEETS } from './client'
import type {
  FichaTecnica, HistoricoCMV, Desperdicio,
  MetaCMV, KpiResumo, VariacaoSemanal, DesperdicioPorUnidade
} from '@/types'

const pct  = (v: string) => parseFloat(v) || 0
const brl  = (v: string) => parseFloat(v) || 0
const num  = (v: string) => parseFloat(v) || 0

// ── Fichas Técnicas ───────────────────────────────────────
export async function getFichasTecnicas(): Promise<FichaTecnica[]> {
  const rows = await readRange(`${SHEETS.FICHA_TECNICA}!A1:P`)
  return rowsToObjects<Record<string, string>>(rows).map(r => ({
    idFicha:        r.id_ficha ?? '',
    codPa:          r.cod_pa ?? '',
    nomePa:         r.nome_pa ?? '',
    categoria:      r.categoria ?? '',
    subcategoria:   r.subcategoria ?? '',
    descComponente: r.desc_componente ?? '',
    qtd:            num(r.qtd),
    und:            r.und ?? '',
    custoUnit:      brl(r.custo_unit),
    custoIngr:      brl(r.custo_ingr),
    precoVenda:     brl(r.preco_venda),
    cmvPct:         pct(r.cmv_pct),
    precoSugerido30: brl(r.preco_suge_30pct),
    margContribR:   brl(r.marg_contrib_r),
    margContribPct: pct(r.marg_contrib_pct),
  }))
}

// ── Histórico CMV (últimas N semanas) ─────────────────────
export async function getHistoricoCMV(semanas = 8): Promise<HistoricoCMV[]> {
  const rows = await readRange(`${SHEETS.HISTORICO_CMV}!A2:O`)
  const all = rowsToObjects<Record<string, string>>(rows).map(r => ({
    semanaISO:       r.semana_iso ?? '',
    dataRef:         r.data_ref ?? '',
    codPa:           r.cod_pa ?? '',
    nomePa:          r.nome_pa ?? '',
    categoria:       r.categoria ?? '',
    subcategoria:    r.subcategoria ?? '',
    loja:            r.loja ?? '',
    precoVenda:      brl(r.preco_venda),
    custoCmv:        brl(r.custo_cmv),
    cmvPct:          pct(r.cmv_pct),
    cmvPctAnterior:  r.cmv_pct_anterior ? pct(r.cmv_pct_anterior) : null,
    deltaPp:         r.delta_pp ? pct(r.delta_pp) : null,
    precoSugerido:   brl(r.preco_sugerido),
    status:          (r.status as HistoricoCMV['status']) ?? 'OK',
    alerta:          (r.alerta as 'SIM' | 'NÃO') ?? 'NÃO',
  }))

  // Filtra pelas últimas N semanas únicas
  const semanasUnicas = [...new Set(all.map(r => r.semanaISO))]
    .sort().slice(-semanas)
  return all.filter(r => semanasUnicas.includes(r.semanaISO))
}

// ── Desperdício ────────────────────────────────────────────
export async function getDesperdicio(): Promise<Desperdicio[]> {
  const rows = await readRange(`${SHEETS.FATO_DESPERDICIO}!A2:M`)
  return rowsToObjects<Record<string, string>>(rows).map(r => ({
    id:           r.id ?? '',
    data:         r.data ?? '',
    mes:          r.mes ?? '',
    semana:       num(r.semana),
    unidade:      r.unidade ?? '',
    funcionario:  r.funcionario ?? '',
    produto:      r.produto ?? '',
    quantidade:   num(r.quantidade),
    custoUnit:    brl(r.custo_unit),
    custoTotal:   brl(r.custo_total),
    valorVenda:   brl(r.valor_venda),
    classificacao: r.classificacao ?? '',
    justificativa: r.justificativa ?? '',
  }))
}

// ── Metas CMV ─────────────────────────────────────────────
export async function getMetas(): Promise<MetaCMV[]> {
  const rows = await readRange(`${SHEETS.METAS_CMV}!A2:N`)
  return rowsToObjects<Record<string, string>>(rows).map(r => ({
    periodo:      r.periodo ?? '',
    ano:          num(r.ano),
    mes:          num(r.mes),
    semana:       num(r.semana),
    categoria:    r.categoria ?? '',
    subcategoria: r.subcategoria ?? '',
    metaCmv:      pct(r.meta_cmv),
    metaMargem:   pct(r.meta_margem),
    cmvSugerido:  r.cmv_sugerido ? pct(r.cmv_sugerido) : null,
    cmvRealizado: r.cmv_realizado ? pct(r.cmv_realizado) : null,
    deltaMeta:    r.delta_meta ? pct(r.delta_meta) : null,
    status:       r.status ?? 'Aguardando',
    confirmado:   r.confirmado === 'SIM',
  }))
}

// ── KPIs consolidados ─────────────────────────────────────
export async function getKpis(): Promise<KpiResumo> {
  const [historico, desperdicio] = await Promise.all([
    getHistoricoCMV(2),
    getDesperdicio(),
  ])

  // Semana mais recente
  const semanasUnicas = [...new Set(historico.map(r => r.semanaISO))].sort()
  const semanaAtual = semanasUnicas.at(-1) ?? ''
  const dadosSemanaAtual = historico.filter(r => r.semanaISO === semanaAtual)

  const cmvTeorico = dadosSemanaAtual.length
    ? dadosSemanaAtual.reduce((s, r) => s + r.cmvPct, 0) / dadosSemanaAtual.length
    : 0

  const itensCriticos = dadosSemanaAtual.filter(r => r.status === 'Crítico').length
  const unidades = [...new Set(dadosSemanaAtual.map(r => r.loja))].length

  const despMes = desperdicio
    .filter(d => d.mes === obterMesAtual())
    .reduce((s, d) => s + d.custoTotal, 0)

  return {
    cmvTeorico,
    cmvReal: cmvTeorico * 1.123,  // estimativa até Supabase/Protheus
    deltaCmv: cmvTeorico * 0.123,
    desperdicio: despMes,
    itensCriticos,
    unidades,
  }
}

// ── Variação semanal por produto ──────────────────────────
export async function getVariacaoSemanal(): Promise<VariacaoSemanal[]> {
  const historico = await getHistoricoCMV(6)
  const semanasUnicas = [...new Set(historico.map(r => r.semanaISO))].sort()
  const semanaAtual   = semanasUnicas.at(-1) ?? ''

  // Agrupa por produto (média entre lojas)
  const porProduto = new Map<string, HistoricoCMV[]>()
  historico.forEach(r => {
    const key = `${r.codPa}|${r.categoria}|${r.subcategoria}`
    if (!porProduto.has(key)) porProduto.set(key, [])
    porProduto.get(key)!.push(r)
  })

  const resultado: VariacaoSemanal[] = []
  porProduto.forEach((linhas, key) => {
    const atual = linhas.filter(r => r.semanaISO === semanaAtual)
    if (atual.length === 0) return

    const cmvAtual   = avg(atual.map(r => r.cmvPct))
    const cmvAnt     = avg(atual.map(r => r.cmvPctAnterior ?? r.cmvPct))
    const deltaPp    = cmvAtual - cmvAnt

    // Histórico das últimas 6 semanas (médias por semana)
    const hist = semanasUnicas.map(sem => {
      const rows = linhas.filter(r => r.semanaISO === sem)
      return rows.length ? avg(rows.map(r => r.cmvPct)) : 0
    })

    resultado.push({
      produto:     atual[0].nomePa,
      categoria:   atual[0].categoria,
      subcategoria: atual[0].subcategoria,
      cmvAtual,
      cmvAnterior: cmvAnt,
      deltaPp,
      historico:   hist,
      status:      atual[0].status,
    })
  })

  return resultado.sort((a, b) => b.cmvAtual - a.cmvAtual)
}

// ── Desperdício por unidade (pivot mensal) ────────────────
export async function getDesperdicioByUnidade(): Promise<DesperdicioPorUnidade[]> {
  const desp = await getDesperdicio()
  const meses = ['janeiro','fevereiro','março','abril','maio']
  const mMap: Record<string, number> = {
    janeiro:0, fevereiro:1, março:2, abril:3, maio:4
  }

  const unidades = [...new Set(desp.map(d => d.unidade))].filter(Boolean)
  return unidades.map(un => {
    const rows = desp.filter(d => d.unidade === un)
    const tots = meses.map(m =>
      rows.filter(d => d.mes.toLowerCase() === m).reduce((s,d)=>s+d.custoTotal,0)
    )
    return {
      unidade: un,
      jan: tots[0], fev: tots[1], mar: tots[2],
      abr: tots[3], mai: tots[4],
      total: tots.reduce((s,v)=>s+v,0),
    }
  }).sort((a,b) => b.total - a.total)
}

// Helpers
function avg(arr: number[]) {
  return arr.length ? arr.reduce((s,v)=>s+v,0)/arr.length : 0
}
function obterMesAtual() {
  const meses = ['janeiro','fevereiro','março','abril','maio',
                 'junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return meses[new Date().getMonth()]
}
