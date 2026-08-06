import type { Resolver } from './types';
/**
 * Creates a resolver for react-hook-form using Vest validation
 * @param {Function} schema - The Vest validation schema
 * @param {Object} _ - Unused parameter
 * @param {Object} resolverOptions - Additional resolver configuration
 * @param {string} [resolverOptions.mode='async'] - Validation mode
 * @returns {Resolver} A resolver function compatible with react-hook-form
 * @example
 * const schema = vest.create((data) => {
 *   if (!data.name) {
 *     return 'Name is required';
 *   }
 * });
 *
 * useForm({
 *   resolver: vestResolver(schema)
 * });
 */
export declare const vestResolver: Resolver;
