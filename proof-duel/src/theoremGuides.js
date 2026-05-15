export const THEOREM_GUIDES = {
  "Tychonoff Theorem": {
    summary: "Products of compact spaces are compact, with the infinite case relying on choice-like compactness machinery.",
    steps: [
      "Start with an open cover of the product space.",
      "Use product topology to reduce local information to finitely many coordinate conditions.",
      "Use compactness in each coordinate to keep every finite projection controlled.",
      "Invoke Choice-Dependent Construction or an equivalent maximal/ultrafilter argument to pass from finite control to the whole product.",
      "Conclude that every open cover has a finite subcover, so the product is compact.",
    ],
  },
  "Brouwer Fixed Point Theorem": {
    summary: "A continuous self-map of a disk or ball must fix at least one point.",
    steps: [
      "Assume a continuous map sends every point away from itself.",
      "Use Euclidean Space and compactness to define a continuous retraction from the ball to its boundary.",
      "Translate the retraction into a topological contradiction.",
      "Use Glueing Argument or a degree-style obstruction to show the boundary cannot retract from the ball.",
      "Reject the assumption and conclude a fixed point exists.",
    ],
  },
  "Urysohn Lemma": {
    summary: "In a normal space, disjoint closed sets can be separated by a continuous function.",
    steps: [
      "Begin with two disjoint Closed Set cards inside a Normal Space.",
      "Use the separation property to place nested open neighborhoods between the two closed sets.",
      "Index the nested neighborhoods by rational levels between 0 and 1.",
      "Define a function by the first level whose open set contains each point.",
      "Verify continuity from the nested open sets and obtain a separating function.",
    ],
  },
  "Jordan Curve Theorem": {
    summary: "A simple closed curve in the plane separates the plane into inside and outside regions.",
    steps: [
      "Represent the curve as a controlled closed path in Euclidean Space.",
      "Use Simply Connected or planar separation ideas to prevent paths from crossing the curve freely.",
      "Show points not on the curve fall into two classes: inside and outside.",
      "Prove each class is connected locally and cannot be joined without crossing the curve.",
      "Conclude the complement has exactly two components with the curve as common boundary.",
    ],
  },
  "Compact Hausdorff Implies Normal": {
    summary: "Compactness plus Hausdorff separation upgrades point separation into closed-set separation.",
    steps: [
      "Take two disjoint closed subsets of a Compact Hausdorff space.",
      "Use Hausdorff to separate each point of one closed set from each point of the other.",
      "Use compactness to reduce many local neighborhoods to finitely many.",
      "Combine those finite neighborhoods into disjoint open neighborhoods of the closed sets.",
      "Therefore the space is Normal.",
    ],
  },
  "Arzela-Ascoli Theorem": {
    summary: "A controlled family of functions has compact closure when it is uniformly bounded and equicontinuous.",
    steps: [
      "Start with a family of continuous functions on a compact domain.",
      "Use Arzela-Ascoli Setup to record uniform boundedness and equicontinuity.",
      "Choose a dense countable set of sample points.",
      "Use diagonalization to extract a subsequence converging on those sample points.",
      "Use equicontinuity to upgrade pointwise convergence on the dense set to uniform convergence.",
    ],
  },
  "Stone-Weierstrass Theorem": {
    summary: "A rich enough algebra of functions uniformly approximates continuous functions on a compact space.",
    steps: [
      "Work in a Compact Metric Space or compact Hausdorff setting.",
      "Check the algebra contains constants and separates points.",
      "Use local approximation to build functions that match desired values at selected points.",
      "Use compactness to pass from local approximations to a finite global approximation.",
      "Conclude every continuous function can be uniformly approximated by the algebra.",
    ],
  },
  "Hahn-Banach Theorem": {
    summary: "A bounded linear functional can be extended while preserving its norm bound.",
    steps: [
      "Start with a linear functional on a subspace and a dominating sublinear bound.",
      "Extend the functional one dimension at a time without breaking the bound.",
      "Use an order/maximality argument to continue all possible extensions.",
      "Invoke Choice-Dependent Construction or Zorn-style reasoning for the maximal extension.",
      "Show maximality forces the functional to be defined on the whole space.",
    ],
  },
  "Dominated Convergence Theorem": {
    summary: "Limits can pass through integrals when functions are controlled by one integrable dominator.",
    steps: [
      "Begin with measurable functions converging pointwise almost everywhere.",
      "Use Dominated Estimate to bound every function by one integrable function.",
      "Convert pointwise convergence into small error outside sets of controlled measure.",
      "Use integrability to make the remaining tail contribution small.",
      "Conclude the integrals converge to the integral of the limit.",
    ],
  },
  "Open Mapping Theorem": {
    summary: "A surjective bounded linear map between Banach spaces sends open sets to open sets.",
    steps: [
      "Start with a surjective bounded linear map between complete normed spaces.",
      "Use completeness and Baire category to show the image of some ball has interior.",
      "Scale and translate that interior-control fact using linearity.",
      "Show every neighborhood of zero maps onto a neighborhood of zero.",
      "Conclude arbitrary open sets have open images.",
    ],
  },
  "Sylow Theorems": {
    summary: "Finite groups contain and control subgroups whose orders are prime powers.",
    steps: [
      "Factor the group order into a prime power times a coprime remainder.",
      "Use group actions on suitable subsets or cosets.",
      "Apply Orbit-Stabilizer to count fixed points modulo the prime.",
      "Extract a subgroup of the desired prime-power order.",
      "Use conjugation action to prove counting and conjugacy statements for Sylow subgroups.",
    ],
  },
  "Chinese Remainder Theorem": {
    summary: "Compatible congruences modulo coprime ideals or moduli combine into one solution.",
    steps: [
      "Start with pairwise coprime moduli or ideals.",
      "Use Bezout-style combinations or ideal sums to build selector elements.",
      "Construct one term that satisfies each congruence while vanishing modulo the others.",
      "Add those selector terms to form a simultaneous solution.",
      "Show uniqueness modulo the product or intersection.",
    ],
  },
  "Structure Theorem for Modules": {
    summary: "Finitely generated modules over a PID decompose into standard cyclic pieces.",
    steps: [
      "Work over a PID with a finitely generated module.",
      "Present the module by generators and relations.",
      "Use Euclidean Algorithm or row-column operations to simplify the relation matrix.",
      "Diagonalize the relations into invariant factors or elementary divisors.",
      "Read the module as a direct sum of cyclic pieces.",
    ],
  },
  "Cayley's Theorem": {
    summary: "Every group can be represented as a group of permutations.",
    steps: [
      "Let the group act on its own elements by left multiplication.",
      "Associate each group element to the permutation it creates.",
      "Use associativity to show this assignment is a homomorphism.",
      "Show the action is faithful: only the identity acts trivially.",
      "Conclude the group embeds into a symmetric group.",
    ],
  },
  "Isomorphism Theorems": {
    summary: "Kernels, images, and quotients describe the same algebraic structure from different viewpoints.",
    steps: [
      "Start with a homomorphism and identify its kernel.",
      "Use Kernels Are Normal to form the quotient by that kernel.",
      "Define a map from the quotient to the image.",
      "Check the map is well-defined, injective, and surjective.",
      "Repeat the same kernel-image logic for subgroup and quotient variants.",
    ],
  },
  "Spectral Theorem": {
    summary: "Symmetric or self-adjoint operators can be diagonalized by orthogonal directions.",
    steps: [
      "Start with a symmetric matrix or self-adjoint operator.",
      "Use inner product structure to get orthogonality of eigenspaces.",
      "Find at least one eigenvector using polynomial or compactness arguments.",
      "Use orthogonal complements to reduce dimension and continue inductively.",
      "Assemble an orthogonal basis of eigenvectors, giving diagonal form.",
    ],
  },
  "Singular Value Decomposition": {
    summary: "Every matrix factors into orthogonal changes of coordinates and nonnegative stretching.",
    steps: [
      "Start with a linear map represented by a matrix.",
      "Study the symmetric positive semidefinite matrix A transpose A.",
      "Use the Spectral Theorem to get an orthonormal eigenbasis for A transpose A.",
      "Define singular values as square roots of the eigenvalues.",
      "Normalize the images of basis vectors to build the left singular vectors and factor the matrix.",
    ],
  },
  "Jordan Canonical Form": {
    summary: "A linear map decomposes into eigenvalue blocks that record diagonalization failure.",
    steps: [
      "Find eigenvalues and generalized eigenspaces.",
      "Use kernels of powers of A minus lambda I to measure generalized chains.",
      "Choose basis vectors that form Jordan chains.",
      "Use Basis Change to express the map in those chain bases.",
      "Read the matrix as Jordan blocks for each eigenvalue.",
    ],
  },
  "Cayley-Hamilton": {
    summary: "Every square matrix satisfies its own characteristic polynomial.",
    steps: [
      "Form the characteristic polynomial det(tI - A).",
      "Use the adjugate identity for tI - A over the polynomial ring.",
      "Substitute the matrix A into the resulting polynomial identity.",
      "All terms collapse to the zero matrix by the identity.",
      "Conclude p(A) = 0 for the characteristic polynomial p.",
    ],
  },
  "Rank-Nullity Theorem": {
    summary: "The dimension of the domain splits into kernel dimension plus image dimension.",
    steps: [
      "Start with a linear map from a finite-dimensional vector space.",
      "Choose a basis for the kernel.",
      "Extend that kernel basis to a basis for the whole domain.",
      "Show the images of the added basis vectors form a basis for the image.",
      "Count basis vectors to get dimension(domain) = nullity + rank.",
    ],
  },
  "Quadratic Reciprocity": {
    summary: "For odd primes, quadratic residue behavior modulo p and q is related by a precise sign rule.",
    steps: [
      "Represent whether one prime is a square modulo another using Legendre symbols.",
      "Use Gauss Lemma to convert each Legendre symbol into a parity count.",
      "Compare the two parity counts in a lattice rectangle.",
      "Track the sign change that occurs when both primes are 3 mod 4.",
      "Conclude the reciprocity law relating the two residue questions.",
    ],
  },
  "Number-Theoretic CRT": {
    summary: "Coprime congruence conditions combine into a single residue class.",
    steps: [
      "Start with pairwise coprime moduli and target residues.",
      "Use Bezout Lemma to build coefficients that isolate each modulus.",
      "Construct selector terms that equal one modulo one modulus and zero modulo the others.",
      "Add the selector terms weighted by the desired residues.",
      "Show the solution is unique modulo the product of the moduli.",
    ],
  },
  "Prime Number Theorem": {
    summary: "The number of primes up to x grows like x divided by log x.",
    steps: [
      "Encode primes using analytic information from the zeta function or a prime-counting transform.",
      "Use Sieve Argument to relate primes to multiplicative structure.",
      "Apply Analytic Continuation to study the zeta function beyond its original domain.",
      "Show nonvanishing on the critical boundary needed for the asymptotic.",
      "Translate analytic behavior back into the prime-counting estimate.",
    ],
  },
  "Dirichlet Arithmetic Progression Theorem": {
    summary: "Every coprime arithmetic progression contains infinitely many primes.",
    steps: [
      "Represent residue classes using Dirichlet characters.",
      "Build L-functions from those characters.",
      "Use analytic continuation and nonvanishing at 1.",
      "Show primes in the chosen residue class must contribute infinitely often.",
      "Conclude the progression contains infinitely many primes.",
    ],
  },
  "Hensel Lifting": {
    summary: "A simple root modulo p can lift to roots modulo higher powers of p.",
    steps: [
      "Start with a polynomial root modulo p.",
      "Check the derivative is nonzero modulo p so the root is simple.",
      "Assume a root is known modulo p to the n.",
      "Correct it by adding a multiple of p to the n using a linear congruence.",
      "Iterate to obtain compatible roots in the p-adic limit.",
    ],
  },
  "Law of Large Numbers": {
    summary: "Averages of independent samples converge toward expected value.",
    steps: [
      "Start with independent random variables with common expectation.",
      "Use Linearity of Expectation to identify the expected sample average.",
      "Use Variance Additivity to show variance of the average shrinks.",
      "Apply Chebyshev Inequality to bound deviation probability.",
      "Let the number of samples grow to force convergence in probability or almost surely with stronger tools.",
    ],
  },
  "Central Limit Theorem": {
    summary: "Normalized sums of many independent variables tend toward a Gaussian distribution.",
    steps: [
      "Center variables by subtracting expectation and scale by variance.",
      "Use independence to factor the transform or moment-generating information.",
      "Approximate each factor for small normalized inputs.",
      "Multiply many small factors and take the exponential limit.",
      "Identify the limiting transform as the normal distribution.",
    ],
  },
  "Martingale Convergence Theorem": {
    summary: "A suitably bounded martingale converges almost surely.",
    steps: [
      "Start with a martingale adapted to a filtration.",
      "Use conditional expectation to express fair future movement.",
      "Control upcrossings between any two rational levels.",
      "Show expected upcrossings are finite under boundedness assumptions.",
      "Conclude paths cannot oscillate forever, so an almost-sure limit exists.",
    ],
  },
  "Kolmogorov Zero-One Law": {
    summary: "Tail events of independent sequences have probability zero or one.",
    steps: [
      "Define a tail event as one unaffected by changing finitely many early coordinates.",
      "Use independence to show the tail sigma-algebra is independent of every finite initial block.",
      "Pass to independence from the sigma-algebra generated by all finite blocks.",
      "Show the event is independent of itself.",
      "Conclude its probability equals its square, hence it is 0 or 1.",
    ],
  },
  "Optional Stopping Theorem": {
    summary: "Under suitable hypotheses, stopping a martingale preserves expected value.",
    steps: [
      "Start with a martingale and a stopping time.",
      "First prove the result for bounded stopping times by iterating conditional expectation.",
      "Use the stopping time property to justify each revealed time step.",
      "Extend to allowed unbounded cases with boundedness, integrability, or convergence control.",
      "Conclude the expected stopped value equals the initial value.",
    ],
  },
  "Compactness Theorem": {
    summary: "A first-order theory has a model if every finite subset has a model.",
    steps: [
      "Assume every finite part of the theory is satisfiable.",
      "Use Henkin Construction to add witness constants for existential statements.",
      "Extend the theory consistently while preserving finite satisfiability.",
      "Build a term model from the completed consistent theory.",
      "Show the model satisfies the whole theory.",
    ],
  },
  "Completeness Theorem": {
    summary: "Every semantically valid first-order statement is formally provable.",
    steps: [
      "Assume a statement is not provable from the axioms.",
      "Add its negation while preserving consistency.",
      "Use Henkin Construction to build a model of that consistent extension.",
      "The model satisfies the axioms and the negation of the statement.",
      "Contradict semantic validity, so the statement must be provable.",
    ],
  },
  "Incompleteness Theorem": {
    summary: "Strong consistent arithmetic cannot prove every arithmetical truth.",
    steps: [
      "Encode syntax, proofs, and formulas as arithmetic objects.",
      "Use the Diagonal Lemma to build a sentence referring to its own provability.",
      "Construct a sentence that says it is not provable.",
      "Show consistency prevents the system from proving that sentence.",
      "Under suitable soundness assumptions, show the sentence is true but unprovable.",
    ],
  },
  "Lowenheim-Skolem Theorem": {
    summary: "First-order theories with infinite models have models of controlled smaller or larger cardinalities.",
    steps: [
      "Start with a model of a first-order theory.",
      "List the formulas of the language and add Skolem functions or witnesses.",
      "Close a chosen set under those functions.",
      "Use the Tarski-Vaught style criterion to preserve elementary truth.",
      "Obtain an elementary submodel of the desired controlled size.",
    ],
  },
  "Tarski Undefinability": {
    summary: "Truth for arithmetic cannot be defined inside arithmetic itself.",
    steps: [
      "Assume there is an internal formula that defines truth for arithmetic sentences.",
      "Use self-reference through the Diagonal Lemma.",
      "Construct a liar-style sentence saying it is not true.",
      "Compare the sentence with the assumed truth definition.",
      "Derive a contradiction and conclude truth is not internally definable.",
    ],
  },
};

export function getTheoremGuide(name) {
  return THEOREM_GUIDES[name] || {
    summary: "Build every listed requirement in your proof state, then resolve the theorem.",
    steps: [
      "Identify the theorem's requirements.",
      "Play definitions, examples, lemmas, and propositions that produce those facts.",
      "Protect the active proof from counterexamples when possible.",
      "Resolve the theorem once every requirement is present.",
    ],
  };
}
