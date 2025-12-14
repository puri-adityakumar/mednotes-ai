import { Logo } from './Logo';

export function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <Logo size="md" href={undefined} />
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            Revolutionizing healthcare with AI-powered consultation summaries, secure record keeping, and intelligent patient-doctor interactions.
                        </p>
                        <div className="mt-6 flex items-center space-x-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Developed by:</span>
                            <div className="flex -space-x-2">
                                <a href="https://github.com/puri-adityakumar" target="_blank" rel="noreferrer" className="relative hover:z-10 transition-transform hover:scale-110">
                                    <img
                                        src="https://github.com/puri-adityakumar.png"
                                        alt="puri-adityakumar"
                                        className="h-8 w-8 rounded-full border-2 border-white dark:border-zinc-900"
                                    />
                                </a>
                                <a href="https://github.com/shekhar9837" target="_blank" rel="noreferrer" className="relative hover:z-10 transition-transform hover:scale-110">
                                    <img
                                        src="https://github.com/shekhar9837.png"
                                        alt="shekhar9837"
                                        className="h-8 w-8 rounded-full border-2 border-white dark:border-zinc-900"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div>
                        {/* Spacer or additional column if needed, currently leaving empty or could merge with Support */}
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold tracking-wider text-gray-900 dark:text-gray-100 uppercase">Contribute</h3>
                        <ul className="mt-4 space-y-4">
                            <li><a href="https://github.com/puri-adityakumar/mednotes-ai" target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-2">
                                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-current"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .319.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                GitHub Repo
                            </a></li>
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
