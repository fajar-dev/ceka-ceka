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

    const accessToken = tokenRes.access_token

    if (query.state === 'ceka_contacts_sync') {
      const user = getUserFromEvent(event)
      if (!user) {
        return sendRedirect(event, '/auth/popup?status=error&code=unauthorized')
      }

      // Fetch Google Profile for the synced account to display it to the user
      let googleEmail = ''
      try {
        const profile = await $fetch<any>('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
        googleEmail = profile.email || ''
      } catch (profileErr) {
        console.error('Failed to fetch google userinfo during sync:', profileErr)
      }

      if (googleEmail) {
        db.prepare(`
          UPDATE users 
          SET google_contacts_email = ?, google_contacts_synced_at = ? 
          WHERE id = ?
        `).run(googleEmail, new Date().toISOString(), user.id)
      }

      // Start background sync
      const syncPromise = (async () => {
        try {
          console.log('Background sync starting for user:', user.id)
          let nextPageToken = ''
          let contactsList: any[] = []

          do {
            const url: string = `https://people.googleapis.com/v1/people/me/connections?` +
              `personFields=names,phoneNumbers,emailAddresses&` +
              `pageSize=1000` +
              (nextPageToken ? `&pageToken=${nextPageToken}` : '')

            const res = await $fetch<any>(url, {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            })

            if (res.connections) {
              contactsList.push(...res.connections)
            }
            nextPageToken = res.nextPageToken || ''
          } while (nextPageToken)

          console.log(`Fetched ${contactsList.length} connections from Google People API.`)

          const dbInstance = getDb()
          
          let addedCount = 0
          let updatedCount = 0

          for (const person of contactsList) {
            const name = person.names?.[0]?.displayName || person.emailAddresses?.[0]?.value || ''
            if (!name) continue

            const email = person.emailAddresses?.[0]?.value || null
            const phone = person.phoneNumbers?.[0]?.value || null

            // Look for existing friend by email or phone or name for this user_id
            let existingFriend: any = null
            if (email) {
              existingFriend = dbInstance.prepare('SELECT * FROM friends WHERE user_id = ? AND email = ?').get(user.id, email)
            }
            if (!existingFriend && phone) {
              existingFriend = dbInstance.prepare('SELECT * FROM friends WHERE user_id = ? AND phone = ?').get(user.id, phone)
            }
            if (!existingFriend) {
              existingFriend = dbInstance.prepare('SELECT * FROM friends WHERE user_id = ? AND name = ?').get(user.id, name)
            }

            if (existingFriend) {
              // Update existing friend (and make sure is_deleted is 0)
              dbInstance.prepare(`
                UPDATE friends 
                SET name = ?, phone = ?, email = ?, is_deleted = 0 
                WHERE id = ?
              `).run(name, phone || existingFriend.phone, email || existingFriend.email, existingFriend.id)
              updatedCount++
            } else {
              // Insert new friend
              const newFriendId = `friend_google_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
              const avatarBg = `avatar-bg-${(addedCount + updatedCount) % 4}`
              dbInstance.prepare(`
                INSERT INTO friends (id, user_id, name, phone, email, avatar_bg, is_deleted, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?)
              `).run(newFriendId, user.id, name, phone, email, avatarBg, new Date().toISOString())
              addedCount++
            }
          }

          console.log(`Sync completed: ${addedCount} added, ${updatedCount} updated.`)
        } catch (syncErr) {
          console.error('Background sync failed:', syncErr)
        }
      })()

      if (event.context.waitUntil) {
        event.context.waitUntil(syncPromise)
      }

      return sendRedirect(event, '/auth/popup?status=success&type=contacts')
    }

    // Standard Login flow
    const profile = await $fetch<any>('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
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
