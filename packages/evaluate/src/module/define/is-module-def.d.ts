import { type JsonataModuleFnDef, type JsonataModuleDef } from './types.js';
export declare const InvalidJsonataModuleDefinition: import("ts-custom-error").CustomErrorConstructor<import("ts-custom-error").CustomErrorProperties>;
/**
 * Checks if the input object is a function descriptor object from a module
 * definition object and throws if it is not.
 *
 * @param def - A value to assert
 *
 * @returns The passed in value
 *
 * @throws {@link InvalidJsonataModuleDefinition}
 */
export declare function validateJsonataModuleDefFn(def: any): asserts def is JsonataModuleFnDef;
/**
 * Checks if the input object is a function descriptor object from a module
 * definition.
 *
 * @param def - A value to assert
 *
 * @returns `true` if valid, otherwise `false`
 */
export declare function isJsonataModuleDefFn(def: any): def is JsonataModuleFnDef;
/**
 * Checks if the input object is a module definition object and throws if it is
 * not.
 *
 * @param def - A value to assert
 *
 * @returns The passed in value
 *
 * @throws {@link InvalidJsonataModuleDefinition}
 */
export declare function validateJsonataModuleDef<T extends JsonataModuleDef>(def: T): asserts def is T;
/**
 * Checks if the input object is a module definition object.
 *
 * @param def - A value to assert
 *
 * @returns `true` if valid, otherwise `false`
 */
export declare const isJsonataModuleDef: (def: any) => def is JsonataModuleDef;
