document.addEventListener('DOMContentLoaded', async () => {

    // 1. INITIALISATION DE SUPABASE (Remplacez avec vos identifiants Supabase)
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

    

    // 2. NOTIFICATIONS TOAST
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

    // 3. CHARGEMENT DEPUIS LA BASE DE DONNÉES (SUPABASE)
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
            console.error("Erreur de chargement :", err.message);
            showNotification("Erreur de connexion à la base de données", 'error');
        }
    }

    // 4. AFFICHAGE DES PRODUITS
    // Dans renderProducts(items) :
items.forEach(prod => {
    const message = encodeURIComponent(`Bonjour ${prod.vendor}, je suis intéressé par votre annonce sur Savanes Market : "${prod.name}" à ${prod.location}. Est-ce toujours disponible ?`);
    const whatsappUrl = `https://wa.me/${prod.phone}?text=${message}`;

    // Si une vraie photo existe, on l'affiche, sinon on affiche l'icône emoji
    const mediaHTML = prod.image_url 
        ? `<img src="${prod.image_url}" alt="${prod.name}" class="w-full h-48 object-cover rounded-xl mb-4">`
        : `<div class="w-full h-32 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-4xl">${prod.icon || '🌾'}</div>`;

    const card = document.createElement('div');
    card.className = 'bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition animate-fade-in flex flex-col justify-between';
    card.innerHTML = `
        <div>
            ${mediaHTML}
            <div class="flex items-center justify-between mb-2">
                <span class="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">${prod.location}</span>
                <span class="text-xs text-gray-400">${prod.category}</span>
            </div>
            <h3 class="font-extrabold text-lg text-gray-900">${prod.name}</h3>
            <p class="text-green-800 font-extrabold text-xl mt-1">${prod.price}</p>
            
            <div class="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
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

    // 5. FILTRAGE COMBINÉ
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

    // 6. ENREGISTRER UN NOUVEAU PRODUIT DANS SUPABASE
    // GESTION BLINDÉE DE LA FENÊTRE MODALE
const modal = document.getElementById('add-product-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

if (modal) {
    // 1. Clic sur le bouton "Publier une annonce" -> Ouvre la fenêtre
    if (openModalBtn) {
        openModalBtn.onclick = function(e) {
            e.preventDefault();
            modal.classList.remove('hidden');
        };
    }

    // 2. Clic sur la croix (X) -> Ferme la fenêtre
    if (closeModalBtn) {
        closeModalBtn.onclick = function(e) {
            e.preventDefault();
            modal.classList.add('hidden');
        };
    }

    // 3. Clic en dehors de la fenêtre -> Ferme aussi la fenêtre
    window.onclick = function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    };
}

    if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showNotification("Publication en cours...", 'info');

        const imageFileInput = document.getElementById('prod-image');
        const imageFile = imageFileInput ? imageFileInput.files[0] : null;
        let imageUrl = null;

        // 1. Si une photo a été sélectionnée, on l'envoie sur Supabase Storage
        if (imageFile) {
            try {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                // Récupérer l'URL publique de la photo
                const { data: urlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
            } catch (err) {
                console.error("Erreur lors de l'upload de l'image :", err.message);
                showNotification("Avertissement: La photo n'a pas pu être envoyée", 'error');
            }
        }

        // 2. Création de l'objet produit
        const categoryVal = document.getElementById('prod-category').value;
        const newProduct = {
            name: document.getElementById('prod-name').value,
            category: categoryVal,
            price: document.getElementById('prod-price').value,
            quantity: document.getElementById('prod-quantity').value,
            location: document.getElementById('prod-location').value,
            vendor: "Producteur Local",
            phone: document.getElementById('prod-whatsapp').value,
            icon: categoryVal === 'cereales' ? '🌾' : (categoryVal === 'elevage' ? '🐐' : '🍅'),
            image_url: imageUrl // URL de la vraie photo envoyée
        };

        // 3. Insertion dans la base de données
        const { data, error } = await supabase.from('products').insert([newProduct]).select();

        if (error) {
            console.error(error);
            showNotification("Erreur lors de la publication", 'error');
        } else {
            products.unshift(data[0]);
            applyCombinedFilters();
            modal.classList.add('hidden');
            addProductForm.reset();
            showNotification("Produit publié avec succès avec sa photo !");
        }
    });
}

    // 7. ENREGISTRER UNE PRÉ-INSCRIPTION DANS SUPABASE
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
                showNotification("Erreur lors de l'inscription", 'error');
            } else {
                signupForm.reset();
                showNotification("Pré-inscription enregistrée dans la BDD !");
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