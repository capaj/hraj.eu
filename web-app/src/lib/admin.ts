export const ADMIN_EMAILS = ['capajj@gmail.com']

export function isAdminEmail(email: string | null | undefined) {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase())
}
