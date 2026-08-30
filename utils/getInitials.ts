export const getInitials = (name?: string): string => {
    if (!name) return ""
  
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }