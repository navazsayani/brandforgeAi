# Backfill Existing Users Guide

**Purpose**: Add `userActivity` tracking to existing users so they receive activation emails.

**Date Created**: 2025-10-20
**Status**: Ready to run

---

## What This Does

The backfill script adds email tracking (`userActivity`) to all existing users who signed up before the email automation system was deployed. This allows them to:

1. Start receiving activation emails (if they haven't completed Quick Start)
2. Be tracked in the email metrics system
3. Benefit from the full email nurture sequence

---

## Strategy

### Signup Date Estimation

Since existing users don't have a `signupDate`, the script estimates it using:

1. **Firestore document creation time** (most accurate)
2. **Fallback**: 7 days ago (ensures they get immediate activation emails)

### Activation Status Detection

The script determines if a user has "completed Quick Start" by checking:

- Has `brandDescription` OR `targetKeywords` filled in
- If YES → Mark as activated (won't send activation emails)
- If NO → Mark as not activated (will send activation emails)

### Email Sending Logic

After backfill:

- **Activated users** (have brand data): No emails sent
- **Non-activated users** (no brand data):
  - Will start receiving activation emails based on their estimated signup date
  - If signup date is > 7 days ago → Will get "final reminder" email on next hourly check
  - If signup date is 3-7 days ago → Will get "template showcase" email
  - If signup date is 1-3 days ago → Will get "example showcase" email
  - If signup date is 2-24 hours ago → Will get "activation reminder" email

---

## Deployment Steps

### Step 1: Deploy the Backfill Functions

The backfill functions should already be deployed if you followed the main deployment guide. Verify:

```bash
firebase functions:list --project brandforge-ai-jr0z4
```

You should see:
- `backfillExistingUsers` (callable function)
- `backfillExistingUsersHTTP` (HTTP endpoint)

If not deployed, run:

```bash
cd /home/user/studio
firebase deploy --only functions:backfillExistingUsersHTTP,functions:backfillExistingUsers --project brandforge-ai-jr0z4
```

### Step 2: Run a Dry Run (Recommended)

Before making changes, run a dry run to see what would happen:

```bash
curl "https://us-central1-brandforge-ai-jr0z4.cloudfunctions.net/backfillExistingUsersHTTP?dryRun=true"
```

This will return JSON showing:
- Total users found
- How many would be updated
- How many would be skipped (already have userActivity)
- Sample data for each user

**Example output**:
```json
{
  "success": true,
  "dryRun": true,
  "totalUsers": 27,
  "usersUpdated": 25,
  "usersSkipped": 2,
  "updates": [
    {
      "userId": "abc123",
      "userEmail": "user@example.com",
      "signupDate": "2025-10-13T10:30:00.000Z",
      "hasCompletedQuickStart": false
    },
    ...
  ]
}
```

### Step 3: Run the Actual Backfill

When you're ready, run without the `dryRun` parameter:

```bash
curl "https://us-central1-brandforge-ai-jr0z4.cloudfunctions.net/backfillExistingUsersHTTP"
```

**Example output**:
```json
{
  "success": true,
  "dryRun": false,
  "totalUsers": 27,
  "usersUpdated": 25,
  "usersSkipped": 2,
  "message": "Backfill completed. Updated 25 users."
}
```

### Step 4: Verify in Firestore

Check a few user profiles to verify the backfill worked:

1. Go to Firebase Console → Firestore Database
2. Navigate to: `users/{userId}/brandProfiles/{userId}`
3. Look for the `userActivity` field:

```javascript
{
  brandName: "Example Brand",
  userEmail: "user@example.com",
  // NEW - Added by backfill
  userActivity: {
    signupDate: Timestamp(2025-10-13 10:30:00),
    hasCompletedQuickStart: false,
    firstGenerationAt: null,
    lastActiveAt: Timestamp(2025-10-20 09:00:00),
    totalGenerations: 0,
    emailsSent: {
      welcome: Timestamp(2025-10-13 10:30:00)
    }
  }
}
```

### Step 5: Monitor Email Sending

The hourly email scheduler will pick up these users on its next run. Check logs:

```bash
firebase functions:log --project brandforge-ai-jr0z4
```

Look for lines like:
```
[Email Scheduler] Found 27 users to check
[Email Scheduler] Sent 5 emails.
```

Also check Resend dashboard: https://resend.com/emails

---

## Alternative: Use the Callable Function (Advanced)

If you prefer to call the function programmatically:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const backfill = httpsCallable(functions, 'backfillExistingUsers');

// Dry run
const dryRunResult = await backfill({ dryRun: true });
console.log(dryRunResult.data);

// Actual run
const result = await backfill({ dryRun: false });
console.log(result.data);
```

---

## What Happens Next?

### For Users Who Haven't Activated (no brand data)

On the next hourly email check (runs every hour):

1. Scheduler checks all users with `userActivity`
2. Finds users who:
   - `hasCompletedQuickStart: false`
   - Haven't received specific emails yet
   - Meet the time criteria (2h, 24h, 3d, 7d since signup)
3. Sends appropriate activation email
4. Updates `emailsSent` record in Firestore

### For Users Who Have Activated (have brand data)

- No emails sent (they've completed Quick Start)
- Still tracked for future analytics
- Can still receive other email types (newsletters, updates, etc.)

---

## Cleanup (After Backfill is Complete)

Once you've run the backfill and verified it worked, you can disable the backfill functions to save resources:

### Option 1: Comment Out in Code

Edit `/home/user/studio/functions/src/index.ts`:

```typescript
// One-time backfill functions for existing users
// DISABLED - Backfill completed on 2025-10-20
// export {
//   backfillExistingUsers,
//   backfillExistingUsersHTTP
// } from './backfill-existing-users';
```

Then redeploy:

```bash
cd /home/user/studio
firebase deploy --only functions --project brandforge-ai-jr0z4
```

### Option 2: Delete the Functions

```bash
firebase functions:delete backfillExistingUsers --project brandforge-ai-jr0z4
firebase functions:delete backfillExistingUsersHTTP --project brandforge-ai-jr0z4
```

---

## Troubleshooting

### Issue: "Function not found" error

**Solution**: The function hasn't finished deploying. Wait 2-3 minutes and try again.

### Issue: "usersUpdated: 0"

**Possible causes**:
1. All users already have `userActivity` (check Firestore)
2. No users in `userIndex/profiles` collection

**Solution**: Check Firestore manually to verify user data exists.

### Issue: Emails not sending after backfill

**Possible causes**:
1. Email scheduler hasn't run yet (runs every hour)
2. Users are all marked as `hasCompletedQuickStart: true`
3. Time windows haven't been reached yet

**Solution**:
- Check email scheduler logs: `firebase functions:log --project brandforge-ai-jr0z4`
- Manually check a user's `userActivity` in Firestore
- Wait for the next hourly run

### Issue: Want to re-run backfill for specific users

**Solution**: Delete the `userActivity` field from those users in Firestore, then re-run the backfill script. They'll be picked up as new users.

---

## Safety Notes

1. **Idempotent**: Safe to run multiple times - skips users who already have `userActivity`
2. **Non-destructive**: Only adds data, doesn't delete or modify existing user data
3. **Dry run first**: Always test with `?dryRun=true` before running for real
4. **Firestore-only**: No emails are sent by the backfill script itself
5. **Logged**: All actions are logged to Cloud Functions logs

---

## Cost Impact

**Firebase Cloud Functions**:
- Single HTTP call: ~1 invocation
- Processing 100 users: ~1-2 seconds compute time
- **Cost**: Negligible (well within free tier)

**Firestore**:
- 1 write per user updated
- 1 read per user checked
- For 100 users: ~200 operations
- **Cost**: ~$0.001 (essentially free)

---

## Support

If you encounter issues:

1. Check Cloud Functions logs:
   ```bash
   firebase functions:log --project brandforge-ai-jr0z4
   ```

2. Verify Firestore data structure matches expected format

3. Test with a single user first by manually creating `userActivity` in Firestore

---

**END OF BACKFILL GUIDE**
