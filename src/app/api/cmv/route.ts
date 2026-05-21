import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHistoricoCMV, getVariacaoSemanal } from '@/lib/sheets/queries'

export async function GET(req: Request) {
  // Autenticação
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tipo    = searchParams.get('tipo') ?? 'historico'
  const semanas = parseInt(searchParams.get('semanas') ?? '8')

  try {
    if (tipo === 'variacao') {
      const data = await getVariacaoSemanal()
      return NextResponse.json(data)
    }
    const data = await getHistoricoCMV(semanas)
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
