import moment from "moment";

type DateIsValid = (value: string) => boolean;

export const dateIsValid: DateIsValid = (value) => {
  return moment(value).isValid();
};
