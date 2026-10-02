// ============================================================
// POLYGLOT PRONUNCIATION BATTLE
// sentences.js
// ============================================================

export const SENTENCES = {

  // ==========================================================
  // EASY — 10
  // ==========================================================

  easy: [
    "Maya made many mango muffins.",
    "Seven silver stars shine softly.",
    "Tiny turtles took a taxi.",
    "Brave brothers brought bright balloons.",
    "Lazy lions like lemon leaves.",
    "Busy bees buzz beside bluebells.",
    "Tiny birds bring bright berries.",
    "Seven sheep sleep silently.",
    "Clean clocks click clearly.",
    "Happy hippos hop home."
  ],


  // ==========================================================
  // MODERATE — 10
  // ==========================================================

  moderate: [
    "Charlie chose a cheerful cherry chair.",
    "Nina neatly knitted nine navy neckties.",
    "The busy baker baked beautiful blueberry bread.",
    "Five funny frogs flipped fresh flowers.",
    "Riya rarely reads red recipe books.",
    "Larry likes lemon lollipops in London.",
    "Clever Charlie chased cheerful chickens.",
    "Seven small sailors sailed silently across the sea.",
    "Quick queens quietly questioned quirky quails.",
    "Bright blue birds boldly brought brown bread."
  ],


  // ==========================================================
  // HARD — 10
  // ==========================================================

  hard: [
    "Thirty thirsty thinkers thoroughly thought through three tricky theories.",
    "Seven sneaky squirrels swiftly switched shiny shoes.",
    "The brilliant bluebird bravely broke the brittle branch.",
    "Clever Clara carefully carried crispy crackers across the crowded classroom.",
    "Three thick thieves threw thirty-three thin threads.",
    "Brisk British brothers brought bright brass brushes.",
    "Strict students struggled to straighten strange strings.",
    "Twenty tiny turtles tried to travel through thick thorny thickets.",
    "The tricky tailor trimmed three twisted trousers with tiny threads.",
    "The thirty-three thieves thought that they thrilled the throne throughout Thursday."
  ]

};


// ============================================================
// RANDOM PICK
// ============================================================

function pickRandom(array, count) {

  return [...array]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

}


// ============================================================
// BUILD 5 SENTENCES
//
// 2 Easy
// 2 Moderate
// 1 Hard
// ============================================================

export function buildSentenceSet() {

  const selected = [

    ...pickRandom(SENTENCES.easy, 2).map(text => ({
      text,
      difficulty: "Easy"
    })),

    ...pickRandom(SENTENCES.moderate, 2).map(text => ({
      text,
      difficulty: "Moderate"
    })),

    ...pickRandom(SENTENCES.hard, 1).map(text => ({
      text,
      difficulty: "Hard"
    }))

  ];


  // Randomize the order of all 5 rounds

  return selected.sort(
    () => Math.random() - 0.5
  );

}
