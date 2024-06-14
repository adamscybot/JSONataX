export const applyToExpression = (definition, expression) => {
    definition.exports.forEach(({ implementation, name, signature }) => {
        expression.registerFunction(name, implementation, signature);
    });
};
