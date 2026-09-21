function [status, score] = quality_check(img)

    gray = rgb2gray(img);

    contrastValue = std2(gray);
    brightnessValue = mean(gray(:));

    edgeImage = imfilter(double(gray), [-1 0 1]);
    sharpnessValue = std(edgeImage(:));

    contrastScore = min(contrastValue / 50, 1);
    brightnessScore = 1 - min(abs(brightnessValue - 128) / 128, 1);
    sharpnessScore = min(sharpnessValue / 30, 1);

    score = ...
        0.4 * contrastScore + ...
        0.3 * brightnessScore + ...
        0.3 * sharpnessScore;

    if score >= 0.45
        status = "ACCEPT";
    else
        status = "RECAPTURE";
    end

end