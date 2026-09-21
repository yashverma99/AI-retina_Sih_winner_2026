function enhanced = preprocessing(img)

    % Resize for AI model input
    img = imresize(img, [224 224]);

    % Convert grayscale to RGB
    if size(img,3) == 1
        img = cat(3, img, img, img);
    end

    % CLAHE enhancement
    enhanced = zeros(size(img), 'uint8');

    for c = 1:3
        enhanced(:,:,c) = adapthisteq(img(:,:,c));
    end

    % Display result
    figure;

    subplot(1,2,1);
    imshow(img);
    title("Original Image");

    subplot(1,2,2);
    imshow(enhanced);
    title("Enhanced Image");

end