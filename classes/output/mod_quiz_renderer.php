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

namespace theme_boost_union\output;

use html_writer;
use mod_quiz\output\attempt_summary_information;
use mod_quiz\output\grades\grade_out_of;
use mod_quiz\output\list_of_attempts;
use mod_quiz\output\navigation_panel_base;
use mod_quiz\output\navigation_question_button;

/**
 * Theme Boost Union - Quiz renderer.
 *
 * Salek: on the attempt page, the quiz's name under "Back" (the page's own heading, with the
 * quiz's name, is hidden there); the summary of an attempt (on its review) with a name for each of
 * its rows, so the theme can lay them out (the grades big, the times on a line, the feedback under
 * them), on the review and on the quiz's page (its list of the attempts, a card each); the
 * result on the quiz's page in a card, the grade big.
 *
 * @package    theme_boost_union
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_quiz_renderer extends \mod_quiz\output\renderer {
    /**
     * The tertiary navigation for pages during the attempt; as Moodle's, with the quiz's name.
     *
     * @param string|\moodle_url $quizviewurl url of the view.php page for this quiz.
     * @return string HTML to output.
     */
    public function during_attempt_tertiary_nav($quizviewurl): string {
        if ($this->page->pagelayout === 'secure') {
            // Do not show the back button in the secure layout on quiz pages.
            return '';
        }
        $output = html_writer::start_div('tertiary-navigation');
        $output .= html_writer::start_div('row');
        $output .= html_writer::start_div('navitem');
        $output .= html_writer::link($quizviewurl, get_string('back'),
                ['class' => 'btn btn-secondary']);
        $output .= html_writer::end_div();
        $output .= html_writer::end_div();
        // (Only where the page's own heading is hidden: other pages, as the one to start an attempt,
        // show it.)
        if ($this->page->cm && $this->page->pagetype === 'mod-quiz-attempt') {
            $output .= html_writer::tag('h2', $this->page->cm->get_formatted_name(), ['class' => 'salek-quiz-title']);
        }
        $output .= html_writer::end_div();
        return $output;
    }

    /**
     * The quiz navigation (in the blocks drawer); as Moodle's, with a line above the buttons with
     * how many questions are answered ("Answered: 3 out of 20"), and a key under them with the
     * states their colours show (only those in this attempt, and "Flagged" when one is).
     *
     * @param navigation_panel_base $panel the panel.
     * @return string HTML to output.
     */
    public function navigation_panel(navigation_panel_base $panel) {
        $output = '';
        $userpicture = $panel->user_picture();
        if ($userpicture) {
            $fullname = fullname($userpicture->user);
            if ($userpicture->size) {
                $fullname = html_writer::div($fullname);
            }
            $output .= html_writer::tag('div', $this->render($userpicture) . $fullname,
                    ['id' => 'user-picture', 'class' => 'clearfix']);
        }
        $output .= $panel->render_before_button_bits($this);

        $buttons = $panel->get_question_buttons();
        $total = 0;
        $answered = 0;
        $states = [];
        $flagged = false;
        foreach ($buttons as $button) {
            if (!$button instanceof navigation_question_button || !$button->isrealquestion) {
                continue;
            }
            $total++;
            if (!in_array($button->stateclass, ['notyetanswered', 'notanswered', 'invalidanswer', 'blocked'])) {
                $answered++;
            }
            $states[$button->stateclass] = true;
            $flagged = $flagged || $button->flagged;
        }
        if ($total) {
            $output .= html_writer::div(
                html_writer::span(get_string('answered', 'quiz')) .
                html_writer::span(get_string('outof', 'quiz', ['grade' => $answered, 'maxgrade' => $total]),
                    'salek-qn-count'),
                'salek-qn-summary');
        }

        $bcc = $panel->get_button_container_class();
        $output .= html_writer::start_tag('div', ['class' => "qn_buttons clearfix $bcc"]);
        foreach ($buttons as $button) {
            $output .= $this->render($button);
        }
        $output .= html_writer::end_tag('div');

        // (The key: a small square in each state's colours, the state's name.)
        $key = '';
        foreach (array_keys($states) as $state) {
            if (get_string_manager()->string_exists($state, 'question')) {
                $key .= html_writer::span(html_writer::span('', 'salek-qn-swatch') . get_string($state, 'question'),
                    'salek-qn-key-item ' . $state);
            }
        }
        if ($flagged) {
            $key .= html_writer::span(html_writer::span('', 'salek-qn-swatch') . get_string('flagged', 'question'),
                'salek-qn-key-item flagged');
        }
        if ($key) {
            $output .= html_writer::div($key, 'salek-qn-key', ['aria-hidden' => 'true']);
        }

        $output .= html_writer::tag('div', $panel->render_end_bits($this),
                ['class' => 'othernav']);

        $this->page->requires->js_init_call('M.mod_quiz.nav.init', null, false,
                quiz_get_js_module());

        return $output;
    }

    /**
     * The summary of an attempt; as Moodle's table, with each row's name as a class and a grade's
     * parts (the grade, what it is out of, the percent) each in a span.
     *
     * @param attempt_summary_information $summary the summary.
     * @return string HTML to output.
     */
    protected function render_attempt_summary_information(attempt_summary_information $summary): string {
        // (Its rows and caption are only available to the class itself.)
        [$rows, $caption] = (fn() => [$this->summarydata, $this->caption])->call($summary);
        if (!$rows) {
            return '';
        }

        $states = [];
        foreach (['inprogress', 'overdue', 'finished', 'abandoned', 'submitted'] as $state) {
            $states[get_string('state' . $state, 'quiz')] = $state;
        }

        $items = [];
        foreach ($rows as $shortname => $row) {
            $title = $row['title'] instanceof \renderable ? $this->render($row['title']) : $row['title'];
            if ($row['content'] instanceof grade_out_of) {
                $content = $this->salek_grade_out_of($row['content']);
            } else if ($row['content'] instanceof \renderable) {
                $content = $this->render($row['content']);
            } else {
                $content = $row['content'];
            }
            $class = 'salek-qs-' . preg_replace('/[^a-z]/', '', $shortname);
            if ($shortname === 'state') {
                $class .= ' salek-qs-state-' . ($states[strip_tags($content)] ?? 'other');
            }
            $items[] = ['class' => $class, 'title' => $title, 'content' => $content];
        }

        return $this->render_from_template('theme_boost_union/salek_quiz_attempt_summary',
                ['items' => $items, 'caption' => $caption]);
    }

    /**
     * The list of the attempts on the quiz's page; as Moodle's, each attempt's summary as on its
     * review (see render_attempt_summary_information()), in a card with the attempt's name and its
     * review link on a line above it.
     *
     * @param list_of_attempts $list the list.
     * @return string HTML to output.
     */
    protected function render_list_of_attempts(list_of_attempts $list): string {
        // (Its attempts and time are only available to the class itself.)
        [$attempts, $timenow] = (fn() => [$this->attempts, $this->timenow])->call($list);
        if (!$attempts) {
            return '';
        }

        $items = [];
        foreach ($attempts as $attemptobj) {
            $displayoptions = $attemptobj->get_display_options(true);
            $items[] = [
                'name' => get_string('attempt', 'mod_quiz', $attemptobj->get_attempt_number()),
                'summary' => $this->render(attempt_summary_information::create_for_attempt($attemptobj, $displayoptions)),
                'reviewlink' => $attemptobj->get_access_manager($timenow)->make_review_link(
                    $attemptobj->get_attempt(), $displayoptions, $this),
            ];
        }

        return $this->render_from_template('theme_boost_union/salek_quiz_list_of_attempts', ['attempts' => $items]);
    }

    /**
     * The result on the quiz's page (the grade so far or the final grade, the teacher's comment, the
     * overall feedback); as Moodle's, in a card: the grade big with what it is called above it
     * (instead of a sentence), the others on lines of their own with their titles.
     *
     * @param \stdClass $quiz the quiz settings.
     * @param \context_module $context the quiz context.
     * @param \stdClass|\cm_info $cm the course module.
     * @param \mod_quiz\output\view_page $viewobj the page's information.
     * @return string HTML to output.
     */
    public function view_result_info($quiz, $context, $cm, $viewobj) {
        if (!$viewobj->numattempts && !$viewobj->gradecolumn && is_null($viewobj->mygrade)) {
            return '';
        }
        $output = '';

        if ($viewobj->overallstats) {
            $mygrade = quiz_format_grade($quiz, $viewobj->mygrade);
            $maxgrade = quiz_format_grade($quiz, $quiz->grade);
            if ($viewobj->moreattempts) {
                $label = quiz_get_grading_option_name($quiz->grademethod);
                $sentence = get_string('gradesofar', 'quiz',
                    (object) ['method' => $label, 'mygrade' => $mygrade, 'quizgrade' => $maxgrade]);
            } else {
                $label = get_string('finalgrade', 'grades');
                $sentence = get_string('yourfinalgradeis', 'quiz',
                    get_string('outofshort', 'quiz', (object) ['grade' => $mygrade, 'maxgrade' => $maxgrade]));
            }
            $grade = html_writer::span($mygrade, 'salek-grade-value');
            $grade .= html_writer::span('/ ' . $maxgrade, 'salek-grade-max');
            if ($quiz->grade > 0) {
                $grade .= html_writer::span(get_string('percents', 'core',
                    format_float($viewobj->mygrade / $quiz->grade * 100, 0)), 'salek-grade-percent');
            }
            // (For screen readers, Moodle's own sentence.)
            $output .= html_writer::div(
                html_writer::span($label, 'salek-quiz-result-label', ['aria-hidden' => 'true']) .
                html_writer::span($grade, 'salek-grade', ['aria-hidden' => 'true']) .
                html_writer::tag('h3', $sentence, ['class' => 'visually-hidden']),
                'salek-quiz-result-grade');
        }

        if ($viewobj->mygradeoverridden) {
            $output .= html_writer::tag('p', get_string('overriddennotice', 'grades'),
                ['class' => 'overriddennotice salek-quiz-result-note']);
        }
        if ($viewobj->gradebookfeedback) {
            $output .= html_writer::div(
                $this->heading(get_string('comment', 'quiz'), 3, 'salek-quiz-result-title') .
                html_writer::div($viewobj->gradebookfeedback, 'quizteacherfeedback'),
                'salek-quiz-result-row salek-quiz-result-comment');
        }
        if ($viewobj->feedbackcolumn) {
            $output .= html_writer::div(
                $this->heading(get_string('overallfeedback', 'quiz'), 3, 'salek-quiz-result-title') .
                html_writer::div(quiz_feedback_for_grade($viewobj->mygrade, $quiz, $context), 'quizgradefeedback'),
                'salek-quiz-result-row salek-quiz-result-feedback');
        }

        if (!$output) {
            return '';
        }
        return $this->box($output, 'generalbox salek-quiz-result', 'feedback');
    }

    /**
     * A grade out of its total, its parts in spans: the grade, "/ the total", and the percent.
     *
     * @param grade_out_of $grade the grade.
     * @return string HTML to output.
     */
    protected function salek_grade_out_of(grade_out_of $grade): string {
        $values = $grade->get_formatted_values();
        $output = html_writer::span($values->grade, 'salek-grade-value');
        $output .= html_writer::span('/ ' . $values->maxgrade, 'salek-grade-max');
        if (isset($values->percent)) {
            $output .= html_writer::span(get_string('percents', 'core', $values->percent), 'salek-grade-percent');
        }
        // (For screen readers, Moodle's own words: "0.00 out of 10.00 (0%)".)
        return html_writer::span($output, 'salek-grade', ['aria-hidden' => 'true']) .
            html_writer::span(get_string($grade->get_string_key(), 'quiz', $values), 'visually-hidden');
    }
}
