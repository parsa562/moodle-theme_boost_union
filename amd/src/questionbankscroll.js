// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Adds a synchronized horizontal scrollbar above wide Question bank tables.
 *
 * @module     theme_boost_union/questionbankscroll
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    /**
     * Initialise the Question bank top scrollbar.
     */
    const init = function() {
        const tableWrapper = document.querySelector('#question_table');

        if (!tableWrapper || document.querySelector('.boost-union-qbank-top-scroll')) {
            return;
        }

        tableWrapper.classList.add('boost-union-qbank-table-scroll');

        const topScroll = document.createElement('div');
        topScroll.className = 'boost-union-qbank-top-scroll';
        topScroll.setAttribute('aria-hidden', 'true');

        const spacer = document.createElement('div');
        spacer.className = 'boost-union-qbank-top-scroll-spacer';

        topScroll.appendChild(spacer);

        const stickyZone = document.createElement('div');
        stickyZone.className = 'qbank-sticky-scroll-zone';
        stickyZone.appendChild(topScroll);

        tableWrapper.parentNode.insertBefore(stickyZone, tableWrapper);

        const updateWidth = function() {
            spacer.style.width = tableWrapper.scrollWidth + 'px';

            if (tableWrapper.scrollWidth > tableWrapper.clientWidth) {
                topScroll.hidden = false;
            } else {
                topScroll.hidden = true;
            }
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

    return {
        init: init
    };
});
