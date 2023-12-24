import { RootComponentProps } from "@/types/RootComponentProps";
import { twMerge } from "tailwind-merge";

interface NotificationRootProps extends RootComponentProps {
  isOpen: boolean;
}

export const NotificationRoot = ({
  children,
  isOpen,
  className = "",
}: NotificationRootProps) => {
  return (
    <>
      {isOpen === true && (
        <div
          className={twMerge(
            "bg-[#fff4cc] border-2 border-solid border-yellow-400 p-5 rounded-xl text-yellow-700	w-fit	shadow-md flex flex-col	gap-5",
            className
          )}
        >
          {children}
        </div>
      )}
    </>
  );
};
