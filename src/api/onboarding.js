import { api } from './client'

/**
 * Récupère les questions d'onboarding.
 * Retourne toujours un objet normalisé : { items: Question[], count: number, language: string }
 */
export async function getQuestions(userId, lang = 'fr') {
  const { data } = await api.get('/onboarding/questions', {
    params: {
      user_id: userId,
      lang,          // attendu par le back
      language: lang // ceinture+bretelles si le back lit "language"
    }
  })

  const items = data?.items ?? data?.questions ?? []
  const count = data?.count ?? items.length
  const language = data?.language ?? lang

  return { items, count, language }
}

/**
 * Soumet les réponses.
 * Le backend attend: { user_id, language, answers: [{ question_id, value }] }
 * On accepte aussi des éléments { question_id, answer_value } et on normalise en { value }.
 */
export async function submitAnswers(userId, answers, language = 'fr') {
  const normalized = (answers || [])
    .map(a => ({
      question_id: Number(a.question_id ?? a.id),
      value: Number(a.value ?? a.answer_value)
    }))
    .filter(a => Number.isFinite(a.question_id) && Number.isFinite(a.value))

  const payload = { user_id: userId, language, answers: normalized }
  const { data } = await api.post('/onboarding/answers', payload)
  return data
}
