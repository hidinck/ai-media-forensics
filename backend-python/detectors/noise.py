import cv2
import numpy as np


def noise_score(img):

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    blur = cv2.GaussianBlur(gray, (5,5), 0)

    residual = cv2.absdiff(gray, blur)

    return np.mean(residual) / 255
