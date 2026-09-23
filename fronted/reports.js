const API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "https://retinaai-backend-5h1p.onrender.com";
const REPORTS_API_URL = `${API_BASE_URL}/screenings`;


// =========================================================
// AUTH
// =========================================================

const isLoggedIn =
    localStorage.getItem("retinaai_logged_in");

if (isLoggedIn !== "true") {
    window.location.href = "login.html";
}


// =========================================================
// ELEMENTS
// =========================================================

const reportsLoading =
    document.getElementById("reportsLoading");

const reportsError =
    document.getElementById("reportsError");

const reportsErrorMessage =
    document.getElementById("reportsErrorMessage");

const reportsEmpty =
    document.getElementById("reportsEmpty");

const reportsTableContainer =
    document.getElementById("reportsTableContainer");

const reportsTableBody =
    document.getElementById("reportsTableBody");

const reportsMobileList =
    document.getElementById("reportsMobileList");

const filterEmpty =
    document.getElementById("filterEmpty");

const reportSearch =
    document.getElementById("reportSearch");

const retryReportsButton =
    document.getElementById("retryReportsButton");

const newScreeningButton =
    document.getElementById("newScreeningButton");

const emptyNewScreeningButton =
    document.getElementById("emptyNewScreeningButton");


// Stats
const totalReports =
    document.getElementById("totalReports");

const referableReports =
    document.getElementById("referableReports");

const nonReferableReports =
    document.getElementById("nonReferableReports");

const averageConfidence =
    document.getElementById("averageConfidence");


// Profile
const profileName =
    document.getElementById("profileName");

const profileAvatar =
    document.getElementById("profileAvatar");


// Mobile
const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const logoutButton =
    document.getElementById("logoutButton");


// =========================================================
// STATE
// =========================================================

let allReports = [];


// =========================================================
// USER
// =========================================================

function loadUser() {

    try {

        const storedUser =
            localStorage.getItem("retinaai_user");

        if (!storedUser) {
            return;
        }

        const user =
            JSON.parse(storedUser);

        const name =
            user.name || "Admin";

        if (profileName) {
            profileName.textContent = name;
        }

        if (profileAvatar) {

            profileAvatar.textContent =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "A";
        }

    } catch (error) {

        console.error(
            "Unable to load user:",
            error
        );
    }
}


// =========================================================
// UI STATES
// =========================================================

function hideAllStates() {

    if (reportsLoading) {
        reportsLoading.style.display = "none";
    }

    if (reportsError) {
        reportsError.style.display = "none";
    }

    if (reportsEmpty) {
        reportsEmpty.style.display = "none";
    }

    if (reportsTableContainer) {
        reportsTableContainer.style.display = "none";
    }

    if (reportsMobileList) {
        reportsMobileList.style.display = "none";
    }

    if (filterEmpty) {
        filterEmpty.style.display = "none";
    }
}


function showLoading() {

    hideAllStates();

    if (reportsLoading) {
        reportsLoading.style.display = "flex";
    }
}


function showError(message) {

    hideAllStates();

    if (reportsErrorMessage) {
        reportsErrorMessage.textContent =
            message ||
            "Unable to load screening reports.";
    }

    if (reportsError) {
        reportsError.style.display = "flex";
    }
}


function showEmpty() {

    hideAllStates();

    if (reportsEmpty) {
        reportsEmpty.style.display = "flex";
    }
}


function showReports() {

    if (reportsLoading) {
        reportsLoading.style.display = "none";
    }

    if (reportsError) {
        reportsError.style.display = "none";
    }

    if (reportsEmpty) {
        reportsEmpty.style.display = "none";
    }

    if (reportsTableContainer) {
        reportsTableContainer.style.display = "block";
    }

    if (reportsMobileList) {
        reportsMobileList.style.display = "none";
    }

    if (filterEmpty) {
        filterEmpty.style.display = "none";
    }
}


// =========================================================
// FETCH REPORTS
// =========================================================

async function loadReports() {

    showLoading();

    try {

        const response =
            await fetch(REPORTS_API_URL);

        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load reports."
            );
        }

        allReports =
            Array.isArray(data.screenings)
                ? data.screenings
                : [];

        updateStats(allReports);

        if (allReports.length === 0) {

            showEmpty();
            return;
        }

        renderReports(allReports);

    } catch (error) {

        console.error(
            "Reports loading error:",
            error
        );

        showError(
            "Unable to connect to RetinaAI server. " +
            "Make sure the backend is running."
        );
    }
}


// =========================================================
// STATS
// =========================================================

function updateStats(reports) {

    const total =
        reports.length;

    const referable =
        reports.filter(
            report =>
                Number(report.referable) === 1
        ).length;

    const nonReferable =
        total - referable;

    const confidenceValues =
        reports
            .map(report =>
                Number(report.confidence)
            )
            .filter(
                value =>
                    Number.isFinite(value)
            );

    let avgConfidence = 0;

    if (confidenceValues.length > 0) {

        avgConfidence =
            confidenceValues.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / confidenceValues.length;
    }

    if (totalReports) {
        totalReports.textContent =
            total;
    }

    if (referableReports) {
        referableReports.textContent =
            referable;
    }

    if (nonReferableReports) {
        nonReferableReports.textContent =
            nonReferable;
    }

    if (averageConfidence) {
        averageConfidence.textContent =
            `${avgConfidence.toFixed(1)}%`;
    }
}


// =========================================================
// RENDER
// =========================================================

function renderReports(reports) {

    if (!reports.length) {

        if (allReports.length > 0) {

            hideAllStates();

            if (filterEmpty) {
                filterEmpty.style.display =
                    "block";
            }

        } else {

            showEmpty();
        }

        return;
    }

    showReports();

    renderDesktopTable(reports);
    renderMobileCards(reports);
}


// =========================================================
// DESKTOP TABLE
// =========================================================

function renderDesktopTable(reports) {

    if (!reportsTableBody) {
        return;
    }

    reportsTableBody.innerHTML = "";

    reports.forEach(report => {

        const row =
            document.createElement("tr");

        const patientName =
            report.patient_name ||
            "Unknown Patient";

        const patientId =
            report.patient_id ||
            "—";

        const grade =
            normalizeGrade(report.grade);

        const confidence =
            formatConfidence(
                report.confidence
            );

        const diagnosis =
            report.diagnosis ||
            "Assessment unavailable";

        const date =
            formatDate(
                report.created_at
            );

        const time =
            formatTime(
                report.created_at
            );

        const referable =
            Number(report.referable) === 1;

        const initial =
            patientName
                .trim()
                .charAt(0)
                .toUpperCase() || "P";


        row.innerHTML = `

            <td>

                <div class="report-patient">

                    <div class="report-patient-avatar">
                        ${escapeHtml(initial)}
                    </div>

                    <div class="report-patient-info">

                        <strong>
                            ${escapeHtml(patientName)}
                        </strong>

                        <span>
                            ${escapeHtml(patientId)}
                        </span>

                    </div>

                </div>

            </td>


            <td>

                <div class="report-date">

                    <span class="report-date-main">
                        ${escapeHtml(date)}
                    </span>

                    <span class="report-date-time">
                        ${escapeHtml(time)}
                    </span>

                </div>

            </td>


            <td>

                <div class="report-diagnosis">
                    ${escapeHtml(diagnosis)}
                </div>

            </td>


            <td>

                <span class="grade-badge ${getGradeClass(grade)}">
                    Grade ${escapeHtml(grade)}
                </span>

            </td>


            <td>

                <div class="report-confidence">

                    <span class="report-confidence-value">
                        ${escapeHtml(confidence)}%
                    </span>

                    <div class="report-confidence-bar">

                        <div
                            class="report-confidence-fill"
                            style="width:${confidence}%"
                        ></div>

                    </div>

                </div>

            </td>


            <td>

                <span
                    class="report-status ${
                        referable
                            ? "referable"
                            : "clear"
                    }"
                >

                    <i class="report-status-dot"></i>

                    ${
                        referable
                            ? "Referable"
                            : "Non-Referable"
                    }

                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="report-view-button"
                    data-report-id="${escapeHtml(report.id)}"
                >
                    View Report
                </button>

            </td>

        `;


        const button =
            row.querySelector(
                ".report-view-button"
            );

        if (button) {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.reportId;

                    openReport(id);
                }
            );
        }


        reportsTableBody.appendChild(row);
    });
}


// =========================================================
// MOBILE CARDS
// =========================================================

function renderMobileCards(reports) {

    if (!reportsMobileList) {
        return;
    }

    reportsMobileList.innerHTML = "";

    reportsMobileList.style.display =
        "block";

    reports.forEach(report => {

        const card =
            document.createElement("div");

        card.className =
            "report-mobile-card";

        const patientName =
            report.patient_name ||
            "Unknown Patient";

        const patientId =
            report.patient_id ||
            "—";

        const grade =
            normalizeGrade(report.grade);

        const confidence =
            formatConfidence(
                report.confidence
            );

        const diagnosis =
            report.diagnosis ||
            "Assessment unavailable";

        const date =
            formatDate(
                report.created_at
            );

        const referable =
            Number(report.referable) === 1;

        const initial =
            patientName
                .trim()
                .charAt(0)
                .toUpperCase() || "P";


        card.innerHTML = `

            <div class="mobile-report-header">

                <div class="mobile-report-patient">

                    <div class="report-patient-avatar">
                        ${escapeHtml(initial)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(patientName)}
                        </strong>

                        <span>
                            ${escapeHtml(patientId)}
                        </span>

                    </div>

                </div>


                <span
                    class="report-status ${
                        referable
                            ? "referable"
                            : "clear"
                    }"
                >

                    <i class="report-status-dot"></i>

                    ${
                        referable
                            ? "Referable"
                            : "Non-Referable"
                    }

                </span>

            </div>


            <div class="mobile-report-details">

                <div class="mobile-report-detail">

                    <span>
                        DATE
                    </span>

                    <strong>
                        ${escapeHtml(date)}
                    </strong>

                </div>


                <div class="mobile-report-detail">

                    <span>
                        GRADE
                    </span>

                    <strong>
                        Grade ${escapeHtml(grade)}
                    </strong>

                </div>


                <div class="mobile-report-detail">

                    <span>
                        DIAGNOSIS
                    </span>

                    <strong>
                        ${escapeHtml(diagnosis)}
                    </strong>

                </div>


                <div class="mobile-report-detail">

                    <span>
                        CONFIDENCE
                    </span>

                    <strong>
                        ${escapeHtml(confidence)}%
                    </strong>

                </div>

            </div>


            <div class="mobile-report-footer">

                <span
                    class="grade-badge ${getGradeClass(grade)}"
                >
                    Grade ${escapeHtml(grade)}
                </span>

                <button
                    type="button"
                    class="report-view-button"
                    data-report-id="${escapeHtml(report.id)}"
                >
                    View Report
                </button>

            </div>

        `;


        const button =
            card.querySelector(
                ".report-view-button"
            );

        if (button) {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.reportId;

                    openReport(id);
                }
            );
        }


        reportsMobileList.appendChild(card);
    });
}


// =========================================================
// OPEN REPORT
// =========================================================

function openReport(id) {

    if (!id) {
        return;
    }

    window.location.href =
        `screening-report.html?id=${encodeURIComponent(id)}`;
}


// =========================================================
// SEARCH
// =========================================================

function searchReports() {

    const query =
        reportSearch
            ? reportSearch.value
                .trim()
                .toLowerCase()
            : "";

    if (!query) {

        renderReports(allReports);
        return;
    }

    const filtered =
        allReports.filter(report => {

            const patientName =
                String(
                    report.patient_name || ""
                ).toLowerCase();

            const patientId =
                String(
                    report.patient_id || ""
                ).toLowerCase();

            const diagnosis =
                String(
                    report.diagnosis || ""
                ).toLowerCase();

            const grade =
                String(
                    report.grade ?? ""
                ).toLowerCase();

            return (
                patientName.includes(query) ||
                patientId.includes(query) ||
                diagnosis.includes(query) ||
                grade.includes(query)
            );
        });


    if (filtered.length === 0) {

        if (reportsTableContainer) {
            reportsTableContainer.style.display =
                "none";
        }

        if (reportsMobileList) {
            reportsMobileList.style.display =
                "none";
        }

        if (filterEmpty) {
            filterEmpty.style.display =
                "block";
        }

        return;
    }


    renderReports(filtered);
}


// =========================================================
// HELPERS
// =========================================================

function normalizeGrade(value) {

    const grade =
        Number(value);

    if (!Number.isFinite(grade)) {
        return "—";
    }

    return Math.max(
        0,
        Math.min(4, Math.round(grade))
    );
}


function formatConfidence(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0.0";
    }

    return Math.max(
        0,
        Math.min(
            100,
            number
        )
    ).toFixed(1);
}


function getGradeClass(grade) {

    const number =
        Number(grade);

    if (!Number.isFinite(number)) {
        return "";
    }

    if (number >= 2) {
        return "grade-high";
    }

    if (number === 1) {
        return "grade-medium";
    }

    return "grade-low";
}


function formatDate(value) {

    if (!value) {
        return "Date unavailable";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
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


function formatTime(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// NAVIGATION
// =========================================================

function closeSidebar() {

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("show");
    }
}


if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        () => {

            if (sidebar) {
                sidebar.classList.toggle("open");
            }

            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle(
                    "show"
                );
            }
        }
    );
}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );
}


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


// =========================================================
// BUTTONS
// =========================================================

if (newScreeningButton) {

    newScreeningButton.addEventListener(
        "click",
        () => {
            window.location.href =
                "index.html";
        }
    );
}


if (emptyNewScreeningButton) {

    emptyNewScreeningButton.addEventListener(
        "click",
        () => {
            window.location.href =
                "index.html";
        }
    );
}


if (retryReportsButton) {

    retryReportsButton.addEventListener(
        "click",
        loadReports
    );
}


if (reportSearch) {

    reportSearch.addEventListener(
        "input",
        searchReports
    );
}


// =========================================================
// PROFILE
// =========================================================

const profileButton =
    document.getElementById("profileButton");

if (profileButton) {

    profileButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";
        }
    );
}


// =========================================================
// INITIALIZE
// =========================================================

loadUser();
loadReports();
