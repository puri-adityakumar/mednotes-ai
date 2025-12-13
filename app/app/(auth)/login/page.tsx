import { Navbar } from '@/components/Navbar'
import LoginForm from '@/components/auth/LoginForm'

/**
 * Renders the login page layout including the site navigation and the login form.
 *
 * @returns The page JSX element: a full-height container with `Navbar` and `LoginForm`.
 */
export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col">
            <Navbar />
            <LoginForm />
        </div>
    )
}