// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * The messaging preferences page (message/edit.php): Moodle shows only the page's title and opens
 * the messaging drawer at its settings, over the page. This puts the settings in the page instead,
 * under the title, and closes the drawer (hidden by the theme until then, _messages.scss). Moodle's
 * listeners are on the settings' own container, so the settings keep working where they are.
 *
 * @module     theme_boost_union/messageprefs
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    /**
     * The settings once Moodle has loaded them, or null.
     *
     * @return {HTMLElement|null}
     */
    const loadedSettings = function() {
        const view = document.querySelector('[data-region="right-hand-drawer"] [data-region="body-container"] > [data-region="view-settings"]');
        if (!view || !view.getAttribute('data-init')) {
            return null;
        }
        const content = view.querySelector('[data-region="content-container"]');
        return content && !content.classList.contains('hidden') && view.querySelector('[data-region="settings"] > *') ? view : null;
    };

    /**
     * Move the settings when they are there; done.
     *
     * @return {Boolean} Whether they were moved.
     */
    const move = function() {
        const view = loadedSettings();
        const main = document.querySelector('#region-main div[role="main"]');
        if (!view || !main) {
            return false;
        }
        view.classList.add('salek-msgprefs');
        main.append(view);
        const close = document.querySelector('[data-region="right-hand-drawer"] [data-action="closedrawer"]');
        if (close) {
            close.click();
        }
        document.body.classList.add('salek-msgprefs-moved');
        return true;
    };

    const init = function() {
        if (move()) {
            return;
        }
        const observer = new MutationObserver(function() {
            if (move()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-init']});
        // (If Moodle never loads them, the drawer is shown after all, as Moodle has it.)
        setTimeout(function() {
            observer.disconnect();
            document.body.classList.add('salek-msgprefs-moved');
        }, 10000);
    };

    return {
        init: init
    };
});
