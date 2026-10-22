# Ascese

Jogo de celular (web) sobre a corrida entre Ascensão e Loucura. Versão de teste: só texto e botões.

- Jogar: abra `index.html` no navegador (ou pelo GitHub Pages).
- Código: `js/dados.js` (tabelas), `js/motor.js` (regras), `js/ui.js` (tela).
- Conferir números: `node tests/simular.js [partidas] [--sem-explorar] [--itens]`.

Internamente Ascensão/Loucura são inteiros em 1/30 e Vontade em 1/3, para não acumular erro de arredondamento.
