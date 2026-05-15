import { CARD_TYPES, DECKS, DECK_IDENTITY, HARD_COUNTER, TYPE_STYLE, getMainDeck, getTheoremDeck } from "./gameData.js";
import {
  advanceToCounterPhase,
  buildProofGraph,
  canPlayCard,
  cardZoneCards,
  createGame,
  drawHumanTurn,
  effectiveRequirements,
  endHumanTurn,
  missingRequirements,
  playCard,
  runCpuTurn,
} from "./gameCore.js";
import { getTheoremGuide } from "./theoremGuides.js";

const RPS_CHOICES = ["rock", "paper", "scissors"];

const EXPLAIN_SECTIONS = [
  {
    title: "Objective",
    text: "Prove three theorem cards before the CPU. Propositions and lemmas do not score by default, but they become reusable proof dependencies.",
  },
  {
    title: "Card Types",
    text: "Definitions establish facts. Examples are concrete mathematical objects that show a concept in action, add produced facts, and create shields. Lemmas and propositions build reusable chains. Theorems score. Techniques unlock methods. Counterexamples expose a false assumption or missing hypothesis in an enemy proof, while generalizations and pathologies make the proof harder to repair. Meta/Foundation cards escalate the logical setting.",
  },
  {
    title: "Turn Phases",
    text: "Draw one main-deck card, then refill your separate theorem deck until you hold two theorem cards. Main phase builds proofs; Counter Phase is for counterexamples, pathologies, and generalizations.",
  },
  {
    title: "Hard vs Soft Counters",
    text: "Some fields are natural rivals: Topology and Real Analysis, Abstract Algebra and Linear Algebra, Number Theory and Abstract Algebra, Probability and Real Analysis, Logic and Number Theory. Hard counters are more likely to destroy attempts; soft counters usually add requirements.",
  },
  {
    title: "Proof Resolution",
    text: "A pending proof resolves when every requirement appears in your proof state. Proven cards add their produced facts and stay available for later theorem chains.",
  },
  {
    title: "Protection",
    text: "Examples create shields. A shield blocks one compatible counterexample or pathology before it can destroy or delay a proof attempt.",
  },
];

const PROOF_GUIDE_STEPS = [
  {
    title: "1. Pick a theorem target",
    text: "Theorem cards are not quizzes. They are goals with requirements. Read the red missing-requirement ribbon and decide which facts your proof state must build.",
  },
  {
    title: "2. Build definitions first",
    text: "Definitions usually play for free and create stable facts. A theorem like Compact Hausdorff Implies Normal needs Compact and Hausdorff before it can resolve.",
  },
  {
    title: "3. Use examples as shields",
    text: "Examples teach the meaning of a concept and also protect your active proof from one counterexample or pathology.",
  },
  {
    title: "4. Prove lemmas and propositions",
    text: "Lemmas and propositions are stepping stones. They stay on the board and produce reusable facts that can feed later theorem chains.",
  },
  {
    title: "5. Respect counterexamples",
    text: "If an opponent counters your proof, the game is teaching a missing hypothesis. Repair the proof by adding the new requirement or by shielding the theorem.",
  },
  {
    title: "6. Read the proof reveal",
    text: "When a theorem resolves, the reveal modal explains which cards supplied each requirement and why the theorem matters historically.",
  },
];

const RELICS = [
  {
    id: "zorns-charm",
    name: "Zorn's Charm",
    effect: "Start with one shield and Choice Principle in your proof state.",
    facts: ["Choice Principle"],
    shields: 1,
  },
  {
    id: "hilberts-lantern",
    name: "Hilbert's Lantern",
    effect: "Start with one extra theorem insight and a proof-planning shield.",
    facts: ["Theorem Insight"],
    shields: 1,
  },
  {
    id: "noetherian-seal",
    name: "Noetherian Seal",
    effect: "Start with Chain Protection, helping long proof engines survive disruption.",
    facts: ["Chain Protection"],
    shields: 1,
  },
];

const CAMPAIGN_ENCOUNTERS = [
  { title: "Opening Duel", text: "Fight the rival field and draft one card reward." },
  { title: "Elite Pathology", text: "A stronger opponent begins with extra disruption." },
  { title: "Boss Theorem", text: "Prove your deck's signature theorem before the enemy proof engine stabilizes." },
];

const TUTORIAL_GOAL = "Compact Hausdorff Implies Normal";

const TUTORIAL_STEPS = [
  {
    title: "Draw your opening research",
    text: "Click Draw Phase. Your theorem deck stays separate, so theorem targets stay visible while main-deck cards build facts.",
  },
  {
    title: "Play a definition",
    text: "Play Compact. Definitions create proof-state facts that stay available for later proof attempts.",
  },
  {
    title: "Attempt the theorem",
    text: "Play Compact Hausdorff Implies Normal. It can be attempted before every requirement is ready, which reveals what the proof still needs.",
  },
  {
    title: "Read the missing hypothesis",
    text: "The active theorem needs Hausdorff. End the turn; in tutorial mode the CPU passes so you can repair the proof.",
  },
  {
    title: "Repair and resolve",
    text: "Play Hausdorff, then resolve. The proof reveal will explain both the card chain and the mathematical proof sketch.",
  },
];

function rpsWinner(human, cpu) {
  if (human === cpu) return "tie";
  if (
    (human === "rock" && cpu === "scissors") ||
    (human === "paper" && cpu === "rock") ||
    (human === "scissors" && cpu === "paper")
  ) {
    return "player";
  }
  return "cpu";
}

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stripMotionProps(props = {}) {
  const {
    initial,
    animate,
    transition,
    whileHover,
    whileTap,
    whileInView,
    layout,
    variants,
    exit,
    ...rest
  } = props;
  return rest;
}

function campaignRewardCards(deck) {
  const main = getMainDeck(deck);
  const preferred = ["Example", "Technique", "Proposition", "Lemma", "Meta/Foundation"];
  return preferred
    .map((type) => main.find((card) => card.type === type))
    .filter(Boolean)
    .slice(0, 3);
}

function campaignBossTheorem(deck) {
  const theorems = getTheoremDeck(deck);
  return theorems.find((card) => card.rarity === "legendary") || theorems[0];
}

function allDeckCards(deck) {
  return [...getMainDeck(deck), ...getTheoremDeck(deck)];
}

function groupCardsByType(cards) {
  return CARD_TYPES.map((type) => ({
    type,
    cards: cards.filter((card) => card.type === type),
  })).filter((group) => group.cards.length);
}

function findProducers(deck, fact) {
  return allDeckCards(deck)
    .filter((card) => card.name === fact || card.produces?.includes(fact))
    .slice(0, 4);
}

function moveNamedCardToHand(side, name) {
  for (const zoneName of ["hand", "mainDeck", "theoremDeck"]) {
    const zone = side[zoneName];
    const index = zone.findIndex((card) => card.name === name);
    if (index !== -1) {
      const [card] = zone.splice(index, 1);
      card.status = "hand";
      side.hand.push(card);
      return card;
    }
  }
  return null;
}

function prepareTutorialGame() {
  const game = createGame("Topology", "player", { cpuDeck: "Real Analysis", seed: "proof-duel-tutorial" });
  ["Compact", "Hausdorff", TUTORIAL_GOAL, "Compact Metric Space", "Separation Argument"].forEach((name) => moveNamedCardToHand(game.player, name));
  game.tutorial = true;
  game.log = [
    "Tutorial duel: learn how to build and repair a theorem proof.",
    "Goal theorem: Compact Hausdorff Implies Normal.",
    ...game.log,
  ].slice(0, 8);
  return game;
}

function currentTheoremTarget(game) {
  const player = game.player;
  return (
    player.pending.find((card) => card.type === "Theorem") ||
    player.hand.find((card) => card.type === "Theorem") ||
    player.proven.find((card) => card.type === "Theorem") ||
    getTheoremDeck(player.deck)[0]
  );
}

function tutorialStepIndex(game) {
  if (!game) return 0;
  if (game.player.proven.some((card) => card.name === TUTORIAL_GOAL)) return 4;
  if (game.player.facts.includes("Hausdorff")) return 4;
  if (game.player.pending.some((card) => card.name === TUTORIAL_GOAL)) return 3;
  if (game.player.facts.includes("Compact")) return 2;
  if (game.phase === "draw") return 0;
  return 1;
}

function buildEndRecap(game) {
  const target = currentTheoremTarget(game);
  const missing = target ? missingRequirements(game.player, target) : [];
  const counterLine = game.log.find((entry) => /destroyed|delayed|blocked|counter/i.test(entry));
  const deadCards = game.player.hand.filter((card) => missingRequirements(game.player, card).length > 0).slice(0, 3);
  return {
    title: game.winner === "player" ? "Why You Won" : "Why You Lost",
    lines:
      game.winner === "player"
        ? [
            `You reached three theorem proofs with ${game.player.facts.length} proof-state facts.`,
            target ? `${target.name} shows how definitions and support cards became reusable theorem fuel.` : "Your proof chains resolved before the CPU stabilized.",
            "Open the Research Notebook to review the theorem guides you unlocked.",
          ]
        : [
            target ? `Nearest theorem: ${target.name}.` : "No theorem target remained available.",
            missing.length ? `Missing requirements: ${missing.slice(0, 4).join(", ")}.` : "You had requirements ready, but needed to resolve faster.",
            counterLine ? `Key disruption: ${counterLine}` : "No single counter decided it; the CPU built its chain faster.",
            deadCards.length ? `Stuck cards: ${deadCards.map((card) => card.name).join(", ")}.` : "Your hand was not badly stuck.",
          ],
  };
}

export function createProofDuelApp({ React, motion }) {
  const h = React.createElement;
  const hasMotion = Boolean(motion?.div);
  const m = (tag, props, ...children) => {
    const Component = hasMotion && motion[tag] ? motion[tag] : tag;
    return h(Component, hasMotion ? props : stripMotionProps(props), ...children);
  };

  function Difficulty({ value = 0 }) {
    return h(
      "div",
      { className: "difficulty-pips", title: `Difficulty ${value}` },
      Array.from({ length: Math.max(1, Math.min(5, value || 1)) }, (_, index) =>
        h("span", { key: index, className: index < value ? "pip active" : "pip" })
      )
    );
  }

  function CardFace({ card, faceDown = false, compact = false, playable = false, missing = [], onClick, fanIndex = 0, total = 1, zone = "" }) {
    if (faceDown) {
      return h(
        "button",
        {
          className: cx("proof-card card-back", compact && "compact-card", zone),
          style: { "--fan-rot": `${(fanIndex - (total - 1) / 2) * 4}deg` },
          type: "button",
          title: "Face-down CPU card",
        },
        h("div", { className: "card-back-sigil" }, "∴"),
        h("div", { className: "card-back-title" }, "Proof Duel")
      );
    }

    const typeMeta = TYPE_STYLE[card.type] || TYPE_STYLE.Definition;
    const tone = typeMeta.tone;

    return h(
      "button",
      {
        className: cx(
          "proof-card",
          `tone-${tone}`,
          `rarity-${card.rarity}`,
          compact && "compact-card",
          playable && "playable-card",
          missing.length && "missing-card",
          zone
        ),
        style: {
          "--fan-rot": `${(fanIndex - (total - 1) / 2) * 5.4}deg`,
          "--fan-y": `${Math.abs(fanIndex - (total - 1) / 2) * 3}px`,
        },
        type: "button",
        onClick,
      },
      h("div", { className: "card-aurora" }),
      h("div", { className: "card-banner" }, h("span", null, card.type), h("span", { className: "symbol" }, typeMeta.symbol)),
      h("div", { className: "card-name" }, card.name),
      h("div", { className: "card-mid" }, h("div", { className: "math-icon" }, typeMeta.icon), h(Difficulty, { value: card.difficulty })),
      !compact &&
        h(
          "div",
          { className: "card-requirements" },
          h("span", null, "Req"),
          h("strong", null, effectiveRequirements(card).slice(0, 3).join(" + ") || "free")
        ),
      !compact &&
        h(
          "div",
          { className: "card-produces" },
          h("span", null, "Makes"),
          h("strong", null, (card.produces || []).slice(0, 2).join(", "))
        ),
      missing.length ? h("div", { className: "missing-ribbon" }, `Missing: ${missing.slice(0, 2).join(", ")}`) : null,
      h("div", { className: "rarity-ribbon" }, card.rarity)
    );
  }

  function StatPanel({ side, label }) {
    return h(
      "div",
      { className: "stat-panel" },
      h("div", { className: "stat-title" }, h("span", { className: "stat-label" }, label), h("strong", { className: "stat-deck" }, side.deck)),
      h(
        "div",
        { className: "stat-metrics" },
        h("span", null, h("em", null, "Thm"), h("strong", null, `${side.provenTheorems}/3`)),
        h("span", null, h("em", null, "Facts"), h("strong", null, side.facts.length)),
        h("span", null, h("em", null, "Shield"), h("strong", null, side.shields))
      )
    );
  }

  function FactChips({ side }) {
    const facts = side.facts.slice(-10);
    return h(
      "div",
      { className: "fact-chips" },
      facts.length ? facts.map((fact) => h("span", { key: fact }, fact)) : h("span", { className: "empty-chip" }, "no proof state yet")
    );
  }

  function FieldLane({ side, owner, onInspect }) {
    const visible = cardZoneCards(side).slice(-9);
    return h(
      "section",
      { className: cx("field-lane", owner === "player" ? "player-lane" : "cpu-lane") },
      h("div", { className: "lane-heading" }, h("span", null, owner === "player" ? "Your Proof Field" : "CPU Proof Field"), h("em", null, side.deck)),
      h(
        "div",
        { className: "field-grid" },
        visible.length
          ? visible.map((card) =>
              h(CardFace, {
                key: card.uid,
                card,
                compact: true,
                zone: cx("field-card", `status-${card.status}`),
                onClick: () => onInspect(card, owner, "field"),
              })
            )
          : h("div", { className: "empty-zone" }, "empty")
      ),
      h(FactChips, { side })
    );
  }

  function ActiveSlots({ game, onInspect }) {
    const slot = (card, sideName, index) =>
      card
        ? h(CardFace, {
            key: card.uid,
            card,
            compact: true,
            zone: cx("active-slot-card", `status-${card.status}`),
            onClick: () => onInspect(card, sideName, "pending"),
          })
        : h("div", { key: `${sideName}-${index}`, className: "active-slot empty" }, "open proof slot");

    return h(
      "section",
      { className: "active-theorems" },
      h("div", { className: "active-heading" }, "Active Proofs"),
      h(
        "div",
        { className: "active-columns" },
        h("div", { className: "active-column" }, h("span", null, "You"), [0, 1].map((index) => slot(game.player.pending[index], "player", index))),
        h("div", { className: "versus-mark" }, "⊢"),
        h("div", { className: "active-column" }, h("span", null, "CPU"), [0, 1].map((index) => slot(game.cpu.pending[index], "cpu", index)))
      )
    );
  }

  function Hand({ game, sideName, onInspect }) {
    const side = game[sideName];
    const isPlayer = sideName === "player";
    return h(
      "div",
      { className: cx("hand", isPlayer ? "player-hand" : "cpu-hand") },
      side.hand.map((card, index) =>
        isPlayer
          ? h(CardFace, {
              key: card.uid,
              card,
              fanIndex: index,
              total: side.hand.length,
              playable: game.current === "player" && (game.phase === "main" || game.phase === "counter") && canPlayCard(game, "player", card),
              missing: game.current === "player" && (game.phase === "main" || game.phase === "counter") ? missingRequirements(game.player, card) : [],
              zone: "hand-card",
              onClick: () => onInspect(card, "player", "hand"),
            })
          : h(CardFace, { key: card.uid, faceDown: true, compact: true, fanIndex: index, total: side.hand.length, zone: "hand-card cpu-back" })
      )
    );
  }

  function DeckPiles({ side, sideName }) {
    const lastDraws = side.lastDraws || [];
    const mainDrawing = lastDraws.some((draw) => draw.pile === "main");
    const theoremDrawing = lastDraws.some((draw) => draw.pile === "theorem");
    const latest = lastDraws[lastDraws.length - 1];
    const pile = (kind, label, count, drawing) =>
      h(
        "div",
        { className: cx("deck-stack", `${kind}-deck-stack`, drawing && "drawing") },
        h("div", { className: "deck-stack-shadow" }),
        h("div", { className: "deck-stack-sheet sheet-three" }),
        h("div", { className: "deck-stack-sheet sheet-two" }),
        h(
          "div",
          { className: "deck-stack-face" },
          h("span", { className: "deck-stack-icon" }, kind === "main" ? "□" : "♛"),
          h("span", { className: "deck-stack-label" }, label),
          h("strong", null, count)
        )
      );
    return h(
      "div",
      { className: cx("deck-piles", `${sideName}-decks`) },
      h("div", { className: "deck-stack-row" },
        pile("main", "Main", side.mainDeck.length, mainDrawing),
        pile("theorem", "Theorem", side.theoremDeck.length, theoremDrawing)
      ),
      latest
        ? h(
            "div",
            { className: "draw-spark" },
            h("span", null, latest.pile === "theorem" ? "Theorem draw" : "Main draw"),
            h("strong", null, latest.name)
          )
        : null
    );
  }

  function ProofGraph({ game, large = false, onOpen }) {
    const graph = React.useMemo(() => buildProofGraph(game), [game]);
    const graphWidth = 1520;
    const graphHeight = 860;
    const width = large ? graphWidth : 320;
    const height = large ? graphHeight : 190;
    const scaleX = width / graphWidth;
    const scaleY = height / graphHeight;
    const sx = (value) => value * scaleX;
    const sy = (value) => value * scaleY;
    const nodeById = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));

    return h(
      "button",
      {
        type: "button",
        className: cx("graph-panel", large && "large-graph"),
        onClick: large ? undefined : onOpen,
        onPointerDown: large ? undefined : onOpen,
        title: large ? "Proof graph" : "Open zoomed proof graph",
      },
      h("div", { className: "graph-title" }, large ? "Proof Dependency Graph" : "Proof Map"),
      h(
        "svg",
        { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": "Proof dependency graph" },
        h(
          "defs",
          null,
          h("marker", { id: large ? "arrowLarge" : "arrowMini", markerWidth: "8", markerHeight: "8", refX: "7", refY: "4", orient: "auto" },
            h("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#d7b961" })
          ),
          h("marker", { id: large ? "missingLarge" : "missingMini", markerWidth: "8", markerHeight: "8", refX: "7", refY: "4", orient: "auto" },
            h("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#ef4444" })
          )
        ),
        large
          ? h(
              "g",
              { className: "graph-swimlanes" },
              h("rect", { x: 24, y: 50, width: 710, height: 760, rx: 18, className: "graph-lane-player" }),
              h("rect", { x: 790, y: 50, width: 710, height: 760, rx: 18, className: "graph-lane-cpu" }),
              h("text", { x: 54, y: 88, className: "graph-lane-title" }, "YOUR PROOF CHAIN"),
              h("text", { x: 820, y: 88, className: "graph-lane-title" }, "CPU PROOF CHAIN"),
              h("text", { x: 54, y: 122, className: "graph-lane-subtitle" }, "Missing requirements feed from the left; completed dependencies glow gold."),
              h("text", { x: 820, y: 122, className: "graph-lane-subtitle" }, "Opponent dependencies and disruptions stay separated for readability."),
              [
                [52, 146, "Facts / Requirements"],
                [284, 146, "Lemmas / Propositions"],
                [516, 146, "Theorems"],
                [818, 146, "Facts / Requirements"],
                [1050, 146, "Lemmas / Propositions"],
                [1282, 146, "Theorems"],
              ].map(([x, y, label]) =>
                h(
                  "g",
                  { key: `${label}-${x}`, className: "graph-column-guide" },
                  h("line", { x1: x - 16, y1: 158, x2: x - 16, y2: 780 }),
                  h("text", { x, y }, label)
                )
              )
            )
          : null,
        !large
          ? h(
              "g",
              { className: "mini-swimlanes" },
              h("rect", { x: 8, y: 28, width: 145, height: 122, rx: 9, className: "graph-lane-player" }),
              h("rect", { x: 167, y: 28, width: 145, height: 122, rx: 9, className: "graph-lane-cpu" })
            )
          : null,
        graph.edges.map((edge, index) => {
          const from = nodeById[edge.from];
          const to = nodeById[edge.to];
          if (!from || !to) return null;
          const forward = from.x <= to.x;
          return h("line", {
            key: `${edge.from}-${edge.to}-${index}`,
            x1: large ? sx(from.x + (forward ? 220 : 0)) : sx(from.x) + (forward ? 18 : 0),
            y1: large ? sy(from.y + 27) : sy(from.y) + 4,
            x2: large ? sx(to.x + (forward ? 0 : 220)) : sx(to.x) + (forward ? 0 : 18),
            y2: large ? sy(to.y + 27) : sy(to.y) + 4,
            className: edge.missing ? "edge missing-edge" : "edge complete-edge",
            markerEnd: `url(#${edge.missing ? (large ? "missingLarge" : "missingMini") : large ? "arrowLarge" : "arrowMini"})`,
          });
        }),
        !large ? h("text", { className: "mini-lane-label", x: 8, y: 18 }, "YOU") : null,
        !large ? h("text", { className: "mini-lane-label", x: width - 54, y: 18 }, "CPU") : null,
        !graph.nodes.length ? h("text", { className: "graph-empty-text", x: width / 2, y: height / 2 }, "No proof nodes yet") : null,
        graph.nodes.map((node) =>
          h(
            "g",
            { key: node.id, transform: `translate(${sx(node.x)}, ${sy(node.y)})`, className: cx("graph-node", `graph-${node.status}`, `graph-${node.owner}`) },
            large ? h("rect", { width: 220, height: 54, rx: 9 }) : h("rect", { width: 18, height: 8, rx: 4 }),
            large ? h("text", { x: 12, y: 23, className: "graph-node-label" }, node.label.slice(0, 30)) : null,
            large ? h("text", { x: 12, y: 40, className: "graph-node-type" }, node.type === "Missing" ? "missing requirement" : node.type) : null
          )
        ),
        !large
          ? h(
              "g",
              { className: "mini-legend", transform: `translate(10 ${height - 20})` },
              h("circle", { cx: 0, cy: 0, r: 4, className: "legend-good" }),
              h("text", { x: 10, y: 4 }, "ready/proven"),
              h("circle", { cx: 104, cy: 0, r: 4, className: "legend-missing" }),
              h("text", { x: 114, y: 4 }, "missing")
            )
          : null
      )
    );
  }

  function ExplainModal({ onClose }) {
    return h(
      "div",
      { className: "modal-shell", role: "dialog", "aria-modal": "true" },
      h("div", { className: "modal-backdrop", onClick: onClose }),
      m(
        "div",
        { className: "explain-modal", initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22 } },
        h("div", { className: "modal-header" }, h("h2", null, "How Proof Duel Works"), h("button", { type: "button", onClick: onClose }, "×")),
        h(
          "div",
          { className: "explain-grid" },
          EXPLAIN_SECTIONS.map((section) =>
            h("article", { key: section.title }, h("h3", null, section.title), h("p", null, section.text))
          )
        )
      )
    );
  }

  function ProofGuideModal({ onClose }) {
    return h(
      "div",
      { className: "modal-shell", role: "dialog", "aria-modal": "true" },
      h("div", { className: "modal-backdrop", onClick: onClose }),
      m(
        "div",
        { className: "guide-modal", initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22 } },
        h("div", { className: "modal-header" }, h("h2", null, "Theorem Proof Guide"), h("button", { type: "button", onClick: onClose }, "x")),
        h(
          "div",
          { className: "guide-grid" },
          PROOF_GUIDE_STEPS.map((step) => h("article", { key: step.title }, h("h3", null, step.title), h("p", null, step.text)))
        ),
        h(
          "div",
          { className: "proof-example-strip" },
          h("strong", null, "Example chain"),
          h("span", null, "Definition Compact"),
          h("span", null, "Definition Hausdorff"),
          h("span", null, "Separation Argument"),
          h("span", null, "Theorem Compact Hausdorff Implies Normal")
        ),
        h(
          "div",
          { className: "theorem-guide-library" },
          h("h3", null, "Guides For Every Theorem"),
          DECKS.map((deck) =>
            h(
              "section",
              { key: deck },
              h("h4", null, deck),
              getTheoremDeck(deck).map((card) => {
                const guide = getTheoremGuide(card.name);
                return h(
                  "details",
                  { key: card.id },
                  h("summary", null, h("strong", null, card.name), h("span", null, card.requirements.join(" + ") || "free")),
                  h("p", null, guide.summary),
                  h("ol", null, guide.steps.map((step, index) => h("li", { key: `${card.id}-${index}` }, step)))
                );
              })
            )
          )
        )
      )
    );
  }

  function ContextualProofCoach({ game, tutorial, onGuide, onNotebook, onClose }) {
    const target = currentTheoremTarget(game);
    const liveTarget = game.player.pending.find((card) => card.uid === target?.uid) || game.player.hand.find((card) => card.uid === target?.uid) || target;
    const missing = liveTarget ? missingRequirements(game.player, liveTarget) : [];
    const requirements = liveTarget ? effectiveRequirements(liveTarget) : [];
    const guide = liveTarget ? getTheoremGuide(liveTarget.name) : null;
    const stepIndex = tutorial?.active ? tutorialStepIndex(game) : null;
    const tutorialStep = stepIndex !== null ? TUTORIAL_STEPS[stepIndex] : null;
    return h(
      "aside",
      { className: cx("proof-coach-panel", tutorial?.active && "tutorial-coach") },
      h("button", { type: "button", className: "coach-close", onClick: onClose, "aria-label": "Close theorem coach", title: "Close theorem coach" }, "x"),
      tutorialStep
        ? h(
            "section",
            { className: "tutorial-step-card" },
            h("span", null, `Tutorial ${stepIndex + 1}/${TUTORIAL_STEPS.length}`),
            h("h3", null, tutorialStep.title),
            h("p", null, tutorialStep.text)
          )
        : null,
      h(
        "section",
        null,
        h("div", { className: "coach-heading" }, h("span", null, "Theorem Coach"), h("strong", null, liveTarget?.name || "No theorem target")),
        liveTarget ? h("p", null, guide?.summary || liveTarget.description) : h("p", null, "Draw or draft a theorem card to get proof guidance."),
        liveTarget
          ? h(
              "div",
              { className: "coach-progress" },
              requirements.map((requirement) =>
                h("span", { key: requirement, className: game.player.facts.includes(requirement) ? "complete" : "missing" }, requirement)
              )
            )
          : null,
        missing.length
          ? h(
              "div",
              { className: "missing-help" },
              h("h4", null, "Missing Fact Help"),
              missing.slice(0, 3).map((fact) =>
                h(
                  "article",
                  { key: fact },
                  h("strong", null, fact),
                  h(
                    "p",
                    null,
                    findProducers(game.player.deck, fact).length
                      ? `Look for: ${findProducers(game.player.deck, fact).map((card) => `${card.name} (${card.type})`).join(", ")}.`
                      : "No direct producer is in this deck; use a lemma, reward, or repair card."
                  )
                )
              )
            )
          : liveTarget
            ? h("p", { className: "ready-note" }, "All listed requirements are satisfied. Resolve the proof to reveal the theorem lesson.")
            : null,
        guide
          ? h(
              "details",
              { className: "coach-guide-preview" },
              h("summary", null, "Show proof sketch"),
              h("ol", null, guide.steps.map((step, index) => h("li", { key: `${liveTarget.name}-${index}` }, step)))
            )
          : null,
        h("div", { className: "coach-actions" },
          h("button", { type: "button", className: "secondary-action", onClick: onGuide }, "All Guides"),
          h("button", { type: "button", className: "secondary-action", onClick: onNotebook }, "Notebook")
        )
      )
    );
  }

  function ResearchNotebookModal({ campaign, selectedDeck, onClose }) {
    const deck = campaign?.deck || selectedDeck;
    const rewards = campaign?.rewards || campaignRewardCards(deck);
    const boss = campaignBossTheorem(deck);
    const theorems = getTheoremDeck(deck);
    return h(
      "div",
      { className: "modal-shell", role: "dialog", "aria-modal": "true" },
      h("div", { className: "modal-backdrop", onClick: onClose }),
      m(
        "div",
        { className: "notebook-modal", initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.18 } },
        h("div", { className: "modal-header" }, h("h2", null, "Research Notebook"), h("button", { type: "button", onClick: onClose }, "x")),
        h(
          "div",
          { className: "notebook-grid" },
          h(
            "section",
            null,
            h("h3", null, "Current Field"),
            h("p", null, DECK_IDENTITY[deck].identity),
            h("h3", null, "Boss Theorem"),
            h("p", null, `${boss?.name || "No theorem"}: ${boss?.description || ""}`)
          ),
          h(
            "section",
            null,
            h("h3", null, "Unlocked Theorems"),
            h(
              "div",
              { className: "notebook-theorem-guides" },
              theorems.map((card) => {
                const guide = getTheoremGuide(card.name);
                return h(
                  "details",
                  { key: card.id },
                  h("summary", null, card.name),
                  h("p", null, `Requires: ${card.requirements.join(", ") || "free proof state"}.`),
                  h("ol", null, guide.steps.map((step, index) => h("li", { key: `${card.id}-${index}` }, step)))
                );
              })
            )
          ),
          h(
            "section",
            null,
            h("h3", null, "Drafted Rewards"),
            h("ul", null, rewards.length ? rewards.map((card) => h("li", { key: card.id }, `${card.name} (${card.type}) produces ${card.produces.slice(0, 2).join(", ")}.`)) : h("li", null, "No campaign rewards drafted yet."))
          ),
          h(
            "section",
            null,
            h("h3", null, "Study Notes"),
            h("ul", null,
              h("li", null, "The proof graph shows which facts feed theorem attempts."),
              h("li", null, "Missing red nodes are not failures; they are hypotheses your proof still needs."),
              h("li", null, "Counterexamples teach which assumptions were too optimistic.")
            )
          )
        )
      )
    );
  }

  function CampaignScreen({ selectedDeck, setSelectedDeck, campaign, setCampaign, onStart, onBack, onNotebook }) {
    const deck = campaign.deck || selectedDeck;
    const boss = campaignBossTheorem(deck);
    const rewards = campaignRewardCards(deck);
    const selectedRelic = campaign.relic || RELICS[0];
    const updateDeck = (deckName) => {
      setSelectedDeck(deckName);
      setCampaign((current) => ({ ...current, deck: deckName, boss: campaignBossTheorem(deckName), rewards: [] }));
    };
    const toggleReward = (card) => {
      setCampaign((current) => {
        const exists = current.rewards.some((reward) => reward.id === card.id);
        const nextRewards = exists ? current.rewards.filter((reward) => reward.id !== card.id) : [...current.rewards, card].slice(0, 2);
        return { ...current, deck, rewards: nextRewards };
      });
    };

    return h(
      "main",
      { className: "campaign-screen" },
      h("div", { className: "start-glow" }),
      m(
        "section",
        { className: "campaign-panel", initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28 } },
        h(
          "div",
          { className: "campaign-heading" },
          h("div", null, h("span", null, "Campaign Prototype"), h("h1", null, "Proof Expedition")),
          h("button", { type: "button", className: "secondary-action", onClick: onBack }, "Back")
        ),
        h(
          "div",
          { className: "campaign-layout" },
          h(
            "section",
            { className: "campaign-card" },
            h("h2", null, "Choose Field"),
            h(
              "div",
              { className: "compact-deck-list" },
              DECKS.map((deckName) =>
                h(
                  "button",
                  { key: deckName, type: "button", className: cx(deckName === deck && "selected"), onClick: () => updateDeck(deckName) },
                  h("span", null, DECK_IDENTITY[deckName].icon),
                  h("strong", null, deckName)
                )
              )
            )
          ),
          h(
            "section",
            { className: "campaign-card" },
            h("h2", null, "Relic"),
            h(
              "div",
              { className: "relic-grid" },
              RELICS.map((relic) =>
                h(
                  "button",
                  { key: relic.id, type: "button", className: cx(selectedRelic.id === relic.id && "selected"), onClick: () => setCampaign((current) => ({ ...current, relic })) },
                  h("strong", null, relic.name),
                  h("span", null, relic.effect)
                )
              )
            )
          ),
          h(
            "section",
            { className: "campaign-card boss-card" },
            h("h2", null, "Boss Theorem"),
            h("strong", null, boss?.name),
            h("p", null, boss?.description),
            h("em", null, `Requirements: ${boss?.requirements.join(" + ")}`)
          ),
          h(
            "section",
            { className: "campaign-card" },
            h("h2", null, "Card Rewards / Deckbuilding"),
            h("p", null, "Pick up to two rewards to seed your campaign deck before the duel."),
            h(
              "div",
              { className: "reward-grid" },
              rewards.map((card) =>
                h(
                  "button",
                  { key: card.id, type: "button", className: cx(campaign.rewards.some((reward) => reward.id === card.id) && "selected"), onClick: () => toggleReward(card) },
                  h("span", null, card.type),
                  h("strong", null, card.name),
                  h("em", null, `Produces ${card.produces.slice(0, 2).join(", ")}`)
                )
              )
            )
          ),
          h(
            "section",
            { className: "campaign-card route-card" },
            h("h2", null, "Route"),
            CAMPAIGN_ENCOUNTERS.map((encounter, index) =>
              h("article", { key: encounter.title }, h("span", null, index + 1), h("strong", null, encounter.title), h("p", null, encounter.text))
            )
          )
        ),
        h(
          "div",
          { className: "campaign-actions" },
          h("button", { type: "button", className: "secondary-action", onClick: onNotebook }, "Research Notebook"),
          h("button", { type: "button", className: "primary-action ready", onClick: () => onStart(deck) }, "Start Campaign Duel")
        )
      )
    );
  }

  function CardModal({ game, selected, onClose, onPlay }) {
    if (!selected?.card) return null;
    const { card, owner, zone } = selected;
    const side = game?.[owner];
    const playable =
      game &&
      owner === "player" &&
      zone === "hand" &&
      game.current === "player" &&
      (game.phase === "main" || game.phase === "counter") &&
      canPlayCard(game, "player", card);
    const missing = side ? missingRequirements(side, card) : [];
    const attackNeedsTarget = game && owner === "player" && zone === "hand" && ["Counterexample", "Pathology", "Generalization"].includes(card.type) && !game.cpu.pending.length;

    return h(
      "div",
      { className: "modal-shell", role: "dialog", "aria-modal": "true" },
      h("div", { className: "modal-backdrop", onClick: onClose }),
      m(
        "div",
        { className: "card-modal", initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.18 } },
        h("div", { className: "modal-header" }, h("h2", null, card.name), h("button", { type: "button", onClick: onClose }, "×")),
        h(
          "div",
          { className: "inspect-layout" },
          h(CardFace, { card, compact: false, zone: "inspect-card" }),
          h(
            "div",
            { className: "inspect-copy" },
            h("div", { className: "inspect-meta" }, h("span", null, card.deck), h("span", null, card.type), h("span", null, `Difficulty ${card.difficulty}`)),
            h("p", { className: "description" }, card.description),
            h("p", { className: "flavor" }, card.flavorText),
            h("h3", null, "Requirements"),
            h("ul", null, effectiveRequirements(card).length ? effectiveRequirements(card).map((item) => h("li", { key: item, className: missing.includes(item) ? "missing-text" : "" }, item)) : h("li", null, "Free")),
            h("h3", null, "Produces"),
            h("ul", null, (card.produces || []).map((item) => h("li", { key: item }, item))),
            card.counters?.length ? h("h3", null, "Counters") : null,
            card.counters?.length ? h("ul", null, card.counters.map((item) => h("li", { key: item }, item))) : null,
            card.protectsAgainst?.length ? h("h3", null, "Protects Against") : null,
            card.protectsAgainst?.length ? h("ul", null, card.protectsAgainst.map((item) => h("li", { key: item }, item))) : null,
            attackNeedsTarget ? h("p", { className: "missing-text" }, "Needs an enemy active proof to target.") : null,
            owner === "player" && zone === "hand"
              ? h("button", { type: "button", className: cx("primary-action", playable && "ready"), disabled: !playable, onClick: onPlay }, playable ? "Play Card" : "Not Playable")
              : null
          )
        )
      )
    );
  }

  function ProofRevealModal({ proof, onClose }) {
    if (!proof) return null;
    return h(
      "div",
      { className: "modal-shell", role: "dialog", "aria-modal": "true" },
      h("div", { className: "modal-backdrop", onClick: onClose }),
      m(
        "div",
        { className: "proof-reveal-modal", initial: { opacity: 0, y: 18, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.22 } },
        h(
          "div",
          { className: "modal-header" },
          h("div", null, h("h2", null, `${proof.owner === "player" ? "You proved" : "CPU proved"} ${proof.theorem.name}`), h("p", null, proof.theorem.deck)),
          h("button", { type: "button", onClick: onClose }, "x")
        ),
        h(
          "div",
          { className: "proof-reveal-body" },
          h(
            "section",
            { className: "proof-script" },
            h("h3", null, "Proof Chain"),
            proof.steps.length
              ? proof.steps.map((step, index) =>
                  h(
                    "article",
                    { key: `${step.requirement}-${index}` },
                    h("span", { "data-step": index + 1 }, index + 1),
                    h("strong", null, step.requirement),
                    h("p", null, `${step.helperName} (${step.helperType}) supplied this requirement by producing ${step.helperProduces.slice(0, 3).join(", ")}.`)
                  )
                )
              : h("article", null, h("strong", null, "Axiom-level proof"), h("p", null, "This theorem resolved without additional requirements."))
          ),
          h(
            "section",
            { className: "proof-lore" },
            proof.guide
              ? h(
                  React.Fragment,
                  null,
                  h("h3", null, "How To Prove It"),
                  h("p", null, proof.guide.summary),
                  h("ol", { className: "proof-guide-steps" }, proof.guide.steps.map((step, index) => h("li", { key: `${proof.theorem.name}-${index}` }, step)))
                )
              : null,
            h("h3", null, "Historical Note"),
            h("p", null, proof.history),
            h("h3", null, "Why It Matters"),
            h("p", null, proof.education),
            h("h3", null, "New Facts"),
            h("div", { className: "fact-chips proof-facts" }, proof.theorem.produces.map((fact) => h("span", { key: fact }, fact))),
            h("p", { className: "flavor" }, proof.theorem.flavorText)
          )
        )
      )
    );
  }

  function GraphModal({ game, zoom, setZoom, onClose }) {
    return h(
      "div",
      { className: "modal-shell", role: "dialog", "aria-modal": "true" },
      h("div", { className: "modal-backdrop", onClick: onClose }),
      h(
        "div",
        { className: "graph-modal" },
        h(
          "div",
          { className: "modal-header" },
          h("h2", null, "Proof Graph"),
          h(
            "div",
            { className: "graph-controls" },
            h("button", { type: "button", onClick: () => setZoom(Math.max(0.65, zoom - 0.15)) }, "-"),
            h("span", null, `${Math.round(zoom * 100)}%`),
            h("button", { type: "button", onClick: () => setZoom(Math.min(1.7, zoom + 0.15)) }, "+"),
            h("button", { type: "button", onClick: onClose }, "×")
          )
        ),
        h("div", { className: "graph-scroll" }, h("div", { style: { transform: `scale(${zoom})`, transformOrigin: "top left", width: 1520, height: 860 } }, h(ProofGraph, { game, large: true })))
      )
    );
  }

  function DeckViewerModal({ selectedDeck, setSelectedDeck, onClose }) {
    const [viewerDeck, setViewerDeck] = React.useState(selectedDeck);
    const mainDeck = getMainDeck(viewerDeck);
    const theoremDeck = getTheoremDeck(viewerDeck);
    const deckStats = {
      main: mainDeck.length,
      theorem: theoremDeck.length,
      facts: new Set(allDeckCards(viewerDeck).flatMap((card) => card.produces || [])).size,
      counters: mainDeck.filter((card) => ["Counterexample", "Pathology", "Generalization"].includes(card.type)).length,
    };
    const renderMiniCard = (card) => {
      const style = TYPE_STYLE[card.type] || TYPE_STYLE.Definition;
      return h(
        "article",
        { key: card.id, className: cx("deck-view-card", `tone-${style.tone}`) },
        h(
          "div",
          { className: "deck-view-card-top" },
          h("span", { className: "deck-view-type" }, card.type),
          h("span", { className: "deck-view-cost" }, `D${card.difficulty ?? 0}`)
        ),
        h("h4", null, card.name),
        h("p", null, card.description),
        card.requirements?.length
          ? h("div", { className: "deck-view-chips missing" }, h("strong", null, "Needs"), card.requirements.slice(0, 5).map((item) => h("span", { key: item }, item)))
          : null,
        card.produces?.length
          ? h("div", { className: "deck-view-chips" }, h("strong", null, "Makes"), card.produces.slice(0, 5).map((item) => h("span", { key: item }, item)))
          : null,
        card.counters?.length
          ? h("div", { className: "deck-view-chips counter" }, h("strong", null, "Counters"), card.counters.slice(0, 4).map((item) => h("span", { key: item }, item)))
          : null,
        card.type === "Theorem"
          ? h("p", { className: "deck-view-guide" }, getTheoremGuide(card.name)?.summary || "Signature theorem target.")
          : null
      );
    };
    const renderGroups = (cards) =>
      groupCardsByType(cards).map((group) =>
        h(
          "section",
          { key: group.type, className: "deck-view-group" },
          h(
            "div",
            { className: "deck-view-group-heading" },
            h("h3", null, group.type),
            h("span", null, group.cards.length)
          ),
          h("div", { className: "deck-view-cards" }, group.cards.map(renderMiniCard))
        )
      );

    return h(
      "div",
      { className: "modal-shell", role: "dialog", "aria-modal": "true" },
      h("div", { className: "modal-backdrop", onClick: onClose }),
      m(
        "div",
        { className: "deck-viewer-modal", initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22 } },
        h(
          "div",
          { className: "modal-header" },
          h("div", null, h("h2", null, "Deck Viewer"), h("p", null, "Preview every card before choosing your proof strategy.")),
          h("button", { type: "button", onClick: onClose }, "x")
        ),
        h(
          "div",
          { className: "deck-viewer-tabs" },
          DECKS.map((deck) =>
            h(
              "button",
              {
                key: deck,
                type: "button",
                className: cx(viewerDeck === deck && "active"),
                onClick: () => {
                  setViewerDeck(deck);
                  setSelectedDeck(deck);
                },
              },
              h("span", null, DECK_IDENTITY[deck].icon),
              deck
            )
          )
        ),
        h(
          "div",
          { className: "deck-viewer-overview" },
          h("div", null, h("strong", null, viewerDeck), h("p", null, DECK_IDENTITY[viewerDeck].identity)),
          h("div", { className: "deck-viewer-stats" },
            h("span", null, h("b", null, deckStats.main), " Main"),
            h("span", null, h("b", null, deckStats.theorem), " Theorems"),
            h("span", null, h("b", null, deckStats.facts), " Facts"),
            h("span", null, h("b", null, deckStats.counters), " Disruptors")
          ),
          h("p", { className: "deck-viewer-rival" }, `Hard counter rival: ${HARD_COUNTER[viewerDeck]}`)
        ),
        h(
          "div",
          { className: "deck-viewer-lists" },
          h(
            "section",
            { className: "deck-viewer-column" },
            h("header", null, h("h3", null, "Main Deck"), h("span", null, `${mainDeck.length} cards`)),
            renderGroups(mainDeck)
          ),
          h(
            "section",
            { className: "deck-viewer-column theorem-column" },
            h("header", null, h("h3", null, "Theorem Deck"), h("span", null, `${theoremDeck.length} cards`)),
            renderGroups(theoremDeck)
          )
        )
      )
    );
  }

  function StartScreen({ selectedDeck, setSelectedDeck, onStart, onExplain, onGuide, onCampaign, onNotebook, onTutorial, onDeckViewer }) {
    return h(
      "main",
      { className: "start-screen" },
      h("div", { className: "start-glow" }),
      m(
        "section",
        { className: "start-panel", initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45 } },
        m("h1", { className: "game-title", initial: { letterSpacing: "0.4em", opacity: 0 }, animate: { letterSpacing: "0.02em", opacity: 1 }, transition: { duration: 0.8 } }, "Proof Duel"),
        h("p", { className: "tagline" }, "A competitive theorem-proving card battler where definitions become weapons and counterexamples bite back."),
        h(
          "div",
          { className: "deck-select" },
          DECKS.map((deck) =>
            h(
              "button",
              {
                key: deck,
                type: "button",
                className: cx("deck-choice", selectedDeck === deck && "selected"),
                onClick: () => setSelectedDeck(deck),
              },
              h("span", { className: "deck-icon" }, DECK_IDENTITY[deck].icon),
              h("strong", null, deck),
              h("em", null, `Hard counter: ${HARD_COUNTER[deck]}`),
              h("small", null, DECK_IDENTITY[deck].identity)
            )
          )
        ),
        h(
          "div",
          { className: "start-actions" },
          h("button", { type: "button", className: "primary-action ready campaign-button", onClick: onCampaign }, "Start Campaign"),
          h("button", { type: "button", className: "primary-action ready", onClick: onTutorial }, "Tutorial Duel"),
          h("button", { type: "button", className: "secondary-action", onClick: onStart }, "Quick Duel"),
          h("button", { type: "button", className: "secondary-action", onClick: onDeckViewer }, "Deck Viewer"),
          h("button", { type: "button", className: "secondary-action", onClick: onGuide }, "Theorem Proof Guide"),
          h("button", { type: "button", className: "secondary-action", onClick: onNotebook }, "Research Notebook"),
          h("button", { type: "button", className: "secondary-action", onClick: onExplain }, "Explain Game")
        )
      )
    );
  }

  function RpsScreen({ selectedDeck, rps, setRps, onBegin, onBack }) {
    const choose = (choice) => {
      const cpu = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
      const result = rpsWinner(choice, cpu);
      setRps({ human: choice, cpu, result, starter: result === "tie" ? null : result });
    };
    return h(
      "main",
      { className: "rps-screen" },
      h(
        "section",
        { className: "rps-panel" },
        h("h1", null, "Who Starts?"),
        h("p", null, `${selectedDeck} versus CPU ${HARD_COUNTER[selectedDeck]}. Choose your opening symbol.`),
        h(
          "div",
          { className: "rps-choices" },
          RPS_CHOICES.map((choice) => h("button", { key: choice, type: "button", onClick: () => choose(choice) }, h("span", null, titleCase(choice))))
        ),
        rps.result
          ? h(
              "div",
              { className: "rps-result" },
              h("span", null, `You: ${titleCase(rps.human)}`),
              h("span", null, `CPU: ${titleCase(rps.cpu)}`),
              h("strong", null, rps.result === "tie" ? "Tie. Choose again." : rps.result === "player" ? "You start." : "CPU starts.")
            )
          : null,
        h(
          "div",
          { className: "start-actions" },
          h("button", { type: "button", className: "secondary-action", onClick: onBack }, "Back"),
          h("button", { type: "button", className: cx("primary-action", rps.starter && "ready"), disabled: !rps.starter, onClick: () => onBegin(rps.starter) }, "Enter Arena")
        )
      )
    );
  }

  function Board({ game, setGame, onExplain, onGuide, onNotebook, campaign, tutorial, onCampaignReward }) {
    const [selected, setSelected] = React.useState(null);
    const [graphOpen, setGraphOpen] = React.useState(false);
    const [graphZoom, setGraphZoom] = React.useState(0.78);
    const [coachOpen, setCoachOpen] = React.useState(true);

    const onInspect = (card, owner, zone) => setSelected({ card, owner, zone });
    const selectedStillExists = selected?.card
      ? game[selected.owner]?.hand.concat(cardZoneCards(game[selected.owner])).some((card) => card.uid === selected.card.uid)
      : false;

    React.useEffect(() => {
      if (selected && !selectedStillExists) setSelected(null);
    }, [selectedStillExists]);

    React.useEffect(() => {
      if (game.current !== "cpu" || game.winner) return undefined;
      if (tutorial?.active) {
        const timer = window.setTimeout(
          () =>
            setGame((current) => ({
              ...current,
              current: "player",
              phase: "draw",
              turn: current.turn + 1,
              log: ["Tutorial CPU passes so you can repair the proof.", ...current.log].slice(0, 8),
            })),
          700
        );
        return () => window.clearTimeout(timer);
      }
      const timer = window.setTimeout(() => setGame((current) => runCpuTurn(current)), 900);
      return () => window.clearTimeout(timer);
    }, [game.current, game.turn, game.winner, tutorial?.active]);

    const playSelected = () => {
      if (!selected?.card) return;
      setGame((current) => playCard(current, "player", selected.card.uid));
      setSelected(null);
    };

    const closeProofReveal = () => {
      setGame((current) => ({ ...current, lastProof: null }));
    };

    return h(
      "main",
      { className: "duel-board" },
      h("div", { className: "board-vignette" }),
      h(
        "header",
        { className: "board-topbar" },
        h(StatPanel, { side: game.cpu, label: "Opponent" }),
        h(
          "div",
          { className: "phase-orb" },
          h("strong", null, game.winner ? (game.winner === "player" ? "Victory" : "Defeat") : game.current === "cpu" ? "CPU Thinking" : titleCase(game.phase)),
          h("span", null, `Turn ${game.turn}`),
          h("em", null, `${game.playerDeck} vs ${game.cpuDeck}`)
        ),
        h(StatPanel, { side: game.player, label: "You" })
      ),
      h(Hand, { game, sideName: "cpu", onInspect }),
      coachOpen
        ? h(ContextualProofCoach, { game, tutorial, onGuide, onNotebook, onClose: () => setCoachOpen(false) })
        : h(
            "div",
            { className: "coach-closed" },
            h("span", null, "Theorem coach hidden"),
            h("button", { type: "button", className: "secondary-action", onClick: () => setCoachOpen(true) }, "Show Theorem Coach")
          ),
      h(
        "section",
        { className: "arena-table" },
        h(FieldLane, { side: game.player, owner: "player", onInspect }),
        h(ActiveSlots, { game, onInspect }),
        h(FieldLane, { side: game.cpu, owner: "cpu", onInspect }),
        h(
          "aside",
          { className: "side-stack" },
          h(DeckPiles, { side: game.cpu, sideName: "cpu" }),
          h(ProofGraph, { game, onOpen: () => setGraphOpen(true) }),
          h("div", { className: "graveyard" }, h("span", null, "Discard"), h("strong", null, game.player.discard.length + game.cpu.discard.length))
        ),
        h(DeckPiles, { side: game.player, sideName: "player" })
      ),
      h(Hand, { game, sideName: "player", onInspect }),
      h(
        "footer",
        { className: "command-row" },
        h(
          "div",
          { className: "log-panel" },
          game.log.map((entry, index) => h("p", { key: `${entry}-${index}` }, entry))
        ),
        h(
          "div",
          { className: "turn-actions" },
          h("button", { type: "button", className: "secondary-action", onClick: onExplain }, "Explain"),
          h("button", { type: "button", className: "secondary-action", onClick: onNotebook }, "Notebook"),
          !coachOpen ? h("button", { type: "button", className: "secondary-action", onClick: () => setCoachOpen(true) }, "Coach") : null,
          h("button", { type: "button", disabled: game.current !== "player" || game.phase !== "draw" || game.winner, onClick: () => setGame((current) => drawHumanTurn(current)) }, "Draw Phase"),
          h("button", { type: "button", disabled: game.current !== "player" || game.phase !== "main" || game.winner, onClick: () => setGame((current) => advanceToCounterPhase(current)) }, "Counter Phase"),
          h("button", { type: "button", className: "primary-action ready", disabled: game.current !== "player" || game.phase !== "counter" || game.winner, onClick: () => setGame((current) => endHumanTurn(current)) }, "Resolve / End Turn")
        )
      ),
      game.winner
        ? h(
            "div",
            { className: "winner-banner" },
            (() => {
              const recap = buildEndRecap(game);
              return h(
                React.Fragment,
                null,
                h("strong", null, game.winner === "player" ? "You proved the third theorem." : "CPU proved the third theorem."),
                h("span", null, game.winner === "player" ? "Victory by theorem chain." : "The opposing proof engine got there first."),
                h("div", { className: "end-recap" }, h("h3", null, recap.title), recap.lines.map((line) => h("p", { key: line }, line)))
              );
            })(),
            campaign?.active && game.winner === "player"
              ? h("button", { type: "button", className: "primary-action ready", onClick: onCampaignReward }, "Claim Campaign Reward")
              : null
          )
        : null,
      selected ? h(CardModal, { game, selected, onClose: () => setSelected(null), onPlay: playSelected }) : null,
      game.lastProof ? h(ProofRevealModal, { proof: game.lastProof, onClose: closeProofReveal }) : null,
      graphOpen ? h(GraphModal, { game, zoom: graphZoom, setZoom: setGraphZoom, onClose: () => setGraphOpen(false) }) : null
    );
  }

  function applyCampaignMods(game, campaign) {
    if (!campaign?.active) return game;
    const next = { ...game, player: { ...game.player }, log: [...game.log] };
    const relic = campaign.relic || RELICS[0];
    next.player.shields += relic.shields || 0;
    next.player.facts = [...new Set([...(next.player.facts || []), ...(relic.facts || [])])];
    next.log = [
      `Campaign relic active: ${relic.name}.`,
      `Boss theorem focus: ${campaign.boss?.name || campaignBossTheorem(campaign.deck || game.playerDeck)?.name}.`,
      ...next.log,
    ].slice(0, 8);
    return next;
  }

  return function ProofDuelApp() {
    const [screen, setScreen] = React.useState("start");
    const [selectedDeck, setSelectedDeck] = React.useState("Topology");
    const [rps, setRps] = React.useState({ human: null, cpu: null, result: null, starter: null });
    const [game, setGame] = React.useState(null);
    const [showExplain, setShowExplain] = React.useState(false);
    const [showGuide, setShowGuide] = React.useState(false);
    const [showNotebook, setShowNotebook] = React.useState(false);
    const [showDeckViewer, setShowDeckViewer] = React.useState(false);
    const [tutorial, setTutorial] = React.useState({ active: false });
    const [campaign, setCampaign] = React.useState({
      active: false,
      deck: "Topology",
      relic: RELICS[0],
      rewards: [],
      boss: campaignBossTheorem("Topology"),
      completedEncounters: 0,
    });

    const beginDuel = (starter) => {
      const activeDeck = campaign.active ? campaign.deck : selectedDeck;
      const created = createGame(activeDeck, starter, {
        playerBonusCards: campaign.active ? campaign.rewards : [],
      });
      setTutorial({ active: false });
      setGame(applyCampaignMods(created, campaign));
      setScreen("duel");
    };

    const startCampaignDuel = (deck) => {
      setCampaign((current) => ({
        ...current,
        active: true,
        deck,
        boss: campaignBossTheorem(deck),
      }));
      setSelectedDeck(deck);
      setTutorial({ active: false });
      setRps({ human: null, cpu: null, result: null, starter: null });
      setScreen("rps");
    };

    const startTutorial = () => {
      setCampaign((current) => ({ ...current, active: false }));
      setTutorial({ active: true });
      setSelectedDeck("Topology");
      setGame(prepareTutorialGame());
      setScreen("duel");
    };

    const claimCampaignReward = () => {
      const nextReward = campaignRewardCards(campaign.deck).find((card) => !campaign.rewards.some((reward) => reward.id === card.id));
      setCampaign((current) => ({
        ...current,
        completedEncounters: current.completedEncounters + 1,
        rewards: nextReward ? [...current.rewards, nextReward].slice(0, 3) : current.rewards,
      }));
      setScreen("campaign");
    };

    return h(
      React.Fragment,
      null,
      screen === "start"
        ? h(StartScreen, {
            selectedDeck,
            setSelectedDeck,
            onStart: () => {
              setCampaign((current) => ({ ...current, active: false }));
              setTutorial({ active: false });
              setRps({ human: null, cpu: null, result: null, starter: null });
              setScreen("rps");
            },
            onExplain: () => setShowExplain(true),
            onGuide: () => setShowGuide(true),
            onDeckViewer: () => setShowDeckViewer(true),
            onCampaign: () => {
              setCampaign((current) => ({
                ...current,
                active: true,
                deck: selectedDeck,
                boss: campaignBossTheorem(selectedDeck),
              }));
              setScreen("campaign");
            },
            onNotebook: () => setShowNotebook(true),
            onTutorial: startTutorial,
          })
        : null,
      screen === "campaign"
        ? h(CampaignScreen, {
            selectedDeck,
            setSelectedDeck,
            campaign,
            setCampaign,
            onStart: startCampaignDuel,
            onBack: () => setScreen("start"),
            onNotebook: () => setShowNotebook(true),
          })
        : null,
      screen === "rps"
        ? h(RpsScreen, {
            selectedDeck: campaign.active ? campaign.deck : selectedDeck,
            rps,
            setRps,
            onBegin: beginDuel,
            onBack: () => setScreen(campaign.active ? "campaign" : "start"),
          })
        : null,
      screen === "duel" && game
        ? h(Board, {
            game,
            setGame,
            onExplain: () => setShowExplain(true),
            onGuide: () => setShowGuide(true),
            onNotebook: () => setShowNotebook(true),
            campaign,
            tutorial,
            onCampaignReward: claimCampaignReward,
          })
        : null,
      showExplain ? h(ExplainModal, { onClose: () => setShowExplain(false) }) : null,
      showGuide ? h(ProofGuideModal, { onClose: () => setShowGuide(false) }) : null,
      showNotebook ? h(ResearchNotebookModal, { campaign, selectedDeck, onClose: () => setShowNotebook(false) }) : null,
      showDeckViewer ? h(DeckViewerModal, { selectedDeck, setSelectedDeck, onClose: () => setShowDeckViewer(false) }) : null
    );
  };
}
