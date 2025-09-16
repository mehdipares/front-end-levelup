import { api } from './client'

export async function listUserGoals(id, status='active') {
  const { data } = await api.get(`/users/${id}/user-goals`, { params: { status } })
  return data
}

export async function addUserGoal(id, { template_id, cadence }) {
  const { data } = await api.post(`/users/${id}/user-goals`, { template_id, cadence })
  return data
}

export async function completeUserGoal(userId, userGoalId) {
  const { data } = await api.patch(`/users/${userId}/user-goals/${userGoalId}/complete`)
  return data
}

export async function setGoalSchedule(userId, userGoalId, cadence) {
  const { data } = await api.patch(`/users/${userId}/user-goals/${userGoalId}/schedule`, { cadence })
  return data
}

export async function archiveGoal(userId, userGoalId) {
  const { data } = await api.patch(`/users/${userId}/user-goals/${userGoalId}/archive`)
  return data
}

export async function unarchiveGoal(userId, userGoalId) {
  const { data } = await api.patch(`/users/${userId}/user-goals/${userGoalId}/unarchive`)
  return data
}

export async function deleteGoal(userId, userGoalId) {
  const { data } = await api.delete(`/users/${userId}/user-goals/${userGoalId}`)
  return data
}
