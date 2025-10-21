// script.js
// Web-Based Calculator (Basic Mode) - Logic
// Tác giả: ChatGPT (việt hóa comments)
// Mục tiêu: xử lý input, thực hiện phép toán, cập nhật display

(function () {
  // ----- Lấy DOM elements -----
  const displayPrimary = document.querySelector(".display__primary"); // hiển thị chính (số hiện tại)
  const displaySecondary = document.querySelector(".display__secondary"); // hiển thị phụ / history
  const keypad = document.querySelector(".keypad");

  // Nếu không tìm thấy phần tử, dừng
  if (!displayPrimary || !displaySecondary || !keypad) {
    console.warn(
      "Calculator DOM elements not found. Kiểm tra lại HTML class names."
    );
    return;
  }

  // ----- Trạng thái máy tính -----
  let currentStr = ""; // chuỗi đang nhập
  let operands = []; // stack các toán hạng
  let operators = []; // stack toán tử

  // Các biến bổ trợ
  let justCalculated = false; // theo dõi xem vừa nhấn "=" chưa
  let lastResult = null; // lưu kết quả gần nhất để tính tiếp

  // ----- Hỗ trợ (cấu hình) -----
  const MAX_DISPLAY_LENGTH = 18;

  // ----- Hàm tiện ích -----
  function toNumber(str) {
    if (str === "" || str === null || str === undefined) return NaN;
    return Number(str);
  }

  function formatNumberForDisplay(n) {
    if (n === "Error") return "Error";
    if (!isFinite(n)) return "Error";
    let s = String(n);
    if (s.indexOf("e") !== -1) s = Number(n).toPrecision(12);
    else if (s.indexOf(".") !== -1) s = parseFloat(n.toFixed(12)).toString();
    if (s.length > MAX_DISPLAY_LENGTH) s = Number(n).toExponential(6);
    return s;
  }

  function updateDisplays() {
    displayPrimary.textContent = currentStr === "" ? "0" : currentStr;
    let parts = [];
    for (let i = 0; i < operands.length; i++) {
      parts.push(formatNumberForDisplay(operands[i]));
      if (i < operators.length) parts.push(operators[i]);
    }
    if (currentStr !== "") parts.push(currentStr);
    // Nếu vừa clear hoặc vừa chọn lại từ history/memory, xóa sạch displaySecondary
    if (
      (operands.length === 0 && operators.length === 0 && currentStr === "") ||
      (justCalculated && operands.length === 0 && operators.length === 0)
    ) {
      displaySecondary.textContent = "";
    } else {
      displaySecondary.textContent = parts.join(" ");
    }
  }

  function clearAll() {
    currentStr = "";
    operands = [];
    operators = [];
    justCalculated = false;
    lastResult = null;
    updateDisplays();
    displaySecondary.textContent = "";
  }

  function clearEntry() {
    currentStr = "";
    updateDisplays();
  }

  function backspace() {
    if (currentStr.length > 0) currentStr = currentStr.slice(0, -1);
    updateDisplays();
  }

  // ----- Hàm tính toán -----
  function applyOperator(a, b, op) {
    a = Number(a);
    b = Number(b);
    if (!isFinite(a) || !isFinite(b)) return "Error";
    switch (op) {
      case "+":
        return a + b;
      case "−":
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        if (b === 0) return "Error";
        return a / b;
      default:
        return "Error";
    }
  }

  // ⚠️: pushOperator được gọi mỗi khi người dùng nhấn dấu phép toán
  function pushOperator(newOp) {
    // Nếu vừa tính xong (vừa nhấn =) mà nhấn toán tử → dùng kết quả tiếp tục
    if (justCalculated) {
      operands = [toNumber(currentStr)];
      currentStr = "";
      justCalculated = false;
    }

    // Nếu đang nhập số → đẩy vào operands
    if (currentStr !== "") {
      operands.push(toNumber(currentStr));
      currentStr = "";
    } else if (operands.length === 0) {
      operands.push(0);
    }

    // Khi nhấn toán tử mới → thực hiện phép tính trước (bỏ ưu tiên)
    if (operators.length > 0 && operands.length >= 2) {
      const op = operators.pop();
      const b = operands.pop();
      const a = operands.pop();
      const res = applyOperator(a, b, op);
      if (res === "Error") {
        clearAll();
        currentStr = "Error";
        updateDisplays();
        return;
      }
      operands.push(res);
      currentStr = "";
    }

    operators.push(newOp);
    updateDisplays();
  }

  function pressEquals() {
    if (currentStr !== "") operands.push(toNumber(currentStr));

    // ⚠️ Nếu người dùng chỉ nhập một số rồi nhấn "=" → lấy lastResult nếu có
    if (operators.length > 0 && operands.length >= 2) {
      const op = operators.pop();
      const b = operands.pop();
      const a = operands.pop();
      const res = applyOperator(a, b, op);
      if (res === "Error") {
        clearAll();
        currentStr = "Error";
        updateDisplays();
        return;
      }

      currentStr = formatNumberForDisplay(res);
      lastResult = res;
      operands = [];
      operators = [];
      justCalculated = true;
    }

    // Nếu không còn biểu thức, xóa sạch displaySecondary
    if (
      operands.length === 0 &&
      operators.length === 0 &&
      currentStr !== "Error" &&
      currentStr !== ""
    ) {
      displaySecondary.textContent = "";
    }
    updateDisplays();
    renderSidebar(); // ⚠️ cập nhật lại sidebar mỗi lần nhấn "="
    // Nếu không có phép toán, chỉ hiển thị số hiện tại
    if (operators.length === 0 || operands.length < 2) {
      operands = [];
      operators = [];
      justCalculated = true;
      updateDisplays();
      renderSidebar();
      return;
    }

    // Nếu có phép toán thì thực hiện như cũ
    const op = operators.pop();
    const b = operands.pop();
    const a = operands.pop();
    const res = applyOperator(a, b, op);
    if (res === "Error") {
      clearAll();
      currentStr = "Error";
      updateDisplays();
      return;
    }

    currentStr = formatNumberForDisplay(res);
    lastResult = res;
    operands = [];
    operators = [];
    justCalculated = true;
    updateDisplays();
    renderSidebar();
  }

  // ----- Unary functions -----
  function applySqrt() {
    let target =
      currentStr !== ""
        ? toNumber(currentStr)
        : toNumber(displayPrimary.textContent);
    if (target < 0) {
      clearAll();
      currentStr = "Error";
      updateDisplays();
      return;
    }
    const res = Math.sqrt(target);
    currentStr = formatNumberForDisplay(res);
    updateDisplays();
  }

  function applySquare() {
    let target =
      currentStr !== ""
        ? toNumber(currentStr)
        : toNumber(displayPrimary.textContent);
    const res = target * target;
    currentStr = formatNumberForDisplay(res);
    updateDisplays();
  }

  function applyReciprocal() {
    let target =
      currentStr !== ""
        ? toNumber(currentStr)
        : toNumber(displayPrimary.textContent);
    if (target === 0) {
      clearAll();
      currentStr = "Error";
      updateDisplays();
      return;
    }
    const res = 1 / target;
    currentStr = formatNumberForDisplay(res);
    updateDisplays();
  }

  function applyNegate() {
    if (currentStr !== "") {
      if (currentStr.startsWith("-")) currentStr = currentStr.slice(1);
      else currentStr = "-" + currentStr;
    } else {
      currentStr = "-" + displayPrimary.textContent;
    }
    updateDisplays();
  }

  function applyPercent() {
    let value = toNumber(currentStr || displayPrimary.textContent);
    value = value / 100;
    currentStr = formatNumberForDisplay(value);
    updateDisplays();
  }

  // ----- Xử lý input số -----
  function inputNumber(char) {
    if (justCalculated) {
      // ⚠️ Sau khi nhấn "=", nếu nhập số mới thì bắt đầu phép tính mới
      currentStr = "";
      operands = [];
      operators = [];
      justCalculated = false;
    }

    if (char === ".") {
      if (currentStr.includes(".")) return;
      if (currentStr === "" || currentStr === "-0") {
        currentStr = currentStr.startsWith("-") ? "-0." : "0.";
      } else {
        currentStr += ".";
      }
    } else {
      if (currentStr === "0") currentStr = char;
      else if (currentStr === "-0") currentStr = "-" + char;
      else currentStr += char;
    }
    if (currentStr.length > MAX_DISPLAY_LENGTH + 6) {
      currentStr = currentStr.slice(0, MAX_DISPLAY_LENGTH + 6);
    }
    updateDisplays();
  }

  // ----- Phân loại nút -----
  function handleButtonPress(text) {
    text = text.trim();

    if (/^\d$/.test(text)) {
      inputNumber(text);
      return;
    }
    if (text === ".") {
      inputNumber(".");
      return;
    }

    if (text === "CE") {
      clearEntry();
      return;
    }
    if (text === "C") {
      clearAll();
      return;
    }
    if (text === "⌫" || text === "←") {
      backspace();
      return;
    }

    if (text === "=") {
      pressEquals();
      return;
    }

    if (text === "+") {
      pushOperator("+");
      return;
    }
    if (text === "−" || text === "-") {
      pushOperator("−");
      return;
    }
    if (text === "×") {
      pushOperator("×");
      return;
    }
    if (text === "÷") {
      pushOperator("÷");
      return;
    }

    if (text === "√x") {
      applySqrt();
      return;
    }
    if (text === "x²") {
      applySquare();
      return;
    }
    if (text === "1/x") {
      applyReciprocal();
      return;
    }
    if (text === "+/−" || text === "±") {
      applyNegate();
      return;
    }
    if (text === "%") {
      applyPercent();
      return;
    }

    console.log("Unhandled button:", text);
  }

  // ----- Gán sự kiện -----
  document
    .querySelectorAll(".keypad button, .memory-row button")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.textContent.trim();
        handleButtonPress(text);
      });
    });

  // ----- Hỗ trợ bàn phím -----
  window.addEventListener("keydown", (e) => {
    if (e.key >= "0" && e.key <= "9") {
      inputNumber(e.key);
      e.preventDefault();
      return;
    }
    if (e.key === ".") {
      inputNumber(".");
      e.preventDefault();
      return;
    }
    if (e.key === "Backspace") {
      backspace();
      e.preventDefault();
      return;
    }
    if (e.key === "Escape") {
      clearAll();
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" || e.key === "=") {
      pressEquals();
      e.preventDefault();
      return;
    }
    if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") {
      const map = { "*": "×", "/": "÷", "+": "+", "-": "−" };
      pushOperator(map[e.key]);
      e.preventDefault();
      return;
    }
  });
  /* ===============================
   BỔ SUNG CHỨC NĂNG SIDEBAR: HISTORY + MEMORY (STACK MODE)
   =============================== */

  // Lấy phần tử DOM trong sidebar
  const historyTab = document.querySelector(".tabs button:nth-child(1)");
  const memoryTab = document.querySelector(".tabs button:nth-child(2)");
  const sidebarBody = document.querySelector(".sidebar-body");

  // Dữ liệu lưu trữ
  let historyList = [];
  let memoryStack = []; // stack: phần tử 0 là đáy, phần tử cuối là đỉnh (top)

  // Hàm cập nhật giao diện sidebar
  function renderSidebar() {
    sidebarBody.innerHTML = "";
    const activeTab = historyTab.classList.contains("active")
      ? "history"
      : "memory";

    // --- Tab History ---
    if (activeTab === "history") {
      if (historyList.length === 0) {
        sidebarBody.innerHTML = `<p>There's no history yet.</p>`;
      } else {
        const ul = document.createElement("ul");
        ul.className = "history-list";
        historyList
          .slice()
          .reverse()
          .forEach((item) => {
            const li = document.createElement("li");
            li.className = "history-item";
            li.innerHTML = `<div class="expr">${item.expr}</div><div class="res">${item.result}</div>`;
            li.addEventListener("click", () => {
              currentStr = String(item.result);
              operands = [];
              operators = [];
              updateDisplays();
            });
            ul.appendChild(li);
          });

        sidebarBody.appendChild(ul);
      }
    }

    // --- Tab Memory (Stack) ---
    else {
      if (memoryStack.length === 0) {
        sidebarBody.innerHTML = `<p>There's nothing saved in memory.</p>`;
      } else {
        const ul = document.createElement("ul");
        ul.className = "memory-list";
        // hiển thị từ đỉnh xuống đáy (top first)
        memoryStack
          .slice()
          .reverse()
          .forEach((val, index) => {
            const li = document.createElement("li");
            li.className = "memory-item";
            li.innerHTML = `
          <div class="mem-val">${formatNumberForDisplay(val)}</div>
        `;
            // Click vào phần tử để hiển thị ra display
            li.addEventListener("click", () => {
              currentStr = String(val);
              updateDisplays();
            });

            ul.appendChild(li);
          });

        sidebarBody.appendChild(ul);
      }
    }
  }

  // Chuyển tab giữa History / Memory
  historyTab.addEventListener("click", () => {
    historyTab.classList.add("active");
    memoryTab.classList.remove("active");
    renderSidebar();
  });
  memoryTab.addEventListener("click", () => {
    memoryTab.classList.add("active");
    historyTab.classList.remove("active");
    renderSidebar();
  });

  // Ghi lại lịch sử mỗi khi nhấn "="
  const originalPressEquals = pressEquals;
  pressEquals = function () {
    const beforeEval = displaySecondary.textContent;
    originalPressEquals();
    if (currentStr !== "Error" && beforeEval.trim() !== "") {
      historyList.push({ expr: beforeEval, result: currentStr });
    }
    renderSidebar();
  };

  // Các nút bộ nhớ (MC, MR, M+, M−, MS)
  document.querySelectorAll(".memory-row button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.textContent.trim();
      const val = Number(currentStr || 0);

      switch (text) {
        case "MC":
          memoryStack = [];
          break;
        case "MR":
          if (memoryStack.length > 0) {
            const topVal = memoryStack.pop(); // lấy phần tử trên cùng
            currentStr = String(topVal);
            updateDisplays();
          } else {
            currentStr = "0";
            updateDisplays();
          }
          break;
        case "M+":
          if (memoryStack.length === 0) memoryStack.push(0);
          memoryStack[memoryStack.length - 1] += val;
          break;
        case "M−":
          if (memoryStack.length === 0) memoryStack.push(0);
          memoryStack[memoryStack.length - 1] -= val;
          break;
        case "MS":
          if (memoryStack.length > 0) {
            // đẩy phần tử hiện tại lên top, các phần tử cũ xuống
            memoryStack.push(val);
          } else {
            memoryStack.push(val);
          }
          break;
      }
      renderSidebar();
    });
  });

  // Khởi tạo giao diện sidebar
  renderSidebar();

  /* ===============================
   KẾT THÚC PHẦN MỞ RỘNG (STACK MEMORY + HISTORY)
   =============================== */

  // ----- Khởi tạo -----
  clearAll();
  renderSidebar();
})();
