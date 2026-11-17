export type PlantQuestion = {
  question: string;
  answer: string;
};

export type ConservationStatusGuide = {
  status: string;
  meaning: string;
};

export const visitorPlantQuestions: PlantQuestion[] = [
  {
    question: "What does published mean?",
    answer:
      "Published species and observations have been checked and approved by a conservation officer. Pending records stay out of the public guide until that review is complete.",
  },
  {
    question: "How do I read a scientific name?",
    answer:
      "The first word is the genus and the second word identifies the species. Scientific names are used because common names can differ between places.",
  },
  {
    question: "What is a plant family?",
    answer:
      "A family is a group of related plants. The family name appears at the end of the taxonomy line on a species page.",
  },
  {
    question: "What does conservation status mean?",
    answer:
      "It is a label for how threatened a species is. Status labels can come from different assessments, so check the latest source before relying on one.",
  },
  {
    question: "Why can't I see exact plant locations?",
    answer:
      "Some locations may be generalised or withheld to reduce harm to sensitive plants. The public map shows approved observations only.",
  },
  {
    question: "Can I touch or eat wild plants?",
    answer:
      "Do not touch, pick or eat wild plants. Some plants are fragile, protected or difficult to identify safely.",
  },
  {
    question: "What should I do if I find a rare plant?",
    answer:
      "Leave it undisturbed. Note the location only if it is safe to do so, and report the sighting to Niah National Park staff.",
  },
  {
    question: "Why are some species missing?",
    answer:
      "The catalogue is a growing record of verified species. It is not a complete list of every plant in the park.",
  },
  {
    question: "Why do some species have no photo?",
    answer:
      "A photo appears when a suitable image has been reviewed and published. Some species pages may stay without an image for now.",
  },
  {
    question: "How do I report an error?",
    answer:
      "Use the contact route provided by Niah National Park or tell a park staff member. Include the species page and what looks wrong.",
  },
];

export const conservationStatusGuide: ConservationStatusGuide[] = [
  {
    status: "Least Concern",
    meaning: "Not currently considered threatened.",
  },
  {
    status: "Near Threatened",
    meaning: "Close to becoming threatened.",
  },
  {
    status: "Vulnerable",
    meaning: "Facing a high risk of extinction in the wild.",
  },
  {
    status: "Endangered",
    meaning: "Facing a very high risk of extinction in the wild.",
  },
  {
    status: "Critically Endangered",
    meaning: "Facing an extremely high risk of extinction in the wild.",
  },
  {
    status: "Data Deficient",
    meaning: "There is not enough information to assess the risk.",
  },
];

const speciesPlantQuestions: Record<string, PlantQuestion[]> = {
  "rafflesia tuan-mudae": [
    {
      question: "What is Rafflesia tuan-mudae?",
      answer:
        "It is a parasitic plant known for producing one of the largest flowers in the world. It is recorded in Borneo, including Niah National Park.",
    },
    {
      question: "Why is it unusual?",
      answer:
        "It has no ordinary leaves or stem. It lives inside a host vine, and only the flower emerges.",
    },
    {
      question: "Where does it grow?",
      answer:
        "It grows on specific host vines in forest habitats. Exact locations are not shown publicly for sensitive plants.",
    },
    {
      question: "When does it flower?",
      answer:
        "Flowering is unpredictable. Check with park guides or staff before planning a visit.",
    },
    {
      question: "Is it endangered?",
      answer:
        "The catalogue lists it as Endangered. Conservation status can change, so check the latest assessment.",
    },
    {
      question: "Why does it smell?",
      answer:
        "Rafflesia flowers are often associated with a strong smell that attracts flies. Avoid assuming every flower smells the same.",
    },
    {
      question: "Is it safe to touch?",
      answer:
        "Do not touch or disturb the flower. It is fragile and protected.",
    },
    {
      question: "How can I help protect it?",
      answer:
        "Stay on trails, do not pick plants, and report sightings to park staff.",
    },
  ],
  "nepenthes lowii": [
    {
      question: "What is Nepenthes lowii?",
      answer:
        "It is a pitcher plant endemic to Borneo, named after Hugh Low.",
    },
    {
      question: "Why does it have a lid?",
      answer:
        "The lid produces nectar that attracts tree shrews. Their droppings provide nutrients for the plant.",
    },
    {
      question: "Where does it grow?",
      answer:
        "It is recorded in Borneo's forests. Check the species record for local habitat details.",
    },
    {
      question: "Is it endangered?",
      answer:
        "The catalogue lists it as Endangered. Check the latest assessment before relying on that status.",
    },
    {
      question: "Can I grow it at home?",
      answer:
        "Do not collect wild plants. If you want to grow pitcher plants, use cultivated sources and follow local rules.",
    },
    {
      question: "How can I help?",
      answer:
        "Stay on trails and do not disturb wild plants.",
    },
  ],
  "dipterocarpus grandiflorus": [
    {
      question: "What is Dipterocarpus grandiflorus?",
      answer:
        "It is a large timber tree in the dipterocarp family.",
    },
    {
      question: "Why are dipterocarps important?",
      answer:
        "They form important forest canopies and provide habitat for many other species.",
    },
    {
      question: "Is it threatened?",
      answer:
        "The catalogue lists it as Vulnerable. Check the latest assessment before relying on that status.",
    },
    {
      question: "Does it produce resin?",
      answer:
        "It is known for its resin and hardwood, which is why the species is valuable and vulnerable to pressure.",
    },
    {
      question: "How can I help?",
      answer:
        "Do not damage trees or remove plant material.",
    },
  ],
  "calanthe triplicata": [
    {
      question: "What is Calanthe triplicata?",
      answer:
        "It is a terrestrial orchid with tall spikes of small white flowers.",
    },
    {
      question: "Where does it grow?",
      answer:
        "It grows on shady forest floors.",
    },
    {
      question: "Can I pick it?",
      answer:
        "No. Do not pick or dig up wild orchids.",
    },
    {
      question: "Is it threatened?",
      answer:
        "The catalogue does not list a conservation status for this species. That does not mean it is safe to collect.",
    },
  ],
};

export function plantQuestionsForSpecies(
  scientificName: string | null | undefined,
): PlantQuestion[] {
  if (!scientificName) return [];
  return speciesPlantQuestions[scientificName.trim().toLowerCase()] ?? [];
}
