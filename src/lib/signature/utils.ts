import type * as Tokens from './tokens.js'

const InvalidTypeSymbol = Symbol(`Invalid type`)
export type invalid<ErrorMessage> = (
  // ErrorMessage doesn't need to be used here, except that using it allows
  // TypeScript to print the passed message instead of just "ErrorMessage"
  // in certain cases.
  invalidType: ErrorMessage & typeof InvalidTypeSymbol,
  ..._: (typeof InvalidTypeSymbol)[]
) => typeof InvalidTypeSymbol

export type CharOf<Token extends Tokens.Enum> = Tokens.TokenChars[Token]

type ReverseLookup<T, V> = {
  [P in keyof T]: T[P] extends V ? P : never
}[keyof T]

// TokenFor type for looking up Enum based on character
export type TokenOf<Char extends string> =
  ReverseLookup<Tokens.TokenChars, Char> extends never
    ? invalid<`Token '${Char}' is not a valid type token.`>
    : ReverseLookup<Tokens.TokenChars, Char>

export type PrintToken<Token extends Tokens.Enum> =
  `${Token} ('${CharOf<Token>}')`
