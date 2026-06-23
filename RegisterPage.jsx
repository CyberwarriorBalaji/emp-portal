import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Phone, Briefcase, Eye, EyeOff, Building2, Loader, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import styles from './RegisterPage.module.css'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', department: '', role: 'employee'
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Name, email and password are required')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.access_token, res.data.user)
      toast.success('Account created! Welcome to EmpPortal.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <div className={styles.blob1} /><div className={styles.blob2} />
        <div className={styles.grid} />
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}><Building2 size={24} /></div>
            <div>
              <h2>Create your account</h2>
              <p>Join EmpPortal today</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Full name *</label>
                <div className={styles.inputWrap}>
                  <User size={15} className={styles.icon} />
                  <input type="text" placeholder="Jane Smith" value={form.name} onChange={set('name')} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Role</label>
                <div className={styles.inputWrap}>
                  <Briefcase size={15} className={styles.icon} />
                  <select value={form.role} onChange={set('role')} className={styles.select}>
                    <option value="employee">Employee</option>
                    <option value="worker">Worker</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label>Email address *</label>
              <div className={styles.inputWrap}>
                <Mail size={15} className={styles.icon} />
                <input type="email" placeholder="jane@company.com" value={form.email} onChange={set('email')} />
              </div>
            </div>

            <div className={styles.field}>
              <label>Password *</label>
              <div className={styles.inputWrap}>
                <Lock size={15} className={styles.icon} />
                <input type={showPw ? 'text' : 'password'} placeholder="Minimum 6 characters" value={form.password} onChange={set('password')} />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {form.password && (
                <div className={styles.strengthBar}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={styles.strengthSeg} style={{
                      background: form.password.length > i * 2
                        ? form.password.length < 8 ? '#f59e0b' : form.password.length < 12 ? '#6366f1' : '#10b981'
                        : 'var(--border)'
                    }} />
                  ))}
                </div>
              )}
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Phone</label>
                <div className={styles.inputWrap}>
                  <Phone size={15} className={styles.icon} />
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Department</label>
                <div className={styles.inputWrap}>
                  <Briefcase size={15} className={styles.icon} />
                  <input type="text" placeholder="Engineering" value={form.department} onChange={set('department')} />
                </div>
              </div>
            </div>

            <div className={styles.notice}>
              <span>⚠</span>
              <p>New accounts require <strong>admin approval</strong> before you can access the portal.</p>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <Loader size={16} className="spinner" /> : <><span>Create account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className={styles.switchLink}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
