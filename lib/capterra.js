/**
 * @fileoverview Module for scraping Capterra reviews for a given company within a specified date range.
 * Uses axios to fetch HTML via the scrape.do API, cheerio to parse the HTML,
 * and fs to write the collected reviews into a JSON file.
 *
 * Usage:
 *   Ensure you have a .env file with your token (e.g., token=YOUR_TOKEN_HERE)
 *   Then import and call the scrapeCapterra function:
 *     import { scrapeCapterra } from "./lib/capterra.js";
 *     scrapeCapterra(company_name, startDate, endDate, url);
 */

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import "dotenv/config";

// Get the API token from environment variables
const token = process.env.token;

// Array to hold all review objects collected from the site
const reviews = [];

// Some options for Scrape.do API
const render = "true";
const playWithBrowser =
  '[{ "Action": "Wait", "Timeout": 1000 }, { "Action": "ScrollTo", "Selector": ".sb.btn.secondary"}, { "Action": "Click", "Selector": ".sb.btn.secondary"}]';
const encodedJsonData = encodeURIComponent(playWithBrowser);

/**
 * Scrapes reviews from Capterra for the specified company within the provided date range.
 *
 * @param {string} company_name - The company name as used in the G2 URL.
 * @param {Date} startDate - The start date for filtering reviews.
 * @param {Date} endDate - The end date for filtering reviews.
 * @param {string} url - The url of the page to scrape (due to insufficient time and dynamic page routes in capterra)
 * @returns {Promise<void>} A promise that resolves once all pages are scraped and the JSON file is written.
 */
export async function scrapeCapterra(company_name, startDate, endDate, url) {
  // Encode the provided URL for use in a query string
  const targetUrl = encodeURIComponent(url);

  // Prepare the request configuration for Scrape.do
  const config = {
    method: "GET",
    url: `https://api.scrape.do/?token=${token}&url=${targetUrl}&render=${render}&playWithBrowser=${encodedJsonData}`,
    headers: {},
  };

  try {
    // Fetch the HTML content using Scrape.do
    const response = await axios(config);
    const html = response.data;

    // Load the HTML into Cheerio for DOM traversal
    const $ = cheerio.load(html);

    // Select the review container elements
    const reviewElements = $("div.sb.screen-container.m-auto.block.px-0");

    if (reviewElements.length === 0) {
      console.log("No more reviews found. Exiting...");
      return;
    }

    // Loop over each review container found
    reviewElements.each((_, review) => {
      let reviewObj = {};
      reviewObj.rating = {};
      reviewObj.review = {};

      const $review = $(review);

      // Extract left-side (user details and ratings)
      $review.find("div").each((index, element) => {
        if (index === 0) {
          const $left = $(element);

          // Reviewer name
          $left
            .find("div.mb-3xs.flex.items-center.break-words.break-all.text-lg")
            .each((_, element) => {
              reviewObj.name = $(element).text().trim();
            });

          // Reviewer job title
          $left
            .find('div[data-testid="reviewer-job-title"]')
            .each((_, element) => {
              reviewObj.reviewer_job_title = $(element).text().trim();
            });

          // Reviewer industry
          $left
            .find('div[data-testid="reviewer-industry"]')
            .each((_, element) => {
              reviewObj.reviewer_industry = $(element).text().trim();
            });

          // Duration of product usage
          $left
            .find('div[data-testid="reviewer-time-used-product"]')
            .each((_, element) => {
              const time = $(element)
                .text()
                .trim()
                .replace("Used the software for: ", "");
              reviewObj.reviewer_time_used_product = time;
            });

          // Ease of use rating
          $left
            .find('div[data-testid="Ease of Use-rating"] span.text-neutral-80')
            .each((_, element) => {
              reviewObj.rating.ease_of_use_rating = $(element).text().trim();
            });

          // Customer service rating
          $left
            .find(
              'div[data-testid="Customer Service-rating"] span.text-neutral-80',
            )
            .each((_, element) => {
              reviewObj.rating.customer_service_rating = $(element)
                .text()
                .trim();
            });

          // Features rating
          $left
            .find('div[data-testid="Features-rating"] span.text-neutral-80')
            .each((_, element) => {
              reviewObj.rating.features_rating = $(element).text().trim();
            });

          // Value for money rating
          $left
            .find(
              'div[data-testid="Value for Money-rating"] span.text-neutral-80',
            )
            .each((_, element) => {
              reviewObj.rating.value_for_money_rating = $(element)
                .text()
                .trim();
            });

          // Review submission date
          $left
            .find('div[data-testid="review-written-on"]')
            .each((_, element) => {
              reviewObj.date = new Date($(element).text().trim());
            });
        }

        // Extract review content (overall, pros, cons, vendor response)
        $review.find('div[data-testid="review-content"]').each((_, element) => {
          const $element = $(element);

          // Overall review summary
          $element
            .find('p[data-testid="overall-content"]')
            .each((_, element) => {
              reviewObj.review.overall_content = $(element)
                .text()
                .trim()
                .replace("Overall: ", "");
            });

          // Pros
          $element.find('p[data-testid="pros-content"]').each((_, element) => {
            reviewObj.review.pros = $(element)
              .text()
              .trim()
              .replace("Pros: ", "");
          });

          // Cons
          $element.find('p[data-testid="cons-content"]').each((_, element) => {
            reviewObj.review.cons = $(element)
              .text()
              .trim()
              .replace("Cons: ", "");
          });

          // Vendor response (if any)
          $element
            .find('div[data-testid="vendor-response"] div.my-2xs.break-words')
            .each((_, element) => {
              reviewObj.vendor_response = $(element).text().trim();
            });
        });
      });

      // Add review to the main array
      reviews.push(reviewObj);
    });
  } catch (error) {
    // Log error and stop if something goes wrong
    console.error("❌ Error fetching page", error.message);
  }

  // Write all reviews to a JSON file
  fs.writeFileSync(
    "reviews-capterra.json",
    JSON.stringify({ reviews: [...reviews] }, null, 2),
    "utf-8",
  );
  console.log("📁 Saved reviews to reviews-capterra.json");
}
