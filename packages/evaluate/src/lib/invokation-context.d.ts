declare const VIA_OWN_APPLY_PROPERTY: unique symbol;
export declare enum InvokationContext {
    /** Indicates caller used `apply` function property */
    OwnApplyProperty = "fn.apply",
    /** Indicates caller used `call` function property */
    OwnCallProperty = "fn.call",
    /**
     * Indicates caller did not use either `apply` or `call` function property.
     * This includes `apply` or `call` used via `Function.prototype`. Also used if
     * the caller just used a plain call.
     */
    Unknown = "unknown"
}
type WrapperThis = typeof VIA_OWN_APPLY_PROPERTY | typeof VIA_OWN_APPLY_PROPERTY | any;
type CapturedInvokationFn<Fn extends (invokationContext: InvokationContext, ...args: any[]) => any> = {
    (this: WrapperThis, ...args: ConsumerArgs<Fn>): ReturnType<Fn>;
    readonly apply: (_: any, providedArgs: ConsumerArgs<Fn>) => ReturnType<Fn>;
    readonly call: (_: any, ...providedArgs: ConsumerArgs<Fn>) => ReturnType<Fn>;
};
type ConsumerArgs<T extends (invokationContext: InvokationContext, ...args: any[]) => any> = T extends (invokationContext: InvokationContext, ...args: infer Args) => any ? Args : never;
/**
 * Provides a way to create a function whereby you can capture if it was called
 * via its own `apply` or `call` methods. This can not detect if these methods
 * were called via `Function.prototype`.
 *
 * The purpose of this is to be able to disambiguate certain calls coming from
 * inside of JSONata that otherwise have no detectable way of doing so.
 *
 * @param fn Function that will be called when the wrapper fn is called
 *
 * @returns A wrapper around `fn` which captures invokation context
 *
 * @privateRemarks
 * This is far from ideal. The main problem it is solving is trying to ensure
 * `__evaluate_entry` and `__evaluate_exit` can not be called manually from an
 * expression (which is possible in core JSONAta!). The only way of detecting
 * this in current JSONata core is to use this hacky approach. This can't
 * disambiguate between all the different ways of invoking a function, but it
 * doesn't need to since the use case means we only need to know specifically
 * when the functions own `call` or `apply` is called.
 *
 * @internal
 */
export declare const withInvokationContext: <T extends (invokationContext: InvokationContext, ...args: any[]) => any>(fn: T) => CapturedInvokationFn<T>;
export {};
