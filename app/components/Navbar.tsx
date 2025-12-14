import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './LogoutButton';
import { Logo } from './Logo';

export async function Navbar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let displayName = null;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

        displayName = profile?.first_name
            ? `${profile.first_name} ${profile.last_name || ''}`.trim()
            : user.email?.split('@')[0] || 'User';
    }

    return (
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Logo size="md" href="/" />
                    </div>

                    {/* Center: Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
                        <Link href="#how-it-works" className="text-sm font-medium hover:text-blue-600 transition-colors">
                            How it Works
                        </Link>
                        <Link href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors">
                            Features
                        </Link>
                    </div>

                    {/* Right: Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-200 uppercase">
                                    {displayName}
                                </span>
                                <ThemeToggle />
                                <LogoutButton />
                                <Link
                                    href="/patient"
                                    className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Dashboard
                                </Link>
                            </div>
                        ) : (
                            <>
                                <ThemeToggle />
                                <Link
                                    href="/login"
                                    className="text-sm font-medium hover:text-blue-600 transition-colors"
                                >
                                    Doctor
                                </Link>
                                <Link
                                    href="/patient"
                                    className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Book Appointment
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle />
                        <button className="p-2 rounded-md text-gray-700 hover:text-blue-600">
                            <span className="sr-only">Open menu</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

