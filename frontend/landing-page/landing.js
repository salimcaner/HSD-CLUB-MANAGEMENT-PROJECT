document.addEventListener('DOMContentLoaded', () => {
    initHeroGrid();
    initManagementCarousel();
    initInteractiveFeatures();
});

// ==========================================
// HERO GRID INTERACTION
// ==========================================
function initHeroGrid() {
    const featureItems = document.querySelectorAll('.feature-item');
    const displayMockups = document.querySelectorAll('.display-mockup');
    const checkboxes = document.querySelectorAll('.feature-checkbox');
    const enlightenmentOverlay = document.getElementById('enlightenmentOverlay');
    const enlightenmentText = document.getElementById('enlightenmentText');
    
    let checkedCount = 0;
    const totalItems = featureItems.length;

    // Mouseenter için mockup değiştirme
    featureItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            // Skip if checkbox is being clicked
            if (item.dataset.checkboxClick) return;
            
            featureItems.forEach(f => f.classList.remove('active'));
            displayMockups.forEach(m => m.classList.remove('active'));

            item.classList.add('active');
            const feature = item.getAttribute('data-feature');
            const targetMockup = document.querySelector(`.display-mockup[data-mockup="${feature}"]`);
            if (targetMockup) {
                targetMockup.classList.add('active');
            }
        });
    });

    // Checkbox tıklama işlevselliği
    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = featureItems[index];
            
            // Prevent mouseenter during checkbox click
            item.dataset.checkboxClick = 'true';
            setTimeout(() => delete item.dataset.checkboxClick, 100);
            
            // Toggle checked state
            if (!item.classList.contains('checked')) {
                item.classList.add('checked');
                checkedCount++;
                
                // Her checkbox işaretlendiğinde enlightenment efektini güncelle
                updateEnlightenment();
            } else {
                item.classList.remove('checked');
                checkedCount--;
                updateEnlightenment();
            }
        });
    });
    
    function updateEnlightenment() {
        if (checkedCount > 0) {
            // Karanlık overlay'i göster
            enlightenmentOverlay.classList.add('dark');
            
            // Yazıyı yavaşça görünür yap
            setTimeout(() => {
                enlightenmentText.classList.add('visible');
            }, 500);
            
            // Aydınlanma seviyesini checkedCount'a göre ayarla
            const enlightenmentLevel = checkedCount / totalItems;
            const darknessLevel = 0.9 - (enlightenmentLevel * 0.9);
            enlightenmentOverlay.style.background = `rgba(0, 0, 0, ${darknessLevel})`;
            
            // Tam aydınlanma - tüm checkboxlar işaretliyse
            if (checkedCount === totalItems) {
                setTimeout(() => {
                    enlightenmentOverlay.style.background = 'rgba(0, 0, 0, 0)';
                    enlightenmentText.style.textShadow = '0 0 50px rgba(207, 10, 44, 1)';
                }, 1000);
            }
        } else {
            // Hiç checkbox işaretli değilse efekti kaldır
            enlightenmentOverlay.classList.remove('dark');
            enlightenmentText.classList.remove('visible');
            enlightenmentOverlay.style.background = 'rgba(0, 0, 0, 0)';
        }
    }

    // İlk öğeyi aktif yap
    if (featureItems.length > 0) {
        featureItems[0].classList.add('active');
        displayMockups[0].classList.add('active');
    }

    // Login handlers
    const loginBtns = document.querySelectorAll('#loginBtn, #heroCta, .card-btn');
    loginBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Oturum açma sayfasına yönlendiriliyorsunuz...');
            // window.location.href = 'login.html';
        });
    });
}

// ==========================================
// MANAGEMENT CAROUSEL - Smooth Scrolling
// ==========================================
function initManagementCarousel() {
    const grid = document.getElementById('managementGrid');
    const leftBtn = document.getElementById('carouselLeft');
    const rightBtn = document.getElementById('carouselRight');
    
    if (!grid || !leftBtn || !rightBtn) return;
    
    let currentPosition = 0;
    const cardWidth = 350; // Approximate card width + gap
    const scrollAmount = cardWidth;
    
    leftBtn.addEventListener('click', () => {
        currentPosition = Math.max(currentPosition - scrollAmount, 0);
        grid.style.transform = `translateX(-${currentPosition}px)`;
    });
    
    rightBtn.addEventListener('click', () => {
        const maxScroll = grid.scrollWidth - grid.parentElement.offsetWidth;
        currentPosition = Math.min(currentPosition + scrollAmount, maxScroll);
        grid.style.transform = `translateX(-${currentPosition}px)`;
    });
}

// ==========================================
// INTERACTIVE FEATURES SECTION
// ==========================================
function initInteractiveFeatures() {
    const tabs = document.querySelectorAll('.feature-tab');
    const panels = document.querySelectorAll('.demo-panel');
    
    let currentPanel = null;
    let animationActive = false;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (animationActive) return;
            
            const targetTab = tab.getAttribute('data-tab');
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update panels
            panels.forEach(p => p.classList.remove('active'));
            const targetPanel = document.querySelector(`.demo-panel[data-panel="${targetTab}"]`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                currentPanel = targetTab;
                initPanelAnimation(targetTab);
            }
        });
    });
    
    // Initialize first panel
    if (tabs.length > 0) {
        panels[0].classList.add('active');
        currentPanel = 'uyeyonetimi';
        setTimeout(() => initPanelAnimation('uyeyonetimi'), 100);
    }
}

// ==========================================
// PANEL ANIMATIONS
// ==========================================
function initPanelAnimation(panelName) {
    switch(panelName) {
        case 'uyeyonetimi':
            initNetworkAnimation();
            break;
        case 'takvim':
            initCalendar();
            break;
        case 'finans':
            initFinanceChart();
            break;
        case 'raporlar':
            initDataStream();
            break;
        case 'komiteler':
            initCommitteeOrganize();
            break;
        case 'projeler':
            initProjectProgress();
            break;
    }
}

// 1️⃣ NETWORK ANIMATION - Üye Yönetimi
function initNetworkAnimation() {
    const canvas = document.getElementById('dotsCanvas');
    const btn = document.getElementById('activateNetwork');
    
    if (!canvas || !btn) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 350;
    
    let dots = [];
    let activated = false;
    
    btn.addEventListener('click', () => {
        if (activated) return;
        activated = true;
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
        
        // Create dots
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                dots.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: 0,
                    targetRadius: Math.random() * 4 + 3,
                    opacity: 0
                });
            }, i * 100);
        }
        
        animate();
    });
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw dots
        dots.forEach((dot, i) => {
            if (dot.radius < dot.targetRadius) {
                dot.radius += 0.2;
                dot.opacity = Math.min(1, dot.opacity + 0.05);
            }
            
            // Draw glow
            const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.radius * 3);
            gradient.addColorStop(0, `rgba(207, 10, 44, ${dot.opacity * 0.6})`);
            gradient.addColorStop(1, 'rgba(207, 10, 44, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.radius * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw dot
            ctx.fillStyle = `rgba(207, 10, 44, ${dot.opacity})`;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw connections
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
                if (dist < 150) {
                    const opacity = (1 - dist / 150) * Math.min(dots[i].opacity, dots[j].opacity) * 0.3;
                    ctx.strokeStyle = `rgba(207, 10, 44, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }
        }
        
        if (activated) {
            requestAnimationFrame(animate);
        }
    }
}

// 2️⃣ CALENDAR - Interactive Calendar
function initCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthEl = document.getElementById('currentMonth');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    
    if (!calendarGrid || !currentMonthEl) return;
    
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    
    let currentDate = new Date(2026, 1, 1); // February 2026
    
    function renderCalendar() {
        calendarGrid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        // Add day headers
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Get first day of month (0 = Sunday, need to convert to Monday = 0)
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Adjust for Monday start (convert Sunday=0 to Sunday=6)
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        const today = new Date();
        const eventDays = [13, 20, 25]; // Days with events
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day date';
            dayEl.textContent = day;
            
            // Highlight today
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            
            // Mark event days
            if (eventDays.includes(day)) {
                dayEl.classList.add('event');
            }
            
            calendarGrid.appendChild(dayEl);
        }
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    renderCalendar();
}

// 3️⃣ FINANCE CHART
function initFinanceChart() {
    const canvas = document.getElementById('chartCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 350;
    
    const data = [0, 0, 0, 0, 0];
    const target = [65, 82, 54, 90, 72];
    const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs'];
    
    let frame = 0;
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update data
        for (let i = 0; i < data.length; i++) {
            if (data[i] < target[i]) {
                data[i] += 2;
            }
        }
        
        // Draw bars
        const barWidth = 80;
        const spacing = 40;
        const maxHeight = 250;
        
        data.forEach((value, i) => {
            const x = 50 + i * (barWidth + spacing);
            const height = (value / 100) * maxHeight;
            const y = canvas.height - height - 40;
            
            // Bar
            ctx.fillStyle = '#CF0A2C';
            ctx.fillRect(x, y, barWidth, height);
            
            // Label
            ctx.fillStyle = 'white';
            ctx.font = '14px Figtree';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x + barWidth / 2, canvas.height - 15);
        });
        
        frame++;
        if (frame < 60) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// 4️⃣ DATA STREAM - Raporlar
function initDataStream() {
    const stream = document.getElementById('dataStream');
    if (!stream) return;
    
    stream.innerHTML = '';
    
    const data = ['+24 Katılım', '+3 Yeni Proje', '%82 Tamamlanma'];
    
    data.forEach((text, i) => {
        setTimeout(() => {
            const item = document.createElement('div');
            item.className = 'data-item';
            item.textContent = text;
            item.style.animation = 'dataSlide 0.6s ease forwards';
            stream.appendChild(item);
        }, i * 300);
    });
}

// 5️⃣ COMMITTEE ORGANIZE
function initCommitteeOrganize() {
    const cards = document.querySelectorAll('.committee-card');
    
    // Scatter
    cards.forEach((card, i) => {
        const angle = (i / cards.length) * Math.PI * 2;
        const distance = 80;
        card.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
        card.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
        card.style.setProperty('--rotation', `${Math.random() * 30 - 15}deg`);
        card.classList.add('scattered');
    });
    
    // Organize after delay
    setTimeout(() => {
        cards.forEach(card => {
            card.classList.remove('scattered');
            card.style.transform = 'none';
        });
    }, 1000);
}

// 6️⃣ PROJECT PROGRESS
function initProjectProgress() {
    const fill = document.getElementById('projectProgress');
    const text = document.getElementById('progressText');
    const tasks = document.querySelectorAll('.task-item');
    
    if (!fill || !text) return;
    
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += 2;
        fill.style.width = progress + '%';
        text.textContent = progress + '%';
        
        if (progress >= 33 && !tasks[0].classList.contains('checked')) {
            tasks[0].classList.add('checked');
        }
        if (progress >= 66 && !tasks[1].classList.contains('checked')) {
            tasks[1].classList.add('checked');
        }
        if (progress >= 100) {
            tasks[2].classList.add('checked');
            clearInterval(interval);
        }
    }, 30);
}

// ==========================================
// SMOOTH SCROLL
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});