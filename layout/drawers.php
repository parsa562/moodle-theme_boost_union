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
 * Theme Boost Union - Drawers page layout.
 *
 * This layoutfile is based on theme/boost/layout/drawers.php
 *
 * Modifications compared to this layout file:
 * * Include activity navigation
 * * Include course related hints
 * * Include back to top button
 * * Include scroll spy
 * * Include footnote
 * * Include static pages
 * * Include accessibility pages
 * * Include Jvascript disabled hint
 * * Include advertisement tiles
 * * Include slider
 * * Include info banners
 * * Include additional block regions
 * * Handle admin setting for right-hand block drawer of site home
 * * Include smart menus
 * * Include course index modification
 *
 * @package   theme_boost_union
 * @copyright 2022 Luca Bösch, BFH Bern University of Applied Sciences luca.boesch@bfh.ch
 * @copyright based on code from theme_boost by Bas Brands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/behat/lib.php');
require_once($CFG->dirroot . '/course/lib.php');

// Require own locallib.php.
require_once($CFG->dirroot . '/theme/boost_union/locallib.php');

// Add block button in editing mode.
$addblockbutton = $OUTPUT->addblockbutton();

if (isloggedin()) {
    $courseindexopen = (get_user_preferences('drawer-open-index', true) == true);

    if (isguestuser()) {
        $sitehomerighthandblockdrawerserverconfig = get_config('theme_boost_union', 'showsitehomerighthandblockdraweronguestlogin');
    } else {
        $sitehomerighthandblockdrawerserverconfig = get_config('theme_boost_union', 'showsitehomerighthandblockdraweronfirstlogin');
    }

    $isadminsettingyes = ($sitehomerighthandblockdrawerserverconfig == THEME_BOOST_UNION_SETTING_SELECT_YES);
    $blockdraweropen = (get_user_preferences('drawer-open-block', $isadminsettingyes)) == true;
} else {
    $courseindexopen = false;
    $blockdraweropen = false;

    if (get_config('theme_boost_union', 'showsitehomerighthandblockdraweronvisit') == THEME_BOOST_UNION_SETTING_SELECT_YES) {
        $blockdraweropen = true;
    }
}

if (defined('BEHAT_SITE_RUNNING') && get_user_preferences('behat_keep_drawer_closed') != 1) {
    try {
        if (
            get_config('theme_boost_union', 'showsitehomerighthandblockdraweronvisit') === false &&
            get_config('theme_boost_union', 'showsitehomerighthandblockdraweronguestlogin') === false &&
            get_config('theme_boost_union', 'showsitehomerighthandblockdraweronfirstlogin') === false
        ) {
            $blockdraweropen = true;
        }
    } catch (Exception $e) {
        echo $e->getMessage();

        $blockdraweropen = true;
    }
}

$extraclasses = ['uses-drawers'];
if ($courseindexopen) {
    $extraclasses[] = 'drawer-open-index';
}

$blockshtml = $OUTPUT->blocks('side-pre');
$hasblocks = (strpos($blockshtml, 'data-block=') !== false || !empty($addblockbutton));
if (!$hasblocks) {
    $blockdraweropen = false;
}
$courseindex = core_course_drawer();
if (!$courseindex) {
    $courseindexopen = false;
}

$forceblockdraweropen = $OUTPUT->firstview_fakeblocks();

$secondarynavigation = false;
$overflow = '';
if ($PAGE->has_secondary_navigation()) {
    $tablistnav = $PAGE->has_tablist_secondary_navigation();
    $moremenu = new \core\navigation\output\more_menu($PAGE->secondarynav, 'nav-tabs', true, $tablistnav);
    $secondarynavigation = $moremenu->export_for_template($OUTPUT);
    $overflowdata = $PAGE->secondarynav->get_overflow_menu_data();
    if (!is_null($overflowdata)) {
        $selectmenu = new \core\output\select_menu(
            'tertiarynavigation',
            $overflowdata->urls,
            $overflowdata->selected,
        );
        $selectmenu->set_label($overflowdata->label, $overflowdata->labelattributes);
        $overflow = $selectmenu->export_for_template($OUTPUT);
    }
}

// Load the navigation from boost_union primary navigation, the extended version of core primary navigation.
// It includes the smart menus and menu items, for multiple locations.
$primary = new theme_boost_union\output\navigation\primary($PAGE);
$renderer = $PAGE->get_renderer('core');
$primarymenu = $primary->export_for_template($renderer);

// Salek: the phone bottom bar (Boost Union 5.3 has none). The two body classes are the ones the
// Salek bottom bar styles (and Boost Union 5.2's bottom bar) use.
$salekbottombar = (new theme_boost_union\output\navigation\salek_bottombar($PAGE))->export_bottombar($renderer);
if ($salekbottombar) {
    $extraclasses[] = 'theme-boost-union-smartmenu';
    $extraclasses[] = 'theme-boost-union-bottombar';
}

// Add special class selectors to improve the Smart menus SCSS selectors.
if (isset($primarymenu['includesmartmenu']) && $primarymenu['includesmartmenu'] == true) {
    $extraclasses[] = 'theme-boost-union-smartmenu';
}


// Pages of the participants menu (enrolment, groups, permissions) and the pages they open share one
// design (post.scss, sections 25-26): mark them with one class.
if (preg_match('/^(enrol-|group-|admin-roles-(permissions|check|assign|override)$)/', $PAGE->pagetype)) {
    $extraclasses[] = 'salek-participants-page';
}

// The course settings page (the first page of the course's Settings tab): the title on a dotted
// card above the form (post.scss, section 28). (Activity settings keep the common page header.)
if ($PAGE->pagetype === 'course-edit') {
    $extraclasses[] = 'salek-settings-page';
}

// Include the extra classes for the course index modification.
require_once(__DIR__ . '/includes/courseindex.php');

// Include the extra classes for the section appearance modification.
require_once(__DIR__ . '/includes/sectionappearance.php');

$buildregionmainsettings = !$PAGE->include_region_main_settings_in_header_actions() && !$PAGE->has_secondary_navigation();
// If the settings menu will be included in the header then don't add it here.
$regionmainsettingsmenu = $buildregionmainsettings ? $OUTPUT->region_main_settings_menu() : false;

$bodyattributes = $OUTPUT->body_attributes($extraclasses); // In the original layout file, this line is place more above,
                                                           // but we amended $extraclasses and had to move it.

$header = $PAGE->activityheader;
$headercontent = $header->export_for_template($renderer);

$coursefullname = $PAGE->course?->fullname ? format_string(
    $PAGE->course->fullname,
    true,
    ['context' => context_course::instance($PAGE->course->id), 'escape' => false],
) : '';
$courseurl = $PAGE->course ? new \core\url('/course/view.php', ['id' => $PAGE->course->id]) : null;

// Salek: the number of sections listed in the course index, shown in its title section
// (templates/theme_boost/courseindexdrawercontrols.mustache).
$saleksectioncount = '';
if ($courseindex) {
    $format = course_get_format($PAGE->course);
    $count = 0;
    foreach (get_fast_modinfo($PAGE->course)->get_listed_section_info_all() as $section) {
        if ($format->is_section_visible($section)) {
            $count++;
        }
    }
    $saleksectioncount = get_string($count == 1 ? 'saleksectioncount' : 'saleksectionscount', 'theme_boost_union', $count);
}

$templatecontext = [
    'sitename' => format_string($SITE->shortname, true, ['context' => context_course::instance(SITEID), "escape" => false]),
    'coursefullname' => $coursefullname,
    'courseurl' => $courseurl ? $courseurl->out(false) : null,
    'saleksectioncount' => $saleksectioncount,
    'output' => $OUTPUT,
    'sidepreblocks' => $blockshtml,
    'hasblocks' => $hasblocks,
    'bodyattributes' => $bodyattributes,
    'courseindexopen' => $courseindexopen,
    'blockdraweropen' => $blockdraweropen,
    'courseindex' => $courseindex,
    'primarymoremenu' => $primarymenu['moremenu'],
    'includesmartmenu' => !empty($primarymenu['includesmartmenu']),
    'secondarymoremenu' => $secondarynavigation ?: false,
    'mobileprimarynav' => $primarymenu['mobileprimarynav'],
    'usermenu' => $primarymenu['user'],
    'langmenu' => $primarymenu['lang'],
    'forceblockdraweropen' => $forceblockdraweropen,
    'regionmainsettingsmenu' => $regionmainsettingsmenu,
    'hasregionmainsettingsmenu' => !empty($regionmainsettingsmenu),
    'overflow' => $overflow,
    'headercontent' => $headercontent,
    'addblockbutton' => $addblockbutton,
];

// Add synchronized horizontal scrolling for wide tables: the question bank, the grader report and,
// on every other page, list tables wider than the page.
$isquestionbank = $PAGE->cm && $PAGE->cm->modname === 'qbank';
$PAGE->requires->js_call_amd('theme_boost_union/questionbankscroll', 'init');

// Question bank filters: the number of questions of a chosen category as a badge in its chip.
if ($isquestionbank) {
    $PAGE->requires->js_call_amd('theme_boost_union/questionbankchips', 'init');
}

// Managing course categories and courses: labels for the dropdowns of its bulk actions.
if ($PAGE->pagetype === 'course-management') {
    $PAGE->requires->js_call_amd('theme_boost_union/coursemanagement', 'init');
}

// Front page: a bar to search, sort and view its course cards.
if ($PAGE->pagetype === 'site-index') {
    $strings = [];
    foreach (['cards', 'count', 'defaultorder', 'list', 'nameaz', 'newest', 'none', 'oldest', 'search', 'sort'] as $key) {
        $strings[$key] = get_string('salekcourses' . $key, 'theme_boost_union');
    }
    $PAGE->requires->js_call_amd('theme_boost_union/frontpagecourses', 'init', [$strings]);
}

// Course page: section and activity counts, activity meta line.
if (strpos($PAGE->pagetype, 'course-view-') === 0) {
    $PAGE->requires->js_call_amd('theme_boost_union/coursepage', 'init');
}

// Every page: a "Nothing to display" row in empty list tables.
$PAGE->requires->js_call_amd('theme_boost_union/emptytables', 'init');

// Every page: the letter filters above lists (first name, last name) behind a button.
$PAGE->requires->js_call_amd('theme_boost_union/initialsfilter', 'init', [[
    'filter' => get_string('salekinitialsfilter', 'theme_boost_union'),
    'remove' => get_string('salekinitialsremove', 'theme_boost_union'),
]]);

// Every page with a course index (and the course page): the dragged section or activity stays
// where it was grabbed.
if ($courseindex || strpos($PAGE->pagetype, 'course-view-') === 0) {
    $PAGE->requires->js_call_amd('theme_boost_union/dragimage', 'init');
}

// Every page: Moodle's reactions to a dropdown's change (filter conditions…) also with the theme's
// dropdown lists.
$PAGE->requires->js_call_amd('theme_boost_union/selectchange', 'init');

// Every page: filter cards shown once Moodle has built their rows (no flash of an empty row).
$PAGE->requires->js_call_amd('theme_boost_union/filtersready', 'init');

// The calendar page and the Dashboard: the month calendar with a side panel for today.
if ($PAGE->pagetype === 'calendar-view' || $PAGE->pagetype === 'my-index') {
    $PAGE->requires->js_call_amd('theme_boost_union/calendarpanel', 'init', [[
        'calendar' => get_string('calendar', 'calendar'),
        'today' => get_string('today', 'calendar'),
        'events' => get_string('events', 'calendar'),
        'nothing' => get_string('nothingtodisplay'),
    ]]);
}

// Every page: Moodle's user selectors (checking permissions, assigning roles, enrolling, group members)
// drawn as cards or rows with checkboxes. The words come with the page, so they are drawn without
// waiting for the server.
$PAGE->requires->js_call_amd('theme_boost_union/userpicker', 'init', ['#chooseusersubmit', [
    'selected' => get_string('selected', 'form'),
    'none' => get_string('noselection', 'form'),
]]);

// Include the template content for the course related hints.
require_once(__DIR__ . '/includes/courserelatedhints.php');

// Include the template content for the block regions.
require_once(__DIR__ . '/includes/blockregions.php');

// Include the content for the back to top button.
require_once(__DIR__ . '/includes/backtotopbutton.php');

// Include the content for the Boost Union footer buttons.
require_once(__DIR__ . '/includes/footerbuttons.php');

// Include the content for the scrollspy.
require_once(__DIR__ . '/includes/scrollspy.php');

// Include the template content for the footnote.
require_once(__DIR__ . '/includes/footnote.php');

// Include the template content for the static pages.
require_once(__DIR__ . '/includes/staticpages.php');

// Include the template content for the accessibility pages.
require_once(__DIR__ . '/includes/accessibilitypages.php');

// Include the template content for the footer button.
require_once(__DIR__ . '/includes/footer.php');

// Include the template content for the JavaScript disabled hint.
require_once(__DIR__ . '/includes/javascriptdisabledhint.php');

// Include the template content for the info banners.
require_once(__DIR__ . '/includes/infobanners.php');

// Include the template content for the navbar.
require_once(__DIR__ . '/includes/navbar.php');

// Include the template content for the advertisement tiles, but only if we are on the frontpage.
if ($PAGE->pagelayout == 'frontpage') {
    require_once(__DIR__ . '/includes/advertisementtiles.php');
}

// Include the template content for the slider, but only if we are on the frontpage.
if ($PAGE->pagelayout == 'frontpage') {
    require_once(__DIR__ . '/includes/slider.php');
}

// Include the template content for the smart menus.
require_once(__DIR__ . '/includes/smartmenus.php');

// If we are on MWP.
if (\theme_boost_union\local\mwp::extension_present() == true) {
    // Call the BU MWP class method only if the class and method exist.
    if (
        class_exists('\\local_boost_union_mwp\\local\\layouts') &&
            method_exists('\\local_boost_union_mwp\\local\\layouts', 'postprocess_drawers_templatecontext')
    ) {
        // Post-process the templatecontext array.
        $templatecontext = \local_boost_union_mwp\local\layouts::postprocess_drawers_templatecontext($templatecontext);
    }

    // Render drawers.mustache from local_boost_union_mwp.
    echo $OUTPUT->render_from_template('local_boost_union_mwp/drawers', $templatecontext);

    // Otherwise.
} else {
    // Render drawers.mustache from theme_boost (which is overridden in theme_boost_union).
    echo $OUTPUT->render_from_template('theme_boost/drawers', $templatecontext);
}
