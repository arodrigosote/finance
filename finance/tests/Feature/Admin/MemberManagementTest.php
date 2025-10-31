<?php

namespace Tests\Feature\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_feature_is_not_available_anymore(): void
    {
        $this->markTestSkipped('La administración de personas fue removida del panel.');
    }
}
