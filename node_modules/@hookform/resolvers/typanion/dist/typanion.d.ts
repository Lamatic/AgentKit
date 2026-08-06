import type { FieldValues, Resolver } from 'react-hook-form';
import * as t from 'typanion';
export declare function typanionResolver<Input extends FieldValues, Context, Output>(schema: t.StrictValidator<Input, Input>, schemaOptions?: Pick<t.ValidationState, 'coercions' | 'coercion'>, resolverOptions?: {
    mode?: 'async' | 'sync';
    raw?: false;
}): Resolver<Input, Context, t.InferType<typeof schema>>;
export declare function typanionResolver<Input extends FieldValues, Context, Output>(schema: t.StrictValidator<Input, Input>, schemaOptions: Pick<t.ValidationState, 'coercions' | 'coercion'> | undefined, resolverOptions: {
    mode?: 'async' | 'sync';
    raw: true;
}): Resolver<Input, Context, Input>;
