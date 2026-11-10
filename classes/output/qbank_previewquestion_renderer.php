<?php
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
 * Theme Boost Union - Question preview renderer.
 *
 * @package    theme_boost_union
 * @copyright  2026 Salek
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace theme_boost_union\output;

/**
 * Extending the renderer of the question preview page.
 *
 * @package    theme_boost_union
 * @copyright  2026 Salek
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qbank_previewquestion_renderer extends \qbank_previewquestion\output\renderer {
    /**
     * Salek: the question type's name shown beside its icon (the icon's title, which is the
     * type's name, see core_question_bank_renderer::qtype_icon()).
     *
     * @param array $previewdata
     * @return string
     */
    public function render_preview_page($previewdata) {
        if (!empty($previewdata['questionicon']) &&
                preg_match('/\stitle="([^"]+)"/', $previewdata['questionicon'], $matches)) {
            // (The attribute's value is already escaped.)
            $previewdata['questionicon'] .= \html_writer::tag('span', $matches[1], ['class' => 'salek-qtype-name']);
        }
        return parent::render_preview_page($previewdata);
    }
}
