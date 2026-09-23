const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "https://retinaai-backend-5h1p.onrender.com";


// =========================================================
// ELEMENTS
// =========================================================

const signupForm =
    document.getElementById("signupForm");

const nameInput =
    document.getElementById("name");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const togglePassword =
    document.getElementById("togglePassword");

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");

const signupButton =
    document.getElementById("signupButton");

const signupButtonText =
    document.getElementById("signupButtonText");

const signupError =
    document.getElementById("signupError");

const signupSuccess =
    document.getElementById("signupSuccess");


// =========================================================
// SHOW ERROR
// =========================================================

function showError(message) {

    signupError.textContent = message;

    signupError.classList.add("show");

}


// =========================================================
// HIDE ERROR
// =========================================================

function hideError() {

    signupError.textContent = "";

    signupError.classList.remove("show");

}


// =========================================================
// SHOW SUCCESS
// =========================================================

function showSuccess(message) {

    signupSuccess.textContent = message;

    signupSuccess.classList.add("show");

}


// =========================================================
// HIDE SUCCESS
// =========================================================

function hideSuccess() {

    signupSuccess.textContent = "";

    signupSuccess.classList.remove("show");

}


// =========================================================
// PASSWORD VISIBILITY
// =========================================================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "Hide";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "Show";

    }

});


// =========================================================
// CONFIRM PASSWORD VISIBILITY
// =========================================================

toggleConfirmPassword.addEventListener(
    "click",
    () => {

        if (
            confirmPasswordInput.type ===
            "password"
        ) {

            confirmPasswordInput.type =
                "text";

            toggleConfirmPassword.textContent =
                "Hide";

        } else {

            confirmPasswordInput.type =
                "password";

            toggleConfirmPassword.textContent =
                "Show";

        }

    }
);


// =========================================================
// SIGNUP
// =========================================================

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        hideError();
        hideSuccess();


        // -------------------------------------------------
        // GET VALUES
        // -------------------------------------------------

        const name =
            nameInput.value.trim();

        const email =
            emailInput.value.trim().toLowerCase();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        // -------------------------------------------------
        // FRONTEND VALIDATION
        // -------------------------------------------------

        if (!name) {

            showError(
                "Please enter your full name."
            );

            nameInput.focus();

            return;
        }


        if (!email) {

            showError(
                "Please enter your email address."
            );

            emailInput.focus();

            return;
        }


        if (
            !email.includes("@") ||
            !email.includes(".")
        ) {

            showError(
                "Please enter a valid email address."
            );

            emailInput.focus();

            return;
        }


        if (password.length < 6) {

            showError(
                "Password must be at least 6 characters."
            );

            passwordInput.focus();

            return;
        }


        if (password !== confirmPassword) {

            showError(
                "Passwords do not match."
            );

            confirmPasswordInput.focus();

            return;
        }


        // -------------------------------------------------
        // LOADING STATE
        // -------------------------------------------------

        signupButton.disabled = true;

        signupButton.classList.add("loading");

        signupButtonText.textContent =
            "Creating account";


        try {

            // ---------------------------------------------
            // API REQUEST
            // ---------------------------------------------

            const response = await fetch(
                `${API_URL}/signup`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name: name,

                        email: email,

                        password: password,

                        confirm_password:
                            confirmPassword

                    })
                }
            );


            const data =
                await response.json();


            // ---------------------------------------------
            // SIGNUP FAILED
            // ---------------------------------------------

            if (
                !response.ok ||
                !data.success
            ) {

                showError(
                    data.message ||
                    "Unable to create account."
                );

                return;
            }


            // ---------------------------------------------
            // SUCCESS
            // ---------------------------------------------

            showSuccess(
                "Account created successfully! Redirecting to login..."
            );

            signupButtonText.textContent =
                "Account created";


            // ---------------------------------------------
            // CLEAR FORM
            // ---------------------------------------------

            passwordInput.value = "";

            confirmPasswordInput.value = "";


            // ---------------------------------------------
            // REDIRECT TO LOGIN
            // ---------------------------------------------

            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 1500);


        } catch (error) {

            console.error(
                "Signup error:",
                error
            );


            showError(
                "Unable to connect to RetinaAI server. Please try again."
            );


        } finally {

            signupButton.disabled = false;

            signupButton.classList.remove(
                "loading"
            );


            if (
                signupButtonText.textContent !==
                "Account created"
            ) {

                signupButtonText.textContent =
                    "Create Account";

            }

        }

    }
);
