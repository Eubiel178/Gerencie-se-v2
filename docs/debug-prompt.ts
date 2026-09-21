import { buildChatSystemPrompt } from "../src/lib/ai/prompts/chat-prompt";

const ctx = 'TAREFA ATUAL: "Teste"';
const p = buildChatSystemPrompt("sarastico", ctx);

console.log("LEN:", p.length);
console.log("---first 500---");
console.log(p.substring(0, 500));
console.log("---idx Voce---", p.indexOf("Você é o companheiro"));
console.log("---idx Personalidade---", p.indexOf("Personalidade:"));
console.log("---idx Capacidades---", p.indexOf("Capacidades (MVP"));
