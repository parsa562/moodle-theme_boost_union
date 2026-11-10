// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Empty list tables: Moodle shows only the header row (and a blank filler row) of some tables
 * that have no rows ("Other users"), which looks broken. Add one row saying "Nothing to display";
 * where Moodle says why itself in a message right after the table (learning plans: "No learning
 * plans have been created yet"), that message in the row instead, and the message box left out
 * (there were two messages).
 *
 * Also an empty blog (blog/index.php): Moodle shows only its title (and "Add a new entry" in one's
 * own blog); say there are no entries under the title.
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
        emptyBlog();
        if (!tables.length) {
            return;
        }
        Str.get_string('nothingtodisplay', 'core').then(function(text) {
            tables.forEach(function(table) {
                const cell = table.tBodies[0].insertRow().insertCell();
                cell.className = 'salek-empty-cell';
                cell.colSpan = table.tHead.rows[0].cells.length;
                const box = table.closest('.table-responsive, .salek-table-scroll') || table;
                const message = box.nextElementSibling;
                if (message && message.matches('.alert-info') && !message.querySelector('a, button, form')
                        && message.textContent.trim()) {
                    cell.textContent = message.textContent.trim();
                    message.remove();
                } else {
                    cell.textContent = text;
                }
            });
            return text;
        }).catch(function() {
            // Without the string the table stays as Moodle drew it.
        });
    };

    /**
     * An empty blog: the "no entries" line under the title (above "Add a new entry" when it is there).
     */
    const emptyBlog = function() {
        const main = document.querySelector('#page-blog-index #region-main div[role="main"]');
        const title = main && main.querySelector(':scope > h2');
        if (!title) {
            return;
        }
        // Nothing after the title but "Add a new entry".
        const after = Array.from(main.children).slice(Array.from(main.children).indexOf(title) + 1);
        if (!after.every(function(el) {
            return el.matches('.addbloglink');
        })) {
            return;
        }
        Str.get_string('noentriesyet', 'core_blog').then(function(text) {
            const note = document.createElement('p');
            note.className = 'salek-empty-note';
            note.textContent = text;
            title.after(note);
            return text;
        }).catch(function() {
            // Without the string the page stays as Moodle drew it.
        });
    };

    return {
        init: init
    };
});
