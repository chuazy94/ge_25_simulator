// Initialize the map
const map = L.map('map').setView([1.3521, 103.8198], 11);

// Add the base map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Store election data and results
let electionData = {};
let electionResults = {};
let currentConstituency = null;
let geoJsonLayer = null;

// Party colors
const partyColors = {
    'PAP': '#d7445b',
    'WP': '#489ed5',
    'PSP': '#953932',
    'SDP': '#c768a6',
    'SPP': '#97c083',
    'NSP': '#f58340',
    'IND': '#5d6364',
    'RDU': '#cc5d3a',
    'PAR': '#664c9b',
    'PPP': '#74c1c8',
    'SDA': '#a5aab3',
    'SUP': '#000080'
};

// Function to normalize constituency names for matching
function normalizeConstituencyName(name) {
    return name.toLowerCase().replace(/-/g, ' ').trim();
}

// Function to format constituency names for display
function formatConstituencyName(name) {
    return name.split(' ')
        .map(word => {
            if (word === 'GRC' || word === 'SMC') {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ')
        .replace(/\s+/g, ' ');
}

// Debug function to check data loading
function debugDataLoading() {
    console.log('Checking data loading...');
    console.log('Election Data:', electionData);
    console.log('GeoJSON Layer:', geoJsonLayer);
    
    // Check if the API endpoint is accessible
    fetch('/api/candidates')
        .then(response => {
            console.log('API Response Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('API Data:', data);
        })
        .catch(error => {
            console.error('Error fetching API data:', error);
        });
    
    // Check if the GeoJSON file is accessible
    fetch('/data/ElectoralBoundary2025GEOJSON.geojson')
        .then(response => {
            console.log('GeoJSON Response Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('GeoJSON Data:', data);
        })
        .catch(error => {
            console.error('Error fetching GeoJSON data:', error);
        });
}

// Initialize election results with Marine Parade walkover
function initializeElectionResults() {
    // Find Marine Parade constituency
    Object.entries(electionData).forEach(([constituency, info]) => {
        if (info.notes && info.notes.toLowerCase().includes('walkover')) {
            electionResults[constituency] = {
                'PAP': 100
            };
        }
    });
}

// Load the GeoJSON data
fetch('/api/candidates')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Candidates data loaded:', data);
        // Normalize the keys in the election data
        const normalizedData = {};
        Object.entries(data).forEach(([key, value]) => {
            normalizedData[normalizeConstituencyName(key)] = value;
        });
        electionData = normalizedData;
        
        // Initialize election results with walkover
        initializeElectionResults();
        
        // Load GeoJSON and update parliament seats
        loadGeoJSON();
        updateParliamentSeats();
    })
    .catch(error => {
        console.error('Error loading candidates data:', error);
        document.getElementById('constituency-details').innerHTML = 
            '<p style="color: red;">Error loading candidates data. Please check the console for details.</p>';
    });

// Load and style the GeoJSON
function loadGeoJSON() {
    fetch('/data/ElectoralBoundary2025GEOJSON.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(geojson => {
            console.log('GeoJSON loaded:', geojson);
            geoJsonLayer = L.geoJSON(geojson, {
                style: function(feature) {
                    const constituencyName = normalizeConstituencyName(feature.properties.ED_DESC_FU);
                    const info = electionData[constituencyName];
                    
                    // Set color based on walkover status
                    if (info && info.notes && info.notes.toLowerCase().includes('walkover')) {
                        return {
                            fillColor: partyColors['PAP'],
                            weight: 2,
                            opacity: 1,
                            color: 'white',
                            fillOpacity: 0.7
                        };
                    }
                    
                    return {
                        fillColor: '#808080',
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: function(feature, layer) {
                    const constituencyName = feature.properties.ED_DESC_FU;
                    const normalizedName = normalizeConstituencyName(constituencyName);
                    const displayName = formatConstituencyName(constituencyName);
                    console.log('Adding feature:', constituencyName, 'Normalized:', normalizedName);
                    
                    layer.on({
                        mouseover: function() {
                            console.log('Hovering over:', constituencyName, 'Normalized:', normalizedName);
                            highlightFeature(layer);
                            showConstituencyInfo(normalizedName, displayName);
                        },
                        mouseout: function() {
                            resetHighlight(layer);
                        },
                        click: function() {
                            console.log('Clicked on:', constituencyName, 'Normalized:', normalizedName);
                            currentConstituency = normalizedName;
                            showVoteControls(normalizedName, displayName);
                        }
                    });
                }
            }).addTo(map);
            
            // Debug the layer
            console.log('GeoJSON Layer added to map:', geoJsonLayer);
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
            document.getElementById('constituency-details').innerHTML = 
                '<p style="color: red;">Error loading map data. Please check the console for details.</p>';
        });
}

// Highlight feature on hover
function highlightFeature(layer) {
    layer.setStyle({
        weight: 3,
        color: '#666',
        fillOpacity: 0.9
    });
    layer.bringToFront();
}

// Reset highlight
function resetHighlight(layer) {
    layer.setStyle({
        weight: 2,
        color: 'white',
        fillOpacity: 0.7
    });
}

// Show constituency information
function showConstituencyInfo(constituencyName, displayName) {
    console.log('Showing info for:', constituencyName);
    const info = electionData[constituencyName];
    const detailsDiv = document.getElementById('constituency-details');
    
    if (info) {
        console.log('Constituency info:', info);
        detailsDiv.innerHTML = `
            <h3>${displayName}</h3>
            <p><strong>Type:</strong> ${info.type}</p>
            <p><strong>Number of Electors:</strong> ${info.number_of_electors.toLocaleString()}</p>
            <p><strong>Seats Contested:</strong> ${info.seats_contested}</p>
            ${info.notes ? `<p><strong>Notes:</strong> ${info.notes}</p>` : ''}
        `;
    } else {
        console.warn('No info found for:', constituencyName);
        detailsDiv.innerHTML = `<p>No information available for ${displayName}</p>`;
    }
}

// Show vote controls for a constituency
function showVoteControls(constituencyName, displayName) {
    console.log('Showing vote controls for:', constituencyName);
    const info = electionData[constituencyName];
    const controlsDiv = document.getElementById('party-votes');
    
    if (info && info.parties) {
        console.log('Parties info:', info.parties);
        
        // Check if this is a walkover constituency
        if (info.notes && info.notes.toLowerCase().includes('walkover')) {
            controlsDiv.innerHTML = `
                <h3>${displayName}</h3>
                <p>This is a walkover constituency. No voting is required.</p>
                <div class="party-control">
                    <label>PAP: 100% (Walkover)</label>
                    <input type="range" min="100" max="100" value="100" disabled>
                    <input type="number" min="100" max="100" value="100" disabled>
                    <span class="vote-percentage">100%</span>
                </div>
            `;
            return;
        }
        
        let html = `<h3>${displayName}</h3>`;
        const parties = Object.entries(info.parties);
        
        // Create vote controls for each party
        parties.forEach(([party, candidates]) => {
            const currentVotes = electionResults[constituencyName]?.[party] || 0;
            
            html += `
                <div class="party-control">
                    <label>${party} (${candidates.join(', ')})</label>
                    <div class="vote-inputs">
                        <input type="range" min="0" max="100" value="${currentVotes}" 
                               onchange="updateVotes('${constituencyName}', '${party}', this.value)">
                        <input type="number" min="0" max="100" value="${currentVotes}" 
                               onchange="updateVotes('${constituencyName}', '${party}', this.value)">
                        <span class="vote-percentage">${currentVotes}%</span>
                    </div>
                </div>
            `;
        });
        
        // Add total votes display
        html += `<div class="total-votes">Total Votes: <span id="total-votes-percentage">0</span>%</div>`;
        controlsDiv.innerHTML = html;
        
        // Initialize the vote counter
        updateVoteCounter(constituencyName);
    } else {
        console.warn('No parties info found for:', constituencyName);
        controlsDiv.innerHTML = `<p>No party information available for ${displayName}</p>`;
    }
}

// Update votes for a party in a constituency
function updateVotes(constituencyName, party, percentage) {
    console.log('Updating votes:', { constituencyName, party, percentage });
    
    const newPercentage = parseInt(percentage);
    const info = electionData[constituencyName];
    const currentResults = electionResults[constituencyName] || {};
    
    // Calculate current total votes excluding the party being updated
    let totalOtherVotes = 0;
    Object.entries(currentResults).forEach(([p, votes]) => {
        if (p !== party) {
            totalOtherVotes += votes;
        }
    });
    
    // Ensure total votes don't exceed 100%
    if (newPercentage + totalOtherVotes > 100) {
        alert('Total votes cannot exceed 100%');
        // Reset the inputs to their previous values
        const inputs = document.querySelectorAll(`input[onchange*="${party}"]`);
        const previousValue = currentResults[party] || 0;
        inputs.forEach(input => {
            input.value = previousValue;
        });
        return;
    }
    
    // Update the results
    if (!electionResults[constituencyName]) {
        electionResults[constituencyName] = {};
    }
    electionResults[constituencyName][party] = newPercentage;
    
    // Update all inputs and percentage display
    const inputs = document.querySelectorAll(`input[onchange*="${party}"]`);
    const percentageSpan = inputs[0].parentElement.querySelector('.vote-percentage');
    inputs.forEach(input => {
        input.value = newPercentage;
    });
    percentageSpan.textContent = `${newPercentage}%`;
    
    // Update the vote counter
    updateVoteCounter(constituencyName);
    
    // Update the map color
    updateMapColor(constituencyName);
    
    // Update the results and parliament seats
    updateResults();
    updateParliamentSeats();
}

// Update the vote counter display
function updateVoteCounter(constituencyName) {
    const currentResults = electionResults[constituencyName] || {};
    let totalVotes = 0;
    
    // Calculate total votes
    Object.values(currentResults).forEach(votes => {
        totalVotes += votes;
    });
    
    // Update the total votes display
    document.getElementById('total-votes-percentage').textContent = totalVotes;
    
    // Update the vote counter in the bottom right
    const voteCounter = document.getElementById('vote-counter');
    if (voteCounter) {
        let counterHtml = '<h3>Vote Distribution</h3>';
        Object.entries(currentResults).forEach(([party, votes]) => {
            counterHtml += `
                <div class="party-vote-counter">
                    <span class="party-name">${party}:</span>
                    <span class="vote-percentage">${votes}%</span>
                </div>
            `;
        });
        voteCounter.innerHTML = counterHtml;
    }
}

// Update map color based on winning party
function updateMapColor(constituencyName) {
    const results = electionResults[constituencyName];
    if (results) {
        const winningParty = Object.entries(results)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        console.log('Updating map color for:', constituencyName, 'Winning party:', winningParty);
        
        // Update the GeoJSON layer color
        geoJsonLayer.eachLayer(function(layer) {
            if (normalizeConstituencyName(layer.feature.properties.ED_DESC_FU) === constituencyName) {
                layer.setStyle({
                    fillColor: partyColors[winningParty] || '#808080'
                });
            }
        });
    }
}

// Update the results display
function updateResults() {
    console.log('Updating results with:', electionResults);
    const seatCounts = {};
    const voteCounts = {};
    let totalVotes = 0;
    let totalElectors = 0;
    const constituencyWins = {};
    
    Object.entries(electionResults).forEach(([constituency, results]) => {
        const info = electionData[constituency];
        const winningParty = Object.entries(results)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        // Count seats
        seatCounts[winningParty] = (seatCounts[winningParty] || 0) + info.seats_contested;
        
        // Track constituency wins
        if (!constituencyWins[winningParty]) {
            constituencyWins[winningParty] = [];
        }
        constituencyWins[winningParty].push({
            name: constituency,
            seats: info.seats_contested
        });
        
        // Count votes
        Object.entries(results).forEach(([party, percentage]) => {
            const votes = Math.round((percentage / 100) * info.number_of_electors);
            voteCounts[party] = (voteCounts[party] || 0) + votes;
            totalVotes += votes;
        });
        
        // Add to total electors
        totalElectors += info.number_of_electors;
    });
    
    // Update the parliament composition
    const seatsDiv = document.getElementById('party-seats');
    seatsDiv.innerHTML = Object.entries(seatCounts)
        .map(([party, seats]) => `
            <div class="party-seat">
                <div class="color-box ${party.toLowerCase()}"></div>
                <span>${party}: ${seats} seats</span>
            </div>
        `).join('');
    
    // Update the total votes
    const votesDiv = document.getElementById('total-votes');
    votesDiv.innerHTML = `
        <p>Total Votes Cast: ${totalVotes.toLocaleString()}</p>
        <p>Total Electors: ${totalElectors.toLocaleString()}</p>
        <div class="vote-percentages">
            ${Object.entries(voteCounts)
                .map(([party, votes]) => {
                    const percentage = ((votes / totalElectors) * 100).toFixed(1);
                    return `
                        <div class="party-seat">
                            <div class="color-box ${party.toLowerCase()}"></div>
                            <span>${party}: ${percentage}%</span>
                        </div>
                    `;
                }).join('')}
        </div>
    `;
    
    // Update the summary table
    updateSummaryTable(seatCounts, constituencyWins);
}

// Update the summary table
function updateSummaryTable(seatCounts, constituencyWins) {
    const summaryDiv = document.getElementById('summary-table');
    let html = `
        <h3>Election Summary</h3>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Party</th>
                    <th>Constituencies Won</th>
                    <th>Seats</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add rows for each party with wins
    Object.entries(seatCounts).forEach(([party, seats]) => {
        const constituencies = constituencyWins[party];
        html += `
            <tr>
                <td>
                    <div class="party-seat">
                        <div class="color-box ${party.toLowerCase()}"></div>
                        <span>${party}</span>
                    </div>
                </td>
                <td>${constituencies.map(c => `${c.name} (${c.seats})`).join(', ')}</td>
                <td>${seats}</td>
            </tr>
        `;
    });
    
    // Add total row
    const totalSeats = Object.values(seatCounts).reduce((a, b) => a + b, 0);
    html += `
            <tr class="total-row">
                <td colspan="2">Total Seats Won</td>
                <td>${totalSeats}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2">Remaining Seats</td>
                <td>${97 - totalSeats}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2">Total Parliament Seats</td>
                <td>97</td>
            </tr>
        </tbody>
    </table>`;
    
    summaryDiv.innerHTML = html;
}

// Update parliament seats visualization
function updateParliamentSeats() {
    const seatCounts = {};
    const totalSeats = 97; // Total number of seats in parliament
    
    // Count seats for each party
    Object.entries(electionResults).forEach(([constituency, results]) => {
        const info = electionData[constituency];
        const winningParty = Object.entries(results)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        seatCounts[winningParty] = (seatCounts[winningParty] || 0) + info.seats_contested;
    });
    
    // Create parliament seats visualization
    const parliamentDiv = document.getElementById('parliament-seats');
    let html = '<h3>Parliament Seats (97 Total)</h3><div class="seats-container">';
    
    // Add seats for each party
    Object.entries(seatCounts).forEach(([party, seats]) => {
        for (let i = 0; i < seats; i++) {
            html += `<div class="seat ${party.toLowerCase()}"></div>`;
        }
    });
    
    // Add remaining empty seats
    const filledSeats = Object.values(seatCounts).reduce((a, b) => a + b, 0);
    const remainingSeats = totalSeats - filledSeats;
    for (let i = 0; i < remainingSeats; i++) {
        html += '<div class="seat empty"></div>';
    }
    
    html += '</div>';
    parliamentDiv.innerHTML = html;
}

// Run debug checks when the page loads
window.addEventListener('load', function() {
    console.log('Page loaded, running debug checks...');
    debugDataLoading();
}); 