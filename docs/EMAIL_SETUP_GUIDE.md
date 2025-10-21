# Email Automation Setup Guide

**Last Updated:** 2025-10-19
**Status:** Welcome Email (Email #1) Implemented ✅

---

## 🎯 What's Been Implemented

### Email #1: Welcome Email (LIVE)
**Trigger:** Immediately after user signs up (email/password or Google)
**Template:** `src/emails/WelcomeEmail.tsx`
**Action:** `src/lib/email-actions.ts` → `sendWelcomeEmailAction()`
**Integration:** `src/app/signup/SignupForm.tsx`

**Flow:**
1. User signs up successfully
2. Welcome email sent automatically
3. User redirected to `/quick-start?welcome=true`
4. Quick Start shows personalized welcome message

---

## 📧 Email Service Configuration

### Resend Setup
- **Service:** Resend (https://resend.com)
- **API Key:** Stored in `.env` as `RESEND_API_KEY`
- **Sender Email:** `RESEND_FROM_EMAIL` (currently: `onboarding@resend.dev` for testing)
- **App URL:** `NEXT_PUBLIC_APP_URL` (currently: `http://localhost:9002`)

### Environment Variables
```bash
RESEND_API_KEY="re_ArTJ8MBu_6pxYVWJ1qorreAgVYxvqaZzx"
RESEND_FROM_EMAIL="onboarding@resend.dev"  # For testing
NEXT_PUBLIC_APP_URL="http://localhost:9002"  # Local dev
```

### Production Configuration
When deploying to production, update:
```bash
RESEND_FROM_EMAIL="hello@brandforge.ai"  # Your verified domain email
NEXT_PUBLIC_APP_URL="https://brandforge.ai"  # Your production URL
```

---

## 🧪 How to Test

### Test Welcome Email Locally

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Sign up with a test email:**
   - Go to: http://localhost:9002/signup
   - Use a real email address you can check (e.g., your Gmail)
   - Complete the signup form

3. **Check the email:**
   - Check your inbox for email from `onboarding@resend.dev`
   - Subject: "Welcome to BrandForge AI! Create your first post in 30 seconds ⚡"
   - Email should have:
     - Personalized greeting
     - "Generate My First Post →" button
     - Link to Quick Start page

4. **Verify redirect:**
   - After signup, you should be redirected to `/quick-start?welcome=true`
   - Page should show: "Welcome to BrandForge AI, [yourname]!"

5. **Check Resend Dashboard:**
   - Login to https://resend.com
   - Go to "Emails" tab
   - You should see the sent email with delivery status

### Test with Google Sign Up

1. Click "Sign up with Google" on signup page
2. Complete Google OAuth flow
3. Same email + redirect behavior as above

---

## 📂 File Structure

```
src/
├── emails/                          # Email templates (React Email)
│   ├── WelcomeEmail.tsx            ✅ Implemented
│   └── ActivationReminderEmail.tsx ✅ Created (not triggered yet)
│
├── lib/
│   ├── email-service.ts            ✅ Email sending functions
│   └── email-actions.ts            ✅ Server actions for emails
│
└── app/
    └── signup/
        └── SignupForm.tsx          ✅ Updated to send welcome email
```

---

## 🚀 Next Steps (Emails #2-5)

### Email #2: Activation Reminder (+2 hours)
**Status:** Template created, trigger NOT implemented
**TODO:**
- Add background job/cron to check user activity
- Send email if user hasn't completed Quick Start
- Track user actions in Firestore

### Email #3: Example Showcase (+24 hours)
**Status:** Function created, trigger NOT implemented
**TODO:**
- Create proper React Email template
- Add industry-specific examples
- Implement trigger logic

### Email #4: Template Showcase (+3 days)
**Status:** Function created, trigger NOT implemented

### Email #5: Final Reminder (+7 days)
**Status:** Function created, trigger NOT implemented

---

## 🔧 Troubleshooting

### Email Not Sending
1. **Check environment variables:**
   ```bash
   # In terminal:
   echo $RESEND_API_KEY
   ```
   If empty, restart dev server after adding to `.env`

2. **Check console logs:**
   Look for:
   - `[Signup] Welcome email sent to: [email]`
   - OR `[Signup] Failed to send welcome email: [error]`

3. **Check Resend Dashboard:**
   - Login to https://resend.com
   - Go to "Emails" tab
   - Check for errors or bounces

### Email Goes to Spam
- This is common with `onboarding@resend.dev`
- Solution: Verify your own domain in Resend
- Use your domain email (e.g., `hello@brandforge.ai`)

### User Not Redirected to Quick Start
- Check browser console for errors
- Verify `/quick-start?welcome=true` route works manually
- Check `SignupForm.tsx` for `router.push()` call

---

## 📊 Monitoring

### Resend Dashboard Metrics
Track these metrics in Resend dashboard:
- **Sent:** Total emails sent
- **Delivered:** Successfully delivered
- **Opened:** User opened email
- **Clicked:** User clicked link in email
- **Bounced:** Email failed to deliver
- **Complained:** User marked as spam

### Application Logs
Monitor these logs:
```
[Signup] Welcome email sent to: user@example.com
[Email Service] Email sent successfully: { id: 're_...' }
[Email Action] Welcome email sent successfully
```

---

## 🎬 Implementing Remaining Emails (Future)

### Option 1: Firebase Cloud Functions (Recommended)
- Use Firebase Cloud Functions for scheduled emails
- Example: Check user activity every hour
- Send reminder emails based on conditions

### Option 2: External Service (Loops, Brevo, etc.)
- Use Loops.so for automated drip campaigns
- Track user events and trigger emails automatically

### Option 3: Next.js Cron Jobs (Vercel)
- Use Vercel Cron Jobs (if deploying to Vercel)
- Create API routes that run on schedule

---

## 🔒 Security Notes

1. **Never commit `.env` file** - Already in `.gitignore` ✅
2. **API keys are server-side only** - Never exposed to client ✅
3. **Email validation** - Only send to valid email addresses ✅
4. **Rate limiting** - Resend has built-in rate limits ✅

---

## 📝 Resources

- **Resend Docs:** https://resend.com/docs
- **React Email Docs:** https://react.email/docs
- **Email Templates:** https://react.email/examples
- **Resend Dashboard:** https://resend.com/emails

---

**END OF DOCUMENT**
