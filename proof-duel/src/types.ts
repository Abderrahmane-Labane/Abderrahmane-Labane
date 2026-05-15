export type DeckName = "Topology" | "Real Analysis" | "Abstract Algebra" | "Linear Algebra";

export type CardType =
  | "Definition"
  | "Example"
  | "Counterexample"
  | "Lemma"
  | "Proposition"
  | "Theorem"
  | "Technique"
  | "Generalization"
  | "Pathology"
  | "Meta/Foundation";

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export interface ProofCard {
  id: string;
  uid?: string;
  name: string;
  deck: DeckName;
  type: CardType;
  difficulty: number;
  requirements: string[];
  produces: string[];
  counters: string[];
  protectsAgainst: string[];
  targetDeckStrength: Record<string, "hard" | "soft" | "native">;
  description: string;
  flavorText: string;
  rarity: Rarity;
  addedRequirements?: string[];
  status?: "hand" | "active" | "pending" | "proven" | "attacked" | "delayed" | "destroyed" | "protected" | "spent" | "blocked";
}

export interface DuelSide {
  owner: "player" | "cpu";
  deck: DeckName;
  mainDeck: ProofCard[];
  theoremDeck: ProofCard[];
  hand: ProofCard[];
  played: ProofCard[];
  pending: ProofCard[];
  proven: ProofCard[];
  discard: ProofCard[];
  facts: string[];
  shields: number;
  provenTheorems: number;
  lastDraws: Array<{ uid: string; name: string; type: CardType; pile: "main" | "theorem" }>;
  playsThisTurn: Partial<Record<CardType, boolean>>;
}

export interface ProofDuelState {
  id: string;
  playerDeck: DeckName;
  cpuDeck: DeckName;
  current: "player" | "cpu";
  phase: "draw" | "main" | "counter" | "resolution" | "cpu" | "cpu-counter";
  turn: number;
  winner: null | "player" | "cpu";
  player: DuelSide;
  cpu: DuelSide;
  log: string[];
  lastProof?: null | {
    owner: "player" | "cpu";
    theorem: { name: string; deck: DeckName; produces: string[]; flavorText: string };
    steps: Array<{ requirement: string; helperName: string; helperType: string; helperProduces: string[] }>;
    history: string;
    education: string;
  };
}
