"use client";

import { useCallback } from "react";

import { useSearchParams } from "next/navigation";

export function useParamsUrl() {
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return "?" + params.toString();
    },
    [searchParams]
  );

  const get = useCallback(
    (name: string) => searchParams.get(name),
    [searchParams]
  );

  return {
    createQueryString,
    get,
  };
}
