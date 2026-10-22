// IA da Brandubh: busca alfa-beta (negamax) com avaliação simples.
// O nível muda a profundidade, o tempo e o ruído na escolha.
(function (g) {
  'use strict';
  const T = g.Tafl;
  const { ATA, DEF, REI, PASSOS } = T;

  const IA = { rng: Math.random };

  IA.niveis = {
    facil: { nome: 'Fácil', prof: 1, ruido: 60 },
    medio: { nome: 'Médio', prof: 2, ruido: 10 },
    dificil: { nome: 'Difícil', prof: 6, tempo: 1200, ruido: 0 },
  };

  const VITORIA = 100000;
  // Casas na diagonal das quinas: bloqueiam o Rei sem ficar presas contra a quina.
  const GUARDAS = [8, 12, 36, 40];

  // Avaliação do ponto de vista de quem vai jogar (`vez`).
  function avaliar(b, vez) {
    let ata = 0, def = 0, rei = -1;
    for (let i = 0; i < b.length; i++) {
      if (b[i] === ATA) ata++;
      else if (b[i] === DEF) def++;
      else if (b[i] === REI) rei = i;
    }
    const cam = T.caminhosLivres(b);
    // Rei com quina livre e na vez dele, ou com duas quinas livres: perdido para os atacantes.
    if (cam && vez === 'def') return VITORIA / 2;
    if (cam >= 2) return -VITORIA / 2;

    let v = 10 * ata - 16 * def - 60 * cam; // do ponto de vista dos atacantes
    for (const [n] of PASSOS[rei]) if (b[n] === ATA) v += 12;
    const r = T.lin(rei), c = T.col(rei);
    v += 4 * Math.min(r, 6 - r) + 4 * Math.min(c, 6 - c);
    for (const q of GUARDAS) if (b[q] === ATA) v += 8;
    v -= 2 * T.destinos(b, rei).length;
    return vez === 'ata' ? v : -v;
  }

  // Lances já aplicados: [de, para, tabuleiro, venceu].
  function filhos(b, vez) {
    const res = [];
    for (const [de, para] of T.lances(b, vez)) {
      const b2 = b.slice();
      const rei = b2[de] === REI;
      T.mover(b2, de, para);
      const venceu = vez === 'def' ? rei && T.ehQuina(para) : T.acharRei(b2) < 0;
      res.push([de, para, b2, venceu]);
    }
    return res;
  }

  function ordenar(fs, vez) {
    const outro = T.outro(vez);
    for (const f of fs) f.ord = f[3] ? VITORIA : -avaliar(f[2], outro);
    fs.sort((x, y) => y.ord - x.ord);
  }

  let nos = 0, limite = Infinity;
  const ESGOTOU = {};

  function negamax(b, vez, prof, alfa, beta, ply) {
    if ((++nos & 1023) === 0 && Date.now() > limite) throw ESGOTOU;
    if (prof === 0) return avaliar(b, vez);
    const fs = filhos(b, vez);
    if (!fs.length) return -VITORIA + ply;
    if (prof > 1) ordenar(fs, vez);
    let melhor = -Infinity;
    for (const f of fs) {
      const v = f[3] ? VITORIA - ply : -negamax(f[2], T.outro(vez), prof - 1, -beta, -alfa, ply + 1);
      if (v > melhor) melhor = v;
      if (v > alfa) alfa = v;
      if (alfa >= beta) break;
    }
    return melhor;
  }

  // Valor de cada lance da raiz, já considerando a repetição de posição.
  function avaliarRaiz(s, fs, prof) {
    const outro = T.outro(s.vez);
    for (const f of fs) {
      if (f[3]) { f.v = VITORIA; continue; }
      const rep = s.rep[outro + f[2].join('')] || 0;
      if (rep >= 2) { f.v = s.vez === 'ata' ? VITORIA : -VITORIA; continue; }
      f.v = -negamax(f[2], outro, prof - 1, -Infinity, Infinity, 1);
    }
  }

  // Escolhe um lance [de, para] para quem está na vez.
  IA.escolher = function (s, nivelId) {
    const nv = IA.niveis[nivelId] || IA.niveis.medio;
    const fs = filhos(s.b, s.vez);
    if (!fs.length) return null;
    ordenar(fs, s.vez);
    nos = 0;
    if (nv.tempo) {
      // Aprofunda enquanto houver tempo; fica com a última busca completa.
      limite = Date.now() + nv.tempo;
      let feitos = null;
      try {
        for (let p = 1; p <= nv.prof; p++) {
          avaliarRaiz(s, fs, p);
          fs.sort((x, y) => y.v - x.v);
          feitos = fs.map((f) => [f[0], f[1], f.v]);
          IA.info = { prof: p, nos };
          if (fs[0].v >= VITORIA / 2) break;
        }
      } catch (e) {
        if (e !== ESGOTOU) throw e;
      }
      limite = Infinity;
      if (!feitos) return [fs[0][0], fs[0][1]];
      // Sorteia entre os lances empatados para as partidas não se repetirem.
      const empate = feitos.filter((f) => f[2] === feitos[0][2]);
      const melhor = empate[Math.floor(IA.rng() * empate.length)];
      return [melhor[0], melhor[1]];
    }
    limite = Infinity;
    avaliarRaiz(s, fs, nv.prof);
    // O ruído faz os níveis baixos errarem de vez em quando, mas nunca deixam passar uma vitória.
    let melhor = null, mv = -Infinity;
    for (const f of fs) {
      const v = f.v >= VITORIA / 2 ? f.v : f.v + IA.rng() * nv.ruido;
      if (v > mv) { mv = v; melhor = f; }
    }
    return [melhor[0], melhor[1]];
  };

  IA.avaliar = avaliar;
  g.IA = IA;
})(typeof window !== 'undefined' ? window : globalThis);
