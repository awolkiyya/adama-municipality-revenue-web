"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AuthUser } from "@/types/user"
import { Check, Copy, RefreshCw } from "lucide-react"
import { BaseModal } from "./BaseModal"

/* =========================
   TYPES
========================= */
type Props = {
  open: boolean
  onClose: () => void
  user: AuthUser | null
  onSubmit: (userId: string, password: string) => Promise<void> | void
  loading?: boolean
}

/* =========================
   SECURE PASSWORD GENERATOR
========================= */
const generatePassword = (length = 14) => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"

  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

/* =========================
   COMPONENT
========================= */
export function ResetPasswordModal({
  open,
  onClose,
  user,
  onSubmit,
  loading = false,
}: Props) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  /* =========================
     RESET STATE ON OPEN
  ========================= */
  useEffect(() => {
    if (open) {
      setPassword("")
      setError(null)
      setCopied(false)
    }
  }, [open])

  /* =========================
     VALIDATION
  ========================= */
  const isValid = password.length >= 6

  /* =========================
     GENERATE PASSWORD
  ========================= */
  const handleGenerate = () => {
    const newPassword = generatePassword(14)
    setPassword(newPassword)
    setError(null)
  }

  /* =========================
     COPY PASSWORD
  ========================= */
  const handleCopy = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async () => {
    if (!user?.id) return

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setError(null)
    await onSubmit(user.id, password)
  }

  return (
    <BaseModal
      open={open}
      onOpenChange={onClose}
      title="Reset User Password"
    >
      <div className="space-y-4">

        {/* ================= USER INFO ================= */}
        <div className="text-sm text-muted-foreground">
          Reset password for{" "}
          <span className="font-semibold text-foreground">
            {user?.name}
          </span>
        </div>

        {/* ================= PASSWORD INPUT ================= */}
        <Input
          type="text"
          placeholder="Enter or generate password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* ================= ACTION BUTTONS ================= */}
        <div className="flex gap-2">

          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleGenerate}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleCopy}
            disabled={!password}
          >
             {copied ?  <Check className="w-4 h-4 mr-2 text-primary" />: <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>

        </div>

        {/* ================= ERROR ================= */}
        {error && (
          <div className="text-xs text-red-500">
            {error}
          </div>
        )}

        {/* ================= SUBMIT ================= */}
        <Button
          className="w-full"
          disabled={!isValid || loading}
          onClick={handleSubmit}
        >
          {loading ? "Updating..." : "Reset Password"}
        </Button>

      </div>
    </BaseModal>
  )
}