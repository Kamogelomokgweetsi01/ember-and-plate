/* =========================
   CART PAGE
========================= */

/* =========================
   CART
========================= */

let cart = JSON.parse(localStorage.getItem("emberCart")) || [];

/* =========================
   DOM ELEMENTS
========================= */

const cartItems = document.getElementById("cartItems");

const emptyCart = document.getElementById("emptyCart");

const cartItemCount = document.getElementById("cartItemCount");

const summaryItems = document.getElementById("summaryItems");

const subtotalElement = document.getElementById("subtotal");

const serviceFeeElement = document.getElementById("serviceFee");

const totalElement = document.getElementById("total");

const clearCartButton = document.getElementById("clearCart");

const checkoutButton = document.getElementById("checkoutButton");

const cartCount = document.getElementById("cartCount");

const bottomCartCount = document.getElementById("bottomCartCount");

/* =========================
   SAVE CART
========================= */

function saveCart() {
  localStorage.setItem("emberCart", JSON.stringify(cart));
}

/* =========================
   CART COUNT
========================= */

function updateCartCount() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  if (cartCount) {
    cartCount.textContent = totalItems;
  }

  if (bottomCartCount) {
    bottomCartCount.textContent = totalItems;
  }

  cartItemCount.textContent = `${totalItems} ${
    totalItems === 1 ? "Item" : "Items"
  }`;
}

/* =========================
   RENDER CART
========================= */

function renderCart() {
  renderCartItems();

  renderSummary();

  updateCartCount();
}

/* =========================
   RENDER ITEMS
========================= */

function renderCartItems() {
  cartItems.innerHTML = "";

  /* EMPTY CART */

  if (cart.length === 0) {
    emptyCart.classList.add("visible");

    return;
  }

  emptyCart.classList.remove("visible");

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;

    const article = document.createElement("article");

    article.className = "cart-item";

    article.innerHTML = `

            <div class="cart-item-info">

                <div class="cart-item-top">

                    <div>

                        <h3 class="cart-item-name">
                            ${item.name}
                        </h3>

                        <p class="cart-item-unit-price">
                            R ${item.price} each
                        </p>

                    </div>


                    <strong class="cart-item-total">
                        R ${itemTotal}
                    </strong>

                </div>


                <div class="cart-item-bottom">

                    <button
                        type="button"
                        class="remove-item"
                        data-index="${index}"
                    >
                        REMOVE
                    </button>


                    <div class="quantity-control">

                        <button
                            type="button"
                            class="quantity-button decrease"
                            data-index="${index}"
                        >
                            −
                        </button>


                        <span class="quantity-value">
                            ${item.quantity}
                        </span>


                        <button
                            type="button"
                            class="quantity-button increase"
                            data-index="${index}"
                        >
                            +
                        </button>

                    </div>

                </div>

            </div>

        `;

    cartItems.appendChild(article);
  });

  attachCartEvents();
}

/* =========================
   ITEM EVENTS
========================= */

function attachCartEvents() {
  /* INCREASE */

  document.querySelectorAll(".increase").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);

      cart[index].quantity += 1;

      saveCart();

      renderCart();
    });
  });

  /* DECREASE */

  document.querySelectorAll(".decrease").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);

      cart[index].quantity -= 1;

      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }

      saveCart();

      renderCart();
    });
  });

  /* REMOVE */

  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);

      cart.splice(index, 1);

      saveCart();

      renderCart();
    });
  });
}

/* =========================
   SUMMARY
========================= */

function renderSummary() {
  summaryItems.innerHTML = "";

  if (cart.length === 0) {
    subtotalElement.textContent = "R 0";

    serviceFeeElement.textContent = "R 0";

    totalElement.textContent = "R 0";

    checkoutButton.disabled = true;

    return;
  }

  checkoutButton.disabled = false;

  let subtotal = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;

    subtotal += itemTotal;

    const row = document.createElement("div");

    row.className = "summary-item";

    row.innerHTML = `

            <span>
                ${item.name} × ${item.quantity}
            </span>

            <strong>
                R ${itemTotal}
            </strong>

        `;

    summaryItems.appendChild(row);
  });

  /*
        Temporary service fee.

        We can remove/change this
        once your actual restaurant
        pricing rules are decided.
    */

  const serviceFee = Math.round(subtotal * 0.1);

  const total = subtotal + serviceFee;

  subtotalElement.textContent = `R ${subtotal}`;

  serviceFeeElement.textContent = `R ${serviceFee}`;

  totalElement.textContent = `R ${total}`;
}

/* =========================
   CLEAR CART
========================= */

clearCartButton.addEventListener("click", () => {
  if (cart.length === 0) {
    return;
  }

  const confirmed = confirm("Are you sure you want to clear your cart?");

  if (!confirmed) {
    return;
  }

  cart = [];

  saveCart();

  renderCart();
});

/* =========================
   CHECKOUT
========================= */

checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) {
    return;
  }

  /*
            Cart and Orders are currently
            separate stages.

            The cart keeps the customer's
            selections.

            Orders will handle the actual
            order once the customer
            confirms it.
        */

  window.location.href = "orders.html";
});

/* =========================
   INITIALISE
========================= */

renderCart();
