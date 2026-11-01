
"use client"

import { useState } from "react"
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
   PASSWORD GENERATOR
========================= */

const generatePassword = (length = 14) => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"

  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)

  return Array.from(
    randomValues,
    (value) => chars[value % chars.length]
  ).join("")
}

/* =========================
   PASSWORD FORM
========================= */

function ResetPasswordForm({
  user,
  onSubmit,
  loading,
}: {
  user: AuthUser | null
  onSubmit: Props["onSubmit"]
  loading: boolean
}) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  /* =========================
     VALIDATION
  ========================= */

  const isValid = password.length >= 6

  /* =========================
     GENERATE PASSWORD
  ========================= */

  const handleGenerate = () => {
    setPassword(generatePassword(14))
    setError(null)
    setCopied(false)
  }

  /* =========================
     COPY PASSWORD
  ========================= */

  const handleCopy = async () => {
    if (!password) return

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setError("Unable to copy password. Please copy it manually.")
    }
  }

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async () => {
    if (!user?.id) {
      setError("User information is unavailable.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setError(null)

    try {
      await onSubmit(user.id, password)
    } catch {
      setError("Failed to reset password. Please try again.")
    }
  }

  return (
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
        onChange={(event) => {
          setPassword(event.target.value)
          setError(null)
          setCopied(false)
        }}
        autoComplete="new-password"
      />

      {/* ================= ACTION BUTTONS ================= */}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleGenerate}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate
        </Button>

        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleCopy}
          disabled={!password || loading}
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-primary" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}

          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div className="text-xs text-red-500" role="alert">
          {error}
        </div>
      )}

      {/* ================= SUBMIT ================= */}

      <Button
        type="button"
        className="w-full"
        disabled={!isValid || loading || !user?.id}
        onClick={handleSubmit}
      >
        {loading ? "Updating..." : "Reset Password"}
      </Button>
    </div>
  )
}

/* =========================
   MAIN COMPONENT
========================= */

export function ResetPasswordModal({
  open,
  onClose,
  user,
  onSubmit,
  loading = false,
}: Props) {
  return (
    <BaseModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      title="Reset User Password"
    >
      {open && (
        <ResetPasswordForm
          user={user}
          onSubmit={onSubmit}
          loading={loading}
        />
      )}
    </BaseModal>
  )
}
