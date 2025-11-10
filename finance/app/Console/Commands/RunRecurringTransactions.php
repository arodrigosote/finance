<?php

namespace App\Console\Commands;

use App\Services\RecurringTransactions\RecurringTransactionScheduler;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RunRecurringTransactions extends Command
{
    protected $signature = 'recurring:run {--date= : Fecha de referencia (YYYY-MM-DD)}';

    protected $description = 'Genera transacciones desde las suscripciones recurrentes vencidas';

    public function __construct(private readonly RecurringTransactionScheduler $scheduler)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $referenceOption = $this->option('date');
        $reference = $referenceOption ? Carbon::parse($referenceOption) : null;

        $count = $this->scheduler->processDue($reference);

        $message = $count === 1
            ? 'Se generó 1 movimiento a partir de suscripciones.'
            : "Se generaron {$count} movimientos a partir de suscripciones.";

        $this->info($message);

        return self::SUCCESS;
    }
}
