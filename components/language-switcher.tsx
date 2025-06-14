"use client"

import { useLanguage } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
        >
          <Globe className="h-4 w-4" />
          {language === "zh" ? "中文" : "English"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`text-gray-200 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white cursor-pointer ${language === "en" ? "bg-gray-700" : ""}`}
        >
          <div className="flex items-center justify-between w-full">
            <span>English</span>
            {language === "en" && <Check className="h-4 w-4 text-yellow-500" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("zh")}
          className={`text-gray-200 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white cursor-pointer ${language === "zh" ? "bg-gray-700" : ""}`}
        >
          <div className="flex items-center justify-between w-full">
            <span>中文</span>
            {language === "zh" && <Check className="h-4 w-4 text-yellow-500" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
