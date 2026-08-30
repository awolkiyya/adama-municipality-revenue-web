"use client"

import { useMe } from "@/hooks/auth/useMe"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useMe()

  return <>{children}</>
}