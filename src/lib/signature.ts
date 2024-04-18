type BaseTypeMap = {
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

type BaseTypeKey = keyof BaseTypeMap

// Type args for arrays (`a<_>`) are limited to a subset currently.
type ArrayTypeMap = Pick<BaseTypeMap, 'a' | 'b' | 'n' | 's' | 'l' | 'o' | 'f'>

type MergeTuples<T1 extends any[], T2 extends any[]> = [...T1, ...T2]

// Union type checks only against the `BaseTypeMap`. It does not allow typed args.
type UnionType<
  T extends string,
  Accumulated extends string = '',
> = T extends `${infer First}${infer Rest}`
  ? First extends BaseTypeKey
    ? BaseTypeMap[First] | UnionType<Rest, `${Accumulated}${First}`>
    : invalid<`Invalid token found \`${First}\` inside \`(${Accumulated}${First}${Rest})\` choice group. Note that choice groups containing parameterized types are not supported`>
  : never

type ArrayType<T extends string> = T extends `${infer First}${infer Rest}`
  ? First extends keyof ArrayTypeMap
    ? // The validation algorithm only checks the first symbol inside the type argument.
      // E.g `a<sb>` will just validate it is an array of strings and the `b` is ignored.
      Array<ArrayTypeMap[First]>
    : invalid<`Invalid token found \`${First}\` inside \`a<${First}${Rest}>\`. Arrays only support 'a' | 'b' | 'n' | 's' | 'l' | 'o' | 'f'.`>
  : never

type FnType<SignatureTokens extends string> = (
  ...args: SigTokensToTuple<ExtractParamSignatureStr<SignatureTokens>>
) => ExtractReturnSignatureStr<SignatureTokens> extends string
  ? SigTokensToTuple<ExtractReturnSignatureStr<SignatureTokens>>[number]
  : any

type ParameterizedTokens = 'a' | 'f'

type ParamType<
  ParameterizedTypeToken extends ParameterizedTokens,
  ParamTokens extends string,
> = ParameterizedTypeToken extends 'a'
  ? // Currently only the first token is actually used during validation when checking type of array items
    ArrayType<ParamTokens>
  : ParameterizedTypeToken extends 'f'
    ? FnType<ParamTokens>
    : never

type ApplyModifier<Type, Modifier extends string> = Modifier extends '?'
  ? // We add explicit undefined here, but `ParamsFromSignature` adds it to all args anyway later
    // because any arg is allowed to be set to `undefined` explicitly and JSonata does not currently
    // provide a way to disambiguate. This is still needed for correctly typing lambdas such that they
    // are called from the handler in a valid way.
    [Type | undefined]
  : Modifier extends '-'
    ? [Type] // Nothing to be done since JSonata makes sure the context type matches
    : Modifier extends '+'
      ? [Type, ...Type[]] // Represents one or more instances of Type
      : [Type]

// Handling parameterized types, union types with modifiers, and base types with modifiers
type SigTokensToTuple<
  T extends string,
  Acc extends any[] = [],
> = T extends `${infer Parameterized extends ParameterizedTokens}<${infer Param}>${infer Suffix}`
  ? Suffix extends `${infer Modifier}${infer Rest}`
    ? Modifier extends '?' | '-' | '+'
      ? SigTokensToTuple<
          Rest,
          MergeTuples<
            Acc,
            ApplyModifier<ParamType<Parameterized, Param>, Modifier>
          >
        >
      : SigTokensToTuple<Suffix, [...Acc, ParamType<Parameterized, Param>]>
    : SigTokensToTuple<Suffix, [...Acc, ParamType<Parameterized, Param>]>
  : T extends `(${infer Union})${infer Suffix}`
    ? Suffix extends `${infer Modifier}${infer Rest}`
      ? Modifier extends '?' | '-' | '+'
        ? SigTokensToTuple<
            Rest,
            MergeTuples<Acc, ApplyModifier<UnionType<Union>, Modifier>>
          >
        : SigTokensToTuple<Suffix, [...Acc, UnionType<Union>]>
      : SigTokensToTuple<Suffix, [...Acc, UnionType<Union>]>
    : T extends `${infer Token}${infer Rest}`
      ? Token extends BaseTypeKey
        ? Rest extends `${infer Modifier}${infer NextRest}`
          ? Modifier extends '?' | '-' | '+'
            ? SigTokensToTuple<
                NextRest,
                MergeTuples<Acc, ApplyModifier<BaseTypeMap[Token], Modifier>>
              >
            : SigTokensToTuple<Rest, [...Acc, BaseTypeMap[Token]]>
          : SigTokensToTuple<Rest, [...Acc, BaseTypeMap[Token]]>
        : [...Acc, invalid<`Invalid token found \`${Token}\``>]
      : Acc

const InvalidTypeSymbol = Symbol(`Invalid type`)
export type invalid<ErrorMessage> = (
  // ErrorMessage doesn't need to be used here, except that using it allows
  // TypeScript to print the passed message instead of just "ErrorMessage"
  // in certain cases.
  invalidType: ErrorMessage & typeof InvalidTypeSymbol,
  ..._: (typeof InvalidTypeSymbol)[]
) => typeof InvalidTypeSymbol

type ExtractInnerSignatureStr<SignatureStr extends string> =
  SignatureStr extends `<${infer InnerSignatureStr}>`
    ? InnerSignatureStr
    : never

type ExtractSignatureParamsAndRet<
  S extends string,
  Accumulated extends string = '',
  L extends any[] = [],
  R extends any[] = [],
> = S extends `${infer Char}${infer Rest}`
  ? Char extends '<'
    ? ExtractSignatureParamsAndRet<Rest, `${Accumulated}<`, [0, ...L], R>
    : Char extends '>'
      ? ExtractSignatureParamsAndRet<Rest, `${Accumulated}>`, L, [0, ...R]>
      : Char extends ':'
        ? L['length'] extends R['length']
          ? [Accumulated, Rest]
          : ExtractSignatureParamsAndRet<Rest, `${Accumulated}:`, L, R>
        : ExtractSignatureParamsAndRet<Rest, `${Accumulated}${Char}`, L, R>
  : [Accumulated, undefined]

type ExtractParamSignatureStr<SignatureStr extends string> =
  ExtractSignatureParamsAndRet<SignatureStr>[0]

type ExtractReturnSignatureStr<SignatureStr extends string> =
  ExtractSignatureParamsAndRet<SignatureStr>[1]

type MakeOptional<T> = T extends [infer First, ...infer Rest]
  ? [First | undefined, ...MakeOptional<Rest>]
  : []

/**
 * Given a JSonata signature string, extract a tuple that represents the possible types
 * of the arguments once they have been processed by JSonata.
 *
 * @remarks
 * Note this strictly complies with JSonata's current validation logic in order to ensure that the defining
 * function deals with all the possible edge cases. This logic has some notable caveats:
 *
 * * Regardless of if a parameter is marked as optional (`?`) or not, it can be `undefined` when passed to the
 *   function the signature is registered against. `?` is used to drive if a parameter must be _present_ syntactically
 *   in the JSonata expression, E.g. `$example('test')` is valid if the signature is registered as `<ss?>`.
 *   It does not however prevent any parameter from being set to `undefined` explicitly. E.g. `$example('test', undefined)`
 *   is allowed even if the signature is registered as `<ss>`.
 *
 * * JSonata does not currently deep validate parameterized types. For example `a<s>` will ensure that the arg is
 *   an array of strings; but `a<a<s>>` will only ensure that the arg is an array of arrays, and not check that the
 *   inner array contains only strings. Therefore, the type of the arg in this example inferred is `Array<Array<any>>`.
 *
 * * Parameterized signatures can not be used inside choice groups. E.g. `(sna<o>)` is invalid.
 *
 * Despite these caveats, signature strings should always be accurately defined according to the JSonata
 * documentation. As well as it being necessary to allow JSonata to validate the semantics of how the value
 * can be called from an expression, it ensures your plugin will be compliant across future versions and
 * also ensures accurate human-friendly logging of the functions signatures.
 *
 * @typeParam SignatureStr - The JSonata signature string. Usually inferred during some function call.
 * @see https://docs.jsonata.org/embedding-extending#function-signature-syntax
 */
export type ParamsFromSignature<SignatureStr extends string> = MakeOptional<
  SigTokensToTuple<
    ExtractParamSignatureStr<ExtractInnerSignatureStr<SignatureStr>>
  >
>

/**
 * Given a JSonata signature string, extract the union type that represents the declared return type.
 *
 * @remarks
 * Note, JSonata does not actually validate the return type. It is up to the defined function to return
 * the correct one.
 *
 * @typeParam SignatureStr - The JSonata signature string. Usually inferred during some function call.
 * @see https://docs.jsonata.org/embedding-extending#function-signature-syntax
 */
export type ReturnTypeFromSignature<SignatureStr extends string> =
  ExtractReturnSignatureStr<
    ExtractInnerSignatureStr<SignatureStr>
  > extends string
    ? SigTokensToTuple<
        ExtractReturnSignatureStr<ExtractInnerSignatureStr<SignatureStr>>
      >[0] // The return value can only be one "arg" as theres no concept of params on a return value
    : any

export type EnsureValidSigString<S extends string> = ParamsFromSignature<S>

// type Test = EnsureValidSigString<'<s-(sf<s>):b>'>
