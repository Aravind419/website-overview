const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const favicon = require("favicon-getter").default;

const app = express();

// Update CORS configuration
app.use(
  cors({
    origin: ["https://website-overview.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Add middleware to handle preflight requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

app.use(express.json());
app.use(express.static("public"));

// Function to extract text content and clean it
function extractCleanText($) {
  return $("p, article, section, .content, .main")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 1000);
}

// Function to analyze website purpose
function analyzeWebsitePurpose(text, title, keywords) {
  const purposes = {
    ecommerce: ["shop", "store", "buy", "cart", "product", "price"],
    blog: ["blog", "post", "article", "read", "author"],
    portfolio: ["portfolio", "work", "projects", "showcase"],
    corporate: ["company", "business", "services", "solutions"],
    educational: ["learn", "course", "study", "education", "training"],
    news: ["news", "latest", "breaking", "report", "journalism"],
  };

  const contentLower = `${text} ${title} ${keywords.join(" ")}`.toLowerCase();
  const matches = {};

  for (const [purpose, keywords] of Object.entries(purposes)) {
    matches[purpose] = keywords.filter((keyword) =>
      contentLower.includes(keyword)
    ).length;
  }

  const mainPurpose = Object.entries(matches).sort((a, b) => b[1] - a[1])[0][0];

  return mainPurpose;
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { url } = req.body;
    let targetUrl = url;

    // Add protocol if missing
    if (!url.startsWith("http")) {
      targetUrl = "https://" + url;
    }

    // Try different URL variations if the first attempt fails
    let response;
    try {
      response = await axios.get(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
        maxRedirects: 5,
      });
    } catch (error) {
      // If https fails, try http
      if (targetUrl.startsWith("https://")) {
        targetUrl = targetUrl.replace("https://", "http://");
        response = await axios.get(targetUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
          timeout: 10000,
          maxRedirects: 5,
        });
      } else {
        throw error;
      }
    }

    const html = response.data;
    const $ = cheerio.load(html);

    // Basic metadata
    const title = $("title").text() || $("h1").first().text();
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      $("p").first().text().substring(0, 200);

    // Keywords and tags
    const keywords = [];
    $('meta[name="keywords"]').each((i, elem) => {
      keywords.push(
        ...$(elem)
          .attr("content")
          .split(",")
          .map((k) => k.trim())
      );
    });
    $('meta[property="article:tag"]').each((i, elem) => {
      keywords.push($(elem).attr("content"));
    });

    // Extract main content text
    const mainContent = extractCleanText($);

    // Images with filtering for quality
    const images = [];
    $("img").each((i, elem) => {
      const src = $(elem).attr("src");
      const alt = $(elem).attr("alt");
      const width = $(elem).attr("width");
      if (src && src.startsWith("http") && (!width || parseInt(width) > 100)) {
        // Filter out tiny images
        images.push({ src, alt });
      }
    });

    // Videos
    const videos = [];
    $('video source, iframe[src*="youtube"], iframe[src*="vimeo"]').each(
      (i, elem) => {
        const src = $(elem).attr("src");
        if (src) {
          videos.push(src);
        }
      }
    );

    // Social media links
    const socialLinks = [];
    $(
      'a[href*="facebook.com"], a[href*="twitter.com"], a[href*="instagram.com"], a[href*="linkedin.com"]'
    ).each((i, elem) => {
      socialLinks.push($(elem).attr("href"));
    });

    // Contact information
    const contacts = [];
    $('a[href^="mailto:"]').each((i, elem) => {
      contacts.push({
        type: "email",
        value: $(elem).attr("href").replace("mailto:", ""),
      });
    });
    $('a[href^="tel:"]').each((i, elem) => {
      contacts.push({
        type: "phone",
        value: $(elem).attr("href").replace("tel:", ""),
      });
    });

    // Get favicon
    const faviconUrl = await favicon(url);

    // Analyze website purpose
    const websitePurpose = analyzeWebsitePurpose(mainContent, title, keywords);

    // Get color scheme
    const colors = [];
    $("*").each((i, elem) => {
      const color = $(elem).css("color");
      const bgColor = $(elem).css("background-color");
      if (color) colors.push(color);
      if (bgColor) colors.push(bgColor);
    });

    res.json({
      title,
      description,
      favicon: faviconUrl,
      purpose: websitePurpose,
      mainContent: mainContent,
      keywords: [...new Set(keywords)].slice(0, 10),
      images: [...new Set(images.map((img) => img.src))].slice(0, 8),
      videos: [...new Set(videos)].slice(0, 3),
      socialLinks: [...new Set(socialLinks)],
      contacts,
      colors: [...new Set(colors)].slice(0, 5),
      lastAnalyzed: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analysis error:", error.message);
    res.status(500).json({
      error: "Failed to analyze website",
      details: error.message,
      url: req.body.url,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
