import { api } from './client'

export async function getQuestions(userId, lang='fr') {
  const { data } = await api.get('/onboarding/questions', { params: { user_id: userId, lang } })
  return data
}

export async function submitAnswers(userId, answers, language='fr') {
  // answers: [{ question_id, answer_value }]
  const { data } = await api.post('/onboarding/answers', {
    user_id: userId, answers, language
  })
  return data
}
