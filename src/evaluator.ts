import jsonata, { type JsonataOptions, type Focus } from 'jsonata'

import {
  type JsonataModule,
  type BindModuleOpts,
  createModule,
} from './module.js'
import { customErrorFactory } from 'ts-custom-error'
import { prefixedString } from './lib/str-utils.js'
import { type JsonataModuleDef } from './lib/types.js'

export interface ModularJsonataExpressionOpts extends JsonataOptions {
  /**
   * The prefix of the helper used in expressions in order to include
   * a modules functions in the scope. E.g. `$r(<module>)`.
   *
   * In rare circumstances, `'r'` may already be in use. This provides
   * an escape hatch to work around such issues.
   *
   * It can also be set to `false` in order to completely disable the ability
   * to use require statements within an expression. This enables situations
   * where you may only be interested in using the `injectModule` functionality
   * on an expression.
   *
   * @defaultValue `'r'`
   */
  requireHelper?: string | false
}

export type ModularJsonataOpts = {
  /**
   * These options will be the defaults used for every expression that is created.
   * Note, they can still be overridden in the expression opts.
   *
   * @see {@link ModularJsonataExpressionOpts}
   */
  defaultExpressionOpts?: ModularJsonataExpressionOpts
}

export const JsonataModuleNotFound = customErrorFactory(
  function JsonataModuleNotFound(id: string, message: string = '') {
    this.code = 'JSONATA_MODULE_NOT_FOUND'
    this.moduleId = id
    this.message =
      prefixedString(
        `The module with ID '${id}' could not be found. Did you add it with \`addModule\`?`,
      ) +
      ' ' +
      message
  },
  RangeError,
)

/**
 * Produces a configurable and pluggable builder interface to JSONata. Unlike the base JSONata methods,
 * the configuration can be used with multiple expressions, rather than needing
 * to re-register functions every time a new expression is created. This functionality is predicated on
 * the idea of using re-usable and portable "modules".
 *
 * All expressions produced from the evaluator will be able to use the `$include` method in the expression itself,
 * in order to bring into scope any module that has been registered with `addModule`.
 */
export const modularJsonata = ({
  defaultExpressionOpts = {},
}: ModularJsonataOpts = {}) => {
  const { requireHelper = 'r' } = defaultExpressionOpts

  const resolvedDefaultExpressionOpts = {
    requireHelper,
    ...defaultExpressionOpts,
  }

  const createBuilder = <T extends JsonataModule[]>(modules: T) => {
    const moduleById = (id: string) => {
      const module = modules.find((module) => module._def.id === id)

      if (!module) {
        throw new JsonataModuleNotFound(id)
      }

      return module
    }

    return {
      /**
       * Register a module such that it will be available for including in the JSONata expressions
       * produced by this builder.
       *
       * Note changes to the definition after the module has been added will not be effective.
       *
       * @param definition - A {@link JsonataModuleDef} that represents a modules functionality.
       * @returns The builder for further configuration
       * @throws {@link InvalidJsonataModuleDefinition} if the module definition is invalid.
       *
       */
      addModule<T extends JsonataModuleDef>(definition: T) {
        return createBuilder([...modules, createModule(definition)])
      },

      /**
       * Similar to the `jsonata()` base method, this provides a wrapper for the expression.
       * The expression is bound the modules that have been added to this builder.
       *
       * Note that when this is called, any modules added after this will
       * not be effective for those expressions already created via this method.
       *
       * Crucially, `evaluate()` can be called on the expression to get the actual results.
       * @param expression - The JSONata string expression
       * @param opts - The {@link ModularJsonataExpressionOpts}. Note, these are merged with anything passed
       *               to {@link ModularJsonataOpts.defaultExpressionOpts | `defaultExpressionOpts`} in the
       *               options for {@link modularJsonata}.
       * @returns A superset of {@link jsonata.Expression} that provides additional `modular-jsonata` functionality
       */
      expression(
        expression: Parameters<typeof jsonata>[0],
        opts?: ModularJsonataExpressionOpts,
      ) {
        const resolvedExpressionOpts = {
          ...resolvedDefaultExpressionOpts,
          ...opts,
        }

        const baseExpression = jsonata(expression, resolvedExpressionOpts)

        const registerRequireFn = (
          suffix: string = '',
          implementation: (
            this: Focus,
            module: JsonataModule,
            ...args: any[]
          ) => any,
          signature: string,
        ) => {
          if (resolvedExpressionOpts.requireHelper === false) return

          baseExpression.registerFunction(
            resolvedDefaultExpressionOpts.requireHelper + suffix,
            function (this: Focus, moduleId: string, ...args: any[]) {
              const moduleToInclude = moduleById(moduleId)
              return implementation.call(this, moduleToInclude, ...args)
            },
            signature,
          )
        }

        registerRequireFn(
          '',
          function (module, opts: BindModuleOpts) {
            module.bindToGlobal(this, opts)
          },
          '<so?:o>',
        )

        registerRequireFn(
          'Ret',
          function (module) {
            return module.getHandlers(this)
          },
          '<s:o>',
        )

        registerRequireFn(
          'Scoped',
          function (module, lambda) {
            module.bindToGlobal(this, {})

            return lambda()
          },
          '<so?:o>',
        )

        // baseExpression.registerFunction(
        //   // used to be called bind
        //   includeHelperName + 'Alias',
        //   function (moduleId) {
        //     modules
        //       .find((module) => module.id === moduleId)!
        //       .fns.forEach(({ implementation, name, signature }) => {
        //         this.environment.bind(
        //           `${moduleId}_${name}`,
        //           function (this: jsonata.Focus, ...args: any[]) {
        //             const validatedArgs = signatureValidator(
        //               signature!,
        //             ).validate(args, this.input)

        //             return implementation.apply(this, validatedArgs)
        //           }.bind(this),
        //         )
        //       })

        //     return this.input
        //   },
        //   '<s:x>',
        // )

        return {
          /**
           * If you do not wish to use `$r` in the expression itself, the module
           * can be injected into the expression scope such that it is already available.
           *
           * Note this will mean it is injected into the top level scope
           *
           * @param id - The ID of the module that was previously registered with `addModule`.
           * @param opts - The {@link BindModuleOpts}
           * @returns The expression wrapper
           */
          injectModule(id: T[number]['_def']['id'], opts?: BindModuleOpts) {
            moduleById(id).bindToExpression(baseExpression, opts)
            return this
          },

          /**
           * If you do not wish to use `$include` in the expression itself, modules
           * can be injected into the expression scope such that it is already available.
           *
           * Note this will mean it is injected into the top level scope
           *
           * This module simply wraps `injectModule` such that all added modules are globally available.
           *
           * @returns The expression wrapper
           */
          injectAllModules() {
            modules.forEach((module) => module.bindToExpression(baseExpression))
            return this
          },

          ...baseExpression,
        }
      },
    }
  }

  return createBuilder([])
}
