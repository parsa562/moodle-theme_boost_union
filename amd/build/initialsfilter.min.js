// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Letter filters above lists (participants, Activity completion, gradebook, ...): Moodle shows two
 * rows of letters (first name, last name) above every such list. They are put behind a
 * "Filter by initial" button that opens them on a soft surface; a chosen letter stays visible as
 * a chip beside the button (with x to remove it), and the button counts the chosen letters.
 *
 * Moodle's letter links are moved, not copied, so they keep working as before. On the
 * participants page the button goes into the list's header row (the number of participants);
 * elsewhere a row is added above the letters. The stylesheet keeps the letters hidden until this
 * has run (at most 3 seconds), so they do not show for a moment on every page load.
 *
 * @module     theme_boost_union/initialsfilter
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    let count = 0;

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
     * A stroke icon (the shapes are paths in a 24px box).
     *
     * @param {String} path
     * @param {Number} size
     * @return {SVGElement}
     */
    const icon = function(path, size) {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', size > 14 ? '2' : '2.4');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', path);
        svg.appendChild(p);
        return svg;
    };

    /**
     * Put one list's letter rows behind a button.
     *
     * @param {HTMLElement[]} bars The letter rows (first name, last name) of one list.
     * @param {Object} strings The words filter (button) and remove (chip button label).
     */
    const arrange = function(bars, strings) {
        const id = 'salek-ib-panel-' + (++count);
        const panel = make('div', 'salek-ib-panel');
        panel.id = id;
        panel.hidden = true;
        bars[0].before(panel);
        bars.forEach((bar) => panel.appendChild(bar));

        // The header row: the participants' count row, or a new row above the letters.
        let head = panel.closest('form, .userlist')?.querySelector('[data-region="participant-count"]');
        if (!head) {
            head = make('div', 'salek-ib-head');
            panel.before(head);
        }
        head.classList.add('salek-ib-head');

        // Chips for the chosen letters.
        let chosen = 0;
        bars.forEach((bar) => {
            const active = bar.querySelector('.page-item.active:not(.initialbarall)');
            const all = bar.querySelector('.initialbarall a');
            if (!active || !all) {
                return;
            }
            chosen++;
            const label = (bar.querySelector('.initialbarlabel')?.textContent || '').trim();
            const chip = make('span', 'salek-ib-chip', label + ': ');
            chip.appendChild(make('b', '', active.textContent.trim()));
            const remove = make('a', 'salek-ib-chip-remove', '×');
            remove.href = all.href;
            remove.setAttribute('aria-label', strings.remove + ': ' + label);
            chip.appendChild(remove);
            head.appendChild(chip);
        });

        head.appendChild(make('span', 'salek-ib-spacer'));

        // The button.
        const toggle = make('button', 'salek-ib-toggle');
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', id);
        toggle.appendChild(icon('M3 18 6.5 6h1L11 18M4.2 14h5.6M14 6h6l-6 12h6', 16));
        toggle.appendChild(document.createTextNode(strings.filter));
        if (chosen) {
            toggle.classList.add('is-set');
            toggle.appendChild(make('span', 'salek-ib-badge', String(chosen)));
        }
        const chevron = icon('m6 9 6 6 6-6', 13);
        chevron.classList.add('salek-ib-chevron');
        toggle.appendChild(chevron);
        toggle.addEventListener('click', function() {
            const open = panel.hidden;
            panel.hidden = !open;
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        head.appendChild(toggle);
    };

    return {
        /**
         * Arrange the letter filters of the page.
         *
         * @param {Object} strings The words filter (button) and remove (chip button label).
         */
        init: function(strings) {
            const lists = new Map();
            document.querySelectorAll('#region-main .initialbar').forEach((bar) => {
                // (Not the letters inside a menu, such as "Filter by name" in the report
                // toolbars: the menu already hides them behind its button.)
                if (bar.closest('.dropdown-menu')) {
                    return;
                }
                const list = lists.get(bar.parentElement) || [];
                list.push(bar);
                lists.set(bar.parentElement, list);
            });
            lists.forEach((bars) => arrange(bars, strings));
            document.body.classList.add('salek-ib-ready');
        }
    };
});
