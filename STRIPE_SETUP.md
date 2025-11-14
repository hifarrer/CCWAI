# Stripe Checkout Integration Setup Guide

This guide will help you set up Stripe Checkout integration for subscription plans.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Stripe API keys (from Stripe Dashboard)
3. Plans configured in the admin dashboard with Stripe Price IDs

## Step 1: Install Dependencies

Run the following command to install the Stripe SDK:

```bash
npm install stripe
```

## Step 2: Configure Stripe Settings in Admin Dashboard

1. Log in to your admin dashboard at `/admin`
2. Navigate to the "Stripe Settings" section
3. Enter your Stripe API keys:
   - **Publishable Key**: Your Stripe publishable key (starts with `pk_`)
   - **Secret Key**: Your Stripe secret key (starts with `sk_`)
   - **Webhook Secret**: You'll get this after setting up the webhook (starts with `whsec_`)

## Step 3: Create Products and Prices in Stripe

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**
3. For each subscription plan (Free and Premium):
   - Create a product with the plan name
   - Add a price for monthly billing
   - Add a price for yearly billing
   - Copy the Price IDs (they start with `price_`)

## Step 4: Add Price IDs to Plans

1. Go to `/admin/plans` in your admin dashboard
2. Edit each plan (Free and Premium)
3. Add the Stripe Price IDs:
   - **Monthly Stripe Price ID**: The Price ID for monthly billing
   - **Yearly Stripe Price ID**: The Price ID for yearly billing
4. Save the changes

## Step 5: Set Up Stripe Webhook

### For Local Development (using Stripe CLI):

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to your admin dashboard under Stripe Settings → Webhook Secret

### For Production:

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
5. Select the following events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add it to your admin dashboard under Stripe Settings → Webhook Secret

## Step 6: Test the Integration

### Test Mode:

1. Make sure you're using Stripe test mode keys (keys starting with `pk_test_` and `sk_test_`)
2. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date and any CVC

3. Test the checkout flow:
   - Go to `/plans`
   - Click "Get Started" on a paid plan
   - Complete the checkout with a test card
   - Verify the user's plan is updated in the database

### Production Mode:

1. Switch to live mode keys in your admin dashboard
2. Use real payment methods for testing
3. Monitor webhook events in Stripe Dashboard

## How It Works

1. **User clicks "Get Started"**: The plans page calls `/api/checkout` with the plan ID and billing period
2. **Checkout Session Created**: The API creates a Stripe Checkout session using the Price ID from the database
3. **User Completes Payment**: Stripe handles the payment securely
4. **Webhook Received**: When payment succeeds, Stripe sends a webhook to `/api/webhooks/stripe`
5. **Plan Updated**: The webhook handler updates the user's plan in the database
6. **User Redirected**: User is redirected to `/checkout/success` page

## Troubleshooting

### Webhook Not Working

- Verify the webhook URL is correct
- Check that the webhook secret is correctly set in the admin dashboard
- Check Stripe Dashboard → Webhooks → Events to see if events are being received
- Check your server logs for webhook errors

### Checkout Not Starting

- Verify Stripe keys are set in the admin dashboard
- Check that Price IDs are added to plans
- Check browser console for errors
- Verify user is logged in

### Plan Not Updating After Payment

- Check webhook events in Stripe Dashboard
- Verify webhook secret is correct
- Check server logs for webhook processing errors
- Ensure the webhook handler is receiving events

## Security Notes

- Never commit Stripe keys to version control
- Use environment variables or database storage (as implemented)
- Always verify webhook signatures
- Use HTTPS in production
- Regularly rotate API keys

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

