export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bill ID is required'
    })
  }

  try {
    const db = getDb()
    
    // Check ownership first
    const verifyStmt = db.prepare('SELECT id FROM bills WHERE id = ? AND user_id = ?')
    const bill = verifyStmt.get(id, user.id)

    if (!bill) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bill not found or access denied'
      })
    }

    // Delete bill
    const deleteBillStmt = db.prepare('DELETE FROM bills WHERE id = ?')
    deleteBillStmt.run(id)

    // Delete payments as well
    const deletePaymentsStmt = db.prepare('DELETE FROM bill_payments WHERE bill_id = ?')
    deletePaymentsStmt.run(id)

    return { success: true }
  } catch (error) {
    console.error('Failed to delete bill:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error'
    })
  }
})
