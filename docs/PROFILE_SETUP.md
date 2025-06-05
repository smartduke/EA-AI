# Profile Page Setup Guide

## Overview

This guide explains the user profile page with profile management and fully functional subscription features integrated with Razorpay.

## ✅ All Features Working - FULLY FUNCTIONAL

### ✅ Profile Management - COMPLETE
- ✅ Full name editing
- ✅ Email display (read-only)
- ✅ Reset and Update buttons
- ✅ Form validation and success/error messages

### ✅ Subscription Management - FULLY FUNCTIONAL WITH RAZORPAY

The subscription system is now fully integrated with Razorpay and includes:

#### **Working Features:**
1. **✅ Real-time Subscription Status**
   - Fetches actual subscription data from database
   - Shows current plan (Free/Pro) with real billing information
   - Displays usage statistics from database
   - Shows billing period, status, and next billing date

2. **✅ Functional Manage Payment Button**
   - Opens Razorpay billing portal in new tab
   - Handles authentication and error states
   - Shows loading states and success/error messages
   - Redirects to customer-specific billing management

3. **✅ Working View Invoices Feature**
   - Fetches real invoice data from payment transactions
   - Shows count of available invoices
   - Displays formatted billing history
   - Includes pagination support for large invoice lists

4. **✅ Fully Functional Cancel Subscription**
   - Real subscription cancellation with Razorpay API
   - Confirmation dialog with clear messaging
   - Updates database and subscription status
   - Shows cancellation pending state
   - Graceful handling if Razorpay API fails
   - Automatic refresh of subscription data after cancellation

#### **API Endpoints Created:**
- **✅ `/api/subscription/cancel`** - POST endpoint for subscription cancellation
- **✅ `/api/subscription/portal`** - GET endpoint for billing portal access  
- **✅ `/api/subscription/invoices`** - GET endpoint for invoice/billing history
- **✅ `/api/subscription/status`** - GET endpoint for current subscription data

#### **Database Integration:**
- ✅ UserSubscription table with Razorpay integration
- ✅ PaymentTransaction table for invoice tracking
- ✅ UsageTracking for daily usage statistics
- ✅ Proper error handling and fallbacks

#### **User Experience:**
- ✅ Loading states for all operations
- ✅ Success and error toast notifications
- ✅ Disabled buttons during processing
- ✅ Real-time subscription data updates
- ✅ Responsive design for mobile and desktop

## Navigation

The profile page is accessible via:
- Direct URL: `/profile`
- User dropdown menu in sidebar ("Profile" option)

## Subscription Management Features

### **For Free Plan Users:**
- Profile editing functionality
- Simple "Manage Subscription" button that redirects to `/subscription`
- No billing management options shown

### **For Paid Plan Users:**
1. **Current Plan Display**:
   - Shows plan type (Pro)
   - Billing period (monthly/yearly)
   - Status (active/cancelled/etc)
   - Next billing date

2. **Usage Statistics**:
   - Daily search usage with progress bars
   - Deep search usage tracking
   - Real-time data from database

3. **Management Actions**:
   - **Manage Payment**: Opens Razorpay customer portal
   - **View Invoices**: Shows billing history and transaction details
   - **Cancel Subscription**: Safe cancellation with confirmation

4. **Cancellation Handling**:
   - Shows warning if subscription is set to cancel
   - Displays end date for cancelled subscriptions
   - Button state changes to "Cancellation Pending"

## Technical Implementation

### **Razorpay Integration:**
- ✅ Full Razorpay API integration for payments
- ✅ Webhook handling for subscription events
- ✅ Secure payment verification
- ✅ Customer portal integration
- ✅ Subscription lifecycle management

### **Database Schema:**
```sql
-- UserSubscription table
CREATE TABLE "UserSubscription" (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  planType VARCHAR CHECK (planType IN ('free', 'pro')),
  billingPeriod VARCHAR CHECK (billingPeriod IN ('monthly', 'yearly')),
  status VARCHAR CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
  currentPeriodStart TIMESTAMP,
  currentPeriodEnd TIMESTAMP,
  cancelAtPeriodEnd BOOLEAN DEFAULT false,
  razorpaySubscriptionId TEXT,
  razorpayCustomerId TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- PaymentTransaction table for invoices
CREATE TABLE "PaymentTransaction" (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  razorpayPaymentId TEXT,
  razorpayOrderId TEXT,
  amount DECIMAL NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  status VARCHAR CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  planType VARCHAR NOT NULL,
  billingPeriod VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### **Security:**
- ✅ Authentication required for all operations
- ✅ User can only access their own data
- ✅ Razorpay signature verification
- ✅ Secure API endpoints with proper error handling

## Current Status: ✅ PRODUCTION READY

The subscription system is now fully functional with:
- ✅ Complete Razorpay payment integration
- ✅ Real database connectivity
- ✅ Working subscription management
- ✅ Functional billing portal access
- ✅ Invoice/billing history retrieval
- ✅ Safe subscription cancellation
- ✅ Error handling and user feedback
- ✅ Responsive and professional UI

## Environment Variables Required

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Database
POSTGRES_URL=your_database_url

# Subscription Pricing (in cents)
PRO_PLAN_MONTHLY_PRICE=2000  # $20.00
PRO_PLAN_YEARLY_PRICE=19200  # $192.00 ($16/month)
```

## Support

If you encounter any issues:
1. Check browser console for error messages
2. Verify user is logged in (redirects to login if not authenticated)
3. Ensure all environment variables are set correctly
4. Check database connectivity and schema
5. Verify Razorpay configuration and webhook setup 