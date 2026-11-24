// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Filter cards (core datafilter: question bank, participants and other lists): Moodle builds the
 * conditions in several steps after the page has loaded (one empty row, then none, then the real
 * ones, then their chosen values), so the card changed and the list under it jumped for 3
 * seconds. The theme keeps the rows hidden until Moodle's scripts on the page have finished and
 * the card has stopped changing, then marks the card ready, all of it at once (the stylesheet
 * shows them after 6 seconds anyway).
 *
 * The card's height then is kept in this browser: the next time, the template
 * salek_filter_space gives the card that height from the page's first drawing, so the list under
 * it starts where it ends.
 *
 * @module     theme_boost_union/filtersready
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    // (The card has stopped changing when nothing in it changed for this long.)
    const QUIET = 250;
    const LIMIT = 6000;

    /**
     * Show the card's rows and keep its height for the next time.
     *
     * @param {HTMLElement} card
     */
    const ready = function(card) {
        card.style.height = '';
        card.classList.remove('salek-filters-reserved');
        card.classList.add('salek-filters-ready');
        // (Counted as the template counts them: the content's cards.)
        const index = Array.from(document.querySelectorAll('#region-main .filter-group[data-filterverb]')).indexOf(card);
        if (index < 0) {
            return;
        }
        try {
            window.localStorage.setItem('salek-filter-height:' + location.pathname + ':' + index,
                String(Math.round(card.getBoundingClientRect().height)));
        } catch (e) {
            // (No storage: the card only starts without its height the next time.)
        }
    };

    return {
        /**
         * Mark the filter cards of the page ready once Moodle's pending scripts are done and the
         * cards have stopped changing.
         */
        init: function() {
            const cards = document.querySelectorAll('.filter-group[data-filterverb]');
            if (!cards.length) {
                return;
            }
            const started = Date.now();
            let changed = Date.now();
            const observer = new MutationObserver(function() {
                changed = Date.now();
            });
            cards.forEach(function(card) {
                observer.observe(card, {childList: true, subtree: true, attributes: true, characterData: true});
            });
            const check = function() {
                const pending = window.M && window.M.util && window.M.util.pending_js ? window.M.util.pending_js.length : 0;
                const late = Date.now() - started > LIMIT;
                if ((pending === 0 && Date.now() - changed >= QUIET) || late) {
                    observer.disconnect();
                    cards.forEach(ready);
                    return;
                }
                setTimeout(check, 50);
            };
            check();
        }
    };
});
