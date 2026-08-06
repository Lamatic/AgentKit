import type { ReactNode } from 'react';
import type { FieldValues, FormState as FormStateType, UseFormStateProps, UseFormStateReturn } from './types';
export type FormStateProps<TFieldValues extends FieldValues, TTransformedValues = TFieldValues> = UseFormStateProps<TFieldValues, TTransformedValues> & {
    render: (values: UseFormStateReturn<TFieldValues>) => ReactNode;
};
export type FormState<TFieldValues extends FieldValues> = FormStateType<TFieldValues>;
export declare const FormState: <TFieldValues extends FieldValues, TTransformedValues = TFieldValues>({ control, disabled, exact, name, render, }: FormStateProps<TFieldValues, TTransformedValues>) => ReactNode;
/** @deprecated Use `FormState` instead. Kept as an alias for backward compatibility. */
export declare const FormStateSubscribe: <TFieldValues extends FieldValues, TTransformedValues = TFieldValues>({ control, disabled, exact, name, render, }: FormStateProps<TFieldValues, TTransformedValues>) => ReactNode;
/** @deprecated Use `FormStateProps` instead. Kept as an alias for backward compatibility. */
export type FormStateSubscribeProps<TFieldValues extends FieldValues, TTransformedValues = TFieldValues> = FormStateProps<TFieldValues, TTransformedValues>;
//# sourceMappingURL=formStateSubscribe.d.ts.map