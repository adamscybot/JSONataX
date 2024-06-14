import jsonata from '@jsonatax/jsonata-extended';
import { JsonataModuleNotFound } from './errors.js';
import { EnvBuiltInsInternal } from '../env/builtins.js';
import { withInvokationContext } from '../lib/invokation-context.js';
class JsonataExpression {
    #_expression;
    #modules;
    #opts;
    constructor(expression, modules, opts) {
        this.#_expression = expression;
        this.#modules = Object.freeze([...modules]);
        this.#opts = opts;
        this.#registerGlobalReqFn();
        this.#registerLocalReqFn();
    }
    #getModuleById(id) {
        const module = this.#modules.find((module) => module._def.id === id);
        if (!module) {
            throw new JsonataModuleNotFound(id);
        }
        return module;
    }
    #registerRequireFn(suffix = '', implementation, signature) {
        if (this.#opts.requireHelper === false)
            return;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const jsonataExpression = this;
        this.#_expression.registerFunction(this.#opts.requireHelper + suffix, function (moduleId, ...args) {
            const moduleToInclude = jsonataExpression.#getModuleById(moduleId);
            return implementation.call(this, moduleToInclude, ...args);
        }, signature);
    }
    #registerGlobalReqFn() {
        this.#registerRequireFn('', function (module, opts) {
            module.bindExportsToGlobal(this, opts);
        }, '<so?:o>');
    }
    #registerLocalReqFn() {
        this.#registerRequireFn('Ret', function (module) {
            return module.getHandlers(this);
        }, '<s:o>');
    }
    #registerJsonataCoreHooks() {
        // const context = new Map()
        this.#_expression.assign(EnvBuiltInsInternal.EvaluateEntry, withInvokationContext((__invokationContext, ...args) => {
            for (const module of this.#modules) {
                module.execHook('eval:entry', { __invokationContext }, args);
            }
        }));
        this.#_expression.assign(EnvBuiltInsInternal.EvaluateExit, withInvokationContext((__invokationContext, ...args) => {
            for (const module of this.#modules) {
                module.execHook('eval:exit', { __invokationContext }, args);
            }
        }));
    }
    exec(input, bindings) {
        // We do not pass the bindings directly to the expressions `evaluate`
        // since this creates a new environment just below the root environment
        // in the stack. This in turn can not be accessed via the `assign`, which
        // is always connected to the root. This is a problem, since there is then
        // no non-crude way of preventing passed bindings from occluding JSONata's core
        // entry/exit eval callbacks, which are vital to the libraries safe function.
        // Without passing bindings, and instead passing them via `assign`, and
        // then registering the core callbacks afterward -- we achieve guarantees
        // about them being present and managed by this library.
        for (const key in bindings) {
            if (Object.hasOwn(bindings, key)) {
                // We have verified that these are plain properties.
                // eslint-disable-next-line security/detect-object-injection
                this.assign(key, bindings[key]);
            }
        }
        this.#registerJsonataCoreHooks();
        // TODO: Prevent running new input over same expression
        // since it seems you might be able to overwrite shared mutated
        // state with assign. It should be illegal to be able to modify
        // runtime behavior as side effect.
        return this.#_expression.evaluate(input, undefined);
    }
    assign(name, value) {
        this.#_expression.assign(name, value);
        return this;
    }
}
export const expressionFromStr = (expression, modules, opts) => {
    return new JsonataExpression(jsonata(expression, opts), modules, opts);
};
