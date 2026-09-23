import dayjs from "dayjs";

export const dateIsValid = (date: string) => {
  return dayjs(date).isValid();
};
