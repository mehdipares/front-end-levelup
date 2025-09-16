import { api } from './client'
export async function getTodayQuote(lang='fr') {
  const { data } = await api.get('/quotes/today', { params: { lang } })
  return data
}
