export function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                            MedNotes AI
                        </span>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            Revolutionizing healthcare with AI-powered consultation summaries, secure record keeping, and intelligent patient-doctor interactions.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold tracking-wider text-gray-900 dark:text-gray-100 uppercase">Product</h3>
                        <ul className="mt-4 space-y-4">
                            <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">Features</a></li>
                            <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">How it Works</a></li>
                            <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">Security</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold tracking-wider text-gray-900 dark:text-gray-100 uppercase">Support</h3>
                        <ul className="mt-4 space-y-4">
                            <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">Help Center</a></li>
                            <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">Privacy Policy</a></li>
                            <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">Contact Us</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8 flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} MedNotes AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
