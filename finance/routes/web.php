<?php

use App\Http\Controllers\Admin\AccountController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\RecurringTransactionController;
use App\Http\Controllers\Admin\SavingsController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')
    ->prefix('profile')
    ->name('profile.')
    ->controller(ProfileController::class)
    ->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::patch('/', 'update')->name('update');
        Route::patch('/theme', 'updateTheme')->name('theme.update');
        Route::delete('/', 'destroy')->name('destroy');
    });

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('savings', [SavingsController::class, 'index'])->name('savings.index');
        Route::post('savings/goals', [SavingsController::class, 'storeGoal'])->name('savings.goals.store');
        Route::post('savings/accounts', [SavingsController::class, 'storeAccount'])->name('savings.accounts.store');
        Route::resource('transactions', TransactionController::class);
        Route::resource('subscriptions', RecurringTransactionController::class)
            ->only(['index', 'store']);
        Route::resource('accounts', AccountController::class)
            ->only(['index', 'store', 'update', 'destroy']);
        Route::resource('categories', CategoryController::class)
            ->only(['index', 'show', 'store', 'update', 'destroy']);
    });

Route::middleware('web')->group(__DIR__.'/auth.php');
