import { getSheet } from '../../../lib/sheets'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'No autorizado' })

  const { id } = req.query
  const { status } = req.body

  try {
    const sheet = await getSheet()
    const rows = await sheet.getRows()
    const row = rows.find(r => r.get('id') === id)
    if (!row) return res.status(404).json({ error: 'Tarea no encontrada' })
    row.set('status', status)
    row.set('updatedAt', new Date().toISOString())
    await row.save()
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar' })
  }
}