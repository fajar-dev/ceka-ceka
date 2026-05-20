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
      statusMessage: 'Friend ID is required'
    })
  }

  const body = await readBody(event)
  const name = body.name?.trim()
  const phone = body.phone?.trim() || null
  const email = body.email?.trim() || null

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required'
    })
  }

  try {
    const db = getDb()

    // Verify ownership of the friend record
    const verifyStmt = db.prepare('SELECT user_id FROM friends WHERE id = ?')
    const record = verifyStmt.get(id)
    if (!record) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Friend not found'
      })
    }
    if (record.user_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden'
      })
    }

    const updateStmt = db.prepare(`
      UPDATE friends 
      SET name = ?, phone = ?, email = ?
      WHERE id = ?
    `)
    updateStmt.run(name, phone, email, id)

    const getStmt = db.prepare('SELECT * FROM friends WHERE id = ?')
    const friend = getStmt.get(id)
    return { friend }
  } catch (error: any) {
    console.error('Failed to update friend:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Database error'
    })
  }
})
