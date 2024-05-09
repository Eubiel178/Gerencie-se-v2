import { Header } from "@/components";
import { tv } from "tailwind-variants";

const styles = tv(
  {
    slots: {
      pageContainer: "",
      mainContainer: "relative gap-10 p-5",
    },

    variants: {
      responsive: {
        desktop: {
          pageContainer: "flex-row",
        },
      },
    },

    compoundSlots: [
      {
        slots: ["pageContainer", "mainContainer"],
        className: "flex-1 flex flex-col",
      },
    ],
  },

  {
    responsiveVariants: ["sm"],
  }
);

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  const tv = styles({
    responsive: {
      sm: "desktop",
    },
  });

  return (
    <div className={tv.pageContainer()}>
      <Header />

      <main className={tv.mainContainer()}>{children}</main>
    </div>
  );
};

export default HomeLayout;
