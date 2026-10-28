// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Managing course categories and courses: a visible label above each dropdown of the bulk
 * actions (which categories to sort, how to sort the categories, how to sort their courses).
 * Moodle gives these dropdowns only a label for screen readers (aria-label); its words are shown.
 *
 * @module     theme_boost_union/coursemanagement
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    return {
        /**
         * Add the labels.
         */
        init: function() {
            document.querySelectorAll('#course-category-listings .bulk-actions select[aria-label]').forEach(function(select) {
                if (!select.id || select.closest('.salek-cm-field')) {
                    return;
                }
                const label = document.createElement('label');
                label.className = 'salek-cm-label';
                label.htmlFor = select.id;
                label.textContent = select.getAttribute('aria-label');
                select.parentElement.classList.add('salek-cm-field');
                select.before(label);
            });
        }
    };
});
