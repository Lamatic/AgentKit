import * as t from 'io-ts';
import { FieldValues, Resolver } from 'react-hook-form';
export declare function ioTsResolver<Input extends FieldValues, Context, Output>(schema: t.Type<Output, Input>, resolverOptions?: {
    mode?: 'async' | 'sync';
    raw?: false;
}): Resolver<Input, Context, Output>;
export declare function ioTsResolver<Input extends FieldValues, Context, Output>(schema: t.Type<Output, Input>, resolverOptions: {
    mode?: 'async' | 'sync';
    raw: true;
}): Resolver<Input, Context, Input>;
