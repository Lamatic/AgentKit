declare function safeJSONStringify(value?: any): string;
declare function safeJSONParse(value?: any): any;
declare const safeJSON: {
    stringify: typeof safeJSONStringify;
    parse: typeof safeJSONParse;
};
export { safeJSON, safeJSONParse, safeJSONStringify };
export default safeJSON;
//# sourceMappingURL=json.d.ts.map