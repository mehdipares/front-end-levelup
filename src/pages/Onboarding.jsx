import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getQuestions, submitAnswers } from '../api/onboarding'

export default function Onboarding() {
  const { userId } = useAuth()
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      try {
        const data = await getQuestions(userId, 'fr')
        setQuestions(data?.questions || [])
      } catch (e) {
        // If 409, already done → go dashboard
        if (e?.response?.status === 409) {
          navigate('/dashboard', { replace: true })
          return
        }
        setError(e?.response?.data?.error || 'Erreur chargement questionnaire')
      }
    })()
  }, [userId, navigate])

  const setValue = (qid, value) => {
    setAnswers(prev => ({ ...prev, [qid]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      const list = Object.entries(answers).map(([question_id, answer_value]) => ({ question_id: Number(question_id), answer_value: Number(answer_value) }))
      await submitAnswers(userId, list, 'fr')
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur lors de la soumission')
    }
  }

  return (
    <div>
      <h2>Onboarding</h2>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      {!questions.length ? <p>Chargement...</p> :
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
          {questions.map(q => (
            <div key={q.id} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
              <p style={{ marginBottom: 8 }}>{q.question}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5].map(v => (
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={v}
                      checked={Number(answers[q.id] || 0) === v}
                      onChange={() => setValue(q.id, v)}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button type="submit">Valider</button>
        </form>
      }
    </div>
  )
}
