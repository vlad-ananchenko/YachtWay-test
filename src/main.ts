import { enhanceAccessibility } from "./controls/accessibility";
import { enhanceComboDependencies } from "./controls/comboDependencies";
import { enhanceControls } from "./controls/enhance";
import { ListingHeat } from "./listing-heat/ListingHeat";

enhanceControls(document);
enhanceAccessibility(document);
enhanceComboDependencies(document);

const heat = document.querySelector<HTMLElement>(".heat");
const form = document.querySelector<HTMLElement>(".form");
if (heat && form) new ListingHeat(heat, form);
