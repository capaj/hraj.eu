import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { cn } from '~/lib/utils'

interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  fallbackClassName?: string
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  className,
  fallbackClassName,
  ...props
}) => {
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return '??'
  }

  return (
    <Avatar className={cn(className)} {...props}>
      <AvatarImage
        src={user.image || undefined}
        alt={user.name || 'User avatar'}
        className="object-cover"
      />
      <AvatarFallback className={cn("bg-gray-200 text-gray-600 font-bold", fallbackClassName)}>
        {getInitials(user.name, user.email)}
      </AvatarFallback>
    </Avatar>
  )
}
