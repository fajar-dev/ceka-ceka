export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const googleClientId = config.googleClientId || process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = config.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET

  if (!googleClientId || !googleClientSecret) {
    return sendRedirect(event, '/auth/popup?status=error&code=not_configured')
  }

  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const redirectUri = `${protocol}://${getRequestHost(event)}/api/auth/google/callback`

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${googleClientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent('openid profile email')}&` +
    `prompt=select_account&` +
    `state=ceka_auth_state`

  return sendRedirect(event, googleAuthUrl)
})
