// Fake data for Havan Card App
const userData = {
    name: 'João Silva',
    cardNumber: '**** **** **** 7834',
    fullCardNumber: '5432 1098 7654 7834',
    expiryDate: '12/28',
    cvv: '***',
    status: 'blocked',
    accountInfo: {
        totalLimit: 4700.00,
        usedLimit: 0.00,
        availableLimit: 4700.00,
        nextDueDate: '15/03/2025',
        currentBalance: 0.00,
        minimumPayment: 0.00
    },
    recentTransactions: [
        {
            id: 1,
            description: 'Compra Online - Havan.com.br',
            amount: -89.90,
            date: '2025-02-01',
            category: 'Compras',
            status: 'pending'
        },
        {
            id: 2,
            description: 'Pagamento de Fatura',
            amount: 89.90,
            date: '2025-01-28',
            category: 'Pagamento',
            status: 'completed'
        },
        {
            id: 3,
            description: 'Loja Havan - Balneário Camboriú',
            amount: -156.78,
            date: '2025-01-25',
            category: 'Compras',
            status: 'completed'
        },
        {
            id: 4,
            description: 'Cashback Programa Havan',
            amount: 7.84,
            date: '2025-01-25',
            category: 'Cashback',
            status: 'completed'
        },
        {
            id: 5,
            description: 'Loja Havan - Shopping',
            amount: -234.50,
            date: '2025-01-20',
            category: 'Compras',
            status: 'completed'
        }
    ],
    benefits: [
        {
            title: 'Desconto Exclusivo',
            description: 'Até 15% de desconto nas Lojas Havan',
            icon: 'fa-percentage',
            active: true
        },
        {
            title: 'Programa de Pontos',
            description: 'Acumule pontos a cada compra',
            icon: 'fa-gift',
            active: true
        },
        {
            title: 'Seguro Compra Protegida',
            description: 'Proteção contra fraudes',
            icon: 'fa-shield-alt',
            active: true
        },
        {
            title: 'App Exclusivo',
            description: 'Controle total pelo aplicativo',
            icon: 'fa-mobile-alt',
            active: true
        },
        {
            title: 'Parcelamento Sem Juros',
            description: 'Até 12x sem juros nas Lojas Havan',
            icon: 'fa-credit-card',
            active: false
        },
        {
            title: 'Cashback Premium',
            description: 'Até 5% de cashback em compras',
            icon: 'fa-coins',
            active: false
        }
    ],
    notifications: [
        {
            id: 1,
            title: 'Cartão Bloqueado',
            message: 'Seu cartão foi bloqueado por segurança. Desbloqueie agora!',
            type: 'warning',
            date: '2025-02-08',
            read: false
        },
        {
            id: 2,
            title: 'Nova Promoção',
            message: 'Desconto especial de 20% em eletrônicos',
            type: 'info',
            date: '2025-02-07',
            read: false
        },
        {
            id: 3,
            title: 'Fatura Disponível',
            message: 'Sua fatura de janeiro já está disponível',
            type: 'info',
            date: '2025-02-05',
            read: true
        }
    ],
    settings: {
        notifications: {
            push: true,
            email: true,
            sms: false
        },
        security: {
            biometric: false,
            pin: true,
            autoLock: true
        },
        preferences: {
            theme: 'light',
            language: 'pt-BR',
            currency: 'BRL'
        }
    }
};

// Utility functions for data manipulation
const dataUtils = {
    formatCurrency: (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },
    
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    },
    
    getTransactionIcon: (category) => {
        const icons = {
            'Compras': 'fa-shopping-cart',
            'Pagamento': 'fa-money-bill-wave',
            'Cashback': 'fa-coins',
            'Transferência': 'fa-exchange-alt',
            'Saque': 'fa-money-bill-alt'
        };
        return icons[category] || 'fa-credit-card';
    },
    
    getTransactionColor: (amount) => {
        return amount > 0 ? '#4caf50' : '#f44336';
    },
    
    calculateUsagePercentage: () => {
        return (userData.accountInfo.usedLimit / userData.accountInfo.totalLimit) * 100;
    },
    
    getUnreadNotificationsCount: () => {
        return userData.notifications.filter(n => !n.read).length;
    },
    
    getActiveBenefitsCount: () => {
        return userData.benefits.filter(b => b.active).length;
    }
};

// Mock API responses
const mockAPI = {
    getUserData: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: userData
                });
            }, 500);
        });
    },
    
    unlockCard: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate verification process
                const success = Math.random() > 0.1; // 90% success rate
                
                if (success) {
                    userData.status = 'active';
                    resolve({
                        success: true,
                        message: 'Cartão desbloqueado com sucesso!'
                    });
                } else {
                    reject({
                        success: false,
                        message: 'Falha na verificação. Tente novamente.'
                    });
                }
            }, 2000);
        });
    },
    
    getTransactions: (limit = 10) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: userData.recentTransactions.slice(0, limit)
                });
            }, 300);
        });
    },
    
    updateSettings: (newSettings) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                Object.assign(userData.settings, newSettings);
                resolve({
                    success: true,
                    message: 'Configurações atualizadas com sucesso!'
                });
            }, 500);
        });
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { userData, dataUtils, mockAPI };
}

