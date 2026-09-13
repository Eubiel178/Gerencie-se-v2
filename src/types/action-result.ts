/** Retorno padrão de uma Server Action que só precisa informar sucesso/erro
 * pro formulário que a chamou (o formulário decide o resto: fechar modal,
 * dar `router.refresh()`, mostrar a mensagem). Repetido antes em ~16
 * `actions.ts` diferentes com a mesma forma exata — centralizado aqui
 * pra não divergir por acidente (ex.: um vindo a virar `string | undefined`
 * em vez de `string | null`). Uma Server Action com retorno adicional (ex.:
 * `toggleHabitLogAction`, que também devolve `completed`) estende este tipo
 * em vez de usá-lo sozinho. */
export type ActionResult = { error: string | null };
