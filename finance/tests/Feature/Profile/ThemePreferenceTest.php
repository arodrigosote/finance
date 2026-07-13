<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThemePreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_save_theme_preference(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.theme.update'), ['theme' => 'light']);

        $response->assertRedirect();
        $this->assertSame('light', $user->refresh()->theme);
    }

    public function test_theme_preference_must_be_supported(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from(route('profile.edit'))
            ->patch(route('profile.theme.update'), ['theme' => 'sepia']);

        $response->assertRedirect(route('profile.edit'));
        $response->assertSessionHasErrors('theme');
        $this->assertNull($user->refresh()->theme);
    }
}
