export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = getDb()

  const code = query.code as string
  if (!code) {
    return sendRedirect(event, '/auth/popup?status=error&code=missing_code')
  }

  const config = useRuntimeConfig()
  const googleClientId = config.googleClientId || process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = config.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const redirectUri = `${protocol}://${getRequestHost(event)}/api/auth/google/callback`

  let userProfile: { id: string; email: string; name: string; avatar: string }

  try {
    const tokenRes = await $fetch<any>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }
    })

    const profile = await $fetch<any>('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenRes.access_token}`
      }
    })

    userProfile = {
      id: `google_${profile.sub}`,
      email: profile.email,
      name: profile.name,
      avatar: profile.picture
    }
  } catch (err) {
    console.error('Google OAuth exchange failed:', err)
    return sendRedirect(event, '/auth/popup?status=error&code=oauth_failed')
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userProfile.id)

    if (existing) {
      db.prepare('UPDATE users SET name = ?, avatar = ? WHERE id = ?')
        .run(userProfile.name, userProfile.avatar, userProfile.id)
    } else {
      db.prepare('INSERT INTO users (id, email, name, avatar, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(userProfile.id, userProfile.email, userProfile.name, userProfile.avatar, new Date().toISOString())
    }

    setUserSession(event, userProfile.id)
    return sendRedirect(event, '/auth/popup?status=success')
  } catch (dbError) {
    console.error('Failed to save user or set session:', dbError)
    return sendRedirect(event, '/auth/popup?status=error&code=db_error')
  }
})
