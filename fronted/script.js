// =====================================================
// RETINAAI — FRONTEND SCRIPT
// =====================================================


// =====================================================
// VALIDATION POPUP
// =====================================================

function showValidationPopup() {

    console.log("🚨 SHOWING VALIDATION POPUP");

    let popup =
        document.getElementById("validationPopup");

    if (!popup) {

        popup =
            document.createElement("div");

        popup.id =
            "validationPopup";

        popup.innerHTML = `
            <div class="retina-validation-overlay">

                <div class="retina-validation-box">

                    <div class="retina-validation-icon">
                        ⚠️
                    </div>

                    <h2>
                        Invalid Image!
                    </h2>

                    <p>
                        Please upload a correct retinal fundus image
                        to proceed with the screening.
                    </p>

                    <button
                        id="validationPopupButton"
                        type="button"
                    >
                        Upload Correct Image
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(popup);

        const style =
            document.createElement("style");

        style.id =
            "retina-validation-popup-style";

        style.textContent = `

            /* =========================================
               VALIDATION POPUP — FULL SCREEN OVERLAY
            ========================================= */

            #validationPopup {
                position: fixed !important;

                top: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                left: 0 !important;

                width: 100vw !important;
                height: 100vh !important;

                margin: 0 !important;
                padding: 0 !important;

                display: flex !important;

                align-items: center !important;
                justify-content: center !important;

                background: rgba(0, 0, 0, 0.88) !important;

                z-index: 2147483647 !important;

                box-sizing: border-box !important;

                overflow: auto !important;
            }


            /* =========================================
               INNER OVERLAY
            ========================================= */

            .retina-validation-overlay {

                position: absolute;

                top: 0;
                right: 0;
                bottom: 0;
                left: 0;

                width: 100%;
                height: 100%;

                display: flex;

                align-items: center;
                justify-content: center;

                padding: 24px;

                box-sizing: border-box;

                backdrop-filter: blur(10px);

                -webkit-backdrop-filter: blur(10px);

            }


            /* =========================================
               POPUP BOX
            ========================================= */

            .retina-validation-box {

                position: relative;

                width: min(680px, 90vw);

                max-width: 680px;

                min-height: 300px;

                background: #ffffff;

                border-radius: 26px;

                padding: 55px 60px;

                box-sizing: border-box;

                text-align: center;

                box-shadow:
                    0 30px 90px rgba(0, 0, 0, 0.40);

                animation:
                    retinaPopupIn
                    0.30s
                    ease-out;

                margin: auto;

            }


            /* =========================================
               WARNING ICON
            ========================================= */

            .retina-validation-icon {

                font-size: 82px;

                line-height: 1;

                margin-bottom: 20px;

            }


            /* =========================================
               TITLE
            ========================================= */

            .retina-validation-box h2 {

                margin: 0 0 18px 0;

                font-size: 40px;

                line-height: 1.2;

                font-weight: 800;

                color: #dc2626;

            }


            /* =========================================
               MESSAGE
            ========================================= */

            .retina-validation-box p {

                margin: 0 auto 32px auto;

                max-width: 540px;

                font-size: 20px;

                line-height: 1.6;

                color: #374151;

            }


            /* =========================================
               BUTTON
            ========================================= */

            .retina-validation-box button {

                border: none;

                outline: none;

                background: #2563eb;

                color: #ffffff;

                padding: 16px 30px;

                min-width: 220px;

                border-radius: 12px;

                font-size: 17px;

                font-weight: 700;

                cursor: pointer;

                transition:
                    transform 0.15s ease,
                    background 0.15s ease,
                    box-shadow 0.15s ease;

            }


            .retina-validation-box button:hover {

                background: #1d4ed8;

                transform: translateY(-2px);

                box-shadow:
                    0 8px 22px rgba(37, 99, 235, 0.30);

            }


            .retina-validation-box button:active {

                transform: translateY(0);

            }


            /* =========================================
               POPUP ANIMATION
            ========================================= */

            @keyframes retinaPopupIn {

                from {

                    opacity: 0;

                    transform:
                        scale(0.82)
                        translateY(15px);

                }

                to {

                    opacity: 1;

                    transform:
                        scale(1)
                        translateY(0);

                }

            }


            /* =========================================
               MOBILE
            ========================================= */

            @media (max-width: 600px) {

                .retina-validation-box {

                    width: 92vw;

                    padding: 40px 24px;

                    border-radius: 20px;

                }

                .retina-validation-icon {

                    font-size: 65px;

                }

                .retina-validation-box h2 {

                    font-size: 30px;

                }

                .retina-validation-box p {

                    font-size: 16px;

                }

                .retina-validation-box button {

                    width: 100%;

                    font-size: 16px;

                }

            }

        `;

        document.head.appendChild(style);


        // =================================================
        // POPUP BUTTON
        // =================================================

        const popupButton =
            document.getElementById(
                "validationPopupButton"
            );

        if (popupButton) {

            popupButton.addEventListener(
                "click",
                function () {

                    closeValidationPopup();

                }
            );

        }

    }


    // =================================================
    // SHOW POPUP
    // =================================================

    popup.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";

    console.log(
        "✅ Validation popup visible and centered"
    );

}


// =====================================================
// CLOSE VALIDATION POPUP
// =====================================================

function closeValidationPopup() {

    const popup =
        document.getElementById(
            "validationPopup"
        );

    if (popup) {

        popup.style.display =
            "none";

    }

    document.body.style.overflow =
        "";

    resetUpload();

}


// =====================================================
// RESET UPLOAD
// =====================================================

function resetUpload() {

    if (imageInput) {

        imageInput.value =
            "";

    }

    if (uploadContent) {

        uploadContent.style.display =
            "flex";

    }

    if (previewWrapper) {

        previewWrapper.style.display =
            "none";

    }

    if (loading) {

        loading.style.display =
            "none";

    }

    if (emptyResult) {

        emptyResult.style.display =
            "flex";

    }

    if (resultCard) {

        resultCard.style.display =
            "none";

    }

    if (analyseButton) {

        analyseButton.disabled =
            false;

    }

    if (
        typeof analyseEnhancedButton !==
        "undefined" &&
        analyseEnhancedButton
    ) {

        analyseEnhancedButton.disabled =
            false;

    }

    enhancedImageFile =
        null;

    currentResult =
        null;

    screeningSaved =
        false;

    resetExplanation();

}


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


const REQUEST_TIMEOUT_MS =
    120000;


// =====================================================
// FETCH WITH TIMEOUT
// =====================================================

async function fetchWithTimeout(
    url,
    options = {}
) {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT_MS
        );

    try {

        return await fetch(
            url,
            {
                ...options,
                signal:
                    controller.signal
            }
        );

    }

    finally {

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

let currentResult =
    null;


let enhancedImageFile =
    null;


let screeningSaved =
    false;


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

    currentResult =
        null;

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
    // PATIENT VALIDATION
    // -------------------------------------------------

    if (!name) {

        alert(
            "Please enter patient name."
        );

        patientName.focus();

        return;

    }


    // -------------------------------------------------
    // IMAGE VALIDATION
    // -------------------------------------------------

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
    // FORM DATA
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


        let data = {};


        try {

            data =
                await response.json();

        }

        catch (jsonError) {

            console.error(
                "Invalid JSON response:",
                jsonError
            );

            throw new Error(
                "Server returned an invalid response."
            );

        }


        console.log(
            "Prediction response:",
            data
        );

        console.log(
            "Response status:",
            response.status
        );

        console.log(
            "validation_failed:",
            data.validation_failed
        );


        // =================================================
        // HARD INVALID FUNDUS IMAGE GATE
        // =================================================

        if (
            response.status === 422 &&
            data.validation_failed === true
        ) {

            console.log(
                "🚨 NON-FUNDUS / INVALID IMAGE DETECTED"
            );


            // -------------------------------------------------
            // STOP LOADING
            // -------------------------------------------------

            loading.style.display =
                "none";


            // -------------------------------------------------
            // HIDE RESULT
            // -------------------------------------------------

            resultCard.style.display =
                "none";


            // -------------------------------------------------
            // SHOW EMPTY STATE
            // -------------------------------------------------

            emptyResult.style.display =
                "flex";


            // -------------------------------------------------
            // RE-ENABLE BUTTONS
            // -------------------------------------------------

            analyseButton.disabled =
                false;

            if (analyseEnhancedButton) {

                analyseEnhancedButton.disabled =
                    false;

            }


            // -------------------------------------------------
            // CLEAR RESULT
            // -------------------------------------------------

            currentResult =
                null;

            screeningSaved =
                false;


            // -------------------------------------------------
            // CLEAR GRAD-CAM
            // -------------------------------------------------

            resetExplanation();


            // -------------------------------------------------
            // IMPORTANT
            //
            // DO NOT:
            // ❌ display diagnosis
            // ❌ generate Grad-CAM
            // ❌ save history
            // ❌ save database
            // -------------------------------------------------

            showValidationPopup();

            return;

        }


        // =================================================
        // OTHER API ERROR
        // =================================================

        if (
            !response.ok ||
            !data.success
        ) {

            console.error(
                "Prediction API error:",
                data
            );

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
        // STEP 2 — GRAD-CAM
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


            // -------------------------------------------------
            // INVALID IMAGE FROM GRAD-CAM
            // -------------------------------------------------

            if (
                gradcamResponse.status === 422
            ) {

                console.warn(
                    "Grad-CAM rejected image validation."
                );

                hideGradCAM();

            }


            // -------------------------------------------------
            // GRAD-CAM SUCCESS
            // -------------------------------------------------

            else if (
                gradcamResponse.ok
            ) {

                const gradcamData =
                    await gradcamResponse.json();


                console.log(
                    "Grad-CAM response:",
                    gradcamData
                );


                if (
                    gradcamData.success
                ) {

                    currentResult.imagePath =
                        gradcamData.image_path ||
                        "";

                    currentResult.gradcamPath =
                        gradcamData.gradcam_path ||
                        "";

                    displayGradCAM(
                        gradcamData
                    );

                }

                else {

                    console.warn(
                        "Grad-CAM failed:",
                        gradcamData.error ||
                        gradcamData.message
                    );

                    hideGradCAM();

                }

            }


            // -------------------------------------------------
            // GRAD-CAM HTTP ERROR
            // -------------------------------------------------

            else {

                console.warn(
                    "Grad-CAM HTTP error:",
                    gradcamResponse.status
                );

                hideGradCAM();

            }

        }

        catch (gradcamError) {

            console.warn(
                "Grad-CAM skipped:",
                gradcamError
            );

            hideGradCAM();

        }


        // =================================================
        // UPDATE HISTORY
        // =================================================

        updateLatestHistoryResult(
            currentResult
        );


        // =================================================
        // STEP 3 — DATABASE
        // =================================================

        try {

            await saveScreeningToDatabase(
                currentResult
            );

        }

        catch (saveError) {

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


        // -------------------------------------------------
        // DON'T SHOW GENERIC ALERT IF POPUP IS VISIBLE
        // -------------------------------------------------

        const popup =
            document.getElementById(
                "validationPopup"
            );


        const popupVisible =
            popup &&
            popup.style.display !==
            "none";


        if (!popupVisible) {

            alert(
                "Could not complete RetinaAI analysis.\n\n" +
                error.message +
                "\n\n" +
                "Make sure the backend is running."
            );

        }

    }

}


// =====================================================
// SAVE SCREENING TO DATABASE
// =====================================================

async function saveScreeningToDatabase(
    result
) {

    if (
        !currentPatientId &&
        (
            !result.patientId ||
            result.patientId === "N/A"
        )
    ) {

        console.log(
            "No database patient selected. Skipping database save."
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

                    body:
                        JSON.stringify({

                            patient_id:
                                databasePatientId,

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

    }


    catch (error) {

        console.error(
            "Screening database error:",
            error
        );

    }

}


// =====================================================
// UPDATE LATEST HISTORY
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

            if (!currentPatientId) {

                patientName.value =
                    "";

                patientId.value =
                    "";

            }


            imageInput.value =
                "";


            enhancedImageFile =
                null;


            screeningSaved =
                false;


            currentResult =
                null;


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


            preview.src =
                "";


            uploadContent.style.display =
                "flex";


            previewWrapper.style.display =
                "none";


            resultCard.style.display =
                "none";


            emptyResult.style.display =
                "flex";


            confidenceBar.style.width =
                "0%";


            riskBar.style.width =
                "0%";


            resetExplanation();


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
    // PAGE 1 HEADER
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
    // SAVE
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


// =====================================================
// FINAL INITIALIZATION
// =====================================================

console.log(
    "RetinaAI initialized successfully"
);