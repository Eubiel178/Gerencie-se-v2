import { tv } from "tailwind-variants";
import Image from "next/image";
import img from "@/assets/img/register/register.png";

const styles = tv(
  {
    slots: {
      figure: "bg-sky-600",
      image: "w-10/12",
    },

    variants: {
      responsive: {
        mobile: {
          figure: "hidden",
        },
        medium: {
          figure: "flex-1 flex items-center justify-center",
        },
      },
    },
  },

  { responsiveVariants: ["md"] }
);

export const Figure = () => {
  const tv = styles({
    responsive: {
      initial: "mobile",
      md: "medium",
    },
  });

  return (
    <figure className={tv.figure()}>
      <Image
        className={tv.image()}
        src={img}
        alt="Figura de usuário entrando"
      />
    </figure>
  );
};
