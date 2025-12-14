import { CalendarCheck, Stethoscope, Wand2, FileText } from "lucide-react";

export function HowItWorks() {
    const steps = [
        {
            id: 1,
            title: "Book Appointment",
            description: "Find a doctor and schedule a visit in seconds through our intuitive dashboard.",
            icon: CalendarCheck,
        },
        {
            id: 2,
            title: "Consultation",
            description: "Meet your doctor. The session is securely recorded to ensure no detail is missed.",
            icon: Stethoscope,
        },
        {
            id: 3,
            title: "AI Processing",
            description: "Our advanced AI processes the conversation to generate accurate summaries and transcripts.",
            icon: Wand2,
        },
        {
            id: 4,
            title: "Review & Chat",
            description: "Access your summaries anytime and ask the AI questions about your consultation.",
            icon: FileText,
        },
    ];

    return (
        <section id="how-it-works" className="py-24 bg-white dark:bg-black">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Streamlined Healthcare Experience
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        From booking to after-care, we've optimized every step of your journey.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting line (desktop) */}
                    <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 dark:bg-zinc-800 -translate-y-1/2 z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm text-center group hover:shadow-md transition-all duration-300">
                                    <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 relative z-20 border-[8px] border-white dark:border-black shadow-sm group-hover:scale-110 transition-transform duration-300">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white shadow-inner">
                                            <Icon className="w-7 h-7" strokeWidth={2} />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border-2 border-green-500 shadow-sm text-xs font-bold text-gray-900 dark:text-white">
                                            {step.id}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
