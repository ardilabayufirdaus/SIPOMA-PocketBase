const SHA256 = require("crypto-js/sha256");

console.log("SHA256 for 'guest':", SHA256("guest").toString());
console.log("SHA256 for 'admin@2025':", SHA256("admin@2025").toString());
