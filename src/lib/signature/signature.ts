import type * as Tokens from './tokens.js'

const InvalidTypeSymbol = Symbol(`Invalid type`)
export type invalid<ErrorMessage> = (
  // ErrorMessage doesn't need to be used here, except that using it allows
  // TypeScript to print the passed message instead of just "ErrorMessage"
  // in certain cases.
  invalidType: ErrorMessage & typeof InvalidTypeSymbol,
  ..._: (typeof InvalidTypeSymbol)[]
) => typeof InvalidTypeSymbol

type TypeTokenMap = {
  a: Array<any>
  b: boolean
  n: number
  s: string
  l: null
  o: object
  f: (...args: any) => any
  j: boolean | number | string | null | object
  x: boolean | number | string | null | object | ((...args: any) => any)
}

type SplitOnMatchingTerminator<
  S extends string,
  CharL extends string,
  CharR extends string,
  Accumulated extends string = '',
  L extends any[] = [0],
  R extends any[] = [],
> = S extends `${infer Char}${infer Rest}`
  ? Char extends CharL
    ? SplitOnMatchingTerminator<
        Rest,
        CharL,
        CharR,
        `${Accumulated}${Char}`,
        [0, ...L],
        R
      >
    : Char extends CharR
      ? L['length'] extends [0, ...R]['length']
        ? '' extends Accumulated
          ? `Invalid empty '${CharL}${CharR}' found.`
          : [`${Accumulated}`, Rest]
        : SplitOnMatchingTerminator<
            Rest,
            CharL,
            CharR,
            `${Accumulated}${Char}`,
            L,
            [0, ...R]
          >
      : SplitOnMatchingTerminator<
          Rest,
          CharL,
          CharR,
          `${Accumulated}${Char}`,
          L,
          R
        >
  : `Unterminated '${CharL}'`

type SplitOnSubTypeTerminator<
  S extends string,
  Accumulated extends string = '',
  L extends any[] = [0],
  R extends any[] = [],
> = SplitOnMatchingTerminator<S, '<', '>', Accumulated, L, R>

type SplitOnUnionTerminator<
  S extends string,
  Accumulated extends string = '',
  L extends any[] = [0],
  R extends any[] = [],
> = SplitOnMatchingTerminator<S, '(', ')', Accumulated, L, R>

type FirstChar<S extends string> = S extends `${infer Char}${infer Rest}`
  ? Char
  : never

type RawArraySigTokensToType<S extends string> = SigTokensToTypes<
  FirstChar<SplitOnSubTypeTerminator<S>[0]>,
  // Type args for arrays (`a<_>`) are limited to a subset currently.
  'j' | 'x'
>

type ArraySigTokensToType<S extends string> =
  invalid<any> extends RawArraySigTokensToType<S>
    ? RawArraySigTokensToType<S>
    : Array<RawArraySigTokensToType<S>[0]>

type UnionSigTokensToType<S extends string> =
  invalid<any> extends RawArraySigTokensToType<S>
    ? RawArraySigTokensToType<S>
    : Array<RawArraySigTokensToType<S>[0]>

type AppendUnionToLastType<T extends any[], U> = T extends [...infer R, infer L]
  ? [...R, L | U]
  : never

type SpreadLastType<T extends any[]> = T extends [...infer Rest, infer Last]
  ? [...Rest, Last, ...Last[]]
  : never

type ApplyOptionSigTokens<
  Types extends any[],
  Modifier extends '?' | '-' | '+',
> = Modifier extends '?'
  ? // We add explicit undefined here, but `ParamsFromSignature` adds it to all args anyway later
    // because any arg is allowed to be set to `undefined` explicitly and JSonata does not currently
    // provide a way to disambiguate. This is still needed for correctly typing lambdas such that they
    // are called from the handler in a valid way.
    AppendUnionToLastType<Types, undefined>
  : Modifier extends '-'
    ? Types // Nothing to be done since JSonata makes sure the context type matches
    : Modifier extends '+'
      ? SpreadLastType<Types> // Represents one or more instances of Type
      : never

type SigTokensToTypes<
  S extends string,
  RestrictedTokens extends string = never,
  AccumulatedParamTypes extends any[] = [],
  AccumulatedReturnType extends any[] = [],
> = S extends `${infer Char}${infer Rest}`
  ? Char extends RestrictedTokens
    ? invalid<`Token '${Char}' can not be used here '${Char}${Rest}'`>
    : Char extends '?' | '-' | '+'
      ? SigTokensToTypes<
          Rest,
          RestrictedTokens,
          ApplyOptionSigTokens<AccumulatedParamTypes, Char>,
          AccumulatedReturnType
        >
      : Char extends 'a'
        ? Rest extends `<${infer AfterTypeParamOpen}`
          ? SigTokensToTypes<
              SplitOnSubTypeTerminator<AfterTypeParamOpen>[1],
              RestrictedTokens,
              [
                ...AccumulatedParamTypes,
                ArraySigTokensToType<AfterTypeParamOpen>,
              ],
              AccumulatedReturnType
            >
          : SigTokensToTypes<
              Rest,
              RestrictedTokens,
              [...AccumulatedParamTypes, TypeTokenMap[Char]],
              AccumulatedReturnType
            >
        : Char extends '('
          ? SigTokensToTypes<
              SplitOnUnionTerminator<Rest>[1],
              RestrictedTokens,
              [
                ...AccumulatedParamTypes,
                SigTokensToTypes<
                  SplitOnUnionTerminator<Rest>[0],
                  '<' | '>'
                >[number],
              ],
              AccumulatedReturnType
            >
          : Char extends '<'
            ? [
                invalid<`Type parameter opening bracket ('<') token can only be specified immediately after 'a' or 'f' tokens.`>,
              ]
            : Char extends '>'
              ? [
                  invalid<`Type parameters terminator ('>') token found without matching opener ('<') token.`>,
                ]
              : Char extends ':'
                ? 's'
                : Char extends keyof TypeTokenMap
                  ? SigTokensToTypes<
                      Rest,
                      RestrictedTokens,
                      [...AccumulatedParamTypes, TypeTokenMap[Char]],
                      AccumulatedReturnType
                    >
                  : invalid<`Token '${Char}' is not a valid type token.`>
  : AccumulatedParamTypes

type test = SigTokensToTypes<'(an)?a<n>'>
