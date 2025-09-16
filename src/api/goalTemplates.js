import { api } from './client'

export async function listTemplates() {
  const { data } = await api.get('/goal-templates')
  return data
}

export async function getTemplate(id) {
  const { data } = await api.get(`/goal-templates/${id}`)
  return data
}

export async function createTemplate(payload) {
  const { data } = await api.post('/goal-templates', payload)
  return data
}

export async function setTemplateEnabled(id, enabled) {
  const { data } = await api.put(`/goal-templates/${id}/enabled`, { enabled })
  return data
}
