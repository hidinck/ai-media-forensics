import cv2
import numpy as np
import io

def fft_score(binary):

    arr = np.frombuffer(binary, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)

    f = np.fft.fft2(img)
    fshift = np.fft.fftshift(f)

    magnitude = np.log(np.abs(fshift) + 1)

    score = float(np.mean(magnitude) / 20.0)

    return min(score, 0.6)
