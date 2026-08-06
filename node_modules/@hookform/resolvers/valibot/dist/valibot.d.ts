import { FieldValues, Resolver } from 'react-hook-form';
import { BaseSchema, BaseSchemaAsync, Config, InferIssue } from 'valibot';
export declare function valibotResolver<Input extends FieldValues, Context, Output>(schema: BaseSchema<Input, Output, any> | BaseSchemaAsync<Input, Output, any>, schemaOptions?: Partial<Omit<Config<InferIssue<typeof schema>>, 'abortPipeEarly' | 'skipPipe'>>, resolverOptions?: {
    mode?: 'async' | 'sync';
    raw?: false;
}): Resolver<Input, Context, Output>;
export declare function valibotResolver<Input extends FieldValues, Context, Output>(schema: BaseSchema<Input, Output, any> | BaseSchemaAsync<Input, Output, any>, schemaOptions: Partial<Omit<Config<InferIssue<typeof schema>>, 'abortPipeEarly' | 'skipPipe'>> | undefined, resolverOptions: {
    mode?: 'async' | 'sync';
    raw: true;
}): Resolver<Input, Context, Input>;
