/**
 * Global Notification Utility
 * Provides a modern toast-based notification system to replace native alert() calls.
 */

export function showToast(message, type = 'info', duration = 4000) {
    // Ensure toast container exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Choose icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="toast-content">${message}</div>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
            // Remove container if empty to keep DOM clean
            if (container.children.length === 0) {
                container.remove();
            }
        });
    }, duration);
}

// Make it available globally if needed for non-module scripts
window.showToast = showToast;
