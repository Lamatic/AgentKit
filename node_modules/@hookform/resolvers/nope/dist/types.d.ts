import type { object as nopeObject } from 'nope-validator';
import type { FieldValues, ResolverOptions, ResolverResult } from 'react-hook-form';
type NopeObject = ReturnType<typeof nopeObject>;
type ValidateOptions = Parameters<NopeObject['validate']>[2];
type Context = Parameters<NopeObject['validate']>[1];
export type Resolver = <T extends NopeObject>(schema: T, schemaOptions?: ValidateOptions, resolverOptions?: {
    mode?: 'async' | 'sync';
    rawValues?: boolean;
}) => <TFieldValues extends FieldValues, TContext extends Context>(values: TFieldValues, context: TContext | undefined, options: ResolverOptions<TFieldValues>) => ResolverResult<TFieldValues>;
export {};
