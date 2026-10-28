// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Empty list tables: Moodle shows only the header row (and a blank filler row) of some tables
 * that have no rows ("Other users"), which looks broken. Add one row saying "Nothing to display".
 *
 * @module     theme_boost_union/emptytables
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['core/str'], function(Str) {
    "use strict";

    /**
     * Add the message row to each empty table of the page content.
     */
    const init = function() {
        // Empty: no rows, or only Moodle's blank filler row (hidden by the theme CSS).
        const tables = Array.from(document.querySelectorAll('#region-main table.generaltable')).filter(function(table) {
            return table.tHead && table.tBodies.length === 1 && Array.from(table.tBodies[0].rows).every(function(row) {
                return !row.textContent.trim() && !row.querySelector('input, select, img, a');
            });
        });
        if (!tables.length) {
            return;
        }
        Str.get_string('nothingtodisplay', 'core').then(function(text) {
            tables.forEach(function(table) {
                const cell = table.tBodies[0].insertRow().insertCell();
                cell.className = 'salek-empty-cell';
                cell.colSpan = table.tHead.rows[0].cells.length;
                cell.textContent = text;
            });
            return text;
        }).catch(function() {
            // Without the string the table stays as Moodle drew it.
        });
    };

    return {
        init: init
    };
});
