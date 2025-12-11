import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './LogoutButton'
import Link from 'next/link'
import { SidebarTrigger } from './ui/sidebar'
import { ThemeToggle } from './ThemeToggle'

export async function AuthNavbar() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Get user profile to show role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single()

    const displayName = profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : user.email?.split('@')[0] || 'User'

    return (
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex items-center gap-4 md:gap-6">
                    
                        <div className="hidden md:flex items-center gap-4">
                            <ThemeToggle />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {displayName}
                            </span>
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

