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

## Deployment

Please see documentation on deployment and embedding here: [deployment.md](docs/deployment.md)

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
