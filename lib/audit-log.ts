import type {
    AuditLogResource,
    AuditValues,
  } from "@/types/audit-log"
  
  /*
  |--------------------------------------------------------------------------
  | Formatting
  |--------------------------------------------------------------------------
  */
  
  /** Fields that change on every save and rarely matter to a reader. */
  export const NOISE_KEYS = new Set([
    "created_at",
    "updated_at",
    "deleted_at",
  ])
  
  export function formatAction(action: string): string {
    const text = action.replace(/_/g, " ").toLowerCase()
  
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
  
  export function formatDateTime(iso: string): string {
    const date = new Date(iso)
  
    if (Number.isNaN(date.getTime())) {
      return "—"
    }
  
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(date)
  }
  
  const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ]
  
  export function formatRelativeTime(
    iso: string,
    now: number = Date.now(),
  ): string {
    const date = new Date(iso)
  
    if (Number.isNaN(date.getTime())) {
      return ""
    }
  
    const diffSeconds = Math.round((date.getTime() - now) / 1000)
    const formatter = new Intl.RelativeTimeFormat(undefined, {
      numeric: "auto",
    })
  
    for (const [unit, seconds] of RELATIVE_UNITS) {
      if (Math.abs(diffSeconds) >= seconds) {
        return formatter.format(Math.round(diffSeconds / seconds), unit)
      }
    }
  
    return formatter.format(diffSeconds, "second")
  }
  
  /** "App\\Models\\Role" becomes "Role". */
  export function getResourceName(
    resource: AuditLogResource,
  ): string | null {
    if (!resource.type) {
      return null
    }
  
    return resource.type.split("\\").pop() ?? resource.type
  }
  
  export function getResourceLabel(
    resource: AuditLogResource,
  ): string | null {
    const name = getResourceName(resource)
  
    if (!name) {
      return null
    }
  
    return resource.id ? `${name} #${resource.id}` : name
  }
  
  export function humanizeKey(key: string): string {
    return key
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => {
        if (word === "id") return "ID"
        if (word === "ip") return "IP"
  
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(" ")
  }
  
  export function getInitials(name?: string | null): string {
    if (!name) {
      return "?"
    }
  
    return name
      .split(/[\s_.-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
  }
  
  /*
  |--------------------------------------------------------------------------
  | User agent
  |--------------------------------------------------------------------------
  */
  
  export interface ParsedUserAgent {
    browser: string
    os: string
    device: "Mobile" | "Desktop"
  }
  
  export function parseUserAgent(
    userAgent?: string | null,
  ): ParsedUserAgent {
    const ua = userAgent ?? ""
  
    const browser = /Edg\//.test(ua)
      ? "Edge"
      : /OPR\//.test(ua)
        ? "Opera"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Unknown browser"
  
    // iPhone user agents also contain "Mac OS X", so check them first.
    const os = /iPhone|iPad/.test(ua)
      ? "iOS"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X/.test(ua)
            ? "macOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "Unknown OS"
  
    return {
      browser,
      os,
      device: /Mobile|Android|iPhone/.test(ua) ? "Mobile" : "Desktop",
    }
  }
  
  /*
  |--------------------------------------------------------------------------
  | Diff
  |--------------------------------------------------------------------------
  */
  
  export type DiffKind = "added" | "removed" | "changed" | "unchanged"
  
  export interface DiffEntry {
    key: string
    label: string
    kind: DiffKind
    noise: boolean
    before: unknown
    after: unknown
    /** Set when the field is a list, for example permissions. */
    list?: {
      added: string[]
      removed: string[]
      unchanged: string[]
    }
  }
  
  const KIND_RANK: Record<DiffKind, number> = {
    changed: 0,
    added: 0,
    removed: 0,
    unchanged: 1,
  }
  
  function isSame(a: unknown, b: unknown): boolean {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
  }
  
  /**
   * Compare old and new values field by field.
   * - Creates have no old values, so every field is "added".
   * - Deletes have no new values, so every field is "removed".
   * - List fields get an added/removed breakdown.
   */
  export function buildDiff(
    oldValues: AuditValues | null,
    newValues: AuditValues | null,
  ): DiffEntry[] {
    if (!oldValues && !newValues) {
      return []
    }
  
    const keys = Array.from(
      new Set([
        ...Object.keys(oldValues ?? {}),
        ...Object.keys(newValues ?? {}),
      ]),
    )
  
    const entries = keys.map<DiffEntry>((key) => {
      const hasBefore = Boolean(oldValues) && key in (oldValues ?? {})
      const hasAfter = Boolean(newValues) && key in (newValues ?? {})
      const before = oldValues?.[key]
      const after = newValues?.[key]
  
      const base = {
        key,
        label: humanizeKey(key),
        noise: NOISE_KEYS.has(key),
        before,
        after,
      }
  
      if (Array.isArray(before) || Array.isArray(after)) {
        const beforeList = Array.isArray(before) ? before.map(String) : []
        const afterList = Array.isArray(after) ? after.map(String) : []
  
        const added = afterList.filter((item) => !beforeList.includes(item))
        const removed = beforeList.filter((item) => !afterList.includes(item))
        const unchanged = afterList.filter((item) =>
          beforeList.includes(item),
        )
  
        return {
          ...base,
          kind:
            added.length > 0 || removed.length > 0
              ? "changed"
              : "unchanged",
          list: { added, removed, unchanged },
        }
      }
  
      if (!hasBefore && hasAfter) {
        return { ...base, kind: "added" }
      }
  
      if (hasBefore && !hasAfter) {
        return { ...base, kind: "removed" }
      }
  
      return {
        ...base,
        kind: isSame(before, after) ? "unchanged" : "changed",
      }
    })
  
    // Real changes first, noisy timestamps and unchanged fields last.
    return entries.sort((a, b) => {
      const rank = KIND_RANK[a.kind] - KIND_RANK[b.kind]
  
      if (rank !== 0) return rank
  
      return Number(a.noise) - Number(b.noise)
    })
  }
  
  /** One short line per meaningful change, for the dialog overview. */
  export function summarizeDiff(entries: DiffEntry[]): string[] {
    return entries
      .filter((entry) => entry.kind !== "unchanged" && !entry.noise)
      .map((entry) => {
        if (entry.list) {
          const parts: string[] = []
  
          if (entry.list.added.length > 0) {
            parts.push(`${entry.list.added.length} added`)
          }
  
          if (entry.list.removed.length > 0) {
            parts.push(`${entry.list.removed.length} removed`)
          }
  
          return `${entry.label}: ${parts.join(", ")}`
        }
  
        if (entry.kind === "added") return `${entry.label} set`
        if (entry.kind === "removed") return `${entry.label} removed`
  
        return `${entry.label} changed`
      })
  }