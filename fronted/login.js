const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "https://retinaai-backend-5h1p.onrender.com";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");

const togglePassword = document.getElementById("togglePassword");
const loginError = document.getElementById("loginError");
const demoAccountButton = document.getElementById("demoAccountButton");

const DEMO_EMAIL = "admin@retinaai.com";
const DEMO_PASSWORD = "admin123";


// =====================================================
// PASSWORD SHOW / HIDE
// =====================================================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";
        togglePassword.textContent = "Hide";

    } else {

        passwordInput.type = "password";
        togglePassword.textContent = "Show";
    }

});


// =====================================================
// ERROR MESSAGE
// =====================================================

function showError(message) {

    loginError.textContent = message;
    loginError.classList.add("show");
}


function hideError() {

    loginError.textContent = "";
    loginError.classList.remove("show");
}


// =====================================================
// DEMO ACCOUNT
// =====================================================

if (demoAccountButton) {

    demoAccountButton.addEventListener("click", () => {

        emailInput.value = DEMO_EMAIL;
        passwordInput.value = DEMO_PASSWORD;

        hideError();

        loginForm.requestSubmit();

    });

}


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;


    // Basic validation
    if (!email || !password) {

        showError(
            "Please enter your email and password."
        );

        return;
    }


    // Loading state
    loginButton.disabled = true;
    loginButton.classList.add("loading");
    loginButtonText.textContent = "Signing in";


    try {

        const response = await fetch(
            `${API_URL}/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        // Login failed
        if (!response.ok || !data.success) {

            showError(
                data.message ||
                "Invalid email or password."
            );

            return;
        }


        // =================================================
        // LOGIN SUCCESS
        // =================================================

        localStorage.setItem(
            "retinaai_user",
            JSON.stringify(data.user)
        );


        localStorage.setItem(
            "retinaai_logged_in",
            "true"
        );


        loginButtonText.textContent =
            "Login successful";


        // Redirect to dashboard
        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showError(
            "Unable to connect to RetinaAI server. Please try again."
        );

    } finally {

        loginButton.disabled = false;

        loginButton.classList.remove("loading");

        if (
            loginButtonText.textContent !==
            "Login successful"
        ) {

            loginButtonText.textContent =
                "Sign in";
        }

    }

});
