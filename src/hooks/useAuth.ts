import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/providers/auth'

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false } = options ?? {}
  const navigate = useNavigate()
  const { user, profile, isLoading } = useAuthContext()

  if (redirectOnUnauthenticated && !isLoading && !user) {
    const currentPath = window.location.pathname
    if (currentPath !== '/login') {
      navigate('/login', { replace: true })
    }
  }

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }, [navigate])

  return useMemo(
    () => ({
      user: profile,
      authUser: user,
      isAuthenticated: !!user && !!profile,
      isLoading,
      isAdmin: profile?.role === 'admin',
      logout,
    }),
    [user, profile, isLoading, logout],
  )
}
