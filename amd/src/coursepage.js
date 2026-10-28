// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Course page:
 * - counts in the title rows of sections ("2 lessons · 5 activities") and lessons ("3 activities");
 * - a meta line under each activity name with its type and its dates side by side, so rows
 *   with and without dates have the same height.
 * Kept up to date when the course format re-draws parts of the page (editing, moving, collapsing).
 *
 * @module     theme_boost_union/coursepage
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['core/str'], function(Str) {
    "use strict";

    const KEYS = ['saleklessoncount', 'saleklessonscount', 'salekactivitycount', 'salekactivitiescount'];

    // Activities that count: everything except lessons (subsections) and text and media areas.
    const ACTIVITY = 'li.activity:not(.modtype_subsection):not(.modtype_label)';

    /**
     * Initialise the counts.
     */
    const init = function() {
        const root = document.querySelector('.course-content');
        if (!root) {
            return;
        }
        const persian = (document.documentElement.lang || '').startsWith('fa');
        const number = (n) => (persian ? n.toLocaleString('fa-IR') : String(n));

        Str.get_strings(KEYS.map((key) => ({key: key, component: 'theme_boost_union'}))).then(function(list) {
            const s = {};
            KEYS.forEach((key, i) => {
                s[key] = list[i];
            });
            const text = (n, one, many) => (n === 1 ? s[one] : s[many]).replace('{$a}', number(n));

            /**
             * Put the text in the count element of a section header, creating it when missing.
             *
             * @param {HTMLElement} header The section's title row.
             * @param {String} value The text, or '' for none.
             */
            const setCount = function(header, value) {
                let counts = header.querySelector(':scope > .salek-section-counts');
                if (!counts) {
                    counts = document.createElement('span');
                    counts.className = 'salek-section-counts';
                    header.appendChild(counts);
                }
                if (counts.textContent !== value) {
                    counts.textContent = value;
                }
                counts.hidden = value === '';
            };

            /**
             * Activity type (Moodle's hidden label in the name link) and dates on one line.
             */
            const updateMeta = function() {
                root.querySelectorAll('.activity-item .activity-name-area').forEach(function(area) {
                    const item = area.closest('.activity-item');
                    const label = area.querySelector('.instancename > .accesshide');
                    let meta = area.querySelector(':scope > .salek-activity-meta');
                    const dates = item.querySelector(':scope > .activity-grid > .activity-dates');
                    if (!label && !dates) {
                        return;
                    }
                    if (!meta) {
                        meta = document.createElement('div');
                        meta.className = 'salek-activity-meta';
                        area.appendChild(meta);
                    }
                    if (label) {
                        let type = meta.querySelector(':scope > .salek-activity-type');
                        if (!type) {
                            type = document.createElement('span');
                            type.className = 'salek-activity-type';
                            type.setAttribute('aria-hidden', 'true'); // Screen readers have the hidden label.
                            meta.prepend(type);
                        }
                        const value = label.textContent.trim();
                        if (type.textContent !== value) {
                            type.textContent = value;
                        }
                    }
                    if (dates) {
                        meta.appendChild(dates);
                    }
                });
            };

            const update = function() {
                updateMeta();
                const sections = root.querySelectorAll('ul[data-for="course_sectionlist"] > li.course-section');
                sections.forEach(function(section) {
                    const header = section.querySelector(':scope > .section-item > .course-section-header');
                    if (!header) {
                        return;
                    }
                    const lessons = section.querySelectorAll(':scope > .section-item > .content > ul.section > li.modtype_subsection').length;
                    const activities = section.querySelectorAll(ACTIVITY).length;
                    const parts = [];
                    if (lessons) {
                        parts.push(text(lessons, 'saleklessoncount', 'saleklessonscount'));
                    }
                    if (activities) {
                        parts.push(text(activities, 'salekactivitycount', 'salekactivitiescount'));
                    }
                    setCount(header, parts.join(' · '));
                });
                root.querySelectorAll('li.course-section.delegated-section').forEach(function(lesson) {
                    const header = lesson.querySelector(':scope > .section-item > .course-section-header');
                    if (header) {
                        const activities = lesson.querySelectorAll(ACTIVITY).length;
                        setCount(header, activities ? text(activities, 'salekactivitycount', 'salekactivitiescount') : '');
                    }
                });
            };

            update();
            let scheduled = false;
            new MutationObserver(function() {
                if (!scheduled) {
                    scheduled = true;
                    window.requestAnimationFrame(function() {
                        scheduled = false;
                        update();
                    });
                }
            }).observe(root, {childList: true, subtree: true});
            return true;
        }).catch(function() {
            // Counts are a convenience; the page works without them.
        });
    };

    return {
        init: init
    };
});
