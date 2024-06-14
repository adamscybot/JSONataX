import { deepFreeze } from '../../lib/immutability.js';
const buildFnObj = ({ name, implementation, signature, }) => Object.assign(Object.create(null), {
    name,
    implementation,
    signature,
    // [inspectSymbol](depth: any, options: any, inspect: any) {
    //   return `${options.stylize(`[JsonataModuleFnDef(${obj.name})]`, 'special')}`
    // },
});
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
export const defineModule = (id) => {
    const createProviderConfigBuilder = () => {
        const exports = [];
        const hooks = [];
        let _description;
        const builder = {
            description(description) {
                _description = description;
                return this;
            },
            export(name, signature, impl) {
                exports.push(buildFnObj({
                    name,
                    implementation: impl,
                    signature: signature,
                }));
                return this;
            },
            exportUnsafe(name, implementation) {
                exports.push(buildFnObj({
                    name,
                    implementation,
                }));
                return this;
            },
            tapHook(hook, handler) {
                hooks.push(Object.assign(Object.create(null), { hook, handler }));
                return this;
            },
            build() {
                return deepFreeze(Object.assign(Object.create(null), {
                    id,
                    description: _description,
                    exports,
                    hooks,
                }));
            },
        };
        return builder;
    };
    return createProviderConfigBuilder();
};
