export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const id = body.id ? String(body.id) : `bill_${Date.now()}`
  const title = body.title?.trim() || 'Tagihan Tanpa Nama'
  const date = body.date || new Date().toISOString().split('T')[0]
  const peopleCount = parseInt(body.peopleCount) || 1
  const amount = parseFloat(body.amount) || 0
  const iconType = body.iconType || 'file'
  const iconBg = body.iconBg || 'icon-bg-0'
  const rawData = JSON.stringify(body.rawData || {})
  const shares = body.shares || []

  try {
    const db = getDb()
    
    // Insert into bills
    const insertBillStmt = db.prepare(`
      INSERT INTO bills (id, user_id, title, date, people_count, amount, icon_type, icon_bg, raw_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    insertBillStmt.run(
      id,
      user.id,
      title,
      date,
      peopleCount,
      amount,
      iconType,
      iconBg,
      rawData,
      new Date().toISOString()
    )

    // Insert each friend share into bill_payments
    const insertPaymentStmt = db.prepare(`
      INSERT INTO bill_payments (id, bill_id, friend_id, name, amount, is_paid, paid_at)
      VALUES (?, ?, ?, ?, ?, 0, NULL)
    `)

    shares.forEach((share: any) => {
      const paymentId = `${id}_${share.friendId}`
      insertPaymentStmt.run(
        paymentId,
        id,
        String(share.friendId),
        share.name,
        parseFloat(share.amount) || 0
      )
    })

    return { success: true, billId: id }
  } catch (error) {
    console.error('Failed to create bill:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error'
    })
  }
})
