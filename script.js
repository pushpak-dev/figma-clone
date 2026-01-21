let currentTool = "select";
let elements = [];
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let selectedElementId = null;

let isRotating = false;
let rotationStartAngle = 0;
let elementStartRotation = 0;

const canvas = document.getElementById("canvas");
const toolButtons = document.querySelectorAll(".tool");
const layersList = document.querySelector(".layers");
const deleteBtn = document.querySelector(".tool.danger");

const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const colorInput = document.querySelector(".color-input");
const colorCodeInput = document.querySelector(".color-code-input");

const exportJsonBtn = document.querySelector('[title="Export JSON"]');
const exportHtmlBtn = document.querySelector('[title="Export HTML"]');

const textInput = document.getElementById("textInput");

let isResizing = false;
let resizeDirection = null;

textInput.addEventListener("input", () => {
  const el = elements.find((el) => el.id === selectedElementId);
  if (!el || el.type !== "text") return;

  el.text = textInput.value;
  render();
});

toolButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    toolButtons.forEach((b) => b.classList.remove("active"));

    btn.classList.add("active");

    const title = btn.getAttribute("title");

    if (title === "Select") currentTool = "select";
    if (title === "Rectangle") currentTool = "rect";
    if (title === "Text") currentTool = "text";

    console.log("Current Tool:", currentTool);
  });
});

function render() {
  canvas.innerHTML = "";

  elements.forEach((el) => {
    const div = document.createElement("div");
    div.className = "box";
    div.dataset.id = el.id;

    div.style.left = el.x + "px";
    div.style.top = el.y + "px";
    div.style.width = el.width + "px";
    div.style.height = el.height + "px";
    div.style.position = "absolute";

    div.style.transform = `rotate(${el.rotation}deg)`;
    div.style.transformOrigin = "center center";

    if (el.type === "rect") {
      div.style.background = el.color;
    }

    if (el.type === "text") {
      div.textContent = el.text;
      div.style.color = el.color;
      div.style.background = "transparent";
      div.style.fontSize = "16px";
    }

    if (el.id === selectedElementId && currentTool === "select") {
      div.classList.add("selected");
      ["tl", "tr", "bl", "br"].forEach((pos) => {
        const h = document.createElement("div");
        h.className = "handle " + pos;
        h.dataset.dir = pos;
        div.appendChild(h);
      });

      const rotateHandle = document.createElement("div");
      rotateHandle.className = "rotate-handle";
      div.appendChild(rotateHandle);
    }

    canvas.appendChild(div);
  });

  renderLayers();
  syncProperties();
}

canvas.addEventListener("mousedown", (e) => {
  if (e.target.classList.contains("rotate-handle")) {
    isRotating = true;

    const el = elements.find((el) => el.id === selectedElementId);
    if (!el) return;

    const rect = canvas.getBoundingClientRect();
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    rotationStartAngle = Math.atan2(my - cy, mx - cx);
    elementStartRotation = el.rotation;

    e.stopPropagation();
    return;
  }

  if (e.target.classList.contains("handle")) {
    isResizing = true;
    resizeDirection = e.target.dataset.dir;
    e.stopPropagation();
    return;
  }

  if (currentTool === "rect") {
    if (e.target !== canvas) return;

    const rect = canvas.getBoundingClientRect();

    const newElement = {
      id: crypto.randomUUID(),
      type: "rect",
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: 120,
      height: 80,
      color: "#4fa3ff",
      rotation: 0,
    };

    elements.push(newElement);
    selectedElementId = newElement.id;

    currentTool = "select";

    toolButtons.forEach((b) => b.classList.remove("active"));
    toolButtons[0].classList.add("active");

    render();
    return;
  }

  if (currentTool === "text") {
    if (e.target !== canvas) return;

    const rect = canvas.getBoundingClientRect();

    const newText = {
      id: crypto.randomUUID(),
      type: "text",
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: 100,
      height: 30,
      color: "#ffffff",
      text: "Text",
      rotation: 0,
    };

    elements.push(newText);
    selectedElementId = newText.id;

    currentTool = "select";
    toolButtons.forEach((b) => b.classList.remove("active"));
    toolButtons[0].classList.add("active");

    render();
    return;
  }

  if (currentTool === "select") {
    const target = e.target;

    if (!target.classList.contains("box")) {
      selectedElementId = null;
      render();
      return;
    }

    selectedElementId = target.dataset.id;
    isDragging = true;

    const el = elements.find((el) => el.id === selectedElementId);
    const canvasRect = canvas.getBoundingClientRect();

    dragOffsetX = e.clientX - canvasRect.left - el.x;
    dragOffsetY = e.clientY - canvasRect.top - el.y;

    render();
  }
});

document.addEventListener("mousemove", (e) => {
  if (isRotating) {
    const el = elements.find((el) => el.id === selectedElementId);
    if (!el) return;

    const rect = canvas.getBoundingClientRect();
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const angle = Math.atan2(my - cy, mx - cx);
    const delta = angle - rotationStartAngle;

    el.rotation = elementStartRotation + (delta * 180) / Math.PI;

    render();
    return;
  }

  if (isResizing) {
    const el = elements.find((el) => el.id === selectedElementId);
    if (!el) return;

    const canvasRect = canvas.getBoundingClientRect();
    const mx = e.clientX - canvasRect.left;
    const my = e.clientY - canvasRect.top;

    const minSize = 20;

    if (resizeDirection.includes("r")) {
      el.width = Math.max(
        minSize,
        Math.min(mx - el.x, canvas.clientWidth - el.x),
      );
    }
    if (resizeDirection.includes("b")) {
      el.height = Math.max(
        minSize,
        Math.min(my - el.y, canvas.clientHeight - el.y),
      );
    }
    if (resizeDirection.includes("l")) {
      const newX = Math.max(0, mx);
      const newW = el.width + (el.x - newX);

      if (newW >= minSize) {
        el.x = newX;
        el.width = Math.min(newW, el.x + el.width);
      }
    }
    if (resizeDirection.includes("t")) {
      const newY = Math.max(0, my);
      const newH = el.height + (el.y - newY);

      if (newH >= minSize) {
        el.y = newY;
        el.height = Math.min(newH, el.y + el.height);
      }
    }

    render();
    return;
  }

  if (isDragging) {
    const el = elements.find((el) => el.id === selectedElementId);
    if (!el) return;

    const canvasRect = canvas.getBoundingClientRect();

    el.x = e.clientX - canvasRect.left - dragOffsetX;
    el.y = e.clientY - canvasRect.top - dragOffsetY;

    el.x = Math.max(0, Math.min(el.x, canvas.clientWidth - el.width));
    el.y = Math.max(0, Math.min(el.y, canvas.clientHeight - el.height));

    render();
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  dragOffsetX = 0;
  dragOffsetY = 0;
  isResizing = false;
  isRotating = false;
  resizeDirection = null;
});

function renderLayers() {
  layersList.innerHTML = "";

  elements.forEach((el, index) => {
    const li = document.createElement("li");
    li.className = "layer";
    li.textContent = `${el.type} ${index + 1}`;
    li.dataset.id = el.id;

    if (el.id === selectedElementId) {
      li.classList.add("active");
    }

    li.addEventListener("click", () => {
      selectedElementId = el.id;
      render();
      renderLayers();
    });

    layersList.appendChild(li);
  });
}

function deleteSelected() {
  if (!selectedElementId) return;

  elements = elements.filter((el) => el.id !== selectedElementId);
  selectedElementId = null;

  render();
}

deleteBtn.addEventListener("click", deleteSelected);
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete") {
    deleteSelected();
  }
});

function syncProperties() {
  const el = elements.find((el) => el.id === selectedElementId);

  if (!el) {
    widthInput.value = "";
    heightInput.value = "";
    colorInput.value = "#000000";
    colorCodeInput.value = "";
    textInput.value = "";
    return;
  }

  widthInput.value = el.width;
  heightInput.value = el.height;
  colorInput.value = el.color;
  colorCodeInput.value = el.color.replace("#", "").toUpperCase();

  if (el.type === "text") {
    textInput.value = el.text;
  } else {
    textInput.value = "";
  }
}

widthInput.addEventListener("input", () => {
  const el = elements.find((el) => el.id === selectedElementId);
  if (!el) return;

  el.width = +widthInput.value;
  render();
});

heightInput.addEventListener("input", () => {
  const el = elements.find((el) => el.id === selectedElementId);
  if (!el) return;

  el.height = +heightInput.value;
  render();
});

colorInput.addEventListener("input", () => {
  const el = elements.find((el) => el.id === selectedElementId);
  if (!el) return;

  el.color = colorInput.value;
  render();
});

colorCodeInput.addEventListener("input", () => {
  const el = elements.find((el) => el.id === selectedElementId);
  if (!el) return;

  const val = colorCodeInput.value;
  if (/^[0-9A-Fa-f]{6}$/.test(val)) {
    el.color = "#" + val;
    render();
  }
});

function exportJSON() {
  const data = JSON.stringify(elements, null, 2);

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "design.json";
  a.click();

  URL.revokeObjectURL(url);
}
exportJsonBtn.addEventListener("click", exportJSON);

function exportHTML() {
  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Exported Design</title>
<style>
  body { margin:0; position:relative; }
</style>
</head>
<body>
`;

  elements.forEach((el) => {
    if (el.type === "rect") {
      html += `
<div style="
  position:absolute;
  left:${el.x}px;
  top:${el.y}px;
  width:${el.width}px;
  height:${el.height}px;
  background:${el.color};
"></div>
`;
    }

    if (el.type === "text") {
      html += `
<div style="
  position:absolute;
  left:${el.x}px;
  top:${el.y}px;
  width:${el.width}px;
  height:${el.height}px;
  color:${el.color};
  background:transparent;
  font-size:16px;
">
  ${el.text}
</div>
`;
    }
  });

  html += `
</body>
</html>
`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "design.html";
  a.click();

  URL.revokeObjectURL(url);
}

exportHtmlBtn.addEventListener("click", exportHTML);
