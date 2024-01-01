"use client";

import { Header } from "@/components";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex-1 flex smallTablet:flex-col">
      <Header />

      <main className="flex-1 flex flex-col gap-10 p-5">{children}</main>
    </div>
  );
};

export default HomeLayout;
