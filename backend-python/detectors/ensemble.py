def combine(freq, patch, noise, meta_flag):

    return round(
        0.35*freq +
        0.35*patch +
        0.2*noise +
        0.1*(1 if meta_flag else 0),
        3
    )
