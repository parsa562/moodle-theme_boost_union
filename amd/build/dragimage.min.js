// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Dragging sections and activities (course page and course index, in edit mode): Moodle puts the
 * top left corner of the dragged picture at the mouse pointer, so the picture jumps away from
 * where it was grabbed (to the side in right-to-left languages). Keep it where it was grabbed:
 * the picture moves with the pointer at the same place under it.
 *
 * Moodle's drag code (core/local/reactive/dragdrop) asks the browser for the corner (0, 0) when
 * the component has no relativeDrag option. This module catches the drag start before it and
 * gives that request the pointer's place in the picture instead.
 *
 * @module     theme_boost_union/dragimage
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    /**
     * Listen to drag starts on the page.
     */
    const init = function() {
        document.addEventListener('dragstart', function(event) {
            const transfer = event.dataTransfer;
            if (!transfer || typeof transfer.setDragImage !== 'function') {
                return;
            }
            const setDragImage = transfer.setDragImage.bind(transfer);
            transfer.setDragImage = function(image, x, y) {
                if (x === 0 && y === 0 && image instanceof Element) {
                    const rect = image.getBoundingClientRect();
                    x = Math.round(Math.min(Math.max(event.clientX - rect.left, 0), rect.width));
                    y = Math.round(Math.min(Math.max(event.clientY - rect.top, 0), rect.height));
                }
                setDragImage(image, x, y);
            };
        }, true);
    };

    return {
        init: init
    };
});
