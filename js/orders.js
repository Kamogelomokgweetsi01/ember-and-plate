/* =========================================
   EMBER & PLATE — ORDERS
   Checkout review, order creation and tracking
   Storage: localStorage
========================================= */

"use strict";

const CART_KEY = "emberCart";
const ORDER_KEY = "emberCurrentOrder";
const SERVER_REQUESTS_KEY = "emberServerRequests";

const TABLE_NUMBER = 12;
const CHEF_NAME = "Chef Thabo";
const ESTIMATED_MINUTES = 25;

/*
    This is a visual prototype, so kitchen progress
    advances quickly for demonstration purposes.

    Replace this with real kitchen status updates
    when a backend is connected.
*/
const DEMO_STAGE_SECONDS = [0, 5, 15, 25];

const ORDER_STAGES = [
  {
    title: "Order received",
    description: "Your order has been confirmed.",
    message: "We've received your order and are getting everything ready.",
    progress: 10,
  },
  {
    title: "Being prepared",
    description: "Our kitchen team is preparing your dishes.",
    message: "Your dishes are being prepared by our kitchen team.",
    progress: 40,
  },
  {
    title: "Almost ready",
    description: "Your dishes are in the final stages.",
    message: "Your order is nearly ready. Thank you for your patience.",
    progress: 75,
  },
  {
    title: "Ready to serve",
    description: "Your order is ready.",
    message: "Your order is ready. Enjoy your meal!",
    progress: 100,
  },
];

/* =========================================
   DOM ELEMENTS
========================================= */

const pageKicker = document.getElementById("pageKicker");
const pageTitle = document.getElementById("pageTitle");
const pageDescription = document.getElementById("pageDescription");

const tableNumber = document.getElementById("tableNumber");

const orderReviewSection = document.getElementById("orderReviewSection");

const reviewDishList = document.getElementById("reviewDishList");
const reviewItemCount = document.getElementById("reviewItemCount");
const reviewSubtotal = document.getElementById("reviewSubtotal");
const reviewServiceFee = document.getElementById("reviewServiceFee");
const reviewTotal = document.getElementById("reviewTotal");
const reviewError = document.getElementById("reviewError");
const placeOrderButton = document.getElementById("placeOrderButton");

const orderTrackingSection = document.getElementById("orderTrackingSection");

const emptyOrderState = document.getElementById("emptyOrderState");

const emptyOrderTitle = document.getElementById("emptyOrderTitle");

const emptyOrderMessage = document.getElementById("emptyOrderMessage");

const orderNumberBlock = document.getElementById("orderNumberBlock");

const orderNumber = document.getElementById("orderNumber");
const metaOrderNumber = document.getElementById("metaOrderNumber");
const metaTable = document.getElementById("metaTable");
const metaTotal = document.getElementById("metaTotal");
const dishCount = document.getElementById("dishCount");
const placedTime = document.getElementById("placedTime");

const currentStatus = document.getElementById("currentStatus");
const currentMessage = document.getElementById("currentMessage");

const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");

const timeRemaining = document.getElementById("timeRemaining");
const estimatedReady = document.getElementById("estimatedReady");

const orderTimeline = document.getElementById("orderTimeline");

const dishList = document.getElementById("dishList");
const dishTotalCount = document.getElementById("dishTotalCount");
const orderTotal = document.getElementById("orderTotal");

const chefName = document.getElementById("chefName");
const chefDisplayName = document.getElementById("chefDisplayName");
const chefStatus = document.getElementById("chefStatus");

const bottomCartCount = document.getElementById("bottomCartCount");

const summonServerButton = document.getElementById("summonServer");
const serverModal = document.getElementById("serverModal");
const closeModalButton = document.getElementById("closeModal");
const cancelModalButton = document.getElementById("cancelModal");
const serverRequestMessage = document.getElementById("serverRequestMessage");

/* =========================================
   STORAGE HELPERS
========================================= */

function readStorage(key, fallback = null) {
  try {
    const savedValue = localStorage.getItem(key);

    if (savedValue === null) {
      return fallback;
    }

    return JSON.parse(savedValue);
  } catch (error) {
    console.error(`Could not read ${key}:`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Could not save ${key}:`, error);
    return false;
  }
}

function readCart() {
  const savedCart = readStorage(CART_KEY, []);

  if (!Array.isArray(savedCart)) {
    return [];
  }

  return savedCart
    .filter(
      (item) =>
        item &&
        typeof item.name === "string" &&
        item.name.trim() !== "" &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) >= 0 &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0,
    )
    .map((item) => ({
      productId: item.productId || null,
      name: item.name.trim(),
      price: Number(Number(item.price).toFixed(2)),
      quantity: Number(item.quantity),
    }));
}

function readCurrentOrder() {
  const savedOrder = readStorage(ORDER_KEY, null);

  if (
    !savedOrder ||
    typeof savedOrder !== "object" ||
    !Array.isArray(savedOrder.dishes) ||
    savedOrder.dishes.length === 0
  ) {
    return null;
  }

  return savedOrder;
}

function formatMoney(amount) {
  const safeAmount = Number(amount);

  return `R ${(Number.isFinite(safeAmount) ? safeAmount : 0).toFixed(2)}`;
}

function getItemCount(items) {
  return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
}

function calculateTotals(items) {
  const subtotal = Number(
    items
      .reduce(
        (total, item) => total + Number(item.price) * Number(item.quantity),
        0,
      )
      .toFixed(2),
  );

  /*
        Matches the existing cart page:
        service fee = Math.round(subtotal * 0.10)
    */
  const serviceFee = Math.round(subtotal * 0.1);

  const total = Number((subtotal + serviceFee).toFixed(2));

  return {
    subtotal,
    serviceFee,
    total,
  };
}

/* =========================================
   SAFE DOM HELPERS
========================================= */

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined && text !== null) {
    element.textContent = String(text);
  }

  return element;
}

function clearElement(element) {
  if (element) {
    element.replaceChildren();
  }
}

function setText(element, value) {
  if (element) {
    element.textContent = String(value);
  }
}

/* =========================================
   CART COUNT
========================================= */

function updateCartCount() {
  const cart = readCart();
  const count = getItemCount(cart);

  setText(bottomCartCount, count);
}

/* =========================================
   SCREEN VISIBILITY
========================================= */

function showReviewScreen() {
  orderReviewSection.hidden = false;
  orderTrackingSection.hidden = true;
  emptyOrderState.hidden = true;
  orderNumberBlock.hidden = true;

  setText(pageKicker, "YOUR DINING EXPERIENCE");
  setText(pageTitle, "Review your order");
  setText(
    pageDescription,
    "Check your selection before sending it to our kitchen.",
  );
}

function showTrackingScreen() {
  orderReviewSection.hidden = true;
  orderTrackingSection.hidden = false;
  emptyOrderState.hidden = true;
  orderNumberBlock.hidden = false;

  setText(pageKicker, "YOUR DINING EXPERIENCE");
  setText(pageTitle, "Track your order");
  setText(pageDescription, "Follow your order as our kitchen prepares it.");
}

function showEmptyScreen(title, message) {
  orderReviewSection.hidden = true;
  orderTrackingSection.hidden = true;
  emptyOrderState.hidden = false;
  orderNumberBlock.hidden = true;

  setText(pageKicker, "EMBER & PLATE");
  setText(pageTitle, title);
  setText(pageDescription, message);

  setText(emptyOrderTitle, title);
  setText(emptyOrderMessage, message);
}

/* =========================================
   ORDER REVIEW
========================================= */

function renderReview() {
  const cart = readCart();

  clearElement(reviewDishList);
  setText(reviewItemCount, `${getItemCount(cart)} items`);
  setText(reviewSubtotal, formatMoney(0));
  setText(reviewServiceFee, formatMoney(0));
  setText(reviewTotal, formatMoney(0));

  if (reviewError) {
    reviewError.hidden = true;
    reviewError.textContent = "";
  }

  if (cart.length === 0) {
    placeOrderButton.disabled = true;

    showEmptyScreen(
      "Your cart is empty",
      "Add some dishes from our menu before placing an order.",
    );

    return;
  }

  showReviewScreen();

  const totals = calculateTotals(cart);

  cart.forEach((item) => {
    const row = createElement("article", "dish-item");

    const information = createElement("div");
    const name = createElement("div", "dish-name", item.name);
    const quantity = createElement(
      "div",
      "dish-quantity",
      `Quantity × ${item.quantity}`,
    );

    const itemTotal = createElement(
      "span",
      "dish-price",
      formatMoney(item.price * item.quantity),
    );

    information.append(name, quantity);
    row.append(information, itemTotal);

    reviewDishList.appendChild(row);
  });

  setText(reviewItemCount, `${getItemCount(cart)} items`);
  setText(reviewSubtotal, formatMoney(totals.subtotal));
  setText(reviewServiceFee, formatMoney(totals.serviceFee));
  setText(reviewTotal, formatMoney(totals.total));

  placeOrderButton.disabled = false;
}

/* =========================================
   CREATE ORDER
========================================= */

function generateOrderNumber() {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `EP-${Date.now().toString().slice(-6)}-${randomPart}`;
}

function createOrder() {
  const cart = readCart();

  if (cart.length === 0) {
    showReviewError(
      "Your cart is empty. Please return to the menu and add dishes.",
    );
    return;
  }

  const totals = calculateTotals(cart);
  const now = Date.now();

  /*
        Save a snapshot of the cart.
        Later cart changes will not alter this order.
    */
  const order = {
    orderNumber: generateOrderNumber(),
    tableNumber: TABLE_NUMBER,
    chef: CHEF_NAME,

    placedTime: new Date(now).toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    }),

    createdAt: now,
    estimatedMinutes: ESTIMATED_MINUTES,

    subtotal: totals.subtotal,
    serviceFee: totals.serviceFee,
    total: totals.total,

    dishCount: getItemCount(cart),

    dishes: cart.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),

    currentStage: 0,

    timeline: ORDER_STAGES.map((stage, index) => ({
      title: stage.title,
      description: stage.description,
      completed: index === 0,
      time:
        index === 0
          ? new Date(now).toLocaleTimeString("en-ZA", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
    })),
  };

  /*
        Save the order FIRST.
        Only clear the cart if the order was saved successfully.
    */
  if (!writeStorage(ORDER_KEY, order)) {
    showReviewError(
      "We couldn't save your order. Your cart has been kept. Please try again.",
    );
    return;
  }

  try {
    localStorage.setItem(CART_KEY, "[]");
  } catch (error) {
    /*
            The order has already been saved.
            Do not discard it if clearing the cart fails.
        */
    console.error("Order saved, but cart could not be cleared:", error);
  }

  updateCartCount();
  renderTracking(order);
}

function showReviewError(message) {
  if (!reviewError) {
    return;
  }

  reviewError.textContent = message;
  reviewError.hidden = false;
}

/* =========================================
   ORDER TRACKING
========================================= */

function getCurrentStage(order) {
  const elapsedSeconds = Math.max(
    0,
    (Date.now() - Number(order.createdAt || Date.now())) / 1000,
  );

  let stageIndex = 0;

  DEMO_STAGE_SECONDS.forEach((seconds, index) => {
    if (elapsedSeconds >= seconds) {
      stageIndex = index;
    }
  });

  return Math.min(stageIndex, ORDER_STAGES.length - 1);
}

function getReadyTime(order) {
  const createdAt = Number(order.createdAt) || Date.now();

  return new Date(
    createdAt + Number(order.estimatedMinutes || ESTIMATED_MINUTES) * 60_000,
  ).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderTracking(order) {
  if (!order || !Array.isArray(order.dishes) || order.dishes.length === 0) {
    showEmptyScreen(
      "No active order",
      "Place an order from your cart to track its progress.",
    );

    return;
  }

  showTrackingScreen();

  const stageIndex = getCurrentStage(order);
  const stage = ORDER_STAGES[stageIndex];
  const count = getItemCount(order.dishes);

  const totals = calculateTotals(order.dishes);

  /*
        Prefer stored totals from the order snapshot.
        Recalculate only if an older order has no saved totals.
    */
  const savedTotal = Number.isFinite(Number(order.total))
    ? Number(order.total)
    : totals.total;

  setText(tableNumber, order.tableNumber || TABLE_NUMBER);
  setText(orderNumber, order.orderNumber || "—");
  setText(metaOrderNumber, order.orderNumber || "—");
  setText(metaTable, order.tableNumber || TABLE_NUMBER);
  setText(dishCount, count);
  setText(metaTotal, formatMoney(savedTotal));

  setText(currentStatus, stage.title);
  setText(currentMessage, stage.message);

  setText(progressPercent, `${stage.progress}%`);

  if (progressFill) {
    progressFill.style.width = `${stage.progress}%`;
  }

  if (progressBar) {
    progressBar.setAttribute("aria-valuenow", stage.progress);
  }

  /*
        Keep the estimated ready time based on the saved order time.
        The quick status simulation does not mean the real meal is ready.
    */
  const elapsedMinutes = Math.floor(
    Math.max(0, Date.now() - Number(order.createdAt || Date.now())) / 60_000,
  );

  const remainingMinutes = Math.max(
    0,
    Number(order.estimatedMinutes || ESTIMATED_MINUTES) - elapsedMinutes,
  );

  setText(
    timeRemaining,
    remainingMinutes === 0 ? "Any moment" : `${remainingMinutes} min`,
  );

  setText(estimatedReady, getReadyTime(order));

  setText(orderTotal, formatMoney(savedTotal));

  setText(dishTotalCount, `${count} items`);

  setText(chefName, order.chef || CHEF_NAME);
  setText(chefDisplayName, "Preparing your order with care.");

  setText(
    chefStatus,
    stageIndex === ORDER_STAGES.length - 1 ? "READY" : "ON DUTY",
  );

  renderTimeline(order, stageIndex);
  renderOrderedDishes(order);
}

function renderTimeline(order, currentStageIndex) {
  clearElement(orderTimeline);

  const createdAt = Number(order.createdAt) || Date.now();

  ORDER_STAGES.forEach((stage, index) => {
    const item = createElement("div", "timeline-item");

    if (index < currentStageIndex) {
      item.classList.add("completed");
    } else if (index === currentStageIndex) {
      item.classList.add("current");
    }

    const dot = createElement("span", "timeline-dot");

    const content = createElement("div");

    let timeText = "";

    if (index === 0) {
      timeText = new Date(createdAt).toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (index <= currentStageIndex) {
      const elapsedSeconds = DEMO_STAGE_SECONDS[index] || 0;

      timeText = new Date(createdAt + elapsedSeconds * 1000).toLocaleTimeString(
        "en-ZA",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      );
    } else {
      timeText = "Upcoming";
    }

    const time = createElement("div", "timeline-time", timeText);
    const title = createElement("h3", "timeline-title", stage.title);
    const description = createElement(
      "p",
      "timeline-description",
      stage.description,
    );

    content.append(time, title, description);
    item.append(dot, content);

    orderTimeline.appendChild(item);
  });
}

function renderOrderedDishes(order) {
  clearElement(dishList);

  if (!Array.isArray(order.dishes) || order.dishes.length === 0) {
    const message = createElement(
      "p",
      "empty-dishes",
      "No dishes were saved for this order.",
    );

    dishList.appendChild(message);
    return;
  }

  order.dishes.forEach((dish) => {
    const row = createElement("article", "dish-item");
    const information = createElement("div");

    const name = createElement("div", "dish-name", dish.name || "Unnamed dish");

    const quantity = createElement(
      "div",
      "dish-quantity",
      `Quantity × ${Number(dish.quantity) || 0}`,
    );

    const price = createElement(
      "span",
      "dish-price",
      formatMoney((Number(dish.price) || 0) * (Number(dish.quantity) || 0)),
    );

    information.append(name, quantity);
    row.append(information, price);

    dishList.appendChild(row);
  });
}

/* =========================================
   SERVER REQUEST MODAL
========================================= */

function openServerModal() {
  if (!readCurrentOrder()) {
    return;
  }

  serverModal.classList.add("visible");
  serverModal.setAttribute("aria-hidden", "false");

  if (serverRequestMessage) {
    serverRequestMessage.hidden = true;
    serverRequestMessage.textContent = "";
  }

  closeModalButton.focus();
}

function closeServerModal() {
  serverModal.classList.remove("visible");
  serverModal.setAttribute("aria-hidden", "true");

  if (summonServerButton) {
    summonServerButton.focus();
  }
}

function recordServerRequest(requestType) {
  const order = readCurrentOrder();

  if (!order) {
    return;
  }

  const requests = readStorage(SERVER_REQUESTS_KEY, []);

  const safeRequests = Array.isArray(requests) ? requests : [];

  safeRequests.push({
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber || TABLE_NUMBER,
    request: requestType,
    requestedAt: new Date().toISOString(),
    status: "recorded",
  });

  if (!writeStorage(SERVER_REQUESTS_KEY, safeRequests)) {
    serverRequestMessage.textContent =
      "We couldn't record the request. Please try again.";

    serverRequestMessage.hidden = false;
    return;
  }

  serverRequestMessage.textContent = `Your "${requestType}" request has been recorded on this device.`;

  serverRequestMessage.hidden = false;
}

/* =========================================
   EVENT LISTENERS
========================================= */

placeOrderButton.addEventListener("click", () => {
  placeOrderButton.disabled = true;

  try {
    createOrder();
  } finally {
    /*
            If checkout remains on the review screen because saving
            failed, allow the customer to retry.
        */
    if (!orderTrackingSection.hidden) {
      placeOrderButton.disabled = true;
    } else if (!orderReviewSection.hidden) {
      placeOrderButton.disabled = readCart().length === 0;
    }
  }
});

if (summonServerButton) {
  summonServerButton.addEventListener("click", openServerModal);
}

if (closeModalButton) {
  closeModalButton.addEventListener("click", closeServerModal);
}

if (cancelModalButton) {
  cancelModalButton.addEventListener("click", closeServerModal);
}

if (serverModal) {
  serverModal.addEventListener("click", (event) => {
    if (event.target === serverModal) {
      closeServerModal();
    }
  });
}

document.querySelectorAll(".server-options button").forEach((button) => {
  button.addEventListener("click", () => {
    recordServerRequest(button.dataset.request || "Assistance");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && serverModal.classList.contains("visible")) {
    closeServerModal();
  }
});

/* =========================================
   INITIALISE
========================================= */

function initialiseOrdersPage() {
  updateCartCount();

  const cart = readCart();

  /*
        If the customer has items in their cart,
        let them review those items before confirming.
    */
  if (cart.length > 0) {
    renderReview();
    return;
  }

  /*
        If the cart is empty but a valid order exists,
        display its tracking page.
    */
  const order = readCurrentOrder();

  if (order) {
    renderTracking(order);
    return;
  }

  showEmptyScreen(
    "Your next great meal starts here",
    "Explore our menu, choose your dishes, and place your first order.",
  );
}

/*
    Re-render if another page in the same origin changes
    the cart or current order.
*/
window.addEventListener("storage", (event) => {
  if (event.key === CART_KEY || event.key === ORDER_KEY) {
    initialiseOrdersPage();
  }
});

initialiseOrdersPage();

/*
    Refresh the demo tracking status once per second.
    This is local browser simulation, not live kitchen data.
*/
window.setInterval(() => {
  if (orderTrackingSection.hidden) {
    return;
  }

  const order = readCurrentOrder();

  if (order) {
    renderTracking(order);
  }
}, 1000);
