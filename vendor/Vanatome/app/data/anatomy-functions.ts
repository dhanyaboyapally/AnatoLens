export const AUTHORED_FUNCTIONS: Readonly<Record<string, string>> = {
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
  "Function information has not yet been added for this structure.";

export const SYSTEM_FUNCTION_ROLES: Readonly<Record<string, string>> = {
  cardiovascular: "This structure contributes to moving blood, delivering oxygen and nutrients, or returning blood through the cardiovascular system. Its specific role depends on the structure.",
  digestive: "This structure contributes to processing food, absorbing nutrients, or moving digestive contents through the digestive system. Its specific role depends on the structure.",
  endocrine: "This structure contributes to hormone production, release, or regulation within the endocrine system. Its specific role depends on the structure.",
  lymphatic: "This structure contributes to immune defense or the collection and return of tissue fluid within the lymphatic system. Its specific role depends on the structure.",
  muscular: "This structure contributes to producing or controlling movement, maintaining posture, or stabilizing a body region. Its specific action has not been verified for this structure.",
  nervous: "This structure contributes to receiving, processing, or transmitting information within the nervous system. Its specific role depends on the structure.",
  reproductive: "This structure contributes to reproductive processes, including gamete production, hormone signaling, or support of reproduction. Its specific role depends on the structure.",
  respiratory: "This structure contributes to conducting air or exchanging gases within the respiratory system. Its specific role depends on the structure.",
  skeletal: "This structure contributes to support, protection, movement leverage, or mineral storage within the skeletal system. Its specific role depends on the structure.",
  urinary: "This structure contributes to filtering blood, regulating fluid balance, or forming and eliminating urine within the urinary system. Its specific role depends on the structure.",
  "regional-anatomy": "This is a mapped regional anatomy structure; a physiological function is not assigned at this category level.",
};

export const GENERAL_ROLE_NOTE =
  "General system-level context only; this is not a verified function for the individual structure.";