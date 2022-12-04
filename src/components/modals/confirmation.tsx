import Modal from "../ui/modal";

type Props = {
  title: string;
  message: string;
  textConfirmation?: string;
  textCancel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

function Confirmation({
  title,
  message,
  textConfirmation = "Continuer",
  textCancel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      title={title}
      handleSubmit={onConfirm}
      handleCancel={onCancel}
      submitButtonText={textConfirmation}
      cancelButtonText={textCancel}
    >
      <h3 className="text-lg font-bold">{title}</h3>
      {message.split("\\n").map((p, idx) => (
        <p key={idx}>{p}</p>
      ))}
    </Modal>
  );
}

export default Confirmation;
