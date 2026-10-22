// Interface: desenha o estado e repassa os toques para o motor.
(function () {
  'use strict';
  const D = window.Dados;
  const M = window.Motor;
  const { fmtAL, fmtV } = M;

  // O álbum fica salvo no aparelho e passa de uma partida para a outra.
  const CHAVE_ALBUM = 'ascese.album';
  function carregarAlbum() {
    try { return JSON.parse(localStorage.getItem(CHAVE_ALBUM)) || {}; } catch (e) { return {}; }
  }
  function salvarAlbum() {
    try { localStorage.setItem(CHAVE_ALBUM, JSON.stringify(s.album)); } catch (e) { /* sem armazenamento */ }
  }

  let s = M.novoEstado(carregarAlbum());
  let debugAberto = false;
  let vendoAlbum = false;

  const pct = (n, max) => Math.min(100, (n / max) * 100).toFixed(1) + '%';

  function ef(n, fmt, rotulo, invertido) {
    if (!n) return '';
    const bom = invertido ? n < 0 : n > 0;
    return `<span class="${bom ? 'pos' : 'neg'}">${rotulo} ${n > 0 ? '+' : ''}${fmt(n)}</span> `;
  }
  // c: carta, item ou efeito já calculado por M.efeito.
  function efeitos(c, semVontade) {
    if (c.dec === 'ganha') return '<span class="pos">Decisivo: Ascensão</span>';
    if (c.dec === 'perde') return `<span class="neg">Decisivo: Loucura +${fmtAL(c.perda || D.PERDA_RITUAL)}</span>`;
    const t = ef(c.a, fmtAL, 'Asc', false) + ef(c.l, fmtAL, 'Louc', true) + (semVontade ? '' : ef(c.v, fmtV, 'Vont', false));
    return t || '<span>sem efeito</span>';
  }

  function medidores() {
    return `
      <div class="medidor asc"><span>Ascensão</span><div class="barra"><i style="width:${pct(s.asc, D.META)}"></i></div><span class="valor">${fmtAL(s.asc)}</span></div>
      <div class="medidor lou"><span>Loucura</span><div class="barra"><i style="width:${pct(s.lou, D.META)}"></i></div><span class="valor">${fmtAL(s.lou)}</span></div>
      <div class="medidor von"><span>Vontade</span><div class="barra"><i style="width:${pct(s.von, D.VONTADE_RITUAL)}"></i></div><span class="valor">${fmtV(s.von)}</span></div>`;
  }

  function telaFim() {
    const vit = s.fim === 'vitoria';
    return `<section class="fim">
      <h1>${vit ? 'Você ascendeu' : 'Você enlouqueceu'}</h1>
      <p>${vit ? 'A Ascensão chegou a 100.' : 'A Loucura chegou a 100. Tudo se perdeu.'}</p>
      <p>Pacotes abertos: ${s.pacotes}</p>
      <button class="principal" data-cmd="reiniciar">Jogar de novo</button>
      <button style="margin-top:8px;width:100%" data-cmd="album">${rotuloAlbum()}</button>
    </section>`;
  }

  function painelAcoes() {
    const botoes = D.acoes.map((ac) => {
      const liberada = s.desbloq[ac.id];
      const info = liberada ? `custo ${fmtV(ac.custo)}` : `bloqueado (${fmtV(ac.limiar)})`;
      return `<button data-cmd="abrir" data-arg="${ac.id}" ${M.podeAbrir(s, ac.id) ? '' : 'disabled'}>
        ${ac.nome}<small>${info}</small></button>`;
    }).join('');
    const ritual = s.von >= D.VONTADE_RITUAL
      ? `<button class="principal" style="margin-top:10px" data-cmd="ritual" ${M.podeRitual(s) ? '' : 'disabled'}>Ritual</button>` : '';
    return `<section><h2>Ações</h2><div class="acoes">${botoes}</div>${ritual}</section>`;
  }

  function painelRitual() {
    const t = s.ritual.tier;
    const abrir = s.pend ? '' : `<button class="principal" data-cmd="tier">Abrir ${D.tiers[t].nome}</button>`;
    return `<section><h2>Ritual — tier ${['I', 'II', 'III', 'IV'][t - 1]}</h2>
      ${abrir}
      <div class="linha-botoes" style="margin-top:8px"><button class="perigo" data-cmd="desistir">Desistir (Vontade 0, Loucura +25)</button></div>
    </section>`;
  }

  function cartaHTML(x, i, comBotoes, semVontade) {
    const c = x.c;
    let botoes = '';
    if (comBotoes && !x.queimada) {
      const b = [];
      if (s.inv.enxofre) b.push(`<button class="pequeno" data-cmd="enxofre" data-arg="${i}">Enxofre</button>`);
      if (s.inv.transmutar) b.push(`<button class="pequeno" data-cmd="transmutar" data-arg="${i}">Transmutar</button>`);
      if (b.length) botoes = `<div class="botoes">${b.join('')}</div>`;
    }
    const vr = x.var ? M.variante(x.var) : null;
    const tags = (vr ? `<span class="tag ${vr.id}">${vr.nome}</span>` : '') + (x.nova ? '<span class="tag nova">Nova no álbum</span>' : '');
    return `<div class="carta ${x.queimada ? 'queimada' : ''} ${vr ? 'var-' + vr.id : ''}">
      <div class="nome">${c.nome}${c.cat ? ` <small>(${c.cat})</small>` : ''} ${tags}</div>
      ${c.desc ? `<div class="desc">${c.desc}</div>` : ''}
      <div class="ef">${efeitos(M.efeito(c, x.var), semVontade)}</div>${botoes}</div>`;
  }

  function painelPendente() {
    const p = s.pend;
    if (!p) return '';
    let corpo = '';
    let podeAplicar = true;
    if (p.cartas) {
      corpo = p.cartas.map((x, i) => cartaHTML(x, i, true, p.tipo !== 'pacote')).join('');
    } else if (p.tipo === 'tier3') {
      if (p.escolha === null) {
        podeAplicar = false;
        corpo = `<p>Três silhuetas. Escolha uma.</p><div class="silhuetas">
          ${[0, 1, 2].map((i) => `<button data-cmd="silhueta" data-arg="${i}">?</button>`).join('')}</div>`;
      } else {
        const d = p.ordem[p.escolha];
        const txt = { ganha: 'Pacto de Ascensão', perde: 'Pacto de Loucura (+80)', silencio: 'Silêncio (+20 Asc, +10 Louc)' }[p.res];
        corpo = `<p>Silhueta ${p.escolha + 1}: <b>${d.nome}</b></p><p class="nota">${txt}</p>
          ${s.inv.transmutar ? '<button class="pequeno" data-cmd="transmutar">Transmutar (reembaralhar)</button>' : ''}`;
      }
    } else if (p.tipo === 'tier4') {
      corpo = `<p class="nota">A moeda caiu em: ${p.moeda === 'asc' ? 'ASCENSÃO' : 'LOUCURA'}</p>
        ${s.inv.transmutar ? '<button class="pequeno" data-cmd="transmutar">Transmutar (jogar de novo)</button>' : ''}`;
    }
    const itens = (p.itens || []).map((k) => `<p class="pos">Item: ${D.itens[k].nome}</p>`).join('');
    return `<section><h2>${p.titulo}</h2>${corpo}${itens}
      ${podeAplicar ? '<button class="principal" style="margin-top:8px" data-cmd="aplicar">Aplicar</button>' : ''}</section>`;
  }

  function painelUltimo() {
    const r = s.ultimo;
    if (!r || s.pend) return '';
    const cartas = r.cartas ? r.cartas.map((x, i) => cartaHTML(x, i, false, r.tipo !== 'pacote')).join('') : '';
    const itens = r.itens.map((k) => `<p class="pos">Item: ${D.itens[k].nome}</p>`).join('');
    const total = ef(r.da, fmtAL, 'Asc', false) + ef(r.dl, fmtAL, 'Louc', true) + ef(r.dv, fmtV, 'Vont', false);
    return `<section><h2>Último: ${r.titulo}</h2>${cartas}
      ${r.nota ? `<p class="nota">${r.nota}</p>` : ''}${itens}
      <div class="ef">Total: ${total || 'nada mudou'}</div></section>`;
  }

  function painelInventario() {
    const keys = Object.keys(s.inv);
    if (!keys.length) return '';
    const linhas = keys.map((k) => {
      const it = D.itens[k];
      let detalhe = it.desc || efeitos(it, !!s.ritual);
      if (it.tipo === 'consumivel' && s.ritual && !it.a && !it.l) detalhe = 'sem efeito no Ritual';
      const botao = it.tipo === 'consumivel' ? `<button class="pequeno" data-cmd="usar" data-arg="${k}">Usar</button>` : '';
      return `<div class="linha"><div><b>${it.nome}</b> ×${s.inv[k]}<div class="ef">${detalhe}</div></div>${botao}</div>`;
    }).join('');
    return `<section><h2>Inventário</h2><div class="inv">${linhas}</div></section>`;
  }

  function painelLog() {
    return `<section><h2>Registro</h2><ol class="log" reversed>${s.log.map((l) => `<li>${l}</li>`).join('')}</ol></section>`;
  }

  // ---------- álbum ----------
  function contarAlbum(pg) {
    const vistas = s.album[pg.id] || {};
    return pg.cartas.filter((c) => vistas[c.nome]).length;
  }
  function rotuloAlbum() {
    const total = D.album.reduce((n, pg) => n + pg.cartas.length, 0);
    const vistas = D.album.reduce((n, pg) => n + contarAlbum(pg), 0);
    return `Álbum de cartas (${vistas}/${total})`;
  }
  function botaoAlbum() {
    return `<button style="width:100%;margin-top:10px" data-cmd="album">${rotuloAlbum()}</button>`;
  }

  function telaAlbum() {
    const legenda = D.variantes.map((vr) =>
      `<div><span class="tag ${vr.id}">${vr.nome}</span> ${vr.desc}</div>`).join('');
    const paginas = D.album.map((pg) => {
      const vistas = s.album[pg.id] || {};
      const semVontade = pg.id.startsWith('tier');
      const cartas = pg.cartas.map((c) => {
        const e = vistas[c.nome];
        if (!e) return '<div class="carta oculta"><div class="nome">???</div><div class="desc">Ainda não encontrada</div></div>';
        const vars = D.variantes.filter((vr) => e.var[vr.id])
          .map((vr) => `<span class="tag ${vr.id}">${vr.nome} ×${e.var[vr.id]}</span>`).join(' ');
        return `<div class="carta">
          <div class="nome">${c.nome}${c.cat ? ` <small>(${c.cat})</small>` : ''}</div>
          ${c.desc ? `<div class="desc">${c.desc}</div>` : ''}
          <div class="ef">${efeitos(c, semVontade)}</div>
          <div class="desc">Puxada ×${e.n}${vars ? ' · ' + vars : ''}</div></div>`;
      }).join('');
      return `<details class="pagina"><summary>${pg.nome} <span>${contarAlbum(pg)}/${pg.cartas.length}</span></summary>${cartas}</details>`;
    }).join('');
    return `<section><h2>${rotuloAlbum()}</h2>
      <button class="principal" data-cmd="album">Voltar ao jogo</button>
      <div class="legenda">${legenda}</div>${paginas}</section>`;
  }

  function painelDebug() {
    return `<details ${debugAberto ? 'open' : ''} id="debug"><summary>Debug</summary><section>
      <div class="linha-botoes">
        <button class="pequeno" data-cmd="dbg" data-arg="v100">Vontade +100</button>
        <button class="pequeno" data-cmd="dbg" data-arg="v1000">Vontade +1000</button>
        <button class="pequeno" data-cmd="dbg" data-arg="l10">Loucura +10</button>
        <button class="pequeno" data-cmd="dbg" data-arg="l-10">Loucura −10</button>
        <button class="pequeno" data-cmd="dbg" data-arg="a10">Ascensão +10</button>
        <button class="pequeno" data-cmd="dbg" data-arg="itens">1 de cada item</button>
        <button class="pequeno perigo" data-cmd="reiniciar">Reiniciar</button>
        <button class="pequeno perigo" data-cmd="limparAlbum">Limpar álbum</button>
      </div></section></details>`;
  }

  function render() {
    document.getElementById('medidores').innerHTML = medidores();
    const app = document.getElementById('app');
    if (vendoAlbum) {
      app.innerHTML = telaAlbum();
      return;
    }
    if (s.fim) {
      app.innerHTML = telaFim() + painelLog();
      return;
    }
    app.innerHTML =
      (s.ritual ? painelRitual() : painelAcoes()) +
      painelPendente() +
      painelUltimo() +
      painelInventario() +
      botaoAlbum() +
      painelLog() +
      painelDebug();
  }

  const comandos = {
    abrir: (a) => M.abrirPacote(s, a),
    aplicar: () => M.aplicar(s),
    usar: (a) => M.usarItem(s, a),
    enxofre: (a) => M.usarEnxofre(s, +a),
    transmutar: (a) => M.usarTransmutar(s, a === undefined ? -1 : +a),
    ritual: () => M.iniciarRitual(s),
    tier: () => M.abrirTier(s),
    silhueta: (a) => M.escolherSilhueta(s, +a),
    desistir: () => { if (confirm('Desistir do Ritual? Vontade vai a 0 e Loucura +25.')) M.desistir(s); },
    reiniciar: () => { s = M.novoEstado(s.album); },
    album: () => { vendoAlbum = !vendoAlbum; window.scrollTo(0, 0); },
    limparAlbum: () => { if (confirm('Apagar todas as cartas do álbum?')) s.album = {}; },
    dbg: (a) => {
      if (a === 'itens') M.debug.itens(s);
      else ({ v: M.debug.vontade, l: M.debug.loucura, a: M.debug.ascensao })[a[0]](s, +a.slice(1));
    },
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cmd]');
    if (!b) return;
    const d = document.getElementById('debug');
    if (d) debugAberto = d.open;
    comandos[b.dataset.cmd](b.dataset.arg);
    salvarAlbum();
    render();
  });
  document.addEventListener('toggle', (e) => { if (e.target.id === 'debug') debugAberto = e.target.open; }, true);

  render();
})();
