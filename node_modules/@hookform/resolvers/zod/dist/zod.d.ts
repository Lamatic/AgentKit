import { FieldValues, Resolver } from 'react-hook-form';
import type * as z3 from 'zod/v3';
import type * as z4 from 'zod/v4/core';
type RawResolverOptions = {
    mode?: 'async' | 'sync';
    raw: true;
};
type NonRawResolverOptions = {
    mode?: 'async' | 'sync';
    raw?: false;
};
interface Zod3Type<O = unknown, I = unknown> {
    _output: O;
    _input: I;
    _def: object;
}
interface Zod4Type<Output = unknown, Input = unknown> {
    _zod: {
        output: Output;
        input: Input;
    };
}
type IsUnresolved<T> = PropertyKey extends keyof T ? true : false;
type UnresolvedFallback<T, Fallback> = IsUnresolved<typeof z3> extends true ? Fallback : T;
type FallbackIssue = {
    code: string;
    message: string;
    path: (string | number)[];
};
type Zod3ParseParams = UnresolvedFallback<z3.ParseParams, {
    path?: (string | number)[];
    errorMap?: (iss: FallbackIssue, ctx: {
        defaultError: string;
        data: any;
    }) => {
        message: string;
    };
    async?: boolean;
}>;
type Zod4ParseParams = UnresolvedFallback<z4.ParseContext<z4.$ZodIssue>, {
    readonly error?: (iss: FallbackIssue) => null | undefined | string | {
        message: string;
    };
    readonly reportInput?: boolean;
    readonly jitless?: boolean;
}>;
export declare function zodResolver<Input extends FieldValues, Context, Output>(schema: Zod3Type<Output, Input>, schemaOptions?: Zod3ParseParams, resolverOptions?: NonRawResolverOptions): Resolver<Input, Context, Output>;
export declare function zodResolver<Input extends FieldValues, Context, Output>(schema: Zod3Type<Output, Input>, schemaOptions: Zod3ParseParams | undefined, resolverOptions: RawResolverOptions): Resolver<Input, Context, Input>;
export declare function zodResolver<Input extends FieldValues, Context, Output, T extends Zod4Type<Output, Input> = Zod4Type<Output, Input>>(schema: T, schemaOptions?: Zod4ParseParams, // already partial
resolverOptions?: NonRawResolverOptions): Resolver<z4.input<T>, Context, z4.output<T>>;
export declare function zodResolver<Input extends FieldValues, Context, Output, T extends Zod4Type<Output, Input> = Zod4Type<Output, Input>>(schema: Zod4Type<Output, Input>, schemaOptions: Zod4ParseParams | undefined, // already partial
resolverOptions: RawResolverOptions): Resolver<z4.input<T>, Context, z4.input<T>>;
export {};
