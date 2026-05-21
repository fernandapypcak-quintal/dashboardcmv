import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

function getAuth() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!key) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurada')

  const credentials = JSON.parse(
    Buffer.from(key, 'base64').toString('utf-8')
  )

  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES })
}

export async function getSheetsClient() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

export const SHEET_ID = process.env.GOOGLE_SHEET_ID!

// Lê um range de uma aba e retorna array de arrays
export async function readRange(range: string): Promise<string[][]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  })
  return (res.data.values ?? []) as string[][]
}

// Converte linhas brutas em objetos usando a linha de header
export function rowsToObjects<T>(
  rows: string[][],
  headerRowIndex = 0
): T[] {
  if (rows.length <= headerRowIndex) return []
  const headers = rows[headerRowIndex].map(h =>
    h.toLowerCase().trim().replace(/\s+/g, '_')
  )
  return rows.slice(headerRowIndex + 1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
      return obj as T
    })
}

// Nomes das abas
export const SHEETS = {
  DIM_PRODUTOS:     '1_dim_produtos',
  CUSTOS_SEMANA:    '2_custos_semana',
  FICHA_TECNICA:    '3_ficha_tecnica',
  DIM_INGREDIENTES: '4_dim_ingredientes',
  FATO_DESPERDICIO: '5_fato_desperdicio',
  HISTORICO_CMV:    '6_historico_cmv',
  ALERTAS:          '7_alertas',
  METAS_CMV:        '8_metas_cmv',
  PARAMETROS:       '9_parametros',
}
