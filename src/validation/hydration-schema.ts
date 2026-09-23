import { z } from "zod";

// Um copo/garrafa razoável fica bem abaixo disso — acima é quase certo erro
// de digitação (ex.: usuário digitou "20000" em vez de "200").
const MAX_SINGLE_LOG_ML = 5000;
const MAX_DAILY_GOAL_ML = 10000;

export const logWaterSchema = z.object({
  amountMl: z
    .number()
    .int()
    .positive("Informe uma quantidade maior que zero")
    .max(MAX_SINGLE_LOG_ML, "Quantidade muito alta"),
});

export const updateGoalSchema = z
  .number()
  .int()
  .positive("A meta deve ser maior que zero")
  .max(MAX_DAILY_GOAL_ML, "Meta muito alta");
