function result = gradcam_backend(imagePath, patientId)

    url = "http://127.0.0.1:5000/gradcam";

    fileID = fopen(imagePath, 'r');
    imageBytes = fread(fileID, '*uint8');
    fclose(fileID);

    boundary = "----MATLABGradCAMBoundary123456";

    header = [
        "--" + boundary + newline ...
        "Content-Disposition: form-data; name=""image""; filename=""test_image.jpg""" + newline ...
        "Content-Type: image/jpeg" + newline + newline
    ];

    patientPart = [
        newline ...
        "--" + boundary + newline ...
        "Content-Disposition: form-data; name=""patient_id""" + newline + newline ...
        patientId
    ];

    footer = newline + ...
        "--" + boundary + "--" + newline;

    body = [
        uint8(char(header))
        imageBytes
        uint8(char(patientPart))
        uint8(char(footer))
    ];

    options = weboptions( ...
        "MediaType", "application/octet-stream", ...
        "Timeout", 60);

    try

        result = webwrite( ...
            url, ...
            body, ...
            options);

        fprintf("\n====================================\n");
        fprintf("          GRAD-CAM RESULT\n");
        fprintf("====================================\n");

        if isfield(result, "success")
            fprintf("Success       : %s\n", ...
                string(result.success));
        end

        if isfield(result, "predicted_class")
            fprintf("Predicted Class: %d\n", ...
                result.predicted_class);
        end

        if isfield(result, "patient_id")
            fprintf("Patient ID    : %s\n", ...
                string(result.patient_id));
        end

        if isfield(result, "gradcam_path")
            fprintf("Grad-CAM Path : %s\n", ...
                string(result.gradcam_path));
        end

        fprintf("====================================\n");

    catch ME

        fprintf("\nGrad-CAM connection failed.\n");
        fprintf("Error: %s\n", ME.message);

        result = [];

    end

end