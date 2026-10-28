// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * The month calendar (calendar page and the Dashboard's calendar block) with a side panel for
 * today: the weekday, the day's number large, the month, today's events and "New event"; a
 * "Today" button between the month arrows; the weekend's day names in red; a legend under the
 * month. (The course filter is placed in the month's row by the stylesheet.)
 *
 * Everything is taken from the month Moodle draws (today's cell, the weekday header, the arrows),
 * so it follows the site's calendar type and language. Moodle's own buttons are moved, not
 * copied: its click handlers (on the whole calendar) keep working. Moodle redraws the month
 * when another month is shown; the panel and the rest are then put in place again.
 *
 * @module     theme_boost_union/calendarpanel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    /**
     * An element with a class and, optionally, text.
     *
     * @param {String} tag
     * @param {String} className
     * @param {String} text
     * @return {HTMLElement}
     */
    const make = function(tag, className, text) {
        const el = document.createElement(tag);
        el.className = className;
        if (text !== undefined) {
            el.textContent = text;
        }
        return el;
    };

    /**
     * Today as last seen in a month (kept for months without today).
     * @type {Object|null}
     */
    let today = null;

    /**
     * Read today's weekday, number, month and events from the month, if today is in it.
     *
     * @param {HTMLElement} month The month's container.
     * @return {Object|null}
     */
    const readToday = function(month) {
        const cell = month.querySelector('td.today');
        if (!cell) {
            return null;
        }
        const head = month.querySelectorAll('table.calendarmonth thead th')[cell.cellIndex];
        const weekday = head ? (head.querySelector('.visually-hidden') || head).textContent.trim() : '';
        const number = cell.querySelector('.day-number');
        const current = month.querySelector('.calendar-controls .current');
        const previous = month.querySelector('.calendar-controls .previous');
        // The shown month (today's) follows the previous one; used by the "Today" button.
        let year = null;
        let monthnumber = null;
        if (previous && previous.dataset.month) {
            monthnumber = parseInt(previous.dataset.month, 10) + 1;
            year = parseInt(previous.dataset.year, 10);
            if (monthnumber > 12) {
                monthnumber = 1;
                year += 1;
            }
        }
        const events = Array.from(cell.querySelectorAll('.d-md-block [data-region="day-content"] li a[data-action="view-event"]'));
        return {
            weekday: weekday,
            number: number ? number.textContent.trim() : '',
            month: current ? current.textContent.trim() : '',
            events: events,
            year: year,
            monthnumber: monthnumber,
            timestamp: cell.dataset.dayTimestamp,
        };
    };

    /**
     * The side panel for today.
     *
     * @param {Object} strings
     * @param {HTMLElement|null} newEvent Moodle's "New event" button, moved into the panel.
     * @param {HTMLElement|null} footer The calendar block's links under the month, moved too.
     * @return {HTMLElement}
     */
    const panel = function(strings, newEvent, footer) {
        const aside = make('aside', 'salek-calpanel');
        aside.setAttribute('aria-label', strings.today);
        const top = make('div', 'salek-calpanel-top');
        top.append(make('span', 'salek-calpanel-label', strings.calendar));
        if (today) {
            top.append(make('span', 'salek-calpanel-pill', strings.today));
        }
        aside.append(top);
        if (today) {
            aside.append(make('div', 'salek-calpanel-weekday', today.weekday),
                make('div', 'salek-calpanel-day', today.number),
                make('div', 'salek-calpanel-month', today.month),
                make('hr', 'salek-calpanel-rule'),
                make('div', 'salek-calpanel-title', strings.events));
            if (today.events.length) {
                const list = make('ul', 'salek-calpanel-events');
                today.events.forEach(function(link) {
                    const item = make('li', '');
                    item.append(link.cloneNode(true));
                    list.append(item);
                });
                aside.append(list);
            } else {
                aside.append(make('div', 'salek-calpanel-empty', strings.nothing));
            }
        }
        if (newEvent || footer) {
            const actions = make('div', 'salek-calpanel-actions');
            if (newEvent) {
                actions.append(newEvent);
            }
            if (footer) {
                actions.append(footer);
            }
            aside.append(actions);
        }
        return aside;
    };

    /**
     * Put the panel, the "Today" button, the filter row, the weekend names and the legend in place.
     *
     * @param {HTMLElement} root The calendar (.maincalendar).
     * @param {Object} strings
     */
    const arrange = function(root, strings) {
        const month = root.querySelector('[id^="calendar-month-"]');
        const grid = month ? month.querySelector('table.calendarmonth') : null;
        if (!grid) {
            return; // Not the month view (day or upcoming).
        }
        // (Moodle draws a new table for every month shown: the mark tells a new month.)
        if (grid.dataset.salekArranged) {
            return;
        }
        grid.dataset.salekArranged = '1';
        today = readToday(month) || today;

        // The panel first in the month's container (Moodle listens to its buttons there), with
        // Moodle's "New event" button: from the toolbar when Moodle drew it anew, otherwise from
        // the previous panel (Moodle redraws only the month table when another month is shown).
        // The rest of the month goes into one column beside it.
        const old = month.querySelector(':scope > .salek-calpanel');
        const header = month.querySelector(':scope > .header');
        const newEvent = (header ? header.querySelector('[data-action="new-event-button"]') : null) ||
            (old ? old.querySelector('[data-action="new-event-button"]') : null);
        // The block's links ("Full calendar", "Import or export calendars") under the month: in
        // the panel, so the panel reaches the bottom of the card.
        const footer = (root.parentElement ? root.parentElement.querySelector(':scope > .footer') : null) ||
            (old ? old.querySelector('.footer') : null);
        if (old) {
            old.remove();
        }
        let main = month.querySelector(':scope > .salek-calmain');
        if (!main) {
            main = make('div', 'salek-calmain');
            month.append(main);
        }
        Array.from(month.children).forEach(function(child) {
            if (child !== main) {
                main.append(child);
            }
        });
        month.prepend(panel(strings, newEvent, footer));

        // (The view and course filter stay where Moodle put them, outside the part it redraws when
        // another month or course is chosen; the stylesheet places them in the month's row.)
        const controls = month.querySelector('.calendar-controls');
        const previous = controls ? controls.querySelector('.previous') : null;

        // "Today" between the arrows: one of Moodle's month links, to today's month.
        const next = controls ? controls.querySelector('.next') : null;
        if (today && today.monthnumber && next && !controls.querySelector('.salek-cal-today')) {
            const link = make('a', 'arrow_link salek-cal-today', strings.today);
            const url = new URL(previous.href, window.location.href);
            url.searchParams.set('time', today.timestamp);
            link.href = url.toString();
            link.dataset.year = today.year;
            link.dataset.month = today.monthnumber;
            link.dataset.dropZone = 'nav-link';
            controls.insertBefore(link, next);
        }

        // The arrows and "Today" in one frame (still inside Moodle's month, which handles them).
        if (previous && next && !controls.querySelector('.salek-cal-nav')) {
            const nav = make('span', 'salek-cal-nav');
            controls.insertBefore(nav, previous);
            nav.append(previous);
            const todayLink = controls.querySelector('.salek-cal-today');
            if (todayLink) {
                nav.append(todayLink);
            }
            nav.append(next);
        }

        // The weekend's day names in red, like their days.
        const table = month.querySelector('table.calendarmonth');
        const heads = table.querySelectorAll('thead th');
        const weekendNames = [];
        table.querySelectorAll('tbody tr').forEach(function(row) {
            Array.from(row.cells).forEach(function(cell) {
                if (cell.classList.contains('weekend') && heads[cell.cellIndex] &&
                        !heads[cell.cellIndex].classList.contains('salek-weekend')) {
                    heads[cell.cellIndex].classList.add('salek-weekend');
                    weekendNames.push(heads[cell.cellIndex].querySelector('[aria-hidden="true"]').textContent.trim());
                }
            });
        });

        // The legend: today, and the weekend's days.
        if (!month.querySelector('.salek-cal-legend')) {
            const legend = make('div', 'salek-cal-legend');
            legend.setAttribute('aria-hidden', 'true');
            legend.append(make('span', 'salek-cal-legend-today', strings.today));
            if (weekendNames.length) {
                legend.append(make('span', 'salek-cal-legend-weekend', weekendNames.join(' ')));
            }
            table.after(legend);
        }
    };

    return {
        /**
         * Arrange the month calendars of the page, now and whenever Moodle redraws them.
         *
         * @param {Object} strings The words calendar, today, events and nothing (to display).
         */
        init: function(strings) {
            document.querySelectorAll('.maincalendar').forEach(function(root) {
                arrange(root, strings);
                new MutationObserver(function() {
                    arrange(root, strings);
                }).observe(root, {childList: true, subtree: true});
            });
        }
    };
});
