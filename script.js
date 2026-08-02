document.addEventListener('DOMContentLoaded', () => {

    // 1. PRODUITS PAR DÉFAUT (Utilisés si le LocalStorage est vide)
    const initialProducts = [
        {
            id: 1,
            name: "Maïs Blanc Séché",
            category: "cereales",
            price: "19 500 FCFA / Sac",
            quantity: "100 Sacs de 100kg",
            location: "Cinkassé",
            vendor: "Malam Barka",
            phone: "22890000000",
            icon: "🌾"
        },
        {
            id: 2,
            name: "Bovins de Race Peulh",
            category: "elevage",
            price: "250 000 FCFA / Tête",
            quantity: "8 Têtes disponibles",
            location: "Dapaong",
            vendor: "Oumarou Diallo",
            phone: "22891111111",
            icon: "🐂"
        },
        {
            id: 3,
            name: "Oignons Rouges de Gando",
            category: "maraichage",
            price: "25 000 FCFA / Sac",
            quantity: "40 Sacs",
            location: "Kpendjal",
            vendor: "Coopérative Songou",
            phone: "22892222222",
            icon: "🧅"
        },
        {
            id: 4,
            name: "Soja Graines Jaunes",
            category: "cereales",
            price: "350 FCFA / Kg",
            quantity: "5 Tonnes",
            location: "Mango",
            vendor: "Yao Yobre",
            phone: "22893333333",
            icon: "🌱"
        },
        {
            id: 5,
            name: "Poulets de Chair Locaux",
            category: "elevage",
            price: "3 500 FCFA / Unité",
            quantity: "150 Volailles",
            location: "Tandjouaré",
            vendor: "Ferme Espoir",
            phone: "22894444444",
            icon: "🐔"
        }
    ];

    // Charger les produits depuis le LocalStorage (ou charger la liste initiale)
    let products = JSON.parse(localStorage.getItem('savanes_market_products')) || initialProducts;

    // État des filtres
    let activeCategory = 'tous';
    let searchQuery = '';
    let selectedCity = 'toutes';

    const productGrid = document.getElementById('product-grid');
    const resultsCount = document.getElementById('results-count');
    const searchInput = document.getElementById('search-input');
    const cityFilter = document.getElementById('city-filter');
    const resetBtn = document.getElementById('reset-filters-btn');

    // 2. SYSTÈME DE NOTIFICATIONS (TOASTS)
    function showNotification(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast-item flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-xl text-white font-medium text-sm pointer-events-auto ${
            type === 'success' ? 'bg-green-800' : 'bg-amber-600'
        }`;
        
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
        toast.innerHTML = `<i class="fa-solid ${icon} text-lg"></i> <span>${message}</span>`;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // 3. AFFICHAGE DES PRODUITS
    function renderProducts(items) {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        if (resultsCount) {
            resultsCount.textContent = `${items.length} produit(s) disponible(s)`;
        }

        if (items.length === 0) {
            productGrid.innerHTML = `
                <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <i class="fa-solid fa-box-open text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-600 font-bold">Aucun produit ne correspond à vos critères.</p>
                    <p class="text-gray-400 text-xs mt-1">Modifiez vos mots-clés ou cliquez sur Réinitialiser.</p>
                </div>
            `;
            return;
        }

        items.forEach(prod => {
            const message = encodeURIComponent(`Bonjour ${prod.vendor}, je suis intéressé par votre annonce sur Savanes Market : "${prod.name}" à ${prod.location}. Est-ce toujours disponible ?`);
            const whatsappUrl = `https://wa.me/${prod.phone}?text=${message}`;

            const card = document.createElement('div');
            card.className = 'bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition animate-fade-in flex flex-col justify-between';
            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-3xl">${prod.icon}</span>
                        <span class="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase">${prod.location}</span>
                    </div>
                    <h3 class="font-extrabold text-lg text-gray-900">${prod.name}</h3>
                    <p class="text-green-800 font-extrabold text-xl mt-1">${prod.price}</p>
                    
                    <div class="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                        <p><i class="fa-solid fa-boxes-stacked text-amber-600 mr-2"></i><strong>Stock :</strong> ${prod.quantity}</p>
                        <p><i class="fa-solid fa-user text-green-700 mr-2"></i><strong>Vendeur :</strong> ${prod.vendor}</p>
                    </div>
                </div>

                <a href="${whatsappUrl}" target="_blank" class="mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-sm">
                    <i class="fa-brands fa-whatsapp text-lg"></i>
                    <span>Contacter le vendeur</span>
                </a>
            `;
            productGrid.appendChild(card);
        });
    }

    // 4. MOTEUR DE FILTRAGE COMBINÉ
    function applyCombinedFilters() {
        let filtered = products.filter(p => {
            const matchCategory = (activeCategory === 'tous') || (p.category === activeCategory);
            const matchCity = (selectedCity === 'toutes') || p.location.toLowerCase().includes(selectedCity.toLowerCase());
            
            const query = searchQuery.toLowerCase().trim();
            const matchSearch = (query === '') || 
                p.name.toLowerCase().includes(query) ||
                p.vendor.toLowerCase().includes(query) ||
                p.location.toLowerCase().includes(query);

            return matchCategory && matchCity && matchSearch;
        });

        renderProducts(filtered);
    }

    // ÉCOUTEURS D'ÉVÉNEMENTS
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyCombinedFilters();
        });
    }

    if (cityFilter) {
        cityFilter.addEventListener('change', (e) => {
            selectedCity = e.target.value;
            applyCombinedFilters();
        });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active-filter');
                b.classList.add('bg-gray-100', 'text-gray-600');
            });
            btn.classList.add('active-filter');
            btn.classList.remove('bg-gray-100', 'text-gray-600');

            activeCategory = btn.getAttribute('data-category');
            applyCombinedFilters();
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            activeCategory = 'tous';
            searchQuery = '';
            selectedCity = 'toutes';

            if (searchInput) searchInput.value = '';
            if (cityFilter) cityFilter.value = 'toutes';

            filterBtns.forEach(b => {
                b.classList.remove('active-filter');
                b.classList.add('bg-gray-100', 'text-gray-600');
            });
            filterBtns[0].classList.add('active-filter');

            applyCombinedFilters();
            showNotification("Filtres réinitialisés", 'info');
        });
    }

    applyCombinedFilters();

    // 5. AJOUT DE PRODUIT AVEC SAUVEGARDE EN MEMOIRE (LOCALSTORAGE)
    const modal = document.getElementById('add-product-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const addProductForm = document.getElementById('add-product-form');

    if (openModalBtn && modal) {
        openModalBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newProduct = {
                id: Date.now(), // Identifiant unique basé sur l'heure
                name: document.getElementById('prod-name').value,
                category: document.getElementById('prod-category').value,
                price: document.getElementById('prod-price').value,
                quantity: document.getElementById('prod-quantity').value,
                location: document.getElementById('prod-location').value,
                vendor: "Producteur Local",
                phone: document.getElementById('prod-whatsapp').value,
                icon: document.getElementById('prod-category').value === 'cereales' ? '🌾' : 
                      document.getElementById('prod-category').value === 'elevage' ? '🐐' : '🍅'
            };

            // Ajouter au début du tableau
            products.unshift(newProduct);

            // Sauvegarder dans le navigateur
            localStorage.setItem('savanes_market_products', JSON.stringify(products));

            // Rafraîchir l'affichage
            applyCombinedFilters();

            // Masquer la modal et notifier
            modal.classList.add('hidden');
            addProductForm.reset();
            showNotification("Votre annonce a été publiée avec succès !");
        });
    }

    // 6. MENU MOBILE
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }

    // FORMULAIRE PRÉ-INSCRIPTION
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            signupForm.reset();
            showNotification("Pré-inscription enregistrée ! Merci de votre confiance.");
        });
    }

});