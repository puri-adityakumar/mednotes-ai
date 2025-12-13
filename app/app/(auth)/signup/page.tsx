import { Navbar } from '@/components/Navbar'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col">
            <Navbar />
            <SignupForm />
        </div>
    )
}
