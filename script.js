// HELPER: Update Status Color
function updateStatusColor(statusText) {
    const badge = document.getElementById('statusBadge');
    const text = statusText.toLowerCase();
    
    badge.style.backgroundColor = '#999'; // Default
    
    if (text.includes('critically')) badge.style.backgroundColor = '#8B0000'; // Dark Red
    else if (text.includes('endangered')) badge.style.backgroundColor = '#D32F2F'; // Red
    else if (text.includes('vulnerable')) badge.style.backgroundColor = '#F57C00'; // Orange
    else if (text.includes('near threatened')) badge.style.backgroundColor = '#FBC02D'; // Yellow
    else if (text.includes('least concern')) badge.style.backgroundColor = '#388E3C'; // Green
    
    badge.innerText = statusText.toUpperCase();
}

async function runJanDex() {
    const query = document.getElementById('inputSpecies').value.trim();
    if (!query) return;

    // UI Reset
    document.getElementById('commonName').innerText = "Scanning...";
    document.getElementById('eolDesc').innerText = "Accessing database...";
    document.getElementById('imgCredit').innerText = "Fetching...";
    
    // Set image to default loader while waiting
    document.getElementById('mainImg').src = "images/default.jpg";

    try {
        // 1. iNaturalist API
        const inatRes = await fetch(`https://api.inaturalist.org/v1/taxa?q=${query}&per_page=1`);
        const inatData = await inatRes.json();
        
        if (!inatData.results || inatData.results.length === 0) {
            alert("Species not found.");
            return;
        }

        const taxon = inatData.results[0];
        const scientificName = taxon.name;
        const commonName = taxon.preferred_common_name || taxon.name;
        const image = taxon.default_photo ? taxon.default_photo.medium_url : 'images/default.jpg';
        
        // Render
        document.getElementById('commonName').innerText = commonName;
        document.getElementById('scientificName').innerText = scientificName;
        document.getElementById('mainImg').src = image;
        document.getElementById('imgCredit').innerText = "Source: iNaturalist";
        document.getElementById('obsCount').innerText = taxon.observations_count.toLocaleString();

        if (taxon.conservation_status) {
            updateStatusColor(taxon.conservation_status.status_name);
        } else {
            updateStatusColor("Data Deficient");
        }
        
        document.getElementById('iucnVerify').href = `https://www.iucnredlist.org/search?query=${scientificName}`;
        document.getElementById('iucnVerify').style.display = 'inline';

        // 2. GBIF API
        const gbifRes = await fetch(`https://api.gbif.org/v1/species/match?name=${scientificName}`);
        const gbifData = await gbifRes.json();
        document.getElementById('taxFamily').innerText = `${gbifData.kingdom} > ${gbifData.family}`;

        // 3. Wikipedia Fallback (Simpler than EOL)
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${scientificName.replace(" ", "_")}`);
        if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            document.getElementById('eolDesc').innerText = wikiData.extract;
        } else {
            document.getElementById('eolDesc').innerText = "No description available.";
        }

        // 4. Links
        const newsLink = `https://www.google.com/search?q=${commonName}+conservation+news&tbm=nws`;
        const pyqLink = `https://www.google.com/search?q=${commonName}+UPSC+previous+year+questions`;
        
        document.getElementById('resourceLinks').innerHTML = `
            <a href="${newsLink}" target="_blank" class="resource-link">📰 Latest News</a>
            <a href="${pyqLink}" target="_blank" class="resource-link">🎓 UPSC PYQs</a>
            <a href="https://www.inaturalist.org/taxa/${taxon.id}" target="_blank" class="resource-link">📸 More Photos</a>
        `;

    } catch (error) {
        console.error(error);
        alert("Connection error.");
    }
}

// Allow Enter Key
document.getElementById("inputSpecies").addEventListener("keypress", function(event) {
    if (event.key === "Enter") runJanDex();
});