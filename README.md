# modular-jsonata

Work in progress! Expected April 2024.
Todo, pause expressions? See all expressions evaluating and their status.
Rate limit expressions?
Expression progress?
debug tree middleware!!!
add ability for output metadata
allow plugins to see if other plugins exist
state shared across expressions
orig input should be available in the after.
memwatch
let middlewards know their own priority level
tagged template literals to insert debug points
split the middleware/eval part awau
intelligent inclusion
creation of expression
we do need a separate

new API

const executor = await mJsonata({})
.use(secureEnv())
.use(timed())
.executor((p) =>
p.hookEvaluator({
startFrame() {},
exitFrame() {},
}),

    p.hookPipeline()

);

// detect arrazys and use workers
// enhance error with where issue was
