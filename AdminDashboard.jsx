import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  Users, UserCheck, UserX, Clock, Trash2, CheckCircle, XCircle,
  Eye, LogOut, Building2, Search, Filter, RefreshCw, Shield, Download
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import UserModal from '../components/UserModal'
import styles from './AdminDashboard.module.css'

const STATUS_COLORS = { approved: '#10b981', pending: '#f59e0b', rejected: '#f43f5e' }
const ROLE_COLORS = { admin: '#8b5cf6', employee: '#6366f1', worker: '#06b6d4' }

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/')
      setUsers(res.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const doAction = async (userId, action) => {
    setActionLoading(a => ({ ...a, [userId + action]: true }))
    try {
      const res = await api.put(`/users/${userId}/status`, { action })
      setUsers(u => u.map(x => x.id === userId ? res.data : x))
      toast.success(`User ${action}d successfully`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed')
    } finally {
      setActionLoading(a => ({ ...a, [userId + action]: false }))
    }
  }

  const deleteUser = async (userId, name) => {
    if (!confirm(`Delete ${name}? This is irreversible.`)) return
    try {
      await api.delete(`/users/${userId}`)
      setUsers(u => u.filter(x => x.id !== userId))
      toast.success('User deleted')
      if (selected?.id === userId) setSelected(null)
    } catch { toast.error('Delete failed') }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.status === filter || u.role === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total: users.length,
    approved: users.filter(u => u.status === 'approved').length,
    pending: users.filter(u => u.status === 'pending').length,
    rejected: users.filter(u => u.status === 'rejected').length,
  }

  const Avatar = ({ u, size = 36 }) => (
    u.profile_photo
      ? <img src={u.profile_photo} alt={u.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      : <div style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${ROLE_COLORS[u.role] || '#6366f1'}, #8b5cf6)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: size * 0.38
        }}>{u.name[0]?.toUpperCase()}</div>
  )

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Building2 size={22} />
          <span>EmpPortal</span>
        </div>
        <nav className={styles.nav}>
          <div className={styles.navItem + ' ' + styles.navActive}><Users size={18} /><span>All Users</span></div>
        </nav>
        <div className={styles.sidebarFooter}>
          <Avatar u={user} size={34} />
          <div className={styles.sidebarUser}>
            <span className={styles.sidebarName}>{user.name}</span>
            <span className={styles.sidebarRole}><Shield size={11} /> Admin</span>
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="Sign out"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>User Management</h1>
            <p className={styles.subtitle}>Manage employee accounts and approvals</p>
          </div>
          <button className={styles.refreshBtn} onClick={fetchUsers}><RefreshCw size={15} /></button>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { label: 'Total Users', value: stats.total, icon: Users, color: '#6366f1' },
            { label: 'Approved', value: stats.approved, icon: UserCheck, color: '#10b981' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
            { label: 'Rejected', value: stats.rejected, icon: UserX, color: '#f43f5e' },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: s.color + '22', color: s.color }}>
                <s.icon size={20} />
              </div>
              <div>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles.filterWrap}>
            <Filter size={14} />
            {['all', 'pending', 'approved', 'rejected', 'admin', 'employee', 'worker'].map(f => (
              <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.loadingRow}><div className={styles.spinner} /><span>Loading users…</span></div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}><Users size={40} /><p>No users found</p></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className={styles.row}>
                    <td>
                      <div className={styles.userCell}>
                        <Avatar u={u} size={38} />
                        <div>
                          <div className={styles.userName}>{u.name}</div>
                          <div className={styles.userEmail}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.badge} style={{ background: ROLE_COLORS[u.role] + '22', color: ROLE_COLORS[u.role] }}>
                        {u.role}
                      </span>
                    </td>
                    <td className={styles.muted}>{u.department || '—'}</td>
                    <td>
                      <span className={styles.statusBadge} style={{ background: STATUS_COLORS[u.status] + '22', color: STATUS_COLORS[u.status] }}>
                        <span className={styles.statusDot} style={{ background: STATUS_COLORS[u.status] }} />
                        {u.status}
                      </span>
                    </td>
                    <td className={styles.muted}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} title="View profile" onClick={() => setSelected(u)}>
                          <Eye size={15} />
                        </button>
                        {u.status === 'pending' && (
                          <>
                            <button className={`${styles.actionBtn} ${styles.approveBtn}`}
                              title="Approve" disabled={actionLoading[u.id + 'approve']}
                              onClick={() => doAction(u.id, 'approve')}>
                              <CheckCircle size={15} />
                            </button>
                            <button className={`${styles.actionBtn} ${styles.rejectBtn}`}
                              title="Reject" disabled={actionLoading[u.id + 'reject']}
                              onClick={() => doAction(u.id, 'reject')}>
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        {u.status === 'rejected' && (
                          <button className={`${styles.actionBtn} ${styles.approveBtn}`}
                            title="Approve" onClick={() => doAction(u.id, 'approve')}>
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {u.id !== user.id && (
                          <button className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            title="Delete user" onClick={() => deleteUser(u.id, u.name)}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* User modal */}
      {selected && (
        <UserModal
          user={selected}
          onClose={() => setSelected(null)}
          onApprove={() => doAction(selected.id, 'approve').then(() => setSelected(s => s ? { ...s, status: 'approved' } : null))}
          onReject={() => doAction(selected.id, 'reject').then(() => setSelected(s => s ? { ...s, status: 'rejected' } : null))}
          onDelete={() => { deleteUser(selected.id, selected.name); setSelected(null) }}
          isAdminView
          currentUserId={user.id}
        />
      )}
    </div>
  )
}
