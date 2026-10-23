// Everything in this file is SAFE to send to the browser: no answers, no hints.
// Answers, hints and grading rubrics live in keys.ts (server only).

export type Variant = "A" | "B" | "C";

export interface Card {
  id: string;
  badge?: string; // big letter / time stamp on the card
  title?: string;
  text: string;
  meta?: string;
}

export type Block =
  | { type: "cards"; title?: string; cards: Card[]; shuffle?: boolean }
  | { type: "list"; title?: string; items: string[]; shuffle?: boolean }
  | { type: "note"; title?: string; lines: string[]; footer?: string; numbered?: boolean } // lines keep their order
  | { type: "callout"; text: string };

export interface Field {
  key: string;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[]; // renders a <select>
}

export interface PuzzleDef {
  id: 1 | 2 | 3 | 4 | 5;
  title: string;
  envelope: string; // what the opening envelope says
  story: string;
  blocks: Block[];
  fields: Field[];
  explain: { prompt: string; required: boolean };
}

export const STORY_INTRO =
  "Minutes before the Innovation Showcase, the final presentation key has vanished. Four organizers had access to the area: Nora, Leo, Sam and Maya. Five envelopes hold the evidence. Open them in order, follow the evidence rather than the rumors, and find out what happened.";

const PLACES = [
  { value: "", label: "Choose a place" },
  { value: "entrance", label: "Entrance" },
  { value: "stage", label: "Stage" },
  { value: "projector", label: "Projector table" },
  { value: "supply", label: "Supply area" },
];

const PUZZLES: PuzzleDef[] = [
  {
    id: 1,
    title: "The timeline",
    envelope: "Envelope 1: the organizers’ logbook",
    story:
      "Five entries were torn out of the organizers’ logbook and shuffled. Sort them from earliest to latest, then decide what each one actually proves. A signature is not the same as a sighting.",
    blocks: [
      {
        type: "cards",
        title: "Logbook entries",
        shuffle: true,
        cards: [
          {
            id: "p1-c3",
            badge: "10:15",
            text: "Maya asks a volunteer where the spare folders are stored.",
          },
          {
            id: "p1-c5",
            badge: "10:25",
            text: "Nora tells the club lead that the presentation key is missing.",
          },
          {
            id: "p1-c1",
            badge: "10:10",
            text: "Leo confirms the projector is ready and the slides open correctly.",
          },
          {
            id: "p1-c4",
            badge: "10:20",
            text: "The room-check sheet is signed by Sam: “Area checked.” A line underneath says: “Individual items, including the key, not counted.”",
          },
          {
            id: "p1-c2",
            badge: "10:12",
            text: "{vol}, a volunteer, physically sees the presentation key lying on the desk next to the laptop.",
          },
        ],
      },
    ],
    fields: [
      { key: "check", label: "Time of the last recorded room check", placeholder: "HH:MM" },
      { key: "sighting", label: "Time of the last confirmed sighting of the key", placeholder: "HH:MM" },
    ],
    explain: {
      prompt: "In one or two sentences: why are these two times different?",
      required: false,
    },
  },
  {
    id: 2,
    title: "Fact or rumor?",
    envelope: "Envelope 2: the evidence wall",
    story:
      "Six cards were pinned to the evidence wall. Only the ones that meet the standard below can be trusted. Put the trusted cards in time order and read their letters.",
    blocks: [
      {
        type: "callout",
        text: "Evidence standard: a card is supported only if it names its source (a person or a signed record) and describes something that was directly seen, checked or recorded. Anything else is a rumor.",
      },
      {
        type: "cards",
        title: "Evidence wall",
        shuffle: true,
        cards: [
          {
            id: "p2-b",
            badge: "B",
            title: "10:05",
            text: "Signed checklist (Nora): “Presentation key is on the showcase desk.”",
          },
          {
            id: "p2-s",
            badge: "S",
            title: "10:11",
            text: "Overheard in the corridor: “I think the key was already gone by ten.” The speaker was not identified.",
          },
          {
            id: "p2-u",
            badge: "U",
            title: "10:15",
            text: "Signed inventory (Sam): “Blue folder assigned to showcase materials.”",
          },
          {
            id: "p2-m",
            badge: "M",
            title: "10:18",
            text: "Unsigned note left on the lost-and-found shelf: “Maya carried the folder to the supply area.”",
          },
          {
            id: "p2-l",
            badge: "L",
            title: "10:10",
            text: "Leo, a named volunteer: “I ran the projector check myself. It is done.”",
          },
          {
            id: "p2-e",
            badge: "E",
            title: "10:20",
            text: "Signed room-check sheet (Sam): “Area checked.” The key was not individually counted.",
          },
        ],
      },
    ],
    fields: [{ key: "word", label: "Hidden word from the supported cards", placeholder: "Four letters" }],
    explain: {
      prompt:
        "Required: why does the unsigned note about Maya not prove she carried the folder?",
      required: true,
    },
  },
  {
    id: 3,
    title: "Four people, four places",
    envelope: "Envelope 3: witness statements",
    story:
      "At 10:20 each organizer stood at exactly one of four places: the entrance, the stage, the projector table or the supply area. No two people shared a place. Use all six statements to match everyone to their place.",
    blocks: [
      {
        type: "list",
        title: "Witness statements",
        shuffle: true,
        items: [
          "Neither Nora nor Maya was at the stage.",
          "The person at the projector table was not Nora and not Maya.",
          "Nora was not in the supply area.",
          "Leo was not at the entrance.",
          "Leo was not in the supply area.",
          "Sam was not at the stage.",
        ],
      },
    ],
    fields: [
      { key: "nora", label: "Nora", options: PLACES },
      { key: "leo", label: "Leo", options: PLACES },
      { key: "sam", label: "Sam", options: PLACES },
      { key: "maya", label: "Maya", options: PLACES },
    ],
    explain: {
      prompt: "In one or two sentences: how did you work out where Nora and Maya were?",
      required: false,
    },
  },
  {
    id: 4,
    title: "The hidden instruction",
    envelope: "Envelope 4: the anonymous note",
    story:
      "An anonymous note was slipped under the showcase door at 10:22. Our analyst says it hides a location. A card clipped to it reads: “A detective begins where a sentence begins.” The line numbers are ours; they are not part of the note.",
    blocks: [
      {
        type: "note",
        numbered: true,
        title: "Anonymous note",
        lines: [
          "Sorry to write this without a name. I hope you will understand.",
          "Until the showcase begins, there is still time to put things right.",
          "Please do not blame the volunteers; they did nothing wrong.",
          "Plans changed quickly this morning and I made a hasty choice.",
          "Looking back, I should have asked someone before acting.",
          "You may think the answer is complicated, but it is not.",
          "Clues are easy to miss when everyone is rushing around.",
          "Anyone who reads carefully will find what they are looking for.",
          "By the time you read this, the final slides should already be safe.",
          "I never meant for the showcase to be delayed.",
          "Nothing was damaged, and nothing was lost for good.",
          "Every part of the plan was meant to protect the presentation.",
          "Thank you for being patient with whoever wrote this.",
        ],
      },
    ],
    fields: [{ key: "place", label: "Hidden location (two words)", placeholder: "Two words" }],
    explain: {
      prompt: "In one or two sentences: how did you decode the note?",
      required: false,
    },
  },
  {
    id: 5,
    title: "Rebuild the presentation key",
    envelope: "Envelope 5: the innovation lab memo",
    story:
      "The presentation key was built from five innovation stages. The stage cards were shuffled and the memo explains how they depend on each other. Put the stages in order, read each stamp letter, and add the energy numbers.",
    blocks: [
      {
        type: "note",
        title: "Innovation lab memo: how a good idea travels",
        lines: [
          "Nobody should start designing before the real needs have been discovered.",
          "A design can only be tested once it exists.",
          "Nothing is shared with the club until it has been tested.",
          "Reflection comes last, after the result has been shared.",
        ],
        footer:
          "Only the stamp letter and the energy number count. File numbers are for the archive.",
      },
      {
        type: "cards",
        title: "Stage cards",
        shuffle: true,
        cards: [
          { id: "p5-design", badge: "R", title: "Design", text: "Energy 6", meta: "File no. 41" },
          { id: "p5-reflect", badge: "T", title: "Reflect", text: "Energy 6", meta: "File no. 17" },
          { id: "p5-discover", badge: "O", title: "Discover", text: "Energy 4", meta: "File no. 23" },
          { id: "p5-share", badge: "I", title: "Share", text: "Energy 3", meta: "File no. 35" },
          { id: "p5-test", badge: "B", title: "Test", text: "Energy 8", meta: "File no. 52" },
        ],
      },
    ],
    fields: [{ key: "code", label: "Presentation key", placeholder: "WORD-00" }],
    explain: {
      prompt: "In one or two sentences: how did the memo give you the order of the stages?",
      required: false,
    },
  },
];

export const REPORT_FIELDS: Field[] = [
  { key: "who", label: "Who hid the key?" },
  { key: "folder", label: "Which folder?" },
  { key: "place", label: "Where was it hidden?" },
  { key: "check", label: "Last recorded room-check time", placeholder: "HH:MM" },
  { key: "sighting", label: "Latest confirmed physical sighting", placeholder: "HH:MM" },
  { key: "key", label: "Final presentation key", placeholder: "WORD-00" },
];

export const REPORT_TEXT_FIELDS: Field[] = [
  { key: "evidence", label: "Strongest supporting evidence (two or three sentences)" },
  { key: "noprove", label: "What does the room-check sheet not prove?" },
  {
    key: "verify",
    label:
      "Verification: can the signed room-check at 10:20 prove the key was still on the showcase desk? Why or why not?",
  },
];

const VOLUNTEERS: Record<Variant, string> = { A: "Priya", B: "Daniel", C: "Aya" };

// Variants stop neighbouring teams from copying: same answers, different order and names.
function arrange<T>(variant: Variant, items: T[]): T[] {
  if (variant === "A") return items;
  if (variant === "B") return [...items].reverse();
  return [...items.slice(2), ...items.slice(0, 2)];
}

export function getPuzzle(id: number, variant: Variant): PuzzleDef | null {
  const base = PUZZLES.find((p) => p.id === id);
  if (!base) return null;
  const vol = VOLUNTEERS[variant];
  const fill = (s: string) => s.replace("{vol}", vol);
  return {
    ...base,
    blocks: base.blocks.map((b): Block => {
      if (b.type === "cards") {
        const cards = b.shuffle ? arrange(variant, b.cards) : b.cards;
        return { ...b, cards: cards.map((c) => ({ ...c, text: fill(c.text) })) };
      }
      if (b.type === "list") {
        return { ...b, items: b.shuffle ? arrange(variant, b.items) : b.items };
      }
      return b;
    }),
  };
}

export const PUZZLE_COUNT = PUZZLES.length;
