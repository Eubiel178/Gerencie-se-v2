import moment from "moment";

export const dateIsValid = (date: string) => {
  moment(date).isValid();
};
