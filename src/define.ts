import { type Focus } from 'jsonata'
import {
  type JsonataModuleFnDefImpl,
  type JsonataModuleDef,
  type JsonataModuleFnDef,
  type CustomInspect,
  inspectSymbol,
} from './lib/types.js'
import {
  type ReturnTypeFromSignature,
  type ParamsFromSignature,
} from './lib/signature.js'

const buildFnObj = <O extends Pick<JsonataModuleFnDef, 'name'>>(obj: O) => {
  return {
    ...obj,
    [inspectSymbol](depth: any, options: any, inspect: any) {
      return `${options.stylize(`[JsonataModuleFnDef(${obj.name})]`, 'special')}`
    },
  }
}

/**
 * A builder that enables an encapsulated and portable JSONata module definition to be
 * produced. This includes defining the unique identifier for the module and the functions
 * that it provides.
 *
 * If the module needs to be configurable, wrap the `defineModule` call in a higher order function
 * that accepts those arguments.
 *
 * @param id - Define a unique identifier for this module. This will be used as the default prefix used to reference this modules functions when imported.
 * @returns A {@link JsonataModuleDef} which can be used by `modular-json`.
 */
export const defineModule = (id: string) => {
  const createProviderConfigBuilder = () => {
    const fns: CustomInspect<JsonataModuleFnDef>[] = []
    let _description: string | undefined

    const builder = {
      /** A brief description of what this module does. */
      description(description: string) {
        _description = description
        return this
      },

      /**
       * Register a function that this module makes available to the expressions.
       *
       * Note that the types of the arguments of the `implementation` function will
       * be inferred automatically from the passed in `signature` string.
       *
       * `exportUnsafe` can be used if you wish to skip validation. It is recommended to
       * always provide a signature as this ensures native JSonata error messaging is present.
       *
       * @param name - The unique name of the function.
       * @param signature - The {@link https://docs.jsonata.org/embedding-extending#function-signature-syntax | signature} string defining the arg & return types of this fn.
       * @param implementation - The function that will be called when this is invoked from a JSonata expression.
       * @see {@link ParamsFromSignature} and {@link ReturnTypeFromSignature} for detail of caveats regarding type inference.
       * @see The JSONata {@link https://docs.jsonata.org/embedding-extending | base documentation} for `registerFunction`.
       */
      export<Sig extends string>(
        name: string,
        signature: Sig,
        implementation: (
          this: Focus,
          ...args: ParamsFromSignature<Sig>
        ) => ReturnTypeFromSignature<Sig>,
      ) {
        fns.push(
          buildFnObj({
            name,
            implementation: implementation as JsonataModuleFnDefImpl,
            signature,
          }),
        )

        return this
      },

      /**
       * Register a function that this module makes available to the expressions, but without
       * any validation on the parameters.
       *
       * It is usually recommended to use `export` instead.
       *
       * @param name - The unique name of the function.
       * @param implementation - The function that will be called when this is invoked from a JSonata expression.
       * @see The JSONata {@link https://docs.jsonata.org/embedding-extending | base documentation} for `registerFunction`.
       */
      exportUnsafe(name: string, implementation: JsonataModuleFnDefImpl) {
        fns.push(
          buildFnObj({
            name,
            implementation,
          }),
        )

        return this
      },

      /**
       * Builds and reutrns the final module definition ready for use by a consumer.
       *
       * @returns A {@link JsonataModuleDef} which can be used by `modular-json`.
       **/
      build(): CustomInspect<JsonataModuleDef> {
        return {
          // [Symbol.toStringTag]: `JsonataModuleDefLol(${id})`,
          [inspectSymbol](depth: any, options: any, inspect: any) {
            inspect.styles.attrGroup = 'blueBright'

            return `📦 ${options.stylize(options.stylize('[modular-jsonata]', 'module'), 'string')} ${options.stylize(
              'Module Definition',
              'special',
            )}

  ▼ ${options.stylize('MANIFEST', 'attrGroup')}
  ├── ID: ${options.stylize(id, 'string')}
  └── DESCRIPTION: ${options.stylize(_description, 'string')}
  
  ▼ ${options.stylize('FUNCTIONS', 'attrGroup')}
${fns
  .map((fn) => {
    const [fnArgs, fnRet] = fn.signature
      ?.substring(1, fn.signature!.length - 1)
      .split(':') ?? ['', '']

    const friendlySigParts = (chars: string) => {
      return ''
      const matches = chars.match(/(s-?)|(\(sao\)-?)|(n-?)/g)

      console.log(matches)
      return matches
        ?.map((match) => {
          switch (match) {
            case 's-':
              return '[context aware: <string>]'
            case 's':
              return '<string>'
            case 'sao':
              return '<string | array | object>'
            case 'n':
              return '<number>'
          }
        })
        .join(', ')
    }

    return `  ├── ${options.stylize(
      `${fn.name}(${friendlySigParts(fnArgs)}): ${friendlySigParts(fnRet)}`,
    )}`
  })
  .join('\n')}`
          },
          id,
          description: _description,
          fns,
        }
      },
    }

    return builder
  }

  return createProviderConfigBuilder()
}

export type DefineModule = typeof defineModule
