# AI Chat App Subscription System Setup

This guide will help you set up the complete subscription system with Razorpay integration for your AI chat application.

## Features Implemented

✅ **Two Subscription Plans:**
- **Free Plan**: 10 searches + 2 deep searches per day
- **Pro Plan**: 100 searches + 20 deep searches per day
  - Monthly: $20/month
  - Yearly: $192/year ($16/month - 20% savings)

✅ **Payment Integration:**
- Razorpay payment gateway
- Secure payment verification
- Transaction tracking
- Subscription management

✅ **Usage Tracking:**
- Daily usage limits enforcement
- Real-time usage monitoring
- Automatic usage reset

✅ **User Interface:**
- Modern pricing plans page
- Payment modal with Razorpay integration
- Subscription status dashboard
- Usage progress bars

## Environment Variables Setup

Add the following variables to your `.env.local` file:

```env
# Database
POSTGRES_URL=your_postgres_url_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Providers
OPENAI_API_KEY=your_openai_api_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Subscription Plans Configuration
# Free Plan Limits
FREE_PLAN_SEARCHES_PER_DAY=10
FREE_PLAN_DEEP_SEARCHES_PER_DAY=2

# Pro Plan Limits
PRO_PLAN_SEARCHES_PER_DAY=100
PRO_PLAN_DEEP_SEARCHES_PER_DAY=20

# Pro Plan Pricing (in USD cents)
PRO_PLAN_MONTHLY_PRICE=2000
PRO_PLAN_YEARLY_PRICE=19200

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Webhook Secret for Razorpay
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Environment
NODE_ENV=development
```

## Razorpay Setup

### 1. Create Razorpay Account
1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for an account
3. Complete KYC verification

### 2. Get API Keys
1. Go to Settings → API Keys
2. Generate API keys for Test/Live mode
3. Copy Key ID and Key Secret

### 3. Configure Webhooks (Optional)
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret

### 4. Update Environment Variables
Replace the Razorpay placeholders in `.env.local`:
```env
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=your_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Database Setup

The subscription tables are already created via the migration. The system includes:

- `UserSubscription` - User plan and billing information
- `UsageTracking` - Daily usage tracking per user
- `PaymentTransaction` - Payment history and verification

## Usage in Your Application

### 1. Check User Limits
```typescript
import { canUserPerformAction, incrementUsage } from '@/lib/services/subscription';

// Before allowing a search
const canSearch = await canUserPerformAction(userId, 'search');
if (!canSearch) {
  return { error: 'Daily search limit reached' };
}

// After successful search
await incrementUsage(userId, 'search');
```

### 2. Get Subscription Status
```typescript
import { getUserSubscription, getUserRemainingUsage } from '@/lib/services/subscription';

const subscription = await getUserSubscription(userId);
const usage = await getUserRemainingUsage(userId);
```

### 3. Navigation
Add subscription link to your navigation:
```tsx
<Link href="/subscription">Subscription</Link>
```

## API Endpoints

The following API endpoints are available:

- `POST /api/subscription/create-order` - Create Razorpay order
- `POST /api/subscription/verify-payment` - Verify payment and update subscription
- `GET /api/subscription/status` - Get user subscription and usage status

## Testing

### Test Mode
1. Use Razorpay test API keys
2. Use test payment methods from [Razorpay docs](https://razorpay.com/docs/payments/test-card-details/)
3. Test card: 4111 1111 1111 1111, CVV: 123, Expiry: Any future date

### Production Deployment
1. Switch to Razorpay live keys
2. Update `NEXT_PUBLIC_SITE_URL` to your production domain
3. Configure production webhook URLs

## Features Overview

### Subscription Plans Page (`/subscription`)
- Displays current plan and usage
- Shows pricing for both plans
- Handles plan upgrades
- Progress bars for daily usage

### Payment Flow
1. User selects plan (monthly/yearly)
2. Payment modal opens with Razorpay
3. Payment processed securely
4. Subscription activated automatically
5. Usage limits updated immediately

### Usage Enforcement
- Automatic daily usage tracking
- Prevents overuse of API calls
- Graceful error handling
- Usage resets at midnight UTC

## Customization

### Modify Plan Limits
Update environment variables:
```env
FREE_PLAN_SEARCHES_PER_DAY=15
PRO_PLAN_SEARCHES_PER_DAY=200
```

### Change Pricing
Update pricing in cents:
```env
PRO_PLAN_MONTHLY_PRICE=2500  # $25
PRO_PLAN_YEARLY_PRICE=24000  # $240
```

### Add New Plan Types
1. Update `PlanType` in `lib/config/subscription.ts`
2. Add new plan configuration
3. Update database schema enum values
4. Update UI components

## Troubleshooting

### Common Issues

1. **Razorpay not loading**
   - Check `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
   - Verify internet connectivity
   - Check browser console for errors

2. **Payment verification fails**
   - Verify `RAZORPAY_KEY_SECRET` is correct
   - Check payment signature generation
   - Review server logs

3. **Usage limits not enforcing**
   - Check database connection
   - Verify user ID is correct
   - Check timezone settings (usage resets at UTC midnight)

### Support
For issues with:
- Razorpay integration: Check [Razorpay Documentation](https://razorpay.com/docs/)
- Database: Verify connection and schema
- Payments: Check transaction logs in Razorpay dashboard

## Security Notes

- Never expose `RAZORPAY_KEY_SECRET` in client-side code
- Always verify payment signatures on the server
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Validate user authentication for all subscription endpoints

## Next Steps

1. Set up your Razorpay account and get API keys
2. Configure environment variables
3. Test with Razorpay test cards
4. Integrate usage checking in your AI endpoints
5. Deploy to production with live API keys

Your subscription system is now ready! Users can upgrade to Pro plans and enjoy higher usage limits while you can monetize your AI chat application. 