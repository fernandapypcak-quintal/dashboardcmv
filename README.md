# CMV Dashboard — Quintal do Espeto

Dashboard executivo de CMV · Next.js 14 · Tailwind · TypeScript · Vercel

---

## Stack

- **Next.js 14** (App Router) — framework
- **Tailwind CSS** — estilização
- **TypeScript** — tipagem
- **Google Sheets API** — banco de dados inicial
- **Supabase** — autenticação + migração futura de dados
- **Recharts** — gráficos
- **Vercel** — deploy

---

## Setup local

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/cmv-dashboard.git
cd cmv-dashboard
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha cada variável conforme instruções no `.env.example`.

### 3. Google Sheets — Service Account

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto → ative a **Google Sheets API**
3. Crie uma **Service Account** → gere uma chave JSON
4. Encode em base64: `base64 -i credentials.json | tr -d '\n'`
5. Cole o resultado em `GOOGLE_SERVICE_ACCOUNT_KEY`
6. **Compartilhe** a planilha com o e-mail da service account (leitor)
7. Cole o ID da planilha em `GOOGLE_SHEET_ID`

### 4. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **Project Settings → API** e copie as chaves
3. Em **Authentication → Users**, crie os usuários do time
4. Preencha as variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 5. Rode localmente

```bash
npm run dev
# Acesse http://localhost:3000
```

---

## Deploy na Vercel

```bash
# Instale a CLI
npm i -g vercel

# Deploy
vercel

# Configure as variáveis de ambiente no painel da Vercel
# Settings → Environment Variables → adicione todas do .env.example
```

Ou conecte o repositório GitHub diretamente na [Vercel](https://vercel.com) — deploy automático a cada push.

---

## Estrutura do projeto

```
src/
├── app/
│   ├── api/              # API routes (cmv, desperdicio, metas, alertas)
│   ├── auth/signout/     # Logout handler
│   ├── dashboard/        # Páginas protegidas
│   └── login/            # Tela de login
├── components/
│   ├── charts/           # Recharts components
│   ├── layout/           # Sidebar, Topbar
│   └── ui/               # KpiCard, AlertBox, tabelas
├── lib/
│   ├── sheets/           # Google Sheets API client + queries
│   ├── supabase/         # Supabase client (browser + server)
│   └── protheus/         # Adapter Protheus (futuro)
├── types/                # TypeScript types
└── middleware.ts          # Auth guard
```

---

## Migração para Supabase (quando pronto)

A camada de dados usa a interface `DataSource` em `src/types/index.ts`.
Para migrar do Sheets para o Supabase como banco principal:

1. Crie as tabelas no Supabase espelhando as abas da planilha
2. Implemente `src/lib/supabase/queries.ts` com a mesma interface
3. Troque a importação em cada página de `@/lib/sheets/queries` para `@/lib/supabase/queries`
4. Sem mudança no visual — o contrato de tipos permanece igual

---

## Conexão com Protheus

Configure as variáveis `PROTHEUS_URL`, `PROTHEUS_USER` e `PROTHEUS_PASS` no `.env.local`.
O adapter em `src/lib/protheus/client.ts` já está preparado para consumir os endpoints do ERP.

---

## Apps Script (Google Sheets)

O arquivo `CMV_AppScript.js` contém o script que:
- Roda toda terça às 11:00 automaticamente
- Consome a API ZIG (`/erp/saida-produtos`, `/erp/lojas`)
- Recalcula o CMV com os custos atuais
- Grava o snapshot no `6_historico_cmv`
- Envia e-mail de confirmação

**Instalação:** Sheets → Extensões → Apps Script → cole o código → execute `setupTriggers()`.
