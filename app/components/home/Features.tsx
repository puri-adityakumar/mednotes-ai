export function Features() {
    const features = [
        {
            title: "Smart Consultations",
            description: "Record your doctor visits and get instant, accurate AI summaries. Never forget doctor's advice again.",
            icon: "🎙️",
        },
        {
            title: "AI Chat Assistant",
            description: "Have questions about your past consultations? Chat with our AI that understands your specific medical history.",
            icon: "💬",
        },
        {
            title: "OCR Document Scanning",
            description: "Upload prescriptions and reports just by taking a photo. We extract and organize the data for you.",
            icon: "📄",
        },
        {
            title: "Secure & Private",
            description: "Your health data is encrypted and secure. You control who sees your information.",
            icon: "Px",
        },
    ];

    return (
        <section id="features" className="py-24 bg-gray-50 dark:bg-zinc-900/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Everything you need for better health management
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        A comprehensive platform connecting patients and doctors with the power of Artificial Intelligence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-zinc-700"
                        >
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
