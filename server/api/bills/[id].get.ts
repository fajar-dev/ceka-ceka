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
    
    // Fetch bill
    const billStmt = db.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?')
    const bill = billStmt.get(id, user.id)

    if (!bill) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bill not found'
      })
    }

    // Fetch payments checklist list
    const paymentsStmt = db.prepare('SELECT * FROM bill_payments WHERE bill_id = ?')
    const payments = paymentsStmt.all(id)

    let parsedRawData = {}
    try {
      parsedRawData = JSON.parse(bill.raw_data)
    } catch (e) {
      console.error('Failed to parse raw_data for bill:', bill.id, e)
    }

    const totalCount = payments.length
    const paidCount = payments.filter((p: any) => p.is_paid === 1).length
    const progressPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0

    return {
      bill: {
        id: bill.id,
        title: bill.title,
        date: bill.date,
        peopleCount: bill.people_count,
        amount: bill.amount,
        iconType: bill.icon_type,
        iconBg: bill.icon_bg,
        shareCode: bill.share_code || null,
        createdAt: bill.created_at,
        rawData: parsedRawData
      },
      payments: payments.map((p: any) => ({
        id: p.id,
        friendId: p.friend_id,
        name: p.name,
        amount: p.amount,
        isPaid: p.is_paid === 1,
        paidAt: p.paid_at
      })),
      stats: {
        totalCount,
        paidCount,
        progressPercent
      }
    }
  } catch (error) {
    console.error('Failed to fetch bill details:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error'
    })
  }
})
