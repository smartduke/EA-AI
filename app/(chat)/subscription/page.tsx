'use client';

import { useEffect, useState } from 'react';
import { PricingPlans } from '@/components/subscription/pricing-plans';
import { InvoiceList } from '@/components/subscription/invoice-list';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CreditCard, FileText, Settings, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/toast';
import { createClient } from '@/lib/supabase/client';

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
  const [isManaging, setIsManaging] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!error && session?.user) {
        setIsAuthenticated(true);
        // Only fetch subscription data if user is authenticated
        await fetchSubscriptionData();
      } else {
        setIsAuthenticated(false);
        // Set default free plan data for non-authenticated users
        setSubscriptionData({
          subscription: {
            planType: 'free',
            billingPeriod: null,
            status: 'active',
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
          usage: {
            searches: {
              used: 0,
              limit: 50,
              remaining: 50,
            },
            deepSearches: {
              used: 0,
              limit: 50,
              remaining: 50,
            },
          },
        });
        setIsLoading(false);
      }
    };

    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch('/api/subscription/status');
        const data = await response.json();

        if (response.ok) {
          setSubscriptionData(data);
        } else {
          console.error('Failed to fetch subscription data:', data.error);
          // Set default free plan data
          setSubscriptionData({
            subscription: {
              planType: 'free',
              billingPeriod: null,
              status: 'active',
              currentPeriodStart: null,
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
            },
            usage: {
              searches: {
                used: 0,
                limit: 50,
                remaining: 50,
              },
              deepSearches: {
                used: 0,
                limit: 50,
                remaining: 50,
              },
            },
          });
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        // Set default free plan data
        setSubscriptionData({
          subscription: {
            planType: 'free',
            billingPeriod: null,
            status: 'active',
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
          usage: {
            searches: {
              used: 0,
              limit: 50,
              remaining: 50,
            },
            deepSearches: {
              used: 0,
              limit: 50,
              remaining: 50,
            },
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleManagePayment = async () => {
    try {
      setIsManaging(true);
      const response = await fetch('/api/subscription/portal');

      if (!response.ok) {
        throw new Error('Failed to access billing portal');
      }

      const data = await response.json();

      // Open billing portal in new tab
      window.open(data.portalUrl, '_blank');

      toast({
        type: 'success',
        description: 'Billing portal opened in new tab',
      });
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      toast({
        type: 'error',
        description: 'Failed to access billing portal. Please try again.',
      });
    } finally {
      setIsManaging(false);
    }
  };

  const handleViewInvoices = () => {
    setShowInvoices(true);
  };

  const handleCancelSubscription = async () => {
    const confirmCancel = confirm(
      'Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.',
    );

    if (!confirmCancel) return;

    try {
      setIsManaging(true);
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtPeriodEnd: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      const data = await response.json();

      toast({
        type: 'success',
        description: data.message,
      });

      // Refresh subscription data
      const statusResponse = await fetch('/api/subscription/status');
      if (statusResponse.ok) {
        const updatedData = await statusResponse.json();
        setSubscriptionData(updatedData);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to cancel subscription',
      });
    } finally {
      setIsManaging(false);
    }
  };

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
        {/* Only show heading for authenticated users */}
        {isAuthenticated && (
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Subscription</h1>
            <p className="text-muted-foreground mt-2">
              Manage your subscription and usage
            </p>
          </div>
        )}

        {/* Only show subscription data for authenticated users */}
        {isAuthenticated && subscriptionData && (
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

        {/* Subscription Management Section */}
        {subscriptionData &&
          subscriptionData.subscription.planType !== 'free' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Manage Subscription
                </CardTitle>
                <CardDescription>
                  Manage your billing, payment methods, and subscription
                  settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button
                    variant="outline"
                    onClick={handleManagePayment}
                    disabled={isManaging}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    {isManaging ? 'Loading...' : 'Manage Payment'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleViewInvoices}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Invoices
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={
                      isManaging ||
                      subscriptionData.subscription.cancelAtPeriodEnd
                    }
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {subscriptionData.subscription.cancelAtPeriodEnd
                      ? 'Cancellation Pending'
                      : isManaging
                        ? 'Processing...'
                        : 'Cancel Subscription'}
                  </Button>
                </div>

                {subscriptionData.subscription.cancelAtPeriodEnd && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Your subscription will cancel at the end of the current
                        billing period
                      </span>
                    </div>
                    {subscriptionData.subscription.currentPeriodEnd && (
                      <p className="text-sm text-yellow-700 mt-1">
                        Access will continue until{' '}
                        {new Date(
                          subscriptionData.subscription.currentPeriodEnd,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        <PricingPlans
          currentPlan={subscriptionData?.subscription.planType}
          isLoading={isLoading}
          isAuthenticated={isAuthenticated}
        />

        {/* Invoice List Modal */}
        <InvoiceList
          isOpen={showInvoices}
          onClose={() => setShowInvoices(false)}
        />
      </div>
    </div>
  );
}
