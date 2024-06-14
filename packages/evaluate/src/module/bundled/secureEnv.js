import { EnvBuiltInsInternal } from '../../env/builtins.js';
import { InvokationContext } from '../../lib/invokation-context.js';
import { defineModule } from '../define/define.js';
const BIND_FN_NAME = 'bind';
const LOOKUP_FN_NAME = 'lookup';
const ensureProtected = (o, property, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(o, property);
    if (descriptor === undefined ||
        (!descriptor.configurable && descriptor.writable)) {
        throw new Error(`Safety of environment could not be guaranteed whilst securing "${property}"`);
    }
    if (descriptor.writable) {
        Object.defineProperty(o, property, {
            configurable: false,
            writable: false,
            enumerable: true,
            value: value,
        });
        return;
    }
};
/**
 * This is a core plugin, which should be used in almost all cases as the first
 * loaded plugin. It is a dependency of other plugins that need to manage
 * aspects of the JSONata environment.
 *
 * It implements crucial security protections that should rarely, if ever, be
 * omitted.
 *
 * @param opts - The {@link SecureEnvOpts | plugin options}.
 *
 * @remarks
 * - Ensures the underlying core JSONata `__evaluate_entry` and `__evaluate_exit`
 *   callbacks can not be called from inside an expression since this would
 *   allow internal plugin logic to programmatically executed from inside an
 *   expression. These hooks are considered out of scope of the query itself and
 *   may be sensitive.
 * - Prevents any overriding of the underlying core JSONata `__evaluate_entry` and
 *   `__evaluate_exit` callbacks in order to prevent circumvention of this
 *   plugins and other plugins functions and to ensure related behaviours are
 *   expressed only via modular-jsonata plugins.
 * - Locks down the underlying JSONAta environment API itself for reasons of
 *   security, and provides an API that other plugins can use to mutate the api
 *   itself in a way which doesn't leave open vectors that would allow it to be
 *   mutated from untrusted places.
 */
export const secureEnv = (opts = {}) => {
    const { allowEvalHookInvocationFromExpression = false, disableCoreEnvApiIntegrity = false, disableEvalHookIntegrity = false, } = opts;
    // JSONata uses `.apply(...)` for calls from inside an expression.
    // We want to prevent calling entry/exit callbacks from inside
    // expressions themselves as they are considered private to the
    // plugin API.
    const validateCaller = (context) => {
        if (allowEvalHookInvocationFromExpression === false &&
            (context.__invokationContext === InvokationContext.OwnApplyProperty ||
                context.__invokationContext === InvokationContext.OwnCallProperty)) {
            throw new Error('Can not call');
        }
    };
    return defineModule('secureEnv')
        .tapHook('eval:entry', function (expr, input, env) {
        validateCaller(this);
        if (disableCoreEnvApiIntegrity === true)
            return;
        const oldEnvBind = env.bind;
        const oldEnvLookup = env.lookup;
        ensureProtected(env, BIND_FN_NAME, (key, val) => {
            if (disableEvalHookIntegrity === false &&
                [
                    EnvBuiltInsInternal.EvaluateEntry,
                    EnvBuiltInsInternal.EvaluateExit,
                ].includes(key)) {
                throw new Error('sadasd');
            }
            oldEnvBind(key, val);
        });
        ensureProtected(env, LOOKUP_FN_NAME, oldEnvLookup);
    })
        .tapHook('eval:exit', function () {
        validateCaller(this);
    })
        .build();
};
