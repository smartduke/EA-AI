# Subscription Payment Troubleshooting Guide

## "Failed to initiate payment. Please try again." Error

This error occurs when the payment modal cannot initiate the Razorpay payment flow. Here's how to debug and fix it:

## Step 1: Check Environment Variables

First, ensure all required environment variables are set in your `.env.local` file:

```env
# Required for Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# Required for database
POSTGRES_URL=your_postgres_url

# Required for authentication
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - Subscription configuration (has defaults)
FREE_PLAN_SEARCHES_PER_DAY=10
FREE_PLAN_DEEP_SEARCHES_PER_DAY=2
PRO_PLAN_SEARCHES_PER_DAY=100
PRO_PLAN_DEEP_SEARCHES_PER_DAY=20
PRO_PLAN_MONTHLY_PRICE=2000
PRO_PLAN_YEARLY_PRICE=19200
```

## Step 2: Use Debug Endpoint

1. Start your development server: `npm run dev`
2. Visit: `http://localhost:3000/api/subscription/debug`
3. Check the response for missing environment variables

## Step 3: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try to initiate a payment
4. Look for error messages that show:
   - "Creating order for: ..." 
   - "Create order response status: ..."
   - Any error messages

## Step 4: Common Issues and Solutions

### Issue 1: Missing Razorpay Keys
**Error**: "Payment configuration missing"
**Solution**: 
- Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
- Settings → API Keys
- Copy Key ID and Key Secret
- Add them to `.env.local`:
```env
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=abcd1234efgh5678
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890
```

### Issue 2: Database Connection
**Error**: API returns 500 error
**Solution**: 
- Check if `POSTGRES_URL` is correct
- Test database connection: `npm run db:studio`
- Ensure migrations are run: `npm run db:migrate`

### Issue 3: Authentication Issues
**Error**: "Unauthorized" or user session issues
**Solution**:
- Ensure you're logged in
- Check Supabase configuration
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue 4: Order Creation Fails
**Error**: "Failed to create order: 400/500"
**Solution**:
- Check the console for specific error details
- Verify plan type and billing period are valid
- Check user authentication status

### Issue 5: Razorpay Script Not Loading
**Error**: "Payment system is loading"
**Solution**:
- Check internet connectivity
- Verify Razorpay CDN is accessible
- Check browser console for script loading errors

## Step 5: Test with Debug Information

The PaymentModal now shows debug information at the bottom:
- "Razorpay loaded: Yes/No"
- "Key configured: Yes/No"

If you see "No" for either, that's your issue.

## Step 6: Test with Razorpay Test Cards

Once the payment modal opens, use these test cards:

**Success Card:**
- Number: 4111 1111 1111 1111
- CVV: 123
- Expiry: Any future date

**Failure Card:**
- Number: 4000 0000 0000 0002
- CVV: 123
- Expiry: Any future date

## Step 7: Check Network Requests

In Browser Dev Tools → Network tab:
1. Try to initiate payment
2. Look for `/api/subscription/create-order` request
3. Check if it returns 200 or an error
4. If error, check the response body for details

## Quick Setup Checklist

- [ ] Razorpay account created
- [ ] Test API keys generated
- [ ] Environment variables added to `.env.local`
- [ ] Development server restarted after adding env vars
- [ ] Database migrations completed
- [ ] User is logged in
- [ ] Browser console checked for errors

## Still Having Issues?

If the payment still fails:

1. **Check the detailed error logs** in the browser console
2. **Run the debug endpoint** to verify configuration
3. **Test the API endpoints directly** using tools like Postman
4. **Verify Razorpay dashboard** for any account issues

## Example Working .env.local

```env
# Database
POSTGRES_URL=postgresql://user:pass@localhost:5432/database

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Razorpay Test Keys
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=abcd1234efgh5678ijkl
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional subscription config (has defaults)
PRO_PLAN_MONTHLY_PRICE=2000
PRO_PLAN_YEARLY_PRICE=19200
```

## API Testing

You can test the API endpoints directly:

### Test Order Creation
```bash
curl -X POST http://localhost:3000/api/subscription/create-order \
  -H "Content-Type: application/json" \
  -d '{"planType":"pro","billingPeriod":"monthly"}'
```

### Test Status Endpoint
```bash
curl http://localhost:3000/api/subscription/status
```

The payment system should work once all environment variables are properly configured and the database is set up correctly. 