# Instructions for deployment and embedding  

## Prerequisites
- Node.js and yarn installed
- Repository with gh-pages configured
- Access to MightyNetworks platform

## Deployment

To deploy, this app uses gh-pages. It's a library that allows you to push build and deploy to a designated branch.

This app is deployed using [gh-pages](https://www.npmjs.com/package/gh-pages) via the gh-pages branch. Build the project: The deploy script will automatically run the build step to generate the static files.

Deploy to GitHub Pages: Use the following command:

`yarn deploy`

This command builds and push the built version to gh-pages branch, which is the designated branch for the live site.

You can review the app on the site: https://ifdm-learning.stanford.edu/

---

## Going Live

The Pinecone app is hosted on MightyNetworks. After deployment, you ensure that the changes have updated on the current site, if the embed already has been embedded on Mighty.

### Embedding

If it's a new lesson or game, you can embed it on the

Example iFrame:

```angular2html
<iframe src="https://ifdm-learning.stanford.edu/interactives/investment-calculator/"></iframe>
```
See below screencast as an example of embedding an iframe

![gif for embeding](images/embedding-in-mighty.gif)

## Troubleshooting

### Changes Not Appearing
1. Clear browser cache
2. Check GitHub Pages deployment status
3. Verify the gh-pages branch updated

### iframe Issues
- Ensure the source URL is correct
- Check for CORS restrictions
- Test the iframe URL directly in browser
