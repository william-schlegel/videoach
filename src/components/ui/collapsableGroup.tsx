import { useState, type ReactNode } from "react";

type Props = {
  groupName: string;
  children: ReactNode;
};

function CollapsableGroup({ groupName, children }: Props) {
  const [opened, setOpened] = useState(false);
  return (
    <button
      onClick={() => setOpened((p) => !p)}
      className="flex items-center gap-2 rounded-full border border-neutral bg-base-100 px-4 py-1"
    >
      <span className="text-primary">{groupName}</span>
      <div className="flex items-center gap-2 transition-transform duration-200">
        {opened ? <>{children}</> : null}
        <i
          className={`bx bx-chevron-right bx-sm ${
            opened ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>
    </button>
  );
}

export default CollapsableGroup;
