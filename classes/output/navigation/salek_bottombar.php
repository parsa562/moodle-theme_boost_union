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
 * Theme Boost Union - Salek phone bottom bar.
 *
 * Boost Union 5.3 dropped the smart menu bottom bar for now (it is to be re-implemented with React).
 * Salek keeps its phone bottom bar: the primary navigation items plus a Calendar item, rendered with
 * the core more menu in the page footer (see templates/theme_boost/footer.mustache), with the markup
 * the Salek SCSS styles (scss/salek/_navbar.scss).
 *
 * @package    theme_boost_union
 * @copyright  2026 Salek
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace theme_boost_union\output\navigation;

use renderer_base;

/**
 * Salek phone bottom bar.
 */
class salek_bottombar extends primary {
    /** @var \moodle_page $salekpage the page (the parent classes keep theirs private) */
    private $salekpage;

    /**
     * Constructor.
     *
     * @param \moodle_page $page
     */
    public function __construct($page) {
        $this->salekpage = $page;
        parent::__construct($page);
    }

    /**
     * Export the bottom bar for the core/moremenu template, or null if it is not shown on this page.
     *
     * @param renderer_base $output
     * @return array|null
     */
    public function export_bottombar(renderer_base $output): ?array {
        if (!isloggedin() || isguestuser()) {
            return null;
        }

        $nodes = $this->get_primary_nav();
        if (empty($nodes)) {
            return null;
        }

        // Users who get Site administration see that instead of Calendar (see scss/salek/_navbar.scss).
        $calendarurl = new \moodle_url('/calendar/view.php', ['view' => 'month']);
        $nodes[] = [
            'title' => get_string('calendar', 'calendar'),
            'url' => $calendarurl,
            'text' => get_string('calendar', 'calendar'),
            'icon' => null,
            'isactive' => $this->salekpage->url->compare($calendarurl, URL_MATCH_BASE),
            'key' => 'salekcalendar',
            'classes' => ['salek-nav-calendar'],
        ];
        foreach ($nodes as &$node) {
            $node['url'] = $node['url'] instanceof \moodle_url ? $node['url']->out(false) : $node['url'];
        }

        $menu = new \core\navigation\output\more_menu((object) $nodes, 'navbar-nav-bottom-bar', false);
        return $menu->export_for_template($output);
    }
}
