export const fioConnectionQueryKey = (userId: string | undefined) =>
  ['fio-connection', userId] as const
