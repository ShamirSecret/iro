import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppProviders } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PICWE 3rd Gen Financial Credit System - Blockchain Credit Assessment Platform",
  description: "Third-generation financial credit assessment system based on blockchain technology, building a decentralized credit network",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
