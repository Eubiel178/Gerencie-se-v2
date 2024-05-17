import { ConfigsTypes } from "./configs";

import { EventTypes } from "./event";
import { TaskTypes } from "./task";

export const GerenciseTypes = {
  ...ConfigsTypes,
  ...EventTypes,
  ...TaskTypes,
};
