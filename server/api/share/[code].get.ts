export default defineEventHandler(async (event) => {
  const code = event.context.params?.code

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Share code is required' })
  }

  try {
    const db = getDb()

    // Find bill by share code (public, no auth needed)
    const bill = db.prepare('SELECT b.*, u.name as owner_name FROM bills b JOIN users u ON b.user_id = u.id WHERE b.share_code = ?').get(code) as any

    if (!bill) {
      throw createError({ statusCode: 404, statusMessage: 'Shared bill not found or sharing is disabled' })
    }

    // Fetch payments
    const payments = db.prepare('SELECT * FROM bill_payments WHERE bill_id = ?').all(bill.id) as any[]

    let parsedRawData: any = {}
    try {
      parsedRawData = JSON.parse(bill.raw_data)
    } catch (e) {
      console.error('Failed to parse raw_data:', e)
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
        ownerName: bill.owner_name,
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
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Failed to fetch shared bill:', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
})
