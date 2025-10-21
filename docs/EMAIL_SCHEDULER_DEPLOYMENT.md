# Email Scheduler Deployment Guide

**Last Updated:** 2025-10-19
**Status:** Ready for Deployment
**Firebase Cloud Functions:** Free Tier Compatible

---

## 📋 What Was Implemented

### ✅ Completed Email Templates (5/5)

1. **WelcomeEmail.tsx** - Immediate welcome email ✅
2. **ActivationReminderEmail.tsx** - 2-hour reminder ✅
3. **ExampleShowcaseEmail.tsx** - 24-hour showcase ✅ **NEW**
4. **TemplateShowcaseEmail.tsx** - 3-day templates ✅ **NEW**
5. **FinalReminderEmail.tsx** - 7-day final reminder ✅ **NEW**

### ✅ Email Scheduling System

- **Firebase Cloud Function:** `sendActivationEmails`
- **Schedule:** Runs every hour (cron: `every 1 hours`)
- **Free Tier Usage:** ~720 invocations/month (well under 125K limit)
- **Separation:** Completely separate from RAG functions (no conflicts)

---

## 🚀 Deployment Steps

### Step 1: Install Dependencies in Functions Folder

```bash
cd functions
npm install
```

This will install:
- `resend@^3.0.0` (email sending)
- Existing dependencies (firebase-admin, firebase-functions, openai)

### Step 2: Set Environment Variables in Firebase

**CRITICAL:** The Cloud Function uses `functions.config()` to read environment variables, which is separate from your `.env` file. You MUST configure these in Firebase.

```bash
# Set Resend API key
firebase functions:config:set resend.api_key="YOUR_RESEND_API_KEY"

# Set sender email (must be verified in Resend)
firebase functions:config:set resend.from_email="hello@brandforge.ai"

# Set reply-to email
firebase functions:config:set resend.reply_to_email="brandforge.me@gmail.com"

# Set your app URL
firebase functions:config:set app.url="https://brandforge.ai"
```

**Current values from .env (use these):**
```
RESEND_API_KEY="re_ArTJ8MBu_6pxYVWJ1qorreAgVYxvqaZzx"
RESEND_FROM_EMAIL="hello@brandforge.ai"
RESEND_REPLY_TO_EMAIL="brandforge.me@gmail.com"
NEXT_PUBLIC_APP_URL="https://brandforge.ai"  # Change to your production URL
```

**Firebase command to set all at once:**
```bash
firebase functions:config:set \
  resend.api_key="re_ArTJ8MBu_6pxYVWJ1qorreAgVYxvqaZzx" \
  resend.from_email="hello@brandforge.ai" \
  resend.reply_to_email="brandforge.me@gmail.com" \
  app.url="https://brandforge.ai" \
  openai.api_key="YOUR_OPENAI_API_KEY"
```

**⚠️ Important:** Replace `YOUR_OPENAI_API_KEY` with your actual OpenAI API key. Find it by running:
```bash
grep OPENAI_API_KEY .env
```

**Why OpenAI?** The RAG maintenance functions need OpenAI for vector embeddings, even though they won't auto-trigger.

**Verify configuration:**
```bash
firebase functions:config:get
```

You should see:
```json
{
  "resend": {
    "api_key": "re_ArTJ8MBu_...",
    "from_email": "hello@brandforge.ai",
    "reply_to_email": "brandforge.me@gmail.com"
  },
  "app": {
    "url": "https://brandforge.ai"
  },
  "openai": {
    "api_key": "sk-..."
  }
}
```

### Step 3: Build the Functions

```bash
cd functions
npm run build
```

This compiles TypeScript to JavaScript in the `functions/lib` folder.

### Step 4: Deploy to Firebase

```bash
# Deploy ONLY the email scheduler function (not RAG functions)
firebase deploy --only functions:sendActivationEmails
```

Or deploy all functions:
```bash
firebase deploy --only functions
```

**Note:** This will deploy:
- `sendActivationEmails` (email scheduler) ← NEW
- `cleanupOldVectors` (RAG maintenance) ← existing
- `updateUserBrandContext` (RAG maintenance) ← existing

**Disabled functions will NOT be deployed** (RAG triggers are commented out).

---

## 🔍 Verification Steps

### 1. Check Function Deployment

```bash
firebase functions:log --only sendActivationEmails
```

You should see scheduled function logs every hour.

### 2. Test Manually (Optional)

You can manually trigger the function for testing:

```bash
firebase functions:call sendActivationEmails
```

### 3. Monitor Firestore

Check that `userActivity.emailsSent` fields are being updated:
- `welcome` ← Set on signup (already working)
- `reminder2h` ← Set 2 hours after signup
- `showcase24h` ← Set 24 hours after signup
- `templates3d` ← Set 3 days after signup
- `final7d` ← Set 7 days after signup

### 4. Check Resend Dashboard

Log into [Resend Dashboard](https://resend.com/emails) to see:
- Email delivery status
- Open rates
- Click rates

---

## 📊 Email Sequence Logic

The Cloud Function checks users every hour and sends emails based on this logic:

| Email | Trigger Condition | Time Window |
|-------|------------------|-------------|
| #1 Welcome | Sent immediately on signup | N/A (server action) |
| #2 Reminder | Not completed Quick Start | 2-24 hours |
| #3 Showcase | Still no activity | 24-72 hours |
| #4 Templates | Still no activity | 3-7 days |
| #5 Final | Still no activity | After 7 days |

**Smart Logic:**
- Only sends to users who haven't completed Quick Start
- Won't send duplicate emails (checks `emailsSent` record)
- Stops after email #5 (won't spam)
- Uses time windows to avoid sending multiple emails at once

---

## 🔐 Security & Privacy

### Environment Variables

**IMPORTANT:** The Cloud Function uses `functions.config()` to read environment variables, **NOT** `process.env`. The `.env` file is only for Next.js.

**How it works in the Cloud Function:**
```typescript
// Functions config (production)
functions.config().resend.api_key
functions.config().resend.from_email
functions.config().resend.reply_to_email
functions.config().app.url

// Fallback to process.env for local development
```

**The code automatically handles both:**
- Production: Uses `functions.config()`
- Local development: Falls back to `process.env`

### Data Access

The function only reads:
- `userIndex/profiles` (list of user IDs)
- `users/{userId}/brandProfiles/{userId}` (email, activity tracking)

It does **NOT** access:
- User passwords
- Payment information
- Generated content (images, posts, etc.)

---

## 💰 Cost Analysis (Free Tier)

### Firebase Cloud Functions

**Free Tier Limits:**
- 125,000 invocations/month
- 40,000 GB-seconds compute time/month
- 5GB network egress/month

**Our Usage:**
- Scheduled function runs: `24 hours × 30 days = 720 invocations/month`
- Each invocation processes ~10-50 users: `~5 seconds × 720 = 3,600 seconds/month`
- Network: Minimal (only Firestore queries + Resend API calls)

**Verdict:** ✅ Well within free tier limits

### Resend

**Free Tier Limits:**
- 3,000 emails/month
- 100 emails/day

**Our Usage (estimated):**
- Assume 100 signups/month
- Each user gets up to 5 emails (if never activates)
- Max: `100 × 5 = 500 emails/month`

**Verdict:** ✅ Well within free tier limits

---

## 🛠️ Troubleshooting

### Problem: Emails not sending

**Check 1:** Environment variables set correctly?
```bash
firebase functions:config:get
```

**Check 2:** Resend API key valid?
- Log into [Resend](https://resend.com) and check API keys

**Check 3:** Check function logs
```bash
firebase functions:log --only sendActivationEmails
```

Look for errors like:
- `[Email Scheduler] Failed to send email`
- `RESEND_API_KEY is undefined`

### Problem: Function not running

**Check scheduler status:**
```bash
firebase functions:log --only sendActivationEmails | grep "Starting scheduled"
```

You should see logs every hour.

**Check if function is deployed:**
```bash
firebase functions:list
```

You should see `sendActivationEmails` in the list.

### Problem: Duplicate emails

This shouldn't happen because the function checks `emailsSent` record before sending. But if it does:

**Check Firestore:**
```
users/{userId}/brandProfiles/{userId}/userActivity/emailsSent
```

Ensure timestamps are being set after each email.

---

## 🔄 Updating the Email Templates

If you want to change email content in the future:

### For Server Actions (Welcome Email - sent immediately)

1. Edit `src/emails/WelcomeEmail.tsx`
2. Rebuild: `npm run build`
3. Deploy to Vercel/your hosting

### For Scheduled Emails (Emails #2-5)

1. Edit the HTML generation functions in `functions/src/email-scheduler.ts`
2. Rebuild: `cd functions && npm run build`
3. Deploy: `firebase deploy --only functions:sendActivationEmails`

**Tip:** The scheduled emails use simple HTML (not React Email components) to keep the Cloud Function lightweight and fast.

---

## 📂 File Structure

```
/home/user/studio/
├── src/
│   ├── emails/
│   │   ├── WelcomeEmail.tsx ✅ NEW
│   │   ├── ActivationReminderEmail.tsx ✅ NEW
│   │   ├── ExampleShowcaseEmail.tsx ✅ NEW
│   │   ├── TemplateShowcaseEmail.tsx ✅ NEW
│   │   └── FinalReminderEmail.tsx ✅ NEW
│   ├── lib/
│   │   ├── email-service.ts ✅ Updated (uses new templates)
│   │   └── email-actions.ts ✅ Existing (sends welcome email)
│   └── types/
│       └── index.ts ✅ Updated (UserActivity interface)
├── functions/
│   ├── src/
│   │   ├── index.ts ✅ Updated (exports email scheduler)
│   │   ├── email-scheduler.ts ✅ NEW (scheduled email logic)
│   │   ├── rag-triggers.ts (unchanged - no conflicts)
│   │   ├── rag-engine.ts (unchanged)
│   │   └── rag-auto-vectorizer.ts (unchanged)
│   ├── package.json ✅ Updated (added resend dependency)
│   └── tsconfig.json (unchanged)
├── docs/
│   └── EMAIL_SCHEDULER_DEPLOYMENT.md ✅ NEW (this file)
└── .env (for Next.js only, not used by Cloud Functions)
```

---

## ✅ Pre-Deployment Checklist

Before deploying, verify:

- [ ] All 5 email templates created
- [ ] Main app builds successfully (`npm run build`)
- [ ] Functions build successfully (`cd functions && npm run build`)
- [ ] Resend API key is valid
- [ ] `hello@brandforge.ai` is verified in Resend
- [ ] Firebase project is active
- [ ] No RAG function conflicts

---

## 🚦 Post-Deployment Monitoring

### Week 1: Monitor Closely

- Check function logs daily: `firebase functions:log`
- Monitor Resend dashboard for delivery issues
- Check a few user profiles to verify `emailsSent` is updating

### Week 2+: Routine Checks

- Check Resend dashboard weekly for open/click rates
- Review Firebase quota usage monthly
- Monitor user activation rates in admin dashboard

---

## 📈 Expected Impact

Based on the Activation & Retention Plan:

**Before Email Automation:**
- Users get welcome email, then silence
- ~10-20% activation rate
- High abandonment after signup

**After Email Automation:**
- Users get 5 strategically-timed emails
- **Expected: 2-3x activation rate** (20-60%)
- **Expected: 50% reduction in abandonment**

**How to measure:**
- Track Quick Start completion rate in admin dashboard
- Compare before/after email sequence deployment
- Monitor Resend open rates (aim for >25%)

---

## 🎯 Next Steps (After Deployment)

1. **Deploy Week 2 improvements:**
   - Add example carousel to Quick Start page
   - Add social sharing buttons
   - Simplify post-success flow

2. **Email Analytics (Week 1 - Phase 5):**
   - Create webhook endpoint `/api/webhooks/resend`
   - Track open rates, click rates
   - Store metrics in Firestore

3. **A/B Testing:**
   - Test different subject lines
   - Test email send times
   - Test content variations

---

## 📞 Support

If you encounter issues:

1. Check Firebase logs: `firebase functions:log`
2. Check Resend dashboard: https://resend.com/emails
3. Review this guide's troubleshooting section
4. Check Firestore for `userActivity.emailsSent` updates

---

**END OF DEPLOYMENT GUIDE**
