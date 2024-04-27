declare const __brand: unique symbol
type Brand<B> = { [__brand]: B }
export type Branded<T, B> = T & Brand<B>

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

export type NonArrayNonNullObject = {
  [key: string]: any
} & object

export type OptionalTuple<T extends any[]> = {
  [K in keyof T]: T[K] | undefined
} extends infer R
  ? R extends unknown[]
    ? R
    : never
  : never

export type LastElement<A extends any[]> = A extends [
  ...infer Rest,
  infer LastType,
]
  ? LastType
  : never

export type ReplaceLast<A extends any[], B extends any[]> = A extends [
  ...infer Rest,
  any,
]
  ? [...Rest, ...B]
  : never
