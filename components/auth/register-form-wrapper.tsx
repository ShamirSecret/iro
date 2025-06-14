"use client"

import { useLanguage } from "@/app/providers"
import RegisterFormEN from "./register-form-en"
import RegisterFormZH from "./register-form-zh"

export default function RegisterFormWrapper() {
  const { language } = useLanguage()

  if (language === "zh") {
    return <RegisterFormZH />
  }

  return <RegisterFormEN />
}
