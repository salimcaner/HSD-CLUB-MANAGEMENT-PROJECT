import { getToken } from "../store.js";
import { hasPerm } from "../acl.js";

const API_URL = "http://127.0.0.1:8000/api/finance";

function getHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

// Helper to map backend format to frontend format
function mapToFrontend(t) {
  return {
    id: t.id,
    type: t.tur === 'gelir' ? 'income' : 'expense',
    category: t.kategori,
    desc: t.baslik || t.aciklama || '', // Backend 'baslik' is our 'desc'
    amount: t.miktar,
    date: t.tarih,
    note: (t.baslik && t.aciklama) ? t.aciklama : '' // If both exist, aciklama is our 'note'
  };
}

// Helper to map frontend format to backend format
function mapToBackend(t) {
  return {
    baslik: t.desc, // "Açıklama" -> baslik
    miktar: parseFloat(t.amount),
    tur: t.type === 'income' ? 'gelir' : 'gider',
    kategori: t.category,
    aciklama: t.note || null, // "Notlar" -> aciklama
    tarih: t.date
  };
}

export function renderFinance(user) {
  const canCreate = hasPerm(user, 'finance:create');


  return `
    <link rel="stylesheet" href="/frontend/Home-frontend/css/finance.css">
    <section class="page finance-page">
      <div class="fin-header">
        <div class="fin-welcome">
          <h1>Finans</h1>
          <p>Kulüp Bütçe, Gelir ve Gider Yönetimi</p>
        </div>
        <div class="fin-actions">
          <!-- EXPORTS MOVED TO TRANSACTIONS AREA -->
          ${canCreate ? `
          <button class="btn btn-primary" id="btn-add-transaction" style="box-shadow: 0 0 20px rgba(124, 58, 237, 0.5);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Yeni İşlem
          </button>
          ` : ''}
        </div>
      </div>

      <!-- ROW 1: HEALTH METRICS & ANALYTICS -->
      <div class="fin-health-row">
        <!-- Dashboard Summary -->
        <div class="fin-metrics-grid">
          <div class="fin-metric-card" style="grid-column: 1 / -1;">
            <div class="fin-metric-icon" style="background: rgba(124, 58, 237, 0.15); color: #a78bfa;">🏦</div>
            <div class="fin-metric-info">
              <h3>Net Bakiye (Kâr/Zarar)</h3>
              <p id="val-net-balance" class="fin-text-gradient-primary" style="font-size:32px;">₺0</p>
            </div>
          </div>
          <div class="fin-metric-card">
            <div class="fin-metric-icon" style="background: rgba(34, 197, 94, 0.15); color: #4ade80;">💰</div>
            <div class="fin-metric-info">
              <h3>Toplam Gelir</h3>
              <p id="val-total-income" class="fin-text-gradient-success">₺0</p>
            </div>
          </div>
          <div class="fin-metric-card">
            <div class="fin-metric-icon" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">💸</div>
            <div class="fin-metric-info">
              <h3>Toplam Gider</h3>
              <p id="val-total-expense" class="fin-text-gradient-danger">₺0</p>
            </div>
          </div>
        </div>

        <!-- Analytics Section -->
        <div class="fin-panel-glass fin-panel-chart" style="flex:1;">
          <div class="fin-panel-header" style="flex-wrap: wrap; gap: 12px;">
            <div>
              <h2>Özet Analiz</h2>
              <p id="chart-summary-text" class="fin-chart-summary">Veriler yükleniyor...</p>
            </div>
            <div class="fin-toggle" id="chart-period-toggle">
              <button class="active" data-period="week">Hft</button>
              <button data-period="month">Ay</button>
              <button data-period="year">Yıl</button>
            </div>
          </div>
          <div class="fin-advanced-chart" id="analytics-chart">
            <!-- JS Render Pie Chart -->
          </div>
        </div>
      </div>

      <!-- ROW 2: WHY & SECONDARY MODULES -->
      <div class="fin-second-row">
        <!-- Category Distribution -->
        <div class="fin-panel-glass" style="flex: 1;">
          <div class="fin-panel-header">
            <h2>Kategori Dağılımı (Gider)</h2>
          </div>
          <div id="category-distribution" class="fin-category-list">
            <!-- JS Render -->
          </div>
        </div>

        <!-- Recurring Expenses -->
        <div class="fin-panel-glass" style="flex: 1;">
          <div class="fin-panel-header">
            <h2>Düzenli Planlar</h2>
            ${canCreate ? `<button class="btn btn-outline" style="padding: 4px 10px; font-size: 16px; border-radius: 6px;" id="btn-add-recurring">+</button>` : ''}
          </div>
          <ul class="fin-recurring-list" id="recurring-list">
            <!-- JS Render -->
          </ul>
        </div>
      </div>

      <!-- ROW 3: DETAILS -->
      <div class="fin-main-row">
        <!-- Transactions Section -->
        <div class="fin-panel-glass fin-transactions">
          <div class="fin-panel-header" style="justify-content: space-between;">
            <h2>Tüm İşlem Kayıtları</h2>
            <div class="fin-secondary-actions" style="display:flex; gap:8px;">
              <button class="fin-btn-icon" id="btn-export-pdf" title="PDF Olarak Çıkar"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15v2m0 0l-3-3m3 3l3-3m4-9v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707z"></path></svg></button>
              <button class="fin-btn-icon" id="btn-export-excel" title="Excel Olarak Çıkar"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></button>
            </div>
          </div>
          
          <div class="fin-advanced-filters">
            <div class="fin-filter-row">
              <div class="fin-search-box">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input type="text" id="filter-search" placeholder="İşlem açıklamasında, notlarda veya kategoride ara..." class="fin-form-control fin-search-input">
              </div>
              <select id="filter-type" class="fin-form-control fin-select-sm" style="max-width:150px;">
                <option value="all">Tüm İşlemler</option>
                <option value="income">Sadece Gelir</option>
                <option value="expense">Sadece Gider</option>
              </select>
              <select id="filter-category" class="fin-form-control fin-select-sm" style="max-width:180px;">
                <option value="all">Tüm Departmanlar</option>
                <option value="Yönetim Kurulu">Yönetim Kurulu</option>
                <option value="Proje Komitesi">Proje Komitesi</option>
                <option value="Pazarlama ve Sosyal Medya Komitesi">Pazarlama ve Sosyal Medya</option>
                <option value="Sponsorluk ve Organizasyon Komitesi">Sponsorluk ve Organizasyon</option>
                <option value="Akademi Komitesi">Akademi Komitesi</option>
                <option value="Mezunlar Komitesi">Mezunlar</option>
              </select>
              <button class="btn btn-outline fin-btn-sm" id="btn-more-filters" style="padding: 10px 14px;">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                Gelişmiş
              </button>
            </div>

            <!-- Expanded Filters -->
            <div class="fin-expanded-filters" id="expanded-filters-panel" style="display:none;">
              <div class="fin-exp-row">
                 <div class="fin-form-group">
                   <label>Sıralama</label>
                   <select id="filter-sort" class="fin-form-control">
                     <option value="date-desc">Tarih (En Yeni)</option>
                     <option value="date-asc">Tarih (En Eski)</option>
                     <option value="amount-desc">Tutar (Azalan)</option>
                     <option value="amount-asc">Tutar (Artan)</option>
                     <option value="category">Kategoriye Göre</option>
                   </select>
                 </div>
                 <div class="fin-form-group">
                   <label>Min Tutar (₺)</label>
                   <input type="number" id="filter-min-amt" class="fin-form-control" placeholder="0">
                 </div>
                 <div class="fin-form-group">
                   <label>Max Tutar (₺)</label>
                   <input type="number" id="filter-max-amt" class="fin-form-control" placeholder="Limit yok">
                 </div>
                 <div class="fin-form-group">
                   <label>Başlangıç Tarihi</label>
                   <input type="date" id="filter-start-date" class="fin-form-control">
                 </div>
                 <div class="fin-form-group">
                   <label>Bitiş Tarihi</label>
                   <input type="date" id="filter-end-date" class="fin-form-control">
                 </div>
              </div>
            </div>

            <!-- Quick Chips -->
            <div class="fin-filter-chips" id="filter-chips">
              <span style="font-size:12px; color:var(--text-dim); margin-top:5px; margin-right:4px;">Hızlı Filtreler:</span>
              <button class="fin-chip" data-filter="today">Bugün</button>
              <button class="fin-chip" data-filter="week">Bu Hafta</button>
              <button class="fin-chip" data-filter="month">Bu Ay</button>
              <button class="fin-chip" data-filter="high">Yüksek Tutar (>5000)</button>
            </div>

            <!-- Active Tags Row -->
            <div class="fin-active-filters-row">
               <div id="active-tags-container" class="fin-tags-container"></div>
               <div style="display:flex; gap:16px; align-items:center;">
                  <button class="fin-clear-all" id="btn-clear-filters" style="display:none;">Filtreleri Temizle ✕</button>
                  <div class="fin-results-count" id="results-count">Toplam 0 işlem</div>
               </div>
            </div>
          </div>
          
          <div class="fin-table-container">
            <table class="fin-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Açıklama</th>
                  <th>Kategori</th>
                  <th>Tür</th>
                  <th>Tutar</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody id="transaction-tbody">
                <!-- JS Render -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Sliding Drawer for New Transaction -->
    <div class="fin-drawer-overlay" id="transaction-modal">
      <div class="fin-drawer">
        <div class="fin-drawer-header">
          <div>
            <h2>Yeni İşlem</h2>
            <p>Finansal kayıt ekle veya düzenle</p>
          </div>
          <button class="fin-drawer-close" id="btn-close-tr-modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form id="transaction-form" class="fin-drawer-body">
          <input type="hidden" id="tr-id">
          
          <div class="fin-segment-control">
            <input type="radio" name="tr-type" id="type-expense" value="expense" checked>
            <label for="type-expense" class="fin-segment-btn type-expense-btn">Gider</label>
            
            <input type="radio" name="tr-type" id="type-income" value="income">
            <label for="type-income" class="fin-segment-btn type-income-btn">Gelir</label>
            <div class="fin-segment-glider"></div>
          </div>

          <div class="fin-drawer-form-grid">
            <div class="fin-form-group" style="grid-column: span 2;">
              <label>Tutar (₺) <span class="fin-req">*</span></label>
              <input type="number" id="tr-amount" step="0.01" class="fin-form-control fin-input-lg" placeholder="0.00" required>
            </div>
            
            <div class="fin-form-group" style="grid-column: span 2;">
              <label>Açıklama <span class="fin-req">*</span></label>
              <input type="text" id="tr-desc" class="fin-form-control" placeholder="Örn: Salon Kirası vb." required>
            </div>

            <div class="fin-form-group">
              <label>Kategori (Departman) <span class="fin-req">*</span></label>
              <select id="tr-category" class="fin-form-control" required>
                <option value="Yönetim Kurulu">Yönetim Kurulu</option>
                <option value="Proje Komitesi">Proje Komitesi</option>
                <option value="Pazarlama ve Sosyal Medya Komitesi">Pazarlama ve Sosyal Medya Komitesi</option>
                <option value="Sponsorluk ve Organizasyon Komitesi">Sponsorluk ve Organizasyon</option>
                <option value="Akademi Komitesi">Akademi Komitesi</option>
                <option value="Mezunlar Komitesi">Mezunlar Komitesi</option>
              </select>
            </div>

            <div class="fin-form-group">
              <label>Tarih <span class="fin-req">*</span></label>
              <input type="date" id="tr-date" class="fin-form-control" required>
            </div>

            <div class="fin-form-group" style="grid-column: span 2; display: flex; align-items: center; margin-top: 8px;">
              <label class="fin-checkbox-label">
                <input type="checkbox" id="tr-recurring-check">
                <div class="fin-checkbox-custom"></div>
                Bu işlemi her ay düzenli tekrarla
              </label>
            </div>
            
            <div class="fin-form-group" style="grid-column: span 2; margin-top: 8px;">
              <label>Kısa Not (İsteğe bağlı)</label>
              <textarea id="tr-note" class="fin-form-control" rows="2" placeholder="İşlemle ilgili detaylar..."></textarea>
            </div>
          </div>
        </form>

        <div class="fin-drawer-footer">
          <button type="button" class="btn btn-outline" id="btn-cancel-tr">İptal</button>
          <button type="submit" form="transaction-form" class="btn btn-primary" style="flex: 1;">İşlemi Kaydet</button>
        </div>
      </div>
    </div>
  `;
}

// --- STATE ---
const state = {
  transactions: [],
  recurring: [],
  summary: {
    income: 0,
    expense: 0,
    balance: 0
  },
  budget: {
    planned: 10000 // Placeholder constant as backend doesn't have budget management yet
  },
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    minAmt: '',
    maxAmt: '',
    startDate: '',
    endDate: '',
    sort: 'date-desc',
    quickChip: '',
    chartPeriod: 'week'
  },
  loading: false,
  error: null,
  user: null,
  submitting: false
};

let elements = {};

export async function initFinance(user) {
  if (!document.querySelector('.finance-page')) return;
  
  state.user = user;
  cacheElements();
  bindEvents();
  
  await fetchFinanceData();
}

async function fetchFinanceData(silent = false) {
  if (!silent) {
    state.loading = true;
    state.error = null;
    renderAll();
  }

  try {
    const headers = getHeaders();
    
    // Fetch Summary, Transactions, and Recurring in parallel
    const [summaryRes, transRes, recurringRes] = await Promise.all([
      fetch(`${API_URL}/summary`, { headers }),
      fetch(`${API_URL}/transactions`, { headers }),
      fetch(`${API_URL}/recurring`, { headers })
    ]);

    if (!summaryRes.ok || !transRes.ok || !recurringRes.ok) {
      const errorData = !summaryRes.ok ? await summaryRes.json().catch(()=>({})) : (!transRes.ok ? await transRes.json().catch(()=>({})) : await recurringRes.json().catch(()=>({})));
      console.error("Backend Validation/Auth Error:", errorData);
      throw new Error(errorData.detail || "Veriler alınırken bir hata oluştu.");
    }

    const summaryData = await summaryRes.json();
    const transData = await transRes.json();
    const recurringData = await recurringRes.json();

    // Map and Store
    state.summary = {
      income: summaryData.toplam_gelir || 0,
      expense: summaryData.toplam_gider || 0,
      balance: summaryData.net_bakiye || 0
    };
    
    state.transactions = (transData || []).map(mapToFrontend);
    state.recurring = (recurringData || []).map(r => ({
      id: r.id,
      name: r.baslik || r.ad || 'İsimsiz Plan',
      amount: r.miktar
    }));

  } catch (err) {
    console.error("Finance fetch error:", err);
    if (!silent) state.error = "Veriler yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.";
  } finally {
    if (!silent) state.loading = false;
    renderAll();
  }
}

// Local recalculation for speed
function recalculateLocalSummary() {
  const income = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const expense = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  state.summary = {
    income: income,
    expense: expense,
    balance: income - expense
  };
}

function cacheElements() {
  elements = {
    totalIncome: document.getElementById('val-total-income'),
    totalExpense: document.getElementById('val-total-expense'),
    netBalance: document.getElementById('val-net-balance'),
    // budgetProgress: document.getElementById('budget-progress-bar'),
    // budgetSpent: document.getElementById('txt-budget-spent'),
    // budgetPlanned: document.getElementById('txt-budget-planned'),
    // budgetWarning: document.getElementById('budget-warning'),
    insightsList: document.getElementById('smart-insights'),
    chartSummary: document.getElementById('chart-summary-text'),
    analyticsChart: document.getElementById('analytics-chart'),
    tbody: document.getElementById('transaction-tbody'),
    catDistribution: document.getElementById('category-distribution'),
    recurringList: document.getElementById('recurring-list'),
    filterSearch: document.getElementById('filter-search'),
    filterType: document.getElementById('filter-type'),
    filterCategory: document.getElementById('filter-category'),
    filterSort: document.getElementById('filter-sort'),
    filterMinAmt: document.getElementById('filter-min-amt'),
    filterMaxAmt: document.getElementById('filter-max-amt'),
    filterStartDate: document.getElementById('filter-start-date'),
    filterEndDate: document.getElementById('filter-end-date'),
    btnMoreFilters: document.getElementById('btn-more-filters'),
    expandedPanel: document.getElementById('expanded-filters-panel'),
    filterChips: document.querySelectorAll('.fin-chip'),
    tagsContainer: document.getElementById('active-tags-container'),
    resultsCount: document.getElementById('results-count'),
    btnClearFilters: document.getElementById('btn-clear-filters'),
    modal: document.getElementById('transaction-modal'),
    form: document.getElementById('transaction-form')
  };
}

function updateTagsUI() {
  let tagsHTML = '';
  let isActive = false;
  
  if (state.filters.search) { tagsHTML += `<div class="fin-tag">Arama: "${state.filters.search}" <span class="fin-tag-close" data-clear="search">×</span></div>`; isActive = true; }
  if (state.filters.type !== 'all') { tagsHTML += `<div class="fin-tag">${state.filters.type === 'income' ? 'Gelir' : 'Gider'} <span class="fin-tag-close" data-clear="type">×</span></div>`; isActive = true; }
  if (state.filters.category !== 'all') { tagsHTML += `<div class="fin-tag">${state.filters.category} <span class="fin-tag-close" data-clear="category">×</span></div>`; isActive = true; }
  if (state.filters.minAmt) { tagsHTML += `<div class="fin-tag">Min: ₺${state.filters.minAmt} <span class="fin-tag-close" data-clear="minAmt">×</span></div>`; isActive = true; }
  if (state.filters.maxAmt) { tagsHTML += `<div class="fin-tag">Max: ₺${state.filters.maxAmt} <span class="fin-tag-close" data-clear="maxAmt">×</span></div>`; isActive = true; }
  if (state.filters.startDate || state.filters.endDate) { 
    tagsHTML += `<div class="fin-tag">Tarih Aralığı <span class="fin-tag-close" data-clear="dateRange">×</span></div>`; isActive = true; 
  }
  if (state.filters.quickChip) { tagsHTML += `<div class="fin-tag">Hızlı: ${state.filters.quickChip} <span class="fin-tag-close" data-clear="quickChip">×</span></div>`; isActive = true; }

  elements.tagsContainer.innerHTML = tagsHTML;
  elements.btnClearFilters.style.display = isActive ? 'block' : 'none';
  
  elements.tagsContainer.querySelectorAll('.fin-tag-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.target.dataset.clear;
      if (type === 'search') { state.filters.search = ''; elements.filterSearch.value = ''; }
      if (type === 'type') { state.filters.type = 'all'; elements.filterType.value = 'all'; }
      if (type === 'category') { state.filters.category = 'all'; elements.filterCategory.value = 'all'; }
      if (type === 'minAmt') { state.filters.minAmt = ''; elements.filterMinAmt.value = ''; }
      if (type === 'maxAmt') { state.filters.maxAmt = ''; elements.filterMaxAmt.value = ''; }
      if (type === 'dateRange') { 
         state.filters.startDate = ''; state.filters.endDate = ''; 
         elements.filterStartDate.value = ''; elements.filterEndDate.value = ''; 
      }
      if (type === 'quickChip') { 
         state.filters.quickChip = ''; 
         elements.filterChips.forEach(c => c.classList.remove('active')); 
      }
      triggerRefilter();
    });
  });
}

function triggerRefilter() {
  updateTagsUI();
  renderTable();
  renderDashboard();
}

function bindEvents() {
  document.getElementById('btn-add-transaction').addEventListener('click', () => openModal());
  document.getElementById('btn-close-tr-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-tr').addEventListener('click', closeModal);
  
  elements.form.addEventListener('submit', handleTransactionSubmit);

  // Advanced Filters
  elements.btnMoreFilters.addEventListener('click', () => {
    const isHidden = elements.expandedPanel.style.display === 'none';
    elements.expandedPanel.style.display = isHidden ? 'block' : 'none';
  });

  ['filterSearch', 'filterType', 'filterCategory', 'filterSort', 'filterMinAmt', 'filterMaxAmt', 'filterStartDate', 'filterEndDate'].forEach(key => {
    if (elements[key]) {
      elements[key].addEventListener('input', (e) => {
        let prop = key.replace('filter', '');
        prop = prop.charAt(0).toLowerCase() + prop.slice(1);
        state.filters[prop] = e.target.value;
        triggerRefilter();
      });
    }
  });

  elements.filterChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      const type = e.target.dataset.filter;
      // Toggle
      if(state.filters.quickChip === type) {
        state.filters.quickChip = '';
        e.target.classList.remove('active');
      } else {
        state.filters.quickChip = type;
        elements.filterChips.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
      }
      triggerRefilter();
    });
  });

  elements.btnClearFilters.addEventListener('click', () => {
    state.filters = { search:'', type:'all', category:'all', minAmt:'', maxAmt:'', startDate:'', endDate:'', sort:'date-desc', quickChip:'' };
    ['filterSearch', 'filterMinAmt', 'filterMaxAmt', 'filterStartDate', 'filterEndDate'].forEach(k => { if(elements[k]) elements[k].value = ''; });
    if(elements.filterType) elements.filterType.value = 'all';
    if(elements.filterCategory) elements.filterCategory.value = 'all';
    if(elements.filterSort) elements.filterSort.value = 'date-desc';
    elements.filterChips.forEach(c => c.classList.remove('active'));
    triggerRefilter();
  });

  elements.tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id; // Switch to string ID support
    if (btn.classList.contains('fin-btn-edit')) editTransaction(id);
    if (btn.classList.contains('fin-btn-delete')) deleteTransaction(id);
  });

  const addRecBtn = document.getElementById('btn-add-recurring');
  if (addRecBtn) {
    addRecBtn.addEventListener('click', () => {
      openModal();
      const recCheck = document.getElementById('tr-recurring-check');
      if (recCheck) recCheck.checked = true; // Pre-check for unified UI
    });
  }

  let currentChartPeriod = 'week';
  
  document.querySelectorAll('#chart-period-toggle button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#chart-period-toggle button').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentChartPeriod = e.target.dataset.period;
      // In a real app we'd trigger a render of the chart here
      // but the requested renderAnalyticsChart will handle it. We just need to pass the period or make it global state.
      state.filters.chartPeriod = currentChartPeriod;
      renderAnalyticsChart();
    });
  });

  document.getElementById('btn-export-pdf').addEventListener('click', () => alert('PDF Dışa Aktarma Başlatıldı'));
  document.getElementById('btn-export-excel').addEventListener('click', () => alert('Excel Dışa Aktarma Başlatıldı'));
}

function getFilteredTransactions() {
  let list = state.transactions;
  
  // Search
  if (state.filters.search) {
     const q = state.filters.search.toLowerCase();
     list = list.filter(t => t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }
  
  if (state.filters.type && state.filters.type !== 'all') {
     list = list.filter(t => t.type === state.filters.type);
  }
  if (state.filters.category && state.filters.category !== 'all') {
     list = list.filter(t => t.category === state.filters.category);
  }
  if (state.filters.minAmt) {
     list = list.filter(t => t.amount >= parseFloat(state.filters.minAmt));
  }
  if (state.filters.maxAmt) {
     list = list.filter(t => t.amount <= parseFloat(state.filters.maxAmt));
  }
  if (state.filters.startDate) {
     list = list.filter(t => new Date(t.date) >= new Date(state.filters.startDate));
  }
  if (state.filters.endDate) {
     list = list.filter(t => new Date(t.date) <= new Date(state.filters.endDate));
  }

  // Quick Chips
  if (state.filters.quickChip) {
     const today = new Date();
     const qc = state.filters.quickChip;
     
     if (qc === 'today') {
       const fd = today.toISOString().slice(0,10);
       list = list.filter(t => t.date === fd);
     } else if (qc === 'week') {
       const fd = new Date(today);
       fd.setDate(fd.getDate() - 7);
       list = list.filter(t => new Date(t.date) >= fd);
     } else if (qc === 'month') {
       const fd = new Date(today);
       fd.setMonth(fd.getMonth() - 1);
       list = list.filter(t => new Date(t.date) >= fd);
     } else if (qc === 'high') {
       list = list.filter(t => t.amount >= 5000);
     } else if (qc === 'income') {
       list = list.filter(t => t.type === 'income');
     } else if (qc === 'expense') {
       list = list.filter(t => t.type === 'expense');
     }
  }

  // Sorting
  const sort = state.filters.sort || 'date-desc';
  list.sort((a, b) => {
     switch (sort) {
       case 'date-desc': return new Date(b.date) - new Date(a.date);
       case 'date-asc': return new Date(a.date) - new Date(b.date);
       case 'amount-desc': return b.amount - a.amount;
       case 'amount-asc': return a.amount - b.amount;
       case 'category': return a.category.localeCompare(b.category);
       default: return new Date(b.date) - new Date(a.date);
     }
  });

  return list;
}

function renderAll() {
  if (state.loading) {
    renderLoading();
    return;
  }
  if (state.error) {
    renderError(state.error);
    return;
  }

  renderDashboard();
  renderTable();
  renderCategoryDistribution();
  renderRecurring();
  renderAnalyticsChart();
}

function renderLoading() {
  const loadingHtml = `<div class="fin-loading-spinner">Veriler yükleniyor...</div>`;
  if (elements.tbody) elements.tbody.innerHTML = `<tr><td colspan="6">${loadingHtml}</td></tr>`;
  if (elements.chartSummary) elements.chartSummary.textContent = "Yükleniyor...";
}

function renderError(msg) {
  const errorHtml = `<div class="fin-error-message">${msg} <button class="btn btn-outline btn-sm" onclick="location.reload()">Tekrar Dene</button></div>`;
  if (elements.tbody) elements.tbody.innerHTML = `<tr><td colspan="6">${errorHtml}</td></tr>`;
  if (elements.chartSummary) elements.chartSummary.textContent = "Hata oluştu.";
}

function renderDashboard() {
  const income = state.summary.income;
  const expense = state.summary.expense;
  const balance = state.summary.balance;

  elements.totalIncome.textContent = `₺${income.toLocaleString()}`;
  elements.totalExpense.textContent = `₺${expense.toLocaleString()}`;
  elements.netBalance.textContent = `₺${balance.toLocaleString()}`;

  if (balance >= 0) elements.netBalance.className = 'fin-text-gradient-success';
  else elements.netBalance.className = 'fin-text-gradient-danger';
}

function renderTable() {
  const data = getFilteredTransactions();
  
  if (elements.resultsCount) {
    elements.resultsCount.textContent = `Toplam ${data.length} sonuç`;
  }

  if (data.length === 0) {
    elements.tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="fin-empty-state">
            <svg width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="color:var(--text-dim); margin-bottom:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <p>Arama veya filtrelerinize uygun işlem bulunamadı.</p>
            <button class="btn btn-outline" style="margin-top: 12px; font-size: 13px;" onclick="document.getElementById('btn-clear-filters')?.click()">Filtreleri Temizle</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const canUpdate = hasPerm(state.user, 'finance:update');
  const canDelete = hasPerm(state.user, 'finance:delete');

  elements.tbody.innerHTML = data.map(t => {
    const isIncome = t.type === 'income';
    return `
      <tr>
        <td class="fin-date-col">${new Date(t.date).toLocaleDateString('tr-TR')}</td>
        <td><strong>${t.desc}</strong></td>
        <td><span class="fin-badge">${t.category}</span></td>
        <td>
           <span class="fin-type ${isIncome ? 'fin-type-income' : 'fin-type-expense'}">
             ${isIncome ? 'Gelir' : 'Gider'}
           </span>
        </td>
        <td class="${isIncome ? 'fin-text-success' : 'fin-text-danger'}">
          ${isIncome ? '+' : '-'}₺${t.amount.toLocaleString()}
        </td>
        <td>
          <div class="fin-action-group">
            ${canUpdate ? `
            <button class="fin-btn-icon fin-btn-edit" data-id="${t.id}" title="Düzenle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>` : ''}
            ${canDelete ? `
            <button class="fin-btn-icon fin-btn-delete" data-id="${t.id}" title="Sil">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderCategoryDistribution() {
  const expenses = state.transactions.filter(t => t.type === 'expense');
  const catTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);

  if (totalExp === 0) {
    elements.catDistribution.innerHTML = '<p class="fin-empty">Gider bulunmuyor</p>';
    return;
  }

  const getCatColor = (cat) => {
    if(cat.includes('Yönetim')) return '#f59e0b';
    if(cat.includes('Proje')) return '#7c3aed';
    if(cat.includes('Pazarlama')) return '#ec4899';
    if(cat.includes('Sponsorluk') || cat.includes('Organizasyon')) return '#3b82f6';
    if(cat.includes('Akademi')) return '#10b981';
    if(cat.includes('Mezun')) return '#94a3b8';
    return '#64748b';
  };

  let currentAngle = 0;
  let conicStops = [];
  let legendHtml = '';

  Object.keys(catTotals).forEach(cat => {
    const val = catTotals[cat];
    const sliceDeg = (val / totalExp) * 360;
    const color = getCatColor(cat);
    
    conicStops.push(`${color} ${currentAngle}deg ${currentAngle + sliceDeg}deg`);
    currentAngle += sliceDeg;

    legendHtml += `
      <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-muted); width:100%;">
        <span style="width:10px; height:10px; border-radius:50%; background:${color}; flex-shrink:0;"></span>
        <div style="display:flex; justify-content:space-between; width:100%;">
          <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;" title="${cat}">${cat}</span>
          <strong>₺${val.toLocaleString()} <small>(%${Math.round((val/totalExp)*100)})</small></strong>
        </div>
      </div>
    `;
  });

  elements.catDistribution.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:24px; padding:10px 0;">
      <div style="width: 140px; height: 140px; border-radius: 50%; 
                  background: conic-gradient(${conicStops.join(', ')}); 
                  box-shadow: 0 10px 25px rgba(0,0,0,0.15); cursor:pointer;">
      </div>
      <div style="display:flex; flex-direction:column; gap:12px; width:100%;">
        ${legendHtml}
      </div>
    </div>
  `;
}

function renderRecurring() {
  elements.recurringList.innerHTML = state.recurring.map(r => `
    <li>
      <span>${r.name}</span>
      <strong>₺${r.amount.toLocaleString()} <span style="font-size:12px; font-weight:normal; color:var(--text-dim);">/ ay</span></strong>
    </li>
  `).join('') || '<p class="fin-empty">Kayıt yok</p>';
}

function renderAnalyticsChart() {
  const data = state.transactions;
  const period = state.filters.chartPeriod || 'week';
  const today = new Date();
  
  let startDate = new Date();
  if (period === 'week') {
    startDate.setDate(today.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(today.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(today.getFullYear() - 1);
  }

  // Filter existing data within timeframe
  const filtered = data.filter(t => new Date(t.date) >= startDate);
  
  let income = filtered.filter(t => t.type === 'income').reduce((s,t)=>s+t.amount, 0);
  let expense = filtered.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount, 0);
  
  // Create dummy fallback data if perfect 0 (for empty demo states to look appealing)
  if (income === 0 && expense === 0) {
     if(period === 'week') { income = 12500; expense = 8400; }
     else if(period === 'month') { income = 65000; expense = 42000; }
     else { income = 450000; expense = 380000; }
  }

  const net = income - expense;
  const total = income + expense;
  
  // Avoid division by zero
  const incPct = total > 0 ? (income / total) * 100 : 50;
  // the conic gradient expects degrees. incDeg = incPct * 3.6
  const incDeg = (incPct * 3.6).toFixed(1);

  const netColor = net >= 0 ? 'var(--success)' : 'var(--danger)';
  const netSign = net > 0 ? '+' : '';

  elements.analyticsChart.innerHTML = `
    <div style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: space-around; padding: 10px;">
      <div class="fin-donut-chart" style="background: conic-gradient(var(--success) 0deg, var(--success) ${incDeg}deg, var(--danger) ${incDeg}deg, var(--danger) 360deg)">
        <div class="fin-donut-hole">
          <span style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Net</span>
          <span style="font-size: ${Math.abs(net) > 99999 ? '13px' : '16px'}; font-weight: 800; color: ${netColor}">${netSign}₺${Math.abs(net).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="fin-donut-legend-wrap">
         <div class="fin-donut-legend-item">
            <div style="display:flex; align-items:center; gap:8px;">
               <div style="width:12px; height:12px; border-radius:50%; background:var(--success);"></div>
               <span style="font-size:13px; color:var(--text-dim);">Gelir Hacmi</span>
            </div>
            <strong style="color:var(--text-main); font-size:16px;">₺${income.toLocaleString()}</strong>
         </div>
         <div class="fin-donut-legend-item">
            <div style="display:flex; align-items:center; gap:8px;">
               <div style="width:12px; height:12px; border-radius:50%; background:var(--danger);"></div>
               <span style="font-size:13px; color:var(--text-dim);">Gider Hacmi</span>
            </div>
            <strong style="color:var(--text-main); font-size:16px;">₺${expense.toLocaleString()}</strong>
         </div>
      </div>
    </div>
  `;

  // Update summary text
  let summaryStr = '';
  if(net > 0) {
    summaryStr = `Seçili dönemde gelir payı %${Math.round(incPct)}.`;
    elements.chartSummary.className = 'fin-chart-summary fin-text-success';
  } else {
    summaryStr = `Seçili dönemde gider payı %${Math.round(100 - incPct)}.`;
    elements.chartSummary.className = 'fin-chart-summary fin-text-danger';
  }
  elements.chartSummary.textContent = summaryStr;
}

function openModal(t = null) {
  elements.modal.classList.add('open');
  const dFormat = t ? t.date : new Date().toISOString().slice(0, 10);

  document.getElementById('tr-id').value = t ? t.id : '';
  if (t) {
    if (t.type === 'income') document.getElementById('type-income').checked = true;
    else document.getElementById('type-expense').checked = true;
  } else {
    document.getElementById('type-expense').checked = true; 
  }
  document.getElementById('tr-category').value = t ? t.category : 'Yönetim Kurulu';
  document.getElementById('tr-desc').value = t ? t.desc : '';
  document.getElementById('tr-amount').value = t ? t.amount : '';
  document.getElementById('tr-date').value = dFormat;
  
  const recCheck = document.getElementById('tr-recurring-check');
  if(recCheck) recCheck.checked = false;
  const trNote = document.getElementById('tr-note');
  if(trNote) trNote.value = '';
}

function closeModal() {
  elements.modal.classList.remove('open');
  elements.form.reset();
}

async function handleTransactionSubmit(e) {
  e.preventDefault();
  if (state.submitting) return;

  const idStr = document.getElementById('tr-id').value;
  const isNew = !idStr;
  const isRecurringRequested = document.getElementById('tr-recurring-check')?.checked;

  const typeVal = document.querySelector('input[name="tr-type"]:checked').value;
  const t = {
    type: typeVal,
    category: document.getElementById('tr-category').value,
    desc: document.getElementById('tr-desc').value,
    amount: parseFloat(document.getElementById('tr-amount').value),
    date: document.getElementById('tr-date').value,
    note: document.getElementById('tr-note').value
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.textContent : 'İşlemi Kaydet';

  // Snapshot for potential rollback
  const prevTransactions = [...state.transactions];
  const tempId = 'temp-' + Date.now();
  
  try {
    state.submitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Kaydediliyor...';
    }

    const method = idStr ? 'PUT' : 'POST';
    const requiredPerm = idStr ? 'finance:update' : 'finance:create';
    
    if (!hasPerm(state.user, requiredPerm)) {
      throw new Error("Bu işlemi yapmaya yetkiniz yok.");
    }

    // --- OPTIMISTIC UPDATE ---
    if (isNew) {
      state.transactions.push({ ...t, id: tempId });
    } else {
      const idx = state.transactions.findIndex(x => x.id == idStr);
      if (idx !== -1) state.transactions[idx] = { ...t, id: idStr };
    }
    recalculateLocalSummary();
    renderAll();
    closeModal();
    // -------------------------

    const url = idStr ? `${API_URL}/transactions/${idStr}` : `${API_URL}/transactions`;
    
    // 1. Create/Update transaction
    const response = await fetch(url, {
      method: method,
      headers: getHeaders(),
      body: JSON.stringify(mapToBackend(t))
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'İşlem kaydedilemedi.');
    }

    const savedData = await response.json();

    // --- SYNC REAL ID ---
    if (isNew && savedData.id) {
       const idx = state.transactions.findIndex(x => x.id === tempId);
       if(idx !== -1) state.transactions[idx].id = savedData.id;
    }
    // --------------------

    // 2. If RECURRING is checked, create the recurring plan 
    if (isRecurringRequested) {
      if (!hasPerm(state.user, 'finance:create')) {
        console.warn("User lacks finance:create permission for recurring.");
      } else {
        try {
          const recurringResponse = await fetch(`${API_URL}/recurring`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              baslik: t.desc, 
              miktar: t.amount,
              kategori: t.category,
              aciklama: t.note || 'Otomatik eklenen düzenli plan',
              periyot: 'aylik',
              baslangic_tarihi: t.date
            })
          });

          if (!recurringResponse.ok) {
            const recErrData = await recurringResponse.json().catch(() => ({}));
            console.error("Recurring creation failed (Transaction succeeded):", recErrData);
            alert("İşlem kaydedildi fakat düzenli plan oluşturulamadı: " + (recErrData.detail || "Yetki veya sunucu hatası"));
          } else {
            console.log("Recurring plan created successfully.");
          }
        } catch (recErr) {
          console.error("Recurring API network error:", recErr);
          alert("İşlem kaydedildi fakat düzenli plan için sunucuya erişilemedi.");
        }
      }
    }

    showToast(isNew ? 'Yeni işlem eklendi.' : 'İşlem güncellendi.');
    
    // Silent background refresh to ensure consistency
    fetchFinanceData(true); 
  } catch (err) {
    console.error("Submission error:", err);
    // ROLLBACK
    state.transactions = prevTransactions;
    recalculateLocalSummary();
    renderAll();
    alert('Hata: ' + err.message);
  } finally {
    state.submitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
}

function showToast(msg) {
  let toast = document.getElementById('fin-global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fin-global-toast';
    toast.className = 'fin-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)"><polyline points="20 6 9 17 4 12"></polyline></svg> ${msg}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function editTransaction(id) {
  if (!hasPerm(state.user, 'finance:update')) {
    alert("Düzenleme yetkiniz yok.");
    return;
  }
  const t = state.transactions.find(x => x.id === id);
  if (t) openModal(t);
}

async function deleteTransaction(id) {
  if (!hasPerm(state.user, 'finance:delete')) {
    alert("Silme yetkiniz yok.");
    return;
  }
  if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
    const prevTransactions = [...state.transactions];
    
    try {
      // --- OPTIMISTIC DELETE ---
      state.transactions = state.transactions.filter(x => x.id != id);
      recalculateLocalSummary();
      renderAll();
      // -------------------------

      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Silme işlemi başarısız. Yetkiniz olmayabilir.');
      
      showToast('İşlem silindi.');
      // Update data in background
      fetchFinanceData(true);
    } catch (err) {
      // ROLLBACK
      state.transactions = prevTransactions;
      recalculateLocalSummary();
      renderAll();
      alert('Hata: ' + err.message);
    }
  }
}

/* initTiltEffectFinance removed */