const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "https://retinaai-backend-5h1p.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // AUTH CHECK
    // =====================================================

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


    // =====================================================
    // ELEMENTS
    // =====================================================

    const sidebar =
        document.getElementById("sidebar");

    const menuButton =
        document.getElementById("menuButton");

    const adminName =
        document.getElementById("adminName");

    const profileButton =
        document.getElementById("profileButton");

    const logoutButton =
        document.getElementById("logoutButton");


    const addPatientButton =
        document.getElementById("addPatientButton");

    const emptyAddButton =
        document.getElementById("emptyAddButton");

    const patientModal =
        document.getElementById("patientModal");

    const closeModal =
        document.getElementById("closeModal");

    const cancelButton =
        document.getElementById("cancelButton");

    const patientForm =
        document.getElementById("patientForm");


    const patientName =
        document.getElementById("patientName");

    const patientAge =
        document.getElementById("patientAge");

    const patientGender =
        document.getElementById("patientGender");

    const patientPhone =
        document.getElementById("patientPhone");


    const savePatientButton =
        document.getElementById("savePatientButton");

    const saveButtonText =
        document.getElementById("saveButtonText");

    const saveSpinner =
        document.getElementById("saveSpinner");

    const formError =
        document.getElementById("formError");


    const loadingState =
        document.getElementById("loadingState");

    const emptyState =
        document.getElementById("emptyState");

    const tableWrapper =
        document.getElementById("tableWrapper");

    const patientsTableBody =
        document.getElementById("patientsTableBody");

    const searchInput =
        document.getElementById("searchInput");


    const totalPatients =
        document.getElementById("totalPatients");

    const totalScreenings =
        document.getElementById("totalScreenings");

    const totalReferrals =
        document.getElementById("totalReferrals");


    // =====================================================
    // ADMIN NAME
    // =====================================================

    if (adminName) {

        adminName.textContent =
            user.name || "Admin";
    }


    // =====================================================
    // SIDEBAR MOBILE
    // =====================================================

    if (
        menuButton &&
        sidebar
    ) {

        menuButton.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle("open");

            }
        );
    }


    // =====================================================
    // LOGOUT
    // =====================================================

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


    // =====================================================
    // PROFILE
    // =====================================================

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


    // =====================================================
    // MODAL
    // =====================================================

    function openModal() {

        patientModal.classList.add("show");

        formError.classList.remove("show");

        patientForm.reset();

        setTimeout(() => {

            patientName.focus();

        }, 100);
    }


    function closePatientModal() {

        patientModal.classList.remove("show");

        formError.classList.remove("show");

        patientForm.reset();
    }


    if (addPatientButton) {

        addPatientButton.addEventListener(
            "click",
            openModal
        );
    }


    if (emptyAddButton) {

        emptyAddButton.addEventListener(
            "click",
            openModal
        );
    }


    if (closeModal) {

        closeModal.addEventListener(
            "click",
            closePatientModal
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closePatientModal
        );
    }


    // Close modal when clicking outside
    if (patientModal) {

        patientModal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === patientModal
                ) {

                    closePatientModal();

                }

            }
        );
    }


    // =====================================================
    // LOAD PATIENTS
    // =====================================================

    let allPatients = [];


    async function loadPatients() {

        showLoading();

        try {

            const response =
                await fetch(
                    `${API_URL}/patients`
                );

            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to load patients"
                );
            }


            allPatients =
                data.patients || [];


            renderPatients(
                allPatients
            );


            await loadDashboardStats();


        } catch (error) {

            console.error(
                "Load patients error:",
                error
            );

            hideLoading();

            showErrorMessage(
                "Unable to connect to RetinaAI server. Make sure the backend is running."
            );

        }
    }


    // =====================================================
    // RENDER PATIENTS
    // =====================================================

    function renderPatients(patients) {

        hideLoading();


        if (!patients || patients.length === 0) {

            tableWrapper.style.display =
                "none";

            emptyState.style.display =
                "flex";

            return;
        }


        emptyState.style.display =
            "none";

        tableWrapper.style.display =
            "block";


        patientsTableBody.innerHTML = "";


        patients.forEach(
            (patient) => {

                const row =
                    document.createElement("tr");


                const firstLetter =
                    patient.name
                        ? patient.name
                            .charAt(0)
                            .toUpperCase()
                        : "P";


                const registeredDate =
                    formatDate(
                        patient.created_at
                    );


                row.innerHTML = `

                    <td>

                        <div class="patient-cell">

                            <div class="patient-avatar">
                                ${escapeHtml(firstLetter)}
                            </div>

                            <div class="patient-name">

                                <strong>
                                    ${escapeHtml(patient.name || "Unknown")}
                                </strong>

                                <span>
                                    ${escapeHtml(patient.phone || "No phone")}
                                </span>

                            </div>

                        </div>

                    </td>


                    <td>

                        <span class="patient-id">
                            ${escapeHtml(patient.patient_id)}
                        </span>

                    </td>


                    <td>
                        ${patient.age || "—"}
                    </td>


                    <td>
                        ${escapeHtml(patient.gender || "—")}
                    </td>


                    <td>
                        ${patient.total_scans || 0}
                    </td>


                    <td>
                        ${registeredDate}
                    </td>


                    <td>

                        <button
                            class="view-button"
                            data-patient-id="${escapeHtml(patient.patient_id)}"
                        >
                            View
                        </button>

                    </td>

                `;


                patientsTableBody.appendChild(
                    row
                );
            }
        );


        // Attach view buttons

        const viewButtons =
            document.querySelectorAll(
                ".view-button"
            );


        viewButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const patientId =
                            button.dataset.patientId;

                        openPatient(
                            patientId
                        );

                    }
                );

            }
        );
    }


    // =====================================================
    // OPEN PATIENT
    // =====================================================

    function openPatient(patientId) {
    window.location.href =
        `patient-profile.html?id=${encodeURIComponent(patientId)}`;
}


    // =====================================================
    // SEARCH
    // =====================================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                const query =
                    searchInput.value
                        .trim()
                        .toLowerCase();


                if (!query) {

                    renderPatients(
                        allPatients
                    );

                    return;
                }


                const filtered =
                    allPatients.filter(
                        (patient) => {

                            const name =
                                (
                                    patient.name ||
                                    ""
                                ).toLowerCase();

                            const id =
                                (
                                    patient.patient_id ||
                                    ""
                                ).toLowerCase();

                            const phone =
                                (
                                    patient.phone ||
                                    ""
                                ).toLowerCase();


                            return (
                                name.includes(query) ||
                                id.includes(query) ||
                                phone.includes(query)
                            );
                        }
                    );


                renderPatients(
                    filtered
                );
            }
        );
    }


    // =====================================================
    // ADD PATIENT
    // =====================================================

    if (patientForm) {

        patientForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                formError.classList.remove(
                    "show"
                );


                const name =
                    patientName.value.trim();

                const age =
                    patientAge.value
                        ? Number(
                            patientAge.value
                        )
                        : null;

                const gender =
                    patientGender.value;

                const phone =
                    patientPhone.value.trim();


                if (!name) {

                    showFormError(
                        "Please enter the patient's name."
                    );

                    patientName.focus();

                    return;
                }


                if (
                    age !== null &&
                    (
                        age < 1 ||
                        age > 120
                    )
                ) {

                    showFormError(
                        "Please enter a valid age between 1 and 120."
                    );

                    patientAge.focus();

                    return;
                }


                setSaveLoading(true);


                try {

                    const response =
                        await fetch(
                            `${API_URL}/patients`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        name,
                                        age,
                                        gender,
                                        phone
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to create patient"
                        );
                    }


                    closePatientModal();


                    await loadPatients();


                    alert(
                        `Patient created successfully!\n\nPatient ID: ${data.patient.patient_id}`
                    );


                } catch (error) {

                    console.error(
                        "Create patient error:",
                        error
                    );

                    showFormError(
                        error.message ||
                        "Unable to create patient."
                    );

                } finally {

                    setSaveLoading(false);

                }

            }
        );
    }


    // =====================================================
    // DASHBOARD STATS
    // =====================================================

    async function loadDashboardStats() {

        try {

            const response =
                await fetch(
                    `${API_URL}/dashboard/stats`
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                return;
            }


            const stats =
                data.stats;


            if (totalPatients) {

                totalPatients.textContent =
                    stats.total_patients || 0;
            }


            if (totalScreenings) {

                totalScreenings.textContent =
                    stats.total_scans || 0;
            }


            if (totalReferrals) {

                totalReferrals.textContent =
                    stats.total_referrals || 0;
            }


        } catch (error) {

            console.error(
                "Stats error:",
                error
            );
        }
    }


    // =====================================================
    // LOADING STATE
    // =====================================================

    function showLoading() {

        loadingState.style.display =
            "flex";

        emptyState.style.display =
            "none";

        tableWrapper.style.display =
            "none";
    }


    function hideLoading() {

        loadingState.style.display =
            "none";
    }


    // =====================================================
    // SAVE BUTTON LOADING
    // =====================================================

    function setSaveLoading(isLoading) {

        savePatientButton.disabled =
            isLoading;


        if (isLoading) {

            saveButtonText.textContent =
                "Saving...";

            saveSpinner.style.display =
                "inline-block";

        } else {

            saveButtonText.textContent =
                "Save Patient";

            saveSpinner.style.display =
                "none";
        }
    }


    // =====================================================
    // FORM ERROR
    // =====================================================

    function showFormError(message) {

        formError.textContent =
            message;

        formError.classList.add(
            "show"
        );
    }


    // =====================================================
    // SERVER ERROR
    // =====================================================

    function showErrorMessage(message) {

        patientsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:50px;
                        color:#fb9aaa;
                    "
                >
                    ${escapeHtml(message)}
                </td>

            </tr>

        `;

        tableWrapper.style.display =
            "block";

        emptyState.style.display =
            "none";
    }


    // =====================================================
    // DATE FORMAT
    // =====================================================

    function formatDate(dateString) {

        if (!dateString) {
            return "—";
        }


        const date =
            new Date(
                dateString.replace(
                    " ",
                    "T"
                )
            );


        if (Number.isNaN(date.getTime())) {
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
    // HTML ESCAPE
    // =====================================================

    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    // =====================================================
    // PLACEHOLDER NAVIGATION
    // =====================================================

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


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    loadPatients();

});
