import { Resolver } from './types';
/**
 * Creates a resolver for react-hook-form using Joi schema validation
 * @param {Joi.ObjectSchema<TFieldValues>} schema - The Joi schema to validate against
 * @param {Joi.ValidationOptions} [schemaOptions] - Optional Joi validation options
 * @param {Object} resolverOptions - Additional resolver configuration
 * @param {string} [resolverOptions.mode='async'] - Validation mode
 * @returns {Resolver<TFieldValues>} A resolver function compatible with react-hook-form
 * @example
 * const schema = Joi.object({
 *   name: Joi.string().required(),
 *   age: Joi.number().required()
 * });
 *
 * useForm({
 *   resolver: joiResolver(schema)
 * });
 */
export declare const joiResolver: Resolver;
