import { type DefinePluginBuilder } from './types.js';
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
export declare const defineModule: <ID extends string>(id: ID) => DefinePluginBuilder;
export type DefineModule = typeof defineModule;
