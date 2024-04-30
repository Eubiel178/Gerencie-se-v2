"use server";

import { useTask } from "@/@core/presentation/hooks";

import { FormData } from "./interfaces";
import { revalidatePath } from "next/cache";

const { fetcher } = useTask();

export async function create(data: FormData) {
  return await fetcher.create(data).then(function (response) {
    revalidatePath("/home", "page");

    return response;
  });
}
