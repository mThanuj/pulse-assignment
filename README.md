# Pulse Assignment: Review Scraper CLI

This project is a command-line interface (CLI) tool that scrapes reviews from websites like **G2** and **Capterra**. The tool accepts several command-line arguments such as the website, company name, and date range to filter the reviews.

## Features

- **Multi-Source Scraping:** Supports scraping reviews from G2 and Capterra.
- **Flexible Date Filtering:** Specify a start and end date to narrow down the reviews.
- **Easy-to-Use CLI:** Simply run the script with required parameters.
- **Extensible Architecture:** Easily add more scrapers or extend functionality.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Scrape.do](https://scrape.do/) API Token

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/mThanuj/pulse-assignment.git
   cd pulse-assignment
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Usage**

   ```bash
   node index.js --website <website> --companyName <companyName> --startDate <startDate> --endDate <endDate> --url <only-if-you-use-capterra>
   ```

   ### Command-Line Arguments

   - `--website`: Specify the website (e.g., "G2" or "Capterra").
   - `--companyName`: Specify the company name.
   - `--startDate`: Specify the start date (e.g., "Dec 01, 2023").
   - `--endDate`: Specify the end date (e.g., "Dec 15, 2023").
   - `--url`: Specify the URL if you're using Capterra.

## Project Structure

- index.js: Entry point for the CLI. It parses command-line arguments and starts the scraping process with appropriate scraper function.
- lib/: Contains the scraper functions for G2 and Capterra.
- package.json: Project configuration file with metadata and dependencies for npm.
- reviews-capterra.json: Sample data for Capterra reviews.
- reviews-g2.json: Sample data for G2 reviews.
