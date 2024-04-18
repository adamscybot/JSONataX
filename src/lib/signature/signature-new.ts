import type * as Tokens from './tokens.js'
import type { CharOf, CharsOf, TokenOf, invalid } from './utils.js'

type TypeTokenMappings = {
  [Tokens.Enum.ArrayType]: Array<any>
  [Tokens.Enum.BooleanType]: boolean
  [Tokens.Enum.NumberType]: number
  [Tokens.Enum.StringType]: string
  [Tokens.Enum.NullType]: null
  [Tokens.Enum.ObjectType]: object
  [Tokens.Enum.FunctionType]: (...args: any) => any
  [Tokens.Enum.JsonType]: boolean | number | string | null | object
  [Tokens.Enum.AnyType]:
    | boolean
    | number
    | string
    | null
    | object
    | ((...args: any) => any)
}

type TsTypeFromChar<Char extends string> =
  TokenOf<Char> extends keyof TypeTokenMappings
    ? TypeTokenMappings[TokenOf<Char>]
    : invalid<`Token '${Char}' is not a valid type token.`>

type SplitOnMatchingTerminator<
  S extends string,
  LToken extends Tokens.Enum,
  RToken extends Tokens.Enum,
  Accumulated extends string = '',
  L extends any[] = [0],
  R extends any[] = [],
> = S extends `${infer Char}${infer Rest}`
  ? TokenOf<Char> extends LToken
    ? SplitOnMatchingTerminator<
        Rest,
        LToken,
        RToken,
        `${Accumulated}${Char}`,
        [0, ...L],
        R
      >
    : TokenOf<Char> extends RToken
      ? L['length'] extends [0, ...R]['length']
        ? '' extends Accumulated
          ? `Invalid empty '${CharOf<LToken>}${CharOf<RToken>}' found.`
          : [`${Accumulated}`, Rest]
        : SplitOnMatchingTerminator<
            Rest,
            LToken,
            RToken,
            `${Accumulated}${Char}`,
            L,
            [0, ...R]
          >
      : SplitOnMatchingTerminator<
          Rest,
          LToken,
          RToken,
          `${Accumulated}${Char}`,
          L,
          R
        >
  : `Unterminated '${CharOf<LToken>}'`

type SplitOnSubTypeTerminator<S extends string> = SplitOnMatchingTerminator<
  S,
  Tokens.Enum.SubTypeOpen,
  Tokens.Enum.SubTypeClose
>

type SplitOnUnionTerminator<S extends string> = SplitOnMatchingTerminator<
  S,
  Tokens.Enum.UnionOpen,
  Tokens.Enum.UnionClose
>

type FirstChar<S extends string> = S extends `${infer Char}${infer Rest}`
  ? Char
  : never

type RawArraySigTokensToType<S extends string> = SigTokensToTypes<
  FirstChar<SplitOnSubTypeTerminator<S>[0]>,
  // Type args for arrays (`a<_>`) are limited to a subset currently.
  Tokens.Enum.JsonType | Tokens.Enum.AnyType
>

type ArraySigTokensToType<S extends string> =
  invalid<any> extends RawArraySigTokensToType<S>
    ? RawArraySigTokensToType<S>
    : Array<RawArraySigTokensToType<S>[0]>

type RawUnionSigTokensToType<S extends string> = SigTokensToTypes<
  SplitOnUnionTerminator<S>[0],
  keyof Tokens.ModifierTokenChars | keyof Tokens.DelimiterTokenChars
>

type UnionSigTokensToType<S extends string> =
  invalid<any> extends RawUnionSigTokensToType<S>
    ? RawUnionSigTokensToType<S>
    : RawUnionSigTokensToType<S>[number]

type AppendUnionToLastType<T extends any[], U> = T extends [...infer R, infer L]
  ? [...R, L | U]
  : never

type SpreadLastType<T extends any[]> = T extends [...infer Rest, infer Last]
  ? [...Rest, Last, ...Last[]]
  : never

type ApplyOptionSigTokens<
  Types extends any[],
  Modifier extends keyof Tokens.ModifierTokenChars,
> = Modifier extends Tokens.Enum.OptionalModifier
  ? // We add explicit undefined here, but `ParamsFromSignature` adds it to all args anyway later
    // because any arg is allowed to be set to `undefined` explicitly and JSonata does not currently
    // provide a way to disambiguate. This is still needed for correctly typing lambdas such that they
    // are called from the handler in a valid way.
    AppendUnionToLastType<Types, undefined>
  : Modifier extends Tokens.Enum.ContextAwareModifier
    ? Types // Nothing to be done since JSonata makes sure the context type matches
    : Modifier extends Tokens.Enum.OneOrMoreModifier
      ? SpreadLastType<Types> // Represents one or more instances of Type
      : never

type SigTokensToTypes<
  S extends string,
  RestrictedTokens extends Tokens.Enum = never,
  AccumulatedParamTypes extends any[] = [],
  AccumulatedReturnType extends any[] = [],
> = S extends `${infer Char}${infer Rest}`
  ? TokenOf<Char> extends RestrictedTokens
    ? invalid<`Token '${Char}' can not be used here '${Char}${Rest}'`>
    : TokenOf<Char> extends keyof Tokens.ModifierTokenChars
      ? SigTokensToTypes<
          Rest,
          RestrictedTokens,
          ApplyOptionSigTokens<AccumulatedParamTypes, TokenOf<Char>>,
          AccumulatedReturnType
        >
      : TokenOf<Char> extends Tokens.Enum.ArrayType
        ? Rest extends `${CharOf<Tokens.Enum.SubTypeOpen>}${infer AfterTypeParamOpen}`
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
              [...AccumulatedParamTypes, TsTypeFromChar<Char>],
              AccumulatedReturnType
            >
        : TokenOf<Char> extends Tokens.Enum.UnionOpen
          ? SigTokensToTypes<
              SplitOnUnionTerminator<Rest>[1],
              RestrictedTokens,
              [...AccumulatedParamTypes, UnionSigTokensToType<Rest>],
              AccumulatedReturnType
            >
          : TokenOf<Char> extends Tokens.Enum.SubTypeOpen
            ? [
                invalid<`Type parameter opening bracket ('<') token can only be specified immediately after 'a' or 'f' tokens.`>,
              ]
            : TokenOf<Char> extends Tokens.Enum.SubTypeClose
              ? [
                  invalid<`Type parameters terminator ('>') token found without matching opener ('<') token.`>,
                ]
              : TokenOf<Char> extends Tokens.Enum.ReturnSeparator
                ? 's'
                : SigTokensToTypes<
                    Rest,
                    RestrictedTokens,
                    [...AccumulatedParamTypes, TsTypeFromChar<Char>],
                    AccumulatedReturnType
                  >
  : AccumulatedParamTypes

type test = SigTokensToTypes<'(snoa<a>)'>
type lol = TsTypeFromChar<'v'>
