export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const paymentId = body.paymentId
  const isPaid = body.isPaid === true ? 1 : 0
  const paidAt = isPaid === 1 ? new Date().toISOString() : null

  if (!paymentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'paymentId is required'
    })
  }

  try {
    const db = getDb()
    
    // Security check: Verify that this payment row belongs to a bill owned by the user
    const verifyStmt = db.prepare(`
      SELECT bp.id, b.user_id FROM bill_payments bp
      JOIN bills b ON bp.bill_id = b.id
      WHERE bp.id = ?
    `)
    const paymentRow = verifyStmt.get(paymentId)

    if (!paymentRow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Payment record not found'
      })
    }

    if (paymentRow.user_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden'
      })
    }

    // Update payment record in database
    const updateStmt = db.prepare(`
      UPDATE bill_payments 
      SET is_paid = ?, paid_at = ?
      WHERE id = ?
    `)
    updateStmt.run(isPaid, paidAt, paymentId)

    return { success: true, isPaid: isPaid === 1 }
  } catch (error) {
    console.error('Failed to toggle payment status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error'
    })
  }
})
