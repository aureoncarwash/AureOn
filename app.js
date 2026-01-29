/* =========================
   AureOn — app.js (COMPLETO)
   - Carga secciones desde /sections
   - Links WhatsApp (botones)
   - Maps con coordenadas exactas
   - Elegir paquete -> autollenar cotizador (Essential/Prime/Deluxe)
   - Cotizador funcional (total + WhatsApp)
   - Menú móvil
   - Año footer
========================= */

/* =========================
   CONFIG
========================= */

// PON TU NÚMERO AQUÍ (formato internacional, sin +, sin espacios)
// Ejemplo México: 52 + 10 dígitos => "521234567890"
const WHATSAPP_NUMBER = "525639005947";

// Coordenadas exactas del punto físico
// 18°53'29.1"N 99°03'55.2"W
const PHYSICAL_LAT = 18.8914167;
const PHYSICAL_LNG = -99.0653333;

const BASE_MESSAGE =
  "Hola, vengo de la página de AureOn. Quiero información y disponibilidad.";

/* =========================
   HELPERS
========================= */

function buildWhatsAppLink(message) {
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

function scrollToId(idSelector) {
  const el = document.querySelector(idSelector);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadSection(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar: ${path}`);
  return await res.text();
}

function safeSetHref(id, href) {
  const el = document.getElementById(id);
  if (el) el.setAttribute("href", href);
}

function money(n) {
  return "$" + Number(n).toLocaleString("es-MX");
}

function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

/* =========================
   PRECIOS (A DOMICILIO)
========================= */

const PRICES = {
  Essential: {
    Auto:     { Tarjeta: 220, Efectivo: 200 },
    Camioneta:{ Tarjeta: 320, Efectivo: 290 },
    Suburban: { Tarjeta: 420, Efectivo: 380 },
  },
  Prime: {
    Auto:     { Tarjeta: 500, Efectivo: 450 },
    Camioneta:{ Tarjeta: 650, Efectivo: 585 },
    Suburban: { Tarjeta: 800, Efectivo: 720 },
  },
  Deluxe: {
    Auto:     { Tarjeta: 1000, Efectivo: 900 },
    Camioneta:{ Tarjeta: 1200, Efectivo: 1080 },
    Suburban: { Tarjeta: 1400, Efectivo: 1260 },
  },
};

const DIRT_ADD = {
  Base: 0,
  Media: 150,
  Alta: 300,
};

const EXTRAS = {
  Asientos: 100,
  PeloModerado: 150,
  PeloExcesivo: 200,
};

/* =========================
   MAIN — MOUNT SECTIONS
========================= */

async function mountApp() {
  const app = document.getElementById("app");
  if (!app) return;

  const parts = [
    "sections/header.html",
    "sections/hero.html",
    "sections/fisico.html",
    "sections/domicilio.html",
    "sections/cotizador.html",
    "sections/ejemplos.html",
    "sections/contacto.html",
    "sections/footer.html",
  ];

  const html = [];
  for (const p of parts) {
    const chunk = await loadSection(p);
    html.push(chunk);
  }

  app.innerHTML = html.join("\n");

  initAfterLoad();
}

/* =========================
   COTIZADOR FUNCIONAL
========================= */

function computeQuote() {
  const vehiculo = document.getElementById("vehiculo")?.value || "";
  const paquete = document.getElementById("paquete")?.value || "";
  const suciedad = document.getElementById("suciedad")?.value || "";
  const pago = document.getElementById("pago")?.value || "";

  const extraAsientos = document.getElementById("extraAsientos");
  const extraZona = document.getElementById("extraZona");
  const peloMascota = getRadioValue("peloMascota") || "Ninguno";

  const totalEl = document.getElementById("quoteTotal");
  const breakdownEl = document.getElementById("quoteBreakdown");

  // Habilitación asientos (solo Prime/Deluxe)
  const canAsientos = (paquete === "Prime" || paquete === "Deluxe");
  if (extraAsientos) {
    extraAsientos.disabled = !canAsientos;
    if (!canAsientos) extraAsientos.checked = false;
  }

  // Si faltan campos todavía, muestra placeholder
  if (!vehiculo || !paquete || !suciedad || !pago) {
    if (totalEl) totalEl.textContent = "$0";
    if (breakdownEl) breakdownEl.textContent = "Selecciona opciones para ver el desglose.";
    return { ok: false };
  }

  const base = PRICES?.[paquete]?.[vehiculo]?.[pago];
  if (typeof base !== "number") {
    if (totalEl) totalEl.textContent = "$0";
    if (breakdownEl) breakdownEl.textContent = "No hay precio configurado para esta combinación.";
    return { ok: false };
  }

  const dirtAdd = DIRT_ADD[suciedad] ?? 0;

  const asientosAdd =
    (extraAsientos && extraAsientos.checked && canAsientos) ? EXTRAS.Asientos : 0;

  let peloAdd = 0;
  if (peloMascota === "Moderado") peloAdd = EXTRAS.PeloModerado;
  if (peloMascota === "Excesivo") peloAdd = EXTRAS.PeloExcesivo;

  const zonaFlag = (extraZona && extraZona.checked) ? true : false;

  const total = base + dirtAdd + asientosAdd + peloAdd;

  const parts = [];
  parts.push(`Base: ${money(base)}`);
  if (dirtAdd > 0) parts.push(`Suciedad (${suciedad}): +${money(dirtAdd)}`);
  if (asientosAdd > 0) parts.push(`Retiro asientos: +${money(asientosAdd)}`);
  if (peloAdd > 0) parts.push(`Pelo mascota (${peloMascota}): +${money(peloAdd)}`);
  if (zonaFlag) parts.push(`Área extendida: se confirma`);

  if (totalEl) totalEl.textContent = money(total);
  if (breakdownEl) breakdownEl.innerHTML = parts.join("<br>");

  return {
    ok: true,
    vehiculo,
    paquete,
    suciedad,
    pago,
    base,
    dirtAdd,
    asientosAdd,
    peloMascota,
    peloAdd,
    zonaFlag,
    total,
  };
}

function wireQuoteEvents() {
  const ids = ["vehiculo", "paquete", "suciedad", "pago", "extraAsientos", "extraZona", "zona", "nota"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.tagName === "SELECT") el.addEventListener("change", computeQuote);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.addEventListener("change", computeQuote);
      el.addEventListener("input", computeQuote);
    }
  });

  document.querySelectorAll('input[name="peloMascota"]').forEach((r) => {
    r.addEventListener("change", computeQuote);
  });

  computeQuote();
}

function wireQuoteSubmit() {
  const form = document.getElementById("quoteForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = computeQuote();
    if (!data.ok) {
      alert("Completa vehículo, paquete, suciedad y método de pago.");
      return;
    }

    const zona = document.getElementById("zona")?.value?.trim() || "";
    const nota = document.getElementById("nota")?.value?.trim() || "";

    const paqueteLabel =
      data.paquete === "Essential" ? "Essential" :
      data.paquete === "Prime" ? "Prime" :
      "Deluxe";

    const extrasTxt = [];
    if (data.asientosAdd > 0) extrasTxt.push("Retiro de asientos (+$100)");
    if (data.peloMascota === "Moderado") extrasTxt.push("Pelo de mascota moderado (+$150)");
    if (data.peloMascota === "Excesivo") extrasTxt.push("Pelo de mascota excesivo (+$200)");
    if (data.zonaFlag) extrasTxt.push("Área extendida (confirmar costo)");

    const extrasLine = extrasTxt.length ? extrasTxt.join(", ") : "Ninguno";

    let message =
      "Hola, quiero agendar un servicio a domicilio con AureOn.\n\n" +
      `• Vehículo: ${data.vehiculo}\n` +
      `• Paquete: ${paqueteLabel} (A domicilio)\n` +
      `• Suciedad: ${data.suciedad}\n` +
      `• Pago: ${data.pago}\n` +
      `• Extras: ${extrasLine}\n` +
      `• Total estimado: ${money(data.total)}\n`;

    if (zona) message += `• Zona/Colonia: ${zona}\n`;
    if (nota) message += `• Notas: ${nota}\n`;

    message += "\n¿Me confirmas disponibilidad y horario para agendar?";

    window.open(buildWhatsAppLink(message), "_blank", "noopener");
  });
}

/* =========================
   INIT AFTER LOAD
========================= */

function initAfterLoad() {
  // Año footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // WhatsApp general
  const waGeneral = buildWhatsAppLink(BASE_MESSAGE);

  safeSetHref("navWhatsappMobile", waGeneral);
  safeSetHref("heroWhatsapp", waGeneral);
  safeSetHref("floatWhatsapp", waGeneral);
  safeSetHref("contactWhatsapp", waGeneral);

  // Maps link exacto
  const mapsLink = document.getElementById("mapsLink");
  if (mapsLink) {
    mapsLink.href = `https://www.google.com/maps?q=${PHYSICAL_LAT},${PHYSICAL_LNG}`;
  }

  // Botones "Elegir paquete" (deben tener data-pack="Essential|Prime|Deluxe")
  const selectPaquete = document.getElementById("paquete");
  document.querySelectorAll(".js-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pack = btn.getAttribute("data-pack");
      if (selectPaquete && pack) {
        selectPaquete.value = pack;
        computeQuote();
      }
      scrollToId("#cotizador");
    });
  });

  // Menú móvil
  const burger = document.querySelector(".nav__burger");
  const mobileMenu = document.querySelector(".navmobile");
  if (burger && mobileMenu) {
    const setOpen = (isOpen) => {
      burger.setAttribute("aria-expanded", String(isOpen));
      mobileMenu.hidden = !isOpen;
    };

    setOpen(false);

    burger.addEventListener("click", () => {
      const openNow = burger.getAttribute("aria-expanded") === "true";
      setOpen(!openNow);
    });

    mobileMenu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // Cotizador
  wireQuoteEvents();
  wireQuoteSubmit();
}

/* =========================
   START
========================= */

mountApp().catch((err) => {
  console.error(err);
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `
      <div class="container" style="padding:24px">
        <p style="color:rgba(255,255,255,0.75); line-height:1.6">
          Error cargando secciones. Revisa que exista la carpeta <strong>/sections</strong>
          y que los archivos se llamen exactamente:<br><br>
          header.html, hero.html, fisico.html, domicilio.html, cotizador.html, ejemplos.html, contacto.html, footer.html
        </p>
        <p style="color:rgba(255,255,255,0.6); margin-top:10px">
          Abre el sitio con un servidor local (Live Server), porque <strong>fetch()</strong>
          no funciona bien abriendo el archivo directo (file://).
        </p>
      </div>`;
  }
});

(function () {
  const topBar = document.getElementById("mobileTopBar");
  if (!topBar) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const currentScrollY = window.scrollY;

    // Scroll hacia abajo → ocultar
    if (currentScrollY > lastScrollY && currentScrollY > 80) {
      topBar.classList.add("is-hidden");
    }
    // Scroll hacia arriba → mostrar
    else if (currentScrollY < lastScrollY) {
      topBar.classList.remove("is-hidden");
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  });
})();