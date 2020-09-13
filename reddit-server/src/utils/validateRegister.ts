import { UsernameAndPassword } from "../resolvers/UsernameAndPassword";

export const validateRegister = (options: UsernameAndPassword) => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "Invalid email",
      },
    ];
  }

  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "Length must be greater than 2",
      },
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "Cannot include special characters",
      },
    ];
  }

  if (options.password.length < 5) {
    return [
      {
        field: "password",
        message: "Length must be greater than 4",
      },
    ];
  }
  return null;
};
