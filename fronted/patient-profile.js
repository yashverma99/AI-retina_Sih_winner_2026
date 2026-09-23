const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "https://retinaai-backend-5h1p.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       AUTHENTICATION
    ===================================================== */

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

        user = JSON.parse(
            storedUser
        );

    } catch (error) {

        localStorage.removeItem(
            "retinaai_logged_in"
        );

        localStorage.removeItem(
            "retinaai_user"
        );

        window.location.href =
            "login.html";

        return;
    }


    /* =====================================================
       URL
    ===================================================== */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const patientId =
        urlParams.get("id");


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const pageLoading =
        document.getElementById(
            "pageLoading"
        );

    const pageError =
        document.getElementById(
            "pageError"
        );

    const profileContent =
        document.getElementById(
            "profileContent"
        );

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );

    const adminName =
        document.getElementById(
            "adminName"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const menuButton =
        document.getElementById(
            "menuButton"
        );

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    const profileButton =
        document.getElementById(
            "profileButton"
        );

    const patientAvatar =
        document.getElementById(
            "patientAvatar"
        );

    const patientIdElement =
        document.getElementById(
            "patientId"
        );

    const patientName =
        document.getElementById(
            "patientName"
        );

    const patientStatus =
        document.getElementById(
            "patientStatus"
        );

    const breadcrumbPatient =
        document.getElementById(
            "breadcrumbPatient"
        );

    const patientAge =
        document.getElementById(
            "patientAge"
        );

    const patientGender =
        document.getElementById(
            "patientGender"
        );

    const patientPhone =
        document.getElementById(
            "patientPhone"
        );

    const patientCreated =
        document.getElementById(
            "patientCreated"
        );

    const detailPatientId =
        document.getElementById(
            "detailPatientId"
        );

    const detailPatientName =
        document.getElementById(
            "detailPatientName"
        );

    const detailPatientAge =
        document.getElementById(
            "detailPatientAge"
        );

    const detailPatientGender =
        document.getElementById(
            "detailPatientGender"
        );

    const detailPatientPhone =
        document.getElementById(
            "detailPatientPhone"
        );

    const detailPatientCreated =
        document.getElementById(
            "detailPatientCreated"
        );

    const screeningList =
        document.getElementById(
            "screeningList"
        );

    const screeningEmpty =
        document.getElementById(
            "screeningEmpty"
        );

    const screeningCount =
        document.getElementById(
            "screeningCount"
        );

    const summaryScans =
        document.getElementById(
            "summaryScans"
        );

    const summaryReferrals =
        document.getElementById(
            "summaryReferrals"
        );

    const summaryGrade =
        document.getElementById(
            "summaryGrade"
        );

    const riskTrendEmpty =
        document.getElementById(
            "riskTrendEmpty"
        );

    const riskTrendContainer =
        document.getElementById(
            "riskTrendContainer"
        );

    const riskTrendChart =
        document.getElementById(
            "riskTrendChart"
        );

    const backButton =
        document.getElementById(
            "backButton"
        );

    const newScreeningButton =
        document.getElementById(
            "newScreeningButton"
        );

    const emptyScreeningButton =
        document.getElementById(
            "emptyScreeningButton"
        );

    const reportsNav =
        document.getElementById(
            "reportsNav"
        );

    const analyticsNav =
        document.getElementById(
            "analyticsNav"
        );

    const settingsNav =
        document.getElementById(
            "settingsNav"
        );

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );


    /* =====================================================
       ADMIN
    ===================================================== */

    if (adminName) {

        adminName.textContent =
            user.name ||
            "Admin";
    }


    /* =====================================================
       MOBILE MENU
    ===================================================== */

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


    /* =====================================================
       LOGOUT
    ===================================================== */

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


    /* =====================================================
       PROFILE
    ===================================================== */

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


    /* =====================================================
       BACK BUTTON
    ===================================================== */

    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "patients.html";

            }
        );
    }


    /* =====================================================
       NEW SCREENING
    ===================================================== */

    function startNewScreening() {

        if (!patientId) {
            return;
        }

        window.location.href =
            `index.html?patient=${encodeURIComponent(patientId)}`;
    }


    if (newScreeningButton) {

        newScreeningButton.addEventListener(
            "click",
            startNewScreening
        );
    }


    if (emptyScreeningButton) {

        emptyScreeningButton.addEventListener(
            "click",
            startNewScreening
        );
    }


    /* =====================================================
       OTHER NAVIGATION
    ===================================================== */

    if (reportsNav) {

        reportsNav.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                window.location.href = "reports.html";

            }
        );
    }


    if (analyticsNav) {

        analyticsNav.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                window.location.href = "analytics.html";

            }
        );
    }


    if (settingsNav) {

        settingsNav.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                window.location.href = "settings.html";

            }
        );
    }


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                alert(
                    "No new notifications."
                );

            }
        );
    }


    /* =====================================================
       PATIENT ID VALIDATION
    ===================================================== */

    if (!patientId) {

        showError(
            "No patient ID was provided. Please select a patient from the Patients page."
        );

        return;
    }


    /* =====================================================
       LOAD PATIENT
    ===================================================== */

    async function loadPatient() {

        showLoading();

        try {

            /* ---------------------------------------------
               PATIENT DETAILS
            --------------------------------------------- */

            const patientResponse =
                await fetch(
                    `${API_URL}/patients/${encodeURIComponent(patientId)}`
                );

            const patientData =
                await patientResponse.json();

            if (
                !patientResponse.ok ||
                !patientData.success
            ) {

                throw new Error(
                    patientData.message ||
                    "Unable to load patient."
                );
            }


            const patient =
                patientData.patient;


            /* ---------------------------------------------
               SCREENING HISTORY
            --------------------------------------------- */

            const screeningResponse =
                await fetch(
                    `${API_URL}/screenings/${encodeURIComponent(patientId)}`
                );

            const screeningData =
                await screeningResponse.json();

            if (
                !screeningResponse.ok ||
                !screeningData.success
            ) {

                throw new Error(
                    screeningData.message ||
                    "Unable to load screening history."
                );
            }


            const screenings =
                Array.isArray(
                    screeningData.screenings
                )
                    ? screeningData.screenings
                    : [];


            /* ---------------------------------------------
               RENDER
            --------------------------------------------- */

            renderPatient(
                patient
            );

            renderScreenings(
                screenings
            );

            renderRiskTrend(
                screenings
            );

            hideLoading();

        } catch (error) {

            console.error(
                "Patient profile error:",
                error
            );

            showError(
                error.message ||
                "Unable to connect to RetinaAI server."
            );
        }
    }


    /* =====================================================
       RENDER PATIENT
    ===================================================== */

    function renderPatient(
        patient
    ) {

        const name =
            patient.name ||
            "Unknown Patient";

        const id =
            patient.patient_id ||
            "—";

        const age =
            patient.age !== null &&
            patient.age !== undefined
                ? patient.age
                : "—";

        const gender =
            patient.gender ||
            "—";

        const phone =
            patient.phone ||
            "—";

        const created =
            formatDate(
                patient.created_at
            );

        const firstLetter =
            name
                .charAt(0)
                .toUpperCase();


        if (patientAvatar) {

            patientAvatar.textContent =
                firstLetter;
        }


        if (patientIdElement) {

            patientIdElement.textContent =
                id;
        }


        if (patientName) {

            patientName.textContent =
                name;
        }


        if (breadcrumbPatient) {

            breadcrumbPatient.textContent =
                name;
        }


        if (patientAge) {

            patientAge.textContent =
                age;
        }


        if (patientGender) {

            patientGender.textContent =
                gender;
        }


        if (patientPhone) {

            patientPhone.textContent =
                phone;
        }


        if (patientCreated) {

            patientCreated.textContent =
                created;
        }


        if (detailPatientId) {

            detailPatientId.textContent =
                id;
        }


        if (detailPatientName) {

            detailPatientName.textContent =
                name;
        }


        if (detailPatientAge) {

            detailPatientAge.textContent =
                age;
        }


        if (detailPatientGender) {

            detailPatientGender.textContent =
                gender;
        }


        if (detailPatientPhone) {

            detailPatientPhone.textContent =
                phone;
        }


        if (detailPatientCreated) {

            detailPatientCreated.textContent =
                created;
        }


        if (patientStatus) {

            patientStatus.textContent =
                "ACTIVE";
        }


        document.title =
            `${name} | RetinaAI`;
    }


    /* =====================================================
       RENDER SCREENINGS
    ===================================================== */

    function renderScreenings(
        screenings
    ) {

        if (!screeningList) {
            return;
        }


        screenings =
            sortScreenings(
                screenings
            );


        const total =
            screenings.length;


        if (screeningCount) {

            screeningCount.textContent =
                `${total} ${
                    total === 1
                        ? "screening"
                        : "screenings"
                }`;
        }


        if (summaryScans) {

            summaryScans.textContent =
                total;
        }


        /* ---------------------------------------------
           NO SCREENINGS
        --------------------------------------------- */

        if (!total) {

            screeningList.innerHTML =
                "";

            if (screeningEmpty) {

                screeningEmpty.style.display =
                    "flex";
            }

            updateSummary([]);

            return;
        }


        if (screeningEmpty) {

            screeningEmpty.style.display =
                "none";
        }


        screeningList.innerHTML =
            "";


        /* ---------------------------------------------
           SCREENING ITEMS
        --------------------------------------------- */

        screenings.forEach(
            (screening) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "screening-item";


                const confidence =
                    Number(
                        screening.confidence ||
                        0
                    );


                const confidencePercent =
                    Math.round(
                        confidence * 100
                    );


                const safeConfidence =
                    Math.min(
                        Math.max(
                            confidencePercent,
                            0
                        ),
                        100
                    );


                const screeningGrade =
                    screening.grade !== null &&
                    screening.grade !== undefined
                        ? screening.grade
                        : "—";


                const screeningDiagnosis =
                    screening.diagnosis ||
                    "Unknown Result";


                const referral =
                    Number(
                        screening.referable
                    ) === 1;


                const date =
                    formatDateTime(
                        screening.created_at
                    );


                /* -----------------------------------------
                   SCREENING HTML
                ----------------------------------------- */

                item.innerHTML = `

                    <div class="screening-main">

                        <div class="screening-date">
                            ${escapeHtml(date)}
                        </div>

                        <div class="screening-diagnosis">
                            ${escapeHtml(screeningDiagnosis)}
                        </div>

                        <div class="screening-meta">

                            <span class="meta-badge grade">
                                Grade ${escapeHtml(screeningGrade)}
                            </span>

                            ${
                                referral
                                    ? `
                                        <span class="meta-badge referral">
                                            Referral Recommended
                                        </span>
                                      `
                                    : `
                                        <span class="meta-badge clear">
                                            Non-Referable
                                        </span>
                                      `
                            }

                        </div>

                    </div>


                    <div class="screening-confidence">

                        <span class="confidence-label">
                            AI Confidence
                        </span>

                        <strong class="confidence-value">
                            ${safeConfidence}%
                        </strong>

                        <div class="confidence-bar">

                            <div
                                class="confidence-fill"
                                style="width:${safeConfidence}%"
                            ></div>

                        </div>

                    </div>


                    <div class="screening-actions">

                        <button
                            type="button"
                            class="view-report-button"
                            data-screening-id="${screening.id}"
                        >
                            View Report
                        </button>

                    </div>

                `;


                /* -----------------------------------------
                   VIEW REPORT BUTTON
                ----------------------------------------- */

                const viewReportButton =
                    item.querySelector(
                        ".view-report-button"
                    );


                if (viewReportButton) {

                    viewReportButton.addEventListener(
                        "click",
                        () => {

                            const id =
                                viewReportButton.dataset
                                    .screeningId;


                            if (!id) {
                                return;
                            }


                            window.location.href =
                                `screening-report.html?id=${encodeURIComponent(id)}`;

                        }
                    );
                }


                screeningList.appendChild(
                    item
                );
            }
        );


        updateSummary(
            screenings
        );
    }


    /* =====================================================
       RISK TREND
    ===================================================== */

    function renderRiskTrend(
        screenings
    ) {

        if (
            !riskTrendEmpty ||
            !riskTrendContainer ||
            !riskTrendChart
        ) {
            return;
        }


        const validScreenings =
            screenings
                .filter(
                    screening =>
                        screening.grade !== null &&
                        screening.grade !== undefined &&
                        !Number.isNaN(
                            Number(
                                screening.grade
                            )
                        )
                )
                .sort(
                    (a, b) => {

                        return (
                            new Date(
                                normalizeDate(
                                    a.created_at
                                )
                            ).getTime()
                            -
                            new Date(
                                normalizeDate(
                                    b.created_at
                                )
                            ).getTime()
                        );
                    }
                );


        /* ---------------------------------------------
           NOT ENOUGH DATA
        --------------------------------------------- */

        if (
            validScreenings.length < 2
        ) {

            riskTrendEmpty.style.display =
                "flex";

            riskTrendContainer.style.display =
                "none";

            riskTrendChart.innerHTML =
                "";

            return;
        }


        riskTrendEmpty.style.display =
            "none";

        riskTrendContainer.style.display =
            "block";

        riskTrendChart.innerHTML =
            "";


        /* ---------------------------------------------
           CHART WRAPPER
        --------------------------------------------- */

        const chartWrapper =
            document.createElement(
                "div"
            );


        chartWrapper.className =
            "risk-chart-wrapper";


        /* ---------------------------------------------
           GRID
        --------------------------------------------- */

        const grid =
            document.createElement(
                "div"
            );


        grid.className =
            "risk-grid";


        for (
            let gradeValue = 0;
            gradeValue <= 4;
            gradeValue++
        ) {

            const line =
                document.createElement(
                    "div"
                );


            line.className =
                "risk-grid-line";


            line.style.bottom =
                `${(gradeValue / 4) * 100}%`;


            const label =
                document.createElement(
                    "span"
                );


            label.className =
                "risk-grid-label";


            label.textContent =
                `Grade ${gradeValue}`;


            line.appendChild(
                label
            );


            grid.appendChild(
                line
            );
        }


        chartWrapper.appendChild(
            grid
        );


        /* ---------------------------------------------
           SVG
        --------------------------------------------- */

        const svgNS =
            "http://www.w3.org/2000/svg";


        const svg =
            document.createElementNS(
                svgNS,
                "svg"
            );


        svg.setAttribute(
            "class",
            "risk-svg"
        );


        svg.setAttribute(
            "viewBox",
            "0 0 100 100"
        );


        svg.setAttribute(
            "preserveAspectRatio",
            "none"
        );


        /* ---------------------------------------------
           POINTS
        --------------------------------------------- */

        const points =
            validScreenings.map(
                (
                    screening,
                    index
                ) => {

                    const gradeValue =
                        Math.min(
                            Math.max(
                                Number(
                                    screening.grade
                                ),
                                0
                            ),
                            4
                        );


                    let x;


                    if (
                        validScreenings.length === 1
                    ) {

                        x = 50;

                    } else {

                        x =
                            (
                                index /
                                (
                                    validScreenings.length -
                                    1
                                )
                            ) * 100;
                    }


                    const y =
                        100 -
                        (
                            gradeValue /
                            4
                        ) * 100;


                    return {
                        x,
                        y,
                        grade: gradeValue,
                        screening
                    };
                }
            );


        /* ---------------------------------------------
           LINE
        --------------------------------------------- */

        const polyline =
            document.createElementNS(
                svgNS,
                "polyline"
            );


        polyline.setAttribute(
            "points",
            points
                .map(
                    point =>
                        `${point.x},${point.y}`
                )
                .join(" ")
        );


        polyline.setAttribute(
            "class",
            "risk-trend-line"
        );


        svg.appendChild(
            polyline
        );


        /* ---------------------------------------------
           POINT CIRCLES
        --------------------------------------------- */

        points.forEach(
            (
                point,
                index
            ) => {

                const circle =
                    document.createElementNS(
                        svgNS,
                        "circle"
                    );


                circle.setAttribute(
                    "cx",
                    point.x
                );


                circle.setAttribute(
                    "cy",
                    point.y
                );


                circle.setAttribute(
                    "r",
                    "2.2"
                );


                circle.setAttribute(
                    "class",
                    "risk-trend-point"
                );


                circle.setAttribute(
                    "data-index",
                    index
                );


                svg.appendChild(
                    circle
                );
            }
        );


        chartWrapper.appendChild(
            svg
        );


        /* ---------------------------------------------
           X AXIS LABELS
        --------------------------------------------- */

        const labels =
            document.createElement(
                "div"
            );


        labels.className =
            "risk-chart-labels";


        points.forEach(
            (
                point,
                index
            ) => {

                const label =
                    document.createElement(
                        "span"
                    );


                label.className =
                    "risk-chart-label";


                label.textContent =
                    `Scan ${index + 1}`;


                if (
                    point.screening.created_at
                ) {

                    label.title =
                        formatDate(
                            point.screening.created_at
                        );
                }


                labels.appendChild(
                    label
                );
            }
        );


        riskTrendChart.appendChild(
            chartWrapper
        );


        riskTrendChart.appendChild(
            labels
        );
    }


    /* =====================================================
       SORT SCREENINGS
    ===================================================== */

    function sortScreenings(
        screenings
    ) {

        return [...screenings].sort(
            (a, b) => {

                return (
                    new Date(
                        normalizeDate(
                            b.created_at
                        )
                    ).getTime()
                    -
                    new Date(
                        normalizeDate(
                            a.created_at
                        )
                    ).getTime()
                );
            }
        );
    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    function updateSummary(
        screenings
    ) {

        const referralCount =
            screenings.filter(
                screening =>
                    Number(
                        screening.referable
                    ) === 1
            ).length;


        if (summaryReferrals) {

            summaryReferrals.textContent =
                referralCount;
        }


        if (
            summaryGrade &&
            screenings.length
        ) {

            const latest =
                screenings[0];


            const latestGrade =
                latest.grade !== null &&
                latest.grade !== undefined
                    ? latest.grade
                    : "—";


            summaryGrade.textContent =
                `Grade ${latestGrade}`;

        } else if (summaryGrade) {

            summaryGrade.textContent =
                "—";
        }
    }


    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading() {

        if (pageLoading) {

            pageLoading.style.display =
                "flex";
        }


        if (pageError) {

            pageError.style.display =
                "none";
        }


        if (profileContent) {

            profileContent.style.display =
                "none";
        }
    }


    function hideLoading() {

        if (pageLoading) {

            pageLoading.style.display =
                "none";
        }


        if (pageError) {

            pageError.style.display =
                "none";
        }


        if (profileContent) {

            profileContent.style.display =
                "block";
        }
    }


    /* =====================================================
       ERROR
    ===================================================== */

    function showError(
        message
    ) {

        if (pageLoading) {

            pageLoading.style.display =
                "none";
        }


        if (profileContent) {

            profileContent.style.display =
                "none";
        }


        if (pageError) {

            pageError.style.display =
                "flex";
        }


        if (errorMessage) {

            errorMessage.textContent =
                message;
        }
    }


    /* =====================================================
       DATE HELPERS
    ===================================================== */

    function normalizeDate(
        dateString
    ) {

        if (!dateString) {
            return "";
        }


        return String(
            dateString
        ).replace(
            " ",
            "T"
        );
    }


    function formatDate(
        dateString
    ) {

        if (!dateString) {
            return "—";
        }


        const date =
            new Date(
                normalizeDate(
                    dateString
                )
            );


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


    function formatDateTime(
        dateString
    ) {

        if (!dateString) {
            return "—";
        }


        const date =
            new Date(
                normalizeDate(
                    dateString
                )
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }


        return (
            date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )
            +
            " • "
            +
            date.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
        );
    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(
            value
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }


    /* =====================================================
       START
    ===================================================== */

    loadPatient();

});
