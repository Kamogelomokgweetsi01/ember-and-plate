
import { getAllData } from "../db/db.js";

/* =========================
   DOM ELEMENTS
========================= */

const featuredContainer =
    document.getElementById("featuredProduct");

const favouritesContainer =
    document.getElementById("favouritesGrid");

const cartCount =
    document.getElementById("cartCount");

const bottomCartCount =
    document.getElementById("bottomCartCount");


/* =========================
   CART STORAGE
========================= */

const CART_KEY = "emberCart";

function getCart() {
    try {
        const savedCart = JSON.parse(
            localStorage.getItem(CART_KEY) || "[]"
        );

        return Array.isArray(savedCart) ? savedCart : [];
    } catch (error) {
        console.error("Could not read cart:", error);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );
}


/* =========================
   CART COUNT
========================= */

function updateCartCount() {
    const cart = getCart();

    const totalItems = cart.reduce(
        (total, item) =>
            total + Number(item.quantity || 0),
        0
    );

    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    if (bottomCartCount) {
        bottomCartCount.textContent = totalItems;
    }
}


/* =========================
   ADD PRODUCT TO CART
========================= */

function addToCart(product) {
    const cart = getCart();

    // Firebase stores prices in cents.
    // The existing cart.js expects prices in rand.
    const price = Number(
        (Number(product.priceCents) / 100).toFixed(2)
    );

    // Use the Firebase document ID when available.
    // Fall back to the product name for older cart items.
    const existingItem = cart.find(item => {
        if (product.id && item.productId) {
            return item.productId === product.id;
        }

        return item.name === product.name;
    });

    if (existingItem) {
        existingItem.quantity =
            Number(existingItem.quantity || 0) + 1;

        // Refresh the price from the current product data.
        existingItem.price = price;
    } else {
        cart.push({
            productId: product.id || null,
            name: product.name,
            price: price,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartCount();
}


/* =========================
   FORMAT PRODUCT DATA
========================= */

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function getImagePath(product) {
    return `../assets/${encodeURIComponent(
        product.image_url || ""
    )}`;
}

function formatPrice(priceCents) {
    return `R ${(Number(priceCents || 0) / 100).toFixed(2)}`;
}


/* =========================
   FEATURED PRODUCT
========================= */

function createFeaturedCard(product) {
    const name = escapeHTML(product.name);
    const description = escapeHTML(product.description);
    const category = escapeHTML(product.category);

    return `
        <div class="featured-image">
            <img
                src="${getImagePath(product)}"
                alt="${name}"
                onerror="this.style.display='none'"
            >

            <span class="dish-label">${category}</span>

            <span class="dish-price">
                ${formatPrice(product.priceCents)}
            </span>
        </div>

        <div class="featured-content">
            <div>
                <h3>${name}</h3>
                <p>${description}</p>
            </div>

            <button
                type="button"
                class="order-dish-button"
                data-product-id="${escapeHTML(product.id)}"
            >
                + ORDER DISH
            </button>
        </div>
    `;
}


/* =========================
   FAVOURITE PRODUCT CARDS
========================= */

function createFavouriteCard(product) {
    const name = escapeHTML(product.name);
    const description = escapeHTML(product.description);
    const category = escapeHTML(product.category);

    return `
        <article class="dish-card">
            <div class="dish-image">
                <img
                    src="${getImagePath(product)}"
                    alt="${name}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >

                <span class="dish-label">${category}</span>

                <span class="dish-price">
                    ${formatPrice(product.priceCents)}
                </span>
            </div>

            <div class="dish-content">
                <h3>${name}</h3>
                <p>${description}</p>

                <button
                    type="button"
                    class="add-button"
                    data-product-id="${escapeHTML(product.id)}"
                >
                    <span>+</span>
                    ADD ${formatPrice(product.priceCents)}
                </button>
            </div>
        </article>
    `;
}


/* =========================
   LOAD PRODUCTS FROM FIREBASE
========================= */

let dashboardProducts = [];

async function loadDashboardProducts() {
    try {
        const products = await getAllData("products");

        dashboardProducts = products.filter(product =>
            product.isActive !== false &&
            product.isAvailable !== false
        );

        if (dashboardProducts.length === 0) {
            featuredContainer.innerHTML =
                "<p>No featured dishes are available yet.</p>";

            favouritesContainer.innerHTML =
                "<p>Our menu is being prepared. Please check back soon.</p>";

            return;
        }

        const [featuredProduct, ...otherProducts] =
            dashboardProducts;

        featuredContainer.innerHTML =
            createFeaturedCard(featuredProduct);

        const favourites = otherProducts.slice(0, 4);

        favouritesContainer.innerHTML = favourites.length
            ? favourites.map(createFavouriteCard).join("")
            : "<p>More favourites coming soon.</p>";

    } catch (error) {
        console.error(
            "Could not load dashboard products:",
            error
        );

        featuredContainer.innerHTML =
            "<p>We couldn't load the featured dish.</p>";

        favouritesContainer.innerHTML =
            "<p>We couldn't load the menu. Please try again later.</p>";
    }
}


/* =========================
   DASHBOARD ADD-TO-CART EVENTS
========================= */

// Event delegation works even though the buttons
// are created dynamically after Firebase loads.
document.addEventListener("click", event => {
    const button = event.target.closest(
        ".order-dish-button, .add-button"
    );

    if (!button) {
        return;
    }

    const product = dashboardProducts.find(
        item => item.id === button.dataset.productId
    );

    if (!product) {
        console.error("Could not find the selected product.");
        return;
    }

    addToCart(product);

    // Give the customer feedback without changing
    // the page's permanent button design.
    const originalContent = button.innerHTML;

    button.disabled = true;
    button.textContent = "ADDED TO CART";

    setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
    }, 1000);
});


/* =========================
   KEEP CART COUNT UPDATED
========================= */

window.addEventListener("storage", event => {
    if (event.key === CART_KEY) {
        updateCartCount();
    }
});


/* =========================
   INITIALISE
========================= */

updateCartCount();
loadDashboardProducts();
