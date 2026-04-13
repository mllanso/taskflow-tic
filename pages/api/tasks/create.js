import { getSheet } from '../../../lib/sheets'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'No autorizado' })

  const { title, assignee, priority } = req.body
  if (!title) return res.status(400).json({ error: 'Falta el título' })

  try {
    const sheet = await getSheet()
    const id = 'task_' + Date.now()
    await sheet.addRow({
      id,
      title,
      assignee: assignee || 'SIN',
      priority: priority || 'media',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    res.json({ ok: true, id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear tarea' })
  }
}