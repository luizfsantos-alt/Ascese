// Tabelas do jogo. Valores escritos como no documento de design e convertidos
// para inteiros: Ascensão/Loucura em 1/30, Vontade em 1/3.
(function (g) {
  'use strict';

  const A = (x) => Math.round(x * 30);
  const V = (x) => Math.round(x * 3);

  function carta(nome, a, l, v, extra) {
    return Object.assign({ nome, a: A(a), l: A(l), v: V(v) }, extra || {});
  }

  const plantas = [
    carta('Cicuta', 0, 0.3, 0, { cat: 'negativa', desc: 'Veneno mortal, usada em execuções na Grécia antiga' }),
    carta('Beladona', 0, 0.3, 0, { cat: 'negativa', desc: 'Bagas tóxicas que causam delírio e alucinações' }),
    carta('Mamona', 0, 0.3, 0, { cat: 'negativa', desc: 'Semente com ricina, um dos venenos naturais mais potentes' }),
    carta('Mandioca-brava', 0, 0.1, 1, { cat: 'ambígua', desc: 'Alimento básico, mas tóxica se não for processada' }),
    carta('Dedaleira', 0.03, 0.1, 0.33, { cat: 'ambígua', desc: 'Fonte de remédio para o coração e também veneno' }),
    carta('Papoula-dormideira', 0, 0.1, 0.67, { cat: 'ambígua', desc: 'Origem de analgésicos potentes e de vício' }),
    carta('Tabaco', 0, 0.1, 0.33, { cat: 'ambígua', desc: 'Uso ritual e estimulante, mas causa dependência' }),
    carta('Noz-moscada', 0.03, 0.1, 0.67, { cat: 'ambígua', desc: 'Tempero comum que em excesso causa alucinação' }),
    carta('Camomila', 0.03, 0, 0.67, { cat: 'positiva', desc: 'Calmante suave, usada em chás' }),
    carta('Hortelã', 0.03, 0, 0.33, { cat: 'positiva', desc: 'Digestiva e refrescante' }),
    carta('Alecrim', 0.03, 0, 1, { cat: 'positiva', desc: 'Associada à memória e à clareza' }),
    carta('Gengibre', 0.03, 0, 0.67, { cat: 'positiva', desc: 'Combate enjoo e inflamação' }),
    carta('Babosa', 0.03, 0, 0.33, { cat: 'positiva', desc: 'Cicatrizante e hidratante' }),
    carta('Manjericão', 0.03, 0, 0.33, { cat: 'positiva', desc: 'Aromática, usada na cozinha e em infusões' }),
    carta('Lavanda', 0.03, 0, 1, { cat: 'positiva', desc: 'Relaxante, ajuda no sono' }),
  ];

  const pratos = [
    carta('Casu marzu', 0, 0.2, -0.67, { cat: 'negativo', desc: 'Queijo sardo com larvas vivas, ilegal em vários lugares' }),
    carta('Hákarl', 0, 0.2, -0.67, { cat: 'negativo', desc: 'Tubarão fermentado islandês, de cheiro e gosto repulsivos' }),
    carta('Surströmming', 0, 0.2, -0.67, { cat: 'negativo', desc: 'Arenque fermentado sueco, de cheiro extremo' }),
    carta('Balut', 0, 0.2, -0.67, { cat: 'negativo', desc: 'Ovo com embrião de pato quase formado' }),
    carta('Sannakji', 0, 1, -3.33, { cat: 'negativo', desc: 'Polvo servido vivo, que pode sufocar quem come' }),
    carta('Fugu', 0.07, 0.2, 6.67, { cat: 'ambíguo', desc: 'Baiacu japonês, raro e caro, mas mortal se mal preparado' }),
    carta('Maniçoba', 0.03, 0.1, 5.33, { cat: 'ambíguo', desc: 'Folha de mandioca cozida por dias; sem isso, tóxica' }),
    carta('Natto', 0.03, 0.1, 5.33, { cat: 'ambíguo', desc: 'Soja fermentada, nutritiva e de sabor difícil' }),
    carta('Roquefort', 0.03, 0.1, 5.33, { cat: 'ambíguo', desc: 'Queijo azul de mofo nobre, amado ou odiado' }),
    carta('Ovo centenário', 0.03, 0.1, 5.33, { cat: 'ambíguo', desc: 'Ovo curado por semanas, de aparência assustadora' }),
    carta('Canja', 0.13, 0, 16.67, { cat: 'positivo', desc: 'Caldo de galinha que reconforta' }),
    carta('Feijão com arroz', 0.03, 0, 9.33, { cat: 'positivo', desc: 'Base completa e nutritiva da mesa brasileira' }),
    carta('Sopa de legumes', 0.03, 0, 9.33, { cat: 'positivo', desc: 'Leve e cheia de nutrientes' }),
    carta('Mingau de aveia', 0.03, 0, 9.33, { cat: 'positivo', desc: 'Café da manhã simples que sustenta' }),
    carta('Pão caseiro', 0.03, 0, 9.33, { cat: 'positivo', desc: 'Comida de casa, simples e acolhedora' }),
  ];

  const peixes = [
    carta('Peixe-pedra', 0, 1.4, -10, { cat: 'degrau 1', desc: 'Camuflado no fundo, de veneno extremamente doloroso' }),
    carta('Peixe-leão', 0, 0.8, -5, { cat: 'degrau 2', desc: 'Belo, mas com espinhos venenosos' }),
    carta('Moreia', 0, 0.4, -1.67, { cat: 'degrau 3', desc: 'Morde com força e se esconde na toca' }),
    carta('Lambari', 0.03, 0.2, 2.67, { cat: 'degrau 4', desc: 'Pequeno e comum, mal serve de isca' }),
    carta('Sardinha', 0.03, 0.1, 6, { cat: 'degrau 5', desc: 'Abundante e simples' }),
    carta('Tilápia', 0.07, 0.1, 9.33, { cat: 'degrau 6', desc: 'Pesca fácil e comida garantida' }),
    carta('Truta', 0.07, 0, 13.33, { cat: 'degrau 7', desc: 'Água limpa e fria, carne delicada' }),
    carta('Salmão', 0.1, 0, 18.33, { cat: 'degrau 8', desc: 'Enfrenta a correnteza e volta à origem' }),
    carta('Dourado', 0.13, 0, 25, { cat: 'degrau 9', desc: 'Forte e esquivo, troféu dos pescadores' }),
    carta('Atum-azul', 0.23, 0, 40, { cat: 'degrau 10', desc: 'Gigante raro, de valor enorme' }),
  ];

  const mercado = [
    carta('Boneca de porcelana rachada', -0.13, 0.4, 10.33, { desc: 'Barata e perturbadora, olhar que acompanha' }),
    carta('Espelho de moldura antiga', 0.13, 0.5, 6.33, { desc: 'Mostra mais do que deveria' }),
    carta('Disco de vinil riscado', -0.1, -0.5, 9.33, { desc: 'A música pula, mas acalma' }),
    carta('Relógio parado', 0.17, 0.3, -3, { desc: 'Marca uma hora que nunca passa' }),
    carta('Livro sem capa', 0.2, 0.6, 5.33, { desc: 'Sem título, sem autor, cheio de anotações' }),
    carta('Cobertor de lã', -0.13, -0.6, 11.33, { desc: 'Quentinho, e só isso' }),
    carta('Caixa de ferramentas enferrujada', 0.1, -0.3, -2, { desc: 'Serve, mas exige trabalho' }),
    carta('Mala com cadeado', 0.23, 0.8, -4, { desc: 'Ninguém sabe o que tem dentro' }),
    carta('Xícara de chá lascada', -0.2, -0.4, 13.33, { desc: 'Chá de vó, um pouco de paz' }),
    carta('Violão com cordas faltando', 0.13, -0.5, -2, { desc: 'Dá para tocar, com esforço' }),
    carta('Vaso com planta morta', -0.27, 0.2, 16.67, { desc: 'Triste, mas cuidar dele faz bem' }),
    carta('Máscara de carnaval', -0.13, -0.5, 13.33, { desc: 'Quem usa esquece quem é, e se alivia' }),
  ];

  const explorar = [
    carta('Fracasso retumbante', 0, 1.2, -100, { peso: 10.5 }),
    carta('Fracasso leve', 0.07, 0.5, 10, { peso: 42.1 }),
    carta('Sucesso moderado', 0.17, 0.6, 46.67, { peso: 42.1 }),
    carta('Sucesso glorioso', 0.67, 0.2, 533.33, { peso: 5.3 }),
  ];

  // Itens. tipo: 'consumivel' (calmante/bálsamo), 'enxofre', 'transmutar', 'desafio'.
  const itens = {
    balsamo_leve_c: carta('Bálsamo leve (cozinha)', 0, -4, -3.33, { tipo: 'consumivel' }),
    calmante_leve: carta('Calmante leve', -0.5, -6, 0, { tipo: 'consumivel' }),
    balsamo_leve_p: carta('Bálsamo leve (pesca)', 0, -6, -6.67, { tipo: 'consumivel' }),
    calmante: carta('Calmante', -1, -8, 0, { tipo: 'consumivel' }),
    balsamo: carta('Bálsamo', 0, -10, -13.33, { tipo: 'consumivel' }),
    calmante_forte: carta('Calmante forte', -2, -14, 0, { tipo: 'consumivel' }),
    balsamo_forte: carta('Bálsamo forte', 0, -16, -26.67, { tipo: 'consumivel' }),
    enxofre: { nome: 'Enxofre', tipo: 'enxofre', desc: 'Queima a carta escolhida (não aplica efeitos). Não vale nos tiers III e IV.' },
    transmutar: { nome: 'Transmutar', tipo: 'transmutar', desc: 'Sorteia de novo a carta escolhida, reembaralha as silhuetas ou joga a moeda de novo.' },
    desafio: { nome: 'Desafio à Loucura', tipo: 'desafio', desc: 'Automático: quando a Loucura chega a 100, volta para 99.' },
  };

  // Ações do dia a dia. limiar e custo em Vontade (1/3).
  const acoes = [
    { id: 'plantar', nome: 'Plantar', limiar: V(0), custo: V(0), n: 2, distintas: false, cartas: plantas, itens: null },
    { id: 'cozinhar', nome: 'Cozinhar', limiar: V(40), custo: V(3.33), n: 1, cartas: pratos,
      itens: [{ key: 'balsamo_leve_c', peso: 100 }] },
    { id: 'pescar', nome: 'Pescar', limiar: V(130), custo: V(6.67), n: 1, cartas: peixes,
      itens: [{ key: 'calmante_leve', peso: 60 }, { key: 'balsamo_leve_p', peso: 40 }] },
    { id: 'mercado', nome: 'Mercado', limiar: V(300), custo: V(13.33), n: 3, distintas: true, cartas: mercado,
      itens: [{ key: 'calmante', peso: 45 }, { key: 'balsamo', peso: 40 }, { key: 'enxofre', peso: 10 }, { key: 'transmutar', peso: 5 }] },
    { id: 'explorar', nome: 'Explorar', limiar: V(600), custo: V(26.67), n: 1, ponderado: true, cartas: explorar, desafio: true,
      itens: [{ key: 'calmante_forte', peso: 35 }, { key: 'balsamo_forte', peso: 35 }, { key: 'enxofre', peso: 15 }, { key: 'transmutar', peso: 15 }] },
  ];

  const arcanos = [
    carta('O Sol', 0, 0, 0, { dec: 'ganha' }),
    carta('O Mundo', 0, 0, 0, { dec: 'ganha' }),
    carta('A Estrela', 0, 0, 0, { dec: 'ganha' }),
    carta('O Louco', 0, 0, 0, { dec: 'perde' }),
    carta('A Lua', 0, 0, 0, { dec: 'perde' }),
    carta('O Diabo', 0, 0, 0, { dec: 'perde' }),
    carta('A Torre', 0, 0, 0, { dec: 'perde' }),
    carta('A Temperança', 10, 0.83, 0),
    carta('O Julgamento', 10, 2.5, 0),
    carta('A Imperatriz', 8.33, 0.83, 0),
    carta('A Força', 8.33, 1.67, 0),
    carta('O Mago', 8.33, 2.5, 0),
    carta('A Justiça', 6.67, 1.67, 0),
    carta('O Hierofante', 6.67, 1.67, 0),
    carta('A Sacerdotisa', 6.67, 3.33, 0),
    carta('O Carro', 6.67, 2.5, 0),
    carta('A Roda da Fortuna', 6.67, 3.33, 0),
    carta('O Imperador', 5, 2.5, 0),
    carta('O Eremita', 5, 3.33, 0),
    carta('Os Enamorados', 5, 4.17, 0),
    carta('A Morte', 3.33, 5, 0),
    carta('O Enforcado', 3.33, 5, 0),
  ];

  const etapas = [
    carta('Conjunção', 0, 0, 0, { dec: 'ganha' }),
    carta('Coagulação', 0, 0, 0, { dec: 'ganha' }),
    carta('Calcinação', 0, 0, 0, { dec: 'perde' }),
    carta('Dissolução', 0, 0, 0, { dec: 'perde' }),
    carta('Destilação', 13.33, 2.5, 0),
    carta('Fermentação', 6.67, 6.67, 0),
    carta('Separação', 13.33, 5, 0),
  ];

  const tiers = {
    1: { nome: 'Tier I — Tarô', n: 3, distintas: true, cartas: arcanos },
    2: { nome: 'Tier II — Alquimia', n: 1, cartas: etapas },
    3: { nome: 'Tier III — Goétia' },
    4: { nome: 'Tier IV — Magia do Vazio' },
  };

  const demonios = [
    { nome: 'Buer', ganha: 85, perde: 15, silencio: 0 },
    { nome: 'Paimon', ganha: 35, perde: 35, silencio: 30 },
    { nome: 'Andras', ganha: 15, perde: 85, silencio: 0 },
  ];

  g.Dados = {
    acoes, itens, tiers, demonios,
    META: A(100),               // Ascensão/Loucura para fim de jogo
    VONTADE_RITUAL: V(1000),
    PERDA_RITUAL: A(80),        // carta decisiva de perda
    DESISTIR_LOUCURA: A(25),
    SILENCIO_PAIMON: { a: A(20), l: A(10) },
    CHANCE_ITEM: 0.02,
    CHANCE_DESAFIO: 0.01,
  };
})(typeof window !== 'undefined' ? window : globalThis);
