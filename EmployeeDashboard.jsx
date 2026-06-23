import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  User, Mail, Phone, Briefcase, Github, Instagram, Linkedin,
  Edit3, Save, X, Upload, FileText, Trash2, LogOut, Building2,
  Clock, CheckCircle, AlertCircle, Eye, Download, Camera, Loader
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import styles from './EmployeeDashboard.module.css'

const STATUS_INFO = {
  approved: { icon: CheckCircle, color: '#10b981', label: 'Account Active' },
  pending: { icon: Clock, color: '#f59e0b', label: 'Pending Approval' },
  rejected: { icon: AlertCircle, color: '#f43f5e', label: 'Account Rejected' },
}

export default function EmployeeDashboard() {
  const { user, logout, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingCert, setUploadingCert] = useState(false)
  const [previewCert, setPreviewCert] = useState(null)
  const photoRef = useRef()
  const certRef = useRef()

  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    department: user.department || '',
    bio: user.bio || '',
    social_links: {
      github: user.social_links?.github || '',
      instagram: user.social_links?.instagram || '',
      linkedin: user.social_links?.linkedin || '',
    }
  })

  const set = (k, nested) => e => {
    if (nested) setForm(f => ({ ...f, social_links: { ...f.social_links, [k]: e.target.value } }))
    else setForm(f => ({ ...f, [k]: e.target.value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/users/me', form)
      await refreshUser()
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally { setSaving(false) }
  }

  const handlePhotoUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/users/me/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      toast.success('Profile photo updated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally { setUploadingPhoto(false) }
  }

  const handleCertUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCert(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/users/me/certificates', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      toast.success('Certificate uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally { setUploadingCert(false) }
  }

  const deleteCert = async idx => {
    if (!confirm('Delete this certificate?')) return
    try {
      await api.delete(`/users/me/certificates/${idx}`)
      await refreshUser()
      toast.success('Certificate removed')
    } catch { toast.error('Delete failed') }
  }

  const statusInfo = STATUS_INFO[user.status] || STATUS_INFO.pending
  const StatusIcon = statusInfo.icon

  const Avatar = ({ size = 96 }) => (
    user.profile_photo
      ? <img src={user.profile_photo} alt={user.name}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      : <div style={{
          width: size, height: size, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: size * 0.38
        }}>{user.name[0]?.toUpperCase()}</div>
  )

  const certs = user.certificates || []

  return (
    <div className={styles.page}>
      <div className={styles.bg}><div className={styles.blob} /></div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLogo}><Building2 size={20} /><span>EmpPortal</span></div>
        <div className={styles.headerRight}>
          <div className={styles.statusPill} style={{ background: statusInfo.color + '22', color: statusInfo.color }}>
            <StatusIcon size={13} />{statusInfo.label}
          </div>
          <button className={styles.logoutBtn} onClick={logout}><LogOut size={16} />Sign out</button>
        </div>
      </header>

      <div className={styles.container}>
        {/* Profile card */}
        <div className={styles.profileCard}>
          {/* Photo */}
          <div className={styles.photoSection}>
            <div className={styles.photoWrap}>
              <Avatar size={100} />
              <button className={styles.photoEditBtn} onClick={() => photoRef.current?.click()}
                disabled={uploadingPhoto} title="Change photo">
                {uploadingPhoto ? <Loader size={14} className="spinner" /> : <Camera size={14} />}
              </button>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </div>
            <div>
              <h1 className={styles.profileName}>{user.name}</h1>
              <div className={styles.profileMeta}>
                <span className={styles.roleBadge}>{user.role}</span>
                {user.department && <span className={styles.deptBadge}>{user.department}</span>}
              </div>
            </div>
          </div>

          {/* Edit toggle */}
          <div className={styles.profileActions}>
            {editing ? (
              <>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? <Loader size={15} className="spinner" /> : <Save size={15} />}
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button className={styles.cancelBtn} onClick={() => setEditing(false)}><X size={15} />Cancel</button>
              </>
            ) : (
              <button className={styles.editBtn} onClick={() => setEditing(true)}><Edit3 size={15} />Edit profile</button>
            )}
          </div>

          <div className={styles.divider} />

          {/* Fields */}
          <div className={styles.fields}>
            <Field icon={<User size={15} />} label="Full name" editing={editing}
              value={form.name} onChange={set('name')} />
            <Field icon={<Mail size={15} />} label="Email" editing={false}
              value={user.email} readOnly />
            <Field icon={<Phone size={15} />} label="Phone" editing={editing}
              value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            <Field icon={<Briefcase size={15} />} label="Department" editing={editing}
              value={form.department} onChange={set('department')} placeholder="e.g. Engineering" />
          </div>

          {/* Bio */}
          <div className={styles.bioSection}>
            <label className={styles.fieldLabel}>Bio</label>
            {editing ? (
              <textarea className={styles.bioInput} placeholder="Tell us about yourself…"
                value={form.bio} onChange={set('bio')} rows={3} />
            ) : (
              <p className={styles.bioText}>{user.bio || <span className={styles.empty}>No bio added yet.</span>}</p>
            )}
          </div>

          <div className={styles.divider} />

          {/* Social links */}
          <div>
            <h3 className={styles.sectionTitle}>Social Links</h3>
            <div className={styles.socialLinks}>
              <SocialField icon={<Github size={16} />} label="GitHub" color="#94a3b8"
                editing={editing} value={form.social_links.github} onChange={set('github', true)}
                placeholder="https://github.com/username" actual={user.social_links?.github} />
              <SocialField icon={<Instagram size={16} />} label="Instagram" color="#e1306c"
                editing={editing} value={form.social_links.instagram} onChange={set('instagram', true)}
                placeholder="https://instagram.com/username" actual={user.social_links?.instagram} />
              <SocialField icon={<Linkedin size={16} />} label="LinkedIn" color="#0a66c2"
                editing={editing} value={form.social_links.linkedin} onChange={set('linkedin', true)}
                placeholder="https://linkedin.com/in/username" actual={user.social_links?.linkedin} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          {/* Account info */}
          <div className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>Account Information</h3>
            <div className={styles.infoRows}>
              <InfoRow label="User ID" value={user.id.slice(-8).toUpperCase()} mono />
              <InfoRow label="Role" value={user.role} capitalize />
              <InfoRow label="Status" value={user.status} capitalize color={statusInfo.color} />
              <InfoRow label="Joined" value={new Date(user.created_at).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })} />
              {user.approved_at && <InfoRow label="Approved" value={new Date(user.approved_at).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })} />}
            </div>
          </div>

          {/* Certificates */}
          <div className={styles.certsCard}>
            <div className={styles.certsHeader}>
              <h3 className={styles.sectionTitle}>Certificates & Documents</h3>
              <button className={styles.uploadCertBtn} onClick={() => certRef.current?.click()} disabled={uploadingCert}>
                {uploadingCert ? <Loader size={14} className="spinner" /> : <Upload size={14} />}
                Upload
              </button>
              <input ref={certRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleCertUpload} />
            </div>

            {certs.length === 0 ? (
              <div className={styles.emptyCerts}>
                <FileText size={32} />
                <p>No certificates uploaded yet</p>
                <button className={styles.uploadEmptyBtn} onClick={() => certRef.current?.click()}>
                  <Upload size={14} /> Upload your first certificate
                </button>
              </div>
            ) : (
              <div className={styles.certList}>
                {certs.map((cert, i) => {
                  const certObj = typeof cert === 'object' ? cert : { url: cert, name: cert.split('/').pop() }
                  const isPdf = certObj.url?.toLowerCase().endsWith('.pdf')
                  return (
                    <div key={i} className={styles.certItem}>
                      <div className={styles.certIcon} style={{ background: isPdf ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)' }}>
                        <FileText size={18} color={isPdf ? '#f43f5e' : '#6366f1'} />
                      </div>
                      <div className={styles.certInfo}>
                        <span className={styles.certName}>{certObj.name || `Certificate ${i + 1}`}</span>
                        <span className={styles.certDate}>{certObj.uploaded_at ? new Date(certObj.uploaded_at).toLocaleDateString() : ''}</span>
                      </div>
                      <div className={styles.certActions}>
                        <a href={certObj.url} target="_blank" rel="noopener noreferrer" className={styles.certActionBtn} title="View">
                          <Eye size={14} />
                        </a>
                        <a href={certObj.url} download className={styles.certActionBtn} title="Download">
                          <Download size={14} />
                        </a>
                        <button className={`${styles.certActionBtn} ${styles.certDeleteBtn}`} onClick={() => deleteCert(i)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pending notice */}
          {user.status === 'pending' && (
            <div className={styles.pendingBanner}>
              <Clock size={20} color="#f59e0b" />
              <div>
                <strong>Awaiting admin approval</strong>
                <p>Your account is under review. You'll have full access once approved.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ icon, label, editing, value, onChange, placeholder, readOnly }) {
  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldIcon}>{icon}</div>
      <div className={styles.fieldContent}>
        <span className={styles.fieldLabel}>{label}</span>
        {editing && !readOnly ? (
          <input className={styles.fieldInput} value={value} onChange={onChange} placeholder={placeholder} />
        ) : (
          <span className={styles.fieldValue}>{value || <span style={{color:'var(--text-dim)'}}>—</span>}</span>
        )}
      </div>
    </div>
  )
}

function SocialField({ icon, label, color, editing, value, onChange, placeholder, actual }) {
  return (
    <div className={styles.socialRow}>
      <div className={styles.socialIcon} style={{ color }}>{icon}</div>
      <div className={styles.socialContent}>
        <span className={styles.fieldLabel}>{label}</span>
        {editing ? (
          <input className={styles.fieldInput} value={value} onChange={onChange} placeholder={placeholder} />
        ) : actual ? (
          <a href={actual} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>{actual}</a>
        ) : (
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Not added</span>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono, capitalize, color }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue} style={{
        fontFamily: mono ? 'monospace' : undefined,
        textTransform: capitalize ? 'capitalize' : undefined,
        color: color || undefined,
      }}>{value}</span>
    </div>
  )
}
