'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

interface SubscriptionManagerProps {
  userId: string;
}

export function SubscriptionManager({ userId }: SubscriptionManagerProps) {
  const handleGoToSubscription = () => {
    window.location.href = '/subscription';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGoToSubscription} className="w-full md:w-auto">
          Manage Subscription
        </Button>
      </CardContent>
    </Card>
  );
}
