"use client"

import { Suspense } from "react"
import RegisterForm from "./register-form"
import { Loader2 } from "lucide-react"

function RegisterFormContent() {
  return <RegisterForm />
}

function RegisterFormFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-picwe-black p-6">
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-picwe-yellow mr-3" />
        <span className="text-white text-lg">加载中...</span>
      </div>
    </div>
  )
}

export default function RegisterFormWrapper() {
  return (
    <Suspense fallback={<RegisterFormFallback />}>
      <RegisterFormContent />
    </Suspense>
  )
}
