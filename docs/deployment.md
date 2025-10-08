# Instructions for deployment and embedding  

## Deployment

The app deploys to https://ifdm-learning.stanford.edu/ via GitHub Pages and the `gh-pages` branch. The deploy script will automatically run the build step and generate the static files.

### Deployment Steps

1. Ensure you are on the latest `1.x` branch code:
	- `git checkout 1.x && git fetch && git pull`
2. Make sure you are using the correct Node version:
	- If you use nvm and are not already on the correct version, run: `nvm use`
3. (Optional) Test the build locally before deploying:
	- `yarn build`
4. Deploy to GitHub Pages:
	- `yarn deploy`
5. After deploying, verify the deployment:
	- Visit https://github.com/SU-SWS/ifdm_learning_apps/deployments to confirm the deployment ran successfully.

---

### Embedding a Calculator

Example iFrame:

```angular2html
<iframe src="https://ifdm-learning.stanford.edu/interactives/investment-calculator/"></iframe>
```
See below screencast as an example of embedding the iframe:

![Embedding Example](images/embedding-in-mighty.gif)

## Troubleshooting

### Changes Not Appearing
1. Clear browser cache
2. Check GitHub Pages deployment status
3. Verify the gh-pages branch updated

### iframe Issues
- Ensure the source URL is correct
- Check for CORS restrictions
- Test the iframe URL directly in browser
