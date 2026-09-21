clc;
clear;
close all;

fprintf("============================================\n");
fprintf("          RETINAAI - SIH 2026\n");
fprintf("     EXPLAINABLE AI SCREENING PIPELINE\n");
fprintf("============================================\n\n");


%% CONFIGURATION

imagePath = "../test_image.jpg";
patientId = "PAT-0001";


%% STEP 1 — LOAD IMAGE

if ~isfile(imagePath)
    error("test_image.jpg not found.");
end

img = imread(imagePath);

fprintf("[1/6] Fundus image loaded.\n");


%% STEP 2 — QUALITY CHECK

[qualityStatus, qualityScore] = quality_check(img);

fprintf("[2/6] Image quality assessment completed.\n");
fprintf("      Status : %s\n", qualityStatus);
fprintf("      Score  : %.2f\n", qualityScore);


if qualityStatus == "RECAPTURE"

    fprintf("\n============================================\n");
    fprintf("             SCREENING STOPPED\n");
    fprintf("============================================\n");

    fprintf("Reason : Poor image quality\n");
    fprintf("Action : RECAPTURE IMAGE\n");

    return;

end


%% STEP 3 — PREPROCESSING

enhanced = preprocessing(img);

enhancedPath = "../enhanced_test.jpg";
imwrite(enhanced, enhancedPath);

fprintf("[3/6] Image preprocessing completed.\n");
fprintf("      Enhanced image saved: %s\n", enhancedPath);


%% STEP 4 — EFFICIENTNET-B0 PREDICTION

fprintf("\n[4/6] Running EfficientNet-B0...\n");

prediction = predict_backend(enhancedPath);


if isempty(prediction)

    error("Prediction API failed.");

end


if ~prediction.success

    error("Prediction failed: %s", ...
        string(prediction.message));

end


fprintf("      Grade      : %d\n", ...
    prediction.grade);

fprintf("      Diagnosis  : %s\n", ...
    string(prediction.diagnosis));

fprintf("      Confidence : %.2f%%\n", ...
    prediction.confidence * 100);


%% STEP 5 — GRAD-CAM

fprintf("\n[5/6] Generating Grad-CAM...\n");

gradResult = gradcam_backend( ...
    imagePath, ...
    patientId);


if isempty(gradResult)

    error("Grad-CAM API failed.");

end


if ~gradResult.success

    error("Grad-CAM failed.");

end


fprintf("      Grad-CAM generated successfully.\n");


%% STEP 6 — FINAL RESULT

fprintf("\n============================================\n");
fprintf("             FINAL SCREENING\n");
fprintf("============================================\n");

fprintf("Patient ID          : %s\n", patientId);

fprintf("Image Quality       : %s\n", ...
    qualityStatus);

fprintf("Quality Score       : %.2f\n", ...
    qualityScore);

fprintf("DR Grade            : %d\n", ...
    prediction.grade);

fprintf("Diagnosis           : %s\n", ...
    string(prediction.diagnosis));

fprintf("Confidence          : %.2f%%\n", ...
    prediction.confidence * 100);

fprintf("Referable Probability: %.2f%%\n", ...
    prediction.referable_probability * 100);

fprintf("Referable           : %s\n", ...
    string(prediction.referable));

fprintf("Grad-CAM            : GENERATED\n");

fprintf("============================================\n");

fprintf("\nComplete Explainable AI pipeline finished.\n");