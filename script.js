const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* ---------- قائمة الموبايل ---------- */
const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

$$(".nav-link").forEach((link) =>
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  })
);

/* ---------- فلترة المنيو والبحث ---------- */
const cards = $$(".food-card");
const filterButtons = $$(".filter-chip");
const searchInput = $("#menuSearch");
let activeFilter = "all";

function filterMenu() {
  const query = searchInput.value.trim().toLocaleLowerCase("ar");
  let visibleCount = 0;

  cards.forEach((card) => {
    const categoryMatch =
      activeFilter === "all" || card.dataset.category === activeFilter;
    const searchable = `${card.dataset.name} ${card.textContent}`.toLocaleLowerCase("ar");
    const searchMatch = !query || searchable.includes(query);
    const visible = categoryMatch && searchMatch;

    card.hidden = !visible;
    if (visible) visibleCount++;
  });

  $("#noResults").hidden = visibleCount !== 0;
}

filterButtons.forEach((button) =>
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    filterMenu();
  })
);
searchInput.addEventListener("input", filterMenu);

/* ---------- سلة الطلبات ---------- */
const cart = new Map();
const cartDrawer = $("#cartDrawer");
const cartOverlay = $("#cartOverlay");
const toast = $("#toast");
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2300);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  $("#closeCart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
  document.body.style.overflow = "";
  $("#openCart").focus();
}

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer.classList.contains("open")) closeCart();
});

function addToCart(name, price) {
  const item = cart.get(name) || { name, price, quantity: 0 };
  item.quantity++;
  cart.set(name, item);
  renderCart();
  showToast(`اتضاف ${name} للسلة بنجاح`);
}

$$("[data-add]").forEach((button) =>
  button.addEventListener("click", () => {
    addToCart(button.dataset.add, Number(button.dataset.price));
  })
);

function changeQuantity(name, amount) {
  const item = cart.get(name);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart.delete(name);
  renderCart();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function renderCart() {
  const items = [...cart.values()];
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = `${total.toLocaleString("ar-EG")} ج.م`;

  const container = $("#cartItems");
  if (!items.length) {
    container.innerHTML =
      '<div class="empty-cart"><span>🛍️</span><h3>السلة لسه فاضية</h3><p>اختار حاجة حلوة من المنيو وابدأ طلبك.</p></div>';
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
    <div class="cart-row">
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <small>${item.price.toLocaleString("ar-EG")} ج.م للواحد</small>
        <div class="quantity-controls">
          <button type="button" data-change="-1" data-name="${escapeHtml(item.name)}" aria-label="تقليل الكمية">−</button>
          <strong>${item.quantity}</strong>
          <button type="button" data-change="1" data-name="${escapeHtml(item.name)}" aria-label="زيادة الكمية">+</button>
          <button type="button" class="remove-item" data-remove="${escapeHtml(item.name)}">حذف</button>
        </div>
      </div>
      <strong class="cart-row-price">${(item.price * item.quantity).toLocaleString("ar-EG")} ج.م</strong>
    </div>`
    )
    .join("");
}

$("#cartItems").addEventListener("click", (event) => {
  const changeButton = event.target.closest("[data-change]");
  const removeButton = event.target.closest("[data-remove]");

  if (changeButton) {
    changeQuantity(changeButton.dataset.name, Number(changeButton.dataset.change));
  }
  if (removeButton) {
    cart.delete(removeButton.dataset.remove);
    renderCart();
    showToast("اتحذف الصنف من السلة");
  }
});

/* ---------- تأكيد الطلب (واتساب) ---------- */
$("#checkoutBtn").addEventListener("click", () => {
  if (!cart.size) {
    showToast("السلة فاضية، اختار وجبتك الأول");
    return;
  }

  const lines = [...cart.values()].map(
    (item) =>
      `• ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString("ar-EG")} ج.م`
  );
  const total = [...cart.values()].reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const message = `السلام عليكم، عايز أطلب من ع الشواية:\n\n${lines.join("\n")}\n\nالإجمالي: ${total.toLocaleString("ar-EG")} جنيه\nالاسم: \nالعنوان: `;
  const phone = "201108866150";

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer"
  );
});

/* ---------- الهيدر وزر الرجوع للأعلى ---------- */
const header = $(".site-header");
const backToTop = $("#backToTop");

window.addEventListener(
  "scroll",
  () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
    backToTop.classList.toggle("visible", window.scrollY > 500);
  },
  { passive: true }
);

backToTop.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);

/* ---------- ظهور العناصر مع النزول ---------- */
const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              revealObserver.unobserve(entry.target);
            }
          }),
        { threshold: 0.12 }
      )
    : null;

if (revealObserver) {
  $$(".section-heading, .food-card, .story-photo, .story-copy, .service-card, .cta-band").forEach(
    (element, index) => {
      element.classList.add("reveal");
      element.style.transitionDelay = `${(index % 3) * 70}ms`;
      revealObserver.observe(element);
    }
  );
} else {
  $$(".reveal").forEach((element) => element.classList.add("in-view"));
}

/* ---------- تمييز القسم الحالي في القائمة ---------- */
const sections = $$("main section[id]");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $$(".nav-link").forEach((link) =>
            link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)
          );
        }
      }),
    { rootMargin: "-35% 0px -55% 0px" }
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

/* ---------- حركة عشوائية للكلام ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const randomBetween = (min, max) => min + Math.random() * (max - min);

function driftOnce(element) {
  const [xMin, xMax, yMin, yMax] = element.dataset.drift.split(",").map(Number);
  const area = element.offsetParent || element.parentElement;
  const scale = window.innerWidth <= 800 ? 0.5 : 1;
  const x = randomBetween(xMin, xMax) * area.clientWidth * scale;
  const y = randomBetween(yMin, yMax) * area.clientHeight * scale;
  element.style.transform = `translate(${x}px, ${y}px)`;
}

if (!reduceMotion) {
  $$("[data-drift]").forEach((element, index) => {
    const loop = () => {
      driftOnce(element);
      setTimeout(loop, randomBetween(3200, 5600));
    };
    setTimeout(loop, index * 700);
  });
}