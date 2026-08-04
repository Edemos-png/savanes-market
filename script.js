document.addEventListener('DOMContentLoaded', async () => {

    // 1. CONFIGURATION SUPABASE
    const SUPABASE_URL = "https://qejnwadpoxummrixnwyy.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlam53YWRwb3h1bW1yaXhud3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2ODIwMjEsImV4cCI6MjEwMTI1ODAyMX0.fXDorRfOHiKcixhmYgUZBxV0KbEAySJul4THOR0cc1I";

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let products = [];
    let activeCategory = 'tous';
    let searchQuery = '';
    let selectedCity = 'toutes';

    const productGrid = document.getElementById('product-grid');
    const resultsCount = document.getElementById('results-count');
    const searchInput = document.getElementById('search-input');
    const cityFilter = document.getElementById('city-filter');
    const resetBtn = document.getElementById('reset-filters-btn');

    // 2. GESTION DES NOTIFICATIONS (TOASTS)
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

    // 3. CHARGEMENT DEPUIS SUPABASE
    async function loadProductsFromSupabase() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            products = data || [];
            applyCombinedFilters();
        } catch (err) {
            console.error("Erreur chargement :", err.message);
        }
    }

    // 4. AFFICHAGE DES CARTES DE PRODUITS (AVEC ICÔNES)
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
                        <span class="text-3xl">${prod.icon || '🌾'}</span>
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

    // 5. MOTEUR DE RECHERCHE ET FILTRAGE COMBINÉ
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

    // Écouteurs d'événements Filtres
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

    // 6. SOUMISSION DU FORMULAIRE D'AJOUT (SIMPLE & RAPIDE)
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const categoryVal = document.getElementById('prod-category').value;
            const newProduct = {
                name: document.getElementById('prod-name').value,
                category: categoryVal,
                price: document.getElementById('prod-price').value,
                quantity: document.getElementById('prod-quantity').value,
                location: document.getElementById('prod-location').value,
                vendor: "Producteur Local",
                phone: document.getElementById('prod-whatsapp').value,
                icon: categoryVal === 'cereales' ? '🌾' : (categoryVal === 'elevage' ? '🐐' : '🍅')
            };

            // Insertion dans la BDD Supabase
            const { data, error } = await supabase
                .from('products')
                .insert([newProduct])
                .select();

            if (error) {
                console.error("Erreur publication :", error);
                showNotification("Erreur lors de la publication", 'error');
            } else {
                // Recharger immédiatement la liste complète
                await loadProductsFromSupabase();

                // Fermer la fenêtre modale
                const modal = document.getElementById('add-product-modal');
                if (modal) modal.classList.add('hidden');

                addProductForm.reset();
                showNotification("Produit publié avec succès !");
            }
        });
    }

    // 7. SOUMISSION PRÉ-INSCRIPTION
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newRegistration = {
                role: document.getElementById('user-role').value,
                name: document.getElementById('user-name').value,
                phone: document.getElementById('user-phone').value,
                city: document.getElementById('user-city').value,
                products: document.getElementById('user-products').value
            };

            const { error } = await supabase.from('registrations').insert([newRegistration]);

            if (error) {
                showNotification("Erreur d'inscription", 'error');
            } else {
                signupForm.reset();
                showNotification("Pré-inscription enregistrée avec succès !");
            }
        });
    }

    // 8. MENU MOBILE
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }

    // Lancement du chargement initial
    loadProductsFromSupabase();

});