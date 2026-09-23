// =====================================================
// RETINAAI — FRONTEND SCRIPT
// =====================================================


// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "https://retinaai-backend-5h1p.onrender.com";

const API_URL =
    `${API_BASE_URL}/predict`;

const GRADCAM_API_URL =
    `${API_BASE_URL}/gradcam`;

const SCREENINGS_API_URL =
    `${API_BASE_URL}/screenings`;

const REQUEST_TIMEOUT_MS = 120000;

async function fetchWithTimeout(url, options = {}) {

    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
    );

    try {
        return await fetch(
            url,
            {
                ...options,
                signal: controller.signal
            }
        );
    } finally {
        clearTimeout(timeout);
    }
}


// =====================================================
// PATIENT CONTEXT
// =====================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const currentPatientId =
    urlParams.get("patient");

const patientContext =
    document.getElementById(
        "patientContext"
    );

const patientContextName =
    document.getElementById(
        "patientContextName"
    );

const patientContextId =
    document.getElementById(
        "patientContextId"
    );


// =====================================================
// GET ELEMENTS
// =====================================================

const patientName =
    document.getElementById(
        "patientName"
    );

const patientId =
    document.getElementById(
        "patientId"
    );

const imageInput =
    document.getElementById(
        "imageInput"
    );

const browseButton =
    document.getElementById(
        "browseButton"
    );

const changeImageButton =
    document.getElementById(
        "changeImageButton"
    );

const dropZone =
    document.getElementById(
        "dropZone"
    );

const uploadContent =
    document.getElementById(
        "uploadContent"
    );

const previewWrapper =
    document.getElementById(
        "previewWrapper"
    );

const preview =
    document.getElementById(
        "preview"
    );

const analyseButton =
    document.getElementById(
        "analyseButton"
    );

const loading =
    document.getElementById(
        "loading"
    );

const emptyResult =
    document.getElementById(
        "emptyResult"
    );

const resultCard =
    document.getElementById(
        "resultCard"
    );

const resultPatient =
    document.getElementById(
        "resultPatient"
    );

const resultPatientId =
    document.getElementById(
        "resultPatientId"
    );

const resultGrade =
    document.getElementById(
        "resultGrade"
    );

const resultDiagnosis =
    document.getElementById(
        "resultDiagnosis"
    );

const resultConfidence =
    document.getElementById(
        "resultConfidence"
    );

const resultRisk =
    document.getElementById(
        "resultRisk"
    );

const resultDecision =
    document.getElementById(
        "resultDecision"
    );

const diagnosisBanner =
    document.getElementById(
        "diagnosisBanner"
    );

const confidenceBar =
    document.getElementById(
        "confidenceBar"
    );

const riskBar =
    document.getElementById(
        "riskBar"
    );

const downloadReport =
    document.getElementById(
        "downloadReport"
    );

const newAnalysisButton =
    document.getElementById(
        "newAnalysisButton"
    );

const historyList =
    document.getElementById(
        "historyList"
    );

const clearHistoryButton =
    document.getElementById(
        "clearHistoryButton"
    );

const enhanceButton =
    document.getElementById(
        "enhanceButton"
    );

const comparisonSection =
    document.getElementById(
        "comparisonSection"
    );

const comparisonOriginal =
    document.getElementById(
        "comparisonOriginal"
    );

const enhancedPreview =
    document.getElementById(
        "enhancedPreview"
    );

const analyseEnhancedButton =
    document.getElementById(
        "analyseEnhancedButton"
    );


// =====================================================
// GRAD-CAM ELEMENTS
// =====================================================

const explanationSection =
    document.getElementById(
        "explanationSection"
    );

const gradcamOriginal =
    document.getElementById(
        "gradcamOriginal"
    );

const gradcamImage =
    document.getElementById(
        "gradcamImage"
    );


// =====================================================
// STATE
// =====================================================

let currentResult = null;

let enhancedImageFile = null;

let screeningSaved = false;


// =====================================================
// INITIALIZATION
// =====================================================

console.log(
    "===================================="
);

console.log(
    "RetinaAI frontend loaded"
);

console.log(
    "Prediction API:",
    API_URL
);

console.log(
    "Grad-CAM API:",
    GRADCAM_API_URL
);

console.log(
    "Current Patient:",
    currentPatientId || "None"
);

console.log(
    "===================================="
);


// =====================================================
// LOAD PATIENT CONTEXT
// =====================================================

async function loadPatientContext() {

    if (!currentPatientId) {

        return;

    }


    try {

        const response =
            await fetchWithTimeout(
                `${API_BASE_URL}/patients/${encodeURIComponent(currentPatientId)}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.patient
        ) {

            console.error(
                "Unable to load patient."
            );

            return;

        }


        const patient =
            data.patient;


        // -------------------------------------------------
        // SHOW PATIENT BANNER
        // -------------------------------------------------

        if (patientContext) {

            patientContext.style.display =
                "block";

        }


        if (patientContextName) {

            patientContextName.textContent =
                patient.name;

        }


        if (patientContextId) {

            patientContextId.textContent =
                patient.patient_id;

        }


        // -------------------------------------------------
        // AUTO-FILL SCANNER PATIENT FIELDS
        // -------------------------------------------------

        if (patientName) {

            patientName.value =
                patient.name;

        }


        if (patientId) {

            patientId.value =
                patient.patient_id;

        }


        console.log(
            "Patient loaded:",
            patient.name,
            patient.patient_id
        );

    }

    catch (error) {

        console.error(
            "Patient context error:",
            error
        );

    }

}


// =====================================================
// INITIAL PATIENT LOAD
// =====================================================

loadPatientContext();


// =====================================================
// ELEMENT CHECK
// =====================================================

if (!imageInput) {

    console.error(
        "ERROR: imageInput not found"
    );

}

if (!browseButton) {

    console.error(
        "ERROR: browseButton not found"
    );

}

if (!analyseButton) {

    console.error(
        "ERROR: analyseButton not found"
    );

}

if (!explanationSection) {

    console.warn(
        "WARNING: explanationSection not found"
    );

}


// =====================================================
// BROWSE BUTTON
// =====================================================

if (browseButton) {

    browseButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            imageInput.click();

        }
    );

}


// =====================================================
// CHANGE IMAGE BUTTON
// =====================================================

if (changeImageButton) {

    changeImageButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            imageInput.click();

        }
    );

}


// =====================================================
// UPLOAD AREA CLICK
// =====================================================

if (dropZone) {

    dropZone.addEventListener(
        "click",
        function (event) {

            if (
                event.target === browseButton ||
                event.target.closest(
                    "#browseButton"
                )
            ) {

                return;

            }


            if (
                event.target === changeImageButton ||
                event.target.closest(
                    "#changeImageButton"
                )
            ) {

                return;

            }


            imageInput.click();

        }
    );

}


// =====================================================
// FILE INPUT
// =====================================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function () {

            const file =
                imageInput.files[0];


            if (!file) {

                return;

            }


            handleImage(file);

        }
    );

}


// =====================================================
// HANDLE IMAGE
// =====================================================

function handleImage(file) {

    const validTypes = [

        "image/jpeg",

        "image/png",

        "image/jpg"

    ];


    if (
        !validTypes.includes(
            file.type
        )
    ) {

        alert(
            "Please upload a JPG or PNG image."
        );


        imageInput.value =
            "";


        return;

    }


    const maxSize =
        15 * 1024 * 1024;


    if (
        file.size > maxSize
    ) {

        alert(
            "Image is too large. Maximum size is 15 MB."
        );


        imageInput.value =
            "";


        return;

    }


    enhancedImageFile =
        null;


    screeningSaved =
        false;


    resetExplanation();


    if (comparisonSection) {

        comparisonSection.style.display =
            "none";

    }


    const imageURL =
        URL.createObjectURL(
            file
        );


    preview.src =
        imageURL;


    preview.onload =
        function () {

            URL.revokeObjectURL(
                imageURL
            );

        };


    uploadContent.style.display =
        "none";


    previewWrapper.style.display =
        "block";


    emptyResult.style.display =
        "flex";


    resultCard.style.display =
        "none";

}


// =====================================================
// ENHANCE BUTTON
// =====================================================

if (enhanceButton) {

    enhanceButton.addEventListener(
        "click",
        enhanceImage
    );

}


// =====================================================
// ENHANCED ANALYSE BUTTON
// =====================================================

if (analyseEnhancedButton) {

    analyseEnhancedButton.addEventListener(
        "click",
        analyseImage
    );

}


// =====================================================
// ENHANCE IMAGE
// =====================================================

async function enhanceImage() {

    const file =
        imageInput.files[0];


    if (!file) {

        alert(
            "Please upload a fundus image first."
        );

        return;

    }


    enhanceButton.disabled =
        true;


    enhanceButton.innerHTML =
        "Enhancing...";


    try {

        const imageURL =
            URL.createObjectURL(
                file
            );


        const image =
            new Image();


        image.src =
            imageURL;


        await new Promise(
            function (resolve, reject) {

                image.onload =
                    resolve;

                image.onerror =
                    reject;

            }
        );


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            image.naturalWidth;


        canvas.height =
            image.naturalHeight;


        const context =
            canvas.getContext(
                "2d"
            );


        if (!context) {

            throw new Error(
                "Canvas processing is unavailable."
            );

        }


        context.filter =
            "contrast(1.18) saturate(1.12) brightness(1.04)";


        context.drawImage(
            image,
            0,
            0
        );


        URL.revokeObjectURL(
            imageURL
        );


        const enhancedBlob =
            await new Promise(
                function (resolve) {

                    canvas.toBlob(
                        resolve,
                        "image/jpeg",
                        0.94
                    );

                }
            );


        if (!enhancedBlob) {

            throw new Error(
                "Enhanced image could not be created."
            );

        }


        enhancedImageFile =
            new File(
                [
                    enhancedBlob
                ],
                file.name.replace(
                    /\.[^.]+$/,
                    ""
                ) + "_enhanced.jpg",
                {
                    type: "image/jpeg"
                }
            );


        const originalURL =
            URL.createObjectURL(
                file
            );


        const enhancedURL =
            URL.createObjectURL(
                enhancedImageFile
            );


        comparisonOriginal.src =
            originalURL;


        comparisonOriginal.onload =
            function () {

                URL.revokeObjectURL(
                    originalURL
                );

            };


        enhancedPreview.src =
            enhancedURL;


        comparisonSection.style.display =
            "block";


        comparisonSection.scrollIntoView(
            {
                behavior: "smooth",
                block: "center"
            }
        );

    }

    catch (error) {

        console.error(
            "Enhancement error:",
            error
        );


        alert(
            "Could not enhance this image. Please try another image."
        );

    }

    finally {

        enhanceButton.disabled =
            false;


        enhanceButton.innerHTML =
            "<span>✦</span> Enhance Image";

    }

}


// =====================================================
// DRAG & DROP
// =====================================================

if (dropZone) {

    dropZone.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();


            dropZone.classList.add(
                "dragover"
            );

        }
    );


    dropZone.addEventListener(
        "dragleave",
        function () {

            dropZone.classList.remove(
                "dragover"
            );

        }
    );


    dropZone.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();


            dropZone.classList.remove(
                "dragover"
            );


            const file =
                event.dataTransfer.files[0];


            if (!file) {

                return;

            }


            try {

                const dataTransfer =
                    new DataTransfer();


                dataTransfer.items.add(
                    file
                );


                imageInput.files =
                    dataTransfer.files;

            }

            catch (error) {

                console.warn(
                    "Could not set file input:",
                    error
                );

            }


            handleImage(file);

        }
    );

}


// =====================================================
// ANALYSE BUTTON
// =====================================================

if (analyseButton) {

    analyseButton.addEventListener(
        "click",
        analyseImage
    );

}


// =====================================================
// ANALYSE IMAGE
// =====================================================

async function analyseImage() {

    console.log(
        "===================================="
    );


    console.log(
        "Analyse started"
    );


    // -------------------------------------------------
    // PATIENT
    // -------------------------------------------------

    const name =
        patientName.value.trim();


    const id =
        patientId.value.trim();


    // -------------------------------------------------
    // IMAGE
    // -------------------------------------------------

    const file =
        enhancedImageFile ||
        imageInput.files[0];


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!name) {

        alert(
            "Please enter patient name."
        );


        patientName.focus();


        return;

    }


    if (!file) {

        alert(
            "Please upload a fundus image."
        );


        return;

    }


    // -------------------------------------------------
    // UI STATE
    // -------------------------------------------------

    analyseButton.disabled =
        true;


    if (analyseEnhancedButton) {

        analyseEnhancedButton.disabled =
            true;

    }


    loading.style.display =
        "flex";


    emptyResult.style.display =
        "none";


    resultCard.style.display =
        "none";


    resetExplanation();


    screeningSaved =
        false;


    // -------------------------------------------------
    // PREDICTION FORM
    // -------------------------------------------------

    const formData =
        new FormData();


    formData.append(
        "image",
        file
    );


    try {

        // =================================================
        // STEP 1 — PREDICTION
        // =================================================

        console.log(
            "Sending image to prediction API..."
        );


        const response =
            await fetchWithTimeout(
                API_URL,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        console.log(
            "Prediction response:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                data.message ||
                "Prediction failed."
            );

        }


        // =================================================
        // CREATE RESULT
        // =================================================

        currentResult = {

            patientName:
                name,

            patientId:
                id || "N/A",

            grade:
                Number(
                    data.grade
                ),

            diagnosis:
                data.diagnosis,

            confidence:
                Number(
                    data.confidence
                ) * 100,

            referableProbability:
                Number(
                    data.referable_probability
                ) * 100,

            referable:
                Boolean(
                    data.referable
                ),

            date:
                new Date()
                    .toLocaleDateString(),

            time:
                new Date()
                    .toLocaleTimeString(),

            // -------------------------------------------------
            // PERSISTENCE PATHS
            // -------------------------------------------------

            imagePath:
                "",

            gradcamPath:
                ""

        };


        // =================================================
        // DISPLAY RESULT
        // =================================================

        displayResult(
            currentResult
        );


        // =================================================
        // SAVE LOCAL HISTORY
        // =================================================

        saveHistory(
            currentResult
        );


        // =================================================
        // STEP 2 — GRAD-CAM + PERSISTENCE
        // =================================================

        console.log(
            "Generating Grad-CAM and saving images..."
        );


        const gradcamFormData =
            new FormData();


        gradcamFormData.append(
            "image",
            file
        );


        // -------------------------------------------------
        // SEND PATIENT ID
        // -------------------------------------------------

        if (
            currentPatientId
        ) {

            gradcamFormData.append(
                "patient_id",
                currentPatientId
            );

        }

        else if (
            id
        ) {

            gradcamFormData.append(
                "patient_id",
                id
            );

        }


        try {
            const gradcamResponse =
                await fetchWithTimeout(
                    GRADCAM_API_URL,
                    {
                        method: "POST",
                        body: gradcamFormData
                    }
                );

            if (gradcamResponse.ok) {
                const gradcamData =
                    await gradcamResponse.json();

                console.log(
                    "Grad-CAM response:",
                    gradcamData
                );

                if (gradcamData.success) {
                    currentResult.imagePath =
                        gradcamData.image_path ||
                        "";

                    currentResult.gradcamPath =
                        gradcamData.gradcam_path ||
                        "";

                    displayGradCAM(
                        gradcamData
                    );

                    console.log(
                        "✅ Images persisted:",
                        currentResult.imagePath,
                        currentResult.gradcamPath
                    );
                } else {
                    console.warn(
                        "Grad-CAM generation failed:",
                        gradcamData.error ||
                        gradcamData.message
                    );
                    hideGradCAM();
                }
            } else {
                console.warn(
                    "Grad-CAM request returned non-OK status:",
                    gradcamResponse.status
                );
                hideGradCAM();
            }
        } catch (gradcamError) {
            console.warn(
                "Grad-CAM generation skipped or timed out:",
                gradcamError
            );
            hideGradCAM();
        }


        // =================================================
        // UPDATE LOCAL HISTORY WITH PATHS
        // =================================================

        updateLatestHistoryResult(
            currentResult
        );


        // =================================================
        // STEP 3 — SAVE TO DATABASE
        // =================================================

        try {
            await saveScreeningToDatabase(
                currentResult
            );
        } catch (saveError) {
            console.warn(
                "Screening persistence skipped:",
                saveError
            );
        }


        // =================================================
        // FINISH
        // =================================================

        loading.style.display =
            "none";


        analyseButton.disabled =
            false;


        if (analyseEnhancedButton) {

            analyseEnhancedButton.disabled =
                false;

        }


        resultCard.style.display =
            "block";


        resultCard.scrollIntoView(
            {
                behavior: "smooth",
                block: "start"
            }
        );


        console.log(
            "Analysis completed successfully"
        );


        console.log(
            "===================================="
        );

    }

    catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        loading.style.display =
            "none";


        analyseButton.disabled =
            false;


        if (analyseEnhancedButton) {

            analyseEnhancedButton.disabled =
                false;

        }


        emptyResult.style.display =
            "flex";


        alert(
            "Could not complete RetinaAI analysis.\n\n" +
            error.message +
            "\n\n" +
            "Make sure the backend is running:\n" +
            "python backend/app.py"
        );

    }

}


// =====================================================
// SAVE SCREENING TO DATABASE
// =====================================================

async function saveScreeningToDatabase(
    result
) {

    // -------------------------------------------------
    // ONLY SAVE WHEN PATIENT EXISTS
    // -------------------------------------------------

    if (
        !currentPatientId &&
        (!result.patientId ||
            result.patientId === "N/A")
    ) {

        console.log(
            "No database patient selected. " +
            "Skipping database save."
        );


        return;

    }


    if (screeningSaved) {

        console.log(
            "Screening already saved."
        );


        return;

    }


    const databasePatientId =
        currentPatientId ||
        result.patientId;


    try {

        const response =
            await fetchWithTimeout(
                SCREENINGS_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        patient_id:
                            databasePatientId,

                        // -------------------------------------------------
                        // PERSISTENT IMAGE PATH
                        // -------------------------------------------------

                        image_path:
                            result.imagePath ||
                            "",

                        grade:
                            result.grade,

                        diagnosis:
                            result.diagnosis,

                        confidence:
                            result.confidence,

                        referable_probability:
                            result.referableProbability,

                        referable:
                            result.referable
                                ? 1
                                : 0,

                        // -------------------------------------------------
                        // PERSISTENT GRAD-CAM PATH
                        // -------------------------------------------------

                        gradcam_path:
                            result.gradcamPath ||
                            ""

                    })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            console.error(
                "Database screening save failed:",
                data.message ||
                data.error
            );


            return;

        }


        screeningSaved =
            true;


        // -------------------------------------------------
        // STORE SCREENING ID
        // -------------------------------------------------

        if (
            data.screening &&
            data.screening.id
        ) {

            currentResult.screeningId =
                data.screening.id;

        }


        console.log(
            "✅ Screening saved to database."
        );


        console.log(
            "Screening ID:",
            data.screening
                ? data.screening.id
                : "N/A"
        );


        console.log(
            "Image path:",
            data.screening
                ? data.screening.image_path
                : result.imagePath
        );


        console.log(
            "Grad-CAM path:",
            data.screening
                ? data.screening.gradcam_path
                : result.gradcamPath
        );

    }

    catch (error) {

        console.error(
            "Screening database error:",
            error
        );

    }

}


// =====================================================
// UPDATE LATEST LOCAL HISTORY RESULT
// =====================================================

function updateLatestHistoryResult(
    result
) {

    try {

        const history =
            getHistory();


        if (
            !history ||
            history.length === 0
        ) {

            return;

        }


        // The latest analysis is the first item.
        history[0] = {
            ...history[0],
            ...result
        };


        localStorage.setItem(
            "retinaAI_history",
            JSON.stringify(
                history.slice(
                    0,
                    10
                )
            )
        );


        renderHistory();

    }

    catch (error) {

        console.error(
            "Could not update local history:",
            error
        );

    }

}


// =====================================================
// DISPLAY RESULT
// =====================================================

function displayResult(
    result
) {

    resultPatient.textContent =
        result.patientName;


    resultPatientId.textContent =
        result.patientId;


    resultGrade.textContent =
        "Grade " +
        result.grade;


    resultDiagnosis.textContent =
        result.diagnosis;


    resultConfidence.textContent =
        result.confidence +
        "%";


    resultRisk.textContent =
        result.referableProbability +
        "%";


    // -------------------------------------------------
    // PROGRESS BARS
    // -------------------------------------------------

    confidenceBar.style.width =
        "0%";


    riskBar.style.width =
        "0%";


    setTimeout(
        function () {

            confidenceBar.style.width =
                Math.min(
                    result.confidence,
                    100
                ) + "%";


            riskBar.style.width =
                Math.min(
                    result.referableProbability,
                    100
                ) + "%";

        },
        100
    );


    // -------------------------------------------------
    // REFERABLE
    // -------------------------------------------------

    if (result.referable) {

        resultDecision.textContent =
            "REFERABLE DR";


        diagnosisBanner.style.background =
            "rgba(239, 68, 68, 0.07)";


        diagnosisBanner.style.borderColor =
            "rgba(239, 68, 68, 0.15)";


        resultDecision.style.background =
            "rgba(239, 68, 68, 0.12)";


        resultDecision.style.color =
            "#fca5a5";

    }

    else {

        resultDecision.textContent =
            "NON-REFERABLE";


        diagnosisBanner.style.background =
            "rgba(34, 197, 94, 0.07)";


        diagnosisBanner.style.borderColor =
            "rgba(34, 197, 94, 0.14)";


        resultDecision.style.background =
            "rgba(34, 197, 94, 0.12)";


        resultDecision.style.color =
            "#86efac";

    }

}


// =====================================================
// DISPLAY GRAD-CAM
// =====================================================

function displayGradCAM(
    data
) {

    if (
        !data.original_image ||
        !data.gradcam_image
    ) {

        console.warn(
            "Grad-CAM images missing."
        );


        hideGradCAM();


        return;

    }


    gradcamOriginal.src =
        "data:image/jpeg;base64," +
        data.original_image;


    gradcamImage.src =
        "data:image/jpeg;base64," +
        data.gradcam_image;


    explanationSection.style.display =
        "block";


    console.log(
        "Grad-CAM displayed successfully"
    );

}


// =====================================================
// HIDE GRAD-CAM
// =====================================================

function hideGradCAM() {

    if (explanationSection) {

        explanationSection.style.display =
            "none";

    }

}


// =====================================================
// RESET GRAD-CAM
// =====================================================

function resetExplanation() {

    if (explanationSection) {

        explanationSection.style.display =
            "none";

    }


    if (gradcamOriginal) {

        gradcamOriginal.src =
            "";

    }


    if (gradcamImage) {

        gradcamImage.src =
            "";

    }

}


// =====================================================
// HISTORY — GET
// =====================================================

function getHistory() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "retinaAI_history"
            )
        ) || [];

    }

    catch (error) {

        console.error(
            "History error:",
            error
        );


        return [];

    }

}


// =====================================================
// HISTORY — SAVE
// =====================================================

function saveHistory(
    result
) {

    const history =
        getHistory();


    history.unshift(
        result
    );


    const limitedHistory =
        history.slice(
            0,
            10
        );


    localStorage.setItem(
        "retinaAI_history",
        JSON.stringify(
            limitedHistory
        )
    );


    renderHistory();

}


// =====================================================
// HISTORY — RENDER
// =====================================================

function renderHistory() {

    if (!historyList) {

        return;

    }


    const history =
        getHistory();


    if (
        !history ||
        history.length === 0
    ) {

        historyList.innerHTML = `
            <div class="history-empty">
                No previous analyses yet.
            </div>
        `;


        return;

    }


    historyList.innerHTML =
        history.map(
            function (item) {

                return `

                <div class="history-item">

                    <div class="history-patient">

                        <strong>
                            ${escapeHTML(
                                item.patientName
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                item.patientId
                            )}
                        </span>

                    </div>


                    <div class="history-grade">

                        Grade ${item.grade}

                    </div>


                    <div class="history-diagnosis">

                        ${escapeHTML(
                            item.diagnosis
                        )}

                    </div>


                    <div class="history-confidence">

                        ${item.confidence}%
                        confidence

                    </div>


                    <div class="history-time">

                        <small>
                            ${escapeHTML(
                                item.date
                            )}
                        </small>

                        <small>
                            ${escapeHTML(
                                item.time
                            )}
                        </small>

                    </div>

                </div>

                `;

            }
        ).join("");

}


// =====================================================
// CLEAR HISTORY
// =====================================================

if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        function () {

            const history =
                getHistory();


            if (
                history.length === 0
            ) {

                return;

            }


            const confirmed =
                confirm(
                    "Clear all screening history?"
                );


            if (!confirmed) {

                return;

            }


            localStorage.removeItem(
                "retinaAI_history"
            );


            renderHistory();

        }
    );

}


// =====================================================
// NEW ANALYSIS
// =====================================================

if (newAnalysisButton) {

    newAnalysisButton.addEventListener(
        "click",
        function () {

            // -------------------------------------------------
            // PATIENT
            // -------------------------------------------------

            if (!currentPatientId) {

                patientName.value =
                    "";

                patientId.value =
                    "";

            }


            // -------------------------------------------------
            // IMAGE
            // -------------------------------------------------

            imageInput.value =
                "";


            enhancedImageFile =
                null;


            screeningSaved =
                false;


            // -------------------------------------------------
            // COMPARISON
            // -------------------------------------------------

            if (comparisonSection) {

                comparisonSection.style.display =
                    "none";

            }


            if (comparisonOriginal) {

                comparisonOriginal.src =
                    "";

            }


            if (enhancedPreview) {

                enhancedPreview.src =
                    "";

            }


            // -------------------------------------------------
            // PREVIEW
            // -------------------------------------------------

            preview.src =
                "";


            uploadContent.style.display =
                "flex";


            previewWrapper.style.display =
                "none";


            // -------------------------------------------------
            // RESULT
            // -------------------------------------------------

            resultCard.style.display =
                "none";


            emptyResult.style.display =
                "flex";


            confidenceBar.style.width =
                "0%";


            riskBar.style.width =
                "0%";


            // -------------------------------------------------
            // GRAD-CAM
            // -------------------------------------------------

            resetExplanation();


            // -------------------------------------------------
            // STATE
            // -------------------------------------------------

            currentResult =
                null;


            // -------------------------------------------------
            // SCROLL
            // -------------------------------------------------

            window.scrollTo(
                {
                    top: 0,
                    behavior: "smooth"
                }
            );

        }
    );

}


// =====================================================
// PDF REPORT
// =====================================================

if (downloadReport) {

    downloadReport.addEventListener(
        "click",
        generatePDF
    );

}


// =====================================================
// GENERATE PDF
// =====================================================

function generatePDF() {

    if (!currentResult) {

        alert(
            "Please analyse an image first."
        );


        return;

    }


    if (!window.jspdf) {

        alert(
            "PDF library is not loaded.\n" +
            "Please check your internet connection."
        );


        return;

    }


    const {
        jsPDF
    } =
        window.jspdf;


    const doc =
        new jsPDF();


    // =================================================
    // PAGE 1 — HEADER
    // =================================================

    doc.setFillColor(
        8,
        17,
        31
    );


    doc.rect(
        0,
        0,
        210,
        40,
        "F"
    );


    doc.setTextColor(
        255,
        255,
        255
    );


    doc.setFontSize(
        24
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        "RetinaAI",
        20,
        23
    );


    doc.setFontSize(
        10
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.text(
        "AI-Assisted Diabetic Retinopathy Screening",
        20,
        31
    );


    // =================================================
    // PATIENT INFORMATION
    // =================================================

    doc.setTextColor(
        20,
        30,
        45
    );


    doc.setFontSize(
        16
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        "Patient Information",
        20,
        58
    );


    doc.setFontSize(
        11
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.text(
        "Patient Name: " +
        currentResult.patientName,
        20,
        71
    );


    doc.text(
        "Patient ID: " +
        currentResult.patientId,
        20,
        81
    );


    doc.text(
        "Date: " +
        currentResult.date,
        20,
        91
    );


    doc.text(
        "Time: " +
        currentResult.time,
        20,
        101
    );


    // =================================================
    // SCREENING RESULT
    // =================================================

    doc.setFontSize(
        16
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        "AI Screening Result",
        20,
        121
    );


    doc.setFontSize(
        11
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.text(
        "DR Grade: Grade " +
        currentResult.grade,
        20,
        135
    );


    doc.text(
        "Diagnosis: " +
        currentResult.diagnosis,
        20,
        145
    );


    doc.text(
        "AI Confidence: " +
        currentResult.confidence +
        "%",
        20,
        155
    );


    doc.text(
        "Referable DR Probability: " +
        currentResult.referableProbability +
        "%",
        20,
        165
    );


    doc.text(
        "Final Decision: " +
        (
            currentResult.referable
                ? "REFERABLE DR"
                : "NON-REFERABLE"
        ),
        20,
        175
    );


    doc.text(
        "Model: EfficientNet-B0",
        20,
        185
    );


    doc.text(
        "Dataset: APTOS 2019",
        20,
        195
    );


    // =================================================
    // AI EXPLANATION
    // =================================================

    doc.setFontSize(
        16
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        "AI Explanation",
        20,
        220
    );


    doc.setFontSize(
        9
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.text(
        "Grad-CAM visualization of regions contributing",
        20,
        230
    );


    doc.text(
        "relatively more to the model prediction.",
        20,
        236
    );


    // =================================================
    // IMAGES
    // =================================================

    const originalImage =
        gradcamOriginal &&
        gradcamOriginal.src
            ? gradcamOriginal.src
            : null;


    const heatmapImage =
        gradcamImage &&
        gradcamImage.src
            ? gradcamImage.src
            : null;


    if (
        originalImage &&
        heatmapImage
    ) {

        try {

            doc.addImage(
                originalImage,
                "JPEG",
                20,
                242,
                80,
                65
            );


            doc.addImage(
                heatmapImage,
                "JPEG",
                110,
                242,
                80,
                65
            );


            doc.setFontSize(
                9
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.text(
                "Original Retina",
                20,
                312
            );


            doc.text(
                "Grad-CAM Heatmap",
                110,
                312
            );

        }

        catch (error) {

            console.error(
                "Could not add images to PDF:",
                error
            );

        }

    }


    // =================================================
    // PAGE 2
    // =================================================

    doc.addPage();


    doc.setFillColor(
        8,
        17,
        31
    );


    doc.rect(
        0,
        0,
        210,
        35,
        "F"
    );


    doc.setTextColor(
        255,
        255,
        255
    );


    doc.setFontSize(
        20
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        "RetinaAI",
        20,
        22
    );


    // =================================================
    // IMPORTANT NOTICE
    // =================================================

    doc.setTextColor(
        20,
        30,
        45
    );


    doc.setFontSize(
        17
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        "Important Notice",
        20,
        60
    );


    doc.setFontSize(
        11
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    const disclaimer =
        "This report is generated by an AI-assisted " +
        "screening system for research and demonstration " +
        "purposes. It is not a medical diagnosis and " +
        "should not replace evaluation by a qualified " +
        "ophthalmologist or healthcare professional.";


    const disclaimerLines =
        doc.splitTextToSize(
            disclaimer,
            170
        );


    doc.text(
        disclaimerLines,
        20,
        75
    );


    // =================================================
    // GRAD-CAM INFORMATION
    // =================================================

    doc.setFontSize(
        15
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        "About the AI Explanation",
        20,
        115
    );


    doc.setFontSize(
        10
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    const explanationText =
        "The Grad-CAM visualization highlights image " +
        "regions that contributed relatively more to " +
        "the model's prediction. Highlighted regions " +
        "should not be interpreted as confirmed lesions " +
        "or as a clinical explanation.";


    const explanationLines =
        doc.splitTextToSize(
            explanationText,
            170
        );


    doc.text(
        explanationLines,
        20,
        130
    );


    // =================================================
    // MODEL INFORMATION
    // =================================================

    doc.setFontSize(
        15
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        "Model Information",
        20,
        175
    );


    doc.setFontSize(
        10
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.text(
        "Architecture: EfficientNet-B0",
        20,
        190
    );


    doc.text(
        "Training Dataset: APTOS 2019",
        20,
        200
    );


    doc.text(
        "Classification Classes: 5 DR Grades",
        20,
        210
    );


    doc.text(
        "Input Resolution: 224 x 224",
        20,
        220
    );


    doc.text(
        "Explainability Method: Grad-CAM",
        20,
        230
    );


    // =================================================
    // FOOTER
    // =================================================

    doc.setFontSize(
        8
    );


    doc.setTextColor(
        100,
        116,
        139
    );


    doc.text(
        "Generated by RetinaAI",
        20,
        280
    );


    doc.text(
        "AI-assisted screening demonstration",
        20,
        287
    );


    doc.text(
        "Not a medical diagnosis",
        20,
        294
    );


    // =================================================
    // SAVE PDF
    // =================================================

    const safeName =
        currentResult.patientName
            .replace(
                /[^a-z0-9]/gi,
                "_"
            )
            .toLowerCase();


    doc.save(
        "RetinaAI_Report_" +
        safeName +
        ".pdf"
    );


    console.log(
        "PDF generated successfully"
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

    return String(value)

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


// =====================================================
// INITIAL HISTORY
// =====================================================

renderHistory();


console.log(
    "RetinaAI initialized successfully"
);

