import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDesperdicio, getDesperdicioByUnidade } from '@/lib/sheets/queries'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') ?? 'detail'

  try {
    const data = view === 'by-unidade'
      ? await getDesperdicioByUnidade()
      : await getDesperdicio()
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
