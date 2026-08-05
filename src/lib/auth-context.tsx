import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { UserRole } from './database.types'

interface AuthUser {
  id: string
  email: string
  role: UserRole
}

interface SignUpData {
  firstName: string
  lastName: string
  phone: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, role: UserRole, data?: SignUpData) => Promise<{ error: Error | null }>
  signIn: (
    email: string,
    password: string,
    expectedRole?: UserRole
  ) => Promise<{
    error: Error | null
    wrongRole?: UserRole
    correctLoginPath?: string
  }>
  signOut: () => Promise<void>
  updateRole: (role: UserRole) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        const next = {
          id: data.id,
          email: data.email,
          role: data.role,
        }
        setUser(next)
        return next
      }
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, role: UserRole, signupData?: SignUpData) => {
    try {
      // Sign up with Supabase Auth - pass all signup data in metadata so the trigger
      // can create user, profile, and address atomically (avoids RLS/timing issues
      // with post-signup updates)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            firstName: signupData?.firstName || null,
            lastName: signupData?.lastName || null,
            phone: signupData?.phone || null,
            streetAddress: signupData?.streetAddress || null,
            city: signupData?.city || null,
            state: signupData?.state || null,
            zipCode: signupData?.zipCode || null,
          }
        }
      })

      if (error) throw error

      // The trigger (handle_new_user) now does all the heavy lifting: creates public.users,
      // customer_profiles (or provider_profiles), and the default address (for customers)
      // atomically. No need for post-signup update logic here.

      if (data.user) {
        setUser({
          id: data.user.id,
          email,
          role,
        })
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signIn = async (email: string, password: string, expectedRole?: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // If the calling page specified which role this user should have
      // (e.g. customer login page passes 'customer'), check the role BEFORE
      // setting any state. This way the page doesn't re-render with a
      // logged-in user state, and we can cleanly sign them out without
      // the error message getting lost.
      if (data.user && expectedRole) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profile && profile.role !== expectedRole) {
          // Wrong role — sign out before setting any state
          await supabase.auth.signOut()
          const wrongRole = profile.role
          const wrongLabel = wrongRole === 'provider' ? 'lawn pro' : wrongRole === 'admin' ? 'admin' : 'customer'
          const expectedLabel = expectedRole === 'provider' ? 'lawn pro' : expectedRole
          return {
            error: new Error(
              `This is a ${wrongLabel} account, not a ${expectedLabel} account.`
            ),
            wrongRole,
            correctLoginPath:
              wrongRole === 'provider' ? '/login/pro' :
              wrongRole === 'admin' ? '/admin/users' :
              '/login/customer',
          }
        }
      }

      // Role matches (or no expectedRole), proceed to set state
      if (data.user) {
        await fetchUserProfile(data.user.id)
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const updateRole = async (role: UserRole) => {
    try {
      if (!user) return { error: new Error('Not authenticated') }

      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, role })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
