import moment from "moment";

export const dateFormatedToFront = (date: string | undefined) => {
  const dateMoment = moment(date);

  return dateMoment.format("DD/MM/YYYY HH:mm");
};
