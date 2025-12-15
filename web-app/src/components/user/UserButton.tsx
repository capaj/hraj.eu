'use client'
import {
  ChevronsUpDown,
  LogInIcon,
  LogOutIcon,
  PlusCircleIcon,
  SettingsIcon,
  UserRoundPlus,
  Building2
} from 'lucide-react'
import {
  type ComponentProps,
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Button } from '../ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import { authClient } from '../../lib/auth-client'
import { Link } from '@tanstack/react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export interface UserButtonProps {
  className?: string
  align?: 'center' | 'start' | 'end'

  trigger?: ReactNode
  disableDefaultLinks?: boolean
  size?: 'icon' | 'sm' | 'md' | 'lg'
}

interface UserViewProps {
  user?: {
    name?: string
    email?: string
    image?: string | null
  } | null
  isPending?: boolean
  size?: 'icon' | 'sm' | 'md' | 'lg'
}

const UserView = ({ user, isPending, size }: UserViewProps) => {
  if (isPending) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 animate-pulse rounded-full bg-gray-300" />
        <div className="space-y-1">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-300" />
          <div className="h-2 w-16 animate-pulse rounded bg-gray-300" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <div className="text-muted-foreground text-xs">Account</div>
  }

  return (
    <div className="flex items-center space-x-2">
      <UserAvatar user={user} size="sm" />
      <div className="flex flex-col text-left">
        <span className="text-sm font-medium">{user.name}</span>
        <span className="text-xs text-gray-500">{user.email}</span>
      </div>
    </div>
  )
}

const UserAvatar = ({
  user,
  isPending = false,
  className,
  size = 'md',
  ...props
}: {
  user?: {
    name?: string
    image?: string | null
  } | null
  isPending?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  [key: string]: any
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  if (isPending) {
    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback>
          <div className="h-full w-full animate-pulse bg-gray-300" />
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)} {...props}>
      <AvatarImage
        src={user?.image || undefined}
        alt={user?.name || 'User avatar'}
      />
      <AvatarFallback>
        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
      </AvatarFallback>
    </Avatar>
  )
}

export function UserButton({
  className,
  align,
  trigger,
  disableDefaultLinks,
  size = 'md'
}: UserButtonProps) {
  const { data: sessionData, isPending: sessionPending } =
    authClient.useSession()
  const user = sessionData?.user
  const [activeSessionPending, setActiveSessionPending] = useState(false)

  const isPending = sessionPending || activeSessionPending

  const handleSignOut = useCallback(async () => {
    setActiveSessionPending(true)
    try {
      await authClient.signOut()
      // TODO double check session is cleared. Seems like it may not be cleared.
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setActiveSessionPending(false)
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className={cn(size === 'icon' && 'rounded-full')}
      >
        {trigger ||
          (size === 'icon' ? (
            <Button size="sm" className="p-1 rounded-full" variant="ghost">
              {user ? (
                <UserAvatar
                  key={user?.image}
                  isPending={isPending}
                  className={className}
                  user={user}
                  size="lg"
                  aria-label="Account"
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger>
                    <UserRoundPlus />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sign in to your account</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </Button>
          ) : (
            <Button className={cn('!p-2 h-fit', className)} size="md">
              <UserView size={size} user={user} isPending={isPending} />

              <ChevronsUpDown className="ml-auto" />
            </Button>
          ))}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 max-w-64"
        align={align}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2 cursor-pointer">
          {user || isPending ? (
            <UserView user={user} isPending={isPending} />
          ) : (
            <div className="-my-1 text-muted-foreground text-xs">Account</div>
          )}
        </div>

        <DropdownMenuSeparator />

        {!user ? (
          <>
            <Link to="/auth/$pathname" params={{ pathname: 'sign-in' }}>
              <DropdownMenuItem>
                <LogInIcon />
                Sign In
              </DropdownMenuItem>
            </Link>

            <Link to="/auth/$pathname" params={{ pathname: 'sign-up' }}>
              <DropdownMenuItem>
                <UserRoundPlus />
                Sign Up
              </DropdownMenuItem>
            </Link>
          </>
        ) : (
          <>
            {!disableDefaultLinks && (
              <>
                <Link to="/manage-venues" className="cursor-pointer">
                  <DropdownMenuItem>
                    <Building2 />
                    Manage Venues
                  </DropdownMenuItem>
                </Link>
                <Link to="/user-profile" className="cursor-pointer">
                  <DropdownMenuItem>
                    <SettingsIcon />
                    Settings
                  </DropdownMenuItem>
                </Link>
              </>
            )}

            <DropdownMenuItem onClick={handleSignOut}>
              <LogOutIcon />
              Sign Out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
