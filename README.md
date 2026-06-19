# Financial Decision-Making Prototype App

This project is an educational web app prototype supporting early-career professionals (ages 18–26 or 0–5 years into their careers) in making informed financial decisions. It is part of an initiative in collaboration with Stanford's GSB and the Initiative for Financial Decision Making (IFDM).

## Overview

The app reinforces key lessons from IFDM’s **four learning modules**, each with four sub-lessons, and will be embedded within the **Mighty Networks** platform.

This repository serves as source/hosting for an interactive learning tool. The goal is to validate how educational content can be embedded, presented, and interacted with via GitHub Pages.

---

## Tech Stack

- HTML, CSS, JavaScript, React, Next.js
- GitHub Pages for hosting
- Potential Zapier workflows for integration (Mighty Networks)

---

## Environments

| Environment | URL | Branch | Deploy command |
|---|---|---|---|
| Production | https://ifdm-learning.stanford.edu/ | `1.x` | `yarn deploy` |
| Staging | https://su-sws.github.io/ifdm_learning_apps_staging/ | `dev` | `yarn deploy:staging` |

### Development workflow

New features are developed on feature branches, reviewed via pull request, then deployed to staging for QA before going to production:

```
feature/my-branch  →  PR into dev  →  yarn deploy:staging  →  review on staging
                                                                       ↓ approved
                                               PR into 1.x  →  yarn deploy  →  production
```

1. Create a feature branch off `dev` (or `1.x` for urgent fixes)
2. Open a PR targeting `dev`
3. After merge, deploy to staging and verify: `git checkout dev && git pull && yarn deploy:staging`
4. Once staging looks good, open a PR from `dev` into `1.x`
5. After merge, deploy to production: `git checkout 1.x && git pull && yarn deploy`

The deploy scripts enforce branch — `yarn deploy` will fail if you're not on `1.x`, and `yarn deploy:staging` will fail if you're not on `dev`.

For full deployment details and troubleshooting, see [docs/deployment.md](docs/deployment.md).

## Local Setup

1. Clone this repo locally.
    - `git clone git@github.com:SU-SWS/ifdm_learning_apps.git`
    - `cd ifdm_learning_apps`
1. Install and use the specified node version.
    - `nvm install`
    - `nvm use`
    - When developing later, don't forget to run `nvm use` again in case you've switched versions for another project.    
1. Install the packages with yarn
    - `yarn install`
    - If you do not have yarn installed for the node version you may need to install it first: `npm install -g yarn` 
1. Run the development server
    - `yarn dev`
1. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.
