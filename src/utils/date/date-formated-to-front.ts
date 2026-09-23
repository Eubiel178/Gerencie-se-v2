import dayjs from "dayjs";

export const dateFormatedToFront = (date: string | undefined) => {
  return dayjs(date).format("DD/MM/YYYY HH:mm");
};
