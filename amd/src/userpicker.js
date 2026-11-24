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
 * So are the lists of several choices of the forms (resetting a course's "Unenrol users", a role's
 * "Allow role assignments"): rows with checkboxes and the names only (Moodle: a bare box of lines
 * to pick with Ctrl), above a "Select all" row; Ctrl+A in the list chooses all, as in Moodle's.
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
    const person = function(option, counted, plain) {
        const text = option.textContent.trim();
        if (plain) {
            return {name: text, details: '', number: ''};
        }
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
     * @param {Boolean} plain A form's list of several choices: names only, no initials.
     */
    const enhance = function(select, footer, strings, readonly, counted, plain) {
        const multi = select.multiple;
        const picker = make('div', 'salek-userpicker' + (multi ? ' salek-userpicker-multi' : '') +
            (counted ? ' salek-userpicker-grouplist' : '') + (plain ? ' salek-userpicker-plain' : ''));
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
            const p = person(option, counted, plain);
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
            input.disabled = select.disabled; // (Moodle's "disabled if" on the list.)
            input.addEventListener('change', function() {
                if (multi) {
                    option.selected = input.checked;
                } else {
                    select.value = option.value;
                }
                changed();
            });
            if (plain) {
                el.append(input, nameAndDetails(p));
            } else {
                el.append(input, make('span', 'salek-userpicker-avatar', initials(p.name)), nameAndDetails(p));
            }
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

        // "Select all" (a form's list): chooses all its choices, or none when all are chosen; in
        // between while some are. (One listener for the list, whatever it shows after a search.)
        let syncAll = null;
        picker.addEventListener('change', function(e) {
            if (syncAll && !e.target.closest('.salek-userpicker-all')) {
                syncAll();
            }
        });
        const allCheckbox = function(options) {
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.setAttribute('aria-label', strings.selectall);
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
                picker.querySelectorAll('input').forEach(function(input) {
                    if (input !== box) {
                        input.checked = box.checked;
                        input.indeterminate = false;
                    }
                });
                changed();
            });
            syncAll = sync;
            sync();
            return box;
        };

        // Ctrl+A in the list (as in Moodle's): all chosen.
        if (plain && multi) {
            picker.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !select.disabled) {
                    e.preventDefault();
                    Array.from(select.options).forEach(function(o) {
                        o.selected = !o.disabled;
                    });
                    picker.querySelectorAll('input').forEach(function(input) {
                        input.checked = !input.disabled;
                        input.indeterminate = false;
                    });
                    changed();
                }
            });
        }

        const draw = function() {
            picker.replaceChildren();
            const enabled = Array.from(select.options).filter(function(o) {
                return !o.disabled;
            });
            // ("Select all" at the end of the list.)
            let allRow = null;
            syncAll = null;
            if (plain && multi && enabled.length > 1) {
                allRow = make('label', 'salek-userpicker-group salek-userpicker-all');
                allRow.append(allCheckbox(enabled), make('span', 'salek-userpicker-group-name', strings.selectall),
                    make('span', 'salek-userpicker-count', String(enabled.length)));
                allRow.querySelector('input').disabled = select.disabled;
            }
            picker.classList.toggle('salek-userpicker-disabled', select.disabled);
            if (counted || (plain && !select.querySelector('optgroup'))) {
                const items = make('div', 'salek-userpicker-rows');
                Array.from(select.options).forEach(function(option) {
                    if (!option.disabled) {
                        items.append(item(option));
                    }
                });
                picker.append(items);
                if (allRow) {
                    picker.append(allRow);
                }
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
            if (allRow) {
                picker.append(allRow);
            }
            showChosen();
        };

        draw();
        // Moodle's search replaces the groups of the list; a form's "disabled if" turns it off and on.
        const observer = new MutationObserver(draw);
        observer.observe(select, {childList: true, subtree: true, attributes: true, attributeFilter: ['disabled']});
        return {picker: picker, observer: observer};
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

    /**
     * Every list of several choices in the content's forms (the forms of the pages, the site
     * administration's settings, the filters): rows with checkboxes. Moodle's fields that search as
     * one types (autocomplete, tags) are such lists underneath and take them over; those, and the
     * lists of people and groups above, are left alone.
     *
     * @param {Object} strings
     */
    const plainLists = function(strings) {
        const skip = function(select) {
            const next = select.nextElementSibling;
            return select.classList.contains('salek-userpicker-source') ||
                select.closest('.userselector, [data-fieldtype="autocomplete"], [data-fieldtype="tags"]') ||
                ((select.id === 'groups' || select.id === 'members') && select.closest('#page-group-index')) ||
                select.style.visibility === 'hidden' || select.style.display === 'none' ||
                (next && next.matches('.form-autocomplete-selection, .form-autocomplete-input, .salek-userpicker'));
        };
        // (A list Moodle turns into a field that searches as one types after this ran, as the
        // forum search's tags, a hand-made form: given back to it.)
        const giveBack = function(select, drawn) {
            const watch = new MutationObserver(function() {
                if (select.style.visibility === 'hidden' || select.style.display === 'none' ||
                        select.parentElement.querySelector('.form-autocomplete-selection')) {
                    watch.disconnect();
                    drawn.observer.disconnect();
                    drawn.picker.remove();
                    select.classList.remove('salek-userpicker-source');
                    select.removeAttribute('aria-hidden');
                    select.removeAttribute('tabindex');
                }
            });
            watch.observe(select.parentElement, {childList: true, subtree: true, attributes: true,
                attributeFilter: ['style']});
        };
        // The pages' forms and the site administration's settings: at once (their fields that search
        // as one types mostly say so on their row), also those in closed sections.
        document.querySelectorAll('#region-main form.mform select[multiple], #region-main #adminsettings select[multiple]')
            .forEach(function(select) {
                if (!skip(select)) {
                    giveBack(select, enhance(select, null, strings, false, false, true));
                }
            });
        // Other forms (filters…): after the page's other scripts, only lists that are shown (not the
        // hidden lists a filter builds its fields from, as the participants' filter).
        const others = function() {
            document.querySelectorAll('#region-main form:not(.mform):not(#adminsettings) select[multiple]')
                .forEach(function(select) {
                    if (!skip(select) && select.getClientRects().length && !select.closest('.hidden, [data-filterregion]')) {
                        giveBack(select, enhance(select, null, strings, false, false, true));
                    }
                });
        };
        // (Moodle counts the scripts still starting; this one's own call ends once init returns.)
        const wait = function(tries) {
            const pending = window.M && window.M.util && window.M.util.pending_js;
            if (!pending || !pending.length || tries > 30) {
                others();
            } else {
                setTimeout(function() {
                    wait(tries + 1);
                }, 100);
            }
        };
        setTimeout(function() {
            wait(0);
        }, 0);
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
            plainLists(strings);
        }
    };
});
