// Global state management
let isLoggedIn = false;
let currentUser = null;
let products = [];
let providers = [];
let xmlProducts = []; // Store products from XML
let allCategories = []; // Store all unique categories

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAuthState();
    loadProductsFromStorage();
    loadProvidersFromStorage();
    updateStats();
    
    // Setup provider form handler
    setupProviderForm();
    // Setup product form handler
    setupProductForm();
});

// Setup provider form
function setupProviderForm() {
    const providerForm = document.getElementById('providerForm');
    if (providerForm) {
        providerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('providerName');
            const phoneInput = document.getElementById('providerPhone');
            const emailInput = document.getElementById('providerEmail');
            
            if (!nameInput || !phoneInput || !emailInput) {
                console.error('Form inputs not found');
                return;
            }
            
            const newProvider = {
                id: Date.now(),
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                email: emailInput.value.trim()
            };
            
            console.log('Adding provider:', newProvider);
            
            providers.push(newProvider);
            saveProvidersToStorage();
            displayProvidersTable();
            
            // Reset form
            providerForm.reset();
            alert('Provider added successfully!');
        });
    }
}

// Setup product form
function setupProductForm() {
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newProduct = {
                id: Date.now(),
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value),
                description: document.getElementById('productDesc').value
            };
            
            products.push(newProduct);
            saveProductsToStorage();
            loadProducts();
            
            // Reset form
            productForm.reset();
            alert('Product added successfully!');
        });
    }
}

// ============= Authentication Functions =============
function toggleAuth() {
    if (isLoggedIn) {
        logout();
    } else {
        login();
    }
}

function login() {
    const username = prompt('Enter username:');
    if (username && username.trim() !== '') {
        isLoggedIn = true;
        currentUser = username;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', username);
        updateAuthUI();
        alert('Login successful!');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        isLoggedIn = false;
        currentUser = null;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        updateAuthUI();
        alert('Logged out successfully!');
    }
}

function loadAuthState() {
    const savedLoginState = localStorage.getItem('isLoggedIn');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedLoginState === 'true' && savedUser) {
        isLoggedIn = true;
        currentUser = savedUser;
    }
    
    updateAuthUI();
}

function updateAuthUI() {
    const authStatus = document.getElementById('authStatus');
    const authUser = document.getElementById('authUser');
    const authBtn = document.getElementById('authBtn');
    
    if (authStatus && authUser && authBtn) {
        if (isLoggedIn) {
            authStatus.textContent = 'Logged in';
            authUser.textContent = `User: ${currentUser}`;
            authBtn.textContent = 'Logout';
        } else {
            authStatus.textContent = 'Not logged in';
            authUser.textContent = '';
            authBtn.textContent = 'Login';
        }
    }
}

// ============= Products Functions =============
let xmlProducts = []; // Store products from XML
let allCategories = new Set(); // Store unique categories

// Load products from XML
async function loadProductsFromXML() {
    const container = document.getElementById('productsTableContainer');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="loading">Loading products from XML...</div>';
        
        const response = await fetch('https://tranduythanh.com/datasets/CA02_products.xml');
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const productNodes = xmlDoc.getElementsByTagName('product');
        xmlProducts = [];
        allCategories = new Set(['all']);
        
        for (let i = 0; i < productNodes.length; i++) {
            const product = productNodes[i];
            const category = product.getAttribute('catename');
            
            const productData = {
                id: product.getElementsByTagName('id')[0]?.textContent || '',
                name: product.getElementsByTagName('name')[0]?.textContent || '',
                detail: product.getElementsByTagName('detail')[0]?.textContent || '',
                image: product.getElementsByTagName('image')[0]?.textContent || '',
                category: category
            };
            
            xmlProducts.push(productData);
            allCategories.add(category);
        }
        
        // Populate category filter
        populateCategoryFilter();
        
        // Display products in table
        displayProductsTable(xmlProducts);
        
    } catch (error) {
        console.error('Error loading XML:', error);
        container.innerHTML = `
            <div class="loading" style="color: #e74c3c;">
                Error loading products from XML. Please try again later.
                <br><small>${error.message}</small>
            </div>
        `;
    }
}

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    const categoriesArray = Array.from(allCategories).filter(cat => cat !== 'all').sort();
    categoriesArray.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function displayProductsTable(productsToDisplay) {
    const container = document.getElementById('productsTableContainer');
    if (!container) return;
    
    if (productsToDisplay.length === 0) {
        container.innerHTML = '<div class="loading">No products found</div>';
        return;
    }
    
    let tableHTML = `
        <table class="products-table">
            <thead>
                <tr>
                    <th style="width: 80px;">ID</th>
                    <th style="width: 100px;">Image</th>
                    <th style="width: 200px;">Name</th>
                    <th style="width: 150px;">Category</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    productsToDisplay.forEach(product => {
        tableHTML += `
            <tr>
                <td class="product-id">#${product.id}</td>
                <td>
                    <img src="${product.image}" alt="${product.name}" class="product-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                </td>
                <td class="product-name">${product.name}</td>
                <td><span class="product-category">${product.category}</span></td>
                <td class="product-detail">${product.detail}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

function filterProductsByCategory() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const selectedCategory = categoryFilter.value;
    
    if (selectedCategory === 'all') {
        displayProductsTable(xmlProducts);
    } else {
        const filteredProducts = xmlProducts.filter(p => p.category === selectedCategory);
        displayProductsTable(filteredProducts);
    }
}

function loadProductsFromStorage() {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    } else {
        // Initialize with sample products
        products = [
            {
                id: 1,
                name: 'Laptop Pro 15',
                category: 'Electronics',
                price: 1299.99,
                stock: 25,
                description: 'High-performance laptop with 16GB RAM and 512GB SSD'
            },
            {
                id: 2,
                name: 'Wireless Headphones',
                category: 'Electronics',
                price: 199.99,
                stock: 50,
                description: 'Premium noise-canceling headphones with 30-hour battery life'
            },
            {
                id: 3,
                name: 'Office Chair Pro',
                category: 'Home',
                price: 349.99,
                stock: 15,
                description: 'Ergonomic office chair with lumbar support and adjustable height'
            }
        ];
        saveProductsToStorage();
    }
}

function saveProductsToStorage() {
    localStorage.setItem('products', JSON.stringify(products));
    updateStats();
}

// Load products from XML
async function loadProductsFromXML() {
    const productsTableContainer = document.getElementById('productsTableContainer');
    if (!productsTableContainer) return;
    
    try {
        productsTableContainer.innerHTML = '<div class="loading">Loading products from XML...</div>';
        
        // Fetch XML file
        const response = await fetch('https://tranduythanh.com/datasets/CA02_products.xml');
        const xmlText = await response.text();
        
        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Get all product elements
        const productElements = xmlDoc.getElementsByTagName('product');
        xmlProducts = [];
        allCategories.clear();
        allCategories.add('all');
        
        // Parse each product
        for (let i = 0; i < productElements.length; i++) {
            const productElement = productElements[i];
            const category = productElement.getAttribute('catename');
            
            const product = {
                id: productElement.getElementsByTagName('id')[0]?.textContent || '',
                name: productElement.getElementsByTagName('name')[0]?.textContent || '',
                detail: productElement.getElementsByTagName('detail')[0]?.textContent || '',
                image: productElement.getElementsByTagName('image')[0]?.textContent || '',
                category: category
            };
            
            xmlProducts.push(product);
            if (category) {
                allCategories.add(category);
            }
        }
        
        // Populate category dropdown
        populateCategoryDropdown();
        
        // Display products
        displayProductsTable(xmlProducts);
        
    } catch (error) {
        console.error('Error loading XML:', error);
        productsTableContainer.innerHTML = `
            <div class="loading" style="color: #e74c3c;">
                Error loading products from XML. Please try again later.
                <br><small>Error: ${error.message}</small>
            </div>
        `;
    }
}

function populateCategoryDropdown() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    // Sort categories alphabetically (excluding 'all')
    const sortedCategories = Array.from(allCategories)
        .filter(cat => cat !== 'all')
        .sort();
    
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const selectedCategory = categoryFilter.value;
    
    if (selectedCategory === 'all') {
        displayProductsTable(xmlProducts);
    } else {
        const filteredProducts = xmlProducts.filter(p => p.category === selectedCategory);
        displayProductsTable(filteredProducts);
    }
}

function displayProductsTable(productsToDisplay) {
    const productsTableContainer = document.getElementById('productsTableContainer');
    if (!productsTableContainer) return;
    
    if (productsToDisplay.length === 0) {
        productsTableContainer.innerHTML = '<div class="loading">No products found for this category.</div>';
        return;
    }
    
    let tableHTML = `
        <div class="table-container">
            <table class="products-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    productsToDisplay.forEach(product => {
        tableHTML += `
            <tr>
                <td><strong>#${product.id}</strong></td>
                <td>
                    <img src="${product.image}" alt="${product.name}" class="product-img" 
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                </td>
                <td class="product-name">${product.name}</td>
                <td><span class="category-badge">${product.category}</span></td>
                <td class="product-detail">${product.detail}</td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    productsTableContainer.innerHTML = tableHTML;
}

function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="loading">No products available. Add your first product below!</div>';
        return;
    }
    
    productsGrid.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">📦</div>
            <span class="category">${product.category}</span>
            <h3>${product.name}</h3>
            <div class="price">$${product.price.toFixed(2)}</div>
            <div class="stock">Stock: ${product.stock} units</div>
            <p class="description">${product.description}</p>
            <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
        `;
        productsGrid.appendChild(productCard);
    });
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        saveProductsToStorage();
        loadProducts();
    }
}

// ============= Providers Functions =============
function loadProvidersFromStorage() {
    const savedProviders = localStorage.getItem('providers');
    if (savedProviders) {
        providers = JSON.parse(savedProviders);
        console.log('Loaded providers from storage:', providers);
    } else {
        // Initialize with sample providers
        providers = [
            {
                id: 1,
                name: 'Tech Solutions Ltd',
                phone: '+84 901 234 567',
                email: 'contact@techsolutions.com'
            },
            {
                id: 2,
                name: 'Global Logistics Co',
                phone: '+84 902 345 678',
                email: 'info@globallogistics.com'
            },
            {
                id: 3,
                name: 'Green Energy Corp',
                phone: '+84 903 456 789',
                email: 'hello@greenenergy.com'
            }
        ];
        console.log('Initialized sample providers:', providers);
        saveProvidersToStorage();
    }
}

function saveProvidersToStorage() {
    localStorage.setItem('providers', JSON.stringify(providers));
    console.log('Saved providers to storage:', providers);
    updateStats();
}

function loadProviders() {
    console.log('loadProviders called, providers:', providers);
    displayProvidersTable();
}

function displayProvidersTable() {
    const container = document.getElementById('providersTableContainer');
    console.log('displayProvidersTable called, container:', container);
    console.log('Current providers:', providers);
    
    if (!container) {
        console.error('providersTableContainer not found!');
        return;
    }
    
    if (providers.length === 0) {
        container.innerHTML = '<div class="loading">No providers yet. Add your first provider below!</div>';
        return;
    }
    
    let tableHTML = `
        <table class="providers-table">
            <thead>
                <tr>
                    <th style="width: 80px;">ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th style="width: 100px; text-align: center;">Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    providers.forEach(provider => {
        tableHTML += `
            <tr>
                <td class="provider-id">#${provider.id}</td>
                <td class="provider-name">${provider.name}</td>
                <td class="provider-phone">${provider.phone}</td>
                <td class="provider-email">${provider.email}</td>
                <td style="text-align: center;">
                    <button class="delete-provider-btn" onclick="deleteProvider(${provider.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    console.log('Setting table HTML');
    container.innerHTML = tableHTML;
}

function deleteProvider(id) {
    if (confirm('Are you sure you want to delete this provider?')) {
        providers = providers.filter(p => p.id !== id);
        saveProvidersToStorage();
        displayProvidersTable();
        alert('Provider deleted successfully!');
    }
}

// ============= Stats Update =============
function updateStats() {
    const productCount = document.getElementById('productCount');
    const providerCount = document.getElementById('providerCount');
    
    if (productCount) {
        productCount.textContent = products.length;
    }
    
    if (providerCount) {
        providerCount.textContent = providers.length;
    }
}

// ============= Weather API Functions =============
async function fetchWeather() {
    const cityInput = document.getElementById('cityInput');
    const weatherContent = document.getElementById('weatherContent');
    
    if (!cityInput || !weatherContent) return;
    
    const city = cityInput.value.trim();
    
    if (!city) {
        alert('Please enter a city name');
        return;
    }
    
    weatherContent.innerHTML = '<div class="loading">Loading weather data...</div>';
    
    // OpenWeatherMap API key (you should replace this with your own)
    const apiKey = 'demo'; // This is a demo key, replace with your actual API key
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    try {
        // Since we can't actually call the API without a valid key, let's simulate the response
        // In a real application, you would use: const response = await fetch(apiUrl);
        
        // Simulated weather data for demonstration
        const simulatedData = {
            name: city,
            sys: { country: 'VN' },
            main: {
                temp: 28 + Math.random() * 5,
                feels_like: 30 + Math.random() * 5,
                humidity: 60 + Math.random() * 20,
                pressure: 1010 + Math.random() * 10
            },
            weather: [{
                main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
                description: 'partly cloudy'
            }],
            wind: {
                speed: 2 + Math.random() * 5
            }
        };
        
        displayWeather(simulatedData);
        
    } catch (error) {
        weatherContent.innerHTML = `
            <div class="loading" style="color: #e74c3c;">
                Error loading weather data. Please try again later.
                <br><small>Note: This demo uses simulated data. To use real data, add your OpenWeatherMap API key.</small>
            </div>
        `;
    }
}

function displayWeather(data) {
    const weatherContent = document.getElementById('weatherContent');
    
    weatherContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="font-size: 28px; color: #333;">${data.name}, ${data.sys.country}</h3>
            <div style="font-size: 48px; margin: 10px 0;">${getWeatherEmoji(data.weather[0].main)}</div>
            <p style="font-size: 18px; color: #666; text-transform: capitalize;">${data.weather[0].description}</p>
        </div>
        <div class="weather-info">
            <div class="weather-item">
                <div>🌡️ Temperature</div>
                <strong>${data.main.temp.toFixed(1)}°C</strong>
            </div>
            <div class="weather-item">
                <div>🤔 Feels Like</div>
                <strong>${data.main.feels_like.toFixed(1)}°C</strong>
            </div>
            <div class="weather-item">
                <div>💧 Humidity</div>
                <strong>${data.main.humidity}%</strong>
            </div>
            <div class="weather-item">
                <div>🌪️ Wind Speed</div>
                <strong>${data.wind.speed.toFixed(1)} m/s</strong>
            </div>
            <div class="weather-item">
                <div>📊 Pressure</div>
                <strong>${data.main.pressure} hPa</strong>
            </div>
        </div>
    `;
}

function getWeatherEmoji(weather) {
    const emojiMap = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️'
    };
    return emojiMap[weather] || '🌤️';
}

// ============= RSS Feed Functions =============
async function loadRSSFeed() {
    const rssContent = document.getElementById('rssContent');
    const rssSource = document.getElementById('rssSource');
    
    if (!rssContent) return;
    
    rssContent.innerHTML = '<div class="loading">Loading RSS feed...</div>';
    
    const source = rssSource ? rssSource.value : 'thanhnien';
    
    // If Thanh Nien source is selected, fetch real RSS
    if (source === 'thanhnien') {
        try {
            // Use RSS2JSON API to convert RSS to JSON (free service)
            const rssUrl = 'https://thanhnien.vn/rss/giao-duc.rss';
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.status === 'ok' && data.items) {
                const feeds = data.items.map(item => ({
                    title: item.title,
                    description: item.description || item.content || 'No description available',
                    date: new Date(item.pubDate).toLocaleString('vi-VN'),
                    link: item.link
                }));
                displayRSSFeed(feeds);
            } else {
                throw new Error('Failed to load RSS feed');
            }
        } catch (error) {
            console.error('Error loading RSS:', error);
            rssContent.innerHTML = `
                <div class="loading" style="color: #e74c3c;">
                    Không thể tải RSS feed từ Thanh Niên. Vui lòng thử lại sau.
                    <br><small>Lỗi: ${error.message}</small>
                </div>
            `;
        }
    } else {
        // Use simulated data for other sources
        setTimeout(() => {
            const feeds = generateSimulatedRSSFeed(source);
            displayRSSFeed(feeds);
        }, 500);
    }
}

function generateSimulatedRSSFeed(source) {
    const feedData = {
        tech: [
            {
                title: 'New AI Model Breaks Performance Records',
                description: 'Researchers announce breakthrough in artificial intelligence capabilities...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString(),
                link: '#'
            },
            {
                title: 'Quantum Computing Makes Major Advance',
                description: 'Scientists achieve new milestone in quantum computing stability...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 5).toLocaleString(),
                link: '#'
            },
            {
                title: 'Tech Giants Announce Collaboration on Open Standards',
                description: 'Major technology companies unite to develop new industry standards...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 8).toLocaleString(),
                link: '#'
            }
        ],
        business: [
            {
                title: 'Global Markets Show Strong Growth',
                description: 'Stock markets around the world post impressive gains...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 3).toLocaleString(),
                link: '#'
            },
            {
                title: 'Startup Raises $100M in Series B Funding',
                description: 'Fast-growing startup secures major investment round...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 6).toLocaleString(),
                link: '#'
            },
            {
                title: 'New Trade Agreement Boosts International Commerce',
                description: 'Countries finalize deal expected to increase trade volumes...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 10).toLocaleString(),
                link: '#'
            }
        ],
        science: [
            {
                title: 'Scientists Discover New Species in Deep Ocean',
                description: 'Marine biologists identify previously unknown creatures...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 4).toLocaleString(),
                link: '#'
            },
            {
                title: 'Breakthrough in Cancer Treatment Research',
                description: 'New therapy shows promising results in clinical trials...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 7).toLocaleString(),
                link: '#'
            },
            {
                title: 'Space Mission Returns with Rare Samples',
                description: 'Spacecraft brings back materials for scientific analysis...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 12).toLocaleString(),
                link: '#'
            }
        ],
        world: [
            {
                title: 'International Summit Addresses Climate Goals',
                description: 'World leaders meet to discuss environmental initiatives...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 1).toLocaleString(),
                link: '#'
            },
            {
                title: 'Cultural Festival Celebrates Global Diversity',
                description: 'Annual event brings together traditions from around the world...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 9).toLocaleString(),
                link: '#'
            },
            {
                title: 'New Educational Initiative Launched Globally',
                description: 'Program aims to improve access to quality education worldwide...',
                date: new Date(Date.now() - 1000 * 60 * 60 * 11).toLocaleString(),
                link: '#'
            }
        ]
    };
    
    return feedData[source] || feedData.tech;
}

function displayRSSFeed(feeds) {
    const rssContent = document.getElementById('rssContent');
    
    if (feeds.length === 0) {
        rssContent.innerHTML = '<div class="loading">Không có tin tức nào</div>';
        return;
    }
    
    rssContent.innerHTML = '';
    feeds.forEach(item => {
        const rssItem = document.createElement('div');
        rssItem.className = 'rss-item';
        
        // Extract image from description if available
        let imageUrl = '';
        const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
            imageUrl = imgMatch[1];
        }
        
        // Remove HTML tags from description and limit length
        const cleanDescription = item.description
            .replace(/<img[^>]*>/g, '') // Remove img tags
            .replace(/<a[^>]*>/g, '') // Remove opening a tags
            .replace(/<\/a>/g, '') // Remove closing a tags
            .replace(/<[^>]*>/g, '') // Remove all other HTML tags
            .replace(/&[^;]+;/g, ' ') // Remove HTML entities
            .replace(/\s+/g, ' ') // Remove extra whitespace
            .trim()
            .substring(0, 300) + (item.description.length > 300 ? '...' : '');
        
        rssItem.innerHTML = `
            ${imageUrl ? `<img src="${imageUrl}" alt="${item.title}" class="rss-item-image" onerror="this.style.display='none'">` : ''}
            <div class="rss-item-content">
                <h3>${item.title}</h3>
                <p>${cleanDescription}</p>
                <div class="date">📅 ${item.date}</div>
                <span class="read-more">Đọc tiếp →</span>
            </div>
        `;
        
        rssItem.onclick = () => {
            if (item.link && item.link !== '#') {
                window.open(item.link, '_blank');
            }
        };
        rssContent.appendChild(rssItem);
    });
}