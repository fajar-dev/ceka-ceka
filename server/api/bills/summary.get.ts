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

    // Get all bills with their payment stats
    const stmt = db.prepare(`
      SELECT 
        b.id,
        b.amount as bill_amount,
        COUNT(bp.id) as total_payments,
        SUM(CASE WHEN bp.is_paid = 1 THEN 1 ELSE 0 END) as paid_payments,
        SUM(CASE WHEN bp.is_paid = 0 THEN bp.amount ELSE 0 END) as unpaid_amount
      FROM bills b
      LEFT JOIN bill_payments bp ON bp.bill_id = b.id
      WHERE b.user_id = ?
      GROUP BY b.id
    `)
    const bills = stmt.all(user.id) as any[]

    // A bill is "unpaid" if it has at least 1 unpaid payment
    const unpaidBills = bills.filter((b: any) => b.paid_payments < b.total_payments)
    const totalUnpaidAmount = Math.round(unpaidBills.reduce((sum: number, b: any) => sum + (b.unpaid_amount || 0), 0))

    return {
      unpaidAmount: totalUnpaidAmount,
      unpaidBillCount: unpaidBills.length,
      totalBillCount: bills.length
    }
  } catch (error) {
    console.error('Failed to fetch bill summary:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error'
    })
  }
})
