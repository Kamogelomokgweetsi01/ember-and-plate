
import { resetPassword } from "./auth.js";

document.getElementById("resetPassword").addEventListener("click", async function () {
  const email = document.getElementById("email").value

  try {
    await resetPassword(email);

    console.log("Check your email for the password reset link!");
  } catch (error) {
    console.error("Password reset failed:", error.message);
  }
});
