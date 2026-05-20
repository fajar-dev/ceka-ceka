import type { H3Event } from 'h3'
import { randomBytes } from 'crypto'

export const SESSION_COOKIE_NAME = 'ceka_session'

export const getUserFromEvent = (event: H3Event) => {
  const token = getCookie(event, SESSION_COOKIE_NAME)
  if (!token) return null

  try {
    const db = getDb()
    const row = db.prepare(`
      SELECT u.* FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = ?
    `).get(token)
    return row || null
  } catch (error) {
    console.error('Failed to get user from session:', error)
    return null
  }
}

export const setUserSession = (event: H3Event, userId: string) => {
  const token = randomBytes(32).toString('hex')
  const db = getDb()
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)')
    .run(token, userId, new Date().toISOString())

  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  })
}

export const clearUserSession = (event: H3Event) => {
  const token = getCookie(event, SESSION_COOKIE_NAME)
  if (token) {
    try {
      getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
    } catch {}
  }
  deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
}
