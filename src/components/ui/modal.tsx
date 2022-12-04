import { paramCase } from "param-case";
import { type ReactNode, useRef } from "react";
import { type FieldErrorsImpl } from "react-hook-form";

type Props = {
  title: string;
  handleSubmit: () => void;
  handleCancel?: () => void;
  children: ReactNode;
  submitButtonText: string;
  cancelButtonText?: string;
  errors?: FieldErrorsImpl;
  buttonIcon?: ReactNode;
};

export default function Modal({
  title,
  handleSubmit,
  children,
  submitButtonText,
  cancelButtonText = "Annuler",
  handleCancel,
  errors,
  buttonIcon,
}: Props) {
  const closeRef = useRef<HTMLInputElement>(null);
  const modalId = paramCase(title);

  const close = () => {
    if (!closeRef.current) return;
    closeRef.current.checked = false;
  };

  const handleClickSubmit = () => {
    if (typeof errors === "object" && Object.keys(errors as object).length > 0)
      return;
    close();
    handleSubmit();
  };

  return (
    <>
      <label htmlFor={modalId} className="btn-secondary btn gap-2">
        {buttonIcon ? buttonIcon : null}
        {title}
      </label>

      <input
        type="checkbox"
        id={modalId}
        className="modal-toggle"
        ref={closeRef}
      />
      <div className="modal">
        <div className="modal-box relative">
          <label
            htmlFor={modalId}
            className="btn-secondary btn-sm btn-circle btn absolute right-2 top-2"
          >
            ✕
          </label>
          {children}
          <div className="modal-action">
            {cancelButtonText ? (
              <button
                className="btn-outline btn-secondary btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof handleCancel === "function") handleCancel();
                  close();
                }}
              >
                {cancelButtonText}
              </button>
            ) : null}
            <button
              className="btn-primary btn"
              onClick={(e) => {
                e.preventDefault();
                handleClickSubmit();
              }}
            >
              {submitButtonText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
