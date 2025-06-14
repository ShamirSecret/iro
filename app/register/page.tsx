import RegisterFormWrapper from "@/components/auth/register-form-wrapper"
import { Suspense } from "react"

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterFormWrapper />
    </Suspense>
  )
}
