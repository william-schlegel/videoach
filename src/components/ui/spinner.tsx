type SpinnerProps = {
  size?: number;
};

const Spinner = ({ size = 24 }: SpinnerProps) => {
  return (
    <i
      className={`bx bx-loader text-[${size}px] animate-spin text-secondary`}
    />
  );
};

export default Spinner;
