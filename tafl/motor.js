// Regras da Brandubh (tafl irlandês, 7×7). Não toca no DOM.
// Atacantes (a Loucura) jogam primeiro; defensores protegem o Rei, que vence
// ao chegar numa quina. Base: regras de Copenhague adaptadas ao 7×7.
(function (g) {
  'use strict';

  const N = 7;
  const VAZIO = 0, ATA = 1, DEF = 2, REI = 3;
  const TRONO = 3 * N + 3;
  const QUINAS = [0, N - 1, N * (N - 1), N * N - 1];
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  const lin = (i) => Math.floor(i / N);
  const col = (i) => i % N;
  const dentro = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
  const ehQuina = (i) => QUINAS.includes(i);
  const restrita = (i) => i === TRONO || ehQuina(i);
  const lado = (p) => (p === ATA ? 'ata' : p ? 'def' : null);
  const outro = (l) => (l === 'ata' ? 'def' : 'ata');

  // Para cada casa e direção: [vizinha, a seguinte] (-1 fora do tabuleiro).
  const PASSOS = [];
  for (let i = 0; i < N * N; i++) {
    const v = [];
    for (const [dr, dc] of DIRS) {
      const r = lin(i) + dr, c = col(i) + dc;
      if (!dentro(r, c)) continue;
      v.push([r * N + c, dentro(r + dr, c + dc) ? (r + dr) * N + c + dc : -1]);
    }
    PASSOS.push(v);
  }
  const VIZ_TRONO = PASSOS[TRONO].map(([n]) => n);

  // ---------- regras ----------
  // Casa vazia, trono vazio e quinas são hostis a todos; peça é hostil ao outro lado.
  function hostil(b, i, l) {
    if (i < 0) return false;
    const p = b[i];
    return p ? lado(p) !== l : restrita(i);
  }

  // No trono ou ao lado dele o Rei precisa ser cercado pelos quatro lados
  // (o trono vazio conta como um deles); longe, basta o sanduíche comum.
  function reiCai(b, rei, alem) {
    if (rei === TRONO || VIZ_TRONO.includes(rei)) return PASSOS[rei].every(([n]) => hostil(b, n, 'def'));
    return hostil(b, alem, 'def');
  }

  // Casas para onde a peça em `de` pode ir (anda como a torre do xadrez).
  function destinos(b, de) {
    const rei = b[de] === REI, res = [];
    for (const [dr, dc] of DIRS) {
      let r = lin(de) + dr, c = col(de) + dc;
      while (dentro(r, c)) {
        const i = r * N + c;
        if (b[i]) break;
        if (rei || !restrita(i)) res.push(i); // o trono vazio pode ser atravessado
        r += dr; c += dc;
      }
    }
    return res;
  }

  function lances(b, l) {
    const res = [];
    for (let i = 0; i < N * N; i++) {
      if (lado(b[i]) !== l) continue;
      for (const p of destinos(b, i)) res.push([i, p]);
    }
    return res;
  }

  // Move e captura no próprio tabuleiro. Devolve as casas capturadas.
  // Só quem se move captura: entrar entre duas peças inimigas é seguro.
  function mover(b, de, para) {
    const p = b[de];
    b[para] = p;
    b[de] = VAZIO;
    const l = lado(p), cap = [];
    for (const [n, alem] of PASSOS[para]) {
      const q = b[n];
      if (!q || lado(q) === l) continue;
      if (q === REI ? reiCai(b, n, alem) : hostil(b, alem, lado(q))) cap.push(n);
    }
    for (const n of cap) b[n] = VAZIO;
    return cap;
  }

  const acharRei = (b) => b.indexOf(REI);

  // Quantas quinas o Rei alcança num só lance (1 = raichi, 2 = tuichi).
  function caminhosLivres(b) {
    const rei = acharRei(b);
    if (rei < 0) return 0;
    return destinos(b, rei).filter(ehQuina).length;
  }

  // ---------- partida ----------
  const MONTAGEM = [
    '...A...',
    '...A...',
    '...D...',
    'AADRDAA',
    '...D...',
    '...A...',
    '...A...',
  ];

  // Monta um tabuleiro a partir de linhas de texto (A, D, R e '.').
  function deTexto(linhas) {
    const b = new Int8Array(N * N);
    linhas.forEach((ln, r) => [...ln].forEach((ch, c) => {
      b[r * N + c] = { A: ATA, D: DEF, R: REI }[ch] || VAZIO;
    }));
    return b;
  }

  const chave = (s) => s.vez + s.b.join('');

  function novaPartida(linhas, vez) {
    const s = { b: deTexto(linhas || MONTAGEM), vez: vez || 'ata', fim: null, motivo: '', lances: 0, ultimo: null, rep: {} };
    s.rep[chave(s)] = 1;
    return s;
  }

  const clonar = (s) => Object.assign({}, s, { b: s.b.slice(), rep: Object.assign({}, s.rep) });

  // Joga o lance se for válido. Devolve false caso contrário.
  function jogar(s, de, para) {
    if (s.fim || lado(s.b[de]) !== s.vez || !destinos(s.b, de).includes(para)) return false;
    const peca = s.b[de];
    const cap = mover(s.b, de, para);
    s.ultimo = { de, para, cap, lado: s.vez };
    s.lances++;
    s.vez = outro(s.vez);
    if (peca === REI && ehQuina(para)) {
      fim(s, 'def', 'O Rei escapou pela quina.');
    } else if (acharRei(s.b) < 0) {
      fim(s, 'ata', 'O Rei foi capturado.');
    } else if (!lances(s.b, s.vez).length) {
      fim(s, outro(s.vez), 'Sem lances possíveis.');
    } else {
      const k = chave(s);
      s.rep[k] = (s.rep[k] || 0) + 1;
      // Como em Copenhague, repetir a posição pela terceira vez é derrota dos defensores.
      if (s.rep[k] >= 3) fim(s, 'ata', 'A posição se repetiu três vezes.');
    }
    return true;
  }

  function fim(s, vencedor, motivo) {
    s.fim = vencedor;
    s.motivo = motivo;
  }

  g.Tafl = {
    N, VAZIO, ATA, DEF, REI, TRONO, QUINAS, PASSOS,
    lin, col, lado, outro, ehQuina, restrita,
    destinos, lances, mover, acharRei, caminhosLivres, chave,
    deTexto, novaPartida, clonar, jogar,
  };
})(typeof window !== 'undefined' ? window : globalThis);
