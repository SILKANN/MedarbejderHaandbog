const fs = require("fs");

const now = new Date();
const formatted = now.toLocaleString("da-DK", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Copenhagen",
});

const data = {
  updated: formatted,
};

fs.writeFileSync("build-timestamp.json", JSON.stringify(data, null, 2));
console.log("✅ build-timestamp.json opdateret:", formatted);
