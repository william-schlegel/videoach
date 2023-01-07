import type {
  UseFormRegister,
  FieldErrors,
  Path,
  FieldValues,
} from "react-hook-form";
import {
  type FormEventHandler,
  Fragment,
  type ReactNode,
  type HTMLInputTypeAttribute,
} from "react";
import Spinner from "./spinner";
import { useTranslation } from "next-i18next";

type SimpleFormField<T> = {
  label?: string;
  name: keyof T;
  required?: boolean | string;
  component?: ReactNode;
  type?: HTMLInputTypeAttribute;
  disabled?: boolean;
  unit?: string;
};

type SimpleFormProps<T extends FieldValues> = {
  fields: SimpleFormField<T>[];
  errors?: FieldErrors;
  register: UseFormRegister<T>;
  onSubmit?: FormEventHandler<HTMLFormElement> | undefined;
  children?: ReactNode;
  className?: string;
  isLoading?: boolean;
  intialData?: T;
};

export default function SimpleForm<T extends FieldValues>({
  fields,
  errors,
  register,
  onSubmit,
  children,
  className = "",
  isLoading = false,
}: SimpleFormProps<T>): JSX.Element {
  const { t } = useTranslation("common");
  return (
    <form
      className={`grid grid-cols-[auto_1fr] gap-2 ${className}`}
      onSubmit={typeof onSubmit === "function" ? (e) => onSubmit(e) : undefined}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        fields.map((field) => {
          const fn = field.name as string;
          return (
            <Fragment key={fn}>
              {field.type === "checkbox" ? (
                <div className="form-control col-span-2">
                  <label
                    className={`label cursor-pointer justify-start gap-4 ${
                      field.required ? "required" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox-primary checkbox"
                      {...register(fn as Path<T>)}
                      defaultChecked={false}
                    />
                    <span className="label-text">{field.label}</span>
                  </label>
                </div>
              ) : (
                <>
                  {field.label !== undefined ? (
                    <label className={field.required ? "required" : ""}>
                      {field.label}
                    </label>
                  ) : null}
                  <div
                    className={field.label === undefined ? "col-span-2" : ""}
                  >
                    {field.component ? (
                      field.component
                    ) : field.unit !== undefined ? (
                      <div className="input-group">
                        <input
                          {...register(fn as Path<T>, {
                            required: field.required ?? false,
                          })}
                          type={field.type || "text"}
                          disabled={field.disabled}
                        />
                        <span>{field.unit}</span>
                      </div>
                    ) : (
                      <input
                        {...register(fn as Path<T>, {
                          required: field.required ?? false,
                        })}
                        type={field.type || "text"}
                        disabled={field.disabled}
                        className="input-bordered input w-full"
                      />
                    )}
                    {errors && errors[fn] ? (
                      <p className="text-sm text-error">
                        {typeof field.required === "string"
                          ? field.required
                          : t("required")}
                      </p>
                    ) : null}
                  </div>
                </>
              )}
            </Fragment>
          );
        })
      )}
      {children}
    </form>
  );
}
