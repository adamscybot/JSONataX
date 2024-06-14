import { type Expression } from '@jsonatax/jsonata-extended';
import { type DeepReadonly, type ReadonlyFunction } from '../../lib/immutability.js';
import { type ImplFromSignature, type ValidSignature } from '../../signature/parser.js';
import { type HookRegistry } from '../../hooks/types.js';
export declare const inspectSymbol: unique symbol;
export type CustomInspect<T> = T & {
    [inspectSymbol]?: (...args: any) => string;
};
export interface DefinePluginBuilder {
    /** A brief description of what this module does. */
    description(description: string): this;
    /**
     * Register a function that this module makes available to the expressions.
     *
     * Note that the types of the arguments of the `implementation` function will
     * be inferred automatically from the passed in `signature` string. Invalid
     * signatures are detected at compile time for TS consumers.
     *
     * {@link DefinePluginBuilder.exportUnsafe | `exportUnsafe`} can be used if you
     * wish to skip validation.
     *
     * @param name - The unique name of the function.
     * @param signature - The string defining the arg & return types of this fn.
     *   See
     *   {@link https://docs.jsonata.org/embedding-extending#function-signature-syntax | signature}.
     * @param implementation - The function that will be called when this is
     *   invoked from a JSonata expression.
     *
     * @see {@link ParamsFromSignature} and {@link ReturnTypeFromSignature} for
     *      detail of caveats regarding type inference.
     * @see {@link https://docs.jsonata.org/embedding-extending | base documentation} for JSONAta `registerFunction`.
     */
    export<Signature extends string>(name: string, signature: ValidSignature<Signature>, impl: ImplFromSignature<Signature>): this;
    /**
     * Register a function that this module makes available to the expressions,
     * but without any validation on the parameters.
     *
     * It is usually recommended to use `export` instead.
     *
     * @param name - The unique name of the function.
     * @param implementation - The function that will be called when this is
     *   invoked from a JSonata expression.
     *
     * @see The JSONata {@link https://docs.jsonata.org/embedding-extending |
     *      base documentation} for `registerFunction`.
     */
    exportUnsafe(name: string, implementation: JsonataModuleFnDefImpl): this;
    /**
     * Register a handler against a `hook`. Hooks are executed in the order they
     * are registered.
     *
     * @param hook - String identifier for the hook you wish to register callbacks
     *   against.
     * @param handler - Function that will be called when the library consumes the
     *   hook.
     */
    tapHook: HookRegistry<DefinePluginBuilder>;
    /**
     * Builds and reutrns the final module definition ready for use by a consumer.
     *
     * @returns A readonly {@link JsonataModuleDef} which can be used by
     *   `modular-json`.
     */
    build(): DeepReadonly<JsonataModuleDef>;
}
export type JsonataModuleHookDef = {
    hook: Parameters<HookRegistry<any>>[0];
    handler: Parameters<HookRegistry<any>>[1];
};
export type JsonataModuleFnDefImpl = ReadonlyFunction<Parameters<Expression['registerFunction']>[1]>;
/**
 * Substructure of a JSONata module that represents an individual function that
 * the module provides.
 *
 * @see {@link JsonataModuleDef}
 */
export type JsonataModuleFnDef = {
    name: Parameters<Expression['registerFunction']>[0];
    implementation: JsonataModuleFnDefImpl;
    signature?: Parameters<Expression['registerFunction']>[2];
};
/**
 * Represents a JSONata module that extends its functionality, intended for use
 * with [modular-jsonata](https://github.com/adamscybot/modular-jsonata).
 *
 * If you wish to use this plugin with JSOnata, the recommended way is to adopt
 * [modular-jsonata](https://github.com/adamscybot/modular-jsonata).
 *
 * If you do not wish to adopt `modular-jsonata`. An escape hatch with caveats
 * is available via {@link JsonataModuleDef.basicApply | `basicApply`} that does
 * not require
 * [modular-jsonata](https://github.com/adamscybot/modular-jsonata).
 *
 * @remarks
 * This definition is produced via the
 * {@link defineTypes.defineModule | `defineModule`}. builder. Use this API to
 * create a `JsonataModuleDef`.
 *
 * @privateRemarks
 * The Structure is deeply immutable at runtime to mitigate theoretical attacks
 * that could target a legitimate module rather than the core in order to
 * unexpectedly alter the plugins behaviour (change/add fns) without needing
 * prototype pollution. Prototype pollution of the definition is also
 * incidentally protected by this but it's checked at the time of ingest anyway
 * since there is no guarantee the incoming structure was created by
 * `defineModule`.
 *
 * @see The {@link https://github.com/adamscybot/modular-jsonata |
 *      modular-jsonata} package which is used to consume this.
 */
export type JsonataModuleDef = {
    id: string;
    description?: string;
    exports: ReadonlyArray<JsonataModuleFnDef>;
    hooks: ReadonlyArray<JsonataModuleHookDef>;
};
