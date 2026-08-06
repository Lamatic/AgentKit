import { Resolver } from './types';
/**
 * Creates a resolver for react-hook-form using Ajv schema validation
 * @param {Schema} schema - The Ajv schema to validate against
 * @param {Object} schemaOptions - Additional schema validation options
 * @param {Object} resolverOptions - Additional resolver configuration
 * @param {string} [resolverOptions.mode='async'] - Validation mode
 * @returns {Resolver<Schema>} A resolver function compatible with react-hook-form
 * @example
 * const schema = ajv.compile({
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number' }
 *   }
 * });
 *
 * useForm({
 *   resolver: ajvResolver(schema)
 * });
 */
export declare const ajvResolver: Resolver;
