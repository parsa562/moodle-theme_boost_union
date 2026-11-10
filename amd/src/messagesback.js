// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * The messages page on phones: the theme shows one part at a time (the conversations, or the open
 * conversation), but Moodle gives an open conversation no way back to the list there (its back
 * button is only in the drawer). This adds a back button at the start of the conversation's
 * header; the theme shows it on phones only (_messages.scss). It puts the list in front (the
 * class salek-msg-list on the row); opening a conversation takes it away again.
 *
 * @module     theme_boost_union/messagesback
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    /**
     * Add the button and follow the clicks.
     *
     * @param {String} label The button's name ("Back").
     */
    const init = function(label) {
        const row = document.querySelector('#region-main .message-app.main .row');
        const header = row && row.querySelector(':scope > .col-8 [data-region="header-container"]');
        if (!header) {
            return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'salek-msg-back';
        button.setAttribute('aria-label', label);
        button.title = label;
        header.prepend(button);

        button.addEventListener('click', function() {
            row.classList.add('salek-msg-list');
        });

        // Opening a conversation, a contact, the contacts or the settings from the list: that in
        // front again.
        row.querySelector(':scope > .col-4').addEventListener('click', function(event) {
            if (event.target.closest('.list-group-item-action, [data-conversation-id], [data-user-id], [data-route]')) {
                row.classList.remove('salek-msg-list');
            }
        });
    };

    return {
        init: init
    };
});
