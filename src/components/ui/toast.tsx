type TToastVariant = "Toast-Success" | "Toast-Info" | "Toast-Error";

type Props = {
  message: string;
  variant: TToastVariant;
};

function Toast({ message, variant = "Toast-Success" }: Props) {
  return (
    <div className="toast">
      <div
        className={`alert ${
          variant === "Toast-Error"
            ? "alert-error"
            : variant === "Toast-Info"
            ? "alert-info"
            : "alert-success"
        }`}
      >
        <div>
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}

export default Toast;
