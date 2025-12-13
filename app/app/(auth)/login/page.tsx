import { Navbar } from '@/components/Navbar'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col">
            <Navbar />
            <LoginForm />
        </div>
    )
}
