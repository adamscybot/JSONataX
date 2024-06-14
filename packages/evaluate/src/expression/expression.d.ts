import jsonata, { type Expression } from '@jsonatax/jsonata-extended';
import { type ModularJsonataExpressionOpts } from '../index.js';
import { type JsonataModuleImpl } from '../module/module.js';
declare class JsonataExpression {
    #private;
    constructor(expression: Expression, modules: JsonataModuleImpl<any>[], opts: ModularJsonataExpressionOpts);
    exec(input: any, bindings?: Record<string, any> | undefined): Promise<any>;
    assign(name: string, value: any): this;
}
export declare const expressionFromStr: (expression: Parameters<typeof jsonata>[0], modules: JsonataModuleImpl<any>[], opts: ModularJsonataExpressionOpts) => JsonataExpression;
export {};
