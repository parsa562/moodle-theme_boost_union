// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * The menu of a page's tab that is the page's title (a course's reports, its participants pages):
 * when the page is not one of its items (a report opened by its address while the course does not
 * offer it, as the activity completion of a course without completion tracking), the page's own
 * name in it, from the window's title. (Moodle: the menu was empty, the page had no title.)
 *
 * @module     theme_boost_union/menutitle
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    /**
     * Initialise.
     */
    const init = function() {
        const toggle = document.querySelector('#region-main .tertiary-navigation .select-menu > .dropdown-toggle');
        if (!toggle || toggle.textContent.trim() !== '') {
            return;
        }
        const name = document.title.split(' | ')[0].trim();
        if (!name) {
            return;
        }
        // (In the heading Moodle puts there, if any.)
        const holder = toggle.querySelector('[data-selected-option], [role="heading"]') || toggle;
        holder.prepend(document.createTextNode(name));
    };

    return {
        init: init
    };
});
