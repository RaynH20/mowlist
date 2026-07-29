# MowList Production Launch Checklist

## Pre-launch (do these BEFORE going live)

### 1. Stripe Webhook (5 min)
- Go to https://dashboard.stripe.com/test/webhooks (or live when ready)
- Click "Add endpoint"
- URL: `https://tnqcmfqnzuuvdrgpqpwv.supabase.co/functions/v1/stripe-webhook`
- Events to send:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `account.updated` (for Connect)
  - `customer.subscription.*` (for pro subscriptions)
- Copy the signing secret and add as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets
- Test by clicking "Send test event" in the Stripe dashboard

### 2. Database Migrations (5 min)
Run these SQL files in Supabase SQL Editor (in order):
1. `supabase/migrations/2026-07-28_save_payment_methods.sql` — adds stripe_customer_id, payments table, webhook_events table
2. (Previous RLS fixes from earlier sessions)

### 3. Edge Function Deployment (10 min)
Deploy these functions via Supabase Dashboard → Edge Functions:
- `create-payment-intent` (UPDATED — gets/creates Stripe Customer, supports Connect)
- `list-payment-methods` (NEW)
- `delete-payment-method` (NEW)
- `create-connect-account` (NEW)
- `stripe-webhook` (NEW)

For each:
1. Create a new function with the function name
2. Paste the code from `supabase/functions/<name>/index.ts`
3. Set the secret `STRIPE_SECRET_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for the webhook)
4. Deploy

### 4. Environment Variables
- Vercel: `VITE_STRIPE_PUBLISHABLE_KEY` (already set ✅)
- Vercel: `VITE_SUPABASE_URL` (already set ✅)
- Vercel: `VITE_SUPABASE_ANON_KEY` (already set ✅)

### 5. Switch to Stripe Live Mode (when ready)
- Create live Stripe keys
- Update Vercel env: `VITE_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- Update Supabase Edge Function secret: `STRIPE_SECRET_KEY` → `sk_live_...`
- Update Stripe webhook endpoint to live mode
- Test with real $1 payment and refund

## Optional but recommended

### Rotate Secrets
- Generate new `SUPABASE_SERVICE_ROLE_KEY` in Supabase → Settings → API
- Generate new `SUPABASE_ANON_KEY` (forces all users to re-auth)
- Delete old GitHub PAT

### Re-enable Email Confirmation
- Supabase → Authentication → Providers → Email → toggle "Confirm email" on
- This requires users to click a link in their email to verify
- Update auth-context to handle the "email not confirmed" state

### Update Supabase RLS
The bookings/policies should already be working from previous sessions. Test by:
- Sign in as Jane (customer) → can only see her own bookings ✅
- Sign in as a pro → can see unassigned + their assigned bookings ✅
- Sign in as admin → should see everything (if admin dashboard is built)

## Launch

Once all the above is done:
1. Switch Supabase project to Pro plan ($25/mo) for backup + better performance
2. Switch Stripe to live mode (see #5 above)
3. Test one full booking end-to-end with a real card
4. Add MowList to your phone home screen
5. Start onboarding your first 1-2 pros
6. Take your first real booking 🎉

## Support

- Documentation: This file
- Edge Function logs: Supabase Dashboard → Edge Functions → Logs
- Stripe logs: https://dashboard.stripe.com/logs
- Vercel deploy logs: https://vercel.com/dashboard → MowList → Deployments
- GitHub: https://github.com/RaynH20/mowlist
