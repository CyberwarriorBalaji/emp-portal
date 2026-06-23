import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import LoadingScreen from '../components/LoadingScreen'

export default function GitHubCallback() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) { toast.error('GitHub auth failed'); navigate('/login'); return }

    api.post('/auth/github', { code })
      .then(res => {
        login(res.data.access_token, res.data.user)
        toast.success(`Welcome, ${res.data.user.name}!`)
        navigate('/dashboard')
      })
      .catch(() => { toast.error('GitHub login failed'); navigate('/login') })
  }, [])

  return <LoadingScreen />
}
