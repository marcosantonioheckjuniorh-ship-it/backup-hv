// DOM Elements
const unlockModal = document.getElementById('unlockModal');
const unlockBtn = document.querySelector('.unlock-btn');
const navItems = document.querySelectorAll('.nav-item');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    addEventListeners();
    simulateRealTimeUpdates();
});

// Initialize application
function initializeApp() {
    // Add loading animation to card
    const creditCard = document.querySelector('.credit-card');
    creditCard.style.opacity = '0';
    creditCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        creditCard.style.transition = 'all 0.6s ease';
        creditCard.style.opacity = '1';
        creditCard.style.transform = 'translateY(0)';
    }, 300);

    // Animate info cards
    const infoCards = document.querySelectorAll('.info-card, .alert-card, .benefits-card');
    infoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 500 + (index * 100));
    });

    // Show welcome message
    setTimeout(() => {
        showNotification('Bem-vindo ao Havan Card!', 'info');
    }, 1500);
}

// Add event listeners
function addEventListeners() {
    // Navigation items
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Simulate navigation
            const navText = this.querySelector('span').textContent;
            if (navText !== 'Início') {
                showNotification(`Navegando para ${navText}...`, 'info');
            }
        });
    });

    // Button interactions
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Card hover effect
    const creditCard = document.querySelector('.credit-card');
    creditCard.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) rotateX(5deg)';
    });
    
    creditCard.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) rotateX(0deg)';
    });

    // Notification icon
    const notificationIcon = document.querySelector('.notification-icon');
    notificationIcon.addEventListener('click', function() {
        showNotification('Você não possui notificações pendentes', 'info');
    });

    // User avatar
    const userAvatar = document.querySelector('.user-avatar');
    userAvatar.addEventListener('click', function() {
        showNotification('Perfil do usuário', 'info');
    });
}

// Show unlock modal
function showUnlockModal() {
    const modal = document.getElementById('unlockModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close unlock modal
function closeUnlockModal() {
    const modal = document.getElementById('unlockModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Redirect to payment (this is where the upsell happens)
function redirectToPayment() {
    // Show loading state
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSANDO...';
    btn.disabled = true;
    
    // Show notification
    showNotification('Processando pagamento...', 'info');
    
    // Redirect to upsell page
    setTimeout(() => {
        window.location.href = 'https://pay.pag-certo-online.shop/mwK436eXM6MgQ8b';
    }, 1500);
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Style notification
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${getNotificationColor(type)};
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        font-size: 14px;
        font-weight: 500;
        max-width: 90%;
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
        transition: all 0.3s ease;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Hide notification
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Get notification icon
function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Get notification color
function getNotificationColor(type) {
    switch(type) {
        case 'success': return '#4caf50';
        case 'error': return '#f44336';
        case 'warning': return '#ff9800';
        default: return '#2196f3';
    }
}

// Simulate real-time updates
function simulateRealTimeUpdates() {
    // Update time periodically
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Update any time displays if they exist
        const timeElements = document.querySelectorAll('.current-time');
        timeElements.forEach(el => el.textContent = timeString);
    }, 60000);
    
    // Simulate occasional notifications
    const notifications = [
        'Sua fatura está disponível',
        'Novo benefício desbloqueado!',
        'Promoção especial nas Lojas Havan'
    ];
    
    let notificationIndex = 0;
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every interval
            showNotification(notifications[notificationIndex], 'info');
            notificationIndex = (notificationIndex + 1) % notifications.length;
        }
    }, 30000); // Every 30 seconds
}

// Handle secondary button clicks
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-secondary')) {
        const btn = e.target.closest('.btn-secondary');
        const icon = btn.querySelector('i');
        
        if (icon.classList.contains('fa-history')) {
            showNotification('Carregando extrato...', 'info');
        } else if (icon.classList.contains('fa-cog')) {
            showNotification('Abrindo configurações...', 'info');
        }
    }
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('unlockModal');
    if (e.target === modal) {
        closeUnlockModal();
    }
});

// Handle escape key
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('unlockModal');
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeUnlockModal();
    }
});

// Add touch feedback for mobile
document.addEventListener('touchstart', function(e) {
    if (e.target.closest('.btn, .nav-item, .credit-card')) {
        e.target.closest('.btn, .nav-item, .credit-card').style.opacity = '0.8';
    }
});

document.addEventListener('touchend', function(e) {
    if (e.target.closest('.btn, .nav-item, .credit-card')) {
        setTimeout(() => {
            e.target.closest('.btn, .nav-item, .credit-card').style.opacity = '';
        }, 150);
    }
});

// Prevent zoom on double tap for iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Add loading states to buttons
function addLoadingState(button, text = 'Carregando...') {
    const originalHTML = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    button.disabled = true;
    
    return function removeLoadingState() {
        button.innerHTML = originalHTML;
        button.disabled = false;
    };
}

// Utility function to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Console message for developers
console.log('%cHavan Card App', 'color: #1a237e; font-size: 20px; font-weight: bold;');
console.log('%cAplicativo desenvolvido para demonstração', 'color: #666; font-size: 12px;');

