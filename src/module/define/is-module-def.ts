import { customErrorFactory } from 'ts-custom-error'
import { prefixedString } from '../../lib/str-utils.js'
import { type JsonataModuleFnDef, type JsonataModuleDef } from './types.js'

const MODULE_ID_REGEX = /^[a-zA-Z0-9_:]+$/
const FN_NAME_REGEX = /^[a-zA-Z0-9_]+$/

export const InvalidJsonataModuleDefinition = customErrorFactory(
  function InvalidJsonataModuleDefinition(def: any, message: string = '') {
    this.code = 'INVALID_JSONATA_MODULE_DEFINITION'
    this.def = def
    this.message =
      prefixedString(
        `Could not process module definition as it is invalid. Cause:`,
      ) +
      ' ' +
      message
  },
  TypeError,
)

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
export function validateJsonataModuleDefFn(
  def: any,
): asserts def is JsonataModuleFnDef {
  const err = (message: string) => {
    throw InvalidJsonataModuleDefinition(
      def,
      'Issue found in function definition: ' + message,
    )
  }

  if (def !== Object(def) || Array.isArray(def))
    err('Function definition must be a plain object.')

  if (typeof def.name !== 'string' || !FN_NAME_REGEX.test(def.name))
    err(
      "`name` must be a non-empty string consisting of alpha-numeric characters or '_', ':'.",
    )

  if (typeof def.implementation !== 'function')
    err('`implementation` must be a function.')

  if (typeof def.signature !== 'undefined' && typeof def.signature !== 'string')
    err('`signature` must be a valid JSONata signature string or undefined.')

  return def
}

/**
 * Checks if the input object is a function descriptor object from a module
 * definition.
 *
 * @param def - A value to assert
 *
 * @returns `true` if valid, otherwise `false`
 */
export function isJsonataModuleDefFn(def: any): def is JsonataModuleFnDef {
  try {
    validateJsonataModuleDefFn(def)
    return true
  } catch {
    return false
  }
}

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
export function validateJsonataModuleDef<T extends JsonataModuleDef>(
  def: T,
): asserts def is T {
  const err = (message: string) => {
    throw InvalidJsonataModuleDefinition(def, message)
  }

  if (def !== Object(def) || Array.isArray(def))
    err('Definition must be a plain object.')

  if (typeof def.id !== 'string' || !MODULE_ID_REGEX.test(def.id))
    err(
      "`id` must be a non-empty string consisting of alpha-numeric characters or '_'.",
    )

  if (
    typeof def.description !== 'undefined' &&
    typeof def.description !== 'string'
  )
    err('`description` must be a string or undefined.')

  if (!Array.isArray(def.exports)) err('`fns` must be an array.')
}

/**
 * Checks if the input object is a module definition object.
 *
 * @param def - A value to assert
 *
 * @returns `true` if valid, otherwise `false`
 */
export const isJsonataModuleDef = (def: any): def is JsonataModuleDef => {
  try {
    validateJsonataModuleDef(def)
    return true
  } catch {
    return false
  }
}
