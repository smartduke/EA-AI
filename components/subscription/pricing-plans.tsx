'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { SUBSCRIPTION_CONFIG } from '@/lib/config/subscription';
import { PaymentModal } from './payment-modal';

interface PricingPlansProps {
  currentPlan?: string;
  isLoading?: boolean;
}

export function PricingPlans({
  currentPlan = 'free',
  isLoading = false,
}: PricingPlansProps) {
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    planType: 'pro';
    billingPeriod: 'monthly' | 'yearly';
  }>({
    isOpen: false,
    planType: 'pro',
    billingPeriod: 'monthly',
  });

  const plans = [
    {
      name: SUBSCRIPTION_CONFIG.FREE_PLAN.NAME,
      type: 'free',
      price: 0,
      yearlyPrice: 0,
      description: 'Perfect for getting started',
      features: [
        `${SUBSCRIPTION_CONFIG.FREE_PLAN.SEARCHES_PER_DAY} searches per day`,
        `${SUBSCRIPTION_CONFIG.FREE_PLAN.DEEP_SEARCHES_PER_DAY} deep searches per day`,
        'Basic AI responses',
        'Chat history',
      ],
      popular: false,
      buttonText: currentPlan === 'free' ? 'Current Plan' : 'Get Started',
      disabled: currentPlan === 'free',
    },
    {
      name: SUBSCRIPTION_CONFIG.PRO_PLAN.NAME,
      type: 'pro',
      price: SUBSCRIPTION_CONFIG.PRO_PLAN.PRICE_MONTHLY / 100, // Convert from cents
      yearlyPrice: SUBSCRIPTION_CONFIG.PRO_PLAN.PRICE_YEARLY / 100, // Convert from cents
      description: 'For power users who need more',
      features: [
        `${SUBSCRIPTION_CONFIG.PRO_PLAN.SEARCHES_PER_DAY} searches per day`,
        `${SUBSCRIPTION_CONFIG.PRO_PLAN.DEEP_SEARCHES_PER_DAY} deep searches per day`,
        'Advanced AI responses',
        'Priority support',
        'Unlimited chat history',
        'Export conversations',
      ],
      popular: true,
      buttonText: currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      disabled: currentPlan === 'pro',
    },
  ];

  const handleUpgrade = (
    planType: 'pro',
    billingPeriod: 'monthly' | 'yearly',
  ) => {
    setPaymentModal({
      isOpen: true,
      planType,
      billingPeriod,
    });
  };

  return (
    <>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Choose Your Plan
          </h2>
          <p className="text-muted-foreground mt-2">
            Select the plan that best fits your needs
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.type}
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>

                <div className="mt-4">
                  {plan.type === 'free' ? (
                    <div className="text-4xl font-bold">Free</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl font-bold">
                        ${plan.price}
                        <span className="text-lg font-normal text-muted-foreground">
                          /month
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        or ${plan.yearlyPrice / 12}/month billed annually ($
                        {plan.yearlyPrice}/year)
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.type === 'free' ? (
                  <Button
                    className="w-full"
                    variant={plan.disabled ? 'secondary' : 'default'}
                    disabled={plan.disabled || isLoading}
                  >
                    {plan.buttonText}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      variant={plan.disabled ? 'secondary' : 'default'}
                      disabled={plan.disabled || isLoading}
                      onClick={() => handleUpgrade('pro', 'monthly')}
                    >
                      {plan.disabled ? plan.buttonText : 'Monthly Plan'}
                    </Button>
                    {!plan.disabled && (
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => handleUpgrade('pro', 'yearly')}
                      >
                        Yearly Plan (Save 20%)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
        planType={paymentModal.planType}
        billingPeriod={paymentModal.billingPeriod}
      />
    </>
  );
}
