import moment from "moment";

export const dateIsValid = (date: string) => {
  return moment(date).isValid();
};
