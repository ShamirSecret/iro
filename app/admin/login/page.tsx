// This page can simply reuse the main login form.
// The AuthProvider will handle redirection based on role.
import LoginForm from "@/components/auth/login-form"

export default function AdminLoginPage() {
  return <LoginForm />
}
