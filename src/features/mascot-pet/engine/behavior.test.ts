import assert from "node:assert/strict";
import test from "node:test";

import { MascotBehavior } from "./behavior";

const BOUNDS = { minX: 0, maxX: 200, minY: 0, maxY: 200 };

test("MascotBehavior: começa parado (idle) na posição inicial", () => {
  const behavior = new MascotBehavior({ x: 50, y: 50 });
  const snapshot = behavior.snapshot();

  assert.equal(snapshot.state, "idle");
  assert.deepEqual(snapshot.position, { x: 50, y: 50 });
});

test("MascotBehavior: sai do idle depois de tempo suficiente (anda ou dorme, nunca fica parado pra sempre)", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });

  behavior.tick(10_000, BOUNDS);

  assert.notEqual(behavior.snapshot().state, "idle");
});

test("MascotBehavior: clique sempre entra em 'interaction', mesmo andando", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.tick(10_000, BOUNDS);

  behavior.handleClick();

  assert.equal(behavior.snapshot().state, "interaction");
});

test("MascotBehavior: reação transitória (interaction) volta pro idle sozinha depois de um tempo", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.handleClick();
  assert.equal(behavior.snapshot().state, "interaction");

  behavior.tick(5_000, BOUNDS);

  assert.equal(behavior.snapshot().state, "idle");
});

test("MascotBehavior: evento externo mapeia pro estado reativo certo", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });

  behavior.handleEvent("task-completed");
  assert.equal(behavior.snapshot().state, "celebrate");

  behavior.handleEvent("goal-completed");
  assert.equal(behavior.snapshot().state, "celebrate");

  behavior.handleEvent("habit-completed");
  assert.equal(behavior.snapshot().state, "happy");

  behavior.handleEvent("routine-completed");
  assert.equal(behavior.snapshot().state, "happy");

  behavior.handleEvent("achievement-unlocked");
  assert.equal(behavior.snapshot().state, "celebrate");

  behavior.handleEvent("hydration-logged");
  assert.equal(behavior.snapshot().state, "happy");

  behavior.handleEvent("action-error");
  assert.equal(behavior.snapshot().state, "sad");

  behavior.handleEvent("user-idle");
  assert.equal(behavior.snapshot().state, "sleep");
});

test("MascotBehavior: arrastar suspende o passeio autônomo e move só via updateDragPosition", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });

  behavior.startDrag();
  assert.equal(behavior.snapshot().state, "interaction");

  // Mesmo com um deltaMs enorme, nada muda sozinho enquanto arrasta.
  behavior.tick(10_000, BOUNDS);
  assert.deepEqual(behavior.snapshot().position, { x: 100, y: 100 });
  assert.equal(behavior.snapshot().state, "interaction");

  behavior.updateDragPosition({ x: 150, y: 120 }, BOUNDS);
  assert.deepEqual(behavior.snapshot().position, { x: 150, y: 120 });

  behavior.endDrag();
  assert.equal(behavior.snapshot().state, "idle");
  assert.deepEqual(behavior.snapshot().position, { x: 150, y: 120 });
});

test("MascotBehavior: soltar um clique parado (wasClick=true) toca a reação completa, não vai direto pro idle", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });

  behavior.startDrag();
  behavior.endDrag(true);
  assert.equal(behavior.snapshot().state, "interaction");

  // A reação dura um tempo, igual a um clique normal (handleClick) - não
  // volta pro idle no mesmo tick.
  behavior.tick(500, BOUNDS);
  assert.equal(behavior.snapshot().state, "interaction");

  behavior.tick(5_000, BOUNDS);
  assert.equal(behavior.snapshot().state, "idle");
});

test("MascotBehavior: updateDragPosition nunca solta o bichinho fora dos limites", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });

  behavior.startDrag();
  behavior.updateDragPosition({ x: 9999, y: -500 }, BOUNDS);

  const snapshot = behavior.snapshot();
  assert.ok(snapshot.position.x <= BOUNDS.maxX);
  assert.ok(snapshot.position.y >= BOUNDS.minY);
});

test("MascotBehavior: com reduced motion, nunca sai do idle sozinho (só reage a clique/evento)", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.setReducedMotion(true);

  behavior.tick(30_000, BOUNDS);
  assert.equal(behavior.snapshot().state, "idle");

  behavior.handleClick();
  assert.equal(behavior.snapshot().state, "interaction");
});

test("MascotBehavior: clampToBounds traz posição/alvo de volta pra dentro de limites menores (ex.: resize)", () => {
  const behavior = new MascotBehavior({ x: 190, y: 190 });

  behavior.clampToBounds({ minX: 0, maxX: 100, minY: 0, maxY: 100 });

  const snapshot = behavior.snapshot();
  assert.ok(snapshot.position.x <= 100 && snapshot.position.y <= 100);
});

test("MascotBehavior: com modo quieto (Foco), nunca sai do idle sozinho (só reage a clique/evento)", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.setQuietMode(true);

  behavior.tick(30_000, BOUNDS);
  assert.equal(behavior.snapshot().state, "idle");

  behavior.handleClick();
  assert.equal(behavior.snapshot().state, "interaction");
});

test("MascotBehavior: ao ligar o modo quieto longe de um canto, reposiciona na hora pro canto mais próximo (nunca anda até lá, achado: podia atravessar o relógio do Foco por cima)", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 }); // centro exato de BOUNDS (0-200)

  behavior.setQuietMode(true, BOUNDS);

  const snapshot = behavior.snapshot();
  assert.equal(snapshot.state, "idle");
  assert.notDeepEqual(snapshot.position, { x: 100, y: 100 });
});

test("MascotBehavior: depois de reposicionado pro canto, fica idle lá pra sempre (modo quieto continua ligado)", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.setQuietMode(true, BOUNDS);
  const afterEnter = behavior.snapshot();

  behavior.tick(30_000, BOUNDS);
  assert.equal(behavior.snapshot().state, "idle");
  assert.deepEqual(behavior.snapshot().position, afterEnter.position);
});

test("MascotBehavior: já perto de um canto ao ligar o modo quieto, não muda de posição", () => {
  const corner = { x: 24, y: 24 }; // já em cima do canto mais próximo (inset de 12% de 200px)
  const behavior = new MascotBehavior(corner);

  behavior.setQuietMode(true, BOUNDS);

  assert.equal(behavior.snapshot().state, "idle");
  assert.deepEqual(behavior.snapshot().position, corner);
});

test("MascotBehavior: sem bounds, ligar modo quieto não reposiciona (mesmo efeito de antes de existir o recuo)", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.setQuietMode(true);

  assert.equal(behavior.snapshot().state, "idle");
  assert.deepEqual(behavior.snapshot().position, { x: 100, y: 100 });
});

test("MascotBehavior: arrastando quando o modo quieto liga, nunca reposiciona sozinho (arrasto sempre manda)", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.startDrag();

  behavior.setQuietMode(true, BOUNDS);

  assert.equal(behavior.snapshot().state, "interaction");
  assert.deepEqual(behavior.snapshot().position, { x: 100, y: 100 });
});

test("MascotBehavior: velocidade no snapshot é 0 parado/reagindo e positiva durante walk/run", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  assert.equal(behavior.snapshot().speed, 0);

  // Força sair do idle repetidamente até cair num tick de walk/run (tem
  // chance de dormir também - refaz até achar um estado de movimento).
  let moving = false;
  for (let attempt = 0; attempt < 50 && !moving; attempt++) {
    const fresh = new MascotBehavior({ x: 100, y: 100 });
    fresh.tick(5000, BOUNDS);
    if (fresh.snapshot().state === "walk" || fresh.snapshot().state === "run") {
      fresh.tick(16, BOUNDS);
      assert.ok(fresh.snapshot().speed > 0, "velocidade deveria ser positiva durante o movimento");
      moving = true;
    }
  }
  assert.ok(moving, "nenhuma das tentativas caiu em walk/run - improvável, checar RUN_CHANCE/SLEEP_CHANCE");
});

test("MascotBehavior: velocidade começa baixa (rampa de entrada) e não salta direto pro máximo no primeiro tick de movimento", () => {
  // Roda até cair num walk/run recém-iniciado (moveElapsedMs≈0) e mede a
  // velocidade num primeiro tick curto - deve ser bem menor que a
  // velocidade de cruzeiro (42 ou 95px/s), nunca o valor cheio instantâneo.
  let checked = false;
  for (let attempt = 0; attempt < 50 && !checked; attempt++) {
    const fresh = new MascotBehavior({ x: 100, y: 100 });
    fresh.tick(5000, BOUNDS);
    const state = fresh.snapshot().state;
    if (state === "walk" || state === "run") {
      fresh.tick(16, BOUNDS);
      const speed = fresh.snapshot().speed;
      const cruiseSpeed = state === "run" ? 95 : 42;
      assert.ok(speed < cruiseSpeed, "primeiro tick de movimento não deveria já estar na velocidade de cruzeiro");
      checked = true;
    }
  }
  assert.ok(checked, "nenhuma tentativa caiu em walk/run");
});
