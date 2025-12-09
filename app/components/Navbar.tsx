import Link from 'next/link';

export function Navbar() {
    return (
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                            MedNotes AI
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="#how-it-works" className="text-sm font-medium hover:text-blue-600 transition-colors">
                            How it Works
                        </Link>
                        <Link href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors">
                            Features
                        </Link>
                        <Link href="/login" className="text-sm font-medium hover:text-blue-600 transition-colors">
                            Sign In
                        </Link>
                        <Link
                            href="/dashboard/patient/appointments/new"
                            className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Book Appointment
                        </Link>
                    </div>
                    {/* Mobile menu button (placeholder) */}
                    <div className="md:hidden">
                        <button className="p-2 rounded-md text-gray-700 hover:text-blue-600">
                            <span className="sr-only">Open menu</span>
                            {/* Simple Hamburger Icon */}
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
