declare const GlobalURLPattern: {
    new (input: URLPatternInput, baseURL: string | URL, options?: URLPatternOptions): URLPattern;
    new (input?: URLPatternInput, options?: URLPatternOptions): URLPattern;
    prototype: URLPattern;
} | undefined;
export { GlobalURLPattern as URLPattern };
