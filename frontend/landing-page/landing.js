// LOGIN SAYFASI YÖNLENDİRME ALANI
// Buraya login sayfasının dosya adını yazacağım.

const loginButtons = document.querySelectorAll('#loginBtn, #heroLoginBtn');

loginButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        // window.location.href = 'login.html';
        console.log('Login sayfasına yönlendirilecek');
    });
});

// Hero background mouse movement
const heroBg = document.getElementById('heroBg');
const hero = document.querySelector('.hero');

hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 60;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 60;
    heroBg.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Features showcase scroll animation
const featuresShowcase = document.querySelector('.features-showcase');
const featureItems = document.querySelectorAll('.feature-item');
const platformMockup = document.getElementById('platformMockup');

const mockupIcons = ['📅', '🗓️', '💼', '👥', '📊', '💬'];

function updateFeatures() {
    if (!featuresShowcase) return;

    const rect = featuresShowcase.getBoundingClientRect();
    const scrollProgress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
    const currentIndex = Math.floor(scrollProgress * featureItems.length);
    const clampedIndex = Math.min(currentIndex, featureItems.length - 1);

    featureItems.forEach((item, index) => {
        if (index === clampedIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (platformMockup) {
        const mockupRotation = scrollProgress * 10 - 5;
        platformMockup.style.transform = `rotate(${mockupRotation}deg)`;
        
        const mockupScreen = platformMockup.querySelector('.mockup-screen');
        if (mockupScreen) {
            mockupScreen.textContent = mockupIcons[clampedIndex] || mockupIcons[0];
        }
    }
}

window.addEventListener('scroll', updateFeatures, { passive: true });
updateFeatures();

// Intersection Observer for fade animations
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else {
            entry.target.classList.remove('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-section').forEach(section => {
    observer.observe(section);
});