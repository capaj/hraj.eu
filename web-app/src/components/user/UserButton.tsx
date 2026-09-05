'use client'
import {
  ChevronsUpDown,
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
  UserRoundPlus,
  Building2,
  Users,
  Shield
} from 'lucide-react'
import {
  type ReactNode,
  useCallback,
  useState
} from 'react'
import { Button } from '../ui/Button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { UserAvatar } from './UserAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import {
  authClient,
  authSessionQueryKey,
  useAuthSession
} from '../../lib/auth-client'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { isAdminEmail } from '../../lib/admin'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { i18n } from '../../lib/i18n'

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

const UserView = ({ user, isPending }: UserViewProps) => {
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
    return (
      <div className="text-muted-foreground text-xs">
        <Trans>Account</Trans>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <UserAvatar user={user} className="h-6 w-6" />
      <div className="flex flex-col text-left">
        <span className="text-sm font-medium">{user.name}</span>
        <span className="text-xs text-gray-500">{user.email}</span>
      </div>
    </div>
  )
}

export function UserButton({
  className,
  align,
  trigger,
  disableDefaultLinks,
  size = 'md'
}: UserButtonProps) {
  const { data: sessionData, isPending: sessionPending } = useAuthSession()
  const queryClient = useQueryClient()
  const user = sessionData?.user
  const [activeSessionPending, setActiveSessionPending] = useState(false)

  const isPending = sessionPending || activeSessionPending

  const iconTriggerContent = () => {
    if (isPending) {
      return (
        <Avatar className={cn('h-12 w-12', className)}>
          <AvatarFallback className="bg-transparent p-0">
            <div className="h-full w-full animate-pulse bg-gray-300 rounded-full" />
          </AvatarFallback>
        </Avatar>
      )
    }

    if (user) {
      return (
        <UserAvatar
          key={user?.image}
          className={cn('h-12 w-12', className)}
          user={user}
          aria-label={i18n._(msg`Account`)}
        />
      )
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <UserRoundPlus />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            <Trans>Sign in to your account</Trans>
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  const handleSignOut = useCallback(async () => {
    setActiveSessionPending(true)
    try {
      await authClient.signOut()
      await queryClient.refetchQueries({ queryKey: authSessionQueryKey })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setActiveSessionPending(false)
    }
  }, [queryClient])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className={cn(size === 'icon' && 'rounded-full')}
      >
        {trigger ||
          (size === 'icon' ? (
            <Button size="sm" className="p-1 rounded-full" variant="ghost">
              {iconTriggerContent()}
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
            <div className="-my-1 text-muted-foreground text-xs">
              <Trans>Account</Trans>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {!user ? (
          <>
            <Link to="/auth/$pathname" params={{ pathname: 'sign-in' }}>
              <DropdownMenuItem>
                <LogInIcon />
                <Trans>Sign In</Trans>
              </DropdownMenuItem>
            </Link>

            <Link to="/auth/$pathname" params={{ pathname: 'sign-up' }}>
              <DropdownMenuItem>
                <UserRoundPlus />
                <Trans>Sign Up</Trans>
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
                    <Trans>Manage Venues</Trans>
                  </DropdownMenuItem>
                </Link>
                <Link to="/manage-core-groups" className="cursor-pointer">
                  <DropdownMenuItem>
                    <Users />
                    <Trans>Manage Core Groups</Trans>
                  </DropdownMenuItem>
                </Link>
                {isAdminEmail(user.email) && (
                  <Link to="/admin/event-bans" className="cursor-pointer">
                    <DropdownMenuItem>
                      <Shield />
                      <Trans>Manage attendance bans</Trans>
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link to="/user-profile" className="cursor-pointer">
                  <DropdownMenuItem>
                    <SettingsIcon />
                    <Trans>Settings</Trans>
                  </DropdownMenuItem>
                </Link>
              </>
            )}

            <DropdownMenuItem onClick={handleSignOut}>
              <LogOutIcon />
              <Trans>Sign Out</Trans>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
