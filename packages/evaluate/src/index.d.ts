import jsonata, { type JsonataOptions } from '@jsonatax/jsonata-extended';
import { type BindModuleOpts } from './module/module.js';
import { type JsonataModuleDef } from './module/define/types.js';
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
    requireHelper?: string | false;
}
export type ModularJsonataOpts = {
    /**
     * These options will be the defaults used for every expression that is
     * created. Note, they can still be overridden in the expression opts.
     *
     * @see {@link ModularJsonataExpressionOpts}
     */
    defaultExpressionOpts?: ModularJsonataExpressionOpts;
};
export declare const JsonataModuleNotFound: import("ts-custom-error").CustomErrorConstructor<import("ts-custom-error").CustomErrorProperties>;
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
export declare const modularJsonata: ({ defaultExpressionOpts, }?: ModularJsonataOpts) => {
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
    addModule<T extends JsonataModuleDef>(definition: T): {
        addModule<T_1 extends JsonataModuleDef>(definition: T_1): {
            addModule<T_2 extends JsonataModuleDef>(definition: T_2): {
                addModule<T_3 extends JsonataModuleDef>(definition: T_3): {
                    addModule<T_4 extends JsonataModuleDef>(definition: T_4): {
                        addModule<T_5 extends JsonataModuleDef>(definition: T_5): {
                            addModule<T_6 extends JsonataModuleDef>(definition: T_6): {
                                addModule<T_7 extends JsonataModuleDef>(definition: T_7): {
                                    addModule<T_8 extends JsonataModuleDef>(definition: T_8): {
                                        addModule<T_9 extends JsonataModuleDef>(definition: T_9): {
                                            addModule<T_10 extends JsonataModuleDef>(definition: T_10): any;
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
                                            expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
                                                evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
                                                evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
                                                assign(name: string, value: any): void;
                                                registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
                                                ast(): jsonata.ExprNode;
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
                                                injectModule(id: (import("./lib/immutability.js").DeepReadonly<T> | import("./lib/immutability.js").DeepReadonly<T_1> | import("./lib/immutability.js").DeepReadonly<T_2> | import("./lib/immutability.js").DeepReadonly<T_3> | import("./lib/immutability.js").DeepReadonly<T_4> | import("./lib/immutability.js").DeepReadonly<T_5> | import("./lib/immutability.js").DeepReadonly<T_6> | import("./lib/immutability.js").DeepReadonly<T_7> | import("./lib/immutability.js").DeepReadonly<T_8> | import("./lib/immutability.js").DeepReadonly<T_9>)["id"], opts?: BindModuleOpts): any;
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
                                                injectAllModules(): any;
                                            };
                                        };
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
                                        expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
                                            evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
                                            evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
                                            assign(name: string, value: any): void;
                                            registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
                                            ast(): jsonata.ExprNode;
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
                                            injectModule(id: (import("./lib/immutability.js").DeepReadonly<T> | import("./lib/immutability.js").DeepReadonly<T_1> | import("./lib/immutability.js").DeepReadonly<T_2> | import("./lib/immutability.js").DeepReadonly<T_3> | import("./lib/immutability.js").DeepReadonly<T_4> | import("./lib/immutability.js").DeepReadonly<T_5> | import("./lib/immutability.js").DeepReadonly<T_6> | import("./lib/immutability.js").DeepReadonly<T_7> | import("./lib/immutability.js").DeepReadonly<T_8>)["id"], opts?: BindModuleOpts): any;
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
                                            injectAllModules(): any;
                                        };
                                    };
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
                                    expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
                                        evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
                                        evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
                                        assign(name: string, value: any): void;
                                        registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
                                        ast(): jsonata.ExprNode;
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
                                        injectModule(id: (import("./lib/immutability.js").DeepReadonly<T> | import("./lib/immutability.js").DeepReadonly<T_1> | import("./lib/immutability.js").DeepReadonly<T_2> | import("./lib/immutability.js").DeepReadonly<T_3> | import("./lib/immutability.js").DeepReadonly<T_4> | import("./lib/immutability.js").DeepReadonly<T_5> | import("./lib/immutability.js").DeepReadonly<T_6> | import("./lib/immutability.js").DeepReadonly<T_7>)["id"], opts?: BindModuleOpts): any;
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
                                        injectAllModules(): any;
                                    };
                                };
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
                                expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
                                    evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
                                    evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
                                    assign(name: string, value: any): void;
                                    registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
                                    ast(): jsonata.ExprNode;
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
                                    injectModule(id: (import("./lib/immutability.js").DeepReadonly<T> | import("./lib/immutability.js").DeepReadonly<T_1> | import("./lib/immutability.js").DeepReadonly<T_2> | import("./lib/immutability.js").DeepReadonly<T_3> | import("./lib/immutability.js").DeepReadonly<T_4> | import("./lib/immutability.js").DeepReadonly<T_5> | import("./lib/immutability.js").DeepReadonly<T_6>)["id"], opts?: BindModuleOpts): any;
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
                                    injectAllModules(): any;
                                };
                            };
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
                            expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
                                evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
                                evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
                                assign(name: string, value: any): void;
                                registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
                                ast(): jsonata.ExprNode;
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
                                injectModule(id: (import("./lib/immutability.js").DeepReadonly<T> | import("./lib/immutability.js").DeepReadonly<T_1> | import("./lib/immutability.js").DeepReadonly<T_2> | import("./lib/immutability.js").DeepReadonly<T_3> | import("./lib/immutability.js").DeepReadonly<T_4> | import("./lib/immutability.js").DeepReadonly<T_5>)["id"], opts?: BindModuleOpts): any;
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
                                injectAllModules(): any;
                            };
                        };
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
                        expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
                            evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
                            evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
                            assign(name: string, value: any): void;
                            registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
                            ast(): jsonata.ExprNode;
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
                            injectModule(id: (import("./lib/immutability.js").DeepReadonly<T> | import("./lib/immutability.js").DeepReadonly<T_1> | import("./lib/immutability.js").DeepReadonly<T_2> | import("./lib/immutability.js").DeepReadonly<T_3> | import("./lib/immutability.js").DeepReadonly<T_4>)["id"], opts?: BindModuleOpts): any;
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
                            injectAllModules(): any;
                        };
                    };
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
                    expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
                        evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
                        evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
                        assign(name: string, value: any): void;
                        registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
                        ast(): jsonata.ExprNode;
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
                        injectModule(id: (import("./lib/immutability.js").DeepReadonly<T> | import("./lib/immutability.js").DeepReadonly<T_1> | import("./lib/immutability.js").DeepReadonly<T_2> | import("./lib/immutability.js").DeepReadonly<T_3>)["id"], opts?: BindModuleOpts): any;
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
                        injectAllModules(): any;
                    };
                };
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
                expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
                    evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
                    evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
                    assign(name: string, value: any): void;
                    registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
                    ast(): jsonata.ExprNode;
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
                    injectModule(id: (import("./lib/immutability.js").DeepReadonly<T> | import("./lib/immutability.js").DeepReadonly<T_1> | import("./lib/immutability.js").DeepReadonly<T_2>)["id"], opts?: BindModuleOpts): any;
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
                    injectAllModules(): any;
                };
            };
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
            expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
                evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
                evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
                assign(name: string, value: any): void;
                registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
                ast(): jsonata.ExprNode;
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
                injectModule(id: (import("./lib/immutability.js").DeepReadonly<T> | import("./lib/immutability.js").DeepReadonly<T_1>)["id"], opts?: BindModuleOpts): any;
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
                injectAllModules(): any;
            };
        };
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
        expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
            evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
            evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
            assign(name: string, value: any): void;
            registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
            ast(): jsonata.ExprNode;
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
            injectModule(id: import("./lib/immutability.js").DeepReadonly<T>["id"], opts?: BindModuleOpts): any;
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
            injectAllModules(): any;
        };
    };
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
    expression(expression: Parameters<typeof jsonata>[0], opts?: ModularJsonataExpressionOpts): {
        evaluate(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
        evaluate(input: any, bindings: Record<string, any> | undefined, callback: (err: jsonata.JsonataError, resp: any) => void): void;
        assign(name: string, value: any): void;
        registerFunction(name: string, implementation: (this: jsonata.Focus, ...args: any[]) => any, signature?: string | undefined): void;
        ast(): jsonata.ExprNode;
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
        injectModule(id: never, opts?: BindModuleOpts): any;
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
        injectAllModules(): any;
    };
};
