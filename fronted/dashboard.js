// =====================================================
// RETINAAI DASHBOARD
// =====================================================

// IMPORTANT:
// Backend ko deploy karne ke baad yahan deployed backend URL daalna.
// Example:
// const API_BASE_URL = "https://retinaai-backend.vercel.app";

const API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "https://retinaai-backend-5h1p.onrender.com";


// =====================================================
// PAGE INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    // =================================================
    // AUTH CHECK
    // =================================================

    const loggedIn =
        localStorage.getItem("retinaai_logged_in");

    const storedUser =
        localStorage.getItem("retinaai_user");

    if (
        loggedIn !== "true" ||
        !storedUser
    ) {
        window.location.href = "login.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(storedUser);
    } catch (error) {

        localStorage.removeItem("retinaai_logged_in");
        localStorage.removeItem("retinaai_user");

        window.location.href = "login.html";
        return;
    }


    // =================================================
    // DOM ELEMENTS
    // =================================================

    const adminName =
        document.getElementById("adminName");

    const welcomeName =
        document.getElementById("welcomeName");

    const logoutButton =
        document.getElementById("logoutButton");

    const menuButton =
        document.getElementById("menuButton");

    const sidebar =
        document.getElementById("sidebar");


    // =================================================
    // USER INFORMATION
    // =================================================

    const displayName =
        user.name || "Admin";

    if (adminName) {
        adminName.textContent = displayName;
    }

    if (welcomeName) {

        const firstName =
            displayName.split(" ")[0];

        welcomeName.textContent =
            firstName;
    }


    // =================================================
    // LOGOUT
    // =================================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    "retinaai_logged_in"
                );

                localStorage.removeItem(
                    "retinaai_user"
                );

                window.location.href =
                    "login.html";
            }
        );
    }


    // =================================================
    // MOBILE SIDEBAR
    // =================================================

    if (
        menuButton &&
        sidebar
    ) {

        menuButton.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "open"
                );
            }
        );
    }


    // =================================================
    // CLOSE SIDEBAR AFTER NAVIGATION
    // =================================================

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(
        (item) => {

            item.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <= 800 &&
                        sidebar
                    ) {

                        sidebar.classList.remove(
                            "open"
                        );
                    }
                }
            );
        }
    );


    // =================================================
    // NEW SCREENING
    // =================================================

    const startScanButton =
        document.getElementById(
            "startScanButton"
        );

    const newScanNav =
        document.getElementById(
            "newScanNav"
        );

    const quickScan =
        document.getElementById(
            "quickScan"
        );


    function openScanner() {

        window.location.href =
            "index.html";
    }


    if (startScanButton) {

        startScanButton.addEventListener(
            "click",
            openScanner
        );
    }


    if (newScanNav) {

        newScanNav.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                openScanner();
            }
        );
    }


    if (quickScan) {

        quickScan.addEventListener(
            "click",
            openScanner
        );
    }


    // =================================================
    // PATIENTS
    // =================================================

    const patientsNav =
        document.getElementById(
            "patientsNav"
        );

    const quickPatients =
        document.getElementById(
            "quickPatients"
        );

    const viewPatientsButton =
        document.getElementById(
            "viewPatientsButton"
        );


    function openPatients() {

        window.location.href =
            "patients.html";
    }


    if (patientsNav) {

        patientsNav.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                openPatients();
            }
        );
    }


    if (quickPatients) {

        quickPatients.addEventListener(
            "click",
            openPatients
        );
    }


    if (viewPatientsButton) {

        viewPatientsButton.addEventListener(
            "click",
            openPatients
        );
    }


    // =================================================
    // REPORTS
    // =================================================

    const reportsNav =
        document.getElementById(
            "reportsNav"
        );

    const quickReports =
        document.getElementById(
            "quickReports"
        );


    function openReports() {

        window.location.href =
            "reports.html";
    }


    if (reportsNav) {

        reportsNav.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                openReports();
            }
        );
    }


    if (quickReports) {

        quickReports.addEventListener(
            "click",
            openReports
        );
    }


    // =================================================
    // ANALYTICS
    // =================================================

    const analyticsNav =
        document.getElementById(
            "analyticsNav"
        );


    function openAnalytics() {

        window.location.href =
            "analytics.html";
    }


    if (analyticsNav) {

        analyticsNav.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                openAnalytics();
            }
        );
    }


    // =================================================
    // SETTINGS
    // =================================================

    const settingsNav =
        document.getElementById(
            "settingsNav"
        );


    if (settingsNav) {

        settingsNav.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                window.location.href = "settings.html";
            }
        );
    }


    // =================================================
    // PROFILE
    // =================================================

    const profileButton =
        document.getElementById(
            "profileButton"
        );


    if (profileButton) {

        profileButton.addEventListener(
            "click",
            () => {

                alert(
                    `Logged in as ${user.email}`
                );
            }
        );
    }


    // =================================================
    // LOAD DASHBOARD DATA
    // =================================================

    loadDashboardStats();

    loadRecentPatients();

});


// =====================================================
// DASHBOARD STATS
// =====================================================

async function loadDashboardStats() {

    const totalPatients =
        document.getElementById(
            "totalPatients"
        );

    const totalScans =
        document.getElementById(
            "totalScans"
        );

    const totalReferrals =
        document.getElementById(
            "totalReferrals"
        );


    if (totalPatients) {
        totalPatients.textContent = "—";
    }

    if (totalScans) {
        totalScans.textContent = "—";
    }

    if (totalReferrals) {
        totalReferrals.textContent = "—";
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/dashboard/stats`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load dashboard stats"
            );
        }


        const stats =
            data.stats || {};


        if (totalPatients) {

            totalPatients.textContent =
                stats.total_patients ?? 0;
        }


        if (totalScans) {

            totalScans.textContent =
                stats.total_screenings ?? 0;
        }


        if (totalReferrals) {

            totalReferrals.textContent =
                stats.referable_cases ?? 0;
        }


    } catch (error) {

        console.error(
            "Dashboard stats error:",
            error
        );


        if (totalPatients) {
            totalPatients.textContent = "0";
        }

        if (totalScans) {
            totalScans.textContent = "0";
        }

        if (totalReferrals) {
            totalReferrals.textContent = "0";
        }
    }
}


// =====================================================
// RECENT PATIENTS
// =====================================================

async function loadRecentPatients() {

    const tableBody =
        document.getElementById(
            "patientsTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="empty-state">

                    <div class="empty-icon">
                        ◌
                    </div>

                    <strong>
                        Loading records...
                    </strong>

                    <span>
                        Fetching recent screening data.
                    </span>

                </div>
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/screenings`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load screenings"
            );
        }


        const screenings =
            Array.isArray(data.screenings)
                ? data.screenings
                : [];


        if (screenings.length === 0) {

            tableBody.innerHTML = `
                <tr class="empty-row">

                    <td colspan="5">

                        <div class="empty-state">

                            <div class="empty-icon">
                                ◌
                            </div>

                            <strong>
                                No screenings yet
                            </strong>

                            <span>
                                Start your first patient screening
                                to see records here.
                            </span>

                        </div>

                    </td>

                </tr>
            `;

            return;
        }


        screenings.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.created_at || 0
                    );

                const dateB =
                    new Date(
                        b.created_at || 0
                    );

                return dateB - dateA;
            }
        );


        const recentScreenings =
            screenings.slice(0, 5);


        tableBody.innerHTML = "";


        recentScreenings.forEach(
            (screening) => {

                const row =
                    document.createElement("tr");


                const patientName =
                    screening.patient_name ||
                    "Unknown Patient";


                const patientId =
                    screening.patient_id ||
                    "—";


                const grade =
                    Number.isFinite(
                        Number(screening.grade)
                    )
                        ? Number(screening.grade)
                        : "—";


                const referable =
                    Number(
                        screening.referable
                    ) === 1;


                const status =
                    referable
                        ? "Referral"
                        : "Non-Referable";


                const date =
                    formatDashboardDate(
                        screening.created_at
                    );


                row.innerHTML = `

                    <td>

                        <div class="patient-cell">

                            <div class="patient-avatar">
                                ${escapeHtml(
                                    getInitial(
                                        patientName
                                    )
                                )}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        patientName
                                    )}
                                </strong>

                            </div>

                        </div>

                    </td>


                    <td>

                        <span class="patient-id">
                            ${escapeHtml(
                                patientId
                            )}
                        </span>

                    </td>


                    <td>

                        <span class="grade-badge grade-${grade}">
                            ${
                                grade !== "—"
                                    ? `Grade ${grade}`
                                    : "—"
                            }
                        </span>

                    </td>


                    <td>

                        <span class="${
                            referable
                                ? "status-badge referral"
                                : "status-badge clear"
                        }">

                            ${escapeHtml(
                                status
                            )}

                        </span>

                    </td>


                    <td>

                        <span class="date-cell">
                            ${escapeHtml(
                                date
                            )}
                        </span>

                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );


    } catch (error) {

        console.error(
            "Recent patients error:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="empty-state">

                        <div class="empty-icon">
                            !
                        </div>

                        <strong>
                            Unable to load records
                        </strong>

                        <span>
                            Backend connection unavailable.
                        </span>

                    </div>

                </td>

            </tr>
        `;
    }
}


// =====================================================
// DATE FORMATTER
// =====================================================

function formatDashboardDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// =====================================================
// GET INITIAL
// =====================================================

function getInitial(name) {

    if (!name) {
        return "P";
    }


    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
