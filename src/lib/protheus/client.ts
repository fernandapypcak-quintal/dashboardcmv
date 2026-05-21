/**
 * Adapter para integração futura com Protheus ERP.
 * Por enquanto retorna dados mock — substituir pelos endpoints reais.
 *
 * Endpoints esperados do Protheus:
 *   GET /api/cmv/insumos       → lista de insumos com custo atual
 *   GET /api/cmv/fichas        → fichas técnicas atualizadas
 *   GET /api/cmv/compras       → notas de compra (para CMV real)
 */

export interface ProtheusInsumo {
  codigo: string
  descricao: string
  custoAtual: number
  unidade: string
  ultimaAtualizacao: string
}

export async function getInsumosProtheus(): Promise<ProtheusInsumo[]> {
  const url = process.env.PROTHEUS_URL
  if (!url) {
    // Sem integração configurada — retorna vazio (Sheets é a fonte)
    return []
  }

  const res = await fetch(`${url}/api/cmv/insumos`, {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.PROTHEUS_USER}:${process.env.PROTHEUS_PASS}`
      ).toString('base64')}`,
    },
    next: { revalidate: 3600 }, // cache 1h
  })

  if (!res.ok) throw new Error(`Protheus error: ${res.status}`)
  return res.json()
}
