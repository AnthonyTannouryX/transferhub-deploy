<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'personal',
                'display_name' => 'Personal',
                'description' => 'Perfect for individuals and occasional transfers',
                'price' => 0.00,
                'monthly_limit' => 5000.00,
                'transfer_fee' => 4.99,
                'express_fee' => 9.99,
                'exchange_rate_type' => 'standard',
                'features' => [
                    'Up to $5,000/month',
                    'Standard exchange rates',
                    'Email support',
                    'Mobile app access',
                    'Basic security features',
                    'Standard transfer speeds (1-2 days)',
                    'Express transfers available (+$9.99)',
                ],
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'business',
                'display_name' => 'Business',
                'description' => 'Ideal for small businesses and regular users',
                'price' => 29.00,
                'monthly_limit' => 50000.00,
                'transfer_fee' => 2.99, // Reduced fee for subscribers
                'express_fee' => 4.99, // Reduced express fee
                'exchange_rate_type' => 'preferred',
                'features' => [
                    'Up to $50,000/month',
                    'Preferred exchange rates',
                    'Priority support',
                    'API access',
                    'Advanced security',
                    'Multi-user accounts',
                    'Faster processing times',
                    'Reduced transfer fees',
                    'Express transfers at reduced cost',
                ],
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'enterprise',
                'display_name' => 'Enterprise',
                'description' => 'For large organizations with high-volume transfers',
                'price' => 0.00, // Custom pricing
                'monthly_limit' => null, // Unlimited
                'transfer_fee' => 0.00, // Free transfers
                'express_fee' => 0.00, // Free express
                'exchange_rate_type' => 'best',
                'features' => [
                    'Unlimited transfers',
                    'Best exchange rates',
                    'Dedicated account manager',
                    'Custom integrations',
                    'White-label solutions',
                    'Compliance reporting',
                    'Instant transfers',
                    'Free express transfers',
                    'Custom fee structures',
                    'Priority processing',
                ],
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $planData) {
            SubscriptionPlan::updateOrCreate(
                ['name' => $planData['name']],
                $planData
            );
        }

        $this->command->info('Subscription plans seeded successfully!');
    }
}
