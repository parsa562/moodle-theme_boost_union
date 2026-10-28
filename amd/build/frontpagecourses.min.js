// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * The front page's course list: a bar above the cards to search them (by name or short name),
 * sort them (newest or oldest first by start date, or by name), see how many there are and show
 * them as cards or as a list.
 *
 * Everything works on the cards Moodle has drawn (no request to the server). The order Moodle
 * gave them (the site's order) stays the first choice of the sort. The chosen view (cards or
 * list) is remembered in the browser.
 *
 * @module     theme_boost_union/frontpagecourses
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    const VIEW_KEY = 'theme_boost_union_frontpagecourses_view';

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
     * A dropdown with a small label in front of it ("Sort").
     *
     * @param {String} label
     * @param {Array} options [value, text] pairs.
     * @return {Object} The wrapper and the select.
     */
    const dropdown = function(label, options) {
        const wrap = make('label', 'salek-courses-choice');
        wrap.append(make('span', 'salek-courses-choice-label', label));
        const select = make('select', 'form-select');
        options.forEach(function(option) {
            const el = document.createElement('option');
            el.value = option[0];
            el.textContent = option[1];
            select.append(el);
        });
        wrap.append(select);
        return {wrap: wrap, select: select};
    };

    /**
     * Read a value from the browser's storage (none when it is not available).
     *
     * @param {String} key
     * @return {String|null}
     */
    const remembered = function(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    };

    /**
     * Keep a value in the browser's storage, when it is available.
     *
     * @param {String} key
     * @param {String} value
     */
    const remember = function(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (e) {
            // Nothing to keep it in: the view is chosen again next time.
        }
    };

    return {
        /**
         * Add the bar to the front page's course list.
         *
         * @param {Object} strings The words of the bar (search, sort, default order, newest, oldest,
         *     name, cards, list, count with {$a}, none).
         */
        init: function(strings) {
            const section = document.querySelector('#frontpage-available-course-list');
            const grid = section ? section.querySelector('.card-grid') : null;
            if (!grid) {
                section?.classList.add('salek-courses-ready');
                return;
            }
            const items = Array.from(grid.children).filter(function(col) {
                return col.querySelector('.course-card');
            });
            const text = function(col, selector) {
                const el = col.querySelector(selector);
                return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
            };
            const data = items.map(function(col, index) {
                const name = text(col, '.coursename').replace(text(col, '.coursename .visually-hidden'), '').trim();
                return {
                    col: col,
                    index: index,
                    name: name,
                    start: parseInt(col.querySelector('.course-card').dataset.startdate || '0', 10),
                    search: (name + ' ' + text(col, '.shortname')).toLowerCase(),
                };
            });

            const bar = make('div', 'salek-courses-bar');

            // Search.
            const search = make('label', 'salek-courses-search');
            const input = make('input', 'form-control');
            input.type = 'search';
            input.placeholder = strings.search;
            input.setAttribute('aria-label', strings.search);
            search.append(input);

            // Sort: the site's order, by start date (newest or oldest first) or by name.
            const sort = dropdown(strings.sort, [['', strings.defaultorder], ['new', strings.newest],
                ['old', strings.oldest], ['az', strings.nameaz]]);

            // How many are shown.
            const count = make('span', 'salek-courses-count');
            count.setAttribute('aria-live', 'polite');

            // Cards or list.
            const views = make('div', 'salek-courses-views');
            views.setAttribute('role', 'group');
            const viewButton = function(view, label) {
                const button = make('button', 'salek-courses-view salek-courses-view-' + view);
                button.type = 'button';
                button.dataset.view = view;
                button.setAttribute('aria-label', label);
                button.title = label;
                views.append(button);
                return button;
            };
            const cardsButton = viewButton('cards', strings.cards);
            const listButton = viewButton('list', strings.list);
            const showView = function(view) {
                section.classList.toggle('salek-courses-as-list', view === 'list');
                cardsButton.setAttribute('aria-pressed', String(view !== 'list'));
                listButton.setAttribute('aria-pressed', String(view === 'list'));
            };
            views.addEventListener('click', function(e) {
                const button = e.target.closest('.salek-courses-view');
                if (button) {
                    showView(button.dataset.view);
                    remember(VIEW_KEY, button.dataset.view);
                }
            });

            const end = make('div', 'salek-courses-bar-end');
            end.append(count, views);
            bar.append(search, sort.wrap, end);

            // No course found.
            const none = make('div', 'salek-courses-none', strings.none);
            none.hidden = true;

            const update = function() {
                const words = input.value.trim().toLowerCase();
                let shown = 0;
                data.forEach(function(d) {
                    const visible = !words || d.search.indexOf(words) !== -1;
                    d.col.hidden = !visible;
                    if (visible) {
                        shown++;
                    }
                });
                count.textContent = strings.count.replace('{$a}', shown.toLocaleString(document.documentElement.lang || undefined));
                none.hidden = shown > 0;

                const order = data.slice();
                const how = sort.select.value;
                const collator = new Intl.Collator(document.documentElement.lang || undefined);
                order.sort(function(a, b) {
                    if (how === 'new' || how === 'old') {
                        return ((a.start - b.start) * (how === 'new' ? -1 : 1)) || a.index - b.index;
                    }
                    return how === 'az' ? collator.compare(a.name, b.name) : a.index - b.index;
                });
                order.forEach(function(d) {
                    grid.append(d.col);
                });
            };
            input.addEventListener('input', update);
            sort.select.addEventListener('change', update);

            const heading = section.querySelector(':scope > h2');
            (heading || section.firstChild).after(bar);
            grid.after(none);

            showView(remembered(VIEW_KEY) === 'list' ? 'list' : 'cards');
            update();
            section.classList.add('salek-courses-ready');
        }
    };
});
