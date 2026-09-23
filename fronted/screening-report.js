const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "https://retinaai-backend-5h1p.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       AUTH
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
        user = JSON.parse(storedUser);
    } catch (error) {

        localStorage.removeItem(
            "retinaai_logged_in"
        );

        localStorage.removeItem(
            "retinaai_user"
        );

        window.location.href = "login.html";
        return;
    }


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const screeningId =
        params.get("id");

    const sidebar =
        document.getElementById("sidebar");

    const menuButton =
        document.getElementById("menuButton");

    const logoutButton =
        document.getElementById("logoutButton");

    const profileButton =
        document.getElementById("profileButton");

    const adminName =
        document.getElementById("adminName");

    const patientBreadcrumb =
        document.getElementById(
            "patientBreadcrumb"
        );

    const pageLoading =
        document.getElementById("pageLoading");

    const pageError =
        document.getElementById("pageError");

    const errorMessage =
        document.getElementById("errorMessage");

    const reportContent =
        document.getElementById("reportContent");

    const patientName =
        document.getElementById("patientName");

    const patientId =
        document.getElementById("patientId");

    const patientAge =
        document.getElementById("patientAge");

    const patientGender =
        document.getElementById("patientGender");

    const patientPhone =
        document.getElementById("patientPhone");

    const screeningDate =
        document.getElementById("screeningDate");

    const diagnosis =
        document.getElementById("diagnosis");

    const grade =
        document.getElementById("grade");

    const confidence =
        document.getElementById("confidence");

    const referableProbability =
        document.getElementById(
            "referableProbability"
        );

    const resultBadge =
        document.getElementById(
            "resultBadge"
        );

    const referralTitle =
        document.getElementById(
            "referralTitle"
        );

    const referralText =
        document.getElementById(
            "referralText"
        );

    const originalImage =
        document.getElementById(
            "originalImage"
        );

    const gradcamImage =
        document.getElementById(
            "gradcamImage"
        );

    const originalImageEmpty =
        document.getElementById(
            "originalImageEmpty"
        );

    const gradcamImageEmpty =
        document.getElementById(
            "gradcamImageEmpty"
        );

    const printButton =
        document.getElementById(
            "printButton"
        );

    const newScanButton =
        document.getElementById(
            "newScanButton"
        );

    const backToPatientButton =
        document.getElementById(
            "backToPatientButton"
        );


    /* =====================================================
       BASIC UI
    ===================================================== */

    if (adminName) {
        adminName.textContent =
            user.name || "Admin";
    }

    if (menuButton && sidebar) {

        menuButton.addEventListener(
            "click",
            () => {
                sidebar.classList.toggle(
                    "open"
                );
            }
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

    if (printButton) {

        printButton.addEventListener(
            "click",
            () => {
                window.print();
            }
        );
    }


    /* =====================================================
       VALIDATE SCREENING ID
    ===================================================== */

    if (!screeningId) {

        showError(
            "No screening ID was provided."
        );

        return;
    }


    /* =====================================================
       LOAD REPORT
    ===================================================== */

    async function loadReport() {

        showLoading();

        try {

            const response =
                await fetch(
                    `${API_URL}/screening/${encodeURIComponent(screeningId)}`
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to load screening report."
                );
            }

            const screening =
                data.screening;

            await renderReport(
                screening
            );

            hideLoading();

        } catch (error) {

            console.error(
                "Report error:",
                error
            );

            showError(
                error.message ||
                "Unable to connect to RetinaAI server."
            );
        }
    }


    /* =====================================================
       RENDER REPORT
    ===================================================== */

    async function renderReport(
        screening
    ) {

        const currentPatientId =
            screening.patient_id;

        if (patientId) {
            patientId.textContent =
                currentPatientId || "—";
        }

        if (screeningDate) {

            screeningDate.textContent =
                formatDateTime(
                    screening.created_at
                );
        }

        if (diagnosis) {

            diagnosis.textContent =
                screening.diagnosis ||
                "Unknown Result";
        }

        if (grade) {

            grade.textContent =
                screening.grade !== null &&
                screening.grade !== undefined
                    ? `Grade ${screening.grade}`
                    : "—";
        }

        if (confidence) {

            confidence.textContent =
                `${Math.round(
                    Number(
                        screening.confidence || 0
                    ) * 100
                )}%`;
        }

        if (referableProbability) {

            referableProbability.textContent =
                `${Math.round(
                    Number(
                        screening.referable_probability ||
                        0
                    ) * 100
                )}%`;
        }

        const referable =
            Number(
                screening.referable
            ) === 1;


        /* RESULT BADGE */

        if (resultBadge) {

            resultBadge.textContent =
                referable
                    ? "REFERRAL RECOMMENDED"
                    : "NON-REFERABLE";
        }


        /* REFERRAL */

        if (referralTitle) {

            referralTitle.textContent =
                referable
                    ? "Specialist review recommended"
                    : "No referral flag from AI screening";
        }

        if (referralText) {

            referralText.textContent =
                referable
                    ? "The screening crossed the configured referable-risk threshold. Clinical review is recommended."
                    : "The screening did not cross the configured referable-risk threshold.";
        }


        /* PATIENT */

        try {

            const patientResponse =
                await fetch(
                    `${API_URL}/patients/${encodeURIComponent(currentPatientId)}`
                );

            const patientData =
                await patientResponse.json();

            if (
                patientResponse.ok &&
                patientData.success
            ) {

                const patient =
                    patientData.patient;

                const name =
                    patient.name ||
                    "Unknown Patient";

                if (patientName) {
                    patientName.textContent =
                        name;
                }

                if (patientBreadcrumb) {
                    patientBreadcrumb.textContent =
                        name;
                    patientBreadcrumb.href =
                        `patient-profile.html?id=${encodeURIComponent(currentPatientId)}`;
                }

                if (patientAge) {
                    patientAge.textContent =
                        patient.age ??
                        "—";
                }

                if (patientGender) {
                    patientGender.textContent =
                        patient.gender ||
                        "—";
                }

                if (patientPhone) {
                    patientPhone.textContent =
                        patient.phone ||
                        "—";
                }

                document.title =
                    `${name} — Screening Report | RetinaAI`;
            }

        } catch (error) {

            console.warn(
                "Unable to load patient details:",
                error
            );
        }


        /* IMAGES */

        await loadImages(
            screening
        );
    }


    /* =====================================================
       LOAD SCREENING IMAGES
    ===================================================== */

    async function loadImages(
        screening
    ) {

        const imagePath =
            screening.image_path;

        const gradcamPath =
            screening.gradcam_path;

        if (
            imagePath &&
            originalImage
        ) {

            originalImage.src =
                buildImageUrl(
                    imagePath
                );

            originalImage.style.display =
                "block";

            if (originalImageEmpty) {
                originalImageEmpty.style.display =
                    "none";
            }

        } else {

            if (originalImage) {
                originalImage.style.display =
                    "none";
            }

            if (originalImageEmpty) {
                originalImageEmpty.style.display =
                    "block";
            }
        }


        if (
            gradcamPath &&
            gradcamImage
        ) {

            gradcamImage.src =
                buildImageUrl(
                    gradcamPath
                );

            gradcamImage.style.display =
                "block";

            if (gradcamImageEmpty) {
                gradcamImageEmpty.style.display =
                    "none";
            }

        } else {

            if (gradcamImage) {
                gradcamImage.style.display =
                    "none";
            }

            if (gradcamImageEmpty) {
                gradcamImageEmpty.style.display =
                    "block";
            }
        }
    }


    function buildImageUrl(
        imagePath
    ) {

        if (
            !imagePath
        ) {
            return "";
        }

        if (
            imagePath.startsWith(
                "http://"
            ) ||
            imagePath.startsWith(
                "https://"
            ) ||
            imagePath.startsWith(
                "data:"
            )
        ) {
            return imagePath;
        }

        if (
            imagePath.startsWith("/")
        ) {
            return `${API_URL}${imagePath}`;
        }

        return `${API_URL}/${imagePath}`;
    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    if (newScanButton) {

        newScanButton.addEventListener(
            "click",
            () => {

                const id =
                    patientId
                        ? patientId.textContent
                        : "";

                if (!id || id === "—") {
                    window.location.href =
                        "index.html";
                    return;
                }

                window.location.href =
                    `index.html?patient=${encodeURIComponent(id)}`;
            }
        );
    }

    if (backToPatientButton) {

        backToPatientButton.addEventListener(
            "click",
            () => {

                const id =
                    patientId
                        ? patientId.textContent
                        : "";

                if (
                    id &&
                    id !== "—"
                ) {

                    window.location.href =
                        `patient-profile.html?id=${encodeURIComponent(id)}`;

                } else {

                    window.location.href =
                        "patients.html";
                }
            }
        );
    }


    /* =====================================================
       STATES
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

        if (reportContent) {
            reportContent.style.display =
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

        if (reportContent) {
            reportContent.style.display =
                "block";
        }
    }

    function showError(
        message
    ) {

        if (pageLoading) {
            pageLoading.style.display =
                "none";
        }

        if (reportContent) {
            reportContent.style.display =
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
       DATE
    ===================================================== */

    function normalizeDate(
        value
    ) {

        if (!value) {
            return "";
        }

        return String(value).replace(
            " ",
            "T"
        );
    }

    function formatDateTime(
        value
    ) {

        if (!value) {
            return "—";
        }

        const date =
            new Date(
                normalizeDate(value)
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
       START
    ===================================================== */

    loadReport();

});
