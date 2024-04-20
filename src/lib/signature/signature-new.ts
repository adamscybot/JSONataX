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

type AppendUnionToLastType<T extends any[], U> = T extends [...infer R, infer L]
  ? [...R, L | U]
  : never

type SpreadLastType<T extends any[]> = T extends [...infer Rest, infer Last]
  ? [...Rest, Last, ...Last[]]
  : never

/**
 * Fixed position data for accessing data in the Raw Representation
 * Tuple.
 **/
const enum AccumulatorIoType {
  Params = 0,
  Return = 1,
}

type ParserStateType = {
  accumulators: [any[], any[]]
  currentAccumulator: AccumulatorIoType
  error: invalid<any> | undefined
}

type DefaultParserState = {
  accumulators: [[], []]
  currentAccumulator: AccumulatorIoType.Params
  error: undefined
}

type InvalidateState<State extends ParserStateType, ErrMsg extends string> = {
  accumulators: State['accumulators']
  currentAccumulator: State['currentAccumulator']
  error: invalid<ErrMsg>
}

type GetCurrentAccumulator<State extends ParserStateType> =
  State['accumulators'][State['currentAccumulator']]

type GetParamAccumulator<State extends ParserStateType> =
  State['accumulators'][AccumulatorIoType.Params]

type GetReturnAccumulator<State extends ParserStateType> =
  State['accumulators'][AccumulatorIoType.Return]

type GetError<State extends ParserStateType> = State['error']

type ReplaceCurrentAccumulator<
  State extends ParserStateType,
  NewAccumulator extends any[],
> = {
  accumulators: State['currentAccumulator'] extends AccumulatorIoType.Params
    ? [NewAccumulator, State['accumulators'][AccumulatorIoType.Return]]
    : [State['accumulators'][AccumulatorIoType.Params], NewAccumulator]
  currentAccumulator: State['currentAccumulator']
  error: State['error']
}

type AppendCurrentAccumulator<State extends ParserStateType, Append> = {
  accumulators: State['currentAccumulator'] extends AccumulatorIoType.Params
    ? [
        [...State['accumulators'][AccumulatorIoType.Params], Append],
        State['accumulators'][AccumulatorIoType.Return],
      ]
    : [
        State['accumulators'][AccumulatorIoType.Params],
        [...State['accumulators'][AccumulatorIoType.Return], Append],
      ]
  currentAccumulator: State['currentAccumulator']
  error: State['error']
}

type SetCurrentAccumulator<
  State extends ParserStateType,
  To extends AccumulatorIoType,
> = Omit<State, 'currentAccumulator'> & { currentAccumulator: To }

type IsStateInvalid<State extends ParserStateType> =
  invalid<any> extends GetError<State> ? true : false

type ProcessModifier<
  State extends ParserStateType,
  ModifierToken extends keyof Tokens.ModifierTokenChars,
> =
  GetCurrentAccumulator<State> extends []
    ? InvalidateState<
        State,
        `${PrintToken<ModifierToken>} can only appear after a type token`
      >
    : ModifierToken extends Tokens.Enum.OptionalModifier
      ? // We add explicit undefined here, but `ParamsFromSignature` adds it to all args anyway later
        // because any arg is allowed to be set to `undefined` explicitly and JSonata does not currently
        // provide a way to disambiguate. This is still needed for correctly typing lambdas such that they
        // are called from the handler in a valid way.
        ReplaceCurrentAccumulator<
          State,
          AppendUnionToLastType<GetCurrentAccumulator<State>, undefined>
        >
      : ModifierToken extends Tokens.Enum.ContextAwareModifier
        ? State // Nothing to be done since JSonata makes sure the context type matches
        : ModifierToken extends Tokens.Enum.OneOrMoreModifier
          ? ReplaceCurrentAccumulator<
              State,
              SpreadLastType<GetCurrentAccumulator<State>>
            >
          : never

type StageChildStateType = {
  parent: ParserStateType
  child: ParserStateType
}

type StageChildState<
  State extends ParserStateType,
  InnerState extends ParserStateType,
> = {
  parent: Omit<State, 'error'> & { error: InnerState['error'] }
  child: InnerState
}

type ProcessSubTypedArray<
  State extends ParserStateType,
  SubTypeString extends string,
  StagedState extends StageChildStateType = StageChildState<
    State,
    SignatureToRawTuple<
      FirstChar<SubTypeString>,
      Tokens.Enum.JsonType | Tokens.Enum.AnyType
    >
  >,
> = AppendCurrentAccumulator<
  StagedState['parent'],
  Array<GetParamAccumulator<StagedState['child']>[0]>
>

type ProcessSubTypedFunction<
  State extends ParserStateType,
  SubTypeString extends string,
  StagedState extends StageChildStateType = StageChildState<
    State,
    SignatureToRawTuple<SubTypeString>
  >,
> =
  GetReturnAccumulator<StagedState['child']> extends [any, ...any[]]
    ? GetReturnAccumulator<StagedState['child']> extends [any, any, ...any[]]
      ? InvalidateState<
          AppendCurrentAccumulator<
            StagedState['parent'],
            (...args: unknown[]) => unknown
          >,
          'Only one return token can be specified'
        >
      : AppendCurrentAccumulator<
          StagedState['parent'],
          (
            ...args: GetParamAccumulator<StagedState['child']>
          ) => GetReturnAccumulator<StagedState['child']>[0]
        >
    : AppendCurrentAccumulator<
        StagedState['parent'],
        (...args: GetParamAccumulator<StagedState['child']>) => any
      >

type ProcessSubTypedType<
  State extends ParserStateType,
  TypeToken extends keyof Tokens.GenericTypeTokenChars,
  SubTypeString extends string,
> = TypeToken extends Tokens.Enum.ArrayType
  ? ProcessSubTypedArray<State, SubTypeString>
  : TypeToken extends Tokens.Enum.FunctionType
    ? ProcessSubTypedFunction<State, SubTypeString>
    : never

type ProcessUnion<
  State extends ParserStateType,
  UnionString extends string,
  StagedState extends StageChildStateType = StageChildState<
    State,
    SignatureToRawTuple<
      UnionString,
      keyof Tokens.ModifierTokenChars | keyof Tokens.DelimiterTokenChars
    >
  >,
> = AppendCurrentAccumulator<
  StagedState['parent'],
  GetParamAccumulator<StagedState['child']>[number]
>

type ProcessReturnDelimiter<State extends ParserStateType> =
  SetCurrentAccumulator<State, AccumulatorIoType.Return>

type ProcessSingleType<
  State extends ParserStateType,
  TypeToken extends keyof TypeTokenMappings,
> = AppendCurrentAccumulator<State, TypeTokenMappings[TypeToken]>

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
  State extends ParserStateType = DefaultParserState,
> =
  IsStateInvalid<State> extends true
    ? State
    : // Extract the next character to process
      S extends `${infer Char}${infer Rest}`
      ? TokenOf<Char> extends RestrictedTokens
        ? InvalidateState<
            State,
            `Token ${PrintToken<TokenOf<Char>>} can not be used here.`
          >
        : // Case where the token represents a modifier
          TokenOf<Char> extends keyof Tokens.ModifierTokenChars
          ? SignatureToRawTuple<
              Rest,
              RestrictedTokens,
              ProcessModifier<State, TokenOf<Char>>
            >
          : // Case where a parameterisable token is encountered
            TokenOf<Char> extends keyof Tokens.GenericTypeTokenChars
            ? // Case where a parameterisable token is encountered, and a parameter is specified
              Rest extends `${CharOf<Tokens.Enum.SubTypeOpen>}${infer AfterTypeParamOpen}`
              ? SignatureToRawTuple<
                  SplitOnSubTypeTerminator<AfterTypeParamOpen>[1],
                  RestrictedTokens,
                  ProcessSubTypedType<
                    State,
                    TokenOf<Char>,
                    SplitOnSubTypeTerminator<AfterTypeParamOpen>[0]
                  >
                >
              : // Case where a parameterisable symbol is used without any parameters.
                SignatureToRawTuple<
                  Rest,
                  RestrictedTokens,
                  ProcessSingleType<State, TokenOf<Char>>
                >
            : // Case where a union is encountered
              TokenOf<Char> extends Tokens.Enum.UnionOpen
              ? SignatureToRawTuple<
                  SplitOnUnionTerminator<Rest>[1],
                  RestrictedTokens,
                  ProcessUnion<State, SplitOnUnionTerminator<Rest>[0]>
                >
              : // Case where a sub type open token is encountered, but following a non parameterisable type.
                // Valid uses of this token are captured in an earlier case.
                TokenOf<Char> extends Tokens.Enum.SubTypeOpen
                ? InvalidateState<
                    State,
                    `Token ${PrintToken<Tokens.Enum.SubTypeOpen>} can only be specified immediately after ${PrintToken<Tokens.Enum.ArrayType>} or ${PrintToken<Tokens.Enum.FunctionType>} tokens.`
                  >
                : // Case where a sub type close token is encountered, but there was no matching open token.
                  // Cases where there is an open token are swallowed as part of `SplitOnSubTypeTerminator` in an earlier case.
                  TokenOf<Char> extends Tokens.Enum.SubTypeClose
                  ? InvalidateState<
                      State,
                      `Token ${PrintToken<Tokens.Enum.SubTypeClose>} token found without matching opener ${PrintToken<Tokens.Enum.SubTypeOpen>} token.`
                    >
                  : // Case where a return delimiter is encountered and we should populate the second inner tuple from
                    // this point onwards
                    TokenOf<Char> extends Tokens.Enum.ReturnSeparator
                    ? SignatureToRawTuple<
                        Rest,
                        | keyof Tokens.ModifierTokenChars
                        | Tokens.Enum.ReturnSeparator,
                        ProcessReturnDelimiter<State>
                      >
                    : // Case where a token representing a single type is encountered
                      TokenOf<Char> extends keyof TypeTokenMappings
                      ? SignatureToRawTuple<
                          Rest,
                          RestrictedTokens,
                          ProcessSingleType<State, TokenOf<Char>>
                        >
                      : // Unknown character encountered
                        InvalidateState<
                          State,
                          `Character '${Char}' is not a valid type token.`
                        >
      : State

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

type test = SignatureToRawTuple<'g'>

const lolz = 'asd' as unknown as test
const asddas = lolz(
  'test',
  () => {
    return '' as unknown as object
  },
  1,
)

type tes2t = SignatureToRawTuple<'sa<b>:sb'>
