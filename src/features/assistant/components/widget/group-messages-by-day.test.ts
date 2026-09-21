import assert from "node:assert/strict";
import test from "node:test";

import type { ChatMessage } from "../../hooks/use-chat-history";

import { groupMessagesByDay } from "./group-messages-by-day";

// Datas bem distantes de "hoje"/"ontem" de propósito — o teste não pode
// depender de que dia ele roda. `formatDayLabel` só cai em texto fixo
// ("DD/MM/AAAA") pra datas fora da janela hoje/ontem, o que é justamente
// o que queremos verificar aqui (o agrupamento em si, não o rótulo).
const DAY_1_MORNING = new Date("2020-01-01T09:00:00").getTime();
const DAY_1_NIGHT = new Date("2020-01-01T22:30:00").getTime();
const DAY_2_MORNING = new Date("2020-01-02T08:00:00").getTime();
const DAY_3 = new Date("2023-06-15T12:00:00").getTime();

function message(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "user",
    text: "oi",
    timestamp: DAY_1_MORNING,
    taskId: null,
    ...overrides,
  };
}

test("groupMessagesByDay: lista vazia retorna sem grupos", () => {
  assert.deepEqual(groupMessagesByDay([]), []);
});

test("groupMessagesByDay: mensagens do mesmo dia ficam num único grupo", () => {
  const messages = [
    message({ timestamp: DAY_1_MORNING }),
    message({ timestamp: DAY_1_NIGHT }),
  ];
  const groups = groupMessagesByDay(messages);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].entries.length, 2);
});

test("groupMessagesByDay: mensagens em dias diferentes formam grupos separados, em ordem", () => {
  const messages = [
    message({ timestamp: DAY_1_MORNING }),
    message({ timestamp: DAY_1_NIGHT }),
    message({ timestamp: DAY_2_MORNING }),
    message({ timestamp: DAY_3 }),
  ];
  const groups = groupMessagesByDay(messages);

  assert.equal(groups.length, 3);
  assert.equal(groups[0].entries.length, 2);
  assert.equal(groups[1].entries.length, 1);
  assert.equal(groups[2].entries.length, 1);
  // Rótulos diferentes entre grupos vizinhos (senão teriam sido mesclados).
  assert.notEqual(groups[0].dayLabel, groups[1].dayLabel);
  assert.notEqual(groups[1].dayLabel, groups[2].dayLabel);
});

test("groupMessagesByDay: preserva a ordem cronológica original dentro de cada grupo", () => {
  const first = message({ timestamp: DAY_1_MORNING, text: "primeira" });
  const second = message({ timestamp: DAY_1_NIGHT, text: "segunda" });
  const groups = groupMessagesByDay([first, second]);

  assert.equal(groups[0].entries[0].message.text, "primeira");
  assert.equal(groups[0].entries[1].message.text, "segunda");
});

test("groupMessagesByDay: mantém o índice original de cada mensagem na lista completa", () => {
  const messages = [
    message({ timestamp: DAY_1_MORNING }),
    message({ timestamp: DAY_2_MORNING }),
    message({ timestamp: DAY_3 }),
  ];
  const groups = groupMessagesByDay(messages);

  assert.equal(groups[0].entries[0].index, 0);
  assert.equal(groups[1].entries[0].index, 1);
  assert.equal(groups[2].entries[0].index, 2);
});

test("groupMessagesByDay: virada de dia à meia-noite separa em dois grupos mesmo minutos depois", () => {
  const beforeMidnight = message({ timestamp: new Date("2020-01-01T23:59:00").getTime() });
  const afterMidnight = message({ timestamp: new Date("2020-01-02T00:01:00").getTime() });
  const groups = groupMessagesByDay([beforeMidnight, afterMidnight]);

  assert.equal(groups.length, 2);
});
