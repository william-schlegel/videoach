import { useState, type ReactNode } from "react";
import { CgChevronLeft, CgChevronRight } from "react-icons/cg";

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
      <div className="flex items-center gap-2">
        {opened ? (
          <>
            <CgChevronLeft size={16} />
            {children}
          </>
        ) : (
          <CgChevronRight size={16} />
        )}
      </div>
    </button>
  );
}

export default CollapsableGroup;
