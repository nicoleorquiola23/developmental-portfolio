/* ============================================================
   app.js — Portfolio SPA: navigation, localStorage, IndexedDB
   ============================================================ */

// ---------- Default content (exact JSON schema) ----------
const DEFAULTS = {
  portfolioData: {
    home: {
      aboutMe: "Hello! I am Nicole Orquiola, an aspiring Biology Professor. This developmental portfolio showcases my academic journey, experiences, and growth through various activities that demonstrate my competencies as a future educator and lifelong learner.",
      philosophy: "I believe that biology education should inspire curiosity, critical thinking, and appreciation for life. As a future educator, I aspire to create meaningful learning experiences that encourage students to explore, question, and grow.",
      quote: "Like every organism in nature, growth takes time, adaptation, and continuous learning. This portfolio represents my journey of becoming a future Biology educator."
    },
    assessment: {
      imageKey: "assessment_photo",
      interpretation: ""
    },
    evidences: {
      freshman: {
        digital_literate: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        design_thinker: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        discerning_compassionate: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        dynamic_learner: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        global_citizen: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } }
      },
      sophomore: {
        digital_literate: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        design_thinker: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        discerning_compassionate: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        dynamic_learner: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        global_citizen: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } }
      },
      junior: {
        digital_literate: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        design_thinker: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        discerning_compassionate: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        dynamic_learner: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        global_citizen: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } }
      },
      senior: {
        digital_literate: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        design_thinker: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        discerning_compassionate: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        dynamic_learner: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } },
        global_citizen: { term1: { text: "", img: "" }, term2: { text: "", img: "" }, term3: { text: "", img: "" } }
      }
    },
    reflection: { content: "" },
    retrospection: { content: "" }
  }
};

const STORAGE_KEY = 'portfolioData';

const YEARS = ['freshman', 'sophomore', 'junior', 'senior'];
const CATEGORIES = ['digital_literate', 'design_thinker', 'discerning_compassionate', 'dynamic_learner', 'global_citizen'];
const TERMS = ['term1', 'term2', 'term3'];

const YEAR_LABELS = {
  freshman: 'Freshman',
  sophomore: 'Sophomore',
  junior: 'Junior',
  senior: 'Senior'
};

const CATEGORY_LABELS = {
  digital_literate: 'Digital Literate',
  design_thinker: 'Design Thinker',
  discerning_compassionate: 'Discerning Compassionate',
  dynamic_learner: 'Dynamic Learner',
  global_citizen: 'Global Citizen'
};

const TERM_LABELS = {
  term1: 'Term 1',
  term2: 'Term 2',
  term3: 'Term 3'
};

// ---------- IndexedDB ----------
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('PortfolioDB', 1);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('profile_images'))
        d.createObjectStore('profile_images', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('gallery_images'))
        d.createObjectStore('gallery_images', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('assessment_images'))
        d.createObjectStore('assessment_images', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('evidence_images'))
        d.createObjectStore('evidence_images', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getImageFromDB(storeName, id) {
  if (!db || !id) return Promise.resolve(null);
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result && req.result.data instanceof Blob) {
        resolve(URL.createObjectURL(req.result.data));
      } else {
        resolve(null);
      }
    };
    req.onerror = () => resolve(null);
  });
}

// ---------- localStorage helpers ----------
function getPortfolioData() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val) {
      const parsed = JSON.parse(val);
      if (parsed && parsed.home) return parsed;
    }
  } catch {}
  return null;
}

function seedDefaults() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS.portfolioData));
  }
}

// ---------- Render ----------
function renderHome() {
  const data = getPortfolioData() || DEFAULTS.portfolioData;
  const home = data.home;

  document.getElementById('aboutBody').textContent = home.aboutMe || '';
  document.getElementById('philosophyBody').textContent = home.philosophy || '';
  document.getElementById('quoteBody').textContent = home.quote || '';

  // Sidebar name — static
  getImageFromDB('profile_images', 'avatar').then(url => {
    if (url) {
      document.getElementById('avatarImg').src = url;
      document.getElementById('heroAvatarImg').src = url;
    }
  });
}

function renderAssessments() {
  const data = getPortfolioData() || DEFAULTS.portfolioData;
  const assessment = data.assessment;

  document.getElementById('assessmentBody').textContent = assessment.interpretation || 'No interpretation yet.';

  getImageFromDB('assessment_images', assessment.imageKey).then(url => {
    const container = document.getElementById('assessmentImg');
    if (url) {
      container.innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded-xl" alt="Assessment photo">`;
      container.classList.remove('hidden');
    } else {
      container.innerHTML = '';
      container.classList.add('hidden');
    }
  });
}

function renderEvidences() {
  const data = getPortfolioData() || DEFAULTS.portfolioData;
  const evidences = data.evidences || {};
  const tabsContainer = document.getElementById('evidenceYears');
  const categoriesContainer = document.getElementById('evidenceCategories');
  let activeYear = YEARS[0];

  function renderTabs() {
    tabsContainer.innerHTML = '';
    YEARS.forEach(year => {
      const btn = document.createElement('button');
      btn.className = `evidence-tab px-5 py-2 rounded-full border text-sm font-medium ${year === activeYear ? 'active' : ''}`;
      btn.textContent = YEAR_LABELS[year] || year;
      btn.dataset.year = year;
      btn.addEventListener('click', () => {
        activeYear = year;
        renderTabs();
        renderCategories();
      });
      tabsContainer.appendChild(btn);
    });
  }

  function renderCategories() {
    categoriesContainer.innerHTML = '';
    const yearData = evidences[activeYear] || {};

    CATEGORIES.forEach(category => {
      const catData = yearData[category] || {};
      const card = document.createElement('div');
      card.className = 'evidence-category-card glass rounded-2xl p-6';

      let termsHtml = '';
      TERMS.forEach(term => {
        const termData = catData[term] || { text: '', img: '' };
        termsHtml += `
          <div class="border-t border-white/10 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
            <h4 class="text-sm font-semibold text-primary mb-2">${TERM_LABELS[term] || term}</h4>
            <p class="text-muted text-sm leading-relaxed whitespace-pre-line mb-3">${termData.text || '<span class="text-faint italic">No description.</span>'}</p>
            <div id="evImg_${activeYear}_${category}_${term}" class="evidence-img-container"></div>
          </div>
        `;
      });

      card.innerHTML = `
        <h3 class="text-lg font-semibold text-primary mb-4">${CATEGORY_LABELS[category] || category}</h3>
        ${termsHtml}
      `;
      categoriesContainer.appendChild(card);

      // Load evidence images
      TERMS.forEach(term => {
        const termData = catData[term] || {};
        const imgKey = termData.img;
        const container = document.getElementById(`evImg_${activeYear}_${category}_${term}`);
        if (container && imgKey) {
          getImageFromDB('evidence_images', imgKey).then(url => {
            if (url) {
              const wrapper = document.createElement('div');
              wrapper.className = 'w-32 h-32 rounded-lg overflow-hidden evidence-img-clickable';
              wrapper.innerHTML = `<img src="${url}" class="w-full h-full object-cover" alt="Evidence image">`;
              wrapper.addEventListener('click', () => openLightbox(url));
              container.appendChild(wrapper);
            }
          });
        }
      });
    });
  }

  renderTabs();
  renderCategories();
}

function renderReflection() {
  const data = getPortfolioData() || DEFAULTS.portfolioData;
  document.getElementById('reflectionBody').textContent = data.reflection?.content || '';
}

function renderRetrospection() {
  const data = getPortfolioData() || DEFAULTS.portfolioData;
  document.getElementById('retrospectionBody').textContent = data.retrospection?.content || '';
}

// ---------- Lightbox ----------
function openLightbox(url) {
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightboxImg').src = '';
  document.body.style.overflow = '';
}

// ---------- Navigation ----------
function navigateTo(page) {
  document.querySelectorAll('.section-frame').forEach(el => {
    el.classList.add('hidden-section');
    el.classList.remove('entering');
  });
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.remove('hidden-section');
    target.classList.add('entering');
  }

  const link = document.querySelector(`.sidebar-link[data-page="${page}"]`);
  if (link) link.classList.add('active');

  window.location.hash = page;
}

// ---------- Init ----------
async function init() {
  db = await openDB();
  seedDefaults();
  renderHome();
  renderAssessments();
  renderEvidences();
  renderReflection();
  renderRetrospection();

  // Sidebar clicks
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);

      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('open');
    });
  });

  // Mobile menu toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
  });
  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  });

  // Lightbox
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Hash routing
  const hash = window.location.hash.replace('#', '');
  if (hash && ['home', 'assessment', 'evidences', 'reflection', 'retrospection'].includes(hash)) {
    navigateTo(hash);
  } else {
    navigateTo('home');
  }
}

document.addEventListener('DOMContentLoaded', init);
