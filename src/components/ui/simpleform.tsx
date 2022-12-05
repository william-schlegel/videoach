import {
  type UseFormRegister,
  type FieldErrorsImpl,
  type Path,
  type FieldValues,
} from "react-hook-form";
import {
  type FormEventHandler,
  Fragment,
  type ReactNode,
  type HTMLInputTypeAttribute,
} from "react";

type SimpleFormField<T> = {
  label?: string | undefined;
  name: keyof T;
  required?: boolean | string;
  component?: ReactNode | undefined;
  value?: number | string | undefined;
  type?: HTMLInputTypeAttribute;
  disabled?: boolean | undefined;
};

type SimpleFormProps<T extends FieldValues> = {
  fields: SimpleFormField<T>[];
  errors?: FieldErrorsImpl;
  register: UseFormRegister<T>;
  onSubmit?: FormEventHandler<HTMLFormElement> | undefined;
  children?: ReactNode;
  className?: string;
};

export default function SimpleForm<T extends FieldValues>({
  fields,
  errors,
  register,
  onSubmit,
  children,
  className,
}: SimpleFormProps<T>): JSX.Element {
  return (
    <form
      className={`grid grid-cols-[auto_1fr] gap-2 ${className}`}
      onSubmit={typeof onSubmit === "function" ? (e) => onSubmit(e) : undefined}
    >
      {fields.map((field) => {
        const fn = field.name as string;
        return (
          <Fragment key={fn}>
            {field.label !== undefined ? <label>{field.label}</label> : null}
            <div className={field.label === undefined ? "col-span-2" : ""}>
              {field.component ? (
                field.component
              ) : (
                <input
                  {...register(fn as Path<T>, {
                    required: field.required ?? false,
                  })}
                  value={field.value}
                  type={field.type || "text"}
                  disabled={field.disabled}
                />
              )}
              {errors && errors[fn] ? (
                <p className="text-sm text-error">
                  {typeof field.required === "string"
                    ? field.required
                    : "Champ requis"}
                </p>
              ) : null}
            </div>
          </Fragment>
        );
      })}
      {children}
    </form>
  );
}
