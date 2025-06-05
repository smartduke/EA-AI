'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/toast';
import {
  SUBSCRIPTION_CONFIG,
  getPlanPrice,
  type PlanType,
  type BillingPeriod,
} from '@/lib/config/subscription';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: PlanType;
  billingPeriod: BillingPeriod;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentModal({
  isOpen,
  onClose,
  planType,
  billingPeriod,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    if (!window.Razorpay && !razorpayLoaded) {
      loadRazorpay();
    } else if (window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, [razorpayLoaded]);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast({
        type: 'error',
        description: 'Payment system is loading. Please try again.',
      });
      return;
    }

    try {
      setIsLoading(true);

      console.log('Creating order for:', { planType, billingPeriod });

      // Create order
      const response = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          billingPeriod,
        }),
      });

      console.log('Create order response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Create order error:', errorData);
        throw new Error(
          `Failed to create order: ${response.status} ${errorData}`,
        );
      }

      const order = await response.json();
      console.log('Order created:', order);

      // Check if Razorpay key is available
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        console.error('NEXT_PUBLIC_RAZORPAY_KEY_ID not found');
        throw new Error('Payment configuration missing');
      }

      console.log('Razorpay key ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'InfoxAI',
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan - ${billingPeriod}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            console.log('Payment successful, verifying:', response);
            // Verify payment
            const verifyResponse = await fetch(
              '/api/subscription/verify-payment',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              },
            );

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.text();
              console.error('Payment verification error:', errorData);
              throw new Error('Payment verification failed');
            }

            const result = await verifyResponse.json();
            console.log('Payment verified:', result);

            toast({
              type: 'success',
              description:
                'Payment successful! Your subscription has been activated.',
            });

            onClose();

            // Reload page to update subscription status
            window.location.reload();
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              type: 'error',
              description:
                'Payment verification failed. Please contact support.',
            });
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setIsLoading(false);
          },
        },
      };

      console.log('Opening Razorpay with options:', options);
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        type: 'error',
        description: `Failed to initiate payment: ${error instanceof Error ? error.message : 'Please try again.'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const price = getPlanPrice(planType, billingPeriod);
  const formattedPrice = (price / 100).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Confirm Subscription</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium">
              {SUBSCRIPTION_CONFIG.PRO_PLAN.NAME} Plan
            </h4>
            <p className="text-sm text-muted-foreground">
              {billingPeriod === 'yearly' ? 'Annual' : 'Monthly'} subscription
            </p>
            <div className="mt-2">
              <span className="text-2xl font-bold">${formattedPrice}</span>
              <span className="text-muted-foreground">
                {billingPeriod === 'yearly' ? '/year' : '/month'}
              </span>
            </div>
            {billingPeriod === 'yearly' && (
              <p className="text-sm text-green-600 mt-1">
                Save 20% with annual billing!
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h5 className="font-medium">What you&apos;ll get:</h5>
            <ul className="text-sm space-y-1">
              <li>
                • {SUBSCRIPTION_CONFIG.PRO_PLAN.SEARCHES_PER_DAY} searches per
                day
              </li>
              <li>
                • {SUBSCRIPTION_CONFIG.PRO_PLAN.DEEP_SEARCHES_PER_DAY} deep
                searches per day
              </li>
              <li>• Advanced AI responses</li>
              <li>• Priority support</li>
              <li>• Unlimited chat history</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isLoading || !razorpayLoaded}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : `Pay $${formattedPrice}`}
            </Button>
          </div>

          {/* Debug info */}
          <div className="text-xs text-muted-foreground mt-4">
            <p>Debug: Razorpay loaded: {razorpayLoaded ? 'Yes' : 'No'}</p>
            <p>
              Key configured:{' '}
              {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
