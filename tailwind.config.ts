import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // 使用 PicWe 颜色作为基础
        background: "var(--picwe-black)", // hsl(var(--background)) -> var(--picwe-black)
        foreground: "var(--picwe-whiteText)", // hsl(var(--foreground)) -> var(--picwe-whiteText)
        primary: {
          DEFAULT: "var(--picwe-yellow)", // hsl(var(--primary)) -> var(--picwe-yellow)
          foreground: "var(--picwe-black)", // hsl(var(--primary-foreground)) -> var(--picwe-black)
        },
        secondary: {
          DEFAULT: "var(--picwe-darkGray)", // hsl(var(--secondary)) -> var(--picwe-darkGray)
          foreground: "var(--picwe-whiteText)", // hsl(var(--secondary-foreground)) -> var(--picwe-whiteText)
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "var(--picwe-darkGray)", // hsl(var(--muted)) -> var(--picwe-darkGray)
          foreground: "var(--picwe-lightGrayText)", // hsl(var(--muted-foreground)) -> var(--picwe-lightGrayText)
        },
        accent: {
          DEFAULT: "var(--picwe-yellow)", // hsl(var(--accent)) -> var(--picwe-yellow)
          foreground: "var(--picwe-black)", // hsl(var(--accent-foreground)) -> var(--picwe-black)
        },
        popover: {
          DEFAULT: "var(--picwe-darkGray)", // hsl(var(--popover)) -> var(--picwe-darkGray)
          foreground: "var(--picwe-whiteText)", // hsl(var(--popover-foreground)) -> var(--picwe-whiteText)
        },
        card: {
          DEFAULT: "var(--picwe-darkGray)", // hsl(var(--card)) -> var(--picwe-darkGray)
          foreground: "var(--picwe-whiteText)", // hsl(var(--card-foreground)) -> var(--picwe-whiteText)
        },
        // PicWe 风格颜色
        picwe: {
          yellow: "#FFD700",
          black: "#121212",
          gray: "#F0F0F0",
          darkGray: "#1E1E1E", // 调整 darkGray 以便与 black 有区分
          lightGrayText: "#A0A0A0",
          whiteText: "#FFFFFF",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
