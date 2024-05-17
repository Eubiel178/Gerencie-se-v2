import { tv } from "tailwind-variants";

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

export function Figure() {
  const tv = styles({
    responsive: {
      initial: "mobile",
      md: "medium",
    },
  });

  return (
    <figure className={tv.figure()}>
      <img
        className={tv.image()}
        src="/images/register.png"
        alt="Figura de usuário entrando"
      />
    </figure>
  );
}
