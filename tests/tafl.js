// Confere as regras da Brandubh e mede a IA jogando contra ela mesma.
// Uso: node tests/tafl.js [partidas por confronto]
'use strict';
const assert = require('assert');
require('../tafl/motor.js');
require('../tafl/ia.js');
const T = globalThis.Tafl;
const IA = globalThis.IA;

const i = (r, c) => r * T.N + c;
let ok = 0;
function teste(nome, fn) {
  fn();
  ok++;
  console.log(`ok  ${nome}`);
}

teste('montagem inicial', () => {
  const s = T.novaPartida();
  assert.strictEqual(s.b.filter((p) => p === T.ATA).length, 8);
  assert.strictEqual(s.b.filter((p) => p === T.DEF).length, 4);
  assert.strictEqual(s.b[T.TRONO], T.REI);
  assert.strictEqual(s.vez, 'ata');
});

teste('anda como torre e não pula peças', () => {
  const s = T.novaPartida();
  assert.deepStrictEqual(T.destinos(s.b, i(0, 3)).sort((a, b) => a - b), [i(0, 1), i(0, 2), i(0, 4), i(0, 5)]);
  assert.deepStrictEqual(T.destinos(s.b, i(3, 3)), []);
});

teste('só o Rei para no trono e nas quinas; trono vazio pode ser atravessado', () => {
  const s = T.novaPartida(['.......', '.......', '.......', 'A......', '.......', '.......', 'R.....D'], 'ata');
  const d = T.destinos(s.b, i(3, 0));
  assert(!d.includes(i(0, 0)) && !d.includes(i(6, 0)));
  const s2 = T.novaPartida(['.......', '.......', '.......', 'D......', '.......', '.......', '...R...'], 'def');
  const d2 = T.destinos(s2.b, i(3, 0));
  assert(!d2.includes(T.TRONO) && d2.includes(i(3, 6)));
  assert(T.destinos(s.b, i(6, 0)).length > 0);
});

teste('captura em sanduíche', () => {
  const s = T.novaPartida(['.......', '.......', '..AD...', '.......', '....A..', '.......', 'R......'], 'ata');
  assert(T.jogar(s, i(4, 4), i(2, 4)));
  assert.strictEqual(s.b[i(2, 3)], T.VAZIO);
  assert.deepStrictEqual(s.ultimo.cap, [i(2, 3)]);
});

teste('entrar entre duas peças inimigas é seguro', () => {
  const s = T.novaPartida(['.......', '.......', '..A.A..', '.......', '...D...', '.......', 'R......'], 'def');
  assert(T.jogar(s, i(4, 3), i(2, 3)));
  assert.strictEqual(s.b[i(2, 3)], T.DEF);
});

teste('quina é hostil', () => {
  const s = T.novaPartida(['.D.....', '.......', '.......', '...R...', '.......', '.......', '..A....'], 'ata');
  assert(T.jogar(s, i(6, 2), i(0, 2)));
  assert.strictEqual(s.b[i(0, 1)], T.VAZIO);
});

teste('trono vazio é hostil aos defensores', () => {
  const s = T.novaPartida(['.......', '.......', '...D...', '.......', '.......', '.....A.', 'R......'], 'ata');
  assert(T.jogar(s, i(5, 5), i(1, 5)) && T.jogar(s, i(6, 0), i(5, 0)));
  assert(T.jogar(s, i(1, 5), i(1, 3)));
  assert.strictEqual(s.b[i(2, 3)], T.VAZIO);
});

teste('o Rei é armado: ajuda a capturar', () => {
  const s = T.novaPartida(['.......', '.......', '.......', '.......', '.RA....', '.......', '...D..A'], 'def');
  assert(T.jogar(s, i(6, 3), i(4, 3)));
  assert.strictEqual(s.b[i(4, 2)], T.VAZIO);
});

teste('Rei longe do trono cai no sanduíche', () => {
  const s = T.novaPartida(['.......', '.......', 'AR.....', '.......', '.......', '.......', '..A.D..'], 'ata');
  assert(T.jogar(s, i(6, 2), i(2, 2)));
  assert.strictEqual(s.fim, 'ata');
});

teste('Rei ao lado do trono precisa de 3 atacantes + trono', () => {
  const s = T.novaPartida(['.......', '.......', '..AR...', '.......', '.......', '.......', 'D...A..'], 'ata');
  assert(T.jogar(s, i(6, 4), i(2, 4)));
  assert(!s.fim, 'sanduíche simples não basta');
  const s2 = T.novaPartida(['.......', '......A', '..ARA..', '.......', '.......', '.......', 'D......'], 'ata');
  assert(T.jogar(s2, i(1, 6), i(1, 3)));
  assert.strictEqual(s2.fim, 'ata');
});

teste('Rei no trono precisa de 4 atacantes', () => {
  const s = T.novaPartida(['.......', '.......', '...A...', '..AR...', '...A...', '.......', '....A.D'], 'ata');
  assert(T.jogar(s, i(6, 4), i(3, 4)));
  assert.strictEqual(s.fim, 'ata');
});

teste('Rei na quina vence', () => {
  const s = T.novaPartida(['.......', '.......', '.......', 'R......', '.......', '.......', '...A...'], 'def');
  assert.strictEqual(T.caminhosLivres(s.b), 2);
  assert(T.jogar(s, i(3, 0), i(0, 0)));
  assert.strictEqual(s.fim, 'def');
});

teste('repetição tripla é derrota dos defensores', () => {
  const s = T.novaPartida(['.A.....', '.......', '.......', '...R...', '.......', '.......', '.....A.'], 'ata');
  for (let k = 0; k < 2; k++) {
    T.jogar(s, i(0, 1), i(0, 2)); T.jogar(s, i(3, 3), i(3, 2));
    T.jogar(s, i(0, 2), i(0, 1)); T.jogar(s, i(3, 2), i(3, 3));
  }
  assert.strictEqual(s.fim, 'ata');
});

teste('IA aproveita vitória imediata', () => {
  const s = T.novaPartida(['.......', '.......', '.......', 'R.....A', '.......', '.......', '...A...'], 'def');
  for (const nv of Object.keys(IA.niveis)) {
    const [de, para] = IA.escolher(T.clonar(s), nv);
    assert(de === i(3, 0) && T.ehQuina(para), nv);
  }
});

console.log(`\n${ok} testes passaram.`);

// ---------- IA contra IA ----------
const N = +(process.argv[2] || 0);
if (N) {
  const confrontos = [['medio', 'medio'], ['dificil', 'medio'], ['medio', 'dificil'], ['dificil', 'dificil']];
  for (const [ata, def] of confrontos) {
    const placar = { ata: 0, def: 0 };
    let lances = 0;
    const t0 = Date.now();
    for (let k = 0; k < N; k++) {
      const s = T.novaPartida();
      while (!s.fim && s.lances < 200) {
        const [de, para] = IA.escolher(s, s.vez === 'ata' ? ata : def);
        T.jogar(s, de, para);
      }
      if (s.fim) placar[s.fim]++;
      lances += s.lances;
    }
    console.log(`Loucura ${ata.padEnd(7)} × Rei ${def.padEnd(7)}  Loucura ${placar.ata}  Rei ${placar.def}  ` +
      `(lances médios ${(lances / N).toFixed(0)}, ${((Date.now() - t0) / N / 1000).toFixed(1)} s/partida)`);
  }
}
