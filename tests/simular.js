// Simula partidas com uma política simples para conferir os números do design.
// Uso: node tests/simular.js [partidas] [--sem-explorar] [--itens]
'use strict';
require('../js/dados.js');
require('../js/motor.js');
const D = globalThis.Dados;
const M = globalThis.Motor;

const args = process.argv.slice(2);
const N = +(args.find((a) => /^\d+$/.test(a)) || 20000);
const semExplorar = args.includes('--sem-explorar');
const comItens = args.includes('--itens');

// Médias por pacote de cada ação.
for (const ac of D.acoes) {
  const s = M.novoEstado();
  let a = 0, l = 0, v = 0;
  const K = 100000;
  for (let i = 0; i < K; i++) {
    Object.assign(s, { asc: 1000, lou: 1000, von: 100000, pend: null, inv: {}, fim: null });
    s.desbloq[ac.id] = true;
    const a0 = s.asc, l0 = s.lou, v0 = s.von;
    M.abrirPacote(s, ac.id);
    a += s.asc - a0; l += s.lou - l0; v += s.von - v0;
  }
  console.log(`${ac.nome.padEnd(9)} Asc ${(a / K / 30).toFixed(3)}  Louc ${(l / K / 30).toFixed(3)}  Vont líquida ${(v / K / 3).toFixed(2)}`);
}

function usarItens(s) {
  // Política simples: usa o melhor redutor de Loucura disponível quando passa de 40.
  while (s.lou > 40 * 30) {
    const k = Object.keys(s.inv).filter((k) => D.itens[k].tipo === 'consumivel')
      .sort((x, y) => D.itens[x].l - D.itens[y].l)[0];
    if (!k) break;
    M.usarItem(s, k);
  }
}

function resolverPend(s) {
  const p = s.pend;
  if (comItens && p.cartas) {
    p.cartas.forEach((x, i) => {
      if (x.c.dec === 'perde' && s.inv.enxofre) M.usarEnxofre(s, i);
      else if (x.c.dec === 'perde' && s.inv.transmutar) M.usarTransmutar(s, i);
    });
  }
  if (p.tipo === 'tier3') {
    M.escolherSilhueta(s, 0);
    if (comItens && p.res === 'perde' && s.inv.transmutar) {
      M.usarTransmutar(s);
      M.escolherSilhueta(s, 0);
    }
  }
  if (comItens && p.tipo === 'tier4' && p.moeda === 'lou' && s.inv.transmutar) M.usarTransmutar(s);
  M.aplicar(s);
}

let vitorias = 0, mortesAntes = 0, pacotes = 0, chegaram = 0, ascR = 0;
const louR = [];
const fimTier = { 1: 0, 2: 0, 3: 0, 4: 0 };
for (let j = 0; j < N; j++) {
  const s = M.novoEstado();
  while (!s.fim && !s.ritual) {
    if (comItens) usarItens(s);
    if (M.podeRitual(s)) {
      chegaram++; pacotes += s.pacotes; ascR += s.asc; louR.push(s.lou);
      M.iniciarRitual(s);
      break;
    }
    const ac = D.acoes.slice().reverse()
      .find((a) => !(semExplorar && a.id === 'explorar') && M.podeAbrir(s, a.id));
    M.abrirPacote(s, ac.id);
    if (s.pend) resolverPend(s);
  }
  if (s.fim === 'derrota') { mortesAntes++; continue; }
  while (s.ritual && !s.fim) {
    if (comItens) usarItens(s);
    const t = s.ritual.tier;
    M.abrirTier(s);
    resolverPend(s);
    if (s.fim) fimTier[t]++;
  }
  if (s.fim === 'vitoria') vitorias++;
}
louR.sort((x, y) => x - y);
const pc = (x) => (100 * x / N).toFixed(1) + '%';
console.log(`\n${N} partidas ${semExplorar ? '(sem Explorar)' : '(com Explorar)'} ${comItens ? 'com itens' : 'sem itens'}`);
console.log(`Vitórias: ${pc(vitorias)}   Mortes antes do Ritual: ${pc(mortesAntes)}`);
console.log(`Ao chegar no Ritual: pacotes médios ${(pacotes / chegaram).toFixed(0)}, Asc média ${(ascR / chegaram / 30).toFixed(1)}, Louc mediana ${(louR[louR.length >> 1] / 30).toFixed(1)}`);
console.log(`Onde o Ritual termina: ${[1, 2, 3, 4].map((t) => `T${t} ${(100 * fimTier[t] / chegaram).toFixed(1)}%`).join('  ')}`);
