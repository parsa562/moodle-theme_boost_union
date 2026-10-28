// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Keep Moodle's "accessible change" of dropdowns working with the theme's open lists.
 *
 * Moodle's scripts (filter conditions and others) act on a dropdown's change only when its value
 * differs from the one it had when it got the focus. With the theme's dropdown lists (browsers with
 * customisable selects), the focus goes to the options of the open list, not to the dropdown: the
 * dropdown got no starting value, Moodle took the change for no change and nothing happened (a
 * filter condition chosen showed no field). The value is noted here when the dropdown is pressed,
 * before its list opens, as Moodle would on focus.
 *
 * @module     theme_boost_union/selectchange
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    return {
        /**
         * Note a dropdown's value when it is pressed (where the browser draws the theme's lists).
         */
        init: function() {
            if (!window.CSS || !CSS.supports('appearance', 'base-select')) {
                return;
            }
            document.addEventListener('pointerdown', function(e) {
                const select = e.target.closest('select');
                if (select && !e.target.closest('option') && !select.multiple) {
                    select.dataset.initValue = select.value;
                }
            }, true);
        }
    };
});
