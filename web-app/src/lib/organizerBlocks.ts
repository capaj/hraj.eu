// Keep the denial message shared by the server and the route error boundary.
export const ORGANIZER_BLOCKED_MESSAGE = 'The organizer has blocked you.'

export type BlockableUser = {
  id: string
  name: string
  image?: string | null
}
