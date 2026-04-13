import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'

const AVATAR_COLORS = [
  { bg: '#1E2A4A', color: '#818CF8' },
  { bg: '#1A3326', color: '#34D399' },
  { bg: '#2D2210', color: '#FBBF24' },
  { bg: '#2A1728', color: '#F472B6' },
  { bg: '#1A1E3A', color: '#A78BFA' },
  { bg: '#0F2034', color: '#60A5FA' },
  { bg: '#2A1510', color: '#FB923C' },
  { bg: '#1A2A1A', color: '#86EFAC' },
]

const DEFAULT_USERS = [
  { id: 'JM', name: 'Juan Mendiondo', role: 'Asistente TIC', email: 'juan.mendiondo@northfield.edu.ar', bg: '#1E2A4A', color: '#818CF8' },
  { id: 'JA', name: 'Javier', role: 'Profesor/Referente', email: 'jenriquez@northfield.edu.ar', bg: '#1A3326', color: '#34D399' },
  { id: 'VG', name: 'Vani', role: 'Coordinadora Tec', email: 'vgerstner@northfield.edu.ar', bg: '#2D2210', color: '#FBBF24' },
  { id: 'MLL', name: 'Matias Llanso', role: 'Asistente TIC', email: 'mllanso@northfield.edu.ar', bg: '#1A1E3A', color: '#A78BFA' },
]

const STATUS_COLORS = { pending: '#6B7280', doing: '#FBBF24', done: '#34D399' }
const STATUS_LABELS = { pending: 'Pendiente', doing: 'En proceso', done: 'Hecha' }
const PRIORITY_COLORS = {
  alta: { bg: 'rgba(248,113,113,0.12)', color: '#F87171' },
  media: { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
  baja: { bg: 'rgba(107,114,128,0.14)', color: '#9CA3AF' },
}

function loadUsers() {
  if (typeof window === 'undefined') return DEFAULT_USERS
  try {
    const s = localStorage.getItem('taskflow_users')
    return s ? JSON.parse(s) : DEFAULT_USERS
  } catch { return DEFAULT_USERS }
}
function saveUsers(u) {
  if (typeof window !== 'undefined') localStorage.setItem('taskflow_users', JSON.stringify(u))
}

function Avatar({ id, users, size = 28 }) {
  const u = users.find(u => u.id === id) || { bg: '#1C1C2E', color: '#888', id: id || '?' }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: u.bg, color: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(8, size * 0.32), fontWeight: 500, flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.08)', letterSpacing: '-0.02em' }}>{u.id}</div>
  )
}

function Toast({ msg }) {
  return msg ? <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C1D2E', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: '#ECEAF5', zIndex: 999, animation: 'fadeUp .2s ease', maxWidth: 280 }}>{msg}</div> : null
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 11, color: 'rgba(236,234,245,0.35)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 500, color: color || '#ECEAF5', fontFamily: 'monospace' }}>{value}</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.4 }} />
    </div>
  )
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .5s' }} />
    </div>
  )
}

function TaskCard({ task, users, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isDone = task.status === 'done'
  const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.media
  return (
    <div style={{ background: '#1C1D2E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '10px 11px', opacity: isDone ? 0.55 : 1, position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, flex: 1, lineHeight: 1.4, color: isDone ? 'rgba(236,234,245,0.3)' : '#ECEAF5', textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</span>
        <button onClick={() => onStatusChange(task, task.status === 'done' ? 'pending' : 'done')} style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: 'none', background: isDone ? '#34D399' : 'transparent', outline: isDone ? 'none' : '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
          {isDone && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#0C0D14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: pc.bg, color: pc.color, fontWeight: 500 }}>{task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Avatar id={task.assignee} users={users} size={18} />
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'rgba(236,234,245,0.3)', fontSize: 14, padding: '0 3px', lineHeight: 1, cursor: 'pointer' }}>···</button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 22, background: '#1C1D2E', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 5, zIndex: 50, minWidth: 136 }}>
                {Object.entries(STATUS_LABELS).map(([s, label]) => (
                  <div key={s} onClick={() => { onStatusChange(task, s); setMenuOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: '#ECEAF5' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[s], display: 'inline-block' }} />{label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', background: '#1C1D2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '10px 12px', color: '#ECEAF5', fontSize: 13, outline: 'none' }
const labelStyle = { fontSize: 11, color: 'rgba(236,234,245,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }

export default function Home() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState(DEFAULT_USERS)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState('dash')
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('todos')
  const [newTask, setNewTask] = useState({ title: '', assignee: '', priority: 'media' })
  const [creating, setCreating] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', role: '', email: '', id: '' })

  useEffect(() => { setUsers(loadUsers()) }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  // Auto-detect logged user from email
  useEffect(() => {
    if (session?.user?.email && users.length > 0) {
      const match = users.find(u => u.email?.toLowerCase() === session.user.email.toLowerCase())
      setNewTask(t => ({ ...t, assignee: match ? match.id : users[0]?.id || '' }))
    }
  }, [session, users])

  const fetchTasks = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      const currentUser = users.find(u => u.email?.toLowerCase() === session.user?.email?.toLowerCase())
      const mapped = (data.tasks || []).map(t => {
        if (t.assignee === 'SIN' && currentUser) return { ...t, assignee: currentUser.id }
        return t
      })
      setTasks(mapped)
    } catch { showToast('Error al cargar tareas') }
    finally { setLoading(false) }
  }, [session, users])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleStatusChange = async (task, newStatus) => {
    const prev = [...tasks]
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus, listId: task.listId }) })
      if (!res.ok) throw new Error()
      showToast(`"${task.title.slice(0, 22)}…" → ${STATUS_LABELS[newStatus]}`)
    } catch { setTasks(prev); showToast('Error al actualizar') }
  }

  const handleCreate = async () => {
    if (!newTask.title.trim()) return
    setCreating(true)
    try {
      await fetch('/api/tasks/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask) })
      setNewTask(t => ({ ...t, title: '' }))
      await fetchTasks()
      showToast('Tarea creada en Google Tasks')
    } catch { showToast('Error al crear la tarea') }
    finally { setCreating(false) }
  }

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return
    const initials = newUser.id.trim() || newUser.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3)
    const colorIdx = users.length % AVATAR_COLORS.length
    const added = { id: initials, name: newUser.name.trim(), role: newUser.role.trim() || 'Integrante', email: newUser.email.trim().toLowerCase(), bg: AVATAR_COLORS[colorIdx].bg, color: AVATAR_COLORS[colorIdx].color }
    const updated = [...users, added]
    setUsers(updated); saveUsers(updated)
    setNewUser({ name: '', role: '', email: '', id: '' }); setShowAddUser(false)
    showToast(`${added.name} agregado al equipo`)
  }

  const handleRemoveUser = (uid) => {
    const updated = users.filter(u => u.id !== uid)
    setUsers(updated); saveUsers(updated)
    showToast('Integrante eliminado')
  }

  if (status === 'loading') return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'rgba(236,234,245,0.4)', fontSize: 13, background: '#0C0D14' }}>Cargando...</div>

  if (!session) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, background: '#0C0D14', color: '#ECEAF5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, background: '#818CF8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" /><rect x="9" y="2" width="5" height="5" rx="1.5" fill="rgba(255,255,255,0.5)" /><rect x="2" y="9" width="5" height="5" rx="1.5" fill="rgba(255,255,255,0.5)" /><rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" /></svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>TaskFlow TIC</div>
          <div style={{ fontSize: 12, color: 'rgba(236,234,245,0.4)' }}>Northfield · 2026</div>
        </div>
      </div>
      <button onClick={() => signIn('google')} style={{ background: '#818CF8', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
        Ingresar con Google
      </button>
      <p style={{ fontSize: 11, color: 'rgba(236,234,245,0.25)', maxWidth: 280, textAlign: 'center' }}>Se pedirá permiso para leer y editar tus Google Tasks</p>
    </div>
  )

  const visibleTasks = filter === 'todos' ? tasks : tasks.filter(t => t.assignee === filter)
  const byStatus = { pending: [], doing: [], done: [] }
  visibleTasks.forEach(t => { if (byStatus[t.status]) byStatus[t.status].push(t) })
  const totalDone = tasks.filter(t => t.status === 'done').length
  const totalDoing = tasks.filter(t => t.status === 'doing').length
  const totalPend = tasks.filter(t => t.status === 'pending').length

  const sb = (uid) => {
    const ut = tasks.filter(t => t.assignee === uid)
    const h = ut.filter(t => t.status === 'done').length
    return { pct: ut.length ? Math.round(h / ut.length * 100) : 0, done: h, doing: ut.filter(t => t.status === 'doing').length, pend: ut.filter(t => t.status === 'pending').length, total: ut.length }
  }

  const currentUser = users.find(u => u.email?.toLowerCase() === session.user?.email?.toLowerCase())
  const avatarInitials = currentUser?.id || session.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const navItems = [
    { id: 'dash', label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" fill="currentColor" /><rect x="9" y="2" width="5" height="5" rx="1.5" fill="currentColor" /><rect x="2" y="9" width="5" height="5" rx="1.5" fill="currentColor" /><rect x="9" y="9" width="5" height="5" rx="1.5" fill="currentColor" /></svg> },
    { id: 'kanban', label: 'Tablero', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="3" height="12" rx="1.5" fill="currentColor" /><rect x="7" y="2" width="3" height="8" rx="1.5" fill="currentColor" /><rect x="12" y="2" width="3" height="5" rx="1.5" fill="currentColor" /></svg> },
    { id: 'team', label: 'Equipo', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" fill="currentColor" /><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
    { id: 'create', label: 'Nueva tarea', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0C0D14', color: '#ECEAF5', fontFamily: 'system-ui, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: 52, background: '#13141F', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 4, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, background: '#818CF8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" /><rect x="9" y="2" width="5" height="5" rx="1.5" fill="rgba(255,255,255,0.5)" /><rect x="2" y="9" width="5" height="5" rx="1.5" fill="rgba(255,255,255,0.5)" /><rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" /></svg>
        </div>
        {navItems.map(({ id, icon, label }) => (
          <div key={id} title={label} onClick={() => setActiveView(id)} style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeView === id ? '#ECEAF5' : 'rgba(236,234,245,0.28)', background: activeView === id ? 'rgba(255,255,255,0.08)' : 'transparent', position: 'relative', transition: 'all .15s' }}>
            {activeView === id && <div style={{ position: 'absolute', left: -1, top: '50%', transform: 'translateY(-50%)', width: 2, height: 18, background: '#818CF8', borderRadius: '0 2px 2px 0' }} />}
            {icon}
          </div>
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div onClick={() => fetchTasks()} title="Sincronizar" style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(236,234,245,0.28)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 0 1 11-3M14 8a6 6 0 0 1-11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M13 2v3h-3M3 14v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div onClick={() => signOut()} title={`${session.user?.email} — Cerrar sesión`} style={{ width: 30, height: 30, borderRadius: '50%', background: currentUser?.bg || '#312E81', border: `1.5px solid ${currentUser?.color || '#818CF8'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: currentUser?.color || '#A5B4FC', cursor: 'pointer' }}>
            {avatarInitials}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: '#13141F', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{{ dash: 'Dashboard', kanban: 'Tablero de tareas', team: 'Equipo', create: 'Nueva tarea' }[activeView]}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeView === 'kanban' && (
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1C1D2E', color: 'rgba(236,234,245,0.6)', outline: 'none' }}>
                <option value="todos">Todos</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
            {loading && <span style={{ fontSize: 11, color: 'rgba(236,234,245,0.3)' }}>Sincronizando...</span>}
            {currentUser && <span style={{ fontSize: 11, color: 'rgba(236,234,245,0.4)' }}>{currentUser.name}</span>}
            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'rgba(129,140,248,0.15)', color: '#A5B4FC', fontWeight: 500, border: '1px solid rgba(129,140,248,0.2)' }}>Admin</span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* DASHBOARD */}
          {activeView === 'dash' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                <StatCard label="Total en Google Tasks" value={tasks.length} color="#818CF8" />
                <StatCard label="Pendientes" value={totalPend} color="#6B7280" />
                <StatCard label="En proceso" value={totalDoing} color="#FBBF24" />
                <StatCard label="Completadas" value={totalDone} color="#34D399" />
              </div>
              <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(236,234,245,0.35)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 14 }}>Progreso del equipo</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {users.map(u => {
                    const s = sb(u.id)
                    const fc = s.pct >= 70 ? '#34D399' : s.pct >= 35 ? '#FBBF24' : '#6B7280'
                    return (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar id={u.id} users={users} size={26} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: 'rgba(236,234,245,0.6)' }}>{u.name}</span>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: fc }}>{s.pct}%</span>
                          </div>
                          <ProgressBar pct={s.pct} color={fc} />
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(236,234,245,0.3)', minWidth: 32, textAlign: 'right' }}>{s.done}/{s.total}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(236,234,245,0.35)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Tareas recientes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tasks.slice(0, 8).map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#1C1D2E', borderRadius: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[t.status], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: t.status === 'done' ? 'rgba(236,234,245,0.3)' : '#ECEAF5', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                      <Avatar id={t.assignee} users={users} size={18} />
                    </div>
                  ))}
                  {tasks.length > 8 && <div style={{ fontSize: 11, color: 'rgba(236,234,245,0.3)', textAlign: 'center', paddingTop: 4 }}>+{tasks.length - 8} más en el tablero</div>}
                  {tasks.length === 0 && !loading && <div style={{ fontSize: 12, color: 'rgba(236,234,245,0.25)', textAlign: 'center', padding: '20px 0' }}>No hay tareas todavía. Creá una o sincronizá Google Tasks.</div>}
                </div>
              </div>
            </>
          )}

          {/* KANBAN */}
          {activeView === 'kanban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, flex: 1 }}>
              {[{ k: 'pending', label: 'Pendiente', c: '#6B7280' }, { k: 'doing', label: 'En proceso', c: '#FBBF24' }, { k: 'done', label: 'Hecha', c: '#34D399' }].map(({ k, label, c }) => (
                <div key={k} style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(236,234,245,0.5)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />{label}
                    </span>
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '2px 7px', color: 'rgba(236,234,245,0.35)' }}>{byStatus[k].length}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {byStatus[k].map(t => <TaskCard key={t.id} task={t} users={users} onStatusChange={handleStatusChange} />)}
                    {byStatus[k].length === 0 && <div style={{ fontSize: 11, color: 'rgba(236,234,245,0.2)', textAlign: 'center', paddingTop: 20 }}>Sin tareas</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EQUIPO */}
          {activeView === 'team' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
              {users.map(u => {
                const s = sb(u.id)
                const fc = s.pct >= 70 ? '#34D399' : s.pct >= 35 ? '#FBBF24' : '#6B7280'
                return (
                  <div key={u.id} style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                    <button onClick={() => handleRemoveUser(u.id)} title="Eliminar" style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: 'rgba(236,234,245,0.2)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,234,245,0.2)'}>×</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar id={u.id} users={users} size={36} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(236,234,245,0.35)', marginTop: 1 }}>{u.role}</div>
                        <div style={{ fontSize: 10, color: 'rgba(236,234,245,0.2)', marginTop: 1 }}>{u.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {s.pend > 0 && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(107,114,128,0.15)', color: '#9CA3AF', fontWeight: 500 }}>{s.pend} pendiente{s.pend > 1 ? 's' : ''}</span>}
                      {s.doing > 0 && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.12)', color: '#FBBF24', fontWeight: 500 }}>{s.doing} en proceso</span>}
                      {s.done > 0 && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(52,211,153,0.12)', color: '#34D399', fontWeight: 500 }}>{s.done} hecha{s.done > 1 ? 's' : ''}</span>}
                      {s.total === 0 && <span style={{ fontSize: 11, color: 'rgba(236,234,245,0.25)' }}>sin tareas asignadas</span>}
                    </div>
                    <ProgressBar pct={s.pct} color={fc} />
                  </div>
                )
              })}

              {/* Agregar integrante */}
              {!showAddUser ? (
                <div onClick={() => setShowAddUser(true)} style={{ background: '#13141F', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', minHeight: 120, transition: 'border-color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(236,234,245,0.3)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(236,234,245,0.3)' }}>Agregar integrante</span>
                </div>
              ) : (
                <div style={{ background: '#13141F', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#A5B4FC' }}>Nuevo integrante</div>
                  <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Nombre completo *" style={{ ...inputStyle, padding: '8px 10px', fontSize: 12 }} />
                  <input value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} placeholder="Cargo / Rol" style={{ ...inputStyle, padding: '8px 10px', fontSize: 12 }} />
                  <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@northfield.edu.ar *" style={{ ...inputStyle, padding: '8px 10px', fontSize: 12 }} />
                  <input value={newUser.id} onChange={e => setNewUser({ ...newUser, id: e.target.value.toUpperCase().slice(0, 3) })} placeholder="Iniciales (ej: JM) — opcional" style={{ ...inputStyle, padding: '8px 10px', fontSize: 12 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleAddUser} disabled={!newUser.name.trim() || !newUser.email.trim()} style={{ flex: 1, background: !newUser.name.trim() || !newUser.email.trim() ? 'rgba(129,140,248,0.3)' : '#818CF8', color: 'white', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Agregar</button>
                    <button onClick={() => { setShowAddUser(false); setNewUser({ name: '', role: '', email: '', id: '' }) }} style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(236,234,245,0.5)', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CREAR TAREA */}
          {activeView === 'create' && (
            <div style={{ maxWidth: 480, background: '#13141F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(129,140,248,0.08)', borderRadius: 9, border: '1px solid rgba(129,140,248,0.15)' }}>
                  <Avatar id={currentUser.id} users={users} size={22} />
                  <span style={{ fontSize: 12, color: 'rgba(236,234,245,0.6)' }}>Creando como <strong style={{ color: '#ECEAF5' }}>{currentUser.name}</strong></span>
                </div>
              )}
              <div>
                <label style={labelStyle}>Título</label>
                <input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Nombre de la tarea..." style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Responsable</label>
                  <select value={newTask.assignee} onChange={e => setNewTask({ ...newTask, assignee: e.target.value })} style={inputStyle}>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Prioridad</label>
                  <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} style={inputStyle}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
              <button onClick={handleCreate} disabled={creating || !newTask.title.trim()} style={{ background: creating || !newTask.title.trim() ? 'rgba(129,140,248,0.3)' : '#818CF8', color: 'white', border: 'none', borderRadius: 9, padding: '12px', fontSize: 13, fontWeight: 500, cursor: creating || !newTask.title.trim() ? 'not-allowed' : 'pointer' }}>
                {creating ? 'Creando en Google Tasks...' : 'Crear tarea'}
              </button>
              <p style={{ fontSize: 11, color: 'rgba(236,234,245,0.25)', textAlign: 'center' }}>La tarea se guarda directamente en tu Google Tasks</p>
            </div>
          )}

        </div>
      </div>
      <Toast msg={toast} />
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
