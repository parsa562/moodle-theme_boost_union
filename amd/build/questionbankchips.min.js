// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Question bank filters: show the number of questions of a chosen category ("Chapter 1 (11)")
 * as a small badge in the chip instead of the number in brackets.
 *
 * Moodle builds the chip from the text of a select option, so the number can only be separated
 * in the page; the chip is re-drawn whenever the selection changes, hence the observer. The
 * spaces Moodle puts before a subcategory's name (its indent in the list) are removed from the
 * chip, where they only pushed the content off centre.
 *
 * @module     theme_boost_union/questionbankchips
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    "use strict";

    const COUNT = /^(.*\S)\s*\((\d+)\)\s*$/s;
    const ARABIC = /[\u0600-\u06FF]/;

    /**
     * Put the name of a chip in its own element, marked when it is in Persian/Arabic script (whose
     * letters the stylesheet lifts to the middle of the chip). The count stays outside it.
     *
     * @param {HTMLElement} chip
     */
    const wrapText = function(chip) {
        const textNode = Array.from(chip.childNodes).find(function(node) {
            return node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !COUNT.test(node.textContent);
        });
        if (!textNode || chip.querySelector('.salek-chip-text')) {
            return;
        }
        const text = document.createElement('span');
        text.className = 'salek-chip-text' + (ARABIC.test(textNode.textContent) ? ' salek-chip-text-arabic' : '');
        textNode.replaceWith(text);
        text.append(textNode);
    };

    /**
     * Move a trailing "(N)" of each chip into a badge.
     *
     * @param {HTMLElement} root Element to search for chips.
     */
    const decorate = function(root) {
        root.querySelectorAll('.form-autocomplete-selection [role="option"][data-value]').forEach(function(chip) {
            chip.childNodes.forEach(function(node) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent !== node.textContent.trim()) {
                    node.textContent = node.textContent.trim();
                }
            });
            wrapText(chip);
            if (chip.querySelector('.salek-chip-count')) {
                return;
            }
            const textNode = Array.from(chip.childNodes).find(function(node) {
                return node.nodeType === Node.TEXT_NODE && COUNT.test(node.textContent);
            });
            if (!textNode) {
                return;
            }
            const match = textNode.textContent.match(COUNT);
            const badge = document.createElement('span');
            badge.className = 'salek-chip-count';
            badge.textContent = match[2];
            textNode.textContent = match[1];
            chip.insertBefore(badge, chip.firstChild);
            wrapText(chip);
        });
    };

    /**
     * Decorate the chips of the question bank filters now and whenever they are re-drawn.
     */
    const init = function() {
        document.querySelectorAll('.filter-group').forEach(function(filters) {
            decorate(filters);
            if ('MutationObserver' in window) {
                new MutationObserver(function() {
                    decorate(filters);
                }).observe(filters, {childList: true, subtree: true});
            }
        });
    };

    return {
        init: init
    };
});
