<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AgentStore;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    /**
     * Get public agent stores with location-based filtering
     */
    public function getStores(Request $request): JsonResponse
    {
        try {
            $query = AgentStore::query()
                ->whereIn('status', ['active', 'pending']);

            // Search by name or location
            if ($request->has('q') && !empty($request->q)) {
                $searchTerm = $request->q;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('store_name', 'ilike', "%{$searchTerm}%")
                      ->orWhere('city', 'ilike', "%{$searchTerm}%")
                      ->orWhere('address', 'ilike', "%{$searchTerm}%");
                });
            }

            // Location-based filtering with radius
            if ($request->has('lat') && $request->has('lng') && $request->has('radius_km')) {
                $lat = (float) $request->lat;
                $lng = (float) $request->lng;
                $radiusKm = (float) $request->radius_km;

                // Only filter by distance if store has valid coordinates
                $query->whereNotNull('latitude')
                    ->whereNotNull('longitude')
                    ->selectRaw("
                        *,
                        (
                            6371 * acos(
                                cos(radians(?)) *
                                cos(radians(latitude)) *
                                cos(radians(longitude) - radians(?)) +
                                sin(radians(?)) *
                                sin(radians(latitude))
                            )
                        ) AS distance_km
                    ", [$lat, $lng, $lat])
                    ->whereRaw("
                        (
                            6371 * acos(
                                cos(radians(?)) *
                                cos(radians(latitude)) *
                                cos(radians(longitude) - radians(?)) +
                                sin(radians(?)) *
                                sin(radians(latitude))
                            )
                        ) <= ?
                    ", [$lat, $lng, $lat, $radiusKm]);
            }

            // Filter by open now - check if store is open today
            if ($request->has('open_now') && $request->open_now) {
                $currentDay = strtolower(now()->format('l')); // monday, tuesday, etc.

                $query->whereNotNull('opening_hours')
                    ->where(function ($q) use ($currentDay) {
                        // Check if the store has opening hours for today and is marked as open
                        // Handle both formats: {isOpen: true} and {hours: [...]}
                        $q->whereRaw("
                            (
                                opening_hours::json->?->>'isOpen' = 'true'
                                OR
                                (opening_hours::json->?->'hours' IS NOT NULL)
                            )
                        ", [$currentDay, $currentDay]);
                    });
            }

            // Sort options
            $sortBy = $request->get('sort', 'distance');
            if ($sortBy === 'distance' && $request->has('lat') && $request->has('lng')) {
                $query->orderBy('distance_km', 'asc');
            } else {
                $query->orderBy('store_name', 'asc');
            }

            $stores = $query->get();

            return response()->json([
                'success' => true,
                'data' => $stores,
                'count' => $stores->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stores',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get store name suggestions for autocomplete
     */
    public function getStoreSuggestions(Request $request): JsonResponse
    {
        try {
            $query = $request->get('q', '');

            if (strlen($query) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            $suggestions = AgentStore::query()
                ->whereIn('status', ['active', 'pending'])
                ->where('store_name', 'ilike', "%{$query}%")
                ->select('id', 'store_name')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $suggestions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch suggestions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
