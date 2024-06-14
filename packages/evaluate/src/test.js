// @ts-nocheck
import { modularJsonata } from './builder/builder.js';
import { coreEnv } from './module/bundled/coreEnv.js';
// import { deepFreeze } from './lib/immutability.js'
// import { deepFreeze } from './lib/immutability.js'
// discoveries
// lambdas always return promises
// some compiler for esm modules
// timeouton functions
// parallel improved signature impl?
// disallow returning lambdas
// expression timeboxing
// const ok = jsonata(`( 'test' )`)
// const builins = {}
// ok.assign('__evaluate_entry', async (expr, input, environment) => {
//   builins['clone'] = environment.lookup('clone')
//   throw new Error()
// })
// try {
//   await ok.evaluate()
// } catch {}
// console.log(builins)
const expression = modularJsonata().addModule(coreEnv()).expression(`

  (



    
    (
      $test := $sum;
      $.signature;
      (
        $.signature;
      )
    )

  )
  `);
// expression.assign('__evaluate_entry', (expr, input, environment) => {
//   console.log(expr, input)
//   const oldEnvLookup = environment.lookup
//   const oldEnvBind = environment.bind
//   environment.bind = function (name, value) {
//     if (name === 'clone') throw new Error('test')
//     oldEnvBind(name, value)
//   }
//   // environment.lookup = function (name) {
//   //   console.log('ok')
//   //   return oldEnvLookup(name)
//   // }
//   // environment.lookup('__proto__', {
//   //   set ['clone'](value) {
//   //     throw new Error('Can not override clone')
//   //   },
//   // })
// })
const input = {
    signature: { test: 'test' },
    aProperty: ['first_', 'second_'],
    bProperty: ['third_', 'fourth_'],
};
console.log(await expression.exec(input, { __evaluate_entry: 'test' }));
// console.log('actrual input', input)
// console.log(
//   'woo',
//   await jsonata(
//     '(' + '  $inf := function($n){$n+$inf($n-1)};' + '  $inf(5)' + ')',
//   ).evaluate(undefined),
// )
// console.log(module)
// /** @ts-ignore */
// module.fns[0].implementation.test = 'ok'
// /** @ts-ignore */
// console.log(module.fns[0].implementation.test)
// ;(async () => {
//   console.log(
//     await modularJsonata()
//       .addModule(module)
//       .expression(
//         `
// (
//             (
//              $lol_example.implementation
//              /* aProperty.$rRet('lol').example($.example('test2'), 'test') */
//             /* $rRet('lol').example($.example($$.aProperty[0], 'test2'), 'test')   */
//             /*   $rRet('lol').example();*/
//            /* bProperty.$rRet('lol').example($.example('test2'), 'test');*/
//           /* bProperty.$rRet('lol').example( 'test', undefined, 'test2') */
//           /*   $rRet('lol').example(λ($a) { $a + 5 }); */
//            /* (
//               (
//               $r('lol');
//               );
//               aProperty.($lol_example('test') ~> $lol_yay())
//             )*/
//           /* aProperty.$rLambda('lol', function($_, $static) {
//             (
//               $example := $static.example;
//              $ ~> $_('example')('test1') ~> $_('example')('test2');
//              $ ~> $example('test1')
//             )
//            }) */
//            /* aProperty.$rChain('lol', function() {
//             $ ~> $example('test') ~> $yay()
//            }) */
//             );
//   )
// `,
//       )
//       .injectModule('lol')
//       .evaluate({
//         signature: { test: 'test' },
//         aProperty: ['first_', 'second_'],
//         bProperty: ['third_', 'fourth_'],
//       }),
//   )
// })()
