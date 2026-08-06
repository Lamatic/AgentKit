import { AsyncValidator, Validator } from 'fluentvalidation-ts';
import { FieldValues, Resolver } from 'react-hook-form';
/**
 * Creates a resolver for react-hook-form using FluentValidation schema validation
 * @param {Validator<TFieldValues>} validator - The FluentValidation validator to use
 * @returns {Resolver<TFieldValues>} A resolver function compatible with react-hook-form
 * @example
 * import { Validator } from 'fluentvalidation-ts';
 *
 * class SchemaValidator extends Validator<Schema> {
 *   constructor() {
 *     super();
 *     this.ruleFor('username').notEmpty();
 *     this.ruleFor('password').notEmpty();
 *   }
 * }
 *
 * const validator = new SchemaValidator();
 *
 * useForm({
 *   resolver: fluentValidationResolver(validator)
 * });
 */
export declare function fluentValidationResolver<TFieldValues extends FieldValues>(validator: Validator<TFieldValues>): Resolver<TFieldValues>;
export declare function fluentAsyncValidationResolver<TFieldValues extends FieldValues, TValidator extends AsyncValidator<TFieldValues>>(validator: TValidator): Resolver<TFieldValues>;
