const PATTERNS: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[redacted-email]'],
  [/\b(?:\+?\d{1,2}[\s-]?)?(?:\(\d{3}\)|\d{3})[\s-]?\d{3}[\s-]?\d{4}\b/g, '[redacted-phone]'],
  [/\b\d{3}-\d{2}-\d{4}\b/g, '[redacted-ssn]'],
  [/\b(?:\d[ -]?){13,16}\b/g, '[redacted-card]'],
  [/\b(?:sk|pk|api|key)[-_][A-Za-z0-9]{16,}\b/g, '[redacted-key]'],
]

export function redactPii(text: string): string {
  return PATTERNS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text)
}
