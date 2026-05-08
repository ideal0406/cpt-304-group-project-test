# Budget-App-JavaScript

[![codecov](https://codecov.io/github/ideal0406/cpt-304-group-project-test/graph/badge.svg?token=qjBVklgYXo)](https://codecov.io/github/ideal0406/cpt-304-group-project-test)
[![Vercel](https://vercelbadge.vercel.app/api/lz233/Budget-app)](https://budget.project.ac.cn)

This project is for the CAN304 group assignment (Group 45).

Welcome to the Budget App! This project is the result of following a comprehensive YouTube tutorial that guides you through building a budget management application from scratch. With this app, you can efficiently track your income, expenses, and overall budget, gaining better control of your financial situation.

## Demo

You can check out the live demo of the Budget App here.
**Online Demo of Project :**

[Link to Budget App](https://budget.project.ac.cn)

## Features

- Income and Expense Tracking: The Budget App allows you to enter your sources of income and expenses, categorizing them for better organization.

- Budget Calculation: Based on the provided income and expenses, the app calculates your budget by subtracting expenses from income, giving you a clear overview of your financial status.

- Monthly Reports: Get a comprehensive monthly report that summarizes your income, expenses, and the resulting budget. This helps you understand your spending patterns over time.

- Simple and Intuitive Interface: The app boasts a user-friendly interface, making it easy for anyone to navigate and use, even if you have little to no prior experience with budgeting applications.

## Usage

1. Clone the repository or download the ZIP file.

1. Open the project in your preferred code editor.

1. Launch the index.html file in your browser to run the Budget App locally.

1. Start by adding your income and expenses to track your budget. The app will automatically calculate your available budget.

1. Monitor your budget regularly and adjust your spending to achieve your financial goals.

## Deployment (Vercel)

This project is a static site (HTML/CSS/JS). You can deploy it on Vercel without a build step.

### Deploy via Vercel Dashboard

1. Go to Vercel and click **Add New → Project**.
2. Import this GitHub repository.
3. In **Build & Output Settings**:
   - **Framework Preset**: `Other`
   - **Build Command**: leave empty
   - **Output Directory**: `.`
4. Click **Deploy**.

After deployment, Vercel will provide a `.vercel.app` URL. You can also add a custom domain in **Project Settings → Domains**.

### Deploy via Vercel CLI (optional)

```bash
npm i -g vercel
vercel
vercel --prod
```

## Tests & Coverage (Codecov)

This repo includes a minimal Jest setup and a GitHub Actions workflow that runs tests and uploads coverage to Codecov on every push.

### Run tests locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run tests with coverage:

   ```bash
   npm test
   # or
   npx jest --coverage
   ```

After the run, Jest will generate coverage artifacts under `coverage/` (including `coverage/lcov.info`).

### Enable Codecov upload in GitHub Actions

1. Create/sign in to a Codecov account and add this repository.
2. Get the repository upload token from Codecov.
3. In GitHub, add the token as a repository secret:

   - Go to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: (paste the token from Codecov)

Once set, every `push` will trigger the workflow and upload coverage automatically.

## Technologies Used

The Budget App was built using the following technologies and tools:

- HTML5
- CSS3
- JavaScript

## Credits

The Budget App tutorial was created by [aaramiss](https://samiraatech.github.io/Budget-app/).

## License

The Budget App is released under the MIT License. You are free to use, modify, and distribute this project for personal and commercial purposes.

## Feedback and Support

If you have any questions, suggestions, or issues with the Budget App, feel free to reach out by creating an issue in the [GitHub repository](https://github.com/lz233/Budget-app/issues). We welcome any feedback to improve the app and make it even more useful for managing personal finances.

Happy budgeting!
