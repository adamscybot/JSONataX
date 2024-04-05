export const prefixedString = (str: string) => `[modular-jsonata] ${str}`

export const prefixedCodedString = (code: string, str: string) =>
  prefixedString(`[${code}] ${str}`)
