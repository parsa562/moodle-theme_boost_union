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

namespace theme_boost_union\output\mod_quiz;

use html_writer;
use mod_quiz\structure;
use question_bank;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/mod/quiz/locallib.php');

/**
 * Theme Boost Union - Quiz editing renderer.
 *
 * Salek: on the quiz's questions page, each question's ID number (the one set on the question,
 * as the question bank shows it) after its name.
 *
 * @package    theme_boost_union
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class edit_renderer extends \mod_quiz\output\edit_renderer {
    /**
     * The question's name (with its ID number) as a link to edit it; as Moodle's, but for the
     * ID number.
     *
     * @param structure $structure object containing the structure of the quiz.
     * @param int $slot which slot we are outputting.
     * @param \moodle_url $pageurl the canonical URL of this page.
     * @return string HTML to output.
     */
    public function question_name(structure $structure, $slot, $pageurl) {
        global $DB;

        $question = $structure->get_question_in_slot($slot);
        if (!question_bank::is_qtype_usable($question->qtype)) {
            return parent::question_name($structure, $slot, $pageurl);
        }

        // (The quiz's own query does not load it.)
        if (!isset($question->idnumber)) {
            $question->idnumber = empty($question->questionbankentryid) ? null :
                $DB->get_field('question_bank_entries', 'idnumber', ['id' => $question->questionbankentryid]);
        }

        $editurl = new \moodle_url('/question/bank/editquestion/question.php', [
                'returnurl' => $pageurl->out_as_local_url(),
                'cmid' => $structure->get_cmid(), 'id' => $question->questionid]);

        $instancename = quiz_question_tostring($question, false, true, true);

        $qtype = question_bank::get_qtype($question->qtype, false);
        $namestr = $qtype->local_name();

        $icon = $this->pix_icon('icon', $namestr, $qtype->plugin_name(), ['title' => $namestr,
                'class' => 'activityicon', 'alt' => $namestr]);

        $editicon = $this->pix_icon('t/edit', '', 'moodle', ['title' => '']);

        // Need plain question name without html tags for link title.
        $title = shorten_text(format_string($question->name), 100);

        $canedit = question_has_capability_on($question->questionid, 'edit');
        $instancename = $canedit ? $editicon . $instancename : $instancename;
        $questionname = $icon . html_writer::tag('span', $instancename, ['class' => 'instancename']);
        if (!$canedit) {
            return $questionname;
        }
        return html_writer::link($editurl, $questionname, [
            'title' => get_string('editquestion', 'quiz') . ' ' . $title,
        ]);
    }
}
