// SERVER ONLY. Never import this file from a client component.
// It holds the answers, the hints and the reveal text.

import { hasAny, normKey, normLetters, normTime, normText } from "./grade";

export const HINT_COST = 15;
export const ANSWER_POINTS = 60; // per puzzle, for the correct answer
export const REASON_POINTS = 40; // per puzzle, for the written explanation
export const FIELD_POINTS = 12; // per structured report field (6 fields)
export const REPORT_TEXT_POINTS = 14; // per written report answer (2 answers)
export const VERIFY_POINTS = 50;

export type Answers = Record<string, string>;

// A rubric is a list of keyword groups. A group is matched when ANY keyword appears.
export type Rubric = string[][];

interface PuzzleKey {
  check: (a: Answers) => boolean;
  rubric: Rubric;
  hints: [string, string, string];
}

const NOT_COUNTED = [
  "not counted", "not individually", "didn't count", "did not count", "never counted",
  "nobody counted", "no one counted", "wasn't counted", "was not counted", "not checked",
  "didn't check", "did not check", "weren't counted", "were not counted", "no count",
];

export const PUZZLE_KEYS: Record<number, PuzzleKey> = {
  1: {
    check: (a) => normTime(a.check) === "10:20" && normTime(a.sighting) === "10:12",
    rubric: [
      ["10:20", "1020", "room check", "room-check", "signed", "signature", "sheet"],
      NOT_COUNTED,
      ["10:12", "1012", "sighting", "saw", "seen", "physically", "see"],
    ],
    hints: [
      "Sort the cards by timestamp first.",
      "Keep the room-check time separate from a confirmed sighting.",
      "Which card explicitly says someone physically saw the key?",
    ],
  },
  2: {
    check: (a) => normLetters(a.word) === "BLUE",
    rubric: [
      ["unsigned", "no signature", "not signed", "anonymous", "no name", "no named", "unnamed", "nobody signed", "no one signed", "didn't sign", "did not sign"],
      ["witness", "source", "evidence", "proof", "saw", "observation", "verified", "record", "reliable", "hearsay", "unsupported", "claim"],
      ["not prove", "doesn't prove", "does not prove", "cannot prove", "can't prove", "no proof", "isn't proof", "is not proof", "unsupported", "unverified", "rumor", "rumour", "just a claim", "only a claim"],
    ],
    hints: [
      "Apply the evidence standard printed on the card.",
      "A source can be reliable about one fact without proving another.",
      "Put the four supported cards in time order and read their letters.",
    ],
  },
  3: {
    check: (a) =>
      normText(a.nora) === "entrance" &&
      normText(a.leo) === "stage" &&
      normText(a.sam) === "projector" &&
      normText(a.maya) === "supply",
    rubric: [
      ["nora"],
      ["entrance", "door"],
      ["maya"],
      ["supply"],
      ["eliminat", "rule", "ruled", "cross", "cannot", "can't", "not at", "remaining", "left over", "only", "instead"],
    ],
    hints: [
      "Cross out every location each person cannot occupy.",
      "Nora cannot be at the stage, the supply area or the projector table.",
      "Once Nora and Maya are placed, use the one-person-per-place rule for Leo and Sam.",
    ],
  },
  4: {
    check: (a) => normLetters(a.place) === "SUPPLYCABINET",
    rubric: [
      ["first letter", "first letters", "first character", "initial", "1st letter", "starting letter", "begin", "beginning", "start of each", "acrostic"],
      ["line", "each line", "every line", "sentence", "downward", "vertical", "vertically", "read down", "going down"],
    ],
    hints: [
      "Use the separate clue about where a sentence begins.",
      "Look at the first character of each line.",
      "Read the first letters vertically and separate the two words.",
    ],
  },
  5: {
    check: (a) => normKey(a.code) === "ORBIT27",
    rubric: [
      ["discover"],
      ["design"],
      ["test"],
      ["share"],
      ["reflect"],
      ["before", "after", "then", "first", "last", "follows", "followed", "depends", "comes", "precede", "next", "order"],
    ],
    hints: [
      "The memo describes which stages depend on earlier stages.",
      "Design follows discovery; testing follows design; sharing follows testing.",
      "Reflection comes after sharing. Then read the letters and add the numbers.",
    ],
  },
};

// Final report: structured fields are exact; written answers use rubrics.
export const REPORT_FIELD_CHECKS: Record<string, (v: string) => boolean> = {
  who: (v) => hasAny(v, ["maya"]),
  folder: (v) => hasAny(v, ["blue"]),
  place: (v) => hasAny(v, ["supply"]) && hasAny(v, ["cabinet"]),
  check: (v) => normTime(v) === "10:20",
  sighting: (v) => normTime(v) === "10:12",
  key: (v) => normKey(v) === "ORBIT27",
};

export const REPORT_TEXT_RUBRICS: Record<string, { max: number; rubric: Rubric }> = {
  evidence: {
    max: REPORT_TEXT_POINTS,
    rubric: [
      ["10:12", "1012", "sighting", "saw", "seen"],
      ["10:20", "room check", "room-check", "signed", "counted", "count"],
      ["blue", "folder", "orbit", "note", "supply", "cabinet", "logic", "grid", "first letter", "acrostic", "maya"],
    ],
  },
  noprove: {
    max: REPORT_TEXT_POINTS,
    rubric: [
      ["not", "doesn't", "does not", "cannot", "can't", "no"],
      ["key", "present", "there", "on the desk", "counted", "individually", "physically"],
    ],
  },
  verify: {
    max: VERIFY_POINTS,
    rubric: [
      ["no", "not", "cannot", "can't"],
      ["counted", "count", "individually", "individual", "checked the key"],
      ["room check", "room-check", "signed", "signature", "sheet", "recorded"],
    ],
  },
};

export const REVEAL = {
  note:
    "I hid the presentation key in the blue folder inside the supply cabinet at 10:20. I was worried the showcase team would use an outdated presentation. I planned to return it after someone checked the materials. I should have told the club lead instead of hiding it. (Maya)",
  summary: [
    "The last confirmed sighting was at 10:12.",
    "The 10:20 room check did not count the key individually.",
    "The supported evidence cards spelled BLUE.",
    "The logic grid placed Maya in the supply area.",
    "The hidden message gave SUPPLY CABINET.",
    "The process cards rebuilt the key: ORBIT-27.",
  ],
};
