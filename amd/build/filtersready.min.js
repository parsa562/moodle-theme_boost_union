// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Filter cards (core datafilter: question bank, participants and other lists): before its script
 * runs, Moodle draws one empty condition row and then replaces it with the real ones, so the
 * wrong row flashed on every load. The theme keeps the rows hidden until Moodle's scripts on the
 * page have finished, then marks the card ready (the stylesheet shows them after 3 seconds anyway).
 *
 * @module     theme_boost_union/filtersready
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    return {
        /**
         * Mark the filter cards of the page ready once Moodle's pending scripts are done.
         */
        init: function() {
            const cards = document.querySelectorAll('.filter-group[data-filterverb]');
            if (!cards.length) {
                return;
            }
            const started = Date.now();
            const check = function() {
                const pending = window.M && M.util && M.util.pending_js ? M.util.pending_js.length : 0;
                if (pending === 0 || Date.now() - started > 3000) {
                    cards.forEach(function(card) {
                        card.classList.add('salek-filters-ready');
                    });
                    return;
                }
                setTimeout(check, 50);
            };
            check();
        }
    };
});
