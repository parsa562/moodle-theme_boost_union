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
 * A forum's posts: an author without a picture shows the initials of their name in a coloured
 * circle, as in the site's lists (participants, assignment submissions), not Moodle's grey
 * silhouette (the forum's posts take the picture's address only, so Moodle draws no initials
 * there). Each person always gets the same colour (from their user id). Also for the posts added
 * later on the page (a reply written in the page).
 *
 * @module     theme_boost_union/forumposts
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    const TONES = 6;

    /**
     * The first letter of the first and of the last name.
     *
     * @param {string} name
     * @returns {string}
     */
    const initials = function(name) {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) {
            return '';
        }
        const first = Array.from(parts[0])[0];
        const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : '';
        return (first + last).toUpperCase();
    };

    /**
     * Replace the default pictures of the posts under the given element.
     *
     * @param {Element} root
     */
    const replace = function(root) {
        root.querySelectorAll('[data-region="post"] header img').forEach(function(img) {
            // Moodle's default picture (theme/image.php/.../u/f1), not a picture of the person.
            if (!/\/theme\/image\.php\/.*\/u\/f\d/.test(img.getAttribute('src') || '')) {
                return;
            }
            const link = img.closest('header').querySelector('.authorsubheading a');
            if (!link) {
                return;
            }
            const letters = initials(link.textContent);
            if (!letters) {
                return;
            }
            const id = parseInt((link.getAttribute('href').match(/[?&]id=(\d+)/) || [])[1] || '0', 10);
            const circle = document.createElement('span');
            circle.className = 'userinitials salek-post-initials salek-initials-tone-' + ((id % TONES) + 1);
            circle.setAttribute('aria-hidden', 'true');
            circle.textContent = letters;
            img.replaceWith(circle);
        });
    };

    /**
     * Initialise.
     */
    const init = function() {
        const main = document.getElementById('region-main');
        if (!main) {
            return;
        }
        replace(main);
        if ('MutationObserver' in window) {
            new MutationObserver(function(records) {
                if (records.some(function(record) {
                    return record.addedNodes.length;
                })) {
                    replace(main);
                }
            }).observe(main, {childList: true, subtree: true});
        }
    };

    return {
        init: init
    };
});
