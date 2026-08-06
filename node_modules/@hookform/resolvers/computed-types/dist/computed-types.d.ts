import FunctionType from 'computed-types/lib/schema/FunctionType';
import type { FieldValues, Resolver } from 'react-hook-form';
/**
 * Creates a resolver for react-hook-form using computed-types schema validation
 * @param {Schema} schema - The computed-types schema to validate against
 * @returns {Resolver<Type<typeof schema>>} A resolver function compatible with react-hook-form
 * @example
 * const schema = Schema({
 *   name: string,
 *   age: number
 * });
 *
 * useForm({
 *   resolver: computedTypesResolver(schema)
 * });
 */
export declare function computedTypesResolver<Input extends FieldValues, Context, Output>(schema: FunctionType<Output, [Input]>): Resolver<Input, Context, Output>;
