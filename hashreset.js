const bcrypt = require("bcryptjs");
const saltRounds = 10;
const password = "angelPass123";

bcrypt.hash(password, saltRounds, function (err, hash) {
  // Store hash in your password DB.
  console.log("Hashed password:", hash);
});
