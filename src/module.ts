import { type Focus, type Expression } from 'jsonata'
// Unfortunately since this is not exposed where it is needed,
// we have to import it from source via a github dep.
import signatureValidator from 'jsonata-src/src/signature.js'
import { type JsonataModuleDef, type JsonataModuleFnDef } from './lib/types.js'
import { validateJsonataModuleDef } from './lib/is-module-def.js'

function makeHandler(
  focus: Focus,
  {
    implementation,
    signature,
  }: Pick<JsonataModuleFnDef, 'implementation' | 'signature'>,
) {
  return function (this: Focus, ...args: any[]) {
    const validatedArgs =
      signature !== undefined
        ? signatureValidator(signature).validate(args, this.input)
        : args

    return implementation.apply(this, validatedArgs)
  }.bind(focus)
}

export type BindModuleOpts = {
  /**
   * The namespace prefix that the modules functions will be available
   * under in this scope. I.e. `$<namespacePrefix>_<functionName>(...)`.
   *
   * @defaultValue The `id` of the module definition.
   */
  alias?: string
}

/**
 * @remarks
 * Wrapper around a plain module definition object to represent that module
 * when it is added to the evaluator.
 *
 * We purposefully do not instantiate this when the module is defined, but instead
 * that define builder produces only the plain module definition object. This increases
 * interoperability (especially if module author accidentally bundled this package)
 * and avoids the package that defines the module from needing to even interact with this code,
 * since it is not of interest there anyway.
 */
class JsonataModuleImpl<T extends JsonataModuleDef> {
  public _def: T

  constructor(definition: T) {
    validateJsonataModuleDef(definition)

    // Copy the definition such that the modules declare functionality
    // is immutable from this point onwards.
    this._def = Object.freeze({
      ...definition,
      fns: Object.freeze(definition.fns),
    })
  }

  get [Symbol.toStringTag]() {
    return `JsonataModule(${this._def})`
  }

  #scopedName(
    fnName: string,
    { alias = this._def.id }: BindModuleOpts | undefined = {},
  ) {
    return `${alias}_${fnName}`
  }

  getHandlers(focus: Focus) {
    return Object.fromEntries(
      this._def.fns.map(({ implementation, name, signature }) => {
        return [name, makeHandler(focus, { implementation, signature })]
      }),
    )
  }

  // ffs look at @ (Context variable binding)
  bindToContext(focus: Focus, opts?: BindModuleOpts) {
    this._def.fns.forEach(({ implementation, name, signature }) => {
      focus.environment.bind(
        this.#scopedName(name, opts),
        makeHandler(focus, { implementation, signature }),
      )
    })
  }

  bindToGlobal(focus: Focus, opts?: BindModuleOpts) {
    this._def.fns.forEach(({ implementation, name, signature }) => {
      focus.environment.bind(this.#scopedName(name, opts), {
        _jsonata_function: true,
        implementation,
        ...(signature ? { signature: signatureValidator(signature) } : {}),
      })
    })
  }

  bindToExpression(expression: Expression, opts?: BindModuleOpts) {
    this._def.fns.forEach(({ implementation, name, signature }) => {
      expression.registerFunction(
        this.#scopedName(name, opts),
        implementation,
        signature,
      )
    })
  }
}

export type JsonataModule = InstanceType<typeof JsonataModuleImpl>

export const createModule = <T extends JsonataModuleDef>(module: T) =>
  new JsonataModuleImpl<T>(module)
