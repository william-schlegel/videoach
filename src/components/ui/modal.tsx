import { type ReactNode, useRef, useId } from "react";
import { type FieldErrors } from "react-hook-form";
import { type ButtonSize, type TIconButtonVariant } from "./buttonIcon";

export type TModalVariant =
  | TIconButtonVariant
  | "Primary"
  | "Secondary"
  | "Outlined-Primary"
  | "Outlined-Secondary";

type Props = {
  title: string | undefined;
  handleSubmit?: () => void;
  handleCancel?: () => void;
  children: ReactNode;
  submitButtonText?: string;
  cancelButtonText?: string;
  errors?: FieldErrors;
  buttonIcon?: ReactNode;
  onOpenModal?: () => void;
  variant?: TModalVariant;
  className?: string;
  buttonSize?: ButtonSize;
};

export default function Modal({
  title,
  handleSubmit,
  children,
  submitButtonText = "Enregistrer",
  cancelButtonText = "Annuler",
  handleCancel,
  errors,
  buttonIcon,
  onOpenModal,
  variant = "Primary",
  className = "",
  buttonSize = "md",
}: Props) {
  const closeRef = useRef<HTMLInputElement>(null);
  const modalId = useId();

  const close = () => {
    if (!closeRef.current) return;
    closeRef.current.checked = false;
  };

  const handleClickSubmit = () => {
    if (typeof errors === "object" && Object.keys(errors).length > 0) return;
    close();
    if (typeof handleSubmit === "function") handleSubmit();
  };

  const primary =
    variant === "Primary" ||
    variant === "Outlined-Primary" ||
    variant === "Icon-Primary" ||
    variant === "Icon-Outlined-Primary";
  const outlined =
    variant === "Outlined-Primary" ||
    variant === "Outlined-Secondary" ||
    variant === "Icon-Outlined-Primary" ||
    variant === "Icon-Outlined-Secondary";
  const iconOnly =
    variant === "Icon-Outlined-Primary" ||
    variant === "Icon-Outlined-Secondary" ||
    variant === "Icon-Primary" ||
    variant === "Icon-Secondary";

  return (
    <>
      <div className={iconOnly ? "tooltip" : ""} data-tip={title}>
        <label
          htmlFor={modalId}
          className={`${primary ? "btn-primary" : "btn-secondary"} ${
            outlined ? "btn-outline" : ""
          } btn gap-2 ${buttonSize} `}
          tabIndex={0}
        >
          {buttonIcon ? buttonIcon : null}
          {iconOnly ? null : title}
        </label>
      </div>
      <input
        type="checkbox"
        id={modalId}
        className="modal-toggle"
        ref={closeRef}
        onChange={(e) => {
          if (e.target.checked && typeof onOpenModal === "function")
            onOpenModal();
        }}
      />
      <div className={`modal`}>
        <div className={`modal-box relative overflow-hidden ${className}`}>
          <label
            htmlFor={modalId}
            className="btn btn-secondary btn-sm btn-circle absolute right-1 top-1"
          >
            <i className="bx bx-x bx-sm" />
          </label>
          {children}
          <div className="modal-action">
            {cancelButtonText ? (
              <button
                className="btn-outline btn btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof handleCancel === "function") handleCancel();
                  close();
                }}
              >
                {cancelButtonText}
              </button>
            ) : null}
            {typeof handleSubmit === "function" ? (
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  handleClickSubmit();
                }}
              >
                {submitButtonText}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
