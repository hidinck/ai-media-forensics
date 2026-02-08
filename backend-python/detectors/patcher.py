import numpy as np
import cv2


GRID = 6


def patch_fft_map(img):

    h, w, _ = img.shape

    ph = h // GRID
    pw = w // GRID

    score_map = np.zeros((GRID, GRID))

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    for i in range(GRID):
        for j in range(GRID):

            patch = gray[i*ph:(i+1)*ph, j*pw:(j+1)*pw]

            f = np.fft.fft2(patch)
            fshift = np.fft.fftshift(f)

            mag = np.log(np.abs(fshift) + 1)
            score_map[i, j] = np.mean(mag)

    score_map = score_map / score_map.max()

    return score_map
