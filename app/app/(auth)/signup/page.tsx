import { Navbar } from '@/components/Navbar'
import SignupForm from '@/components/auth/SignupForm'

/**
 * Renders the signup page layout with global page styling and embedded signup UI.
 *
 * The component provides the page container (min-height, background colors for light/dark, and column flex layout),
 * renders the site navigation, and mounts the SignupForm component which contains the signup UI and logic.
 *
 * @returns The JSX element for the signup page (container with Navbar and SignupForm).
 */
export default function SignupPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col">
            <Navbar />
            <SignupForm />
        </div>
    )
}