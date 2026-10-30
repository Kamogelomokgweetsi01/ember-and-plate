import { signIn } from "./auth.js";
import { auth } from "../firebase/config.js";

// Get the login form elements.
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const loginMessage = document.getElementById("loginMessage");
const submitButton = loginForm.querySelector('button[type="submit"]');
const togglePassword = document.getElementById("togglePassword");

// Show or hide the password.
togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "HIDE" : "SHOW";
});

// Handle login.
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    submitButton.disabled = true;
    loginMessage.textContent = "Signing you in...";

    try {
        // Use the signIn function from your existing auth.js.
        const user = await signIn(email, password);

        // Require a verified email before entering the customer area.
        if (!user.emailVerified) {
            await auth.signOut();

            loginMessage.textContent =
                "Please verify your email address before signing in.";

            return;
        }

        loginMessage.textContent = "Login successful!";

        // Redirect to the customer dashboard.
        window.location.href = "../../pages/customer-dashboard.html";

    } catch (error) {
        console.error("Login error:", error.code, error.message);

        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/user-not-found"
        ) {
            loginMessage.textContent =
                "Incorrect email or password. Please try again.";
        } else if (error.code === "auth/invalid-email") {
            loginMessage.textContent =
                "Please enter a valid email address.";
        } else if (error.code === "auth/too-many-requests") {
            loginMessage.textContent =
                "Too many attempts. Please wait and try again.";
        } else {
            loginMessage.textContent =
                "Unable to sign in. Please try again.";
        }
    } finally {
        submitButton.disabled = false;
    }
});
