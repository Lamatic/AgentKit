import { Static, StaticDecode, TObject } from '@sinclair/typebox';
import { TypeCheck } from '@sinclair/typebox/compiler';
import { Resolver } from 'react-hook-form';
/**
 * Creates a resolver for react-hook-form using Typebox schema validation
 * @param {Schema | TypeCheck<Schema>} schema - The Typebox schema to validate against
 * @param {Object} options - Additional resolver configuration
 * @param {string} [options.mode='async'] - Validation mode
 * @returns {Resolver<Static<Schema>>} A resolver function compatible with react-hook-form
 * @example
 * const schema = Type.Object({
 *   name: Type.String(),
 *   age: Type.Number()
 * });
 *
 * useForm({
 *   resolver: typeboxResolver(schema)
 * });
 *
 * // Schemas using a custom/third-party `Kind` (e.g. ElysiaJS's `t.Files()`) must have
 * // that kind registered with TypeBox's own `TypeRegistry` before validating, since
 * // this resolver validates via `@sinclair/typebox`'s `Value.Errors`/`Value.Check`:
 * // TypeRegistry.Set('Files', (schema, value) => Array.isArray(value));
 */
export declare function typeboxResolver<Schema extends TObject, Context>(schema: Schema | TypeCheck<Schema>): Resolver<Static<Schema>, Context, StaticDecode<Schema>>;
