import { defineModule } from './define.js'
import { modularJsonata } from './evaluator.js'
const module = defineModule('lol')
  .description('Does some things')
  .export('example', '<(z)>', function (lol) {
    return 'ok'
  })
  // .export('yay', '<s-:n>', function (input) {
  //   return input.length
  // })
  .build()
console.log(module)
;(async () => {
  console.log(
    await modularJsonata()
      .addModule(module)
      .expression(
        `
(
  
            (
            
             /* aProperty.$rRet('lol').example($.example('test2'), 'test') */
            /* $rRet('lol').example($.example($$.aProperty[0], 'test2'), 'test')   */

            $rRet('lol').example(1);
           /* bProperty.$rRet('lol').example($.example('test2'), 'test');*/
            


           
           /* (
              (
              $r('lol');
              );
              aProperty.($lol_example('test') ~> $lol_yay())
            )*/

          



          /* aProperty.$rLambda('lol', function($_, $static) {
            (
              $example := $static.example;
             $ ~> $_('example')('test1') ~> $_('example')('test2');
             $ ~> $example('test1')
            )
           }) */

           /* aProperty.$rChain('lol', function() {
            $ ~> $example('test') ~> $yay()

           }) */

            );
   
  )
`,
      )

      .evaluate({
        aProperty: ['first_', 'second_'],
        bProperty: ['third_', 'fourth_'],
      }),
  )
})()
