import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 20000
});

export const analyzeImage = async file => {
  const fd = new FormData();
  fd.append("img", file);

  const res = await API.post("/analyze-image", fd);
  return res.data;
};

export const fetchHeatmap = async (file, mode) => {
  const fd = new FormData();
  fd.append("img", file);

  const res = await API.post(`/heatmap?mode=${mode}`, fd, {
    responseType: "blob"
  });

  return {
    blob: res.data,
    headers: res.headers
  };
};
