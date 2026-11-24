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
 * A page that Moodle prints without a title in its content (the H5P activity's attempts report):
 * the name of the page's tab (the active item of the secondary navigation, in the site's language)
 * as its title, at the content's top, so the theme gives it the title row of the other pages.
 * Loaded only for the page types listed in layout/drawers.php.
 *
 * @module     theme_boost_union/pagetitle
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    /**
     * Initialise.
     */
    const init = function() {
        const main = document.querySelector('#region-main div[role="main"]');
        const tab = document.querySelector('.secondary-navigation .nav-link.active');
        if (!main || !tab || main.querySelector(':scope > h2')) {
            return;
        }
        const title = document.createElement('h2');
        title.className = 'salek-added-title';
        title.textContent = tab.textContent.trim();
        // After Moodle's skip link anchor, if any: as the first heading of the content.
        const anchor = main.querySelector(':scope > #maincontent');
        if (anchor) {
            anchor.after(title);
        } else {
            main.prepend(title);
        }
    };

    /**
     * Pages of groups of links (course and site administration): a group Moodle gives no title
     * (a tab's own links, the first group), the name of its tab as its title, as the other groups
     * have one. (The tab is in the page or in the tab bar over it.)
     */
    const groupTitles = function() {
        document.querySelectorAll('#region-main .tab-pane[id^="link"] > .container-fluid > .row > .col-sm-3').forEach(function(cell) {
            const tab = document.querySelector('a[href="#' + cell.closest('.tab-pane').id + '"]');
            // (Not a group without links: the theme CSS leaves it out.)
            if (cell.textContent.trim() || !tab || !cell.parentElement.querySelector('ul > li')) {
                return;
            }
            const title = document.createElement('div');
            title.className = 'salek-group-title';
            title.textContent = tab.textContent.trim();
            cell.appendChild(title);
        });
    };

    return {
        init: init,
        groupTitles: groupTitles
    };
});
