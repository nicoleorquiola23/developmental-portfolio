/* ============================================================
   admin.js — Admin panel: form handlers, cascade, IndexedDB
   ============================================================ */

// ---------- Constants ----------
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

function saveImageToDB(storeName, id, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const blob = new Blob([e.target.result], { type: file.type });
      if (!db) return reject('DB not open');
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put({ id, data: blob, type: file.type });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function deleteImageFromDB(storeName, id) {
  if (!db) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getImageURLFromDB(storeName, id) {
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
function getData() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

function setData(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMessage');
  msgEl.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function showStatus(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2000);
}

// ---------- Admin tab navigation ----------
document.querySelectorAll('.admin-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(b => {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    const section = btn.dataset.section;
    document.querySelectorAll('.admin-section').forEach(el => el.style.display = 'none');
    document.getElementById(`section-${section}`).style.display = 'block';
  });
});

document.querySelector('.admin-tab')?.click();

// ---------- Load existing data into forms ----------
function loadForms() {
  const data = getData();
  if (!data) return;

  // Home
  if (data.home) {
    document.getElementById('inpAbout').value = data.home.aboutMe || '';
    document.getElementById('inpPhilosophy').value = data.home.philosophy || '';
    document.getElementById('inpQuote').value = data.home.quote || '';
  }

  // Assessment
  if (data.assessment) {
    document.getElementById('inpAssessment').value = data.assessment.interpretation || '';
  }

  // Reflection
  if (data.reflection) {
    document.getElementById('inpReflection').value = data.reflection.content || '';
  }

  // Retrospection
  if (data.retrospection) {
    document.getElementById('inpRetrospection').value = data.retrospection.content || '';
  }

  initEvidenceCascade();
}

// ---------- Save handlers ----------
document.getElementById('btnSaveHome').addEventListener('click', async () => {
  const data = getData() || {};
  data.home = {
    aboutMe: document.getElementById('inpAbout').value,
    philosophy: document.getElementById('inpPhilosophy').value,
    quote: document.getElementById('inpQuote').value
  };
  setData(data);
  showToast('Home content saved');

  const fileInput = document.getElementById('inpAvatar');
  if (fileInput.files.length > 0) {
    await saveImageToDB('profile_images', 'avatar', fileInput.files[0]);
  }
});

document.getElementById('btnSaveAssessment').addEventListener('click', async () => {
  const data = getData() || {};
  data.assessment = {
    imageKey: 'assessment_photo',
    interpretation: document.getElementById('inpAssessment').value
  };
  setData(data);
  showToast('Assessment saved');

  const fileInput = document.getElementById('inpAssessmentImg');
  if (fileInput.files.length > 0) {
    await saveImageToDB('assessment_images', 'assessment_photo', fileInput.files[0]);
  }
});

document.getElementById('btnSaveReflection').addEventListener('click', () => {
  const data = getData() || {};
  data.reflection = { content: document.getElementById('inpReflection').value };
  setData(data);
  showToast('Reflection saved');
});

document.getElementById('btnSaveRetrospection').addEventListener('click', () => {
  const data = getData() || {};
  data.retrospection = { content: document.getElementById('inpRetrospection').value };
  setData(data);
  showToast('Retrospection saved');
});

// ---------- Evidence cascade ----------
let pendingEvidenceFile = null;

function makeEvidenceImgKey(year, category, term) {
  return `ev_${year}_${category}_${term}`;
}

function initEvidenceCascade() {
  const yearSelect = document.getElementById('evYear');
  const catSelect = document.getElementById('evCategory');
  const termSelect = document.getElementById('evTerm');

  yearSelect.innerHTML = '';
  YEARS.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = YEAR_LABELS[y];
    yearSelect.appendChild(opt);
  });

  function updateCategories() {
    catSelect.innerHTML = '';
    CATEGORIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = CATEGORY_LABELS[c];
      catSelect.appendChild(opt);
    });
    updateTerms();
    loadCurrentEvidence();
  }

  function updateTerms() {
    termSelect.innerHTML = '';
    TERMS.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = TERM_LABELS[t];
      termSelect.appendChild(opt);
    });
    loadCurrentEvidence();
  }

  yearSelect.addEventListener('change', () => { updateCategories(); });
  catSelect.addEventListener('change', () => { updateTerms(); });
  termSelect.addEventListener('change', loadCurrentEvidence);

  updateCategories();
}

function updateNodeLabel() {
  const year = document.getElementById('evYear').value;
  const cat = document.getElementById('evCategory').value;
  const term = document.getElementById('evTerm').value;
  const label = document.getElementById('selectedNodeLabel');
  if (year && cat && term) {
    label.textContent = `${YEAR_LABELS[year]} › ${CATEGORY_LABELS[cat]} › ${TERM_LABELS[term]}`;
  } else {
    label.textContent = '';
  }
}

function loadCurrentEvidence() {
  const year = document.getElementById('evYear').value;
  const cat = document.getElementById('evCategory').value;
  const term = document.getElementById('evTerm').value;
  if (!year || !cat || !term) return;

  updateNodeLabel();

  const data = getData();
  const text = data?.evidences?.[year]?.[cat]?.[term]?.text || '';
  document.getElementById('evDescription').value = text;

  pendingEvidenceFile = null;
  document.getElementById('evImagePreview').classList.add('hidden');
  document.getElementById('evImageInput').value = '';

  // Show existing image if present
  const imgKey = data?.evidences?.[year]?.[cat]?.[term]?.img;
  const existingContainer = document.getElementById('evExistingImage');
  if (imgKey) {
    getImageURLFromDB('evidence_images', imgKey).then(url => {
      if (url) {
        document.getElementById('evExistingImgTag').src = url;
        existingContainer.classList.remove('hidden');
        existingContainer.dataset.imgKey = imgKey;
      } else {
        existingContainer.classList.add('hidden');
      }
    });
  } else {
    existingContainer.classList.add('hidden');
  }
}

document.getElementById('evImageInput').addEventListener('change', (e) => {
  const preview = document.getElementById('evImagePreview');
  if (e.target.files.length > 0) {
    pendingEvidenceFile = e.target.files[0];
    const url = URL.createObjectURL(pendingEvidenceFile);
    preview.querySelector('img').src = url;
    preview.classList.remove('hidden');
    document.getElementById('evExistingImage').classList.add('hidden');
  }
});

document.getElementById('btnSaveEvidence').addEventListener('click', async () => {
  const year = document.getElementById('evYear').value;
  const cat = document.getElementById('evCategory').value;
  const term = document.getElementById('evTerm').value;
  const desc = document.getElementById('evDescription').value;

  if (!year || !cat || !term) {
    alert('Please select Year, Category, and Term.');
    return;
  }

  const data = getData() || {};
  if (!data.evidences) data.evidences = {};
  if (!data.evidences[year]) data.evidences[year] = {};
  if (!data.evidences[year][cat]) data.evidences[year][cat] = {};
  if (!data.evidences[year][cat][term]) data.evidences[year][cat][term] = { text: '', img: '' };

  data.evidences[year][cat][term].text = desc;

  if (pendingEvidenceFile) {
    const imgKey = makeEvidenceImgKey(year, cat, term);
    await saveImageToDB('evidence_images', imgKey, pendingEvidenceFile);
    data.evidences[year][cat][term].img = imgKey;
    pendingEvidenceFile = null;
    document.getElementById('evImagePreview').classList.add('hidden');
    document.getElementById('evImageInput').value = '';
  }

  setData(data);
  showToast('Evidence node saved');
  loadCurrentEvidence();
});

// ---------- Remove evidence image ----------
document.getElementById('btnRemoveEvidenceImg').addEventListener('click', async () => {
  const year = document.getElementById('evYear').value;
  const cat = document.getElementById('evCategory').value;
  const term = document.getElementById('evTerm').value;
  if (!year || !cat || !term) return;

  const imgKey = makeEvidenceImgKey(year, cat, term);
  await deleteImageFromDB('evidence_images', imgKey);

  const data = getData() || {};
  if (data.evidences?.[year]?.[cat]?.[term]) {
    data.evidences[year][cat][term].img = '';
    setData(data);
  }

  document.getElementById('evExistingImage').classList.add('hidden');
  document.getElementById('evExistingImgTag').src = '';
  showToast('Image removed');
});

// ---------- Image previews ----------
document.getElementById('inpAvatar').addEventListener('change', (e) => {
  const preview = document.getElementById('avatarPreview');
  if (e.target.files.length > 0) {
    preview.querySelector('img').src = URL.createObjectURL(e.target.files[0]);
    preview.classList.remove('hidden');
  }
});

document.getElementById('inpAssessmentImg').addEventListener('change', (e) => {
  const preview = document.getElementById('assessmentImgPreview');
  if (e.target.files.length > 0) {
    preview.querySelector('img').src = URL.createObjectURL(e.target.files[0]);
    preview.classList.remove('hidden');
  }
});

// ---------- Init ----------
(async function init() {
  db = await openDB();
  loadForms();
})();
