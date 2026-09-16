/**
 * Pronunciation Battle - Sentence Repository & Random Generator
 * Generates 5 sentences per team: 2 Easy, 2 Moderate, 1 Hard
 */

export const SENTENCE_BANK = {
  Easy: [
    {
      id: 'e1',
      text: "The sun shines bright over the blue ocean.",
      phonetic: "ðə sʌn ʃaɪnz braɪt ˈoʊvər ðə bluː ˈoʊʃən",
      tip: "Focus on clear vowel sounds and the 'sh' in shines."
    },
    {
      id: 'e2',
      text: "She sells sweet apples at the local market.",
      phonetic: "ʃiː sɛlz swiːt ˈæpəlz æt ðə ˈloʊkəl ˈmɑːrkət",
      tip: "Distinctly pronounce the initial 's' and 'sw' sounds."
    },
    {
      id: 'e3',
      text: "We love learning new languages together every day.",
      phonetic: "wiː lʌv ˈlɜːrnɪŋ njuː ˈlæŋɡwɪdʒəz təˈɡɛðər ˈɛvri deɪ",
      tip: "Keep the rhythm steady and emphasize 'learning'."
    },
    {
      id: 'e4',
      text: "A quick cup of hot tea helps me focus.",
      phonetic: "ə kwɪk kʌp ʌv hɑːt tiː hɛlps miː ˈfoʊkəs",
      tip: "Crisp 'k' and 't' consonants are essential here."
    },
    {
      id: 'e5',
      text: "Bright green leaves dance gently in the summer breeze.",
      phonetic: "braɪt ɡriːn liːvz dæns ˈdʒɛntli ɪn ðə ˈsʌmər briːz",
      tip: "Smooth connection between 'green' and 'leaves'."
    }
  ],

  Moderate: [
    {
      id: 'm1',
      text: "Peter Piper picked a peck of pickled peppers with passion.",
      phonetic: "ˈpiːtər ˈpaɪpər pɪkt ə pɛk ʌv ˈpɪkəld ˈpɛpərz wɪð ˈpæʃən",
      tip: "Master the plosive 'P' sound without over-aspirating."
    },
    {
      id: 'm2',
      text: "The enthusiastic polyglot fluently articulated three dialects.",
      phonetic: "ði ɪnˌθuːziˈæstɪk ˈpɑːliˌɡlɑːt ˈfluːəntli ɑːrˈtɪkjuleɪtəd θriː ˈdaɪəˌlɛkts",
      tip: "Pay careful attention to multisyllabic stress pattern."
    },
    {
      id: 'm3',
      text: "Six slippery snakes slid silently past the stone wall.",
      phonetic: "sɪks ˈslɪpəri sneɪks slɪd ˈsaɪləntli pæst ðə stoʊn wɔːl",
      tip: "Distinguish between 's', 'sl', and 'sn' blends smoothly."
    },
    {
      id: 'm4',
      text: "Cultural communication requires curiosity and empathetic listening.",
      phonetic: "ˈkʌltʃərəl kəˌmjuːnɪˈkeɪʃən rɪˈkwaɪərz ˌkjʊriˈɑːsəti ænd ˌɛmpəˈθɛtɪk ˈlɪsənɪŋ",
      tip: "Enunciate 'communication' and 'empathetic' clearly."
    },
    {
      id: 'm5',
      text: "The global conference hosted inspiring speeches on innovation.",
      phonetic: "ðə ˈɡloʊbəl ˈkɑːnfərəns ˈhoʊstəd ɪnˈspaɪərɪŋ ˈspiːtʃəz ɑːn ˌɪnəˈveɪʃən",
      tip: "Maintain accurate stress on 'inspiring' and 'innovation'."
    }
  ],

  Hard: [
    {
      id: 'h1',
      text: "The prerequisite for extraordinary multilingual proficiency is persistent practice.",
      phonetic: "ðə ˌpriːˈrɛkwəzət fɔːr ɪkˈstrɔːrdənɛri ˌmʌltiˈlɪŋɡwəl prəˈfɪʃənsi ɪz pərˈsɪstənt ˈpræktɪs",
      tip: "Challenging multisyllabic vocabulary; maintain steady pacing."
    },
    {
      id: 'h2',
      text: "Phenomenological investigations into linguistic variations yield illuminating insights.",
      phonetic: "fəˌnɑːmənəˈlɑːdʒɪkəl ɪnˌvɛstəˈɡeɪʃənz ˈɪntuː lɪŋˈɡwɪstɪk ˌvɛriˈeɪʃənz jiːld ɪˈluːməneɪtɪŋ ˈɪnsaɪts",
      tip: "High difficulty tongue-twister with academic jargon; articulate each syllable."
    },
    {
      id: 'h3',
      text: "Thirty-three thousand thankful thistles were thoughtfully sorted throughout Thursday.",
      phonetic: "ˈθɜːrti θriː ˈθaʊzənd ˈθæŋkfəl ˈθɪsəlz wɜːr ˈθɔːtfəli ˈsɔːrtəd θruːˈaʊt ˈθɜːrzdeɪ",
      tip: "Extreme 'TH' sound challenge; focus on tongue position against upper teeth."
    },
    {
      id: 'h4',
      text: "Intercultural negotiation demands psychological dexterity, meticulous vocabulary, and poise.",
      phonetic: "ˌɪntərˈkʌltʃərəl nɪˌɡoʊʃiˈeɪʃən dɪˈmændz ˌsaɪkəˈlɑːdʒɪkəl dɛkˈstɛrəti mɪˈtɪkjələs vəˈkæbjəˌlɛri ænd pɔɪz",
      tip: "Complex syntactic flow; preserve rhythm between clauses."
    }
  ]
};

/**
 * Generate 5 sentences for a team: 2 Easy, 2 Moderate, 1 Hard.
 * Returns an array of 5 sentence objects with round index and difficulty assigned.
 */
export function generateTeamSentenceSet() {
  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const easyPool = shuffleArray(SENTENCE_BANK.Easy).slice(0, 2);
  const modPool = shuffleArray(SENTENCE_BANK.Moderate).slice(0, 2);
  const hardPool = shuffleArray(SENTENCE_BANK.Hard).slice(0, 1);

  const selectedSentences = [
    { round: 1, difficulty: 'Easy', ...easyPool[0] },
    { round: 2, difficulty: 'Easy', ...easyPool[1] },
    { round: 3, difficulty: 'Moderate', ...modPool[0] },
    { round: 4, difficulty: 'Moderate', ...modPool[1] },
    { round: 5, difficulty: 'Hard', ...hardPool[0] }
  ];

  return selectedSentences;
}
