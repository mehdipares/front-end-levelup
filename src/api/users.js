import { api } from './client'

export async function getUser(id) {
  const { data } = await api.get(`/users/${id}`)
  return data
}

export async function updateUser(id, { email, username }) {
  const body = {}
  if (email !== undefined) body.email = email
  if (username !== undefined) body.username = username
  const { data } = await api.patch(`/users/${id}`, body)
  return data
}

export async function getPriorities(id) {
  const { data } = await api.get(`/users/${id}/priorities`)
  return data
}

export async function savePriorityOrder(id, orderedIds) {
  const { data } = await api.put(`/users/${id}/priorities/order`, {
    ordered_category_ids: orderedIds
  })
  return data
}
