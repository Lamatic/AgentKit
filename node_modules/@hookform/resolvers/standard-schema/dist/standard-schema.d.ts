import { StandardSchemaV1 } from '@standard-schema/spec';
import { FieldValues, Resolver } from 'react-hook-form';
export declare function standardSchemaResolver<Input extends FieldValues, Context, Output>(schema: StandardSchemaV1<Input, Output>, _schemaOptions?: never, resolverOptions?: {
    raw?: false;
}): Resolver<Input, Context, Output>;
export declare function standardSchemaResolver<Input extends FieldValues, Context, Output>(schema: StandardSchemaV1<Input, Output>, _schemaOptions: never | undefined, resolverOptions: {
    raw: true;
}): Resolver<Input, Context, Input>;
