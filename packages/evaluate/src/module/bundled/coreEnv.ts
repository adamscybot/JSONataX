import { type Environment } from '@jsonatax/jsonata-extended'
import { InvokationContext } from '../../lib/invokation-context.js'
import { defineModule } from '../define/define.js'

/**
 * Problem areas,
 *
 *     async function applyProcedure(proc, args) {
 *     var result;
 *     var env = createFrame(proc.environment);
 *     proc.arguments.forEach(function (param, index) {
 *         env.bind(param.value, args[index]);
 *     });
 *
 * Function partialApplyProcedure(proc, args) { // create a closure, bind the
 * supplied parameters and return a function that takes the remaining (?)
 * parameters var env = createFrame(proc.environment); var unboundArgs = [];
 * proc.arguments.forEach(function (param, index) { var arg = args[index]; if
 * (arg && arg.type === 'operator' && arg.value === '?') {
 * unboundArgs.push(param); } else { env.bind(param.value, arg); } });
 *
 *     function createFrameFromTuple(environment, tuple) {
 *         var frame = createFrame(environment);
 *         for(const prop in tuple) {
 *             frame.bind(prop, tuple[prop]);
 *         }
 *         return frame;
 *     }
 */

function deleteProperties(objectToClean: any) {
  // eslint-disable-next-line security/detect-object-injection
  for (const x in objectToClean)
    if (Object.prototype.hasOwnProperty.call(objectToClean, x))
      delete objectToClean[x]
}

const JSONATAX_BINDING_MARKER = Symbol('JSONATAX_BINDING_MARKER')
// const DEFAULT_SHADOWED_BINDINGS = new Set<string>([
//   EnvBuiltInsInternal.EvaluateEntry,
//   EnvBuiltInsInternal.EvaluateExit,
// ])

/** Options object to be passed to the {@link secureEnv} plugin. */
export type SecureEnvOpts = {
  /**
   * **WARNING: Changing default has security implications.**
   *
   * If set to `true`, the underlying JSONAta `__evaluate_entry` and
   * `__evaluate_exit` callbacks can be executed from the expression. This would
   * allow all plugin logic connected to the `eval:entry` and `eval:exit` hooks
   * to be executed programmatically from the expression itself.
   *
   * @defaultValue `false`
   */
  allowEvalHookInvocationFromExpression?: boolean

  /**
   * **WARNING: Changing default has security implications.**
   *
   * If set to `true`, the underlying JSONAta `__evaluate_entry` and
   * `__evaluate_exit` callbacks can be written which means orchestration of the
   * eval entry/exit behavior is no longer guaranteed to be managed by
   * modular-jsonata plugins. Additionally would allow expressions themselves to
   * write to these callbacks, effectively allowing plugin behavior to be
   * disabled from an expression.
   *
   * This option is effectively `true` regardless of its setting if
   * {@link SecureEnvOpts.disableCoreEnvApiIntegrity | `disableCoreEnvApiIntegrity`}
   * is set to `true`.
   *
   * @defaultValue `false`
   */
  disableEvalHookIntegrity?: boolean

  /**
   * **WARNING: Changing default has security implications.**
   *
   * If set to `true`, the underlying API that both JSONAta itself and
   * modular-jsonata use to interact with the "environment" will not have
   * protections applied to it that prevent unmanaged and potentially unsafe
   * modifications to it.
   *
   * @defaultValue `false`
   */
  disableCoreEnvApiIntegrity?: boolean
}

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
export const coreEnv = (opts: SecureEnvOpts = {}) => {
  const { allowEvalHookInvocationFromExpression = false } = opts

  // JSONata uses `.apply(...)` for calls from inside an expression.
  // We want to prevent calling entry/exit callbacks from inside
  // expressions themselves as they are considered private to the
  // plugin API.
  const validateCaller = (context: {
    __invokationContext?: InvokationContext | undefined
  }) => {
    if (
      allowEvalHookInvocationFromExpression === false &&
      (context.__invokationContext === InvokationContext.OwnApplyProperty ||
        context.__invokationContext === InvokationContext.OwnCallProperty)
    ) {
      throw new Error('Can not call')
    }
  }

  const envsInternalStore = new Map<Readonly<Environment>, Map<string, any>>()

  const isInternalisedEnv = (env: Environment) =>
    envsInternalStore.get(env) !== undefined

  const getInternalisedEnv = (env: Environment) => {
    const state = envsInternalStore.get(env)
    if (state === undefined) throw new Error()
    return state
  }

  const getOriginalEnv = (env: Environment) =>
    getInternalisedEnv(env).get('originalEnv')

  // const getEnvShadowBindings = (env: Environment) =>
  //   getInternalisedEnv(env).get('shadowBindings')

  // const registerIntercept = (env: Environment, property: keyof Environment & string, )

  const initEnvSandbox = (env: Environment, isSandboxRoot: boolean) => {
    const ctr: any = {}
    Object.setPrototypeOf(
      env,
      new Proxy(ctr, {
        get(target, key) {
          // console.log('get original', getInternalisedEnv(env))
          const originalEnv = getOriginalEnv(env)
          if (key === 'isSandboxRoot') return isSandboxRoot

          if (key === 'lookup') {
            return function (name: string | symbol) {
              if (name === JSONATAX_BINDING_MARKER) return true
              return originalEnv.lookup(name)
            }
          }

          // console.log('icu get', key, originalEnv, originalEnv[key])
          return originalEnv[key]
        },
        set(target, key, val) {
          console.log('icu set', key)
          // setting this container object instead of t keeps t clean,
          // and allows get access to that property to continue being
          // intercepted by the proxy
          Reflect.set(ctr, key, val)
          return true
        },
        deleteProperty(target, key) {
          console.log('icu delete')
          delete ctr[key]
          return true
        },
      }),
    )

    // Object.freeze(env)
  }

  const internaliseEnv = (env: Environment) => {
    // @ts-expect-error Using symbols privately
    const isSandboxRoot = env.lookup(JSONATAX_BINDING_MARKER) !== true
    console.log('interanlising env', env)
    const originalEnv = { lookup: env.lookup, bind: env.bind }
    deleteProperties(env)
    envsInternalStore.set(env, new Map([['originalEnv', originalEnv]]))
    initEnvSandbox(env, isSandboxRoot)
  }

  return (
    defineModule('jsonatax:core:env')
      // @ts-ignore
      .tapHook('eval:entry', function (expr, input, env) {
        // @ts-ignore
        validateCaller(this)

        console.log('ENTRY', env)
        if (!isInternalisedEnv(env)) {
          internaliseEnv(env)

          // @ts-ignore
          env.ok = 'ok'

          // @ts-ignore
          // console.log('test', env.isSandboxRoot)
        }
      })
      .tapHook('eval:exit', function () {
        validateCaller(this)
      })

      .build()
  )
}
