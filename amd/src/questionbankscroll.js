// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Adds a synchronized horizontal scrollbar to supported wide tables.
 *
 * Below the table, sticky at the bottom of the window. Question bank: added again when the
 * question list is reloaded (filters, sorting, paging replace it). Grader report: the cell menus
 * are also positioned against the window, so the scrolling table does not cut them off.
 *
 * @module     theme_boost_union/questionbankscroll
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    /**
     * Add the extra scrollbar to one table wrapper.
     *
     * @param {HTMLElement} tableWrapper The element that scrolls horizontally.
     * @param {Boolean} below Place the scrollbar below the table (sticky at the bottom).
     */
    const attach = function(tableWrapper, below) {
        tableWrapper.classList.add('boost-union-wide-table-scroll');

        const topScroll = document.createElement('div');
        topScroll.className = 'boost-union-qbank-top-scroll';
        topScroll.setAttribute('aria-hidden', 'true');

        const spacer = document.createElement('div');
        spacer.className = 'boost-union-qbank-top-scroll-spacer';

        topScroll.appendChild(spacer);

        const stickyZone = document.createElement('div');
        stickyZone.className = 'qbank-sticky-scroll-zone' + (below ? ' qbank-sticky-scroll-zone-bottom' : '');
        stickyZone.appendChild(topScroll);

        if (below) {
            tableWrapper.classList.add('boost-union-wide-table-scroll-below');
            tableWrapper.after(stickyZone);
        } else {
            tableWrapper.parentNode.insertBefore(stickyZone, tableWrapper);
        }

        const updateWidth = function() {
            spacer.style.width = tableWrapper.scrollWidth + 'px';

            const overflows = tableWrapper.scrollWidth > tableWrapper.clientWidth;
            topScroll.hidden = !overflows;
            stickyZone.hidden = below && !overflows;
        };

        let syncing = false;

        topScroll.addEventListener('scroll', function() {
            if (syncing) {
                return;
            }

            syncing = true;
            tableWrapper.scrollLeft = topScroll.scrollLeft;
            syncing = false;
        });

        tableWrapper.addEventListener('scroll', function() {
            if (syncing) {
                return;
            }

            syncing = true;
            topScroll.scrollLeft = tableWrapper.scrollLeft;
            syncing = false;
        });

        updateWidth();

        if ('ResizeObserver' in window) {
            const observer = new ResizeObserver(updateWidth);
            observer.observe(tableWrapper);

            const table = tableWrapper.querySelector('table');
            if (table) {
                observer.observe(table);
            }
        } else {
            window.addEventListener('resize', updateWidth);
        }
    };

    /**
     * Initialise the extra scrollbar for supported wide tables.
     */
    const init = function() {
        if (document.body.classList.contains('cm-type-qbank')) {
            const attachToQuestionTable = function() {
                const tableWrapper = document.querySelector('#question_table');
                if (tableWrapper && !tableWrapper.classList.contains('boost-union-wide-table-scroll')) {
                    attach(tableWrapper, true);
                }
            };
            attachToQuestionTable();

            // The question list is replaced when filters, sorting or the page change.
            const bankWindow = document.querySelector('.questionbankwindow');
            if (bankWindow && 'MutationObserver' in window) {
                new MutationObserver(attachToQuestionTable).observe(bankWindow, {childList: true, subtree: true});
            }
            return;
        }

        if (document.body.classList.contains('path-grade-report-grader')) {
            const tableWrapper = document.querySelector('.gradeparent');
            if (tableWrapper && !document.querySelector('.boost-union-qbank-top-scroll')) {
                attach(tableWrapper, true);

                // The table scrolls inside .gradeparent, which would cut off the cell menus (⋯):
                // let them position against the window. Bootstrap reads this when a menu is first
                // opened, so setting it now is enough.
                tableWrapper.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(function(toggle) {
                    toggle.setAttribute('data-bs-popper-config', '{"strategy":"fixed"}');
                });
            }
        }
    };

    return {
        init: init
    };
});
