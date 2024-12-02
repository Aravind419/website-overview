document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("urlInput");
  const getOverviewButton = document.getElementById("getOverview");
  const errorMessage = document.getElementById("errorMessage");
  const spinner = document.getElementById("spinner");
  const overviewSection = document.getElementById("overviewSection");

  // Website Analysis
  getOverviewButton.addEventListener("click", async () => {
    let url = urlInput.value.trim();

    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    errorMessage.textContent = "";
    spinner.style.display = "flex";
    overviewSection.style.display = "none";

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "https://website-overview.vercel.app/";
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze website");
      }

      displayOverview(data);
    } catch (error) {
      errorMessage.textContent = error.message;
      overviewSection.style.display = "none";
    } finally {
      spinner.style.display = "none";
    }
  });

  function displayOverview(data) {
    overviewSection.innerHTML = `
            <div class="overview-card">
                <div class="website-header">
                    <img src="${
                      data.favicon || ""
                    }" alt="Website favicon" class="favicon">
                    <h2>${data.title || "Untitled Website"}</h2>
                </div>
                
                ${
                  data.purpose
                    ? `
                    <div class="purpose-section">
                        <h3>Website Purpose</h3>
                        <p>This appears to be a ${data.purpose} website.</p>
                    </div>
                `
                    : ""
                }

                ${
                  data.description
                    ? `
                    <div class="description-section">
                        <h3>Description</h3>
                        <p>${data.description}</p>
                    </div>
                `
                    : ""
                }

                ${
                  data.mainContent
                    ? `
                    <div class="content-section">
                        <h3>Main Content</h3>
                        <p>${data.mainContent}</p>
                    </div>
                `
                    : ""
                }

                ${
                  data.keywords && data.keywords.length
                    ? `
                    <div class="keywords-section">
                        <h3>Keywords</h3>
                        <div class="keywords-container">
                            ${data.keywords
                              .map(
                                (keyword) =>
                                  `<span class="keyword">${keyword}</span>`
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }

                ${
                  data.images && data.images.length
                    ? `
                    <div class="images-section">
                        <h3>Featured Images</h3>
                        <div class="images-grid">
                            ${data.images
                              .map(
                                (img) =>
                                  `<img src="${img}" alt="Website content" class="preview-image">`
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }

                ${
                  data.videos && data.videos.length
                    ? `
                    <div class="videos-section">
                        <h3>Videos</h3>
                        <div class="videos-grid">
                            ${data.videos
                              .map(
                                (video) =>
                                  `<iframe src="${video}" frameborder="0" allowfullscreen></iframe>`
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }

                ${
                  data.socialLinks && data.socialLinks.length
                    ? `
                    <div class="social-section">
                        <h3>Social Media</h3>
                        <div class="social-links">
                            ${data.socialLinks
                              .map(
                                (link) =>
                                  `<a href="${link}" target="_blank" class="social-link">${getSocialPlatform(
                                    link
                                  )}</a>`
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }

                ${
                  data.contacts && data.contacts.length
                    ? `
                    <div class="contact-section">
                        <h3>Contact Information</h3>
                        <div class="contacts-list">
                            ${data.contacts
                              .map(
                                (contact) =>
                                  `<div class="contact-item">
                                    <span class="contact-type">${contact.type}:</span>
                                    <span class="contact-value">${contact.value}</span>
                                </div>`
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }

                ${
                  data.colors && data.colors.length
                    ? `
                    <div class="colors-section">
                        <h3>Color Scheme</h3>
                        <div class="color-palette">
                            ${data.colors
                              .map(
                                (color) =>
                                  `<div class="color-sample" style="background-color: ${color}"></div>`
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }

                <div class="analysis-timestamp">
                    Last analyzed: ${new Date(
                      data.lastAnalyzed
                    ).toLocaleString()}
                </div>
            </div>
        `;

    overviewSection.style.display = "block";
  }

  function getSocialPlatform(url) {
    if (url.includes("facebook")) return "Facebook";
    if (url.includes("twitter")) return "Twitter";
    if (url.includes("instagram")) return "Instagram";
    if (url.includes("linkedin")) return "LinkedIn";
    return "Social Media";
  }

  function isValidUrl(string) {
    // Remove any leading/trailing whitespace
    string = string.trim();

    // Add protocol if missing
    if (!string.startsWith("http://") && !string.startsWith("https://")) {
      string = "https://" + string;
    }

    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Make analyzeUrl available globally
  window.analyzeUrl = (url) => {
    urlInput.value = url;
    getOverviewButton.click();
  };
});
