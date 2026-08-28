# Vercel Preview proof

- Date: 2026-08-27
- Deployment: `dpl_6LKDJeqAPecPNs3PTX5iVje3aQZ4`
- Preview origin: `https://scrapscn-c5l9haobs.sentry.dev`
- Next.js: 16.3.3
- Build: Storybook and Next.js production builds passed.

The raw preview uses Sentry Vercel Authentication. The deployment was changed to **Anyone with the link**, which generated a Vercel shareable link with comments enabled. The bypass query value is not stored in the repository.

A clean browser opened the shareable `/templates/checkbox-settings` URL without a Vercel session. It restored:

- the Checkbox template;
- dark mode;
- the 390 px mobile preview;
- the `md` Checkbox size;
- two selected items;
- the custom `Escalation alerts` label; and
- the checked and disabled states.

This proves the current template and URL-state convention on Vercel Preview. Future deployments follow the same project-level build and sharing convention.
