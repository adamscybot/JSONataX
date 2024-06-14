import { type Focus, type Expression } from '@jsonatax/jsonata-extended';
import { type JsonataModuleDef } from './define/types.js';
import { type DeepReadonly } from '../lib/immutability.js';
export type BindModuleOpts = {
    /**
     * The namespace prefix that the modules functions will be available under in
     * this scope. I.e. `$<namespacePrefix>_<functionName>(...)`.
     *
     * @defaultValue The `id` of the module definition.
     */
    alias?: string;
};
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
export declare class JsonataModuleImpl<T extends JsonataModuleDef> {
    #private;
    _def: DeepReadonly<T>;
    constructor(definition: T);
    get [Symbol.toStringTag](): string;
    getHandlers(focus: Focus): {
        [k: string]: (...args: any[]) => any;
    };
    bindExportsToContext(focus: Focus, opts?: BindModuleOpts): void;
    bindExportsToGlobal(focus: Focus, opts?: BindModuleOpts): void;
    bindExportsToExpression(expression: Expression, opts?: BindModuleOpts): void;
    execHook(hook: string, thisContext: any, args: any[]): void;
}
export type JsonataModule = InstanceType<typeof JsonataModuleImpl>;
export declare const createModule: <T extends JsonataModuleDef>(module: T) => JsonataModuleImpl<T>;
