import { customErrorFactory } from 'ts-custom-error';
import { prefixedString } from './str-utils.js';
export const InvalidJsonataModuleDefinition = customErrorFactory(function InvalidJsonataModuleDefinition(message) {
    this.code = 'INVALID_JSONATA_MODULE_DEFINITION';
    this.message =
        prefixedString('The definition of this JSONAta module was invalid') +
            ' ' +
            message;
}, TypeError);
