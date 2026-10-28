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

namespace theme_boost_union;

/**
 * Tests for optional hierarchical breadcrumb navigation.
 *
 * @package    theme_boost_union
 * @category   test
 * @coversDefaultClass \theme_boost_union\boostnavbar
 * @copyright  2026 Salek contributors
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class boostnavbar_test extends \advanced_testcase {
    /**
     * Check filtering, deduplication and current-page behaviour using native navbar nodes.
     *
     * @dataProvider hierarchical_items_provider
     * @covers ::prepare_nodes_for_boost
     * @param array $items Node definitions: key, text and optional destination.
     * @param array $expected Expected keys and whether they retain a link.
     */
    public function test_hierarchical_items(array $items, array $expected): void {
        global $CFG, $PAGE;
        require_once($CFG->dirroot . '/theme/boost_union/lib.php');

        $this->resetAfterTest();
        set_config('hierarchicalbreadcrumbs', 'yes', 'theme_boost_union');
        $PAGE->set_context(\context_system::instance());
        $PAGE->set_url('/admin/search.php');
        $PAGE->navbar->ignore_active();

        foreach ($items as [$key, $text, $path]) {
            $PAGE->navbar->add($text, $path === null ? null : new \moodle_url($path), null, null, $key);
        }

        $navbar = new boostnavbar($PAGE);
        $actual = [];
        foreach ($navbar->get_items() as $item) {
            $actual[$item->key] = $item->has_action();
        }
        $this->assertSame($expected, $actual);
    }

    /**
     * Native node fixtures covering navigation patterns independently of page IDs.
     *
     * @return array
     */
    public static function hierarchical_items_provider(): array {
        return [
            'empty root' => [[], []],
            'current page alone' => [[
                ['current', 'Current page', '/current.php'],
            ], []],
            'landing pages are not contextual parents' => [[
                ['home', 'Home', '/'],
                ['myhome', 'Dashboard', '/my/'],
                ['mycourses', 'My courses', '/my/courses.php'],
                ['courses', 'Courses', '/course/index.php'],
                ['current', 'Current page', '/current.php'],
            ], []],
            'linked parents and current page' => [[
                ['myhome', 'Dashboard', '/my/'],
                ['parent', 'Parent', '/parent.php'],
                ['child', 'Child', '/child.php'],
                ['current', 'Current page', '/current.php'],
            ], ['parent' => true, 'child' => true, 'current' => false]],
            'unlinked grouping labels are omitted but the current page remains' => [[
                ['parent', 'Parent', '/parent.php'],
                ['group', 'Grouping label', null],
                ['current', 'Current page', null],
            ], ['parent' => true, 'current' => false]],
            'duplicate destination retains the later node' => [[
                ['earlier', 'Parent', '/parent.php'],
                ['later', 'Parent', '/parent.php'],
                ['current', 'Current page', '/current.php'],
            ], ['later' => true, 'current' => false]],
            'same label with distinct destinations is not a duplicate' => [[
                ['parent', 'Settings', '/parent.php'],
                ['child', 'Settings', '/child.php'],
                ['current', 'Current page', '/current.php'],
            ], ['parent' => true, 'child' => true, 'current' => false]],
            'root aliases do not create a self-referencing trail' => [[
                ['parent', 'Root page', '/current.php'],
                ['current', 'Different label for the same page', '/current.php'],
            ], []],
            'current-page aliases do not discard real parents' => [[
                ['parent', 'Parent', '/parent.php'],
                ['alias', 'Alias', '/current.php'],
                ['current', 'Current page', '/current.php'],
            ], ['parent' => true, 'current' => false]],
            'distinct query parameters identify distinct destinations' => [[
                ['parent', 'Report', '/current.php'],
                ['current', 'Filtered report', '/current.php?filter=1'],
            ], ['parent' => true, 'current' => false]],
        ];
    }

    /**
     * Keeping duplicated navigation parents is explicitly opt-in.
     *
     * @dataProvider navigation_setting_provider
     * @covers ::prepare_nodes_for_boost
     * @param string|null $setting Setting value, or null to leave it unset.
     */
    public function test_navigation_duplicates_are_opt_in(?string $setting): void {
        global $CFG, $PAGE;
        require_once($CFG->dirroot . '/theme/boost_union/lib.php');

        $this->resetAfterTest();
        $this->setAdminUser();
        unset_config('hierarchicalbreadcrumbs', 'theme_boost_union');
        if ($setting !== null) {
            set_config('hierarchicalbreadcrumbs', $setting, 'theme_boost_union');
        }
        $PAGE->set_context(\context_system::instance());
        $PAGE->set_url('/admin/search.php');
        $PAGE->navbar->ignore_active();
        $url = new \moodle_url('/parent.php');
        $PAGE->primarynav->add('Parent', $url, null, null, 'parent');
        $PAGE->secondarynav->add('Child', new \moodle_url('/child.php'), null, null, 'child');
        $PAGE->navbar->add('Parent', $url, null, null, 'parent');
        $PAGE->navbar->add('Child', new \moodle_url('/child.php'), null, null, 'child');
        $PAGE->navbar->add('Current page', new \moodle_url('/current.php'), null, null, 'current');

        $navbar = new boostnavbar($PAGE);
        $this->assertCount($setting === 'yes' ? 3 : 0, $navbar->get_items());
    }

    /**
     * @return array
     */
    public static function navigation_setting_provider(): array {
        return ['unset' => [null], 'disabled' => ['no'], 'enabled' => ['yes']];
    }

    /**
     * Course and grade ancestors survive secondary-navigation deduplication only when enabled.
     *
     * @dataProvider navigation_setting_provider
     * @covers ::prepare_nodes_for_boost
     * @param string|null $setting Setting value, or null to leave it unset.
     */
    public function test_course_parents_are_opt_in(?string $setting): void {
        global $CFG, $PAGE;
        require_once($CFG->dirroot . '/theme/boost_union/lib.php');

        $this->resetAfterTest();
        $this->setAdminUser();
        unset_config('hierarchicalbreadcrumbs', 'theme_boost_union');
        if ($setting !== null) {
            set_config('hierarchicalbreadcrumbs', $setting, 'theme_boost_union');
        }
        set_config('categorybreadcrumbs', 'no', 'theme_boost_union');
        $course = $this->getDataGenerator()->create_course();
        $PAGE->set_course($course);
        $PAGE->set_context(\context_course::instance($course->id));
        $PAGE->set_url('/grade/edit/settings/index.php', ['id' => $course->id]);
        $PAGE->navbar->ignore_active();
        $PAGE->navbar->add(
            $course->shortname,
            new \moodle_url('/course/view.php', ['id' => $course->id]),
            \navigation_node::TYPE_COURSE,
            null,
            $course->id
        );
        $gradesurl = new \moodle_url('/grade/report/index.php', ['id' => $course->id]);
        $PAGE->secondarynav->add('Grades', $gradesurl, null, null, 'grades');
        $PAGE->navbar->add('Grades', $gradesurl, null, null, 'grades');
        $PAGE->navbar->add('Course grade settings', $PAGE->url, null, null, 'current');

        $items = (new boostnavbar($PAGE))->get_items();
        $this->assertCount($setting === 'yes' ? 3 : 0, $items);
        if ($setting === 'yes') {
            $this->assertEquals($course->id, $items[0]->key);
            $this->assertTrue($items[0]->has_action());
            $this->assertTrue($items[1]->has_action());
            $this->assertFalse($items[2]->has_action());
        }
    }

    /**
     * Missing breadcrumb nodes come from native course navigation and a matching active tab.
     *
     * @dataProvider missing_course_context_provider
     * @covers ::restore_course_context
     * @param string $raw Native breadcrumb contents.
     * @param string $active Kind of active secondary-navigation node.
     * @param int $expectedcount Expected breadcrumb length.
     */
    public function test_missing_course_context(string $raw, string $active, int $expectedcount): void {
        global $CFG, $PAGE;
        require_once($CFG->dirroot . '/theme/boost_union/lib.php');

        $this->resetAfterTest();
        $this->setAdminUser();
        set_config('hierarchicalbreadcrumbs', 'yes', 'theme_boost_union');
        set_config('categorybreadcrumbs', 'no', 'theme_boost_union');
        $course = $this->getDataGenerator()->create_course();
        $PAGE->set_course($course);
        $PAGE->set_context(\context_course::instance($course->id));
        $url = new \moodle_url('/local/example/index.php', ['courseid' => $course->id]);
        if ($active === 'coursehome') {
            $url = new \moodle_url('/course/view.php', ['id' => $course->id]);
        }
        $PAGE->set_url($url, ['filter' => 'visible']);
        $PAGE->navbar->ignore_active();
        if ($raw === 'current') {
            $PAGE->navbar->add('Explicit current page', $url, null, null, 'current');
        } else if ($raw === 'course') {
            $PAGE->navbar->add(
                $course->shortname,
                new \moodle_url('/course/view.php', ['id' => $course->id]),
                \navigation_node::TYPE_COURSE,
                null,
                $course->id
            );
        }
        while ($node = $PAGE->secondarynav->find_active_node()) {
            $node->make_inactive();
        }
        $tab = null;
        if ($active !== 'none') {
            $taburl = $active === 'mismatch' ? new \moodle_url('/local/other/index.php') : $url;
            $tab = $PAGE->secondarynav->add('Active section', $taburl, null, null, 'test-section');
            $tab->display = $active !== 'invisible';
            $tab->make_active();
        }

        $items = (new boostnavbar($PAGE))->get_items();
        $this->assertCount($expectedcount, $items);
        if ($expectedcount > 0) {
            $this->assertEquals($course->id, $items[0]->key);
            $this->assertTrue($items[0]->has_action());
            $this->assertFalse($items[1]->has_action());
            $this->assertTrue($items[1]->is_last());
            $this->assertFalse($items[0]->is_last());
            $this->assertSame($raw === 'current' ? 'Explicit current page' : 'Active section', $items[1]->text);
        }
        if ($tab !== null) {
            $this->assertTrue($tab->has_action(), 'Rendering must not change the source navigation node.');
        }
    }

    /**
     * @return array
     */
    public static function missing_course_context_provider(): array {
        return [
            'missing course with native current item' => ['current', 'none', 2],
            'empty native breadcrumb with matching active tab' => ['empty', 'matching', 2],
            'existing course with matching active tab' => ['course', 'matching', 2],
            'native current label takes precedence over the active tab' => ['current', 'matching', 2],
            'unknown destination has no invented current item' => ['empty', 'mismatch', 0],
            'no active tab has no invented current item' => ['empty', 'none', 0],
            'invisible active tab is not exposed' => ['empty', 'invisible', 0],
            'course landing page does not duplicate its course link' => ['empty', 'coursehome', 0],
        ];
    }

    /**
     * Categories remain permission-aware and never make the current page a link.
     *
     * @covers ::prepare_nodes_for_boost
     */
    public function test_hidden_categories_and_current_course(): void {
        global $CFG, $PAGE;
        require_once($CFG->dirroot . '/theme/boost_union/lib.php');

        $this->resetAfterTest();
        set_config('hierarchicalbreadcrumbs', 'yes', 'theme_boost_union');
        set_config('categorybreadcrumbs', 'yes', 'theme_boost_union');
        $category = $this->getDataGenerator()->create_category(['visible' => 0]);
        $course = $this->getDataGenerator()->create_course(['category' => $category->id]);
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id, 'student');

        foreach ([true, false] as $admin) {
            if ($admin) {
                $this->setAdminUser();
            } else {
                $this->setUser($student);
            }
            $PAGE = new \moodle_page();
            $PAGE->set_course($course);
            $PAGE->set_context(\context_course::instance($course->id));
            $PAGE->set_url('/course/view.php', ['id' => $course->id]);
            $PAGE->navbar->ignore_active();
            $PAGE->navbar->add(
                $course->shortname,
                new \moodle_url('/course/view.php', ['id' => $course->id]),
                \navigation_node::TYPE_COURSE,
                null,
                $course->id
            );

            $items = (new boostnavbar($PAGE))->get_items();
            if ($admin) {
                $this->assertCount(2, $items);
                $this->assertInstanceOf(\breadcrumb_navigation_node::class, $items[0]);
                $this->assertSame($category->name, $items[0]->text);
                $this->assertTrue($items[0]->has_action());
                $this->assertFalse($items[1]->has_action());
                $again = (new boostnavbar($PAGE))->get_items();
                $this->assertSame($items[1]->text, $again[1]->text);
            } else {
                // Without an accessible parent, a course landing page has no breadcrumb trail.
                $this->assertSame([], $items);
            }
        }
    }
}
