import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-700">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Or{" "}
                            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                                create a new account
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <span className="text-blue-400">ℹ️</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                        Work in Progress
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                        <p>
                                            The authentication system is currently being built. Please check back later.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Link
                                href="/patient"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Demo: Go to Patient Dashboard
                            </Link>
                            <Link
                                href="/doctor"
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600"
                            >
                                Demo: Go to Doctor Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
