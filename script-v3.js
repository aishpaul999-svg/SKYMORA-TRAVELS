/* ================================
   SKYmora travels — Unified Script (FIXED)
   Calendar + Experience + Budget + Passengers + Trip Type
================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 👨‍👩‍👧 Passenger Steppers ---------- */
  document.querySelectorAll('.stepper').forEach(stepper => {
    const dec = stepper.querySelector('.dec');
    const inc = stepper.querySelector('.inc');
    const valueEl = stepper.querySelector('.value');
    let value = parseInt(valueEl.textContent) || 0;

    dec.addEventListener('click', () => {
      if (value > 0) {
        value--;
        valueEl.textContent = value;
      }
    });

    inc.addEventListener('click', () => {
      value++;
      valueEl.textContent = value;
    });
  });

  /* ---------- 🎒 Experience Selector ---------- */
  const selectorBox = document.getElementById('selectorBox');
  const dropdown = document.getElementById('experienceDropdown');
  const hiddenInput = document.getElementById('travelStyle');

  if (selectorBox && dropdown && hiddenInput) {
    selectorBox.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !selectorBox.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    dropdown.querySelectorAll('input[type="checkbox"]').forEach(c => {
      c.addEventListener('change', () => {
        const selected = [...dropdown.querySelectorAll('input:checked')].map(c => c.value);
        hiddenInput.value = selected.join(', ');
        selectorBox.textContent = selected.length ? selected.join(', ') : "Select experiences...";
      });
    });
  }
  
  // === ✨ Close Button for Experience Dropdown ===
  const closeBtn = document.getElementById('closeExperienceList');
  if (closeBtn && dropdown) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.add('hidden');
    });
  }

});

/* === 🧭 SKYmora — One Way / Round Trip Active Toggle (with Smooth UI Sync) === */
document.addEventListener('DOMContentLoaded', () => {
  const tripButtons = document.querySelectorAll('.inline-toggle .toggle');
  const returnDateBox = document.querySelector('.return-date');

  if (!tripButtons.length || !returnDateBox) return;

  tripButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active state from all
      tripButtons.forEach(b => b.classList.remove('active'));

      // Add to clicked one
      btn.classList.add('active');

      // Show or hide return date based on choice
      if (btn.dataset.value === 'return') {
        returnDateBox.classList.add('active');
      } else {
        returnDateBox.classList.remove('active');
      }
    });
  });
});

/* === 🕓 SKYmora travels — Return Timing Toggle (Fixed) === */
document.addEventListener('DOMContentLoaded', () => {
  const tripButtons = document.querySelectorAll('.inline-toggle .toggle');
  const returnTimingDiv = document.getElementById('returnTiming');

  if (tripButtons && returnTimingDiv) {
    // Hide the entire return timing block by default
    returnTimingDiv.classList.add('hidden');

    tripButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.value === 'return') {
          returnTimingDiv.classList.remove('hidden');
        } else {
          returnTimingDiv.classList.add('hidden');
          const retInput = returnTimingDiv.querySelector('input[name="retTime"]');
          if (retInput) retInput.value = '';
        }
      });
    });
  }
});

// Save current background for results page
window.addEventListener('load', () => {
  const bgElement = document.querySelector('.bg');
  if (bgElement) {
    const bgUrl = window.getComputedStyle(bgElement).backgroundImage;
    const cleanUrl = bgUrl.slice(5, -2);
    localStorage.setItem('whisperBackground', cleanUrl);
  }
});

/* ---------- 🧭 Validation for Name + Departure (Enhanced UX) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.querySelector('.cta');
  const nameInput = document.getElementById('name');
  const departureInput = document.getElementById('departure');

  if (startBtn && nameInput && departureInput) {
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // remove old error messages
      document.querySelectorAll('.error-msg').forEach(msg => msg.remove());

      // remove old input error styles
      [nameInput, departureInput].forEach(input => {
        input.classList.remove('input-error');
        input.placeholder = input.dataset.originalPlaceholder || input.placeholder;
      });

      let valid = true;
      let firstInvalid = null;

      if (!nameInput.value.trim()) {
        showError(nameInput, "Full name is required");
        valid = false;
        firstInvalid = firstInvalid || nameInput;
      }

      if (!departureInput.value.trim()) {
        showError(departureInput, "Departure city is required");
        valid = false;
        firstInvalid = firstInvalid || departureInput;
      }

      // Scroll to first invalid input
      if (!valid && firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    });

    // remove error styling when typing
    [nameInput, departureInput].forEach(input => {
      input.addEventListener('input', () => {
        if (input.classList.contains('input-error')) {
          input.classList.remove('input-error');
          input.placeholder = input.dataset.originalPlaceholder;
        }
      });
    });
  }

  function showError(input, message) {
    input.dataset.originalPlaceholder = input.placeholder;
    input.classList.add('input-error');
    input.value = "";
    input.placeholder = message;
  }
});

/* ---------- 🌍 SKYmora travels — Agent Matching & Save ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.querySelector('.cta');
  if (!startBtn) return;

  startBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('name');
    const departureInput = document.getElementById('departure');
    const styleInput = document.getElementById('travelStyle');
    const budgetInput = document.getElementById('budgetRange');

    if (!nameInput || !departureInput) return;

    // Basic validation
    if (!nameInput.value.trim() || !departureInput.value.trim()) return;

    const preferences = (styleInput?.value || "").toLowerCase();
    const budget = parseInt(budgetInput?.value || "0");

    const agents = [
      {
        name: "Sophia Leclerc — Paris, France",
        intro: "Sophia has over 12 years of experience curating intimate and luxurious European escapes. Her itineraries blend culture, charm, and comfort effortlessly.",
        specialties: ["luxury", "romantic", "europe", "beach", "culture"]
      },
      {
        name: "Arjun Mehta — Delhi, India",
        intro: "Arjun has spent nearly a decade crafting heritage and cultural journeys across India. His approach ensures every traveler feels the soul of each destination.",
        specialties: ["culture", "heritage", "india", "family", "adventure"]
      },
      {
        name: "Elena Rossi — Florence, Italy",
        intro: "Elena has designed romantic and art-inspired itineraries for over 11 years. Her philosophy — travel should move your heart as much as your feet.",
        specialties: ["art", "romantic", "europe", "city"]
      },
      {
        name: "Daniel Carter — Cape Town, South Africa",
        intro: "Daniel creates adventure and wildlife safaris for 8 years. He believes exploration should connect you — with nature, people, and yourself.",
        specialties: ["adventure", "wildlife", "safari", "africa"]
      },
      {
        name: "Mika Tanaka — Kyoto, Japan",
        intro: "Mika guides travelers through Japan's serene retreats. Her slow-travel approach helps you find balance, stillness, and subtle beauty.",
        specialties: ["wellness", "calm", "japan", "spiritual", "culture"]
      },
      {
        name: "Lucia Gomez — Buenos Aires, Argentina",
        intro: "Lucia curates soulful, gastronomic journeys that celebrate taste, rhythm, and local culture. Her itineraries are alive with music and color.",
        specialties: ["food", "music", "festival", "latin", "city"]
      },
    ];

    // find the best match
    let bestMatch = null;
    let maxMatches = 0;

    for (const agent of agents) {
      let matchCount = 0;
      for (const tag of agent.specialties) {
        if (preferences.includes(tag)) matchCount++;
      }
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestMatch = agent;
      }
    }

    // if no match, pick one randomly
    if (!bestMatch) {
      bestMatch = agents[Math.floor(Math.random() * agents.length)];
    }

    // save for results page
    localStorage.setItem("whisperAgent", JSON.stringify(bestMatch));
    localStorage.setItem("whisperPref", preferences);
    localStorage.setItem("whisperBudget", budget);
  });
});

/* ===========================
   SKYmora travels — Button Feedback & Glow Effect
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector(".cta");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startBtn.textContent = "Preparing your expert...";
      startBtn.classList.add("loading");

      let dotCount = 0;
      const dots = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        startBtn.textContent = "Preparing your expert" + ".".repeat(dotCount);
      }, 400);

      setTimeout(() => {
        clearInterval(dots);
        startBtn.textContent = "Start My Journey";
      }, 3000);
    });
  }
});

/* === SKYmora — v7 Backgrounds (Final Confirmed Set) === */
document.addEventListener("DOMContentLoaded", () => {
  const backgrounds = [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1602940659805-770d1b3b9911?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=80",
    "https://plus.unsplash.com/premium_photo-1673254850380-ff70514979fe?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1758691737584-a8f17fb34475?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=80"
  ];

  const bgElement = document.querySelector(".bg");
  if (!bgElement) return;

  let current = 0;
  bgElement.style.backgroundSize = "cover";
  bgElement.style.backgroundPosition = "center";
  bgElement.style.transition = "background-image 2s ease-in-out, opacity 2s ease-in-out";
  bgElement.style.backgroundImage = `url('${backgrounds[current]}')`;

  setInterval(() => {
    current = (current + 1) % backgrounds.length;
    const nextImage = backgrounds[current];
    const preload = new Image();
    preload.src = nextImage;
    preload.onload = () => {
      bgElement.style.opacity = "0";
      setTimeout(() => {
        bgElement.style.backgroundImage = `url('${nextImage}')`;
        bgElement.style.opacity = "1";
      }, 1000);
    };
    preload.onerror = () => {
      bgElement.style.backgroundImage = `url('${nextImage}')`;
    };
  }, 11000);
});

/* === 💰 SKYmora — Robust Budget Selector (No NaN / Toggle-safe) === */
(function initBudgetSelector() {
  const slider = document.getElementById("budgetRange");
  const display = document.getElementById("budgetValue");
  const currencySelect = document.getElementById("currencySelect");
  const backToPreset = document.getElementById("backToPreset");

  if (!slider || !display || !currencySelect) return;

  const getSymbol = () => currencySelect.selectedOptions[0]?.dataset.symbol || "$";

  const safeInt = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.floor(n) : 0;
  };

  const clampToBounds = (v) => {
    const min = safeInt(slider.min || 0);
    const max = safeInt(slider.max || 0);
    let n = safeInt(v);
    if (n < min) n = min;
    if (max && n > max) n = max;
    return n;
  };

  const updateDisplay = (val) => {
    const safe = clampToBounds(val);
    const symbol = getSymbol();
    display.textContent = `${symbol}${safe.toLocaleString()}`;
  };

  const updateDropdownLabels = (selectEl) => {
    if (!selectEl || selectEl.tagName.toLowerCase() !== "select") return;
    const symbol = getSymbol();
    Array.from(selectEl.options).forEach(opt => {
      switch (opt.value) {
        case "500": opt.textContent = `${symbol}100 – ${symbol}500`; break;
        case "1000": opt.textContent = `${symbol}500 – ${symbol}1,000`; break;
        case "1500": opt.textContent = `${symbol}1,000 – ${symbol}1,500`; break;
        case "2500": opt.textContent = `${symbol}1,500 – ${symbol}2,500`; break;
        case "4000": opt.textContent = `${symbol}2,500 – ${symbol}4,000`; break;
        case "5000": opt.textContent = `${symbol}4,000 – ${symbol}5,000`; break;
        case "6000": opt.textContent = `${symbol}5,000+`; break;
        case "manual": opt.textContent = ` Set My Own Budget`; break;
      }
    });
  };

  const buildDropdown = () => {
    const sel = document.createElement("select");
    sel.id = "manualBudget";
    sel.innerHTML = `
      <option value="500">500</option>
      <option value="1000">1000</option>
      <option value="1500">1500</option>
      <option value="2500">2500</option>
      <option value="4000">4000</option>
      <option value="5000">5000</option>
      <option value="6000">6000</option>
      <option value="manual">manual</option>
    `;
    updateDropdownLabels(sel);
    return sel;
  };

  const chooseClosestPreset = (sel, currentVal) => {
    const num = safeInt(currentVal);
    let best = null;
    let bestDiff = Infinity;
    Array.from(sel.options).forEach(opt => {
      if (opt.value === "manual") return;
      const v = safeInt(opt.value);
      const diff = Math.abs(v - num);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = opt;
      }
    });
    if (best) best.selected = true;
  };

  const attachSelectHandler = (selectEl) => {
    if (!selectEl) return;
    const newSel = selectEl.cloneNode(true);
    selectEl.replaceWith(newSel);
    updateDropdownLabels(newSel);

    newSel.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "manual") {
        activateManualInput(newSel);
      } else {
        const n = clampToBounds(val);
        slider.value = n;
        updateDisplay(n);
      }
    });
    return newSel;
  };

  const activateManualInput = (currentSelect) => {
    const existing = document.getElementById("manualBudget");
    if (existing && existing.tagName.toLowerCase() === "input") {
      existing.focus();
      return;
    }

    const input = document.createElement("input");
    input.type = "number";
    input.id = "manualBudget";
    input.className = "custom-budget-input";
    input.value = clampToBounds(slider.value || slider.min || 0);
    input.placeholder = "Enter your custom budget...";

    const nodeToReplace = currentSelect || document.getElementById("manualBudget");
    if (nodeToReplace) nodeToReplace.replaceWith(input);

    if (backToPreset) backToPreset.classList.remove("hidden");

    const onInput = () => {
      const raw = input.value;
      const n = clampToBounds(raw === "" ? 0 : raw);
      slider.value = n;
      updateDisplay(n);
    };

    input.addEventListener("input", onInput);

    const restoreOnFinish = () => {
      const val = clampToBounds(input.value === "" ? slider.value : input.value);
      slider.value = val;
      const sel = buildDropdown();
      chooseClosestPreset(sel, val);
      const attached = attachSelectHandler(sel);
      input.replaceWith(attached);
      if (backToPreset) backToPreset.classList.add("hidden");
      updateDisplay(val);
    };

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        restoreOnFinish();
      }
    });

    input.addEventListener("blur", () => {
      restoreOnFinish();
    });

    updateDisplay(input.value);
  };

  const restoreDropdown = () => {
    const current = document.getElementById("manualBudget");
    if (current && current.tagName.toLowerCase() === "select") return;
    const val = current ? clampToBounds(current.value || slider.value) : clampToBounds(slider.value);
    const sel = buildDropdown();
    chooseClosestPreset(sel, val);
    const attached = attachSelectHandler(sel);
    if (current) current.replaceWith(attached);
    if (backToPreset) backToPreset.classList.add("hidden");
    updateDisplay(val);
  };

  let manualEl = document.getElementById("manualBudget");
  if (!manualEl) {
    const manualEntry = document.querySelector(".manual-entry");
    if (manualEntry) {
      const sel = buildDropdown();
      manualEntry.insertBefore(sel, manualEntry.querySelector("#manualInputBox") || null);
      manualEl = sel;
    }
  }

  if (manualEl) {
    if (manualEl.tagName.toLowerCase() === "select") {
      manualEl = attachSelectHandler(manualEl);
    } else if (manualEl.tagName.toLowerCase() === "input") {
      manualEl.addEventListener("input", () => {
        const n = clampToBounds(manualEl.value);
        slider.value = n;
        updateDisplay(n);
      });
    }
  }

  slider.addEventListener("input", (e) => {
    const raw = e.target.value;
    const n = clampToBounds(raw);
    const cur = document.getElementById("manualBudget");
    if (cur && cur.tagName.toLowerCase() === "input") {
      cur.value = n;
    } else if (cur && cur.tagName.toLowerCase() === "select") {
      chooseClosestPreset(cur, n);
    }
    updateDisplay(n);
  });

  currencySelect.addEventListener("change", () => {
    const cur = document.getElementById("manualBudget");
    if (cur && cur.tagName.toLowerCase() === "select") {
      updateDropdownLabels(cur);
    }
    updateDisplay(slider.value);
  });

  if (backToPreset) {
    backToPreset.addEventListener("click", (e) => {
      e.preventDefault();
      restoreDropdown();
    });
  }

  updateDropdownLabels(document.getElementById("manualBudget"));
  updateDisplay(slider.value);
})();

/* === 💰 Instant Manual Label Fix (runs last, always correct) === */
document.addEventListener("DOMContentLoaded", () => {
  const manual = document.getElementById("manualBudget");
  const currency = document.getElementById("currencySelect");
  if (manual && manual.tagName.toLowerCase() === "select") {
    const symbol = currency?.selectedOptions[0]?.dataset.symbol || "$";
    manual.querySelectorAll("option").forEach(opt => {
      switch (opt.value) {
        case "500": opt.textContent = `${symbol}100 – ${symbol}500`; break;
        case "1000": opt.textContent = `${symbol}500 – ${symbol}1,000`; break;
        case "1500": opt.textContent = `${symbol}1,000 – ${symbol}1,500`; break;
        case "2500": opt.textContent = `${symbol}1,500 – ${symbol}2,500`; break;
        case "4000": opt.textContent = `${symbol}2,500 – ${symbol}4,000`; break;
        case "5000": opt.textContent = `${symbol}4,000 – ${symbol}5,000`; break;
        case "6000": opt.textContent = `${symbol}5,000+`; break;
        case "manual": opt.textContent = ` Set My Own Budget`; break;
      }
    });
  }
});

/* === 🌍 SKYmora — Data Bridge to Results Page (FIXED - Trip Days Calculation) === */
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.querySelector('.cta');
  if (!startBtn) return;

  startBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // ✅ Collect required fields
    const name = document.getElementById('name')?.value.trim();
    const nickname = document.getElementById('nickname')?.value.trim() || "";
    const departure = document.getElementById('departure')?.value.trim();
    const destination = document.getElementById('destination')?.value.trim() || "";
    const tripType = document.querySelector('.inline-toggle .active')?.dataset.value || "oneway";
    const departureDate = document.getElementById('departureDate')?.value || "";
    const returnDate = document.getElementById('returnDate')?.value || "";
    const depTime = document.querySelector('input[name="depTime"]')?.value || "";
    const retTime = document.querySelector('input[name="retTime"]')?.value || "";
    const travelStyle = document.getElementById('travelStyle')?.value || "";
    const budget = parseInt(document.getElementById('budgetRange')?.value || "0");
    const currency = document.getElementById('currencySelect')?.value || "";
    const specialRequest = document.getElementById('specialRequest')?.value || "";
    
    // ✅ Get duration from the input field
    const durationInput = document.querySelector('input[name="duration"]');
    const manualDuration = durationInput ? parseInt(durationInput.value) : 7;

    // ✅ Passenger counts
    const adults = parseInt(document.querySelectorAll('.stepper .value')[0].textContent);
    const children = parseInt(document.querySelectorAll('.stepper .value')[1].textContent);
    const infants = parseInt(document.querySelectorAll('.stepper .value')[2].textContent);

    // ✅ FIXED: Calculate trip days correctly based on trip type
    let tripDays = manualDuration; // default to manual input
    
    if (tripType === 'return' && departureDate && returnDate) {
      // For round trips with dates, calculate from dates
      const diff = (new Date(returnDate) - new Date(departureDate)) / (1000 * 60 * 60 * 24);
      tripDays = Math.max(1, Math.round(diff));
    } else if (tripType === 'oneway') {
      // For one-way trips, use the manual duration input
      tripDays = manualDuration;
    }

    // ✅ Minimal required fields check
    if (!name || !departure) {
      alert("Please enter your name and departure city ✔️");
      return;
    }

    // ✅ FINAL DATA sent to backend
    const tripData = {
      name,
      nickname,
      departure,
      destination,
      tripType,
      departureDate,
      returnDate,
      depTime,
      retTime,
      travelStyle,
      specialRequest,
      budget,
      currency,
      adults,
      children,
      infants,
      tripDays
    };

    console.log("✅ Trip Data being saved:", tripData); // Debug log

    localStorage.setItem("skymoraTrip", JSON.stringify(tripData));
    
    // ✅ FIXED: Navigate to results page after validation passes
    window.location.href = "results.html";
  });
});

/* === ✈️ SKYmora — Smart Autocomplete for Departure & Destination === */
const apiHost = "wft-geo-db.p.rapidapi.com";
const apiKey = "2973d523acmsh4055859454fac7ep128f86jsn38948f8f7996";

async function fetchCities(query) {
  const url = `https://${apiHost}/v1/geo/cities?namePrefix=${encodeURIComponent(query)}&limit=6&sort=-population`;
  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": apiHost
    }
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result.data.map(c => ({
      label: `${c.city}, ${c.country} (${c.region || ""})`,
      value: c.city
    }));
  } catch (error) {
    console.error("City fetch failed:", error);
    return [];
  }
}

function setupAutocomplete(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const list = document.createElement("ul");
  list.className = "autocomplete-list";
  wrapper.appendChild(list);

  input.addEventListener("input", async () => {
    const query = input.value.trim();
    list.innerHTML = "";
    if (query.length < 2) return;

    const cities = await fetchCities(query);
    cities.forEach(city => {
      const li = document.createElement("li");
      li.textContent = city.label;
      li.addEventListener("click", () => {
        input.value = city.value;
        list.innerHTML = "";
      });
      list.appendChild(li);
    });
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) list.innerHTML = "";
  });
}

// 🛫 Initialize both fields
document.addEventListener("DOMContentLoaded", () => {
  setupAutocomplete("departure");
  setupAutocomplete("destination");
});