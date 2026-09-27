export const AUTHORED_FUNCTIONS: Readonly<Record<string, string>> = {
  "external-abdominal-obliques-external-abdominal-oblique-muscle-left":
    "Working with the paired abdominal muscles, it helps flex and rotate the trunk and compress abdominal contents. Unilateral contraction of the left external oblique contributes to rightward trunk rotation and left lateral flexion.",
  "deltoid-muscles-clavicular-part-of-deltoid-muscle-left":
    "The anterior (clavicular) portion of the deltoid contributes to shoulder flexion, horizontal adduction, and medial rotation of the arm.",
  "neck-muscles-external-part-of-thyro-arytenoid-muscle-right":
    "During phonation, thyroarytenoid activation shortens the vocal folds and contributes to slight vocal-fold adduction. Its effect on pitch depends on activation of other laryngeal muscles, especially the cricothyroid.",
};

export const FUNCTION_SOURCES: Readonly<Record<string, ReadonlyArray<{
  label: string;
  href: string;
  note: string;
}>>> = {
  "neck-muscles-external-part-of-thyro-arytenoid-muscle-right": [
    {
      label: "Chhetri & Neubauer, The Laryngoscope (2015), doi:10.1002/lary.25480",
      href: "https://doi.org/10.1002/lary.25480",
      note: "In-vivo canine phonation study: thyroarytenoid activation closed the membranous glottis; combined adductor activation was needed for complete closure.",
    },
    {
      label: "Palaparthi et al., Applied Sciences (2019), doi:10.3390/app9214671",
      href: "https://doi.org/10.3390/app9214671",
      note: "Fiber-gel model: thyroarytenoid activation shortened the vocal folds and slightly adducted them; pitch effects varied with cricothyroid activation.",
    },
  ],
};

export const FUNCTION_UNAVAILABLE =
  "A structure-specific function has not yet been verified for this atlas entry.";

export const SYSTEM_FUNCTION_ROLES: Readonly<Record<string, string>> = {
  cardiovascular: "system-level context: circulation of blood, oxygen, and nutrients",
  digestive: "system-level context: processing food, absorbing nutrients, and moving digestive contents",
  endocrine: "system-level context: hormone production, release, and regulation",
  lymphatic: "system-level context: immune defense and tissue-fluid return",
  muscular: "system-level context: movement, posture, and stabilization",
  nervous: "system-level context: receiving, processing, and transmitting information",
  reproductive: "system-level context: reproduction and related hormone signaling",
  respiratory: "system-level context: air conduction and gas exchange",
  skeletal: "system-level context: support, protection, leverage, and mineral storage",
  urinary: "system-level context: blood filtration and fluid balance",
  "regional-anatomy": "regional atlas entry; a physiological function is not assigned at this category level",
};

export const GENERAL_ROLE_NOTE =
  "General system-level context only; this is not a verified function for the individual structure.";