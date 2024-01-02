"use client";

import { Header } from "@/components";
import { tv } from "tailwind-variants";

const homeLayout = tv(
  {
    slots: {
      pageContainer: "flex-1 flex",
      mainContainer: "flex-1 flex flex-col gap-10 p-5",
    },

    variants: {
      responsive: {
        initial: {
          pageContainer: "flex-col",
        },
        desktop: {
          pageContainer: "flex-row",
        },
      },
    },
  },
  {
    responsiveVariants: ["sm"],
  }
);

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  const { pageContainer, mainContainer } = homeLayout({
    responsive: {
      initial: "initial",
      sm: "desktop",
    },
  });

  return (
    <div className={pageContainer()}>
      <Header />

      <main className={mainContainer()}>{children}</main>
    </div>
  );
};

export default HomeLayout;
