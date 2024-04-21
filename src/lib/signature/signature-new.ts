import type * as Errors from './errors.js'
import type * as Tokens from './tokens.js'

type NonArrayNonNullObject = {
  [key: string]: any
} & object

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
  [Tokens.Enum.ObjectType]: NonArrayNonNullObject
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
 *
 * This utility is somewhat special as it handles the only semantics in the signature
 * syntax that brings about an unbound lookahead.
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
  ? Tokens.TokenOf<Char> extends LToken
    ? SplitOnMatchingTerminator<
        Rest,
        LToken,
        RToken,
        `${Accumulated}${Char}`,
        [0, ...L],
        R
      >
    : Tokens.TokenOf<Char> extends RToken
      ? L['length'] extends [0, ...R]['length']
        ? '' extends Accumulated
          ? [
              Accumulated & {
                error: Errors.EmptyDelimitedStringError<LToken, RToken>
              },
              Rest,
            ]
          : [Accumulated, Rest]
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
  : [
      Accumulated & {
        error: Errors.UnterminatedOpenDelimiterError<LToken, RToken>
      },
      S,
    ]

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
  /** String that has already been processed up to this point. Used for better compile errors. */
  chomped: string
  /** Both the currently inferred TS parameter types and the return types */
  accumulators: [any[], any[]]
  /** Whether the param types or return types are currently being processed */
  currentAccumulator: AccumulatorIoType
  /**
   * Tokens which can not currently be used. Restrains certain tokens that are not allowed
   * in some contexts.
   */
  restrictedTokens: Tokens.Enum | never
  /**
   * A detailed parsing error. `undefined` if this is valid state.
   */
  error: string | undefined
}

type NewParserState<RestrictedTokens extends Tokens.Enum | never = never> = {
  chomped: ''
  accumulators: [[], []]
  currentAccumulator: AccumulatorIoType.Params
  restrictedTokens: RestrictedTokens
  error: undefined
}

type InvalidateState<State extends ParserStateType, ErrMsg extends string> = {
  chomped: State['chomped']
  accumulators: State['accumulators']
  currentAccumulator: State['currentAccumulator']
  restrictedTokens: State['restrictedTokens']
  error: `Error parsing signature. ${ErrMsg}.`
}

type AppendChomped<State extends ParserStateType, Chars extends string> = {
  chomped: `${State['chomped']}${Chars}`
  accumulators: State['accumulators']
  currentAccumulator: State['currentAccumulator']
  restrictedTokens: State['restrictedTokens']
  error: State['error']
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
  chomped: State['chomped']
  accumulators: State['currentAccumulator'] extends AccumulatorIoType.Params
    ? [NewAccumulator, State['accumulators'][AccumulatorIoType.Return]]
    : [State['accumulators'][AccumulatorIoType.Params], NewAccumulator]
  currentAccumulator: State['currentAccumulator']
  restrictedTokens: State['restrictedTokens']
  error: State['error']
}

type AppendCurrentAccumulator<
  State extends ParserStateType,
  Append,
  AppendedState = {
    chomped: State['chomped']
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
    restrictedTokens: State['restrictedTokens']
    error: State['error']
  },
> = State['currentAccumulator'] extends AccumulatorIoType.Return
  ? GetReturnAccumulator<State> extends [any]
    ? InvalidateState<State, Errors.MultipleReturnTypesError>
    : AppendedState
  : AppendedState

type SetCurrentAccumulator<
  State extends ParserStateType,
  To extends AccumulatorIoType,
> = {
  chomped: State['chomped']
  accumulators: State['accumulators']
  currentAccumulator: To
  restrictedTokens: State['restrictedTokens']
  error: State['error']
}

type IsStateInvalid<State extends ParserStateType> =
  GetError<State> extends string ? true : false

type ProcessModifier<
  State extends ParserStateType,
  ModifierToken extends keyof Tokens.ModifierTokenChars,
> =
  GetCurrentAccumulator<State> extends []
    ? InvalidateState<State, Errors.ModifierWithoutTypeError<ModifierToken>>
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
        ? State['currentAccumulator'] extends AccumulatorIoType.Return
          ? InvalidateState<
              State,
              Errors.ModifierOnReturnTypeError<ModifierToken>
            >
          : // Nothing to be done since JSonata makes sure the context type matches
            State
        : ModifierToken extends Tokens.Enum.OneOrMoreModifier
          ? State['currentAccumulator'] extends AccumulatorIoType.Return
            ? InvalidateState<
                State,
                Errors.ModifierOnReturnTypeError<ModifierToken>
              >
            : ReplaceCurrentAccumulator<
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
  parent: AppendChomped<
    Omit<State, 'error'> & { error: InnerState['error'] },
    InnerState['chomped']
  >
  child: InnerState
}

type ProcessSubTypedArray<
  State extends ParserStateType,
  SubTypeString extends string,
  StagedState extends StageChildStateType = StageChildState<
    State,
    AppendChomped<
      ProcessSig<
        SubTypeString,
        NewParserState<Tokens.Enum.JsonType | Tokens.Enum.AnyType>
      >,
      Tokens.CharOf<Tokens.Enum.SubTypeClose>
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
    AppendChomped<
      ProcessSig<SubTypeString>,
      Tokens.CharOf<Tokens.Enum.SubTypeClose>
    >
  >,
> = AppendCurrentAccumulator<
  StagedState['parent'],
  StateToFn<StagedState['child']>
>

type ProcessSubTypedType<
  State extends ParserStateType,
  TypeToken extends keyof Tokens.GenericTypeTokenChars,
  SubTypeString extends string & { error?: string },
> = SubTypeString['error'] extends string
  ? InvalidateState<State, SubTypeString['error']>
  : TypeToken extends Tokens.Enum.ArrayType
    ? ProcessSubTypedArray<State, SubTypeString>
    : TypeToken extends Tokens.Enum.FunctionType
      ? ProcessSubTypedFunction<State, SubTypeString>
      : never

type ProcessUnion<
  State extends ParserStateType,
  UnionString extends string & { error?: string },
  StagedState extends StageChildStateType = StageChildState<
    State,
    AppendChomped<
      ProcessSig<
        UnionString,
        NewParserState<
          keyof Tokens.ModifierTokenChars | keyof Tokens.DelimiterTokenChars
        >
      >,
      Tokens.CharOf<Tokens.Enum.UnionClose>
    >
  >,
> = UnionString['error'] extends string
  ? InvalidateState<State, UnionString['error']>
  : AppendCurrentAccumulator<
      StagedState['parent'],
      GetParamAccumulator<StagedState['child']>[number]
    >

type ProcessReturnDelimiter<State extends ParserStateType> =
  State['currentAccumulator'] extends AccumulatorIoType.Return
    ? InvalidateState<State, Errors.InvalidReturnDelimiterError>
    : SetCurrentAccumulator<State, AccumulatorIoType.Return>

type ProcessSingleType<
  State extends ParserStateType,
  TypeToken extends keyof TypeTokenMappings,
> = AppendCurrentAccumulator<State, TypeTokenMappings[TypeToken]>

type StateToFn<State extends ParserStateType> =
  GetReturnAccumulator<State> extends [any, ...any[]]
    ? (...args: GetParamAccumulator<State>) => GetReturnAccumulator<State>[0]
    : (...args: GetParamAccumulator<State>) => any

type WithCheckedRestrictions<
  State extends ParserStateType,
  Token extends Tokens.Enum,
> = Token extends State['restrictedTokens']
  ? InvalidateState<State, Errors.RestrictedTokenError<Token>>
  : State

type ProcessSigChar<
  Char extends string,
  Rest extends string,
  State extends ParserStateType,
> =
  Tokens.TokenOf<Char> extends State['restrictedTokens']
    ? InvalidateState<State, Errors.RestrictedTokenError<Tokens.TokenOf<Char>>>
    : // Case where the token represents a modifier
      Tokens.TokenOf<Char> extends keyof Tokens.ModifierTokenChars
      ? ProcessSig<Rest, ProcessModifier<State, Tokens.TokenOf<Char>>>
      : // Case where a parameterisable token is encountered
        Tokens.TokenOf<Char> extends keyof Tokens.GenericTypeTokenChars
        ? // Case where a parameterisable token is encountered, and a parameter is specified
          Rest extends `${Tokens.CharOf<Tokens.Enum.SubTypeOpen>}${infer AfterTypeParamOpen}`
          ? ProcessSig<
              SplitOnSubTypeTerminator<AfterTypeParamOpen>[1],
              ProcessSubTypedType<
                AppendChomped<
                  State,
                  `${Tokens.CharOf<Tokens.Enum.SubTypeOpen>}`
                >,
                Tokens.TokenOf<Char>,
                SplitOnSubTypeTerminator<AfterTypeParamOpen>[0]
              >
            >
          : // Case where a parameterisable symbol is used without any parameters.
            ProcessSig<Rest, ProcessSingleType<State, Tokens.TokenOf<Char>>>
        : // Case where a union is encountered
          Tokens.TokenOf<Char> extends Tokens.Enum.UnionOpen
          ? ProcessSig<
              SplitOnUnionTerminator<Rest>[1],
              ProcessUnion<State, SplitOnUnionTerminator<Rest>[0]>
            > // Case where a return delimiter is encountered and we should populate the second inner tuple from
          : // this point onwards
            Tokens.TokenOf<Char> extends Tokens.Enum.ReturnSeparator
            ? ProcessSig<Rest, ProcessReturnDelimiter<State>> // Case where a token representing a single type is encountered
            : Tokens.TokenOf<Char> extends keyof TypeTokenMappings
              ? ProcessSig<Rest, ProcessSingleType<State, Tokens.TokenOf<Char>>>
              : // Case where a sub type open token is encountered, but not following a non parameterisable type.
                // Valid uses of this token are captured in an earlier case.
                Tokens.TokenOf<Char> extends Tokens.Enum.SubTypeOpen
                ? InvalidateState<State, Errors.InvalidSubTypeOpenError>
                : // Case where a sub type close token is encountered, but there was no matching open token.
                  // Cases where there is an open token are swallowed as part of `SplitOnSubTypeTerminator` in an earlier case.
                  Tokens.TokenOf<Char> extends Tokens.Enum.SubTypeClose
                  ? InvalidateState<
                      State,
                      Errors.UnmatchedCloseDelimiterError<
                        Tokens.Enum.SubTypeOpen,
                        Tokens.Enum.SubTypeClose
                      >
                    >
                  : // Case where a union close token is encountered, but there was no matching open token.
                    // Cases where there is an open token are swallowed as part of `SplitOnSubTypeTerminator` in an earlier case.
                    Tokens.TokenOf<Char> extends Tokens.Enum.UnionClose
                    ? InvalidateState<
                        State,
                        Errors.UnmatchedCloseDelimiterError<
                          Tokens.Enum.UnionOpen,
                          Tokens.Enum.UnionClose
                        >
                      >
                    : // Unknown character encountered
                      InvalidateState<State, Errors.UnknownCharError<Char>>

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
type ProcessSig<
  S extends string,
  State extends ParserStateType = NewParserState,
> =
  IsStateInvalid<State> extends true
    ? // Exit early if the state is invalid
      State
    : // Extract the next character to process
      S extends `${infer Char}${infer Rest}`
      ? ProcessSigChar<Char, Rest, AppendChomped<State, Char>>
      : State

type UnwrapSignature<S extends string> =
  S extends `${Tokens.CharOf<Tokens.Enum.SubTypeOpen>}${infer Inner}${Tokens.CharOf<Tokens.Enum.SubTypeClose>}`
    ? Inner
    : undefined

type ParseSignature<
  S extends string,
  UnwrappedSignature extends string | undefined = UnwrapSignature<S>,
> = UnwrappedSignature extends string
  ? IsStateInvalid<ProcessSig<UnwrappedSignature>> extends true
    ? Errors.FormatError<
        ProcessSig<UnwrappedSignature>['error'],
        UnwrappedSignature,
        ProcessSig<UnwrappedSignature>['chomped']
      >
    : StateToFn<ProcessSig<UnwrappedSignature>>
  : [Errors.invalid<Errors.SignatureNotWrappedError>]

// Cant restrict < and > properly
// do function types allow x or j
// disallow union inside < (or other way around)
// error in function subtype not surfacing as desired

type test = ParseSignature<'<n-s?s?:s>'>

type lol = ProcessSig<'sssd'>

const lolz = 'asd' as unknown as test
const asddas = lolz(
  'test',
  () => {
    return '' as unknown as object
  },
  1,
)

type tes2t = ProcessSig<'sa<b>:sb'>
