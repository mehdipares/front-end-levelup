import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getQuestions, submitAnswers } from '../api/onboarding'

export default function Onboarding() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({}) // { [id]: number }
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getQuestions(userId, 'fr')
        // le back renvoie data.items (ou parfois data.questions) :
        const qs = (data?.items ?? data?.questions ?? [])
          .slice()
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

        if (alive) {
          setQuestions(qs)
          setStep(0) // reset du step si on recharge
          // console.debug('[Onboarding] fetched', { count: qs.length, sample: qs[0] })
        }
      } catch (e) {
        if (e?.response?.status === 409) {
          // déjà fait => go dashboard
          navigate('/dashboard', { replace: true })
          return
        }
        setError(e?.response?.data?.error || 'Erreur chargement questionnaire')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId, navigate])

  const total = questions.length
  const current = questions[step]

  const setValue = (qid, value) => {
    setAnswers(prev => ({ ...prev, [qid]: value }))
  }

  const next = () => {
    if (step < total - 1) setStep(s => s + 1)
  }
  const prev = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      // ⚠️ Le backend attend { question_id, value }
      const list = Object.entries(answers).map(([qid, val]) => ({
        question_id: Number(qid),
        value: Number(val)
      }))
      await submitAnswers(userId, list, 'fr')
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur lors de la soumission')
    }
  }

  if (loading) return <p>Chargement du questionnaire…</p>
  if (error) return <p style={{ color:'crimson' }}>{error}</p>

  if (!total) {
    return (
      <div>
        <h2>Onboarding</h2>
        <p>Aucune question disponible pour le moment.</p>
        <button onClick={() => navigate('/dashboard', { replace: true })}>
          Passer et aller au Dashboard
        </button>
      </div>
    )
  }

  // garde-fou si step hors bornes (rare)
  if (!current) {
    setStep(0)
    return <p>Préparation du questionnaire…</p>
  }

  const answered = answers[current.id] != null

  return (
    <div>
      <h2>Onboarding</h2>
      <p>Question {step + 1} / {total}</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
          <p style={{ marginBottom: 8 }}>{current.question}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {[1,2,3,4,5].map(v => (
              <label key={v} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <input
                  type="radio"
                  name={`q_${current.id}`}
                  value={v}
                  checked={Number(answers[current.id] || 0) === v}
                  onChange={() => setValue(current.id, v)}
                />
                {v}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button type="button" onClick={prev} disabled={step === 0}>Précédent</button>

          {step < total - 1 ? (
            <button type="button" onClick={next} disabled={!answered}>Suivant</button>
          ) : (
            <button type="submit" disabled={Object.keys(answers).length !== total}>
              Terminer
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
