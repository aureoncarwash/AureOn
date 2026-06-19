/* =========================
   AureOn - app.js
========================= */

/* =========================
   CONFIGURACIÓN
========================= */

// WhatsApp (sin + ni espacios)
const WHATSAPP_NUMBER = "522206402066";

// Coordenadas
const PHYSICAL_LAT = 18.8914167;
const PHYSICAL_LNG = -99.0653333;

const BASE_MESSAGE =
  "Hola, vengo de la página de AureOn. Quiero información y disponibilidad.";

/* =========================
   HELPERS
========================= */

function buildWhatsAppLink(message) {

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

}

function safeSetHref(id, href) {

  const el = document.getElementById(id);

  if (el) {

    el.href = href;

  }

}

async function loadSection(path) {

  const response = await fetch(path, {

    cache: "no-store"

  });

  if (!response.ok) {

    throw new Error(`No se pudo cargar ${path}`);

  }

  return await response.text();

}

/* =========================
   CARGAR SECCIONES
========================= */

async function mountApp() {

  const app = document.getElementById("app");

  if (!app) return;

  const sections = [

    "sections/header.html",

    "sections/hero.html",

    "sections/fisico.html",

    "sections/domicilio.html",

    "sections/ejemplos.html",

    "sections/contacto.html",

    "sections/footer.html"

  ];

  const html = [];

  for (const section of sections) {

    const content = await loadSection(section);

    html.push(content);

  }

  app.innerHTML = html.join("\n");

  initAfterLoad();

}

/* =========================
   MENÚ MÓVIL
========================= */

function initMobileNav() {

  const media = window.matchMedia("(max-width: 900px)");

  const burger = document.querySelector(".nav__burger");

  const mobileBar = document.getElementById("mobileTopBar");

  if (!burger || !mobileBar) return;

  burger.setAttribute("aria-expanded", "false");

  mobileBar.classList.remove("is-open");

  mobileBar.classList.remove("is-hidden");

  function setOpen(isOpen) {

    burger.setAttribute(

      "aria-expanded",

      String(isOpen)

    );

    mobileBar.classList.toggle(

      "is-open",

      isOpen

    );

    if (!isOpen) {

      mobileBar.classList.remove(

        "is-hidden"

      );

    }

  }

  burger.addEventListener("click", () => {

    if (!media.matches) return;

    const isOpen =

      burger.getAttribute(

        "aria-expanded"

      ) === "true";

    setOpen(!isOpen);

  });

  mobileBar.querySelectorAll("a")

    .forEach(link => {

      link.addEventListener(

        "click",

        () => setOpen(false)

      );

    });

  document.addEventListener(

    "keydown",

    (e) => {

      if (e.key === "Escape") {

        setOpen(false);

      }

    }

  );

  let lastY = window.scrollY;

  let ticking = false;

  function onScroll() {

    if (!media.matches) {

      ticking = false;

      return;

    }

    const isOpen = mobileBar.classList.contains(

      "is-open"

    );

    if (!isOpen) {

      ticking = false;

      return;

    }

    const currentY = window.scrollY;

    const diff = currentY - lastY;

    if (diff > 10 && currentY > 80) {

      mobileBar.classList.add(

        "is-hidden"

      );

    }

    if (diff < -10) {

      mobileBar.classList.remove(

        "is-hidden"

      );

    }

    lastY = currentY;

    ticking = false;

  }

  window.addEventListener(

    "scroll",

    () => {

      if (!ticking) {

        requestAnimationFrame(

          onScroll

        );

        ticking = true;

      }

    },

    {

      passive: true

    }

  );

  media.addEventListener?.(

    "change",

    () => {

      setOpen(false);

      lastY = window.scrollY;

    }

  );

}

/* =========================
   INICIALIZAR
========================= */

function initAfterLoad() {

  // Año

  const year = document.getElementById("year");

  if (year) {

    year.textContent =

      new Date().getFullYear();

  }

  // WhatsApp

  const whatsapp =

    buildWhatsAppLink(

      BASE_MESSAGE

    );

  safeSetHref(

    "heroWhatsapp",

    whatsapp

  );

  safeSetHref(

    "floatWhatsapp",

    whatsapp

  );

  safeSetHref(

    "navWhatsappMobile",

    whatsapp

  );

  safeSetHref(

    "headerWhatsapp",

    whatsapp

  );

  // Maps

  const maps = document.getElementById(

    "mapsLink"

  );

  if (maps) {

    maps.href =

      `https://www.google.com/maps?q=${PHYSICAL_LAT},${PHYSICAL_LNG}`;

  }

  // Menú

  initMobileNav();

}

/* =========================
   INICIAR
========================= */

mountApp()

  .catch(error => {

    console.error(error);

    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `

      <div class="container" style="padding:30px;">

        <p>

          Error cargando las secciones.

        </p>

        <p>

          Verifica que exista la carpeta

          sections.

        </p>

      </div>

    `;

  });