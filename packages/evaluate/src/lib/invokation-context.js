const VIA_OWN_APPLY_PROPERTY = Symbol('VIA_OWN_APPLY_PROPERTY');
const VIA_OWN_CALL_PROPERTY = Symbol('VIA_OWN_CALL_PROPERTY');
export var InvokationContext;
(function (InvokationContext) {
    /** Indicates caller used `apply` function property */
    InvokationContext["OwnApplyProperty"] = "fn.apply";
    /** Indicates caller used `call` function property */
    InvokationContext["OwnCallProperty"] = "fn.call";
    /**
     * Indicates caller did not use either `apply` or `call` function property.
     * This includes `apply` or `call` used via `Function.prototype`. Also used if
     * the caller just used a plain call.
     */
    InvokationContext["Unknown"] = "unknown";
})(InvokationContext || (InvokationContext = {}));
const enumFromThis = (passedThis) => {
    switch (passedThis) {
        case VIA_OWN_APPLY_PROPERTY:
            return InvokationContext.OwnApplyProperty;
        case VIA_OWN_CALL_PROPERTY:
            return InvokationContext.OwnCallProperty;
        default:
            return InvokationContext.Unknown;
    }
};
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
export const withInvokationContext = (fn) => {
    function capturedInvokationFn(...args) {
        return fn(enumFromThis(this), ...args);
    }
    capturedInvokationFn.apply = (_, providedArgs) => {
        return Function.prototype.apply.call.apply(capturedInvokationFn, [
            VIA_OWN_APPLY_PROPERTY,
            ...providedArgs,
        ]);
    };
    capturedInvokationFn.call = (_, ...providedArgs) => {
        return Function.prototype.call.call.apply(capturedInvokationFn, [
            VIA_OWN_CALL_PROPERTY,
            ...providedArgs,
        ]);
    };
    // Prevent removal of the capture behavior.
    Object.freeze(capturedInvokationFn);
    return capturedInvokationFn;
};
