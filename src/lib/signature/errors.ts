import type { Enum, PrintToken } from './tokens.js'

const InvalidTypeSymbol = Symbol(`Invalid type`)
export type invalid<ErrorMessage> = (
  // ErrorMessage doesn't need to be used here, except that using it allows
  // TypeScript to print the passed message instead of just "ErrorMessage"
  // in certain cases.
  invalidType: ErrorMessage & typeof InvalidTypeSymbol,
  ..._: (typeof InvalidTypeSymbol)[]
) => typeof InvalidTypeSymbol

export type FormatError<
  Message extends string | undefined,
  InnerSig extends string | undefined = undefined,
  Chomped extends string | undefined = undefined,
  Formatted extends string = `${Message} Found at: <${Chomped}❌`,
> = [
  Message extends undefined
    ? never
    : invalid<
        InnerSig extends `${Chomped}${infer Rest}`
          ? `${Formatted}${Rest}> `
          : `${Formatted} `
      >,
]

export type SignatureNotWrappedError =
  `Signature must be enclosed by wrapping ${PrintToken<Enum.SubTypeOpen>} and ${PrintToken<Enum.SubTypeClose>} characters`

export type RestrictedTokenError<Token extends Enum> =
  `Token ${PrintToken<Token>} can not be used here`

export type UnknownCharError<Char extends string> =
  `Character '${Char}' is not a valid type token`

export type UnmatchedCloseDelimiterError<
  LToken extends Enum,
  RToken extends Enum,
> = `Token ${PrintToken<RToken>} token found without matching opener ${PrintToken<LToken>} token`

export type EmptyDelimitedStringError<
  LToken extends Enum,
  RToken extends Enum,
> = `No inner tokens between ${PrintToken<LToken>} and ${PrintToken<RToken>}' found.`

export type UnterminatedOpenDelimiterError<
  LToken extends Enum,
  RToken extends Enum,
> = `Unterminated ${PrintToken<LToken>} token found without matching ${PrintToken<RToken>}`

export type ModifierOnReturnTypeError<Token extends Enum> =
  `${PrintToken<Token>} can not be used with return type symbols`

export type ModifierWithoutTypeError<Token extends Enum> =
  `${PrintToken<Token>} can only appear after a type token`

export type InvalidSubTypeOpenError =
  `Token ${PrintToken<Enum.SubTypeOpen>} can only be specified immediately after ${PrintToken<Enum.ArrayType>} or ${PrintToken<Enum.FunctionType>} tokens`

export type InvalidReturnDelimiterError =
  `${PrintToken<Enum.ReturnSeparator>} can not be used here since it was already used in this context`

export type MultipleReturnTypesError = 'Only one return type can be specified'