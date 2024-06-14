/** @private */
export type Primitive = string | number | bigint | boolean | symbol | null | undefined;
export type ReadonlyFunction<F extends Function> = Readonly<Function> & F;
export type DeepReadonly<T> = T extends ((...args: any[]) => any) | Primitive ? T : T extends _DeepReadonlyArray<infer U> ? _DeepReadonlyArray<U> : T extends _DeepReadonlyObject<infer V> ? _DeepReadonlyObject<V> : T;
/** @private */
export interface _DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {
}
/** @private */
export type _DeepReadonlyObject<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};
export declare function deepFreeze<T>(obj: T): DeepReadonly<T>;
