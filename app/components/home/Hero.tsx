import Link from "next/link";

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 flex items-center justify-center min-h-[80vh]">
            {/* Background gradients */}
            <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl opacity-30" aria-hidden="true">
                <div
                    className="aspect-[1155/678] w-[68rem] bg-gradient-to-tr from-blue-100 to-teal-100 dark:from-blue-900/20 dark:to-teal-900/20"
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <div className="mx-auto max-w-4xl">
                    <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
                        The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Medical Intelligence</span> is Here
                    </h1>

                    <p className="mt-6 text-xl md:text-2xl leading-relaxed text-gray-600 dark:text-gray-300 font-light max-w-2xl mx-auto">
                        Seamlessly connect with your healthcare provider.
                        AI-driven insights for smarter, secure, and efficient consultations.
                    </p>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/patient"
                            className="w-full sm:w-auto rounded-full bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-4 text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-w-[200px]"
                        >
                            Book Appointment
                        </Link>
                        <Link
                            href="#features"
                            className="w-full sm:w-auto rounded-full border border-gray-300 dark:border-gray-700 px-8 py-4 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors min-w-[200px]"
                        >
                            Explore Features
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
