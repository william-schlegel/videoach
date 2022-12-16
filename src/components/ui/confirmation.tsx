import { type ReactNode } from "react";
import { type ButtonSize } from "./buttonIcon";
import Modal, { type TModalVariant } from "./modal";

type Props = {
  title: string;
  message: string;
  textConfirmation?: string;
  textCancel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  buttonIcon?: ReactNode;
  variant?: TModalVariant;
  buttonSize?: ButtonSize;
};

function Confirmation({
  title,
  message,
  textConfirmation = "Continuer",
  textCancel,
  onConfirm,
  onCancel,
  buttonIcon,
  variant = "Secondary",
  buttonSize = "btn-md",
}: Props) {
  return (
    <Modal
      title={title}
      handleSubmit={onConfirm}
      handleCancel={onCancel}
      submitButtonText={textConfirmation}
      cancelButtonText={textCancel}
      buttonIcon={buttonIcon}
      variant={variant}
      buttonSize={buttonSize}
    >
      <h3>{title}</h3>
      {message.split("\\n").map((p, idx) => (
        <p key={idx}>{p}</p>
      ))}
    </Modal>
  );
}

export default Confirmation;
