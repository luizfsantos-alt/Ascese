// Regras do jogo. Não toca no DOM: recebe e altera um objeto de estado.
(function (g) {
  'use strict';
  const D = g.Dados;

  const Motor = { rng: Math.random };

  // ---------- utilidades ----------
  const rnd = () => Motor.rng();
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  function pickPeso(arr, campo) {
    campo = campo || 'peso';
    const total = arr.reduce((s, x) => s + x[campo], 0);
    let r = rnd() * total;
    for (const x of arr) {
      r -= x[campo];
      if (r < 0) return x;
    }
    return arr[arr.length - 1];
  }
  function embaralhar(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const acao = (id) => D.acoes.find((x) => x.id === id);

  Motor.fmtAL = (n) => (n / 30).toFixed(2).replace('.', ',');
  Motor.fmtV = (n) => (n / 3).toFixed(2).replace('.', ',');

  function log(s, msg) {
    s.log.unshift(msg);
    if (s.log.length > 60) s.log.length = 60;
  }

  // ---------- estado ----------
  Motor.novoEstado = function () {
    return {
      asc: 0, lou: 0, von: 0,
      desbloq: { plantar: true },
      inv: {},
      ritual: null,   // { tier }
      pend: null,     // sorteio aguardando "Aplicar"
      ultimo: null,   // último resultado aplicado
      fim: null,      // 'vitoria' | 'derrota'
      pacotes: 0,
      log: [],
    };
  };

  function somar(s, a, l, v) {
    s.asc = Math.max(0, s.asc + a);
    s.lou = Math.max(0, s.lou + l);
    s.von = Math.max(0, s.von + v);
    checarDesbloqueios(s);
  }

  function checarDesbloqueios(s) {
    for (const ac of D.acoes) {
      if (!s.desbloq[ac.id] && s.von >= ac.limiar) {
        s.desbloq[ac.id] = true;
        log(s, `Desbloqueado: ${ac.nome}`);
      }
    }
  }

  function addItem(s, key) {
    s.inv[key] = (s.inv[key] || 0) + 1;
    log(s, `Item obtido: ${D.itens[key].nome}`);
  }

  function gastarItem(s, key) {
    if (!s.inv[key]) return false;
    s.inv[key]--;
    if (!s.inv[key]) delete s.inv[key];
    return true;
  }

  function checarFim(s) {
    if (s.fim) return;
    if (s.asc >= D.META) {
      s.fim = 'vitoria';
      log(s, 'ASCENDEU!');
    } else if (s.lou >= D.META) {
      if (gastarItem(s, 'desafio')) {
        s.lou = D.META - 30;
        log(s, 'Desafio à Loucura consumido: Loucura volta para 99.');
      } else {
        s.fim = 'derrota';
        log(s, 'Enlouqueceu e morreu.');
      }
    }
  }

  // ---------- consultas para a UI ----------
  Motor.podeAbrir = function (s, id) {
    const ac = acao(id);
    return !s.fim && !s.ritual && !s.pend && !!s.desbloq[id] && s.von >= ac.custo;
  };
  Motor.podeRitual = (s) => !s.fim && !s.ritual && !s.pend && s.von >= D.VONTADE_RITUAL;
  Motor.temCartas = (s) => !!s.pend && ['pacote', 'tier1', 'tier2'].includes(s.pend.tipo);

  // ---------- sorteio de cartas ----------
  function sortearUma(def, emMao) {
    let pool = def.cartas;
    if (def.distintas) pool = pool.filter((c) => !emMao.includes(c));
    return def.ponderado ? pickPeso(pool) : pick(pool);
  }
  function sortearVarias(def) {
    const cartas = [];
    for (let i = 0; i < def.n; i++) cartas.push(sortearUma(def, cartas));
    return cartas.map((c) => ({ c, queimada: false }));
  }
  function defDoPend(s) {
    return s.pend.tipo === 'pacote' ? acao(s.pend.acao) : D.tiers[s.ritual.tier];
  }

  // ---------- ações do dia a dia ----------
  Motor.abrirPacote = function (s, id) {
    if (!Motor.podeAbrir(s, id)) return false;
    const ac = acao(id);
    s.von -= ac.custo;
    s.pacotes++;
    const pend = { tipo: 'pacote', acao: id, titulo: ac.nome, cartas: sortearVarias(ac), itens: [] };
    if (ac.itens && rnd() < D.CHANCE_ITEM) {
      const key = pickPeso(ac.itens).key;
      addItem(s, key);
      pend.itens.push(key);
    }
    if (ac.desafio && rnd() < D.CHANCE_DESAFIO) {
      addItem(s, 'desafio');
      pend.itens.push('desafio');
    }
    s.pend = pend;
    // Só espera o jogador se ele puder usar Enxofre ou Transmutar.
    if (!s.inv.enxofre && !s.inv.transmutar) Motor.aplicar(s);
    return true;
  };

  // ---------- itens ----------
  Motor.usarItem = function (s, key) {
    const it = D.itens[key];
    if (s.fim || !it || it.tipo !== 'consumivel' || !s.inv[key]) return false;
    gastarItem(s, key);
    const v = s.ritual ? 0 : it.v; // no Ritual a Vontade não importa
    somar(s, it.a, it.l, v);
    log(s, `Usou ${it.nome}.`);
    return true;
  };

  Motor.usarEnxofre = function (s, i) {
    if (s.fim || !Motor.temCartas(s) || !s.inv.enxofre) return false;
    const carta = s.pend.cartas[i];
    if (!carta || carta.queimada) return false;
    gastarItem(s, 'enxofre');
    carta.queimada = true;
    log(s, `Enxofre queimou ${carta.c.nome}.`);
    return true;
  };

  Motor.usarTransmutar = function (s, i) {
    if (s.fim || !s.pend || !s.inv.transmutar) return false;
    const p = s.pend;
    if (Motor.temCartas(s)) {
      const carta = p.cartas[i];
      if (!carta || carta.queimada) return false;
      const outras = p.cartas.filter((x, j) => j !== i).map((x) => x.c);
      gastarItem(s, 'transmutar');
      const antes = carta.c.nome;
      carta.c = sortearUma(defDoPend(s), outras);
      log(s, `Transmutar: ${antes} → ${carta.c.nome}.`);
      return true;
    }
    if (p.tipo === 'tier3') {
      if (p.escolha === null) return false;
      gastarItem(s, 'transmutar');
      p.ordem = embaralhar(D.demonios);
      p.escolha = null;
      p.res = null;
      log(s, 'Transmutar: as silhuetas foram reembaralhadas.');
      return true;
    }
    if (p.tipo === 'tier4') {
      gastarItem(s, 'transmutar');
      p.moeda = rnd() < 0.5 ? 'asc' : 'lou';
      log(s, 'Transmutar: a moeda foi jogada de novo.');
      return true;
    }
    return false;
  };

  // ---------- ritual ----------
  Motor.iniciarRitual = function (s) {
    if (!Motor.podeRitual(s)) return false;
    s.ritual = { tier: 1 };
    s.ultimo = null;
    log(s, 'O Ritual começou.');
    return true;
  };

  Motor.abrirTier = function (s) {
    if (s.fim || !s.ritual || s.pend) return false;
    const t = s.ritual.tier;
    const def = D.tiers[t];
    if (t === 1 || t === 2) {
      s.pend = { tipo: 'tier' + t, titulo: def.nome, cartas: sortearVarias(def) };
    } else if (t === 3) {
      s.pend = { tipo: 'tier3', titulo: def.nome, ordem: embaralhar(D.demonios), escolha: null, res: null };
    } else {
      s.pend = { tipo: 'tier4', titulo: def.nome, moeda: rnd() < 0.5 ? 'asc' : 'lou' };
    }
    return true;
  };

  Motor.escolherSilhueta = function (s, i) {
    const p = s.pend;
    if (s.fim || !p || p.tipo !== 'tier3' || p.escolha !== null) return false;
    p.escolha = i;
    const d = p.ordem[i];
    p.res = pickPeso([
      { r: 'ganha', peso: d.ganha },
      { r: 'perde', peso: d.perde },
      { r: 'silencio', peso: d.silencio },
    ]).r;
    return true;
  };

  Motor.desistir = function (s) {
    if (s.fim || !s.ritual) return false;
    s.ritual = null;
    s.pend = null;
    s.von = 0;
    s.lou += D.DESISTIR_LOUCURA;
    log(s, 'Desistiu do Ritual: Vontade zerada, +25 de Loucura.');
    checarFim(s);
    return true;
  };

  // ---------- aplicar o sorteio pendente ----------
  Motor.aplicar = function (s) {
    const p = s.pend;
    if (s.fim || !p) return false;
    if (p.tipo === 'tier3' && p.escolha === null) return false;

    const r = { titulo: p.titulo, tipo: p.tipo, cartas: p.cartas, itens: p.itens || [], a: 0, l: 0, v: 0, nota: '' };
    const asc0 = s.asc, lou0 = s.lou, von0 = s.von;

    if (p.tipo === 'pacote') {
      for (const x of p.cartas) {
        if (x.queimada) continue;
        r.a += x.c.a; r.l += x.c.l; r.v += x.c.v;
      }
      somar(s, r.a, r.l, r.v);
    } else if (p.tipo === 'tier1' || p.tipo === 'tier2') {
      let ganha = 0, perde = 0, a = 0, l = 0;
      for (const x of p.cartas) {
        if (x.queimada) continue;
        if (x.c.dec === 'ganha') ganha++;
        else if (x.c.dec === 'perde') perde++;
        else { a += x.c.a; l += x.c.l; }
      }
      somar(s, a, l, 0);
      if (ganha && perde) {
        r.nota = 'Silêncio: os decisivos se anulam.';
      } else if (ganha) {
        s.asc = D.META;
        r.nota = 'Decisivo de Ascensão!';
      } else if (perde) {
        s.lou += D.PERDA_RITUAL;
        r.nota = 'Decisivo de Loucura: +80.';
      }
    } else if (p.tipo === 'tier3') {
      const d = p.ordem[p.escolha];
      r.demonio = d.nome;
      r.res = p.res;
      if (p.res === 'ganha') { s.asc = D.META; r.nota = `${d.nome} concedeu a Ascensão.`; }
      else if (p.res === 'perde') { s.lou += D.PERDA_RITUAL; r.nota = `${d.nome} cobrou: +80 de Loucura.`; }
      else { somar(s, D.SILENCIO_PAIMON.a, D.SILENCIO_PAIMON.l, 0); r.nota = `Silêncio de ${d.nome}: +20 Ascensão, +10 Loucura.`; }
    } else if (p.tipo === 'tier4') {
      r.moeda = p.moeda;
      if (p.moeda === 'asc') { s.asc = D.META; r.nota = 'A moeda caiu em Ascensão.'; }
      else { s.lou = Math.max(s.lou, D.META); r.nota = 'A moeda caiu em Loucura.'; }
    }

    r.da = s.asc - asc0; r.dl = s.lou - lou0; r.dv = s.von - von0;
    s.pend = null;
    s.ultimo = r;
    log(s, `${r.titulo}: Asc ${sinal(r.da, Motor.fmtAL)}, Louc ${sinal(r.dl, Motor.fmtAL)}, Vont ${sinal(r.dv, Motor.fmtV)}${r.nota ? ' — ' + r.nota : ''}`);
    checarFim(s);

    if (s.ritual && !s.fim) {
      if (s.ritual.tier < 4) {
        s.ritual.tier++;
      } else {
        // Só acontece se o Desafio à Loucura salvou o jogador na moeda.
        s.ritual = null;
        s.von = 0;
        log(s, 'O Ritual se encerrou sem desfecho. Vontade zerada.');
      }
    }
    return true;
  };

  function sinal(n, fmt) {
    return (n >= 0 ? '+' : '') + fmt(n);
  }

  // ---------- debug ----------
  Motor.debug = {
    vontade(s, v) { somar(s, 0, 0, Math.round(v * 3)); },
    loucura(s, l) { somar(s, 0, Math.round(l * 30), 0); checarFim(s); },
    ascensao(s, a) { somar(s, Math.round(a * 30), 0, 0); checarFim(s); },
    itens(s) { for (const k of Object.keys(D.itens)) addItem(s, k); },
  };

  g.Motor = Motor;
})(typeof window !== 'undefined' ? window : globalThis);
