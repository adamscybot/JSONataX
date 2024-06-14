export type AppendUnionToLastType<T extends any[], U> = T extends [
  ...infer R,
  infer L,
]
  ? [...R, L | U]
  : never

export type SpreadLastType<T extends any[]> = T extends [
  ...infer Rest,
  infer Last,
]
  ? [...Rest, Last, ...Last[]]
  : never

/**
 * The signature parser currently allows any param to be explicitly
 * set to `undefined` in the expression, except for function params.
 */
export type MakeNonFnsOptional<T extends any[]> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : T[K] | undefined
} extends infer R
  ? R extends unknown[]
    ? R
    : never
  : never
