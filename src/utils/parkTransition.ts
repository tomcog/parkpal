import { flushSync } from "react-dom";

/**
 * Opens and closes the full-screen park sheet as a View Transition: the
 * card grows into the sheet on a damped spring while its photo flies into the
 * header. The animation itself is CSS - index.css, "Park sheet transition" -
 * styling the ::view-transition-* pseudo-elements for the elements
 * NationalParkCard names.
 *
 * Without View Transition support the change is applied directly and the
 * sheet fades (an @supports fallback in the same CSS). With reduced motion it
 * is applied directly, unanimated.
 */
export function runParkTransition(update: () => void) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !document.startViewTransition) {
    update();
    return;
  }
  // flushSync so React commits (sheet mounted/unmounted) before the browser
  // takes the "after" snapshot.
  document.startViewTransition(() => flushSync(update));
}
