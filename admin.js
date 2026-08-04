document.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIGURATION SUPABASE
    const SUPABASE_URL = "https://qejnwadpoxummrixnwyy.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlam53YWRwb3h1bW1yaXhud3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2ODIwMjEsImV4cCI6MjEwMTI1ODAyMX0.fXDorRfOHiKcixhmYgUZBxV0KbEAySJul4THOR0cc1I";

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // MOT DE PASSE ADMIN (Modifiez-le ici si besoin !)
    const ADMIN_PASSCODE = "savanes2026";

    // ÉLÉMENTS DOM
    const loginModal = document.getElementById('login-modal');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminPasswordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    const registrationsTbody = document.getElementById('registrations-tbody');
    const productsTbody = document.getElementById('products-tbody');
    const statRegistrations = document.getElementById('stat-registrations-count');
    const statProducts = document.getElementById('stat-products-count');

    let loadedRegistrations = [];

    // 2. GESTION DE LA CONNEXION
    function checkAuth() {
        if (sessionStorage.getItem('savanes_admin_authenticated') === 'true') {
            loginModal.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            loadAdminData();
        } else {
            loginModal.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
        }
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (adminPasswordInput.value === ADMIN_PASSCODE) {
                sessionStorage.setItem('savanes_admin_authenticated', 'true');
                loginError.classList.add('hidden');
                checkAuth();
            } else {
                loginError.classList.remove('hidden');
                adminPasswordInput.value = '';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('savanes_admin_authenticated');
            checkAuth();
        });
    }

    // 3. CHARGEMENT DES DONNÉES DEPUIS SUPABASE
    async function loadAdminData() {
        await fetchRegistrations();
        await fetchProducts();
    }

    // A. Récupération des Pré-inscriptions
    async function fetchRegistrations() {
        try {
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            loadedRegistrations = data || [];

            if (statRegistrations) statRegistrations.textContent = loadedRegistrations.length;

            renderRegistrationsTable(loadedRegistrations);
        } catch (err) {
            console.error("Erreur Inscriptions:", err.message);
        }
    }

    function renderRegistrationsTable(items) {
        if (!registrationsTbody) return;
        registrationsTbody.innerHTML = '';

        if (items.length === 0) {
            registrationsTbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-gray-400">Aucune inscription enregistrée pour le moment.</td></tr>`;
            return;
        }

        items.forEach(item => {
            const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
            const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Bonjour ' + (item.name || '') + ', nous vous contactons depuis la plateforme Savanes Market.')}`;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';
            tr.innerHTML = `
                <td class="py-3 px-4">
                    <span class="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase">${item.role || 'N/A'}</span>
                </td>
                <td class="py-3 px-4 font-bold text-gray-900">${item.name || 'Sans nom'}</td>
                <td class="py-3 px-4 text-gray-600">${item.city || 'N/A'}</td>
                <td class="py-3 px-4 text-gray-500">${item.products || 'N/A'}</td>
                <td class="py-3 px-4">
                    <a href="${whatsappLink}" target="_blank" class="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs inline-flex items-center space-x-1.5">
                        <i class="fa-brands fa-whatsapp text-sm"></i>
                        <span>${item.phone || 'Contacter'}</span>
                    </a>
                </td>
            `;
            registrationsTbody.appendChild(tr);
        });
    }

    // B. Récupération et Modération des Annonces
    async function fetchProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const productsList = data || [];

            if (statProducts) statProducts.textContent = productsList.length;

            renderProductsTable(productsList);
        } catch (err) {
            console.error("Erreur Annonces:", err.message);
        }
    }

    function renderProductsTable(items) {
        if (!productsTbody) return;
        productsTbody.innerHTML = '';

        if (items.length === 0) {
            productsTbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-gray-400">Aucune annonce publiée.</td></tr>`;
            return;
        }

        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';
            tr.innerHTML = `
                <td class="py-3 px-4 font-bold text-gray-900">${item.icon || '🌾'} ${item.name}</td>
                <td class="py-3 px-4 text-green-700 font-extrabold">${item.price}</td>
                <td class="py-3 px-4 text-gray-600">${item.quantity}</td>
                <td class="py-3 px-4 text-gray-600">${item.location}</td>
                <td class="py-3 px-4 text-gray-500">${item.vendor} (${item.phone})</td>
                <td class="py-3 px-4 text-right">
                    <button data-id="${item.id}" class="delete-btn bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs transition">
                        <i class="fa-solid fa-trash mr-1"></i> Supprimer
                    </button>
                </td>
            `;
            productsTbody.appendChild(tr);
        });

        // Ajouter les écouteurs pour supprimer
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
                    await deleteProduct(id);
                }
            });
        });
    }

    // Supprimer un produit de Supabase
    async function deleteProduct(id) {
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            await fetchProducts();
        } catch (err) {
            alert("Erreur lors de la suppression : " + err.message);
        }
    }

    // 4. GESTION DES ONGLETS ADMIN
    const tabRegBtn = document.getElementById('tab-registrations-btn');
    const tabProdBtn = document.getElementById('tab-products-btn');
    const sectionReg = document.getElementById('section-registrations');
    const sectionProd = document.getElementById('section-products');

    if (tabRegBtn && tabProdBtn) {
        tabRegBtn.addEventListener('click', () => {
            tabRegBtn.className = "px-6 py-4 font-bold text-sm text-green-800 border-b-2 border-green-800 flex items-center space-x-2";
            tabProdBtn.className = "px-6 py-4 font-bold text-sm text-gray-500 hover:text-gray-800 flex items-center space-x-2";
            sectionReg.classList.remove('hidden');
            sectionProd.classList.add('hidden');
        });

        tabProdBtn.addEventListener('click', () => {
            tabProdBtn.className = "px-6 py-4 font-bold text-sm text-green-800 border-b-2 border-green-800 flex items-center space-x-2";
            tabRegBtn.className = "px-6 py-4 font-bold text-sm text-gray-500 hover:text-gray-800 flex items-center space-x-2";
            sectionProd.classList.remove('hidden');
            sectionReg.classList.add('hidden');
        });
    }

    // 5. EXPORT CSV (EXCEL)
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            if (loadedRegistrations.length === 0) {
                alert("Aucune inscription à exporter.");
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,Profil,Nom,Ville,Telephone,Produits\n";
            loadedRegistrations.forEach(r => {
                csvContent += `"${r.role || ''}","${r.name || ''}","${r.city || ''}","${r.phone || ''}","${r.products || ''}"\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `savanes_market_inscriptions_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Vérifier l'accès au lancement
    checkAuth();
});