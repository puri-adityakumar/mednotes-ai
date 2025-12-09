export function HowItWorks() {
    const steps = [
        {
            id: "01",
            title: "Book Appointment",
            description: "Find a doctor and schedule a visit in seconds through our intuitive dashboard.",
        },
        {
            id: "02",
            title: "Consultation",
            description: "Meet your doctor. The session is securely recorded to ensure no detail is missed.",
        },
        {
            id: "03",
            title: "AI Processing",
            description: "Our advanced AI processes the conversation to generate accurate summaries and transcripts.",
        },
        {
            id: "04",
            title: "Review & Chat",
            description: "Access your summaries anytime and ask the AI questions about your consultation.",
        },
    ];

    return (
        <section id="how-it-works" className="py-24 bg-white dark:bg-black">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Streamlined Healthcare Experience
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        From booking to after-care, we've optimized every step of your journey.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting line (desktop) */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <div key={index} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm text-center">
                                <div className="w-12 h-12 bg-blue-600 text-white font-bold text-lg rounded-full flex items-center justify-center mx-auto mb-4 relative z-20 ring-4 ring-white dark:ring-black">
                                    {step.id}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
