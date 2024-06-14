/**
 * A utility function for TS module authors. Given the return value of a lambda
 * call made inside a module function body, returns that same value but type
 * cast to the specified return type in the function subtype signature.
 *
 * **CAUTION:** Does not actually check the type matches the signature. In most
 * cases you should type check the return value yourself as necessary. This is
 * to be used for cases where you don't want to incur the cost and accept lower
 * type-safety.
 *
 * @example This code will have a compile error since the call to `lambda` will
 * return an `unknown` which does not match the top-level declared return type
 * of `string`.
 *
 *     import { defineModule } from 'modular-jsonata'
 *
 *     const module = defineModule('example').export(
 *       'testFn',
 *       '<f<n:s>:s>',
 *       function (lambda) { // Type 'unknown' is not assignable to type 'string'. ts(2345)
 *         return lambda(5)
 *       },
 *     )
 *
 * By using `unsafe_lambdaRet`, the error goes away since the lambda return
 * value is (unsafely) assumed to be what it is declared as in the signature
 * (`string`). Since this also matches the top-level declared return type.
 *
 *     import { defineModule, unsafe_lambdaRet } from 'modular-jsonata'
 *     const module = defineModule('example').export(
 *       'testFn',
 *       '<f<n:s>:s>',
 *       function (lambda) {
 *         return unsafe_lambdaRet(lambda(5))
 *       },
 *     )
 *
 * @param value - The return value from a lambda, where that lambda is being
 *   called from a module function body.
 *
 * @returns The same `value`, but force-cast to the type it has been declared as
 *   in the signature.
 *
 * @remarks
 * The signature allows functions to be defined as parameters (lambdas) and to
 * specify the return type token for those lambdas. This is for the future and
 * is not currently actually checked by the signature validator.
 *
 * Therefore, return types declared for lambdas actually surface as `unknown`s
 * meaning the dev needs to cast them or type narrow them to ascertain their
 * true type.
 *
 * However, we wrap this `unknown` type with the "declared" return type such
 * that the dev can opt out of type safety and assume it is the "declared" type
 * by passing it into this helper method in the runtime.
 */
export function unsafe_lambdaRet(value) {
    return value;
}
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
