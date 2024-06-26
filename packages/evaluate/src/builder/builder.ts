import {
  type default as jsonata,
  type JsonataOptions,
} from '@jsonatax/jsonata-extended'

import { type JsonataModuleImpl, createModule } from '../module/module.js'
import { type JsonataModuleDef } from '../module/define/types.js'
import { expressionFromStr } from '../expression/expression.js'
import { coreEnv } from '../module/bundled/coreEnv.js'

export interface ModularJsonataExpressionOpts extends JsonataOptions {
  /**
   * The prefix of the helper used in expressions in order to include a modules
   * functions in the scope. E.g. `$r(<module>)`.
   *
   * In rare circumstances, `'r'` may already be in use. This provides an escape
   * hatch to work around such issues.
   *
   * It can also be set to `false` in order to completely disable the ability to
   * use require statements within an expression. This enables situations where
   * you may only be interested in using the `injectModule` functionality on an
   * expression.
   *
   * @defaultValue `'r'`
   */
  requireHelper?: string | false
}

export type ModularJsonataOpts = {
  /**
   * These options will be the defaults used for every expression that is
   * created. Note, they can still be overridden in the expression opts.
   *
   * @see {@link ModularJsonataExpressionOpts}
   */
  defaultExpressionOpts?: ModularJsonataExpressionOpts
}

class JsonataBuilder<const T extends JsonataModuleImpl<any>[] = []> {
  #modules: T
  #opts: ModularJsonataOpts

  constructor(modules: T, opts: ModularJsonataOpts) {
    this.#modules = modules
    this.#opts = {
      ...opts,
      defaultExpressionOpts: { ...opts.defaultExpressionOpts },
    }
    this.initCorePlugIns()
  }

  initCorePlugIns() {
    return this.addModule(coreEnv())
  }

  /**
   * Register a module such that it will be available for including in the
   * JSONata expressions produced by this builder.
   *
   * Note changes to the definition after the module has been added will not be
   * effective.
   *
   * @param definition - A {@link JsonataModuleDef} that represents a modules
   *   functionality.
   *
   * @returns The builder for further configuration
   *
   * @throws {@link InvalidJsonataModuleDefinition} If the module definition is
   *   invalid.
   */
  addModule<Def extends JsonataModuleDef>(definition: Def) {
    this.#modules.push(createModule(definition))
    return this as unknown as JsonataBuilder<[...T, JsonataModuleImpl<Def>]>
  }

  /**
   * Similar to the `jsonata()` base method, this provides a wrapper for the
   * expression. The expression is bound the modules that have been added to
   * this builder.
   *
   * Note that when this is called, any modules added after this will not be
   * effective for those expressions already created via this method.
   *
   * Crucially, `evaluate()` can be called on the expression to get the actual
   * results.
   *
   * @param expression - The JSONata string expression
   * @param opts - The {@link ModularJsonataExpressionOpts}. Note, these are
   *   merged with anything passed to
   *   {@link ModularJsonataOpts.defaultExpressionOpts | `defaultExpressionOpts`}
   *   in the options for {@link modularJsonata}.
   *
   * @returns A superset of {@link jsonata.Expression} that provides additional
   *   `modular-jsonata` functionality
   */
  expression(
    expression: Parameters<typeof jsonata>[0],
    opts?: ModularJsonataExpressionOpts,
  ) {
    const { requireHelper = 'r' } = this.#opts.defaultExpressionOpts ?? {}

    const resolvedDefaultExpressionOpts = {
      requireHelper,
      ...this.#opts.defaultExpressionOpts,
    }

    return expressionFromStr(expression, this.#modules, {
      ...resolvedDefaultExpressionOpts,
      ...opts,
    })
  }
}

/**
 * Produces a configurable and pluggable builder interface to JSONata. Unlike
 * the base JSONata methods, the configuration can be used with multiple
 * expressions, rather than needing to re-register functions every time a new
 * expression is created. This functionality is predicated on the idea of using
 * re-usable and portable "modules".
 *
 * All expressions produced from the evaluator will be able to use the
 * `$include` method in the expression itself, in order to bring into scope any
 * module that has been registered with `addModule`.
 */
export const modularJsonata = (opts: ModularJsonataOpts = {}) =>
  new JsonataBuilder([], opts)
