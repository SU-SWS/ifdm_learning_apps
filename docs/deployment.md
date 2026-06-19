# Instructions for deployment and embedding

## Environments

| Environment | Branch | URL | Command |
|---|---|---|---|
| Production | `1.x` | https://ifdm-learning.stanford.edu/ | `yarn deploy` |
| Staging | `dev` | https://su-sws.github.io/ifdm_learning_apps_staging/ | `yarn deploy:staging` |

---

## Development workflow

Feature branches are developed and reviewed via pull request, then merged in two stages:

```
feature/my-branch  →  PR  →  dev  →  yarn deploy:staging  →  QA on staging
                                                                     ↓ approved
                                            PR to 1.x  →  yarn deploy  →  production
```

1. Open a PR from your feature branch targeting `dev`
2. After merge, deploy to staging and verify: `yarn deploy:staging`
3. Once staging is confirmed, open a PR from `dev` into `1.x`
4. After merge, deploy to production: `yarn deploy`

---

## Deploying to production

The deploy script enforces that you are on the `1.x` branch before building.

1. Switch to the latest `1.x`:
   ```
   git checkout 1.x && git fetch && git pull
   ```
2. Confirm the correct Node version is active:
   ```
   nvm use
   ```
3. Deploy:
   ```
   yarn deploy
   ```
4. Verify at https://github.com/SU-SWS/ifdm_learning_apps/deployments

---

## Deploying to staging

The staging deploy script enforces that you are on the `dev` branch before building.

1. Switch to the latest `dev`:
   ```
   git checkout dev && git fetch && git pull
   ```
2. Confirm the correct Node version is active:
   ```
   nvm use
   ```
3. Deploy:
   ```
   yarn deploy:staging
   ```
4. Verify at https://github.com/SU-SWS/ifdm_learning_apps_staging/deployments and preview at https://su-sws.github.io/ifdm_learning_apps_staging/

---

## One-time staging setup (already done — for reference)

If the staging environment ever needs to be rebuilt from scratch:

1. Create a new GitHub repo: `SU-SWS/ifdm_learning_apps_staging`
2. In that repo's Settings → Pages, set the source to the `gh-pages` branch
3. Add the staging remote to your local clone:
   ```
   git remote add staging git@github.com:SU-SWS/ifdm_learning_apps_staging.git
   ```
   Note: `yarn deploy:staging` targets this remote directly via `gh-pages -r`; the local remote entry is for reference and manual pushes only.

---

## Embedding a calculator

Example iFrame:

```html
<iframe src="https://ifdm-learning.stanford.edu/interactives/investment-calculator/"></iframe>
```

See below screencast as an example of embedding the iframe:

![Embedding Example](images/embedding-in-mighty.gif)

---

## Troubleshooting

### Changes not appearing
1. Clear browser cache
2. Check GitHub Pages deployment status in the repo's Deployments tab
3. Verify the `gh-pages` branch updated with a recent commit

### Staging assets not loading (404 on `/_next/` paths)
The staging build sets `basePath=/ifdm_learning_apps_staging` so all asset paths are prefixed correctly for the project URL. If you see 404s on static assets, confirm `build:staging` was used (not the plain `build` command).

### iframe issues
- Ensure the source URL is correct
- Check for CORS restrictions
- Test the iframe URL directly in browser
