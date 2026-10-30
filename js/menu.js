
import { getAllData } from "../db/db.js";

/* =========================
   DOM ELEMENTS
========================= */

const menuGrid = document.getElementById("menuGrid");
const featuredMenuDish = document.getElementById("featuredMenuDish");
const menuSearch = document.getElementById("menuSearch");
const categoryButtons = document.querySelectorAll(".category-button");
const resultCount = document.getElementById("resultCount");
const emptyMenu = document.getElementById("emptyMenu");
const cartCount = document.getElementById("cartCount");
const bottomCartCount = document.getElementById("bottomCartCount");

const CART_KEY = "emberCart";

let allProducts = [];
let activeCategory = "all";
let searchTerm = "";


/* =========================
   CART STORAGE
========================= */

function getCart() {
    try {
        const cart = JSON.parse(
            localStorage.getItem(CART_KEY) || "[]"
        );

        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        console.error("Could not read cart:", error);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
    const totalItems = getCart().reduce(
        (total, item) => total + Number(item.quantity || 0),
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
   ADD TO CART
========================= */

function addToCart(product) {
    const cart = getCart();

    // Firebase priceCents is converted to rand.
    const price = Number(
        (Number(product.priceCents) / 100).toFixed(2)
    );

    const existingItem = cart.find(item => {
        if (product.id && item.productId) {
            return item.productId === product.id;
        }

        return item.name === product.name;
    });

    if (existingItem) {
        existingItem.quantity =
            Number(existingItem.quantity || 0) + 1;

        existingItem.price = price;
    } else {
        cart.push({
            productId: product.id || null,
            name: product.name,
            price,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartCount();
}


/* =========================
   HELPERS
========================= */

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatPrice(priceCents) {
    return `R ${(Number(priceCents || 0) / 100).toFixed(2)}`;
}

function getImagePath(product) {
    return `../assets/${encodeURIComponent(
        product.image_url || ""
    )}`;
}

function getProductCategory(product) {
    return String(product.category || "food").toLowerCase();
}

function getCategoryLabel(product) {
    const category = getProductCategory(product);

    const labels = {
        food: "FROM OUR KITCHEN",
        drink: "DRINK",
        dessert: "DESSERT",
        extra: "SIDE"
    };

    return labels[category] || category.toUpperCase();
}


/* =========================
   FEATURED PRODUCT
========================= */

function renderFeaturedProduct() {
    if (allProducts.length === 0) {
        featuredMenuDish.innerHTML =
            "<p>No featured dish is available right now.</p>";
        return;
    }

    const product = allProducts[0];

    featuredMenuDish.innerHTML = `
        <div class="featured-menu-image">
            <img
                src="${getImagePath(product)}"
                alt="${escapeHTML(product.name)}"
                onerror="this.style.display='none'"
            >

            <span class="dish-label">
                CHEF'S RECOMMENDATION
            </span>

            <span class="dish-price">
                ${formatPrice(product.priceCents)}
            </span>
        </div>

        <div class="featured-menu-content">
            <div>
                <h3>${escapeHTML(product.name)}</h3>

                <p>${escapeHTML(product.description || "")}</p>

                <span class="dish-note">
                    Chef's recommendation
                </span>
            </div>

            <button
                type="button"
                class="add-button"
                data-product-id="${escapeHTML(product.id)}"
            >
                + ADD ${formatPrice(product.priceCents)}
            </button>
        </div>
    `;
}


/* =========================
   MENU PRODUCT CARD
========================= */

function createMenuCard(product) {
    const category = getProductCategory(product);

    return `
        <article
            class="menu-card"
            data-category="${escapeHTML(category)}"
            data-name="${escapeHTML(product.name)}"
        >
            <div class="menu-card-image">
                <img
                    src="${getImagePath(product)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >

                <span class="dish-label">
                    ${escapeHTML(getCategoryLabel(product))}
                </span>

                <span class="dish-price">
                    ${formatPrice(product.priceCents)}
                </span>
            </div>

            <div class="menu-card-content">
                <h3>${escapeHTML(product.name)}</h3>

                <p>${escapeHTML(product.description || "")}</p>

                <button
                    type="button"
                    class="add-button"
                    data-product-id="${escapeHTML(product.id)}"
                >
                    + ADD ${formatPrice(product.priceCents)}
                </button>
            </div>
        </article>
    `;
}


/* =========================
   SEARCH AND CATEGORY FILTERS
========================= */

function matchesCategory(product) {
    if (activeCategory === "all") {
        return true;
    }

    const category = getProductCategory(product);

    // These filters share the "food" category in
    // the current Firebase schema.
    const categoryMap = {
        starters: ["starter"],
        mains: ["main"],
        woodfire: ["food"],
        sides: ["extra"],
        desserts: ["dessert"],
        drinks: ["drink"]
    };

    return (categoryMap[activeCategory] || [activeCategory])
        .includes(category);
}

function matchesSearch(product) {
    const searchableText = [
        product.name,
        product.description,
        product.category
    ].join(" ").toLowerCase();

    return searchableText.includes(searchTerm);
}

function renderMenu() {
    const filteredProducts = allProducts.filter(
        product => matchesCategory(product) && matchesSearch(product)
    );

    menuGrid.innerHTML = filteredProducts.length
        ? filteredProducts.map(createMenuCard).join("")
        : "";

    resultCount.textContent =
        `${filteredProducts.length} ${
            filteredProducts.length === 1 ? "dish" : "dishes"
        }`;

    emptyMenu.style.display =
        filteredProducts.length === 0 ? "block" : "none";
}


/* =========================
   SEARCH EVENT
========================= */

menuSearch.addEventListener("input", () => {
    searchTerm = menuSearch.value.trim().toLowerCase();
    renderMenu();
});


/* =========================
   CATEGORY BUTTON EVENTS
========================= */

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        activeCategory = button.dataset.category;

        categoryButtons.forEach(categoryButton => {
            categoryButton.classList.toggle(
                "active",
                categoryButton === button
            );
        });

        renderMenu();
    });
});


/* =========================
   ADD BUTTON EVENTS
========================= */

// Event delegation supports dynamically rendered cards.
document.addEventListener("click", event => {
    const button = event.target.closest(
        ".add-button[data-product-id]"
    );

    if (!button) {
        return;
    }

    const product = allProducts.find(
        item => item.id === button.dataset.productId
    );

    if (!product) {
        console.error("Selected product could not be found.");
        return;
    }

    addToCart(product);

    const originalContent = button.innerHTML;

    button.disabled = true;
    button.textContent = "ADDED TO CART";

    setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
    }, 1000);
});


/* =========================
   SYNC CART COUNT
========================= */

window.addEventListener("storage", event => {
    if (event.key === CART_KEY) {
        updateCartCount();
    }
});


/* =========================
   LOAD FIREBASE PRODUCTS
========================= */

async function loadMenu() {
    try {
        const products = await getAllData("products");

        allProducts = products.filter(product =>
            product.isActive !== false &&
            product.isAvailable !== false
        );

        renderFeaturedProduct();
        renderMenu();

    } catch (error) {
        console.error("Could not load menu:", error);

        featuredMenuDish.innerHTML =
            "<p>We couldn't load the featured dish.</p>";

        menuGrid.innerHTML = "";

        resultCount.textContent = "0 dishes";
        emptyMenu.style.display = "block";
    }
}


/* =========================
   INITIALISE
========================= */

updateCartCount();
loadMenu();
