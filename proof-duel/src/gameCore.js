import { DECKS, HARD_COUNTER, getMainDeck, getTheoremDeck } from "./gameData.js";
import { getTheoremGuide } from "./theoremGuides.js";

export const SIDE_LABEL = { player: "You", cpu: "CPU" };

export const PHASES = ["draw", "main", "counter", "resolution"];

export const ATTACK_TYPES = new Set(["Counterexample", "Generalization", "Pathology"]);
export const ATTEMPT_TYPES = new Set(["Lemma", "Proposition", "Theorem"]);
export const SUPPORT_TYPES = new Set(["Definition", "Example", "Technique", "Meta/Foundation"]);

const DEFENSE_OPTIONS = {
  Topology: ["Metric Space", "Hausdorff", "Separation Argument", "Compactness Extraction"],
  "Real Analysis": ["Uniform Convergence", "Completeness", "Epsilon-Delta Attack", "Dominated Estimate"],
  "Abstract Algebra": ["Homomorphism", "Quotient Construction", "Diagram Chase", "Exactness Lemma"],
  "Linear Algebra": ["Basis", "Linear Map", "Matrix Reduction", "Orthogonalization"],
  "Number Theory": ["Modular Reduction", "Coprime", "Bezout Lemma", "Sieve Argument"],
  Probability: ["Expectation", "Independence", "Concentration Estimate", "Conditional Expectation"],
  "Logic & Foundations": ["Consistency", "Model Construction", "Compactness Argument", "Metatheory Layer"],
};

export const CARD_LIMITS = {
  initialMain: 5,
  initialTheorems: 2,
  theoremHandTarget: 2,
  cpuActionLimit: 4,
  pendingSlots: 2,
};

const THEOREM_LORE = {
  "Tychonoff Theorem": {
    history: "Named for Andrey Tychonoff, this theorem is one of the classic places where topology visibly meets set-theoretic choice.",
    education: "It teaches that compactness behaves well under arbitrary products, but the infinite case needs stronger foundational machinery than finite intuition suggests.",
  },
  "Brouwer Fixed Point Theorem": {
    history: "L. E. J. Brouwer proved early fixed-point results in the 1910s, helping shape modern algebraic topology.",
    education: "The theorem says a continuous self-map of a disk cannot move every point away from itself; compactness and dimension force a fixed witness.",
  },
  "Urysohn Lemma": {
    history: "Pavel Urysohn's lemma became a central tool in point-set topology and separation theory.",
    education: "It explains how normal spaces allow continuous functions to separate closed sets, turning topology into function-building power.",
  },
  "Jordan Curve Theorem": {
    history: "Camille Jordan stated the theorem in the 1880s; fully rigorous proofs helped drive careful development of topology.",
    education: "A simple closed curve separates the plane into an inside and outside, a visually obvious fact that is surprisingly subtle to prove.",
  },
  "Compact Hausdorff Implies Normal": {
    history: "This result is a standard milestone in point-set topology, tying compactness to strong separation behavior.",
    education: "Compactness lets local Hausdorff separations be promoted through finite subcovers, producing normality.",
  },
  "Arzela-Ascoli Theorem": {
    history: "The theorem grew from work of Cesare Arzela and Giulio Ascoli on compactness of function families.",
    education: "It replaces pointwise chaos with equicontinuity and boundedness, giving compactness in spaces of functions.",
  },
  "Stone-Weierstrass Theorem": {
    history: "Marshall Stone generalized Weierstrass approximation, linking analysis, topology, and algebra.",
    education: "The theorem shows that suitable algebras of simple functions can uniformly approximate broad classes of continuous functions.",
  },
  "Hahn-Banach Theorem": {
    history: "Hans Hahn and Stefan Banach developed this extension principle in the rise of functional analysis.",
    education: "It lets linear functionals extend without increasing norm, making dual spaces powerful tools.",
  },
  "Dominated Convergence Theorem": {
    history: "A core result of Lebesgue integration, it formalizes when limits and integrals may be interchanged.",
    education: "A dominating integrable function gives enough control to pass limits through integrals safely.",
  },
  "Open Mapping Theorem": {
    history: "This is one of the foundational Banach-space theorems of functional analysis.",
    education: "Completeness is the hidden engine: surjective bounded linear maps between Banach spaces send open sets to open sets.",
  },
  "Sylow Theorems": {
    history: "Ludwig Sylow published these group-structure theorems in 1872.",
    education: "They reveal how prime-power subgroups sit inside finite groups, turning divisibility into structural information.",
  },
  "Chinese Remainder Theorem": {
    history: "Versions appeared in ancient Chinese mathematics and later became a standard algebraic decomposition theorem.",
    education: "Compatible modular constraints can be solved simultaneously when the moduli are suitably independent.",
  },
  "Structure Theorem for Modules": {
    history: "This theorem extends finite abelian group classification into module theory over principal ideal domains.",
    education: "It shows that good ring hypotheses let complicated modules decompose into understandable building blocks.",
  },
  "Cayley's Theorem": {
    history: "Arthur Cayley showed in the 1850s that every group can be represented by permutations.",
    education: "Abstract symmetry can always be realized concretely as actions on a set.",
  },
  "Isomorphism Theorems": {
    history: "These theorems became part of the standard language of modern algebra as quotient structures were formalized.",
    education: "They explain how kernels, images, and quotients describe the same structure from different angles.",
  },
  "Spectral Theorem": {
    history: "Spectral theory grew from work on quadratic forms, matrices, and later Hilbert spaces.",
    education: "Symmetry or self-adjointness gives a basis of well-behaved directions, turning operators into diagonal data.",
  },
  "Singular Value Decomposition": {
    history: "SVD emerged from 19th and 20th century matrix analysis and is now central in numerical linear algebra.",
    education: "Every matrix can be understood through orthogonal directions and nonnegative stretch factors.",
  },
  "Jordan Canonical Form": {
    history: "Named after Camille Jordan, this form organizes linear maps that are not fully diagonalizable.",
    education: "It records both eigenvalues and the obstruction to having enough eigenvectors.",
  },
  "Cayley-Hamilton": {
    history: "Arthur Cayley and William Rowan Hamilton independently developed the principle for matrices and linear transformations.",
    education: "A matrix satisfies its own characteristic polynomial, letting polynomial identities control linear maps.",
  },
  "Rank-Nullity Theorem": {
    history: "Rank-nullity is a basic dimension theorem in linear algebra and appears in many equivalent forms.",
    education: "For a linear map, dimensions split between what collapses into the kernel and what survives in the image.",
  },
};

export function chooseCpuDeck(playerDeck) {
  return HARD_COUNTER[playerDeck] || DECKS.find((deck) => deck !== playerDeck);
}

function hashSeed(seed) {
  const text = String(seed ?? "proof-duel");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

export function createSeededRandomState(seed = "proof-duel") {
  return { seed: String(seed), state: hashSeed(seed), calls: 0 };
}

export function nextSeededRandom(rngState) {
  rngState.state = (Math.imul(rngState.state, 1664525) + 1013904223) >>> 0;
  rngState.calls += 1;
  return rngState.state / 4294967296;
}

function makeRandomSource(options = {}) {
  if (options.rngState) return () => nextSeededRandom(options.rngState);
  if (options.seed !== undefined) {
    const rngState = createSeededRandomState(options.seed);
    return Object.assign(() => nextSeededRandom(rngState), { rngState });
  }
  if (options.rng) return options.rng;
  return Math.random;
}

function gameRandom(game) {
  return game.rngState ? nextSeededRandom(game.rngState) : Math.random();
}

export function shuffle(items, rng = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function cloneGame(game) {
  return JSON.parse(JSON.stringify(game));
}

function makeInstance(card, owner, rng = Math.random) {
  return {
    ...card,
    uid: `${owner}-${card.id}-${rng().toString(36).slice(2, 8)}`,
    owner,
    addedRequirements: [],
    status: "hand",
    turnsDelayed: 0,
  };
}

function createSide(deck, owner, rng = Math.random, bonusCards = []) {
  const mainCards = [
    ...getMainDeck(deck),
    ...bonusCards.filter((card) => card.type !== "Theorem"),
  ];
  const theoremCards = [
    ...getTheoremDeck(deck),
    ...bonusCards.filter((card) => card.type === "Theorem"),
  ];
  return {
    owner,
    deck,
    mainDeck: shuffle(mainCards.map((card) => makeInstance(card, owner, rng)), rng),
    theoremDeck: shuffle(theoremCards.map((card) => makeInstance(card, owner, rng)), rng),
    hand: [],
    played: [],
    pending: [],
    proven: [],
    discard: [],
    facts: [],
    shields: 0,
    provenTheorems: 0,
    lastDraws: [],
    playsThisTurn: {},
  };
}

function pushLog(game, message) {
  game.log.unshift(message);
  game.log = game.log.slice(0, 8);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function addFacts(side, card) {
  side.facts = unique([...side.facts, card.name, ...(card.produces || [])]);
}

export function resetTurnLimits(side) {
  side.playsThisTurn = {};
}

function markPlayedType(side, card) {
  side.playsThisTurn = { ...(side.playsThisTurn || {}), [card.type]: true };
}

function phaseAllowsCard(game, sideName, card) {
  if (sideName === "player") {
    if (game.current !== "player") return false;
    if (ATTACK_TYPES.has(card.type)) return game.phase === "counter";
    return game.phase === "main";
  }

  if (game.current !== "cpu") return false;
  if (ATTACK_TYPES.has(card.type)) return game.phase === "cpu-counter";
  return game.phase === "cpu";
}

function removeFromHand(side, cardUid) {
  const index = side.hand.findIndex((card) => card.uid === cardUid);
  if (index === -1) return null;
  const [card] = side.hand.splice(index, 1);
  return card;
}

export function drawFromPile(side, pileName, count = 1) {
  const drawn = [];
  for (let index = 0; index < count; index += 1) {
    if (!side[pileName].length) break;
    const card = side[pileName].shift();
    card.status = "hand";
    side.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

export function drawForTurnSide(side) {
  side.lastDraws = [];
  const mainDrawn = drawFromPile(side, "mainDeck", 1);
  const theoremDrawn = refillTheoremHand(side);
  side.lastDraws = [
    ...mainDrawn.map((card) => ({ uid: card.uid, name: card.name, type: card.type, pile: "main" })),
    ...theoremDrawn.map((card) => ({ uid: card.uid, name: card.name, type: card.type, pile: "theorem" })),
  ];
  const drawn = [...mainDrawn, ...theoremDrawn];
  return drawn;
}

export function refillTheoremHand(side) {
  const drawn = [];
  while (side.hand.filter((card) => card.type === "Theorem").length < CARD_LIMITS.theoremHandTarget) {
    const nextCards = drawFromPile(side, "theoremDeck", 1);
    if (!nextCards.length) break;
    drawn.push(...nextCards);
  }
  return drawn;
}

function initialDraw(side) {
  drawFromPile(side, "mainDeck", CARD_LIMITS.initialMain);
  drawFromPile(side, "theoremDeck", CARD_LIMITS.initialTheorems);
}

export function createGame(playerDeck, starter = "player", options = {}) {
  const rng = makeRandomSource(options);
  const cpuDeck = options.cpuDeck || chooseCpuDeck(playerDeck);
  const player = createSide(playerDeck, "player", rng, options.playerBonusCards || []);
  const cpu = createSide(cpuDeck, "cpu", rng, options.cpuBonusCards || []);
  initialDraw(player);
  initialDraw(cpu);

  return {
    id: rng().toString(36).slice(2),
    playerDeck,
    cpuDeck,
    current: starter,
    phase: starter === "player" ? "draw" : "cpu",
    turn: 1,
    winner: null,
    player,
    cpu,
    rngState: rng.rngState ? { ...rng.rngState } : options.rngState ? { ...options.rngState } : null,
    log: [
      `${starter === "player" ? "You start" : "CPU starts"} after rock-paper-scissors.`,
      `CPU counters with ${cpuDeck}. First to prove 3 theorems wins.`,
    ],
  };
}

export function effectiveRequirements(card) {
  return unique([...(card.requirements || []), ...(card.addedRequirements || [])]);
}

export function missingRequirements(side, card) {
  const facts = new Set(side.facts);
  return effectiveRequirements(card).filter((requirement) => !facts.has(requirement));
}

export function canResolve(side, card) {
  return missingRequirements(side, card).length === 0;
}

export function canPlayCard(game, sideName, card) {
  const side = game[sideName];
  const opponent = game[sideName === "player" ? "cpu" : "player"];

  if (!phaseAllowsCard(game, sideName, card)) return false;
  if (side.playsThisTurn?.[card.type]) return false;

  if (ATTACK_TYPES.has(card.type)) {
    return opponent.pending.length > 0;
  }

  if (ATTEMPT_TYPES.has(card.type)) {
    return side.pending.length < CARD_LIMITS.pendingSlots;
  }

  return missingRequirements(side, card).length === 0;
}

function blockedReason(game, sideName, card) {
  const side = game[sideName];
  const opponent = game[sideName === "player" ? "cpu" : "player"];
  if (!phaseAllowsCard(game, sideName, card)) {
    return ATTACK_TYPES.has(card.type)
      ? `${card.name} can only be played during Counter Phase.`
      : `${card.name} can only be played during Main Phase.`;
  }
  if (side.playsThisTurn?.[card.type]) return `${SIDE_LABEL[sideName]} already played a ${card.type} this turn.`;
  const missing = missingRequirements(side, card);
  if (missing.length) return `${card.name} cannot be played yet. Missing ${missing.join(", ")}.`;
  if (ATTACK_TYPES.has(card.type) && !opponent.pending.length) return `${card.name} needs an opposing active proof.`;
  if (ATTEMPT_TYPES.has(card.type) && side.pending.length >= CARD_LIMITS.pendingSlots) return `${card.name} needs an open proof slot.`;
  return `${card.name} cannot be played right now.`;
}

function addSupportCard(game, sideName, card) {
  const side = game[sideName];
  card.status = card.type === "Example" ? "protected" : "active";
  side.played.push(card);
  addFacts(side, card);
  if (card.type === "Example") {
    side.shields += 1;
    pushLog(game, `${SIDE_LABEL[sideName]} played ${card.name}; one example shield is ready.`);
  } else {
    pushLog(game, `${SIDE_LABEL[sideName]} established ${card.name}.`);
  }
}

function addAttemptCard(game, sideName, card) {
  const side = game[sideName];
  card.status = "pending";
  side.pending.push(card);
  if (card.type === "Theorem") {
    const drawn = refillTheoremHand(side);
    side.lastDraws = drawn.map((drawnCard) => ({ uid: drawnCard.uid, name: drawnCard.name, type: drawnCard.type, pile: "theorem" }));
    if (drawn.length) {
      pushLog(game, `${SIDE_LABEL[sideName]} refilled the theorem hand with ${drawn.map((drawnCard) => drawnCard.name).join(", ")}.`);
    }
  }
  const missing = missingRequirements(side, card);
  if (missing.length) {
    pushLog(game, `${SIDE_LABEL[sideName]} attempted ${card.name}; missing ${missing.join(", ")}.`);
  } else {
    pushLog(game, `${SIDE_LABEL[sideName]} attempted ${card.name}; proof is ready to resolve.`);
  }
}

function explainProof(side, card, sideName) {
  const cards = [...side.played, ...side.proven, card];
  const steps = effectiveRequirements(card).map((requirement) => {
    const helper =
      cards.find((candidate) => candidate.uid !== card.uid && candidate.produces?.includes(requirement)) ||
      cards.find((candidate) => candidate.uid !== card.uid && candidate.name === requirement);
    return {
      requirement,
      helperName: helper?.name || requirement,
      helperType: helper?.type || "Proof State",
      helperProduces: helper?.produces || [requirement],
    };
  });
  const lore = THEOREM_LORE[card.name] || {
    history: `${card.name} is a signature result in ${card.deck}, tying several earlier proof ingredients into one reusable theorem.`,
    education: "The proof matters because it turns local hypotheses into a permanent fact that can feed later theorem chains.",
  };

  return {
    owner: sideName,
    theorem: {
      name: card.name,
      deck: card.deck,
      produces: card.produces || [],
      flavorText: card.flavorText,
    },
    steps,
    history: lore.history,
    education: lore.education,
    guide: getTheoremGuide(card.name),
  };
}

function attackStrength(card, targetDeck) {
  return card.targetDeckStrength?.[targetDeck] || "soft";
}

function chooseAttackTarget(opponent) {
  if (!opponent.pending.length) return null;
  return (
    opponent.pending.find((card) => card.type === "Theorem") ||
    opponent.pending.find((card) => card.type === "Proposition") ||
    opponent.pending[0]
  );
}

function chooseDefenseRequirement(target, defender) {
  const options = DEFENSE_OPTIONS[target.deck] || [];
  const existing = new Set([...effectiveRequirements(target), ...defender.facts]);
  return options.find((option) => !existing.has(option)) || options[0] || "Technique Defense";
}

function addRequirement(target, requirement) {
  target.addedRequirements = unique([...(target.addedRequirements || []), requirement]);
  target.turnsDelayed = (target.turnsDelayed || 0) + 1;
  target.status = "attacked";
}

function resolveAttack(game, sideName, card) {
  const side = game[sideName];
  const opponentName = sideName === "player" ? "cpu" : "player";
  const opponent = game[opponentName];
  const target = chooseAttackTarget(opponent);

  card.status = "spent";
  side.played.push(card);

  if (!target) {
    pushLog(game, `${SIDE_LABEL[sideName]} played ${card.name}, but found no active proof to attack.`);
    return;
  }

  const strength = attackStrength(card, opponent.deck);
  const blocked = opponent.shields > 0 && card.type !== "Generalization";
  if (blocked) {
    opponent.shields -= 1;
    card.status = "blocked";
    pushLog(game, `${SIDE_LABEL[opponentName]}'s example shield blocked ${card.name}.`);
    return;
  }

  const hard = strength === "hard";
  const destructiveChance = card.type === "Counterexample" ? (hard ? 0.58 : 0.12) : card.type === "Pathology" ? (hard ? 0.42 : 0.05) : 0;
  if (gameRandom(game) < destructiveChance) {
    opponent.pending = opponent.pending.filter((candidate) => candidate.uid !== target.uid);
    target.status = "destroyed";
    opponent.discard.push(target);
    pushLog(game, `${card.name} destroyed ${SIDE_LABEL[opponentName]}'s ${target.name}.`);
    return;
  }

  const requirement = chooseDefenseRequirement(target, opponent);
  addRequirement(target, requirement);
  if (hard && card.type !== "Generalization") {
    const secondRequirement = chooseDefenseRequirement(target, opponent);
    if (secondRequirement !== requirement) addRequirement(target, secondRequirement);
  }
  pushLog(game, `${card.name} delayed ${target.name}; added ${requirement}.`);
}

export function playCard(game, sideName, cardUid) {
  const next = cloneGame(game);
  const side = next[sideName];
  const card = removeFromHand(side, cardUid);
  if (!card) return game;

  if (!canPlayCard(next, sideName, card)) {
    side.hand.push(card);
    pushLog(next, blockedReason(next, sideName, card));
    return next;
  }

  if (SUPPORT_TYPES.has(card.type)) {
    addSupportCard(next, sideName, card);
  } else if (ATTEMPT_TYPES.has(card.type)) {
    addAttemptCard(next, sideName, card);
  } else if (ATTACK_TYPES.has(card.type)) {
    resolveAttack(next, sideName, card);
  }
  markPlayedType(next[sideName], card);

  return checkWinner(next);
}

export function drawHumanTurn(game) {
  if (game.current !== "player" || game.phase !== "draw") return game;
  const next = cloneGame(game);
  resetTurnLimits(next.player);
  const drawn = drawForTurnSide(next.player);
  next.phase = "main";
  pushLog(next, drawn.length ? `Draw phase: you drew ${drawn.map((card) => card.name).join(", ")}.` : "Draw phase: no cards left to draw.");
  return next;
}

export function advanceToCounterPhase(game) {
  if (game.current !== "player" || game.phase !== "main") return game;
  const next = cloneGame(game);
  next.phase = "counter";
  pushLog(next, "Counter Phase: play one counterexample, pathology, or generalization if you have a target.");
  return next;
}

export function resolveSide(game, sideName) {
  const side = game[sideName];
  const stillPending = [];
  side.pending.forEach((card) => {
    if (canResolve(side, card)) {
      card.status = "proven";
      side.proven.push(card);
      addFacts(side, card);
      if (card.type === "Theorem") {
        side.provenTheorems += 1;
        game.lastProof = explainProof(side, card, sideName);
      }
      pushLog(game, `${SIDE_LABEL[sideName]} proved ${card.name}.`);
    } else {
      card.status = card.status === "attacked" ? "attacked" : "delayed";
      stillPending.push(card);
      const missing = missingRequirements(side, card);
      pushLog(game, `${card.name} remains unresolved; missing ${missing.slice(0, 3).join(", ")}.`);
    }
  });
  side.pending = stillPending;
}

export function endHumanTurn(game) {
  if (game.current !== "player") return game;
  const next = cloneGame(game);
  next.phase = "resolution";
  resolveSide(next, "player");
  checkWinner(next);
  if (!next.winner) {
    next.current = "cpu";
    next.phase = "cpu";
  }
  return next;
}

function helpfulCardForTarget(side, target) {
  if (!target) return null;
  const missing = new Set(missingRequirements(side, target));
  return side.hand.find((card) => SUPPORT_TYPES.has(card.type) && card.produces?.some((fact) => missing.has(fact)));
}

function closestTarget(side) {
  const theoremCandidates = [...side.pending, ...side.hand.filter((card) => card.type === "Theorem")];
  const propositionCandidates = side.hand.filter((card) => card.type === "Proposition" || card.type === "Lemma");
  const candidates = [...theoremCandidates, ...propositionCandidates];
  if (!candidates.length) return null;
  return candidates
    .map((card) => ({ card, missing: missingRequirements(side, card).length, theoremBias: card.type === "Theorem" ? -1 : 0 }))
    .sort((left, right) => left.missing + left.theoremBias - (right.missing + right.theoremBias))[0].card;
}

function playableByType(game, sideName, types) {
  const side = game[sideName];
  return side.hand.find((card) => types.has(card.type) && canPlayCard(game, sideName, card));
}

function cpuAttackCard(game) {
  if (!game.player.pending.length) return null;
  const hard = game.cpu.hand.find(
    (card) => ATTACK_TYPES.has(card.type) && card.targetDeckStrength?.[game.player.deck] === "hard"
  );
  if (hard) return hard;
  return game.cpu.hand.find((card) => ATTACK_TYPES.has(card.type));
}

function cpuMainAction(game) {
  const cpu = game.cpu;

  const immediateTheorem = cpu.hand.find((card) => card.type === "Theorem" && canResolve(cpu, card) && canPlayCard(game, "cpu", card));
  if (immediateTheorem && cpu.pending.length < CARD_LIMITS.pendingSlots) return immediateTheorem;

  const immediateProposition = cpu.hand.find((card) => ATTEMPT_TYPES.has(card.type) && canResolve(cpu, card) && canPlayCard(game, "cpu", card));
  if (immediateProposition && cpu.pending.length < CARD_LIMITS.pendingSlots) return immediateProposition;

  const target = closestTarget(cpu);
  const helpful = helpfulCardForTarget(cpu, target);
  if (helpful && canPlayCard(game, "cpu", helpful)) return helpful;

  return playableByType(game, "cpu", SUPPORT_TYPES);
}

function cpuCounterAction(game) {
  const card = cpuAttackCard(game);
  return card && canPlayCard(game, "cpu", card) ? card : null;
}

export function runCpuTurn(game) {
  if (game.current !== "cpu" || game.winner) return game;
  let next = cloneGame(game);
  resetTurnLimits(next.cpu);
  next.phase = "cpu";
  const drawn = drawForTurnSide(next.cpu);
  pushLog(next, drawn.length ? `CPU draws ${drawn.length} card${drawn.length > 1 ? "s" : ""}.` : "CPU has no draw.");

  for (let action = 0; action < CARD_LIMITS.cpuActionLimit; action += 1) {
    const card = cpuMainAction(next);
    if (!card) break;
    next = playCard(next, "cpu", card.uid);
    if (next.winner) return next;
  }

  next.phase = "cpu-counter";
  for (let action = 0; action < 2; action += 1) {
    const card = cpuCounterAction(next);
    if (!card) break;
    next = playCard(next, "cpu", card.uid);
    if (next.winner) return next;
  }

  resolveSide(next, "cpu");
  next = checkWinner(next);
  if (!next.winner) {
    next.current = "player";
    next.phase = "draw";
    next.turn += 1;
    pushLog(next, "Your turn begins.");
  }
  return next;
}

export function checkWinner(game) {
  if (game.player.provenTheorems >= 3) game.winner = "player";
  if (game.cpu.provenTheorems >= 3) game.winner = "cpu";
  return game;
}

export function cardZoneCards(side) {
  return [...side.played, ...side.pending, ...side.proven, ...side.discard];
}

export function buildProofGraph(game) {
  const nodes = [];
  const edges = [];
  const addNode = (node) => {
    if (!nodes.some((candidate) => candidate.id === node.id)) nodes.push(node);
  };
  const layouts = {
    player: { missing: 52, support: 284, proof: 516 },
    cpu: { missing: 818, support: 1050, proof: 1282 },
  };
  const yStart = 174;
  const yStep = 88;
  const missingStep = 74;
  const columnFor = (card) => {
    if (card.type === "Theorem") return "proof";
    if (card.type === "Lemma" || card.type === "Proposition") return "support";
    if (card.type === "Counterexample" || card.type === "Pathology" || card.type === "Generalization") return "missing";
    return "missing";
  };

  ["player", "cpu"].forEach((sideName) => {
    const side = game[sideName];
    const cards = [...side.played, ...side.pending, ...side.proven];
    const layout = layouts[sideName];
    const columnCounts = { missing: 0, support: 0, proof: 0 };
    const missingCounts = new Map();

    cards.forEach((card, index) => {
      const column = columnFor(card);
      const columnIndex = columnCounts[column];
      columnCounts[column] += 1;
      addNode({
        id: card.uid,
        label: card.name,
        type: card.type,
        owner: sideName,
        status: card.status,
        x: layout[column],
        y: yStart + columnIndex * yStep,
      });
    });

    cards.forEach((card) => {
      effectiveRequirements(card).forEach((requirement, reqIndex) => {
        const source = cards.find((candidate) => candidate.uid !== card.uid && candidate.produces?.includes(requirement));
        if (source) {
          edges.push({ from: source.uid, to: card.uid, missing: false, label: requirement });
        } else {
          const missingId = `${sideName}-missing-${requirement.replace(/[^a-z0-9]/gi, "-")}`;
          if (!missingCounts.has(missingId)) missingCounts.set(missingId, missingCounts.size);
          const missingIndex = missingCounts.get(missingId);
          addNode({
            id: missingId,
            label: requirement,
            type: "Missing",
            owner: sideName,
            status: "missing",
            x: layout.missing,
            y: yStart + columnCounts.missing * yStep + missingIndex * missingStep + reqIndex * 4,
          });
          edges.push({ from: missingId, to: card.uid, missing: true, label: requirement });
        }
      });
    });
  });

  return { nodes, edges };
}
