import { AuthNavbar } from "@/components/AuthNavbar";
import { RecordingContent } from "./RecordingContent";

export default function RecordingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <AuthNavbar />
            <main className="flex-1 overflow-y-auto">
                <RecordingContent />
            </main>
        </div>
    );
}
