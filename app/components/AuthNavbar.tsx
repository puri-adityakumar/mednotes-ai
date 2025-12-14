'use client'

import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from './LogoutButton'
import { ThemeToggle } from './ThemeToggle'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Logo } from './Logo'

interface Profile {
    role: string
    first_name: string | null
    last_name: string | null
}

export function AuthNavbar() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const pathname = usePathname()
    const router = useRouter()

    const isBookAppointmentPage = pathname === '/patient/book-appointment'

    useEffect(() => {
        const supabase = createClient()

        const fetchUser = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (user) {
                    setUser(user)

                    // Get user profile to show role
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('role, first_name, last_name')
                        .eq('id', user.id)
                        .single()

                    if (profileData) {
                        setProfile(profileData)
                    }
                }
            } catch (error) {
                console.error('Error fetching user:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user)
                // Fetch profile when auth state changes
                supabase
                    .from('profiles')
                    .select('role, first_name, last_name')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data }) => {
                        if (data) {
                            setProfile(data)
                        }
                    })
            } else {
                setUser(null)
                setProfile(null)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    if (loading) {
        return null
    }

    if (!user) {
        return null
    }

    const displayName = profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : user.email?.split('@')[0] || 'User'

    return (
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className={`flex items-center justify-between gap-4 ${isBookAppointmentPage ? 'h-auto py-4' : 'h-16'}`}>
                    {/* Left side - Back button and title (only on book appointment page) */}
                    {isBookAppointmentPage ? (
                        <div className="flex items-center gap-4 flex-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push('/patient')}
                                className="h-9 w-9"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Book Appointment</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Chat with our AI assistant to schedule your appointment</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center">
                            <Logo size="md" href="/" />
                        </div>
                    )}

                    {/* Right side - Theme toggle, user name, logout */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="hidden md:flex items-center gap-4">
                            <span className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-200 uppercase">
                                {displayName}
                            </span>
                            <ThemeToggle />
                            <LogoutButton />
                        </div>
                        <div className="md:hidden flex items-center gap-2">
                            <ThemeToggle />
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

