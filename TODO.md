# TODO - Swasthya “calm-waves” integration/addition

## Step 0 — Confirm scope
- Decide between:
  - Step 0A: keep `Calm-waves/calm-waves/` as a separate runnable app
  - Step 0B: integrate it into `apps/mobile` (Expo Router)

## Step 1 — If separate app (Step 0A)
- `git add Calm-waves/calm-waves/`
- commit changes

## Step 2 — If integrate into mobile (Step 0B)
- Create new Expo Router screens inside `apps/mobile/app/` that route to Calm-waves UI
- Update `apps/mobile/app/_layout.tsx` to include those routes

## Step 3 — Test
- Run the relevant dev command(s)
- Verify routes / startup

