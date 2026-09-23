export const SENTENCES = {
  easy: [
    "Practice makes progress.", "Good communication builds trust.", "Speak clearly and calmly.", "Learning takes daily practice.", "Teamwork makes every task easier.", "Confidence grows with practice.", "Listen carefully before you speak.", "Small steps create big changes.", "A clear message avoids confusion.", "Kind words make conversations better."
  ],
  moderate: [
    "Effective communication requires clarity and confidence.", "Technology changes the way we communicate every day.", "Consistent practice improves both accuracy and fluency.", "Good speakers pay attention to rhythm and pronunciation.", "A thoughtful response can make a difficult conversation easier.", "Successful teams communicate their ideas with precision.", "Public speaking becomes easier when preparation is consistent.", "Clear pronunciation helps listeners understand unfamiliar ideas.", "Learning a new language requires patience and regular exposure.", "Strong communication skills are useful in every profession."
  ],
  hard: [
    "Artificial intelligence is transforming how people learn, work, and communicate.",
    "Accurate pronunciation requires careful listening, controlled breathing, and deliberate practice.",
    "Innovative solutions often emerge when diverse perspectives are combined thoughtfully.",
    "Professional communication depends on clarity, confidence, context, and active listening.",
    "Technological progress creates opportunities while also demanding responsible communication."
  ]
};

export function buildSentenceSet() {
  const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  return [...pick(SENTENCES.easy, 2).map(text => ({text, difficulty:"Easy"})), ...pick(SENTENCES.moderate, 2).map(text => ({text, difficulty:"Moderate"})), ...pick(SENTENCES.hard, 1).map(text => ({text, difficulty:"Hard"}))].sort(() => Math.random() - 0.5);
}
