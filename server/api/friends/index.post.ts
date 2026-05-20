
export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
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
    const id = `friend_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM friends WHERE user_id = ?')
    const friendCount = countStmt.get(user.id).count
    const avatarBg = `avatar-bg-${friendCount % 4}`

    const insertStmt = db.prepare(`
      INSERT INTO friends (id, user_id, name, phone, email, avatar_bg, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertStmt.run(
      id,
      user.id,
      name,
      phone,
      email,
      avatarBg,
      new Date().toISOString()
    )

    const getStmt = db.prepare('SELECT * FROM friends WHERE id = ?')
    const friend = getStmt.get(id)
    return { friend }
  } catch (error) {
    console.error('Failed to create friend:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error'
    })
  }
})
