/**
 * Roda antes da hidratação (ver uso em `src/app/layout.tsx`) para aplicar
 * o tema escolhido pelo usuário (salvo em localStorage) antes da primeira
 * pintura — sem isso, a tela piscaria no tema errado por uma fração de
 * segundo sempre que a escolha do usuário for diferente do tema do SO.
 *
 * Quando o usuário nunca escolheu nada (localStorage vazio = "segue o
 * sistema"), não precisamos fazer nada aqui: o CSS já cobre esse caso via
 * `prefers-color-scheme` em tokens.css, sem nenhum JS envolvido.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("gerencie-se:theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;
