import { type Expression } from 'jsonata'
import type * as defineTypes from '../define.js'

export const inspectSymbol = Symbol.for('nodejs.util.inspect.custom')

export type CustomInspect<T> = T & {
  [inspectSymbol]?: (...args: any) => string
}

export type JsonataModuleFnDefImpl = Parameters<
  Expression['registerFunction']
>[1]

export type JsonataModuleFnDef = {
  name: Parameters<Expression['registerFunction']>[0]
  implementation: JsonataModuleFnDefImpl
  signature?: Parameters<Expression['registerFunction']>[2]
}

/**
 * Defines a JSONata module that extends its functionality.
 *
 * Typically, this is produced via  {@link defineTypes.defineModule | `defineModule`}.
 *
 * @see The [modular-jsonata](https://github.com/adamscybot/modular-jsonata) package which is used to consume this.
 */
export type JsonataModuleDef = Readonly<{
  id: string
  description?: string
  fns: Readonly<JsonataModuleFnDef[]>
}>
