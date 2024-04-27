import { defineModule } from './module/define/define.js'
import { type JsonataModuleDef } from './module/define/types.js'

/**
 * This is a module which is intended to be used with [modular-jsonata](https://github.com/adamscybot/modular-jsonata).
 * It extends JSONAta's base functionality.
 *
 * Non-recommended escape hatches to apply the module without [modular-jsonata](https://github.com/adamscybot/modular-jsonata) are available.
 *
 * @see {@link JsonataModuleDef} TSDoc for basic usage instructions.
 * @see {@link https://github.com/adamscybot/modular-jsonata | Project Github} for full documentation.
 */
export default () =>
  defineModule('lol')
    .description('Does some things')
    .export('example', '<s:s>', function (numbers) {
      console.log('this', this)
      return 'hi'
    })
    .tapHook('eval:entry', (expr, input, env) => {
      if (expr.type !== 'bind') return
      if (expr.lhs.value === 'clone') {
        throw new Error('test')
      }
    })
    .build()
