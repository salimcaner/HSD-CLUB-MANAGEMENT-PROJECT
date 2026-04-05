let projectsData = [];

let allUsers = [];

let globalUser = null;
let currentView = 'list';
let currentProjectId = null;

import { getToken } from "../store.js";
import { hasPerm } from "../acl.js";
const API_URL = "http://localhost:8000";

export function renderProjects(user) {
  globalUser = user;
  const canCreate = hasPerm(globalUser, 'projects:create');
  const newProjectBtnHtml = canCreate
    ? `<button id="btn-new-project" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Yeni Proje Ekle
      </button>`
    : '';

  return `
        <link rel="stylesheet" href="/frontend/Home-frontend/css/projects.css">
        <div class="projects-page">
            <div class="projects-header">
                <div class="projects-title-block">
                    <h1>Projeler</h1>
                </div>
                ${newProjectBtnHtml}
            </div>
            
            <div id="projects-content-area"></div>
        </div>

        <!-- NEW PROJECT MODAL -->
        <div id="modal-new-project" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Yeni Proje</h2>
                    <button class="modal-close window-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Proje Adı</label>
                        <input type="text" id="inp-project-name" placeholder="Proje adını giriniz">
                    </div>
                    <div class="form-group">
                        <label>Açıklama</label>
                        <input type="text" id="inp-project-desc" placeholder="Proje detayları">
                    </div>
                    <div class="form-group">
                        <label>Yürütücü Ekle (Project Manager)</label>
                        <div style="display: flex; gap: 8px;">
                            <select id="inp-project-manager" style="flex: 1;">
                                <option value="" disabled selected>Yürütücü Seçiniz</option>
                            </select>
                            <button class="btn btn-ghost" id="btn-add-pm-to-list" style="padding: 0 12px;">Ekle</button>
                        </div>
                        <div id="selected-pms-container" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
                            <!-- Selected PMs will appear as tags here -->
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost window-close-btn">İptal</button>
                    <button class="btn btn-primary" id="save-new-project">Oluştur</button>
                </div>
            </div>
        </div>

        <!-- ADD MEMBER MODAL -->
        <div id="modal-add-member" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Üye Ekle</h2>
                    <button class="modal-close window-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Üye Adı Soyadı</label>
                        <select id="inp-member-name">
                            <option value="" disabled selected>Sistemdeki Üyelerden Seçin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Rolü / Alanı</label>
                        <input type="text" id="inp-member-role" placeholder="Örn: Frontend, Tasarım...">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost window-close-btn">İptal</button>
                    <button class="btn btn-primary" id="save-new-member">Ekle</button>
                </div>
            </div>
        </div>

        <!-- ADD TASK MODAL -->
        <div id="modal-add-task" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Görev Ata</h2>
                    <button class="modal-close window-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Görev Başlığı</label>
                        <input type="text" id="inp-task-title" placeholder="Yapılacak iş">
                    </div>
                    <div class="form-group">
                        <label>Kime Atanacak?</label>
                        <select id="inp-task-assignee">
                            <!-- Options rendered dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Durum</label>
                        <select id="inp-task-status">
                            <option value="Yapılacak">Yapılacak</option>
                            <option value="Devam Ediyor">Devam Ediyor</option>
                            <option value="Bitti">Bitti</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost window-close-btn">İptal</button>
                    <button class="btn btn-primary" id="save-new-task">Kaydet</button>
                </div>
            </div>
        </div>
    `;
}

export async function initProjects() {
  await fetchSystemUsers();
  await fetchProjects();
  renderContentArea();
  bindGlobalEvents();
}

async function fetchProjects() {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/projects/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    if (!res.ok) throw new Error("Projeler getirilemedi");
    projectsData = await res.json() || [];
  } catch (error) {
    console.error("Projeler API Hatası:", error);
  }
}

async function fetchSystemUsers() {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/users/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    if (!res.ok) throw new Error("Kullanıcılar getirilemedi");
    allUsers = await res.json() || [];
  } catch (error) {
    console.error("API Hatası:", error);
  }
}

function getManagersDisplay(managerIds) {
  if (!managerIds || managerIds.length === 0) return "Atanmadı";
  return managerIds.map(id => {
    const user = allUsers.find(u => String(u.id) === String(id));
    return user ? `${user.first_name} ${user.last_name}` : "Bilinmeyen";
  }).join(", ");
}

function renderContentArea() {
  const container = document.getElementById('projects-content-area');
  if (!container) return;

  if (currentView === 'list') {
    container.innerHTML = generateListView();
    bindListViewEvents();
  } else if (currentView === 'detail' && currentProjectId) {
    container.innerHTML = generateDetailView();
    bindDetailViewEvents();
  }
}

function generateListView() {
  if (projectsData.length === 0) {
    return `<div class="empty-state">Henüz proje bulunmuyor. Yeni bir proje ekleyebilirsiniz.</div>`;
  }

  const canDelete = hasPerm(globalUser, 'projects:delete');

  let cardsHtml = projectsData.map(p => `
        <div class="project-card" data-id="${p.id}">
            <div class="project-card-header">
                <h3>${p.name}</h3>
                <div class="project-managers-list" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                    ${(p.managers || []).map(mId => `
                        <span class="project-manager-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            ${allUsers.find(u => String(u.id) === String(mId)) ? `${allUsers.find(u => String(u.id) === String(mId)).first_name} ${allUsers.find(u => String(u.id) === String(mId)).last_name}` : 'Bilinmeyen'}
                        </span>
                    `).join('')}
                </div>
            </div>
            <p class="project-desc">${p.description || ''}</p>
            <div class="project-stats">
                <div class="stat">
                    <span class="stat-val">${p.members.length}</span>
                    <span class="stat-label">Üye</span>
                </div>
                <div class="stat">
                    <span class="stat-val">${p.tasks.length}</span>
                    <span class="stat-label">Görev</span>
                </div>
            </div>
            <div class="project-actions">
                <button class="btn btn-ghost btn-view-project" data-id="${p.id}">Detayları Gör</button>
                ${canDelete ? `
                <button class="btn btn-icon-simple btn-delete-project" data-id="${p.id}" title="Projeyi Sil">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CF0A2C" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14H7L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path></svg>
                </button>
                ` : ''}
            </div>
        </div>
    `).join('');

  return `
        <div class="projects-grid">
            ${cardsHtml}
        </div>
    `;
}

function generateDetailView() {
  const project = projectsData.find(p => p.id === currentProjectId);
  if (!project) {
    currentView = 'list';
    renderContentArea();
    return '';
  }

  const canUpdate = hasPerm(globalUser, 'projects:update');

  // Members list
  let membersHtml = project.members.map(m => `
        <li class="member-item">
            <div class="member-info">
                <strong>${m.name}</strong>
                <span class="member-role">${m.role}</span>
            </div>
            ${canUpdate ? `
            <button class="btn-icon-simple btn-remove-member" data-id="${m.id}" title="Üyeyi Çıkar">
                <span>&times;</span>
            </button>
            ` : ''}
        </li>
    `).join('');

  // Tasks Kanban
  let todoTasks = project.tasks.filter(t => t.status === 'Yapılacak');
  let inProgressTasks = project.tasks.filter(t => t.status === 'Devam Ediyor');
  let doneTasks = project.tasks.filter(t => t.status === 'Bitti');

  const generateTaskCard = (t) => {
    const assigneeName = project.members.find(m => String(m.id) === String(t.assigneeId))?.name || 'Bilinmiyor';
    const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('tr-TR') : '-';
    return `
            <div class="task-card" data-task-id="${t.id}">
                <div class="task-title">${t.title}</div>
                <div class="task-meta" style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="task-assignee">${assigneeName}</span>
                    <span style="font-size: 10px; color: var(--text-dim);">${dateStr}</span>
                </div>
                <div class="task-actions">
                    <select class="task-status-select" data-task-id="${t.id}">
                        <option value="Yapılacak" ${t.status === 'Yapılacak' ? 'selected' : ''}>Yapılacak</option>
                        <option value="Devam Ediyor" ${t.status === 'Devam Ediyor' ? 'selected' : ''}>Devam Ediyor</option>
                        <option value="Bitti" ${t.status === 'Bitti' ? 'selected' : ''}>Bitti</option>
                    </select>
                    <button class="btn-icon-simple btn-delete-task" data-task-id="${t.id}">
                        <span>&times;</span>
                    </button>
                </div>
            </div>
        `;
  };

  return `
        <div class="project-detail-header">
            <button id="btn-back-to-list" class="btn btn-ghost">
                &larr; Projelere Dön
            </button>
            <div class="project-detail-title">
                <h2>${project.name}</h2>
                <p>${project.description || ''}</p>
            </div>
            <div class="project-detail-manager">
                <span>Yürütücüler:</span> ${getManagersDisplay(project.managers)}
            </div>
        </div>

        <div class="project-detail-layout">
            <div class="project-sidebar">
                <div class="sidebar-header">
                    <h3>Ekip Üyeleri</h3>
                    ${canUpdate ? `<button id="btn-add-member" class="btn btn-primary btn-sm">+ Üye</button>` : ''}
                </div>
                <ul class="members-list">
                    ${membersHtml.length ? membersHtml : '<li class="empty-text">Henüz üye eklenmemiş.</li>'}
                </ul>
            </div>
            
            <div class="project-main">
                <div class="main-header">
                    <h3>Görevler (Kanban)</h3>
                    <button id="btn-add-task" class="btn btn-primary btn-sm">+ Görev Ekle</button>
                </div>
                
                <div class="kanban-board">
                    <div class="kanban-column">
                        <h4 class="k-todo">Yapılacaklar (${todoTasks.length})</h4>
                        <div class="kanban-items">
                            ${todoTasks.map(generateTaskCard).join('')}
                        </div>
                    </div>
                    <div class="kanban-column">
                        <h4 class="k-inprogress">Devam Ediyor (${inProgressTasks.length})</h4>
                        <div class="kanban-items">
                            ${inProgressTasks.map(generateTaskCard).join('')}
                        </div>
                    </div>
                    <div class="kanban-column">
                        <h4 class="k-done">Bitenler (${doneTasks.length})</h4>
                        <div class="kanban-items">
                            ${doneTasks.map(generateTaskCard).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// EVENTS

function bindGlobalEvents() {
  // New Project Modal
  const btnNew = document.getElementById('btn-new-project');
  const modalNew = document.getElementById('modal-new-project');

  if (btnNew) {
    btnNew.addEventListener('click', () => {
      window._selectedPMs = [];
      updateSelectedPMsUI();
      const pmSelect = document.getElementById('inp-project-manager');
      if (pmSelect) {
        let opts = '<option value="" disabled selected>Yürütücü Seçiniz</option>';
        allUsers.forEach(u => {
          opts += `<option value="${u.id}">${u.first_name || ''} ${u.last_name || ''}</option>`;
        });
        pmSelect.innerHTML = opts;
      }
      modalNew.classList.add('open');
    });
  }

  // Add PM to list button
  document.getElementById('btn-add-pm-to-list')?.addEventListener('click', () => {
    const pmSelect = document.getElementById('inp-project-manager');
    const mId = pmSelect.value;
    if (!mId) return;
    if (window._selectedPMs.includes(mId)) return;

    window._selectedPMs.push(mId);
    updateSelectedPMsUI();
    pmSelect.value = "";
  });

  function updateSelectedPMsUI() {
    const container = document.getElementById('selected-pms-container');
    if (!container) return;
    container.innerHTML = window._selectedPMs.map(mId => {
      const user = allUsers.find(u => String(u.id) === String(mId));
      const name = user ? `${user.first_name} ${user.last_name}` : "Bilinmeyen";
      return `
        <div class="pm-tag" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 4px 8px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
          ${name}
          <span class="remove-pm" data-id="${mId}" style="cursor: pointer; color: var(--text-dim);">&times;</span>
        </div>
      `;
    }).join("");

    container.querySelectorAll('.remove-pm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        window._selectedPMs = window._selectedPMs.filter(pmId => pmId !== id);
        updateSelectedPMsUI();
      });
    });
  }

  // Close Modals
  document.querySelectorAll('.window-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal-overlay').classList.remove('open');
    });
  });

  // Save New Project
  const btnSaveNew = document.getElementById('save-new-project');
  if (btnSaveNew) {
    btnSaveNew.addEventListener('click', async () => {
      const name = document.getElementById('inp-project-name').value;
      const desc = document.getElementById('inp-project-desc').value;
      const managerId = document.getElementById('inp-project-manager').value;

      if (!name) {
        showToast("Proje adı zorunludur.", 'warning');
        return;
      }

      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/projects/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name,
            description: desc,
            manager_ids: window._selectedPMs || []
          })
        });

        if (!res.ok) throw new Error("Proje oluşturulamadı");

        document.getElementById('inp-project-name').value = '';
        document.getElementById('inp-project-desc').value = '';
        document.getElementById('inp-project-manager').value = '';
        modalNew.classList.remove('open');

        await fetchProjects();
        if (currentView === 'list') {
          renderContentArea();
        }
      } catch (err) {
        console.error(err);
        showToast("Proje oluşturulurken bir hata oluştu.", 'error');
      }
    });
  }

  // Save New Member
  document.getElementById('save-new-member')?.addEventListener('click', async () => {
    const memberId = document.getElementById('inp-member-name').value;
    const role = document.getElementById('inp-member-role').value;
    if (!memberId || !role) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/projects/${currentProjectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, user_id: memberId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Üye eklenemedi");
      }

      document.getElementById('inp-member-name').value = '';
      document.getElementById('inp-member-role').value = '';
      document.getElementById('modal-add-member').classList.remove('open');

      await fetchProjects();
      renderContentArea();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Hata oluştu.", 'error');
    }
  });

  // Save New Task
  document.getElementById('save-new-task')?.addEventListener('click', async () => {
    const title = document.getElementById('inp-task-title').value;
    const assigneeId = document.getElementById('inp-task-assignee').value;
    const status = document.getElementById('inp-task-status').value;

    if (!title || !assigneeId) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/projects/${currentProjectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, assigneeId, status })
      });

      if (!res.ok) throw new Error("Görev eklenemedi");

      document.getElementById('inp-task-title').value = '';
      document.getElementById('modal-add-task').classList.remove('open');

      await fetchProjects();
      renderContentArea();
    } catch (err) {
      console.error(err);
      showToast("Görev oluşturulamadı.", 'error');
    }
  });
}

function bindListViewEvents() {
  // View Details
  document.querySelectorAll('.btn-view-project').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentProjectId = String(e.target.dataset.id);
      currentView = 'detail';
      renderContentArea();
    });
  });

  // Delete Project
  document.querySelectorAll('.btn-delete-project').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm("Projeyi silmek istediğinize emin misiniz?")) {
        try {
          const token = getToken();
          const res = await fetch(`${API_URL}/projects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Silinemedi");

          await fetchProjects();
          renderContentArea();
        } catch (err) {
          console.error(err);
          showToast("Projeyi silerken hata oluştu.", 'error');
        }
      }
    });
  });
}

function bindDetailViewEvents() {
  // Back to list
  document.getElementById('btn-back-to-list')?.addEventListener('click', () => {
    currentView = 'list';
    currentProjectId = null;
    renderContentArea();
  });

  // Add Member trigger
  document.getElementById('btn-add-member')?.addEventListener('click', () => {
    const memberSelect = document.getElementById('inp-member-name');
    if (memberSelect) {
      let opts = '<option value="" disabled selected>Sistemdeki Üyelerden Seçin</option>';
      allUsers.forEach(u => {
        opts += `<option value="${u.id}">${u.first_name || ''} ${u.last_name || ''}</option>`;
      });
      memberSelect.innerHTML = opts;
    }
    document.getElementById('modal-add-member').classList.add('open');
  });

  // Add Task trigger
  document.getElementById('btn-add-task')?.addEventListener('click', () => {
    const project = projectsData.find(p => p.id === currentProjectId);
    const assigneeSelect = document.getElementById('inp-task-assignee');
    assigneeSelect.innerHTML = project.members.map(m => `<option value="${m.id}">${m.name} (${m.role})</option>`).join('');

    if (project.members.length === 0) {
      showToast("Görev atayabilmek için önce projeye üye eklemelisiniz.", 'warning');
      return;
    }

    document.getElementById('modal-add-task').classList.add('open');
  });

  // Remove Member
  document.querySelectorAll('.btn-remove-member').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const mId = e.currentTarget.dataset.id;
      if (confirm("Bu üyeyi projeden çıkarmak istediğinize emin misiniz?")) {
        try {
          const token = getToken();
          const res = await fetch(`${API_URL}/projects/${currentProjectId}/members/${mId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Çıkarılamadı");

          await fetchProjects();
          renderContentArea();
        } catch (err) {
          console.error(err);
          showToast("Üye çıkarılırken hata oluştu.", 'error');
        }
      }
    });
  });

  // Delete Task
  document.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tId = e.currentTarget.dataset.taskId;
      if (confirm("Bu görevi silmek istediğinize emin misiniz?")) {
        try {
          const token = getToken();
          const res = await fetch(`${API_URL}/projects/tasks/${tId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Silinemedi");

          await fetchProjects();
          renderContentArea();
        } catch (err) {
          console.error(err);
          showToast("Görev silinirken hata oluştu.", 'error');
        }
      }
    });
  });

  // Change Task Status
  document.querySelectorAll('.task-status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const tId = e.currentTarget.dataset.taskId;
      const newStatus = e.currentTarget.value;

      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/projects/tasks/${tId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error("Güncellenemedi");

        await fetchProjects();
        renderContentArea();
      } catch (err) {
        console.error(err);
        showToast("Durum güncellenirken hata oluştu.", 'error');
      }
    });
  });
}