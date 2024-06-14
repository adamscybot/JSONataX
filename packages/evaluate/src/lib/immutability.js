export function deepFreeze(obj) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
        // eslint-disable-next-line security/detect-object-injection
        const propValue = obj[prop];
        if (typeof propValue === 'object' &&
            propValue !== null &&
            !Object.isFrozen(propValue)) {
            deepFreeze(propValue);
        }
    });
    return obj;
}
