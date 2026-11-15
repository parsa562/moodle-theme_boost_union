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
 * Every other list table (.generaltable, .flexible) that is wider than the page and has no box of
 * its own that scrolls (Bootstrap's .table-responsive): put in such a box, with the same scrollbar
 * and the same menus (the assignment's submissions, with many columns, ran out of the page); a box
 * of Moodle's that scrolls right around such a table becomes that box.
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
     * Menus in a scrolling box: positioned against the window, so the box does not cut them off.
     * Bootstrap reads this when a menu is first opened, so setting it now is enough.
     *
     * @param {HTMLElement} box
     */
    const fixMenus = function(box) {
        box.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(function(toggle) {
            toggle.setAttribute('data-bs-popper-config', '{"strategy":"fixed"}');
        });
    };

    /**
     * Short columns on one line: a column whose cells all hold a short text (a date, a name, a
     * number, an e-mail address) does not wrap where the table squeezed it into three lines or more;
     * the columns with longer texts wrap, at a sensible width (CSS). The browser squeezed every
     * column to fit the page, so a date took 4 or 5 lines and a log's description 12. Done once per
     * table (as the template salek_table_sizer does before the page is drawn).
     *
     * @param {HTMLTableElement} table
     */
    const keepShortColumns = function(table) {
        // (A table not shown yet, inside something hidden: its cells can only be measured once it
        // shows; sized then, when tables are looked at again.)
        if (table.dataset.salekColumns || !table.tHead || !table.tBodies.length || !table.getClientRects().length) {
            return;
        }
        table.dataset.salekColumns = '1';
        const head = table.tHead.rows[table.tHead.rows.length - 1];
        const count = head.cells.length;
        const rows = Array.from(table.tBodies[0].rows).filter(function(row) {
            return row.cells.length === count && !Array.from(row.cells).some(function(cell) {
                return cell.colSpan > 1;
            });
        }).slice(0, 60);
        if (!rows.length) {
            return;
        }
        // The text a cell shows: not the hidden names of its icon buttons.
        const shown = function(cell) {
            const copy = cell.cloneNode(true);
            copy.querySelectorAll('.visually-hidden, .sr-only, .accesshide, .icon').forEach(function(el) {
                el.remove();
            });
            return copy.textContent.replace(/\s+/g, ' ').trim();
        };
        // The lines a cell's text takes: its visible text only.
        const lines = function(cell) {
            const tops = [];
            const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
            const range = document.createRange();
            let node;
            while ((node = walker.nextNode())) {
                if (!node.nodeValue.trim() || node.parentElement.closest('.visually-hidden, .sr-only, .accesshide')) {
                    continue;
                }
                range.selectNodeContents(node);
                Array.from(range.getClientRects()).forEach(function(rect) {
                    if (rect.height) {
                        tops.push(rect.top);
                    }
                });
            }
            tops.sort(function(x, y) {
                return x - y;
            });
            return tops.filter(function(top, k) {
                return !k || top - tops[k - 1] > 4;
            }).length;
        };
        const cellsOf = function(i) {
            return [head.cells[i]].concat(rows.map(function(row) {
                return row.cells[i];
            }));
        };
        table.classList.remove('salek-table-ready');
        table.classList.add('salek-columns-sized');
        const candidates = [];
        for (let i = 0; i < count; i++) {
            // A column of icon buttons only: left as it is (its buttons may stack; on one line they
            // pushed a table that fitted out of the page on phones).
            if (rows.every(function(row) {
                return !shown(row.cells[i]) && row.cells[i].querySelector('a, button');
            })) {
                continue;
            }
            if (rows.every(function(row) {
                return shown(row.cells[i]).length <= 40;
            })) {
                candidates.push(i);
            } else {
                cellsOf(i).forEach(function(cell) {
                    cell.classList.add('salek-cell-long');
                });
            }
        }
        // A column of short texts on one line only where the table squeezed a text into three lines
        // or more (a date in 4 lines): wrapping added two lines or more to a cell (the theme CSS
        // keeps the cells on one line until the table is ready; a name with a link under it has two
        // lines by itself). Where it adds one, it stays as it is, so a table that fitted the page
        // (on phones) still does. (All measured first, then marked.)
        const before = candidates.map(function(i) {
            return rows.map(function(row) {
                return lines(row.cells[i]);
            });
        });
        table.classList.add('salek-table-ready');
        // Where the table fits the page as it wraps, only a text squeezed much more (a date in 4
        // lines): a name in 3 lines is better than a table that no longer fits.
        const least = table.offsetWidth <= table.parentElement.clientWidth + 1 ? 3 : 2;
        candidates.filter(function(i, k) {
            return rows.some(function(row, r) {
                return lines(row.cells[i]) - before[k][r] >= least;
            });
        }).forEach(function(i) {
            cellsOf(i).forEach(function(cell) {
                cell.classList.add('salek-cell-short');
            });
        });
    };

    /**
     * Put each list table that is wider than the page, and has no scrolling box, in one. Each table
     * is then marked ready (.salek-table-ready): the theme CSS keeps the tables hidden until then,
     * so the raw table (squeezed, or out of the page on narrow screens) does not show first.
     */
    const boxWideTables = function() {
        const main = document.getElementById('region-main');
        if (!main) {
            return;
        }
        main.querySelectorAll('table.generaltable, table.flexible').forEach(function(table) {
            if (table.closest('.gradeparent, #question_table, .dropdown-menu, .modal, td, th')) {
                return;
            }
            boxWideTable(main, table);
            table.classList.add('salek-table-ready');
        });
    };

    /**
     * Size one table's columns and, when it is wider than the page, put it in a scrolling box.
     *
     * @param {HTMLElement} main The content area.
     * @param {HTMLTableElement} table
     */
    const boxWideTable = function(main, table) {
        keepShortColumns(table);
        const made = table.closest('.salek-table-scroll');
        if (made) {
            // A box made before the page was drawn (templates/salek_table_sizer.mustache): its
            // scrollbar and menus now.
            if (!made.classList.contains('boost-union-wide-table-scroll')) {
                fixMenus(made);
                document.body.classList.add('salek-has-wide-table');
                attach(made, true);
            }
            return;
        }
        const parent = table.parentElement;
        if (!table.getClientRects().length) {
            return;
        }
        // A box of Moodle's that scrolls sideways right around the table (the assignment's
        // submissions on narrow screens): with nothing else in it, made the theme's box itself,
        // so it gets the same scrollbar, frame and plain (not sticky) header (Moodle's sticky
        // header was placed against that box and slid over the first rows); with more in it
        // ("Reset table preferences"), it stops scrolling (.salek-table-holder) and the table
        // alone gets the theme's box.
        let holder = false;
        if (getComputedStyle(parent).overflowX !== 'visible' && parent !== main) {
            if (parent.children.length === 1) {
                if (Math.max(table.offsetWidth, parent.scrollWidth) > parent.clientWidth + 1) { // (Or what sticks out of it: the turned column titles of the completion report.)
                    parent.classList.add('salek-table-scroll');
                    fixMenus(parent);
                    document.body.classList.add('salek-has-wide-table');
                    attach(parent, true);
                }
                return;
            }
            parent.classList.add('salek-table-holder');
            holder = true;
        }
        if (table.offsetWidth <= parent.clientWidth + 1) {
            return;
        }
        for (let el = holder ? parent.parentElement : parent; el && el !== main; el = el.parentElement) {
            if (getComputedStyle(el).overflowX !== 'visible') {
                return;
            }
        }
        const box = document.createElement('div');
        box.className = 'salek-table-scroll';
        table.before(box);
        box.appendChild(table);
        fixMenus(box);
        document.body.classList.add('salek-has-wide-table');
        attach(box, true);
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
                fixMenus(tableWrapper);
            }
            return;
        }

        // The other list tables: now, again when the window gets narrower, and when a table is
        // drawn again or added (filters, sorting, paging that reload a table in place).
        boxWideTables();
        let timer = null;
        const later = function() {
            clearTimeout(timer);
            timer = setTimeout(boxWideTables, 150);
        };
        window.addEventListener('resize', later);
        const main = document.getElementById('region-main');
        // And when a table changes size: drawn wider once its fields or fonts have loaded, or
        // shown from something hidden (its box and scrollbar were missing then).
        if (main && 'ResizeObserver' in window) {
            const sizes = new ResizeObserver(later);
            main.querySelectorAll('table.generaltable, table.flexible').forEach(function(table) {
                sizes.observe(table);
            });
        }
        if (main && 'MutationObserver' in window) {
            new MutationObserver(function(records) {
                if (records.some(function(record) {
                    return Array.from(record.addedNodes).some(function(node) {
                        return node.nodeType === 1 && (node.matches('table') || node.querySelector('table'));
                    });
                })) {
                    later();
                }
            }).observe(main, {childList: true, subtree: true});
        }
    };

    return {
        init: init
    };
});
