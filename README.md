# Ascese

Jogo de celular (web) sobre a corrida entre Ascensão e Loucura. Versão de teste: só texto e botões.

- Jogar: abra `index.html` no navegador (ou pelo GitHub Pages).
- Código: `js/dados.js` (tabelas), `js/motor.js` (regras), `js/ui.js` (tela).
- Conferir números: `node tests/simular.js [partidas] [--sem-explorar] [--itens]`.

Internamente Ascensão/Loucura são inteiros em 1/30 e Vontade em 1/3, para não acumular erro de arredondamento.

## Álbum e variantes

- Toda carta puxada (dia a dia e Ritual tiers I e II) entra no álbum, separado por ação/tier. Os demônios revelados (tier III) e os lados da moeda (tier IV) também têm página, sem variantes. O álbum fica salvo no `localStorage` e passa de uma partida para a outra.
- Cada carta pode sair com uma variante (no máximo uma), definidas em `Dados.variantes`:
  - Metalizada (5%, todas): benefícios +50%, malefícios −30%.
  - Chaga (5%, só cartas com malefício): malefícios +50%.
  - Imaculada (0,5%, só cartas sem malefício): benefícios +100%.
  - Invertida (0,05%, todas): inverte o sinal dos efeitos; num decisivo, troca ganha ↔ perde.
- Loucura negativa conta como benefício. No decisivo de perda, Metalizada/Chaga escalam os +80 de Loucura.

## Pacotinho

- Ao abrir uma ação (ou os tiers I e II do Ritual) aparece um pacotinho na tela. Segure por 1,2 s para rasgar; as cartas saem dele.
- Cada carta mostra nome, flavor text e stats, com o visual da variante (Metalizada com brilho metálico, Chaga, Imaculada, Invertida).
- A estrela dourada de dez pontas com "!" marca a primeira vez que aquela versão (carta + variante, ou sem variante) sai.

## Protótipo: Brandubh (tafl 7×7)

Experimento separado do jogo principal, para testar o tafl como mecânica central.

- Jogar: abra `tafl/index.html`. Dá para jogar com o Rei ou com a Loucura, contra a IA em três níveis.
- Código: `tafl/motor.js` (regras), `tafl/ia.js` (busca alfa-beta), `tafl/ui.js` (tela).
- Regras: base de Copenhague adaptada ao 7×7. Rei armado; longe do trono cai no sanduíche, no trono precisa de 4 atacantes e ao lado dele de 3 mais o trono; quinas e trono vazio são hostis; repetição tripla é derrota do Rei.
- Conferir: `node tests/tafl.js [partidas]` roda os testes de regra e, com um número, a IA contra ela mesma.
