import type { Resolver } from './types';
/**
 * Creates a resolver for react-hook-form using Nope schema validation
 * @param {NopeSchema} schema - The Nope schema to validate against
 * @param {NopeSchemaOptions} [schemaOptions] - Optional Nope validation options
 * @param {Object} resolverOptions - Additional resolver configuration
 * @param {string} [resolverOptions.mode='async'] - Validation mode
 * @returns {Resolver<NopeSchema>} A resolver function compatible with react-hook-form
 * @example
 * const schema = nope.object({
 *   name: nope.string().required(),
 *   age: nope.number().required()
 * });
 *
 * useForm({
 *   resolver: nopeResolver(schema)
 * });
 */
export declare const nopeResolver: Resolver;
