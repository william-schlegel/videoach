import { type ReactNode } from "react";
import Modal, { type ModalButtonSize, ModalVariant } from "./modal";

type Props = {
  title: string;
  message: string;
  textConfirmation?: string;
  textCancel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  buttonIcon?: ReactNode;
  variant?: ModalVariant;
  buttonSize?: ModalButtonSize;
};

function Confirmation({
  title,
  message,
  textConfirmation = "Continuer",
  textCancel,
  onConfirm,
  onCancel,
  buttonIcon,
  variant = ModalVariant.SECONDARY,
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
