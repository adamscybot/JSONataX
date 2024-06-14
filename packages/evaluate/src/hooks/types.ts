import { type Focus } from '@jsonatax/jsonata-extended'
import { type InvokationContext } from '../lib/invokation-context.js'

enum HookTypes {
  EvalEntry = 'eval:entry',
  EvalExit = 'eval:exit',
}

type HookMap = {
  [HookTypes.EvalEntry]: EvalHandler
  [HookTypes.EvalExit]: EvalHandler
}

export type HookHandler<Type extends HookTypes> = HookMap[Type]

export type EvalHandler = (
  this: {
    /**
     * Allows calls from inside a JSONAta expression to be disambiguated from
     * those on the outside.
     *
     * @remarks
     * The way of achieving this is unfortunately hacky, so it is not
     * recommended to couple to this in plugins. modular-jsonata internal
     * plugins do use this, but are carefully maintained against and verified
     * against new JSONata versions.
     *
     * May be useful in rare circumstances where internal plugins have been
     * disabled.
     *
     * @internal
     */
    __invokationContext: InvokationContext
  },

  expression: Record<string, any> & { type: string; position: number },
  input: any,
  environment: Focus['environment'],
) => Promise<void> | void

type HookTapArgs<Type extends HookTypes> = [
  hook: `${Type}`,
  handler: HookHandler<Type>,
]

type TapEvalEntry<Context> =
  /**
   * Registers a handler against the `eval:entry` hook.
   *
   * `eval:entry` hooks into JSONata's underlying evaluator. At the start of
   * each recursion within JSONata for a sub-expression, this hook is called.
   *
   * @remarks
   * The args to the listener can be mutated. This allows for JSONata's
   * execution to be modified, which is powerful, buts also leaves a wide scope
   * to break things.
   *
   * Often coupled with behaviours hooked into
   * {@link EvalExitHook | `eval:exit`}.
   *
   * Some use cases include preventing expressions of a certain depth and
   * time-boxing expressions.
   */
  (...args: HookTapArgs<HookTypes.EvalEntry>) => Context

type TapEvalExit<Context> =
  /**
   * Registers a handler against the `eval:exit` hook.
   *
   * `eval:exit` hooks into JSONata's underlying evaluator. At the end of each
   * recursion within JSONata for a sub-expression, this hook is called.
   *
   * @param handler - Called when this hook executes.
   * @param hook - String identifier of this hook.
   *
   * @remarks
   * The args to the listener can be mutated. This allows for JSONata's
   * execution to be modified, which is powerful, buts also leaves a wide scope
   * to break things.
   *
   * Often coupled with behaviours hooked into
   * {@link EvalEntryHook | `eval:entry`}.
   *
   * Some use cases include preventing expressions of a certain depth and
   * time-boxing expressions.
   */
  (
    hook: `${HookTypes.EvalExit}`,
    handler: HookHandler<HookTypes.EvalExit>,
  ) => Context

export interface HookRegistry<Context>
  extends TapEvalEntry<Context>,
    TapEvalExit<Context> {
  (hook: HookTypes, handler: (...args: any[]) => any): Context
}
