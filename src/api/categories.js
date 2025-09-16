import { api } from './client'
export async function listCategories() {
  const { data } = await api.get('/categories')
  return data
}
