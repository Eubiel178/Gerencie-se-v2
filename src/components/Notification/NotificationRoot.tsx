import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface NotificationRootProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
}

export const NotificationRoot = ({
  children,
  isOpen,
  className,
}: NotificationRootProps) => {
  return (
    <>
      {isOpen === true && (
        <div
          className={twMerge(
            "bg-yellow-100 border-2 border-solid border-yellow-400 py-4 px-3 rounded-xl text-yellow-700 w-96 shadow-md flex flex-col gap-4",
            className
          )}
        >
          {children}
        </div>
      )}
    </>
  );
};
