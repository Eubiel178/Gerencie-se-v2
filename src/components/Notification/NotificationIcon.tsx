import { HTMLAttributes, ElementType } from "react";
import { VariantProps, tv } from "tailwind-variants";

const paragraph = tv({
  base: "text-2xl",
});

interface NotificationIconProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof paragraph> {
  icon: ElementType;
}

export const NotificationIcon = ({ icon: Icon }: NotificationIconProps) => {
  return (
    <p className={paragraph()}>
      <Icon />
    </p>
  );
};
