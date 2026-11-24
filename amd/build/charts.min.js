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
 * Moodle's charts (a person's logs, the quiz's grades and statistics, the reports' charts): in the
 * site's font (Moodle: Chart.js's own font, which has no Persian letters). Sets Chart.js's
 * defaults, so charts drawn later get them, and redraws the charts already drawn; again once the
 * site's font has loaded (a canvas does not redraw itself when a font arrives). Chart.js is loaded
 * only on pages with a chart.
 *
 * @module     theme_boost_union/charts
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    /**
     * Initialise.
     */
    const init = function() {
        if (!document.querySelector('.chart-area')) {
            return;
        }
        require(['core/chartjs'], function(Chart) {
            const d = Chart.defaults;
            d.font.family = window.getComputedStyle(document.body).fontFamily;
            d.plugins.title.font = {size: 14, weight: '600'};

            const redraw = function() {
                Object.values(Chart.instances).forEach(function(chart) {
                    chart.update('none');
                });
            };
            redraw();
            if (document.fonts) {
                document.fonts.ready.then(redraw);
            }
        });
    };

    return {
        init: init
    };
});
