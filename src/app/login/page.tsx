'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-[#0D0D0D] flex items-center justify-center
                          text-white font-bold text-sm">QE</div>
          <div>
            <div className="font-semibold text-[#111] text-sm">Quintal do Espeto</div>
            <div className="text-[#888] text-xs">Analytics · CMV</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e8e8e6] rounded-xl p-7">
          <h1 className="text-lg font-semibold text-[#111] mb-1">Entrar</h1>
          <p className="text-sm text-[#888] mb-6">Acesso restrito ao time interno</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-[#e8e8e6] rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:border-[#97A624] transition-colors"
                placeholder="seu@quintal.com.br"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-wide">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-[#e8e8e6] rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:border-[#97A624] transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-[#8C1414] bg-[#fdf0ef] border border-[#f0c4c1]
                            rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D0D0D] text-white rounded-lg py-2.5 text-sm font-medium
                         hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#aaa] mt-6">
          CMV Dashboard v1.0 · Quintal do Espeto
        </p>
      </div>
    </div>
  )
}
