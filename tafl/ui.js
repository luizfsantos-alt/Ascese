// Interface da Brandubh: desenha o tabuleiro e repassa os toques para o motor.
(function () {
  'use strict';
  const T = window.Tafl;
  const IA = window.IA;

  const NOMES = { ata: 'Loucura', def: 'Rei' };
  const CLASSE = { ata: 'lou', def: 'asc' };
  const PECA = { [T.ATA]: 'ata', [T.DEF]: 'def', [T.REI]: 'rei' };

  // Preferências ficam no aparelho; o resto é só desta partida.
  const CHAVE = 'ascese.tafl';
  let cfg = { lado: 'def', nivel: 'medio', placar: { vitorias: 0, derrotas: 0 } };
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(CHAVE))); } catch (e) { /* sem armazenamento */ }
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(cfg)); } catch (e) { /* sem armazenamento */ }
  }

  let s, sel, pensando, desfazer, contado;

  function novaPartida() {
    s = T.novaPartida();
    sel = null;
    pensando = false;
    desfazer = [];
    contado = false;
    desenhar();
    vezDaIA();
  }

  const casaNome = (i) => 'abcdefg'[T.col(i)] + (T.N - T.lin(i));

  function aviso() {
    const u = s.ultimo;
    if (!u) return '';
    const quem = NOMES[u.lado];
    let txt = `${quem}: ${casaNome(u.de)} → ${casaNome(u.para)}`;
    const cap = u.cap.filter((i) => s.b[i] !== T.REI);
    if (cap.length) txt += ` — capturou ${cap.length} peça${cap.length > 1 ? 's' : ''}`;
    let extra = '';
    if (!s.fim) {
      const cam = T.caminhosLivres(s.b);
      if (cam >= 2) extra = 'Tuichi: o Rei tem dois caminhos livres até as quinas. Não dá para bloquear os dois.';
      else if (cam === 1) extra = 'Raichi: o Rei tem um caminho livre até uma quina.';
    }
    return `<span class="aviso">${txt}</span>` + (extra ? `<span class="aviso forte">${extra}</span>` : '');
  }

  function status() {
    if (s.fim) {
      const venceu = s.fim === cfg.lado;
      return `<b class="${CLASSE[s.fim]}">${venceu ? 'Você venceu!' : 'Você perdeu.'}</b> ${s.motivo}${aviso()}`;
    }
    const minha = s.vez === cfg.lado;
    const txt = minha
      ? `Sua vez (<b class="${CLASSE[cfg.lado]}">${NOMES[cfg.lado]}</b>).`
      : `<b class="${CLASSE[s.vez]}">${NOMES[s.vez]}</b> está pensando…`;
    return txt + aviso();
  }

  function tabuleiro() {
    const alvos = sel !== null ? T.destinos(s.b, sel) : [];
    const u = s.ultimo;
    let html = '';
    for (let i = 0; i < T.N * T.N; i++) {
      const cls = ['casa'];
      if (i === T.TRONO) cls.push('trono');
      if (T.ehQuina(i)) cls.push('quina');
      if (u && (i === u.de || i === u.para)) cls.push('ultimo');
      if (i === sel) cls.push('sel');
      if (alvos.includes(i)) cls.push('alvo');
      if (u && u.cap.includes(i)) cls.push('capturada');
      const p = s.b[i];
      const peca = p ? `<span class="peca ${PECA[p]}">${p === T.REI ? '♔' : ''}</span>` : '';
      html += `<button class="${cls.join(' ')}" data-i="${i}" aria-label="${casaNome(i)}">${peca}</button>`;
    }
    return `<div class="tabuleiro">${html}</div>`;
  }

  function botao(cmd, arg, rotulo, ativo) {
    return `<button class="pequeno${ativo ? ' ativo' : ''}" data-cmd="${cmd}" data-arg="${arg}">${rotulo}</button>`;
  }

  function opcoes() {
    const lados = botao('lado', 'def', 'Jogar com o Rei', cfg.lado === 'def') + botao('lado', 'ata', 'Jogar com a Loucura', cfg.lado === 'ata');
    const niveis = Object.entries(IA.niveis).map(([id, nv]) => botao('nivel', id, nv.nome, cfg.nivel === id)).join('');
    return `<section>
      <div class="grupo">${lados}</div>
      <div class="grupo">${niveis}</div>
      <div class="opcoes">
        <button data-cmd="nova">Nova partida</button>
        <button data-cmd="desfazer" ${desfazer.length && !pensando ? '' : 'disabled'}>Desfazer</button>
      </div>
      <div class="placar">Placar: ${cfg.placar.vitorias} vitória(s), ${cfg.placar.derrotas} derrota(s). Trocar de lado começa uma nova partida.</div>
    </section>`;
  }

  function regras() {
    return `<section><details><summary>Regras</summary><ul>
      <li><b>Objetivo.</b> O Rei (♔) vence ao chegar numa das quatro quinas. A Loucura vence ao capturar o Rei.</li>
      <li><b>Movimento.</b> Todas as peças andam como a torre do xadrez: quantas casas quiser, em linha reta, sem pular. A Loucura joga primeiro.</li>
      <li><b>Casas restritas.</b> Só o Rei pode parar no trono (centro) e nas quinas. As outras peças podem atravessar o trono vazio.</li>
      <li><b>Captura.</b> Prenda uma peça inimiga entre duas suas, na mesma linha ou coluna. Só quem se move captura: entrar entre duas inimigas é seguro.</li>
      <li><b>Casas hostis.</b> As quinas e o trono vazio contam como uma peça inimiga para fechar o sanduíche.</li>
      <li><b>O Rei é armado.</b> Ele ajuda os defensores a capturar.</li>
      <li><b>Capturar o Rei.</b> Longe do trono, basta o sanduíche. No trono, são precisos 4 atacantes em volta; ao lado dele, 3 atacantes e o trono.</li>
      <li><b>Raichi e tuichi.</b> Raichi: o Rei tem um caminho livre até uma quina (bloqueie!). Tuichi: dois caminhos ao mesmo tempo; não dá para bloquear.</li>
      <li><b>Fim.</b> Quem não tiver lance perde. Repetir a mesma posição pela terceira vez é derrota do Rei.</li>
    </ul></details></section>`;
  }

  function desenhar() {
    if (s.fim && !contado) {
      contado = true;
      cfg.placar[s.fim === cfg.lado ? 'vitorias' : 'derrotas']++;
      salvar();
    }
    document.getElementById('app').innerHTML = `
      <div class="topo"><h1>Brandubh</h1><a href="../index.html">← Ascese</a></div>
      <div class="status">${status()}</div>
      ${tabuleiro()}
      ${opcoes()}
      ${regras()}`;
  }

  function vezDaIA() {
    if (s.fim || s.vez === cfg.lado) return;
    pensando = true;
    desenhar();
    // Dá tempo de a tela mostrar "pensando" antes da busca, que trava a página.
    setTimeout(() => {
      const lance = IA.escolher(s, cfg.nivel);
      if (lance) T.jogar(s, lance[0], lance[1]);
      pensando = false;
      desenhar();
    }, 250);
  }

  function tocarCasa(i) {
    if (s.fim || pensando || s.vez !== cfg.lado) return;
    if (T.lado(s.b[i]) === cfg.lado) {
      sel = sel === i ? null : i;
    } else if (sel !== null && T.destinos(s.b, sel).includes(i)) {
      desfazer.push(T.clonar(s));
      T.jogar(s, sel, i);
      sel = null;
      desenhar();
      vezDaIA();
      return;
    } else {
      sel = null;
    }
    desenhar();
  }

  const cmds = {
    nova: novaPartida,
    lado: (a) => { cfg.lado = a; salvar(); novaPartida(); },
    nivel: (a) => { cfg.nivel = a; salvar(); desenhar(); },
    desfazer: () => {
      if (!desfazer.length || pensando) return;
      s = desfazer.pop();
      sel = null;
      contado = false;
      desenhar();
    },
  };

  document.addEventListener('click', (e) => {
    const casa = e.target.closest('[data-i]');
    if (casa) return tocarCasa(+casa.dataset.i);
    const b = e.target.closest('[data-cmd]');
    if (b && cmds[b.dataset.cmd]) cmds[b.dataset.cmd](b.dataset.arg);
  });

  novaPartida();
})();
