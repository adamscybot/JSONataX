import { customErrorFactory } from 'ts-custom-error'
import { prefixedString } from '../lib/str-utils.js'

export const JsonataModuleNotFound = customErrorFactory(
  function JsonataModuleNotFound(id: string, message: string = '') {
    this.code = 'JSONATA_MODULE_NOT_FOUND'
    this.moduleId = id
    this.message =
      prefixedString(
        `The module with ID '${id}' could not be found. Did you add it with \`addModule\`?`,
      ) +
      ' ' +
      message
  },
  RangeError,
)
