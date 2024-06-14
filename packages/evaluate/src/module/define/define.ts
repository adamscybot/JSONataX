import {
  type JsonataModuleFnDefImpl,
  type JsonataModuleDef,
  type JsonataModuleFnDef,
  type DefinePluginBuilder,
} from './types.js'

import type {
  ImplFromSignature,
  ValidSignature,
} from '../../signature/parser.js'
import { deepFreeze } from '../../lib/immutability.js'
import { type HookRegistry } from '../../hooks/types.js'

const buildFnObj = <O extends JsonataModuleFnDef>({
  name,
  implementation,
  signature,
}: O) =>
  Object.assign(Object.create(null), {
    name,
    implementation,
    signature,
    // [inspectSymbol](depth: any, options: any, inspect: any) {
    //   return `${options.stylize(`[JsonataModuleFnDef(${obj.name})]`, 'special')}`
    // },
  })

/**
 * A builder that enables an encapsulated and portable JSONata module definition
 * to be produced. This includes defining the unique identifier for the module
 * and the functions that it provides.
 *
 * If the module needs to be configurable, wrap the `defineModule` call in a
 * higher order function that accepts those arguments.
 *
 * @param id - Define a unique identifier for this module. This will be used as
 *   the default prefix used to reference this modules functions when imported.
 *
 * @returns A {@link JsonataModuleDef} which can be used by `modular-json`.
 */
export const defineModule = <ID extends string>(id: ID) => {
  const createProviderConfigBuilder = () => {
    const exports: JsonataModuleFnDef[] = []
    const hooks: Array<{
      hook: Parameters<HookRegistry<any>>[0]
      handler: Parameters<HookRegistry<any>>[1]
    }> = []
    let _description: string | undefined

    const builder: DefinePluginBuilder = {
      description(description) {
        _description = description
        return this
      },

      export<Signature extends string>(
        name: string,
        signature: ValidSignature<Signature>,
        impl: ImplFromSignature<Signature>,
      ) {
        exports.push(
          buildFnObj({
            name,
            implementation: impl as unknown as JsonataModuleFnDefImpl,
            signature: signature as unknown as string,
          }),
        )

        return this
      },

      exportUnsafe(name, implementation) {
        exports.push(
          buildFnObj({
            name,
            implementation,
          }),
        )

        return this
      },

      tapHook(hook, handler) {
        hooks.push(Object.assign(Object.create(null), { hook, handler }))

        return this
      },

      build() {
        return deepFreeze(
          Object.assign(Object.create(null), {
            id,
            description: _description,
            exports,
            hooks,
          }),
        )
      },
    }

    return builder
  }

  return createProviderConfigBuilder()
}

export type DefineModule = typeof defineModule
