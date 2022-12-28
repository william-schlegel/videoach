import { type ReactNode, useId } from "react";

export type TIconButtonVariant =
  | "Icon-Primary"
  | "Icon-Secondary"
  | "Icon-Outlined-Primary"
  | "Icon-Outlined-Secondary";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

type Props = {
  title: string;
  iconComponent: ReactNode;
  buttonVariant?: TIconButtonVariant;
  buttonSize?: ButtonSize;
};

function ButtonIcon({
  title,
  iconComponent,
  buttonVariant = "Icon-Outlined-Primary",
  buttonSize = "md",
}: Props) {
  const btnId = useId();

  const primary =
    buttonVariant === "Icon-Outlined-Primary" ||
    buttonVariant === "Icon-Primary";
  const outlined =
    buttonVariant === "Icon-Outlined-Primary" ||
    buttonVariant === "Icon-Outlined-Secondary";

  return (
    <div className={"tooltip"} data-tip={title}>
      <label
        htmlFor={btnId}
        className={`${primary ? "btn-primary" : "btn-secondary"} ${
          outlined ? "btn-outline" : ""
        } btn gap-2 btn-${buttonSize} `}
        tabIndex={0}
      >
        {iconComponent}
      </label>
    </div>
  );
}

export default ButtonIcon;
