import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { Mail, Lock, Phone, Eye, EyeOff, Building2, Github, RefreshCw, ArrowRight, Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import styles from './LoginPage.module.css'

const TABS = ['password', 'otp', 'sms']
const TAB_LABELS = { password: 'Password', otp: 'Email OTP', sms: 'SMS OTP' }

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('password')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [smsSent, setSmsSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const [form, setForm] = useState({ email: '', password: '', otp: '', phone: '', smsOtp: '' })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const startCountdown = () => {
    setCountdown(60)
    const iv = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(iv); return 0 } return c - 1 }), 1000)
  }

  const handleSuccess = ({ access_token, user }) => {
    login(access_token, user)
    toast.success(`Welcome back, ${user.name}!`)
    navigate('/dashboard')
  }

  // Password login
  const handlePasswordLogin = async e => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Fill in all fields')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password })
      handleSuccess(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally { setLoading(false) }
  }

  // Email OTP
  const sendEmailOtp = async () => {
    if (!form.email) return toast.error('Enter your email first')
    setLoading(true)
    try {
      await api.post('/auth/otp/send', { email: form.email })
      setOtpSent(true)
      startCountdown()
      toast.success('OTP sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleOtpLogin = async e => {
    e.preventDefault()
    if (!form.otp) return toast.error('Enter the OTP')
    setLoading(true)
    try {
      const res = await api.post('/auth/otp/verify', { email: form.email, otp: form.otp })
      handleSuccess(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  // SMS OTP
  const sendSmsOtp = async () => {
    if (!form.phone) return toast.error('Enter your phone number first')
    setLoading(true)
    try {
      await api.post('/auth/sms/send', { phone: form.phone })
      setSmsSent(true)
      startCountdown()
      toast.success('OTP sent via SMS!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send SMS OTP')
    } finally { setLoading(false) }
  }

  const handleSmsLogin = async e => {
    e.preventDefault()
    if (!form.smsOtp) return toast.error('Enter the OTP')
    setLoading(true)
    try {
      const res = await api.post('/auth/sms/verify', { phone: form.phone, otp: form.smsOtp })
      handleSuccess(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  // Google OAuth
  const googleLogin = useGoogleLogin({
    onSuccess: async tokenResponse => {
      setLoading(true)
      try {
        // Get id_token via tokeninfo
        const profileRes = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
        )
        const profile = await profileRes.json()
        // Use implicit flow: send access_token to backend which verifies via tokeninfo
        const res = await api.post('/auth/google', { token: tokenResponse.access_token, profile })
        handleSuccess(res.data)
      } catch (err) {
        toast.error('Google login failed')
      } finally { setLoading(false) }
    },
    onError: () => toast.error('Google login cancelled'),
  })

  // GitHub OAuth
  const handleGithub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!clientId) return toast.error('GitHub OAuth not configured')
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'user:email',
      redirect_uri: `${window.location.origin}/github-callback`,
    })
    window.location.href = `https://github.com/login/oauth/authorize?${params}`
  }

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bg}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.grid} />
      </div>

      <div className={styles.container}>
        {/* Left branding */}
        <div className={styles.branding}>
          <div className={styles.logo}>
            <Building2 size={32} />
          </div>
          <h1 className={styles.brandTitle}>EmpPortal</h1>
          <p className={styles.brandSub}>The unified employee management platform for modern organizations.</p>

          <div className={styles.features}>
            {['Secure JWT authentication', 'Role-based access control', 'File & certificate management', 'Real-time admin controls'].map(f => (
              <div key={f} className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Sign in</h2>
            <p>Choose your preferred method</p>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                onClick={() => setTab(t)}>{TAB_LABELS[t]}</button>
            ))}
          </div>

          {/* Password form */}
          {tab === 'password' && (
            <form className={styles.form} onSubmit={handlePasswordLogin}>
              <div className={styles.field}>
                <label>Email address</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} autoComplete="email" />
                </div>
              </div>
              <div className={styles.field}>
                <label>Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} autoComplete="current-password" />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" className={styles.primaryBtn} disabled={loading}>
                {loading ? <Loader size={16} className="spinner" /> : <><span>Sign in</span><ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Email OTP form */}
          {tab === 'otp' && (
            <form className={styles.form} onSubmit={handleOtpLogin}>
              <div className={styles.field}>
                <label>Email address</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} />
                </div>
              </div>
              {!otpSent ? (
                <button type="button" className={styles.primaryBtn} onClick={sendEmailOtp} disabled={loading}>
                  {loading ? <Loader size={16} className="spinner" /> : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div className={styles.field}>
                    <label>Enter OTP <span className={styles.otpHint}>(6-digit code sent to your email)</span></label>
                    <div className={styles.inputWrap}>
                      <input type="text" placeholder="000000" value={form.otp} onChange={set('otp')} maxLength={6} className={styles.otpInput} />
                    </div>
                  </div>
                  <div className={styles.otpActions}>
                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                      {loading ? <Loader size={16} className="spinner" /> : 'Verify & Sign in'}
                    </button>
                    <button type="button" className={styles.resendBtn} onClick={sendEmailOtp} disabled={countdown > 0 || loading}>
                      <RefreshCw size={14} /> {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* SMS OTP form */}
          {tab === 'sms' && (
            <form className={styles.form} onSubmit={handleSmsLogin}>
              <div className={styles.field}>
                <label>Phone number</label>
                <div className={styles.inputWrap}>
                  <Phone size={16} className={styles.inputIcon} />
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
                </div>
              </div>
              {!smsSent ? (
                <button type="button" className={styles.primaryBtn} onClick={sendSmsOtp} disabled={loading}>
                  {loading ? <Loader size={16} className="spinner" /> : 'Send SMS OTP'}
                </button>
              ) : (
                <>
                  <div className={styles.field}>
                    <label>Enter OTP <span className={styles.otpHint}>(sent via SMS)</span></label>
                    <div className={styles.inputWrap}>
                      <input type="text" placeholder="000000" value={form.smsOtp} onChange={set('smsOtp')} maxLength={6} className={styles.otpInput} />
                    </div>
                  </div>
                  <div className={styles.otpActions}>
                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                      {loading ? <Loader size={16} className="spinner" /> : 'Verify & Sign in'}
                    </button>
                    <button type="button" className={styles.resendBtn} onClick={sendSmsOtp} disabled={countdown > 0 || loading}>
                      <RefreshCw size={14} /> {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* Divider */}
          <div className={styles.divider}><span>or continue with</span></div>

          {/* Social buttons */}
          <div className={styles.socialBtns}>
            <button className={styles.socialBtn} onClick={() => googleLogin()} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className={styles.socialBtn} onClick={handleGithub} disabled={loading}>
              <Github size={18} />
              GitHub
            </button>
          </div>

          <p className={styles.switchLink}>
            Don't have an account? <Link to="/register">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
