# Ascese

Jogo de celular (web) sobre a corrida entre Ascensão e Loucura. Versão de teste: só texto e botões.

- Jogar: abra `index.html` no navegador (ou pelo GitHub Pages).
- Código: `js/dados.js` (tabelas), `js/motor.js` (regras), `js/ui.js` (tela).
- Conferir números: `node tests/simular.js [partidas] [--sem-explorar] [--itens]`.

Internamente Ascensão/Loucura são inteiros em 1/30 e Vontade em 1/3, para não acumular erro de arredondamento.

## Álbum e variantes

- Toda carta puxada (dia a dia e Ritual tiers I e II) entra no álbum, separado por ação/tier. O álbum fica salvo no `localStorage` e passa de uma partida para a outra.
- Cada carta pode sair com uma variante (no máximo uma), definidas em `Dados.variantes`:
  - Metalizada (5%, todas): benefícios +50%, malefícios −30%.
  - Chaga (5%, só cartas com malefício): malefícios +50%.
  - Imaculada (0,5%, só cartas sem malefício): benefícios +100%.
  - Invertida (0,05%, todas): inverte o sinal dos efeitos; num decisivo, troca ganha ↔ perde.
- Loucura negativa conta como benefício. No decisivo de perda, Metalizada/Chaga escalam os +80 de Loucura.
