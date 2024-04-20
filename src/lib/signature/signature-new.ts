import type * as Tokens from './tokens.js'
import type { CharOf, PrintToken, TokenOf, invalid } from './utils.js'

/**
 * Mappings between tokens that represent types and the underlying
 * TS types for those tokens.
 */
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

/**
 * Fixed position data for accessing data in the Raw Representation
 * Tuple.
 **/
const enum AccumulatorIO {
  Params = 0,
  Return = 1,
}

/**
 * Given a character, return its matching TS type representation.
 */
type TsTypeFromChar<Char extends string> =
  TokenOf<Char> extends keyof TypeTokenMappings
    ? TypeTokenMappings[TokenOf<Char>]
    : invalid<`Char '${Char}' does not represent a valid type token.`>

/**
 * Generic util to match up until a matching closing delimiter, and split
 * the string on this closing delimiter. This allows further processing of
 * the inner signature for sub types and union types.
 *
 * Additionally ensures that there is at least one symbol between the delimiters
 * and will also error if the delimiters are unbalanced.
 */
type SplitOnMatchingTerminator<
  S extends string,
  LToken extends Tokens.Enum,
  RToken extends Tokens.Enum,
  Accumulated extends string = '',
  // An opening bracket is already registered since the string S does not contain
  // this, since it has already been consumed in `SignatureToRawTuple`.
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
          ? `No inner tokens between ${PrintToken<LToken>} and ${PrintToken<RToken>}' found.`
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
  : `Unterminated ${PrintToken<LToken>}`

/**
 * Wrapped version of {@link SplitOnMatchingTerminator} for matching sub type
 * brackets.
 */
type SplitOnSubTypeTerminator<S extends string> = SplitOnMatchingTerminator<
  S,
  Tokens.Enum.SubTypeOpen,
  Tokens.Enum.SubTypeClose
>

/**
 * Wrapped version of {@link SplitOnMatchingTerminator} for matching union
 * brackets.
 */
type SplitOnUnionTerminator<S extends string> = SplitOnMatchingTerminator<
  S,
  Tokens.Enum.UnionOpen,
  Tokens.Enum.UnionClose
>

type FirstChar<S extends string> = S extends `${infer Char}${infer Rest}`
  ? Char
  : never

type RawArraySigTokensToType<S extends string> = SignatureToRawTuple<
  // For Array types, the validator currently only takes into account first inner type definition
  FirstChar<SplitOnSubTypeTerminator<S>[0]>,
  // Type args for arrays are limited to a subset in the validator currently.
  Tokens.Enum.JsonType | Tokens.Enum.AnyType
>[AccumulatorIO.Params]

type ArraySigTokensToType<S extends string> =
  invalid<any> extends RawArraySigTokensToType<S>
    ? RawArraySigTokensToType<S>
    : Array<RawArraySigTokensToType<S>[0]>

type FunctionSigTokensToType<S extends string> = RawTupleToFn<
  SignatureToRawTuple<SplitOnSubTypeTerminator<S>[0]>
>

type RawUnionSigTokensToType<S extends string> = SignatureToRawTuple<
  SplitOnUnionTerminator<S>[0],
  keyof Tokens.ModifierTokenChars | keyof Tokens.DelimiterTokenChars
>

type UnionSigTokensToType<S extends string> =
  invalid<any> extends RawUnionSigTokensToType<S>
    ? RawUnionSigTokensToType<S>
    : RawUnionSigTokensToType<S>[0][number]

type AppendUnionToLastType<T extends any[], U> = T extends [...infer R, infer L]
  ? [...R, L | U]
  : never

type SpreadLastType<T extends any[]> = T extends [...infer Rest, infer Last]
  ? [...Rest, Last, ...Last[]]
  : never

/**
 * Applies the logic for modifier tokens
 */
type ApplyOptionSigTokens<
  Types extends any[],
  Modifier extends keyof Tokens.ModifierTokenChars,
> = Types extends []
  ? [invalid<`${PrintToken<Modifier>} can only appear after a type token`>]
  : Modifier extends Tokens.Enum.OptionalModifier
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

// Helper type to find 'invalid' in a tuple
type FindInvalid<T extends any[]> = T extends [infer First, ...infer Rest]
  ? invalid<any> extends First
    ? First
    : FindInvalid<Rest>
  : never

/**
 * Given a Raw Representation Tuple, converts it to a function type
 * using the args/return types from that tuple. Note, the return can
 * only be a single type. If no return type token was provided, `any`
 * is assumed.
 * */
type RawTupleToFn<AccumulatedTypes extends [any[], any[]]> =
  AccumulatedTypes[AccumulatorIO.Return] extends [any, ...any[]]
    ? AccumulatedTypes extends [any[], [any, any, ...any[]]]
      ? [invalid<'Only one return token can be specified'>]
      : (
          ...args: AccumulatedTypes[AccumulatorIO.Params]
        ) => AccumulatedTypes[AccumulatorIO.Return][0]
    : (...args: AccumulatedTypes[AccumulatorIO.Params]) => any

/**
 * Helper that updates the Raw Representation Tuple depending on
 * if we are processing tokens representing the argument types or the
 * return type.
 */
type UpdateAccumulator<
  Accumulator extends [any[], any[]],
  Current extends AccumulatorIO,
  Replacement extends any[],
> = Current extends AccumulatorIO.Params
  ? [Replacement, Accumulator[1]]
  : [Accumulator[0], Replacement]

type ParserStateType = {
  accumulator: [any[], any[]]
  error: invalid<any> | undefined
}

type DefaultParserState = { accumulator: [[], []]; error: undefined }

/**
 * The core of the compile time signature parser. Given the inner part of a
 * signature string (excluding angle bracket wrapper), returns an intermediary
 * structure in the form of a tuple known herein as the "Raw Representation Tuple" where:
 *
 * 1. The first element is a nested tuple that represents the types of the
 *    arguments of that signature. I.e. on the lhs of the `:`.
 * 2. The second element is a nested tuple that represents the types of the return
 *    of that signature. I.e. on the rhs of the `:`.
 */
type SignatureToRawTuple<
  S extends string,
  RestrictedTokens extends Tokens.Enum = never,
  CurrentAccumulator extends AccumulatorIO = AccumulatorIO.Params,
  AccumulatedTypes extends [any[], any[]] = [[], []],
  State extends ParserStateType = DefaultParserState,
> =
  // Extract the next character to process
  S extends `${infer Char}${infer Rest}`
    ? TokenOf<Char> extends RestrictedTokens
      ? [
          [invalid<`Token ${PrintToken<TokenOf<Char>>} can not be used here.`>],
          [],
        ]
      : // Case where the token represents a modifier
        TokenOf<Char> extends keyof Tokens.ModifierTokenChars
        ? SignatureToRawTuple<
            Rest,
            RestrictedTokens,
            CurrentAccumulator,
            UpdateAccumulator<
              AccumulatedTypes,
              CurrentAccumulator,
              ApplyOptionSigTokens<
                AccumulatedTypes[CurrentAccumulator],
                TokenOf<Char>
              >
            >
          >
        : // Case where a parameterisable token is encountered
          TokenOf<Char> extends keyof Tokens.GenericTypeTokenChars
          ? // Case where a parameterisable token is encountered, and a parameter is specified
            Rest extends `${CharOf<Tokens.Enum.SubTypeOpen>}${infer AfterTypeParamOpen}`
            ? SignatureToRawTuple<
                SplitOnSubTypeTerminator<AfterTypeParamOpen>[1],
                RestrictedTokens,
                CurrentAccumulator,
                UpdateAccumulator<
                  AccumulatedTypes,
                  CurrentAccumulator,
                  [
                    ...AccumulatedTypes[CurrentAccumulator],
                    TokenOf<Char> extends Tokens.Enum.ArrayType
                      ? ArraySigTokensToType<AfterTypeParamOpen>
                      : TokenOf<Char> extends Tokens.Enum.FunctionType
                        ? FunctionSigTokensToType<AfterTypeParamOpen>
                        : never,
                  ]
                >
              >
            : // Case where a parameterisable symbol is used without any parameters.
              SignatureToRawTuple<
                Rest,
                RestrictedTokens,
                CurrentAccumulator,
                UpdateAccumulator<
                  AccumulatedTypes,
                  CurrentAccumulator,
                  [
                    ...AccumulatedTypes[CurrentAccumulator],
                    TsTypeFromChar<Char>,
                  ]
                >
              >
          : // Case where a union is encountered
            TokenOf<Char> extends Tokens.Enum.UnionOpen
            ? SignatureToRawTuple<
                SplitOnUnionTerminator<Rest>[1],
                RestrictedTokens,
                CurrentAccumulator,
                UpdateAccumulator<
                  AccumulatedTypes,
                  CurrentAccumulator,
                  [
                    ...AccumulatedTypes[CurrentAccumulator],
                    UnionSigTokensToType<Rest>,
                  ]
                >
              >
            : // Case where a sub type open token is encountered, but following a non parameterisable type.
              // Valid uses of this token are captured in an earlier case.
              TokenOf<Char> extends Tokens.Enum.SubTypeOpen
              ? [
                  [
                    invalid<`Token ${PrintToken<Tokens.Enum.SubTypeOpen>} can only be specified immediately after ${PrintToken<Tokens.Enum.ArrayType>} or ${PrintToken<Tokens.Enum.FunctionType>} tokens.`>,
                  ],
                  [],
                ]
              : // Case where a sub type close token is encountered, but there was no matching open token.
                // Cases where there is an open token are swallowed as part of `SplitOnSubTypeTerminator` in an earlier case.
                TokenOf<Char> extends Tokens.Enum.SubTypeClose
                ? [
                    [
                      invalid<`Token ${PrintToken<Tokens.Enum.SubTypeClose>} token found without matching opener ${PrintToken<Tokens.Enum.SubTypeOpen>} token.`>,
                    ],
                    [],
                  ]
                : // Case where a return delimiter is encountered and we should populate the second inner tuple from
                  // this point onwards
                  TokenOf<Char> extends Tokens.Enum.ReturnSeparator
                  ? SignatureToRawTuple<
                      Rest,
                      | keyof Tokens.ModifierTokenChars
                      | Tokens.Enum.ReturnSeparator,
                      AccumulatorIO.Return,
                      AccumulatedTypes
                    >
                  : // Case where a standard token that probably represents a type is encountered.
                    // `TsTypeFromChar` will return an error if the character does not match and is therefore unknown.
                    SignatureToRawTuple<
                      Rest,
                      RestrictedTokens,
                      CurrentAccumulator,
                      UpdateAccumulator<
                        AccumulatedTypes,
                        CurrentAccumulator,
                        [
                          ...AccumulatedTypes[CurrentAccumulator],
                          TsTypeFromChar<Char>,
                        ]
                      >
                    >
    : AccumulatedTypes

// Cant restrict < and > properly
// modifiers should not be allowed on return types
// do function types allow x or j
// disallow union inside < (or other way around)
// disallow : after :
// unknown token error
// error should surface to top level
// x and j broke cos of invalid crossover
// error in function subtype not surfacing as desired
// return type of o is messed up probably because it extends inbvalicv

type test = RawTupleToFn<SignatureToRawTuple<'sf<s>:s'>>

const lolz = 'asd' as unknown as test
const asddas = lolz(
  'test',
  () => {
    return '' as unknown as object
  },
  1,
)

type tes2t = SignatureToRawTuple<'sa<b>:sb'>
type lol = TsTypeFromChar<'v'>
