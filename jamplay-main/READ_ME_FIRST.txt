HOW TO APPLY (no coding):

A) Drag/drop updates (no package.json)
1) Open your repo folder (jamplay) and this patch folder side by side.
2) Open PATCH/ and drag its inner folders/files into your repo:
   - VERCEL/vercel.json  -> to repo root as vercel.json
   - lib/*               -> into repo/lib/
   - app/*               -> into repo/app/
   - db/migrations/*     -> into repo/db/migrations/
3) When Windows asks, choose "Replace the files in the destination".
4) Commit in GitHub Desktop: message "merge patch" -> Push.

B) Optionally replace package.json (only if you prefer not to edit)
5) From PACKAGE/package.json.NEW -> copy into your repo root and rename to "package.json".
   (Back up your old package.json first if you want.)
6) Commit -> Push.

C) Deploy on Vercel
7) In Vercel, click Deploy -> Deploy to Production. Make sure the log header shows a NEW commit hash.

D) Make yourself admin (after you sign in at /auth)
Run in Supabase SQL Editor:
  update public.users
  set role = 'admin'
  where id = (select id from auth.users where email = 'yt.ho0die09@gmail.com');
