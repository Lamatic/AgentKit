import { FieldValues, Resolver } from 'react-hook-form';
import * as Yup from 'yup';
export declare function yupResolver<Input extends FieldValues, Context, Output>(schema: Yup.ObjectSchema<Input, any, Output, any> | ReturnType<typeof Yup.lazy<Yup.ObjectSchema<Input, any, Output, any>>>, schemaOptions?: Parameters<(typeof schema)['validate']>[1], resolverOptions?: {
    mode?: 'async' | 'sync';
    raw?: false;
}): Resolver<Yup.InferType<typeof schema>, Context, Yup.InferType<typeof schema>>;
export declare function yupResolver<Input extends FieldValues, Context, Output>(schema: Yup.ObjectSchema<Input, any, Output, any> | ReturnType<typeof Yup.lazy<Yup.ObjectSchema<Input, any, Output, any>>>, schemaOptions: Parameters<(typeof schema)['validate']>[1] | undefined, resolverOptions: {
    mode?: 'async' | 'sync';
    raw: true;
}): Resolver<Yup.InferType<typeof schema>, Context, Yup.InferType<typeof schema>>;
