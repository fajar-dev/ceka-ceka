export default defineEventHandler((event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM friends WHERE user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC')
    const friends = stmt.all(user.id)
    return { friends }
  } catch (error) {
    console.error('Failed to get friends:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error'
    })
  }
})
