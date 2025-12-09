import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-700">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                            Create a new account
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{" "}
                            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                        Under Construction
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                        <p>
                                            Patient registration flow is coming soon.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
