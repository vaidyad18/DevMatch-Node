const validator = require("validator");

const validateSignupData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required");
  }

  if (firstName.length < 3 || firstName.length > 20) {
    throw new Error("First name must be between 3 and 20 characters");
  }

  if (!emailId) {
    throw new Error("Email is required");
  }

  if (!validator.isEmail(emailId)) {
    throw new Error("Invalid email address");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  // Validate the plain-text password BEFORE it gets hashed
  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol"
    );
  }
};

const validateProfileEditData = (req) => {
  const ALLOWED_UPDATES = [
    "firstName",
    "lastName",
    "emailId",
    "age",
    "mobile",
    "gender",
    "photoURL",
    "description",
    "skills",
    "role",
    "experience",
    "linkedin",
    "github",
    "website",
  ];
  const isAllowed = Object.keys(req.body).every((field) =>
    ALLOWED_UPDATES.includes(field)
  );
  return isAllowed;
};

module.exports = { validateSignupData, validateProfileEditData };
