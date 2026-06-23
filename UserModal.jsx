import { useEffect } from 'react'
import {
  X, Mail, Phone, Briefcase, Github, Instagram, Linkedin,
  FileText, CheckCircle, XCircle, Trash2, Eye, Download, Shield, User
} from 'lucide-react'
import styles from './UserModal.module.css'

const STATUS_COLORS = { approved: '#10b981', pending: '#f59e0b', rejected: '#f43f5e' }
const ROLE_COLORS = { admin: '#8b5cf6', employee: '#6366f1', worker: '#06b6d4' }

export default function UserModal({ user, onClose, onApprove, onReject, onDelete, isAdminView, currentUserId }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const certs = user.certificates || []
  const social = user.social_links || {}

  const Avatar = () => (
    user.profile_photo
      ? <img src={user.profile_photo} alt={user.name} className={styles.avatar} />
      : <div className={styles.avatarFallback}>{user.name[0]?.toUpperCase()}</div>
  )

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>

        {/* Header */}
        <div className={styles.modalHeader}>
          <Avatar />
          <div>
            <h2 className={styles.modalName}>{user.name}</h2>
            <div className={styles.modalBadges}>
              <span className={styles.badge} style={{ background: ROLE_COLORS[user.role] + '22', color: ROLE_COLORS[user.role] }}>
                {user.role === 'admin' && <Shield size={11} />} {user.role}
              </span>
              <span className={styles.badge} style={{ background: STATUS_COLORS[user.status] + '22', color: STATUS_COLORS[user.status] }}>
                {user.status}
              </span>
            </div>
            {user.department && <p className={styles.modalDept}><Briefcase size={12} />{user.department}</p>}
          </div>
        </div>

        {/* Admin actions */}
        {isAdminView && user.id !== currentUserId && (
          <div className={styles.adminActions}>
            {user.status !== 'approved' && (
              <button className={styles.approveBtn} onClick={onApprove}><CheckCircle size={15} />Approve</button>
            )}
            {user.status !== 'rejected' && (
              <button className={styles.rejectBtn} onClick={onReject}><XCircle size={15} />Reject</button>
            )}
            <button className={styles.deleteBtn} onClick={onDelete}><Trash2 size={15} />Delete user</button>
          </div>
        )}

        <div className={styles.modalBody}>
          {/* Contact info */}
          <section>
            <h3 className={styles.sectionTitle}>Contact Information</h3>
            <div className={styles.infoGrid}>
              <InfoItem icon={<Mail size={14} />} label="Email" value={user.email} />
              <InfoItem icon={<Phone size={14} />} label="Phone" value={user.phone || '—'} />
              <InfoItem icon={<User size={14} />} label="Joined" value={new Date(user.created_at).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })} />
              {user.approved_at && <InfoItem icon={<CheckCircle size={14} />} label="Approved" value={new Date(user.approved_at).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })} />}
            </div>
          </section>

          {/* Bio */}
          {user.bio && (
            <section>
              <h3 className={styles.sectionTitle}>Bio</h3>
              <p className={styles.bioText}>{user.bio}</p>
            </section>
          )}

          {/* Social links */}
          {(social.github || social.instagram || social.linkedin) && (
            <section>
              <h3 className={styles.sectionTitle}>Social Links</h3>
              <div className={styles.socialLinks}>
                {social.github && <SocialLink icon={<Github size={15} />} label="GitHub" url={social.github} color="#94a3b8" />}
                {social.instagram && <SocialLink icon={<Instagram size={15} />} label="Instagram" url={social.instagram} color="#e1306c" />}
                {social.linkedin && <SocialLink icon={<Linkedin size={15} />} label="LinkedIn" url={social.linkedin} color="#0a66c2" />}
              </div>
            </section>
          )}

          {/* Certificates */}
          <section>
            <h3 className={styles.sectionTitle}>Certificates ({certs.length})</h3>
            {certs.length === 0 ? (
              <p className={styles.empty}>No certificates uploaded</p>
            ) : (
              <div className={styles.certList}>
                {certs.map((cert, i) => {
                  const certObj = typeof cert === 'object' ? cert : { url: cert, name: cert.split('/').pop() }
                  const isPdf = certObj.url?.toLowerCase().endsWith('.pdf')
                  return (
                    <div key={i} className={styles.certItem}>
                      <div className={styles.certIcon} style={{ background: isPdf ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)' }}>
                        <FileText size={16} color={isPdf ? '#f43f5e' : '#6366f1'} />
                      </div>
                      <span className={styles.certName}>{certObj.name || `Certificate ${i+1}`}</span>
                      <div className={styles.certActions}>
                        <a href={certObj.url} target="_blank" rel="noopener noreferrer" className={styles.certBtn} title="View"><Eye size={13} /></a>
                        <a href={certObj.url} download className={styles.certBtn} title="Download"><Download size={13} /></a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div className={styles.infoItem}>
      <div className={styles.infoIcon}>{icon}</div>
      <div>
        <div className={styles.infoLabel}>{label}</div>
        <div className={styles.infoValue}>{value}</div>
      </div>
    </div>
  )
}

function SocialLink({ icon, label, url, color }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
      <span style={{ color }}>{icon}</span>
      <span>{label}</span>
      <span className={styles.socialUrl}>{url}</span>
    </a>
  )
}
