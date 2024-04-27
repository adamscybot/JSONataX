import type { Focus } from 'jsonata'
import type * as Errors from './errors.js'
import type * as Tokens from './tokens.js'
import type {
  AppendUnionToLastType,
  MakeNonFnsOptional,
  SpreadLastType,
} from './utils.js'

/**
 * Mappings between tokens that represent types and the underlying
 * TS types for those tokens.
 */
type TypeTokenMappings = {
  // Fallbacks for array or function signatures without subtypes defined
  [Tokens.Enum.ArrayType]: Array<any>
  [Tokens.Enum.FunctionType]: (...args: any) => any

  // Plain single types
  [Tokens.Enum.BooleanType]: boolean
  [Tokens.Enum.NumberType]: number
  [Tokens.Enum.StringType]: string
  [Tokens.Enum.NullType]: null
  [Tokens.Enum.ObjectType]: Record<keyof any, unknown> // JSONata Object token does not represent arrays or null
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
      ? // When the L/R tracking tuples are balanced, the match has been found.
        L['length'] extends [0, ...R]['length']
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

/**
 * Fixed position data for accessing data in the parser state accumulators tuple.
 **/
const enum AccumulatorIoType {
  Params = 0,
  Return = 1,
}

/**
 * A type which is passed around during the parser recursion to track various
 * properties that are vital for the parser function.
 */
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
  /**  A detailed parsing error. `undefined` if this is valid state. */
  error: string | undefined
}

/**
 * Initialised a new parser state. Used when the parser must run over a new signature string
 * (e.g. subtypes and unions) with a fresh context.
 */
type NewParserState<RestrictedTokens extends Tokens.Enum | never = never> = {
  chomped: ''
  accumulators: [[], []]
  currentAccumulator: AccumulatorIoType.Params
  restrictedTokens: RestrictedTokens
  error: undefined
}

/**
 * Given some parser state, add an error to it.
 *
 * @remarks
 * Using Omit/Pick here causes a deep instantiation that in turn causes poor intellisense.
 */
type InvalidateState<State extends ParserStateType, ErrMsg extends string> = {
  chomped: State['chomped']
  accumulators: State['accumulators']
  currentAccumulator: State['currentAccumulator']
  restrictedTokens: State['restrictedTokens']
  error: `Error parsing signature. ${ErrMsg}.`
}

/**
 * Given some parser state, add a character to the `chomped` string, indicating
 * that that char has been (or just started to be) processed.
 *
 * @remarks
 * Using Omit/Pick here causes a deep instantiation that in turn causes poor intellisense.
 */
type AppendChomped<State extends ParserStateType, Chars extends string> = {
  chomped: `${State['chomped']}${Chars}`
  accumulators: State['accumulators']
  currentAccumulator: State['currentAccumulator']
  restrictedTokens: State['restrictedTokens']
  error: State['error']
}

/**
 * Returns either the params or return type accumulator tuple depending on the current
 * active accumulator in the parser state.
 */
type GetCurrentAccumulator<State extends ParserStateType> =
  State['accumulators'][State['currentAccumulator']]

/**
 * Returns the params accumulator tuple containing the param types up to current point.
 */
type GetParamAccumulator<State extends ParserStateType> =
  State['accumulators'][AccumulatorIoType.Params]

/**
 * Returns the return accumulator tuple containing the return types up to current point.
 */
type GetReturnAccumulator<State extends ParserStateType> =
  State['accumulators'][AccumulatorIoType.Return]

/**
 * Returns the error in the passed parser state. `undefined` if no error.
 */
type GetError<State extends ParserStateType> = State['error']

/**
 * Given a parser state and a new accumulator tuple, replaces the current accumulator tuple with
 * the new one.
 *
 * @remarks
 * Using Omit/Pick here causes a deep instantiation that in turn causes poor intellisense.
 */
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

/**
 * Given a parser state and a type, adds that type onto the currently active accumulator tuple.
 *
 * @remarks
 * Using Omit/Pick here causes a deep instantiation that in turn causes poor intellisense.
 */
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

/**
 * Change the active accumulator in the passed starter state to a provided one.
 * Used for when `:` is encountered and subsequent types are therefore defining the
 * return types.
 */
type SwitchCurrentAccumulatorPointer<
  State extends ParserStateType,
  To extends AccumulatorIoType,
> = {
  chomped: State['chomped']
  accumulators: State['accumulators']
  currentAccumulator: To
  restrictedTokens: State['restrictedTokens']
  error: State['error']
}

/**
 * Returns `true` if the passed state is invalid and `false` is it is valid.
 */
type IsStateInvalid<State extends ParserStateType> =
  GetError<State> extends string ? true : false

/**
 * Util for narrowing the return type of `TokenOf` to only valid matching tokens.
 */
type ValidToken<Token extends Tokens.Enum | false> = Token extends Tokens.Enum
  ? Token
  : never

/**
 * Returns `true` if the passed token is invalid in the current parser state context.
 */
type IsTokenRestricted<
  State extends ParserStateType,
  Token extends Tokens.Enum | false,
> = Token extends State['restrictedTokens'] ? true : false

/**
 * Given a parser state and a modifier token, updates that parser state such that the types represent
 * the additional behaviours that modifier represents.
 */
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

/**
 * Helper that hoists errors from a child parser state context to the parent,
 * as well as appending the child chomped chars to the parent parser state.
 */
type StageChildState<
  State extends ParserStateType,
  ChildState extends ParserStateType,
  TerminatorChar extends Tokens.Enum,
  HoistedParentState extends ParserStateType = AppendChomped<
    Omit<State, 'error'> & { error: ChildState['error'] },
    ChildState['chomped']
  >,
> = {
  parent: // If the child state is valid, we can also append the terminator that represents
  // the end of the signature the child state represents to the parents `chomped`. Otherwise,
  // we avoid this as an error has occurred before that terminator.
  IsStateInvalid<ChildState> extends true
    ? HoistedParentState
    : AppendChomped<HoistedParentState, Tokens.CharOf<TerminatorChar>>
  child: ChildState
}

/**
 * Given a parser state and a signature string that represents an array subtype, return
 * the parser state with the new array type appended to the current accumulator tuple.
 */
type ProcessSubTypedArray<
  State extends ParserStateType,
  SubTypeString extends string,
  StagedState extends StageChildStateType = StageChildState<
    State,
    ProcessSig<
      SubTypeString,
      NewParserState<Tokens.Enum.JsonType | Tokens.Enum.AnyType>
    >,
    Tokens.Enum.SubTypeClose
  >,
> = AppendCurrentAccumulator<
  StagedState['parent'],
  Array<GetParamAccumulator<StagedState['child']>[0]>
>

/**
 * Given a parser state and a signature string that represents a function subtype, return
 * the parser state with the new function type appended to the current accumulator tuple.
 */
type ProcessSubTypedFunction<
  State extends ParserStateType,
  SubTypeString extends string,
  StagedState extends StageChildStateType = StageChildState<
    State,
    ProcessSig<SubTypeString>,
    Tokens.Enum.SubTypeClose
  >,
> = AppendCurrentAccumulator<
  StagedState['parent'],
  StateToLambdaFn<StagedState['child']>
>

/**
 * Given a parser state and a signature string that represents a function or array subtype, return
 * the parser state with the new function or array type appended to the current accumulator tuple.
 */
type ProcessSubTypedType<
  State extends ParserStateType,
  TypeToken extends keyof Tokens.GenericTypeTokenChars,
  SubTypeString extends string & { error?: string },
> = SubTypeString['error'] extends string
  ? // Case where the lookahead in `SplitOnMatchingTerminator` failed to find the terminating token.
    InvalidateState<State, SubTypeString['error']>
  : TypeToken extends Tokens.Enum.ArrayType
    ? ProcessSubTypedArray<State, SubTypeString>
    : TypeToken extends Tokens.Enum.FunctionType
      ? ProcessSubTypedFunction<State, SubTypeString>
      : never

/**
 * Given a parser state and a signature string that represents the contents of a union, return
 * the parser state with the new union type appended to the current accumulator tuple.
 */
type ProcessUnion<
  State extends ParserStateType,
  UnionString extends string & { error?: string },
  StagedState extends StageChildStateType = StageChildState<
    State,
    ProcessSig<
      UnionString,
      NewParserState<
        | keyof Tokens.ModifierTokenChars
        | keyof Tokens.DelimiterTokenChars
        // Current signature parser does not support compound types in unions
        | Tokens.Enum.JsonType
        | Tokens.Enum.AnyType
      >
    >,
    Tokens.Enum.UnionClose
  >,
> = UnionString['error'] extends string
  ? // Case where the lookahead in `SplitOnMatchingTerminator` failed to find the terminating token.
    InvalidateState<State, UnionString['error']>
  : AppendCurrentAccumulator<
      StagedState['parent'],
      GetParamAccumulator<StagedState['child']>[number]
    >

/**
 * Given a parser state, return a modified state that represents that the return
 * delimiter token has been processed (switch the current accumulator to the return
 * accumulator).
 */
type ProcessReturnDelimiter<State extends ParserStateType> =
  State['currentAccumulator'] extends AccumulatorIoType.Return
    ? InvalidateState<State, Errors.InvalidReturnDelimiterError>
    : SwitchCurrentAccumulatorPointer<State, AccumulatorIoType.Return>

/**
 * Given a parser state and a type token that represents a single plain type, return a
 * modified state that has has the type that represents that token appended to the current
 * accumulator.
 */
type ProcessSingleType<
  State extends ParserStateType,
  TypeToken extends keyof TypeTokenMappings,
> = AppendCurrentAccumulator<State, TypeTokenMappings[TypeToken]>

/**
 * Given some parser state, return a function that represents it, where
 * the params are derived from the param accumulator types and the return type
 * is derived from the return accumulator.
 */
type StateToRegisteredFn<State extends ParserStateType> =
  IsStateInvalid<State> extends true
    ? (this: Focus, ...args: unknown[]) => unknown
    : GetReturnAccumulator<State> extends [any, ...any[]]
      ? (
          this: Focus,
          ...args: MakeNonFnsOptional<GetParamAccumulator<State>>
        ) =>
          | GetReturnAccumulator<State>[0]
          | Promise<GetReturnAccumulator<State>[0]>
      : // If no return type specified, assume `any`
        (
          this: Focus,
          ...args: MakeNonFnsOptional<GetParamAccumulator<State>>
        ) => any

/** @see {@link unsafe_lambdaRet} */
declare const __targetType: unique symbol

/** @see {@link unsafe_lambdaRet} */
export type LambdaRet<DeclaredType> = Promise<unknown> & {
  [__targetType]: DeclaredType
}

/**
 * A utility function for TS module authors. Given the return value of a lambda
 * call made inside a module function body, returns that same value
 * but type cast to the specified return type in the function subtype
 * signature.
 *
 * **CAUTION:** Does not actually check the type matches the signature. In most cases
 * you should type check the return value yourself as necessary. This is to be
 * used for cases where you don't want to incur the cost and accept lower
 * type-safety.
 *
 * @remarks
 * The signature allows functions to be defined as parameters
 * (lambdas) and to specify the return type token for those lambdas.
 * This is for the future and is not currently actually checked by the
 * signature validator.
 *
 * Therefore, return types declared for lambdas actually surface as
 * `unknown`s meaning the dev needs to cast them or type narrow them
 * to ascertain their true type.
 *
 * However, we wrap this `unknown` type with the "declared" return type
 * such that the dev can opt out of type safety and assume it is the "declared" type
 * by passing it into this helper method in the runtime.
 *
 * @example
 * This code will have a compile error since the call to `lambda` will
 * return an `unknown` which does not match the top-level declared return type of `string`.
 *
 * ```
 * import { defineModule } from 'modular-jsonata'
 
 * const module = defineModule('example').export(
 *   'testFn',
 *   '<f<n:s>:s>',
 *   function (lambda) { // Type 'unknown' is not assignable to type 'string'. ts(2345)
 *     return lambda(5)
 *   },
 * )
 * ```
 *
 * By using `unsafe_lambdaRet`, the error goes away since the lambda return value is
 * (unsafely) assumed to be what it is declared as in the signature (`string`). Since this
 * also matches the top-level declared return type.
 *
 * ```
 * import { defineModule, unsafe_lambdaRet } from 'modular-jsonata'
 * const module = defineModule('example').export(
 *   'testFn',
 *   '<f<n:s>:s>',
 *   function (lambda) {
 *     return unsafe_lambdaRet(lambda(5))
 *   },
 * )
 * ```
 *
 * @param value - The return value from a lambda, where that lambda is being called
 * from a module function body.
 * @returns The same `value`, but force-cast to the type it has been declared as in the signature.
 */
export function unsafe_lambdaRet<DeclaredType>(
  value: LambdaRet<DeclaredType>,
): DeclaredType {
  return value as unknown as DeclaredType
}

/**
 * Given some parser state, return a function that represents that respects
 * the semantics of JSONata lambdas, where the params are derived from the
 * param accumulator types and the return type is derived from the return accumulator.
 */
type StateToLambdaFn<State extends ParserStateType> =
  IsStateInvalid<State> extends true
    ? (...args: unknown[]) => Promise<unknown>
    : GetReturnAccumulator<State> extends [any, ...any[]]
      ? (
          ...args: MakeNonFnsOptional<GetParamAccumulator<State>>
        ) => LambdaRet<Promise<GetReturnAccumulator<State>[0]>>
      : // If no return type specified, assume `unknown`
        (
          ...args: MakeNonFnsOptional<GetParamAccumulator<State>>
        ) => Promise<unknown>

/**
 * The recursive core of the parser. Given a character, the rest of the string
 * and the current parser state, process that character and modify the parser state
 * accordingly.
 */
type ProcessSigChar<
  Char extends string,
  Rest extends string,
  State extends ParserStateType,
  Token extends Tokens.Enum | false = Tokens.TokenOf<Char>,
> =
  IsTokenRestricted<State, Token> extends true
    ? InvalidateState<State, Errors.RestrictedTokenError<ValidToken<Token>>>
    : // Case where the token represents a modifier
      Token extends keyof Tokens.ModifierTokenChars
      ? ProcessSig<Rest, ProcessModifier<State, Token>>
      : // Case where a parameterisable token is encountered
        Token extends keyof Tokens.GenericTypeTokenChars
        ? // Case where a parameterisable token is encountered, and a parameter is specified
          Rest extends `${Tokens.CharOf<Tokens.Enum.SubTypeOpen>}${infer AfterTypeParamOpen}`
          ? // Since this part of the parser looks ahead one char to check for a subtype, we must
            // check that char against the restricted tokens.
            IsTokenRestricted<State, Tokens.Enum.SubTypeOpen> extends true
            ? InvalidateState<
                AppendChomped<State, Tokens.CharOf<Tokens.Enum.SubTypeOpen>>,
                Errors.RestrictedTokenError<Tokens.Enum.SubTypeOpen>
              >
            : ProcessSig<
                SplitOnSubTypeTerminator<AfterTypeParamOpen>[1],
                ProcessSubTypedType<
                  AppendChomped<State, Tokens.CharOf<Tokens.Enum.SubTypeOpen>>,
                  Token,
                  SplitOnSubTypeTerminator<AfterTypeParamOpen>[0]
                >
              >
          : // Case where a parameterisable symbol is used without any parameters.
            ProcessSig<Rest, ProcessSingleType<State, Token>>
        : // Case where a union is encountered
          Token extends Tokens.Enum.UnionOpen
          ? ProcessSig<
              SplitOnUnionTerminator<Rest>[1],
              ProcessUnion<State, SplitOnUnionTerminator<Rest>[0]>
            >
          : // Case where a return delimiter is encountered and we should populate the second inner tuple from
            // this point onwards
            Token extends Tokens.Enum.ReturnSeparator
            ? ProcessSig<Rest, ProcessReturnDelimiter<State>>
            : Token extends keyof TypeTokenMappings
              ? // Case where a token representing a single type is encountered
                ProcessSig<Rest, ProcessSingleType<State, Token>>
              : // Case where a sub type open token is encountered, but not following a non parameterisable type.
                // Valid uses of this token are captured in an earlier case.
                Token extends Tokens.Enum.SubTypeOpen
                ? InvalidateState<State, Errors.InvalidSubTypeOpenError>
                : // Case where a sub type close token is encountered, but there was no matching open token.
                  // Cases where there is an open token are swallowed as part of `SplitOnSubTypeTerminator` in an earlier case.
                  Token extends Tokens.Enum.SubTypeClose
                  ? InvalidateState<
                      State,
                      Errors.UnmatchedCloseDelimiterError<
                        Tokens.Enum.SubTypeOpen,
                        Tokens.Enum.SubTypeClose
                      >
                    >
                  : // Case where a union close token is encountered, but there was no matching open token.
                    // Cases where there is an open token are swallowed as part of `SplitOnSubTypeTerminator` in an earlier case.
                    Token extends Tokens.Enum.UnionClose
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
 * Given the inner part of a signature string, return the final parser state after all chars are processed.
 * Exits early if a parser error is encountered.
 *
 * @see {@link ProcessSigChar}
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

/** Given a wrapped signature string (inside `<` and `>`) return the unwrapped ("inner") string. */
type UnwrapSignature<S extends string> =
  S extends `${Tokens.CharOf<Tokens.Enum.SubTypeOpen>}${infer Inner}${Tokens.CharOf<Tokens.Enum.SubTypeClose>}`
    ? Inner
    : undefined

/**
 * Given a signature string, return the typed function that represents it. In an error scenario (signature invalid)
 * it will return a function type that has `unknown` arguments and return type.
 *
 *
 * @example Valid signature string.
 * ```
 * // ExampleFn equal to `(this: Focus, args_0: string | undefined, args_1: string | ((...args: any) => any) | undefined) => boolean | Promise<boolean>`
 * type ExampleFn = ImplFromSignature<'<s-(sf):b>'>
 * ```
 *
 * @example Invalid signature string (subtype used in union).
 * ```
 * // ExampleErr equal to `(this: Focus, ...args: unknown[]) => unknown`
 * type ExampleErr = ImplFromSignature<'<s-(sf<s>):b>'>
 * ```
 *
 * @typeParam S - The signature string
 * @typeParam UnwrappedSignature - Internal type representing unwrapped ("inner") part of the signature string. Leave defaulted.
 */
export type ImplFromSignature<
  S extends string,
  UnwrappedSignature extends string | undefined = UnwrapSignature<S>,
> = UnwrappedSignature extends string
  ? StateToRegisteredFn<ProcessSig<UnwrappedSignature>>
  : (this: Focus, ...args: unknown[]) => unknown

/**
 * Given a signature string, return the same string only if it is valid. In the invalid scenario, it returns an error type
 * detailing the problem.
 *
 *
 * @example Valid signature string.
 * ```
 * // ExampleSig equal to `<s-(sf):b>`
 * type ExampleSig = ValidSignature<'<s-(sf):b>'>
 * ```
 *
 * @example Invalid signature string (subtype used in union).
 * ```
 * // ExampleSig equal to `Errors.invalid<"⛔ Error parsing signature. Token SubTypeOpen '<' can not be used here. Found at: <s-(sf<💥s>):b> ">`
 * type ExampleSig = ValidSignature<'<s-(sf<s>):b>'>
 * ```
 *
 * @typeParam S - The signature string
 * @typeParam UnwrappedSignature - Internal type representing unwrapped ("inner") part of the signature string. Leave defaulted.
 */
export type ValidSignature<
  S extends string,
  UnwrappedSignature extends string | undefined = UnwrapSignature<S>,
> = UnwrappedSignature extends string
  ? IsStateInvalid<ProcessSig<UnwrappedSignature>> extends true
    ? ProcessSig<UnwrappedSignature>['error'] extends undefined
      ? never
      : Errors.invalid<
          UnwrappedSignature extends `${ProcessSig<UnwrappedSignature>['chomped']}${infer Rest}`
            ? `⛔ ${`${ProcessSig<UnwrappedSignature>['error']} Found at: <${ProcessSig<UnwrappedSignature>['chomped']}💥`}${Rest}> `
            : `⛔ ${`${ProcessSig<UnwrappedSignature>['error']} Found at: <${ProcessSig<UnwrappedSignature>['chomped']}💥`} `
        >
    : S
  : Errors.invalid<Errors.SignatureNotWrappedError>

// Temp examples showing all types working
// type JsonataFn_sum = ImplFromSignature<'<a<n>:n>'>
// type JsonataFn_count = ImplFromSignature<'<a:n>'>
// type JsonataFn_max = ImplFromSignature<'<a<n>:n>'>
// type JsonataFn_min = ImplFromSignature<'<a<n>:n>'>
// type JsonataFn_average = ImplFromSignature<'<a<n>:n>'>
// type JsonataFn_string = ImplFromSignature<'<x-b?:s>'>
// type JsonataFn_substring = ImplFromSignature<'<s-nn?:s>'>
// type JsonataFn_substringBefore = ImplFromSignature<'<s-s:s>'>
// type JsonataFn_substringAfter = ImplFromSignature<'<s-s:s>'>
// type JsonataFn_lowercase = ImplFromSignature<'<s-:s>'>
// type JsonataFn_uppercase = ImplFromSignature<'<s-:s>'>
// type JsonataFn_length = ImplFromSignature<'<s-:n>'>
// type JsonataFn_trim = ImplFromSignature<'<s-:s>'>
// type JsonataFn_pad = ImplFromSignature<'<s-ns?:s>'>
// type JsonataFn_match = ImplFromSignature<'<s-f<s:o>n?:a<o>>'>
// type JsonataFn_contains = ImplFromSignature<'<s-(sf<s>):b>'>
// type JsonataFn_replace = ImplFromSignature<'<s-(sf)(sf)n?:s>'>
// type JsonataFn_split = ImplFromSignature<'<s-(sfn)?:a<s>>'>
// type JsonataFn_join = ImplFromSignature<'<a<s>s?:s>'>
// type JsonataFn_formatNumber = ImplFromSignature<'<n-so?:s>'>
// type JsonataFn_formatBase = ImplFromSignature<'<n-n?:s>'>
// type JsonataFn_formatInteger = ImplFromSignature<'<n-s:s>'>
// type JsonataFn_parseInteger = ImplFromSignature<'<s-s:n>'>
// type JsonataFn_number = ImplFromSignature<'<(nsb)-:n>'>
// type JsonataFn_floor = ImplFromSignature<'<n-:n>'>
// type JsonataFn_ceil = ImplFromSignature<'<n-:n>'>
// type JsonataFn_round = ImplFromSignature<'<n-n?:n>'>
// type JsonataFn_abs = ImplFromSignature<'<n-:n>'>
// type JsonataFn_sqrt = ImplFromSignature<'<n-:n>'>
// type JsonataFn_power = ImplFromSignature<'<n-n:n>'>
// type JsonataFn_random = ImplFromSignature<'<:n>'>
// type JsonataFn_boolean = ImplFromSignature<'<x-:b>'>
// type JsonataFn_not = ImplFromSignature<'<x-:b>'>
// type JsonataFn_map = ImplFromSignature<'<af>'>
// type JsonataFn_zip = ImplFromSignature<'<a+>'>
// type JsonataFn_filter = ImplFromSignature<'<af>'>
// type JsonataFn_single = ImplFromSignature<'<af?>'>
// type JsonataFn_reduce = ImplFromSignature<'<afj?:j>'>
// type JsonataFn_sift = ImplFromSignature<'<o-f?:o>'>
// type JsonataFn_keys = ImplFromSignature<'<x-:a<s>>'>
// type JsonataFn_lookup = ImplFromSignature<'<x-s:x>'>
// type JsonataFn_append = ImplFromSignature<'<xx:a>'>
// type JsonataFn_exists = ImplFromSignature<'<x:b>'>
// type JsonataFn_spread = ImplFromSignature<'<x-:a<o>>'>
// type JsonataFn_merge = ImplFromSignature<'<a<o>:o>'>
// type JsonataFn_reverse = ImplFromSignature<'<a:a>'>
// type JsonataFn_each = ImplFromSignature<'<o-f:a>'>
// type JsonataFn_error = ImplFromSignature<'<s?:x>'>
// type JsonataFn_assert = ImplFromSignature<'<bs?:x>'>
// type JsonataFn_type = ImplFromSignature<'<x:s>'>
// type JsonataFn_sort = ImplFromSignature<'<af?:a>'>
// type JsonataFn_shuffle = ImplFromSignature<'<a:a>'>
// type JsonataFn_distinct = ImplFromSignature<'<x:x>'>
// type JsonataFn_base64encode = ImplFromSignature<'<s-:s>'>
// type JsonataFn_base64decode = ImplFromSignature<'<s-:s>'>
// type JsonataFn_encodeUrlComponent = ImplFromSignature<'<s-:s>'>
// type JsonataFn_encodeUrl = ImplFromSignature<'<s-:s>'>
// type JsonataFn_decodeUrlComponent = ImplFromSignature<'<s-:s>'>
// type JsonataFn_decodeUrl = ImplFromSignature<'<s-:s>'>
// type JsonataFn_eval = ImplFromSignature<'<sx?:x>'>
// type JsonataFn_toMillis = ImplFromSignature<'<s-s?:n>'>
// type JsonataFn_fromMillis = ImplFromSignature<'<n-s?s?:s>'>
// type JsonataFn_clone = ImplFromSignature<'<(oa)-:o>'>
