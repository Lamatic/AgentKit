export default class NodeAttributes {
    attributes: Record<string, {
        hasValue?: false;
    } | {
        hasValue: true;
        value: any;
    }>;
    constructor(ASTnode: any);
    hasAny(): boolean;
    has(attrName: string): boolean;
    hasValue(attrName: string): boolean;
    value(attrName: string): any;
}
