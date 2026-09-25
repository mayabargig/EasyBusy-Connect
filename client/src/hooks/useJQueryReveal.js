import $ from "jquery";
import { useEffect } from "react";

/**
 * Adds a small entrance transition after React renders server-backed cards.
 * jQuery stays inside the referenced container and never removes DOM nodes
 * owned by React.
 */
export function useJQueryReveal(containerRef, dependency) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const timers = [];
    const $items = $(container).find("[data-jquery-reveal]");

    $items.removeClass("is-visible").addClass("jquery-reveal");
    $items.each((index, element) => {
      const timer = window.setTimeout(() => {
        $(element).addClass("is-visible");
      }, index * 55);
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      $items.removeClass("jquery-reveal is-visible");
    };
  }, [containerRef, dependency]);
}
