"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname()
  const isTimerRoute = pathname?.startsWith("/timer")

  return (
    <NextThemesProvider
      {...props}
      forcedTheme={isTimerRoute ? "dark" : props.forcedTheme}
    >
      {children}
    </NextThemesProvider>
  )
}

export { useTheme };
