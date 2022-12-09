import { paramCase } from "param-case";
import { type ReactNode, useRef, useMemo } from "react";
import { type FieldErrorsImpl } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

export enum ModalVariant {
  PRIMARY = "Primary",
  SECONDARY = "Secondary",
  OUTLINED_PRIMARY = "Outlined-Primary",
  OUTLINED_SECONDARY = "Outlined-Secondary",
  ICON_PRIMARY = "Icon-Primary",
  ICON_SECONDARY = "Icon-Secondary",
  ICON_OUTLINED_PRIMARY = "Icon-Primary",
  ICON_OUTLINED_SECONDARY = "Icon-Secondary",
}

export type ModalButtonSize =
  | "btn-xs"
  | "btn-sm"
  | "btn-md"
  | "btn-lg"
  | "btn-xl";

type Props = {
  title: string | undefined;
  handleSubmit: () => void;
  handleCancel?: () => void;
  children: ReactNode;
  submitButtonText?: string;
  cancelButtonText?: string;
  errors?: FieldErrorsImpl;
  buttonIcon?: ReactNode;
  onOpenModal?: () => void;
  variant?: ModalVariant;
  className?: string;
  buttonSize?: ModalButtonSize;
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
  variant = ModalVariant.SECONDARY,
  className = "",
  buttonSize = "btn-md",
}: Props) {
  const closeRef = useRef<HTMLInputElement>(null);
  const modalId = useMemo(() => paramCase(uuidv4()), []);

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

  const primary =
    variant === ModalVariant.PRIMARY ||
    variant === ModalVariant.OUTLINED_PRIMARY ||
    variant === ModalVariant.ICON_PRIMARY;
  const outlined =
    variant === ModalVariant.OUTLINED_PRIMARY ||
    variant === ModalVariant.OUTLINED_SECONDARY ||
    variant === ModalVariant.ICON_OUTLINED_PRIMARY ||
    variant === ModalVariant.ICON_OUTLINED_SECONDARY;
  const iconOnly =
    variant === ModalVariant.ICON_PRIMARY ||
    variant === ModalVariant.ICON_SECONDARY;

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
        <div className={`modal-box relative ${className}`}>
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
