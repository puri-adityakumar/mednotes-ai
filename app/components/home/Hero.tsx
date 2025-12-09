import Link from "next/link";

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-20 pb-32 md:pt-32">
            {/* Background gradients */}
            <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl" aria-hidden="true">
                <div
                    className="aspect-[1155/678] w-[68rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20"
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-8 flex justify-center">
                        <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-900/10 dark:ring-gray-100/10 hover:ring-gray-900/20">
                            Announcing our new AI features. <Link href="#" className="font-semibold text-blue-600"><span className="absolute inset-0" aria-hidden="true" />Read more <span aria-hidden="true">&rarr;</span></Link>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                        Healthcare Reimagined with <span className="text-blue-600">AI Intelligence</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                        Securely record consultations, receive instant AI summaries, and chat with your medical history. The future of doctor-patient interaction is here.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            href="/dashboard/patient/appointments/new"
                            className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200"
                        >
                            Book an Appointment
                        </Link>
                        <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                            Learn more <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
