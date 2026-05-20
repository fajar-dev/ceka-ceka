import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler((event) => {
  const user = getUserFromEvent(event)
  return { user }
})
