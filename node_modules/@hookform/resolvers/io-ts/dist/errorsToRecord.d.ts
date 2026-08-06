import { ValidationError } from 'io-ts';
import { FieldError } from 'react-hook-form';
export type ErrorObject = Record<string, FieldError>;
export type FieldErrorWithPath = FieldError & {
    path: string;
};
declare const errorsToRecord: (validateAllFieldCriteria: boolean) => (validationErrors: ReadonlyArray<ValidationError>) => ErrorObject;
export default errorsToRecord;
