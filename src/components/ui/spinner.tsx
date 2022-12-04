import { CgSpinnerAlt } from "react-icons/cg";

type SpinnerProps = {
  size?: number | string;
};

const Spinner = ({ size = 24 }: SpinnerProps) => {
  return <CgSpinnerAlt size={size} className="animate-spin text-secondary" />;
};

export default Spinner;
