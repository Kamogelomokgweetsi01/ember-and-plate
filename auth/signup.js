
import { auth, db } from "../firebase/config.js";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Get the existing signup form and its message area.
const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");
const submitButton = signupForm.querySelector('button[type="submit"]');

// Handle guest registration.
signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Read and validate the form values.
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const marketingConsent =
    document.getElementById("marketingConsent").checked;

  if (username.length < 3) {
    signupMessage.textContent =
      "Your username must contain at least 3 characters.";
    return;
  }

  if (password !== confirmPassword) {
    signupMessage.textContent = "Your passwords do not match.";
    return;
  }

  // Prevent duplicate submissions while registration is processing.
  submitButton.disabled = true;
  signupMessage.textContent = "Creating your guest profile...";

  let user;

  try {
    // 1. Create the Firebase Authentication account.
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    user = userCredential.user;

    // 2. Set the guest's display name in Authentication.
    await updateProfile(user, {
      displayName: fullName
    });

    // 3. Save additional guest information in Firestore.
    await setDoc(doc(db, "users", user.uid), {
      fullName,
      username,
      email: user.email,
      marketingConsent,
      role: "customer",
      createdAt: serverTimestamp()
    });

    // 4. Send an email verification link.
    let verificationSent = true;

    if (verificationSent) {
      console.log("Your account was created, check email for  verification.")
    };

    try {
      await sendEmailVerification(user);
    } catch (verificationError) {
      verificationSent = false;
      console.error(
        "Verification email failed:",
        verificationError.code,
        verificationError.message
      );
    }

    // 5. Inform the guest that registration succeeded.
    signupMessage.textContent = verificationSent
      ? "Welcome to Ember & Plate! Your account is created. Please check your email to verify your address before signing in."
      : "Your account was created, but the verification email could not be sent. Please contact support.";

    if (verificationSent) {
      signupForm.reset();
    }
    window.location.href="../../pages/login.html"
  } catch (error) {
    console.error("Signup error:", error.code, error.message);

    if (error.code === "auth/email-already-in-use") {
      signupMessage.textContent =
        "An account with this email already exists. Please sign in instead.";
    } else if (error.code === "auth/weak-password") {
      signupMessage.textContent =
        "Please choose a stronger password.";
    } else if (error.code === "auth/invalid-email") {
      signupMessage.textContent =
        "Please enter a valid email address.";
    } else if (error.code === "permission-denied" ||
               error.code === "firestore/permission-denied") {
      signupMessage.textContent =
        "Your authentication account may have been created, but Firestore rejected the profile. Check your Firestore security rules before trying again.";
    } else {
      signupMessage.textContent =
        "We couldn't complete registration. Please check your connection and try again.";
    }
  } finally {
    submitButton.disabled = false;
  }
});

// Keep the existing SHOW/HIDE password controls working.
function setupPasswordToggle(inputId, buttonId) {
  const passwordInput = document.getElementById(inputId);
  const toggleButton = document.getElementById(buttonId);

  toggleButton.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";
    toggleButton.textContent = isPassword ? "HIDE" : "SHOW";
  });
}

setupPasswordToggle("signupPassword", "toggleSignupPassword");
setupPasswordToggle("confirmPassword", "toggleConfirmPassword");
