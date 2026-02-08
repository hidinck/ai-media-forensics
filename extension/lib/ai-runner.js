console.log("[AI] ai-runner loaded");

let ortSession = null;

export async function loadModel() {
  if (ortSession) return ortSession;

  const ort = window.ort;
  ort.env.wasm.wasmPaths = chrome.runtime.getURL("lib/");

  const modelUrl = chrome.runtime.getURL("models/forensics_cnn.onnx");

  ortSession = await ort.InferenceSession.create(modelUrl);
  console.log("[AI] ONNX model loaded");

  return ortSession;
}

export async function runImageInference(imgEl) {
  const session = await loadModel();

  const tensor = await imageToTensor(imgEl);

  const feeds = {};
  feeds[session.inputNames[0]] = tensor;

  const results = await session.run(feeds);
  const output = results[session.outputNames[0]].data[0];

  return output;
}

async function imageToTensor(img) {
  const size = 224;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);

  const float = new Float32Array(size * size * 3);

  for (let i = 0; i < size * size; i++) {
    float[i * 3] = data[i * 4] / 255;
    float[i * 3 + 1] = data[i * 4 + 1] / 255;
    float[i * 3 + 2] = data[i * 4 + 2] / 255;
  }

  return new ort.Tensor("float32", float, [1, 3, size, size]);
}
