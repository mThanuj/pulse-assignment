/**
 * @fileoverview Module for scraping G2 reviews for a given company within a specified date range.
 * Uses axios to fetch HTML via the scrape.do API, cheerio to parse the HTML,
 * and fs to write the collected reviews into a JSON file.
 *
 * Usage:
 *   Ensure you have a .env file with your token (e.g., token=YOUR_TOKEN_HERE)
 *   Then import and call the scrapeG2 function:
 *     import { scrapeG2 } from "./lib/g2.js";
 *     scrapeG2(company_name, startDate, endDate);
 */

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import "dotenv/config";

// Get the API token from environment variables
const token = process.env.token;

// Initialize page counter (starting from page 1)
let page = 1;

// Array to hold all review objects collected from the site
const reviews = [];

/**
 * Scrapes reviews from G2 for the specified company within the provided date range.
 *
 * @param {string} company_name - The company name as used in the G2 URL.
 * @param {Date} startDate - The start date for filtering reviews.
 * @param {Date} endDate - The end date for filtering reviews.
 * @returns {Promise<void>} A promise that resolves once all pages are scraped and the JSON file is written.
 */
export async function scrapeG2(company_name, startDate, endDate) {
  // Loop until there are no more review pages
  while (true) {
    // Build target URL for the current page, encoding the URL string
    const targetUrl = encodeURIComponent(
      `https://www.g2.com/products/${company_name}/reviews?page=${page}`,
    );

    // Configuration for axios request using the scrape.do API
    const config = {
      method: "GET",
      url: `https://api.scrape.do/?token=${token}&url=${targetUrl}`,
      headers: {},
    };

    try {
      // Fetch the HTML content from the target URL via scrape.do
      const response = await axios(config);
      const html = response.data;
      const $ = cheerio.load(html);

      // Select all review elements by their container classes
      const reviewElements = $(
        "div.paper.paper--white.paper--box.mb-2.position-relative.border-bottom",
      );

      // If no reviews are found on the current page, exit the loop
      if (reviewElements.length === 0) {
        console.log(`No more reviews found on page ${page}. Exiting...`);
        break;
      }

      // Process each review element found
      reviewElements.each((_, review) => {
        let reviewObj = {};
        const $review = $(review);

        // Extract user information such as username, role, and company size
        $review.find("div.d-f.fd-c").each((_, userInfo) => {
          const $userInfo = $(userInfo);

          // Extract username
          const username = $userInfo.find(
            "div.fw-semibold.mb-half.lh-100.d-f.ai-c.text-normal",
          );
          reviewObj.username = username.text().trim();

          // Extract role and company size from other user details
          const otherDetails = $userInfo.find(
            "div.c-midnight-80.line-height-h6.fw-regular",
          );
          otherDetails.find("div.mt-4th").each((index, div) => {
            if (index === 0) {
              reviewObj.role = $(div).text().trim();
            } else {
              reviewObj.companySize = $(div).text().trim();
            }
          });
        });

        // Extract rating and date information
        const ratingDiv = $review.find("div.f-1.d-f.ai-c.mb-half-small-only");
        ratingDiv.find("div").each((index, div) => {
          const $div = $(div);
          if (index === 0) {
            // Loop through each class to find the one that indicates rating (e.g., "star-5")
            const classList = $div.attr("class") || "";
            for (let myClass of classList.split(" ")) {
              if (myClass.startsWith("star")) {
                reviewObj.rating = +myClass.split("-")[1];
              }
            }
          } else if (index === 1) {
            reviewObj.date = $div.text().trim();
            const reviewDate = new Date(reviewObj.date);
            if (reviewDate < startDate || reviewDate > endDate) {
              return;
            }
          }
        });

        // Extract the review title from the title container
        const title = $review.find("div.paper__bd div.m-0.l2");
        reviewObj.title = title.text().trim();

        // Extract the review description from the element with itemprop "reviewBody"
        const description = $review.find(
          'div.paper__bd [itemprop="reviewBody"]',
        );
        reviewObj.description = description.text().trim();

        // Add the review object to the reviews array
        reviews.push(reviewObj);
      });

      console.log(
        `✅ Page ${page} - ${reviews.length} reviews collected so far`,
      );
      // Increment page counter to fetch the next page in the next loop iteration
      page++;
    } catch (error) {
      // Log any errors encountered during the scraping process and break the loop
      console.error("❌ Error fetching page", page, error.message);
      break;
    }
  }

  // Write the collected reviews to a JSON file
  fs.writeFileSync(
    "reviews-g2.json",
    JSON.stringify({ reviews: [...reviews] }, null, 2),
    "utf-8",
  );
  console.log("📁 Saved reviews to reviews-g2.json");
}
