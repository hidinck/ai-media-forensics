import axios from "axios";

const API = axios.create({
  baseURL: "import.meta.env.VITE_API_BASE",
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
