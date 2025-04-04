/**
 * @fileoverview Entry point for the Review Scraper CLI.
 * This script accepts command-line arguments to determine which website to scrape reviews from (G2 or Capterra),
 * the company name, and a date range. It then calls the appropriate scraper function.
 *
 * Usage:
 *   node index.js --website g2 --company_name "Acme Corp" --start_date 2023-01-01 --end_date 2023-03-31
 */

import { scrapeCapterra } from "./lib/capterra.js";
import { scrapeG2 } from "./lib/g2.js";
import yargs from "yargs";

// Parse command-line arguments using yargs
const argv = yargs(process.argv.slice(2)).argv;

// Extract arguments from the command line
const website = argv.website;
const company_name = argv.company_name;
const startDate = argv.start_date ? new Date(argv.start_date) : null;
const endDate = argv.end_date ? new Date(argv.end_date) : null;
const url = argv.url;

// Validate required arguments: website, company_name, start_date, and end_date
if (!website) {
  console.error("❌ Please provide a website.");
  process.exit(1);
}

if (!company_name) {
  console.error("❌ Please provide a company name.");
  process.exit(1);
}

if (!startDate || !endDate) {
  console.error("❌ Please provide a start and end date.");
  process.exit(1);
}

/**
 * Main switch to determine which scraping function to invoke based on the provided website.
 */
switch (website) {
  case "g2":
    // Call the scrapeG2 function and pass company name and date range
    scrapeG2(company_name, startDate, endDate).then(
      () => {
        console.log("✅ All pages scraped from G2.");
      },
      (error) => {
        console.error("❌ Error:", error.message);
      },
    );
    break;
  case "capterra":
    // Call the scrapeCapterra function and pass company name and date range
    scrapeCapterra(company_name, startDate, endDate, url).then(
      () => {
        console.log("✅ All pages scraped from Capterra.");
      },
      (error) => {
        console.error("❌ Error:", error.message);
      },
    );
    break;
  default:
    // If an unsupported website is provided, log an error and exit.
    console.error("❌ Invalid website.");
    process.exit(1);
}
