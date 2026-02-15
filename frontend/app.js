/**
 * M&A Synergies Analysis Tool - Frontend
 *
 * TODO: Implement per PROJECT_SPEC.md
 */

const API_BASE = 'http://localhost:5000/api';

// State
let allSynergies = [];
let filteredSynergies = [];
let currentFilters = {
    function: '',
    industry: '',
    type: ''
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Synergies Tool...');

    await loadData();
    setupEventListeners();
    render();
});

/**
 * Load data from API
 */
async function loadData() {
    try {
        // TODO: Fetch from real API
        // const response = await fetch(`${API_BASE}/synergies`);
        // allSynergies = await response.json();

        // Placeholder data for development
        allSynergies = getDummyData();
        filteredSynergies = allSynergies;

        console.log(`✅ Loaded ${allSynergies.length} synergies`);
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

/**
 * Set up event listeners for filters
 */
function setupEventListeners() {
    document.getElementById('function-filter').addEventListener('change', handleFilterChange);
    document.getElementById('industry-filter').addEventListener('change', handleFilterChange);
    document.getElementById('type-filter').addEventListener('change', handleFilterChange);
}

/**
 * Handle filter changes
 */
function handleFilterChange(event) {
    const filterType = event.target.id.replace('-filter', '');
    currentFilters[filterType] = event.target.value;

    applyFilters();
    render();
}

/**
 * Apply current filters to synergies
 */
function applyFilters() {
    filteredSynergies = allSynergies.filter(synergy => {
        if (currentFilters.function && synergy.function !== currentFilters.function) {
            return false;
        }
        if (currentFilters.industry && synergy.industry !== currentFilters.industry) {
            return false;
        }
        if (currentFilters.type && synergy.synergy_type !== currentFilters.type) {
            return false;
        }
        return true;
    });
}

/**
 * Render the UI
 */
function render() {
    renderStats();
    renderSynergiesList();
}

/**
 * Render summary statistics
 */
function renderStats() {
    // TODO: Calculate real stats from filteredSynergies
    document.getElementById('stat-count').textContent = filteredSynergies.length;
    document.getElementById('stat-min').textContent = '$15M';
    document.getElementById('stat-max').textContent = '$45M';
    document.getElementById('stat-functions').textContent = '7';
}

/**
 * Render synergies list
 */
function renderSynergiesList() {
    const container = document.getElementById('synergies-list');
    const resultsCount = document.getElementById('results-count');

    resultsCount.textContent = `${filteredSynergies.length} opportunities found`;

    if (filteredSynergies.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-gray-500">
                No synergies found matching current filters
            </div>
        `;
        return;
    }

    container.innerHTML = filteredSynergies.map(synergy => `
        <div class="synergy-card p-6 cursor-pointer hover:bg-gray-50" onclick="showDetail(${synergy.id})">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-2xl">${getFunctionIcon(synergy.function)}</span>
                        <h3 class="text-lg font-semibold">${synergy.name}</h3>
                    </div>

                    <p class="text-gray-600 mb-3">${synergy.description}</p>

                    <div class="flex gap-4 text-sm text-gray-500">
                        <span>💰 ${formatValue(synergy.value_min)} - ${formatValue(synergy.value_max)}</span>
                        <span>⏱️ ${synergy.timeframe}</span>
                        <span>🏢 ${synergy.industry || 'All Industries'}</span>
                    </div>
                </div>

                <div class="ml-4">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(synergy.synergy_type)}">
                        ${synergy.synergy_type}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Show detail modal
 */
function showDetail(synergyId) {
    const synergy = allSynergies.find(s => s.id === synergyId);
    if (!synergy) return;

    document.getElementById('modal-title').textContent = synergy.name;
    document.getElementById('modal-content').innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p class="text-gray-600">Function</p>
                    <p class="font-semibold">${synergy.function}</p>
                </div>
                <div>
                    <p class="text-gray-600">Type</p>
                    <p class="font-semibold">${synergy.synergy_type}</p>
                </div>
                <div>
                    <p class="text-gray-600">Industry</p>
                    <p class="font-semibold">${synergy.industry || 'All'}</p>
                </div>
                <div>
                    <p class="text-gray-600">Timeframe</p>
                    <p class="font-semibold">${synergy.timeframe}</p>
                </div>
            </div>

            <div>
                <p class="text-gray-600 text-sm">Description</p>
                <p class="mt-1">${synergy.description}</p>
            </div>

            <div class="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
                <div>
                    <p class="text-gray-600 text-sm">Value Range</p>
                    <p class="font-bold text-green-600">${formatValue(synergy.value_min)} - ${formatValue(synergy.value_max)}</p>
                </div>
                <div>
                    <p class="text-gray-600 text-sm">Complexity</p>
                    <p class="font-semibold">${synergy.complexity}</p>
                </div>
                <div>
                    <p class="text-gray-600 text-sm">Risk</p>
                    <p class="font-semibold">${synergy.risk_level}</p>
                </div>
            </div>

            ${synergy.examples ? `
                <div>
                    <p class="text-gray-600 text-sm">Historical Examples</p>
                    <p class="mt-1 text-sm">${synergy.examples}</p>
                </div>
            ` : ''}

            ${synergy.sources ? `
                <div>
                    <p class="text-gray-600 text-sm">Sources</p>
                    <p class="mt-1 text-sm italic">${synergy.sources}</p>
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('detail-modal').classList.remove('hidden');
}

/**
 * Close detail modal
 */
function closeModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

/**
 * Helper functions
 */

function getFunctionIcon(func) {
    const icons = {
        'IT': '💻',
        'HR': '👥',
        'Finance': '💰',
        'Sales': '📈',
        'Operations': '⚙️',
        'Legal': '⚖️',
        'R&D': '🔬'
    };
    return icons[func] || '📊';
}

function getTypeColor(type) {
    const colors = {
        'Cost Reduction': 'bg-green-100 text-green-800',
        'Revenue Enhancement': 'bg-blue-100 text-blue-800',
        'Operational Efficiency': 'bg-purple-100 text-purple-800',
        'Strategic': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
}

function formatValue(value) {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
}

/**
 * Dummy data for development
 * TODO: Remove when API is connected
 */
function getDummyData() {
    return [
        {
            id: 1,
            name: "Data Center Consolidation",
            function: "IT",
            synergy_type: "Cost Reduction",
            industry: "Technology",
            description: "Consolidate 5 data centers into 2, migrate non-critical workloads to cloud",
            value_min: 2000000,
            value_max: 5000000,
            timeframe: "12-18 months",
            complexity: "High",
            risk_level: "Medium",
            examples: "Microsoft-LinkedIn saved $500M over 3 years",
            sources: "McKinsey M&A Report 2023"
        },
        // TODO: Add 19-29 more synergies for demo
    ];
}
