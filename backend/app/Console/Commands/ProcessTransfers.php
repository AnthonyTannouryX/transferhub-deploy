<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Transfer;
use App\Services\TransferProcessingService;
use Carbon\Carbon;

class ProcessTransfers extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'transfers:process';

    /**
     * The console command description.
     */
    protected $description = 'Automatically process transfer statuses based on time rules';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Processing transfer statuses...');

        $processingService = new TransferProcessingService();
        $results = $processingService->processTransfers();

        // Display automated processing results
        if (!empty($results['automated'])) {
            $this->info("Automated Processing Results:");
            $this->info("- Pending → Completed (Express): {$results['automated']['pending_to_completed']}");
            $this->info("- Pending → Processing (Standard): {$results['automated']['pending_to_processing']}");
            $this->info("- Processing → Completed (Standard): {$results['automated']['processing_to_completed']}");
            $this->info("- Pending → Failed: {$results['automated']['pending_to_failed']}");

            // Show speed tier breakdown if available
            if (isset($results['automated']['speed_tier_breakdown'])) {
                $this->info("Speed Tier Breakdown:");
                foreach ($results['automated']['speed_tier_breakdown'] as $tier => $count) {
                    $this->info("  - {$tier}: {$count} transfers");
                }
            }
        }

        // Display manual processing results
        if (!empty($results['manual'])) {
            $this->info("Manual Processing Results:");
            $this->info("- Pending Review: {$results['manual']['pending_review']}");
            $this->info("- Admin Required: {$results['manual']['admin_required']}");
        }

        // Display errors
        if (!empty($results['errors'])) {
            $this->error("Errors occurred:");
            foreach ($results['errors'] as $error) {
                $this->error("- {$error}");
            }
        }

        $this->info('Transfer processing completed!');
        $this->info("Processing Mode: {$processingService->getProcessingMode()}");
    }

}
