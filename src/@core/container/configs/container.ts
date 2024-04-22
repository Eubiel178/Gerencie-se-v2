import { Container } from "inversify";

import { apiLocal } from "@/@core/infra";

import { ConfigsTypes } from "./types";

export const configsContainer = new Container();

configsContainer.bind(ConfigsTypes.ApiLocalInstance).toConstantValue(apiLocal);
