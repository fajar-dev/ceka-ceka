export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    const db = getDb()
    
    // Fetch all bills for this user
    const billsStmt = db.prepare(`
      SELECT * FROM bills 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `)
    const bills = billsStmt.all(user.id)

    // For each bill, fetch payment status stats
    const statsStmt = db.prepare(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) as paid_count,
        SUM(amount) as total_amount,
        SUM(CASE WHEN is_paid = 1 THEN amount ELSE 0 END) as paid_amount
      FROM bill_payments 
      WHERE bill_id = ?
    `)

    const richBills = bills.map((bill: any) => {
      const stats = statsStmt.get(bill.id) || { total_count: 0, paid_count: 0, total_amount: 0, paid_amount: 0 }
      
      let parsedRawData = {}
      try {
        parsedRawData = JSON.parse(bill.raw_data)
      } catch (e) {
        console.error('Failed to parse raw_data for bill:', bill.id, e)
      }

      return {
        id: bill.id,
        title: bill.title,
        date: bill.date,
        peopleCount: bill.people_count,
        amount: bill.amount,
        iconType: bill.icon_type,
        iconBg: bill.icon_bg,
        createdAt: bill.created_at,
        rawData: parsedRawData,
        stats: {
          totalCount: stats.total_count || 0,
          paidCount: stats.paid_count || 0,
          totalAmount: stats.total_amount || 0,
          paidAmount: stats.paid_amount || 0,
          progressPercent: stats.total_count > 0 ? Math.round((stats.paid_count / stats.total_count) * 100) : 0
        }
      }
    })

    return { bills: richBills }
  } catch (error) {
    console.error('Failed to fetch bills list:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error'
    })
  }
})
