function result = predict_backend(imagePath)

    url = "http://127.0.0.1:5000/predict";

    % Read image bytes
    fileID = fopen(imagePath, 'r');
    imageBytes = fread(fileID, '*uint8');
    fclose(fileID);

    % Multipart boundary
    boundary = "----MATLABBoundary123456";

    % Build multipart request
    header = [
        "--" + boundary + newline ...
        "Content-Disposition: form-data; name=""image""; filename=""test_image.jpg""" + newline ...
        "Content-Type: image/jpeg" + newline + newline
    ];

    footer = newline + "--" + boundary + "--" + newline;

    body = [
        uint8(char(header))
        imageBytes
        uint8(char(footer))
    ];

    options = weboptions( ...
        "MediaType", "application/octet-stream", ...
        "Timeout", 60);

    try

        response = webwrite( ...
            url, ...
            body, ...
            options);

        result = response;

        fprintf("\n====================================\n");
        fprintf("       AI PREDICTION RESULT\n");
        fprintf("====================================\n");

        if isfield(result, "success")
            fprintf("Success      : %s\n", string(result.success));
        end

        if isfield(result, "diagnosis")
            fprintf("Diagnosis    : %s\n", string(result.diagnosis));
        end

        if isfield(result, "grade")
            fprintf("Grade        : %d\n", result.grade);
        end

        if isfield(result, "confidence")
            fprintf("Confidence   : %.2f%%\n", ...
                result.confidence * 100);
        end

        if isfield(result, "referable")
            fprintf("Referable    : %s\n", string(result.referable));
        end

        fprintf("====================================\n");

    catch ME

        fprintf("\nERROR: Could not connect to Flask backend.\n");
        fprintf("%s\n", ME.message);

        result = [];

    end

end