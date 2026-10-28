// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Choosing people from Moodle's user selectors (checking permissions, assigning roles, manual
 * enrolments, group members, …): each person with their initials, name and email, grouped like
 * Moodle's list ("Enrolled users", "Potential users") with the number of people.
 *
 * A list of one person (checking permissions) becomes cards to choose from, and the chosen person
 * is shown again next to the form's button. A list of several people (the two lists of the add and
 * remove pages) becomes rows with checkboxes, with a checkbox to choose a whole group.
 *
 * Moodle's own list stays in the page, hidden, and remains the form field: choosing a person
 * chooses them in it (Moodle's scripts hear it as a change of the list, so its buttons follow),
 * and when Moodle's search fills the list again, the people are drawn again from it.
 *
 * The two lists of the groups page are drawn the same way: the groups as rows with checkboxes and
 * their number of members, and the members of the chosen group (to look at, not to choose).
 *
 * "Search options" (Moodle's collapsible region next to the search) opens and closes at once
 * instead of after Moodle's animation: the theme draws it as a button with a panel under the
 * search, and the classes set here say which of the two is shown.
 *
 * @module     theme_boost_union/userpicker
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    // "Name (email, other fields)", maybe followed by a number ("(1)": the groups of the person on
    // the group members page): the name, the details in brackets and the number.
    const DETAILS = /^(.*?)\s*\(([^()]*)\)(?:\s*\((\d+)\))?\s*$/;
    // "Enrolled users (3)": the group name and its number.
    const COUNT = /^(.*?)\s*\((\d+)\)\s*$/;

    /**
     * The first letters of the first two words of a name.
     *
     * @param {String} name
     * @return {String}
     */
    const initials = function(name) {
        return name.trim().split(/\s+/).slice(0, 2).map(function(word) {
            return word.charAt(0);
        }).join('');
    };

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
     * The name, the details and the number of an option of Moodle's list.
     *
     * @param {HTMLOptionElement} option
     * @param {Boolean} counted A list of groups: the number in brackets is the number of members.
     * @return {Object}
     */
    const person = function(option, counted) {
        const text = option.textContent.trim();
        if (counted) {
            const count = text.match(COUNT);
            return {name: count ? count[1] : text, details: '', number: count ? count[2] : ''};
        }
        const match = text.match(DETAILS);
        return {name: match ? match[1] : text, details: match ? match[2] : '', number: match ? match[3] : ''};
    };

    /**
     * The name and the details of a person, one under the other.
     *
     * @param {Object} p From person().
     * @return {HTMLElement}
     */
    const nameAndDetails = function(p) {
        const text = make('span', 'salek-userpicker-text');
        text.append(make('span', 'salek-userpicker-name', p.name));
        if (p.details) {
            text.append(make('span', 'salek-userpicker-details', p.details));
        }
        return text;
    };

    /**
     * Turn one user selector into cards (one person) or rows with checkboxes (several people).
     *
     * @param {HTMLSelectElement} select Moodle's list.
     * @param {HTMLElement} footer The row with the form's button, for the chosen person (one person only).
     * @param {Object} strings The words "Selected" and "No selection".
     * @param {Boolean} readonly Only to look at (the members of a group): no checkboxes.
     * @param {Boolean} counted A list of groups (no headings), each with its number of members.
     */
    const enhance = function(select, footer, strings, readonly, counted) {
        const multi = select.multiple;
        const picker = make('div', 'salek-userpicker' + (multi ? ' salek-userpicker-multi' : '') +
            (counted ? ' salek-userpicker-grouplist' : ''));
        picker.setAttribute('role', multi ? 'group' : 'radiogroup');
        const label = document.querySelector('label[for="' + select.id + '"]');
        if (label) {
            if (!label.id) {
                label.id = select.id + '_label';
            }
            picker.setAttribute('aria-labelledby', label.id);
        }
        select.after(picker);
        select.classList.add('salek-userpicker-source');
        select.setAttribute('aria-hidden', 'true');
        select.tabIndex = -1;

        const chosen = make('div', 'salek-userpicker-chosen');
        chosen.setAttribute('aria-live', 'polite');
        if (footer && !multi) {
            footer.prepend(chosen);
        }

        // Tell Moodle's scripts (the buttons, "Selected user's membership") the list changed.
        const changed = function() {
            select.dispatchEvent(new Event('change', {bubbles: true}));
            showChosen();
        };

        const item = function(option) {
            const p = person(option, counted);
            if (readonly) {
                const row = make('div', 'salek-userpicker-row');
                row.append(make('span', 'salek-userpicker-avatar', initials(p.name)), nameAndDetails(p));
                return row;
            }
            const el = make('label', multi ? 'salek-userpicker-row' : 'salek-userpicker-card');
            const input = document.createElement('input');
            input.type = multi ? 'checkbox' : 'radio';
            input.name = select.id + '_salekpick';
            input.value = option.value;
            input.checked = option.selected;
            input.addEventListener('change', function() {
                if (multi) {
                    option.selected = input.checked;
                } else {
                    select.value = option.value;
                }
                changed();
            });
            el.append(input, make('span', 'salek-userpicker-avatar', initials(p.name)), nameAndDetails(p));
            if (p.number) {
                el.append(make('span', 'salek-userpicker-count', p.number));
            }
            return el;
        };

        const showChosen = function() {
            if (multi) {
                return;
            }
            chosen.replaceChildren();
            const option = select.selectedOptions[0];
            if (!option || option.disabled) {
                chosen.append(make('span', 'salek-userpicker-chosen-none', strings.none));
                return;
            }
            const p = person(option);
            chosen.append(make('span', 'salek-userpicker-chosen-label', strings.selected),
                make('span', 'salek-userpicker-avatar', initials(p.name)), nameAndDetails(p));
        };

        // The group's checkbox: chooses all its people, or none when all are chosen.
        const groupCheckbox = function(name, options, items) {
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.setAttribute('aria-label', name);
            const sync = function() {
                const count = options.filter(function(o) {
                    return o.selected;
                }).length;
                box.checked = count === options.length;
                box.indeterminate = count > 0 && count < options.length;
            };
            box.addEventListener('change', function() {
                options.forEach(function(o) {
                    o.selected = box.checked;
                });
                items.querySelectorAll('input').forEach(function(input) {
                    input.checked = box.checked;
                });
                changed();
            });
            items.addEventListener('change', sync);
            sync();
            return box;
        };

        const draw = function() {
            picker.replaceChildren();
            if (counted) {
                const items = make('div', 'salek-userpicker-rows');
                Array.from(select.options).forEach(function(option) {
                    if (!option.disabled) {
                        items.append(item(option));
                    }
                });
                picker.append(items);
                return;
            }
            const groups = Array.from(select.querySelectorAll('optgroup'));
            groups.forEach(function(group, i) {
                const options = Array.from(group.querySelectorAll('option')).filter(function(o) {
                    return !o.disabled;
                });
                const labelText = (group.label || '').trim();
                if (options.length) {
                    const m = labelText.match(COUNT);
                    const name = m ? m[1] : labelText;
                    const head = make('div', 'salek-userpicker-group');
                    const items = make('div', multi ? 'salek-userpicker-rows' : 'salek-userpicker-cards');
                    options.forEach(function(option) {
                        items.append(item(option));
                    });
                    if (multi && !readonly) {
                        head.append(groupCheckbox(name, options, items));
                    }
                    head.append(make('span', 'salek-userpicker-group-name', name),
                        make('span', 'salek-userpicker-count', m ? m[2] : String(options.length)));
                    picker.append(head, items);
                    return;
                }
                if (!labelText) {
                    return; // Moodle's spacer between groups.
                }
                // An empty group: a group name when a message follows it, otherwise the message
                // ("Too many users (101) to show", "No users match").
                const next = groups[i + 1];
                const nextIsMessage = next && (next.label || '').trim() &&
                    !Array.from(next.querySelectorAll('option')).some(function(o) {
                        return !o.disabled;
                    });
                if (nextIsMessage) {
                    const head = make('div', 'salek-userpicker-group');
                    head.append(make('span', 'salek-userpicker-group-name', labelText));
                    picker.append(head);
                } else {
                    picker.append(make('div', 'salek-userpicker-message', labelText));
                }
            });
            showChosen();
        };

        draw();
        // Moodle's search replaces the groups of the list.
        new MutationObserver(draw).observe(select, {childList: true, subtree: true});
    };

    /**
     * Open and close "Search options" at once.
     *
     * Moodle switches its "collapsed" class when its animation ends; until then the classes set
     * here show the state that was asked for, and when it ends they follow Moodle's class again
     * (a click while it runs does not change where Moodle ends).
     *
     * @param {HTMLElement} region Moodle's collapsible region.
     */
    const searchOptions = function(region) {
        const caption = region.querySelector('.collapsibleregioncaption');
        if (!caption) {
            return;
        }
        const show = function(open) {
            region.classList.toggle('salek-options-open', open);
            region.classList.toggle('salek-options-closed', !open);
            const link = caption.querySelector('a');
            if (link) {
                link.setAttribute('aria-expanded', String(open));
            }
        };
        show(!region.classList.contains('collapsed'));
        // (Moodle adds the link to the caption itself, maybe after this runs.)
        caption.addEventListener('click', function() {
            show(!region.classList.contains('salek-options-open'));
        });
        let collapsed = region.classList.contains('collapsed');
        new MutationObserver(function() {
            if (region.classList.contains('collapsed') !== collapsed) {
                collapsed = !collapsed;
                show(!collapsed);
            }
        }).observe(region, {attributes: true, attributeFilter: ['class']});
    };

    return {
        /**
         * Draw the user selectors of the page (if any) as cards or rows.
         *
         * @param {String} footerSelector The row with the form's button, inside the same form.
         * @param {Object} strings The words "Selected" (selected) and "No selection" (none).
         */
        init: function(footerSelector, strings) {
            document.querySelectorAll('#region-main .userselector > select').forEach(function(select) {
                const form = select.closest('form');
                enhance(select, form ? form.querySelector(footerSelector) : null, strings);
            });
            document.querySelectorAll('#region-main .userselector .collapsibleregion').forEach(searchOptions);
            // The groups page: its groups, and the members of the chosen group.
            const groups = document.querySelector('#page-group-index #groups');
            const members = document.querySelector('#page-group-index #members');
            if (groups && members) {
                enhance(groups, null, strings, false, true);
                enhance(members, null, strings, true, false);
            }
        }
    };
});
