/**
 * This is a module which is intended to be used with [modular-jsonata](https://github.com/adamscybot/modular-jsonata).
 * It extends JSONAta's base functionality.
 *
 * Non-recommended escape hatches to apply the module without [modular-jsonata](https://github.com/adamscybot/modular-jsonata) are available.
 *
 * @see {@link JsonataModuleDef} TSDoc for basic usage instructions.
 * @see {@link https://github.com/adamscybot/modular-jsonata | Project Github} for full documentation.
 */
declare const _default: () => import("./lib/immutability.js")._DeepReadonlyObject<{
    id: string;
    description?: string | undefined;
    exports: readonly import("./module/define/types.js").JsonataModuleFnDef[];
    hooks: readonly import("./module/define/types.js").JsonataModuleHookDef[];
}>;
export default _default;
