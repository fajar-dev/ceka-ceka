import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const billId = body.billId

  if (!billId) {
    throw createError({ statusCode: 400, statusMessage: 'billId is required' })
  }

  try {
    const db = getDb()

    // Verify ownership
    const bill = db.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').get(billId, user.id)
    if (!bill) {
      throw createError({ statusCode: 404, statusMessage: 'Bill not found' })
    }

    // Generate new share code
    const newCode = randomBytes(6).toString('hex')
    db.prepare('UPDATE bills SET share_code = ? WHERE id = ?').run(newCode, billId)

    return { success: true, shareCode: newCode }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Failed to reset share code:', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
})
