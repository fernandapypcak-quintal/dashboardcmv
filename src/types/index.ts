// ── Produto / Ficha Técnica ────────────────────────────────
export interface Produto {
  id: string
  skuZig: string
  skuProtheus: string
  nome: string
  categoria: string
  subcategoria: string
  canal: string
  precoVenda: number
  ativo: boolean
}

export interface FichaTecnica {
  idFicha: string
  codPa: string
  nomePa: string
  categoria: string
  subcategoria: string
  descComponente: string
  qtd: number
  und: string
  custoUnit: number
  custoIngr: number
  precoVenda: number
  cmvPct: number
  precoSugerido30: number
  margContribR: number
  margContribPct: number
}

// ── Histórico CMV ──────────────────────────────────────────
export interface HistoricoCMV {
  semanaISO: string
  dataRef: string
  codPa: string
  nomePa: string
  categoria: string
  subcategoria: string
  loja: string
  precoVenda: number
  custoCmv: number
  cmvPct: number
  cmvPctAnterior: number | null
  deltaPp: number | null
  precoSugerido: number
  status: 'OK' | 'Atenção' | 'Crítico'
  alerta: 'SIM' | 'NÃO'
}

// ── Desperdício ────────────────────────────────────────────
export interface Desperdicio {
  id: string
  data: string
  mes: string
  semana: number
  unidade: string
  funcionario: string
  produto: string
  quantidade: number
  custoUnit: number
  custoTotal: number
  valorVenda: number
  classificacao: string
  justificativa: string
}

// ── Metas CMV ─────────────────────────────────────────────
export interface MetaCMV {
  periodo: string
  ano: number
  mes: number
  semana: number
  categoria: string
  subcategoria: string
  metaCmv: number
  metaMargem: number
  cmvSugerido: number | null
  cmvRealizado: number | null
  deltaMeta: number | null
  status: string
  confirmado: boolean
}

// ── Resumos para o dashboard ──────────────────────────────
export interface KpiResumo {
  cmvTeorico: number
  cmvReal: number
  deltaCmv: number
  desperdicio: number
  itensCriticos: number
  unidades: number
}

export interface VariacaoSemanal {
  produto: string
  categoria: string
  subcategoria: string
  cmvAtual: number
  cmvAnterior: number
  deltaPp: number
  historico: number[]   // últimas 6 semanas
  status: 'OK' | 'Atenção' | 'Crítico'
}

export interface DesperdicioPorUnidade {
  unidade: string
  jan: number; fev: number; mar: number
  abr: number; mai: number; total: number
}

// ── Adaptador de fonte de dados (Sheets → Supabase) ───────
export interface DataSource {
  getFichasTecnicas(): Promise<FichaTecnica[]>
  getHistoricoCMV(semanas?: number): Promise<HistoricoCMV[]>
  getDesperdicio(): Promise<Desperdicio[]>
  getMetas(): Promise<MetaCMV[]>
  getKpis(): Promise<KpiResumo>
}
