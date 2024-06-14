// Unfortunately since this is not exposed where it is needed,
// we have to import it from source via a github dep.
import signatureValidator from '@jsonatax/jsonata-extended/src/signature.js';
import { validateJsonataModuleDef } from './define/is-module-def.js';
import { deepFreeze } from '../lib/immutability.js';
function makeHandler(focus, { implementation, signature, }) {
    return function (...args) {
        const validatedArgs = signature !== undefined
            ? signatureValidator(signature).validate(args, this.input)
            : args;
        return implementation.apply(this, validatedArgs);
    }.bind(focus);
}
/**
 * @remarks
 * Wrapper around a plain module definition object to represent that module when
 * it is added to the evaluator.
 *
 * We purposefully do not instantiate this when the module is defined, but
 * instead that define builder produces only the plain module definition object.
 * This increases interoperability (especially if module author accidentally
 * bundled this package) and avoids the package that defines the module from
 * needing to even interact with this code, since it is not of interest there
 * anyway.
 */
export class JsonataModuleImpl {
    _def;
    constructor(definition) {
        validateJsonataModuleDef(definition);
        const { exports: fns, id, description, hooks } = definition;
        // Copy the definition and freeze it such that the modules declared functionality
        // is immutable from this point onwards.
        this._def = deepFreeze({
            id,
            description,
            exports: [...fns.map((fn) => ({ ...fn }))],
            hooks: [...hooks.map((fn) => ({ ...fn }))],
        });
    }
    get [Symbol.toStringTag]() {
        return `JsonataModule(${this._def})`;
    }
    #scopedName(fnName, { alias = this._def.id } = {}) {
        return `${alias}_${fnName}`;
    }
    getHandlers(focus) {
        return Object.fromEntries(this._def.exports.map(({ implementation, name, signature }) => {
            return [name, makeHandler(focus, { implementation, signature })];
        }));
    }
    // ffs look at @ (Context variable binding)
    bindExportsToContext(focus, opts) {
        this._def.exports.forEach(({ implementation, name, signature }) => {
            focus.environment.bind(this.#scopedName(name, opts), makeHandler(focus, { implementation, signature }));
        });
    }
    bindExportsToGlobal(focus, opts) {
        this._def.exports.forEach(({ implementation, name, signature }) => {
            focus.environment.bind(this.#scopedName(name, opts), {
                _jsonata_function: true,
                implementation,
                ...(signature ? { signature: signatureValidator(signature) } : {}),
            });
        });
    }
    bindExportsToExpression(expression, opts) {
        this._def.exports.forEach(({ implementation, name, signature }) => {
            expression.registerFunction(this.#scopedName(name, opts), function (...args) {
                return implementation.apply(this, args);
            }, signature);
        });
    }
    execHook(hook, thisContext, args) {
        for (const hookDef of this._def.hooks.filter((h) => h.hook === hook)) {
            Function.prototype.apply.call(hookDef.handler, thisContext, args);
        }
        return;
    }
}
export const createModule = (module) => new JsonataModuleImpl(module);
