import type { Expression } from 'jsonata'
import type { JsonataModuleDef } from './types.js'

export const applyToExpression = (
  definition: JsonataModuleDef,
  expression: Expression,
) => {
  definition.exports.forEach(({ implementation, name, signature }) => {
    expression.registerFunction(name, implementation, signature)
  })
}
