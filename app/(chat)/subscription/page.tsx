'use client';

import { useEffect, useState } from 'react';
import { PricingPlans } from '@/components/subscription/pricing-plans';

interface SubscriptionData {
  subscription: {
    planType: string;
    billingPeriod: string | null;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    searches: {
      used: number;
      limit: number;
      remaining: number;
    };
    deepSearches: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
}

export default function SubscriptionPage() {
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data);
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">
            Loading subscription data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and usage
          </p>
        </div>

        {subscriptionData && (
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Current Plan */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium capitalize">
                    {subscriptionData.subscription.planType}
                  </span>
                </div>
                {subscriptionData.subscription.billingPeriod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing:</span>
                    <span className="font-medium capitalize">
                      {subscriptionData.subscription.billingPeriod}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`font-medium ${
                      subscriptionData.subscription.status === 'active'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {subscriptionData.subscription.status}
                  </span>
                </div>
                {subscriptionData.subscription.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next billing:</span>
                    <span className="font-medium">
                      {new Date(
                        subscriptionData.subscription.currentPeriodEnd,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Today&apos;s Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Searches</span>
                    <span>
                      {subscriptionData.usage.searches.used}/
                      {subscriptionData.usage.searches.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(subscriptionData.usage.searches.used / subscriptionData.usage.searches.limit) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Deep Searches</span>
                    <span>
                      {subscriptionData.usage.deepSearches.used}/
                      {subscriptionData.usage.deepSearches.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(subscriptionData.usage.deepSearches.used / subscriptionData.usage.deepSearches.limit) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <PricingPlans
          currentPlan={subscriptionData?.subscription.planType}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
