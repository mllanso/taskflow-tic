import { getSheet } from '../../../lib/sheets'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'No autorizado' })

  try {
    const sheet = await getSheet()
    const rows = await sheet.getRows()
    const tasks = rows.map(row => ({
      id: row.get('id'),
      title: row.get('title'),
      assignee: row.get('assignee'),
      priority: row.get('priority'),
      status: row.get('status'),
      createdAt: row.get('createdAt'),
      listId: 'sheets',
    }))
    res.json({ tasks })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener tareas' })
  }
}