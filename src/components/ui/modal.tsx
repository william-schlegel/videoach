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
};

export default function Modal({
  title,
  handleSubmit,
  children,
  submitButtonText,
  cancelButtonText,
  handleCancel,
  errors,
}: Props) {
  const closeRef = useRef<HTMLInputElement>(null);

  const handleClickSubmit = () => {
    if (Object.keys(errors as object).length > 0) return;
    if (!closeRef.current) return;
    closeRef.current.checked = false;
    handleSubmit();
  };

  return (
    <>
      <label htmlFor="club-creation-modal" className="btn-secondary btn">
        {title}
      </label>

      <input
        type="checkbox"
        id="club-creation-modal"
        className="modal-toggle"
        ref={closeRef}
      />
      <div className="modal">
        <div className="modal-box relative">
          <label
            htmlFor="club-creation-modal"
            className="btn-secondary btn-sm btn-circle btn absolute right-2 top-2"
          >
            ✕
          </label>
          {children}
          <div className="modal-action">
            <button className="btn-primary btn" onClick={handleClickSubmit}>
              {submitButtonText}
            </button>
            {cancelButtonText && typeof handleCancel === "function" ? (
              <button className="btn-primary btn" onClick={handleCancel}>
                {cancelButtonText}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
