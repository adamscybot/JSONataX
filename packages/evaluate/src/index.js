import jsonata from '@jsonatax/jsonata-extended';
import { createModule, } from './module/module.js';
import { customErrorFactory } from 'ts-custom-error';
import { prefixedString } from './lib/str-utils.js';
export const JsonataModuleNotFound = customErrorFactory(function JsonataModuleNotFound(id, message = '') {
    this.code = 'JSONATA_MODULE_NOT_FOUND';
    this.moduleId = id;
    this.message =
        prefixedString(`The module with ID '${id}' could not be found. Did you add it with \`addModule\`?`) +
            ' ' +
            message;
}, RangeError);
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
export const modularJsonata = ({ defaultExpressionOpts = {}, } = {}) => {
    const { requireHelper = 'r' } = defaultExpressionOpts;
    const resolvedDefaultExpressionOpts = {
        requireHelper,
        ...defaultExpressionOpts,
    };
    const createBuilder = (modules) => {
        const moduleById = (id) => {
            const module = modules.find((module) => module._def.id === id);
            if (!module) {
                throw new JsonataModuleNotFound(id);
            }
            return module;
        };
        return {
            /**
             * Register a module such that it will be available for including in the
             * JSONata expressions produced by this builder.
             *
             * Note changes to the definition after the module has been added will not
             * be effective.
             *
             * @param definition - A {@link JsonataModuleDef} that represents a modules
             *   functionality.
             *
             * @returns The builder for further configuration
             *
             * @throws {@link InvalidJsonataModuleDefinition} If the module definition
             *   is invalid.
             */
            addModule(definition) {
                return createBuilder([...modules, createModule(definition)]);
            },
            /**
             * Similar to the `jsonata()` base method, this provides a wrapper for the
             * expression. The expression is bound the modules that have been added to
             * this builder.
             *
             * Note that when this is called, any modules added after this will not be
             * effective for those expressions already created via this method.
             *
             * Crucially, `evaluate()` can be called on the expression to get the
             * actual results.
             *
             * @param expression - The JSONata string expression
             * @param opts - The {@link ModularJsonataExpressionOpts}. Note, these are
             *   merged with anything passed to
             *   {@link ModularJsonataOpts.defaultExpressionOpts | `defaultExpressionOpts`}
             *   in the options for {@link modularJsonata}.
             *
             * @returns A superset of {@link jsonata.Expression} that provides
             *   additional `modular-jsonata` functionality
             */
            expression(expression, opts) {
                const resolvedExpressionOpts = {
                    ...resolvedDefaultExpressionOpts,
                    ...opts,
                };
                const baseExpression = jsonata(expression, resolvedExpressionOpts);
                const registerRequireFn = (suffix = '', implementation, signature) => {
                    if (resolvedExpressionOpts.requireHelper === false)
                        return;
                    baseExpression.registerFunction(resolvedDefaultExpressionOpts.requireHelper + suffix, function (moduleId, ...args) {
                        const moduleToInclude = moduleById(moduleId);
                        return implementation.call(this, moduleToInclude, ...args);
                    }, signature);
                };
                registerRequireFn('', function (module, opts) {
                    module.bindExportsToGlobal(this, opts);
                }, '<so?:o>');
                registerRequireFn('Ret', function (module) {
                    return module.getHandlers(this);
                }, '<s:o>');
                registerRequireFn('Scoped', function (module, lambda) {
                    module.bindExportsToGlobal(this, {});
                    return lambda();
                }, '<so?:o>');
                return {
                    /**
                     * If you do not wish to use `$r` in the expression itself, the module
                     * can be injected into the expression scope such that it is already
                     * available.
                     *
                     * Note this will mean it is injected into the top level scope
                     *
                     * @param id - The ID of the module that was previously registered
                     *   with `addModule`.
                     * @param opts - The {@link BindModuleOpts}
                     *
                     * @returns The expression wrapper
                     */
                    injectModule(id, opts) {
                        moduleById(id).bindExportsToExpression(baseExpression, opts);
                        return this;
                    },
                    /**
                     * If you do not wish to use `$include` in the expression itself,
                     * modules can be injected into the expression scope such that it is
                     * already available.
                     *
                     * Note this will mean it is injected into the top level scope
                     *
                     * This module simply wraps `injectModule` such that all added modules
                     * are globally available.
                     *
                     * @returns The expression wrapper
                     */
                    injectAllModules() {
                        modules.forEach((module) => module.bindExportsToExpression(baseExpression));
                        return this;
                    },
                    ...baseExpression,
                };
            },
        };
    };
    return createBuilder([]);
};
