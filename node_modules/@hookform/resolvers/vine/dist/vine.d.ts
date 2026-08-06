import { VineValidator } from '@vinejs/vine';
import { ConstructableSchema, ValidationOptions } from '@vinejs/vine/build/src/types';
import { FieldValues, Resolver } from 'react-hook-form';
export declare function vineResolver<Input extends FieldValues, Context, Output>(schema: VineValidator<ConstructableSchema<Input, Output, Output>, any>, schemaOptions?: ValidationOptions<any>, resolverOptions?: {
    mode?: 'async' | 'sync';
    raw?: false;
}): Resolver<Input, Context, Output>;
export declare function vineResolver<Input extends FieldValues, Context, Output>(schema: VineValidator<ConstructableSchema<Input, Output, Output>, any>, schemaOptions: ValidationOptions<any> | undefined, resolverOptions: {
    mode?: 'async' | 'sync';
    raw: true;
}): Resolver<Input, Context, Input>;
