---
description: Print Formspree feedback-form setup steps for the About page
---

Print exactly the following instructions to the user, verbatim, in full, with no preamble, summary, or commentary before or after.

---

## Formspree setup — step by step

The endpoint currently wired into `src/pages/about/index.astro` is `https://formspree.io/f/mwvywkzb`. If you ever change forms or rotate the endpoint, update that one `action=` attribute to match.

### 1. Sign up

- Go to https://formspree.io/register
- Create an account (use the email you want submission notifications sent to)
- Verify the email — Formspree sends a confirmation link. **Don't skip this** — unverified accounts can't actually receive submissions.

### 2. Create the form

- After verifying, click **"+ New Project"** (or **"+ New Form"** if it asks for that first)
- Name it something recognizable, e.g. `Vaccine Safety Signals — feedback`
- Choose the email address that should receive submissions

### 3. Copy the endpoint URL

- Formspree gives you a URL like `https://formspree.io/f/xqkzrope` (the random suffix is your form ID)
- Copy it — that's the only thing you need from the dashboard for the website to work
- Paste it into the `action=` attribute of the `<form>` in `src/pages/about/index.astro`, then commit and push

### 4. Test before you trust

- Submit a test message yourself from `vsafetysignals.com/about/`
- The first time you submit, Formspree shows their confirmation page once and then redirects back. Subsequent submissions go straight through.
- Check your email — the submission should arrive within a minute. If it doesn't, the most common cause is the email-verification step from #1 was missed.

### 5. Spreadsheet logging (the part that decides which plan you need)

Free tier gives you:

- Up to 50 submissions/month
- Email notifications
- An exportable CSV of all submissions in the dashboard ("Download as CSV" button)
- **No automatic Google Sheets sync**

If "exportable CSV" is enough — you can download the file as needed — **stay on free**.

If you want submissions to flow into a Google Sheet automatically, you have two paths:

- **Paid Formspree (Plus, $10/mo)** — direct Google Sheets integration in the Formspree dashboard. Just connect your Google account, pick a sheet, done.
- **Free Formspree + free Zapier zap** — Zapier has a "Formspree → Google Sheets" template. Free Zapier zaps trigger every ~15 minutes; submissions arrive in the sheet within that window.

Recommendation: start with the **free tier + manual CSV export**, switch later only if volume requires it.

### 6. Optional — once it's working

- In the Formspree dashboard, you can customize the "Thank you" page users land on after submission, or redirect them back to your site (`/about/?submitted=1` for instance).
- Spam protection is auto-on; the honeypot field in the HTML helps catch bots that fill every field.
