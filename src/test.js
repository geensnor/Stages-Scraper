const axios = require("axios");

axios
  .get("https://www.procyclingstats.com", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })
  .then(() => console.log("✓ Success"))
  .catch((err) => console.log("✗ Still blocked:", err.response?.status));
