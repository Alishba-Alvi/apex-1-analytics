const API_BASE = "http://127.0.0.1:8000/api";
let currentTab = "strategic";
let activeSession = null;
let chartInstances = {};

// Check server connection on boot
fetch(`${API_BASE}/load_session`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({year: 2024, location: "Bahrain", session_type: "Race"})
}).then(() => {
    document.getElementById("connectionStatus").className = "numeric-font text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-md uppercase";
    document.getElementById("connectionStatus").innerText = "Engine Connected";
}).catch(() => {});

async function syncSession() {
    const btn = document.getElementById("syncBtn");
    btn.innerHTML = `<span class="text-center leading-snug">Synchronizing<br>Data Frame Matrix...</span>`;
    btn.disabled = true;

    const payload = {
        year: parseInt(document.getElementById("season").value),
        location: document.getElementById("gp").value,
        session_type: document.getElementById("session_type").value
    };

    try {
        const res = await fetch(`${API_BASE}/load_session`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === "success") {
            activeSession = payload;
            populateSelectOptions("driver1", data.drivers, 0);
            populateSelectOptions("driver2", data.drivers, 1);
            document.getElementById("driverConfigBlock").classList.remove("hidden");
            await loadAnalytics();
        }
    } catch(e) {
        alert("API Integration Communication Fault: " + e);
    } finally {
        btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-black"></i><span>Execute Network Sync</span>`;
        btn.disabled = false;
        lucide.createIcons();
    }
}

function populateSelectOptions(elemId, list, defaultIndex) {
    const sel = document.getElementById(elemId);
    sel.innerHTML = "";
    list.forEach((item, idx) => {
        let opt = document.createElement("option");
        opt.value = item;
        opt.innerText = `Objective Target [${item}]`;
        if (idx === defaultIndex) opt.selected = true;
        sel.appendChild(opt);
    });
}

async function loadAnalytics() {
    if (!activeSession) return;
    const ph = document.getElementById("dashboardPlaceholder");
    ph.classList.remove("hidden");
    ph.innerHTML = `
        <div class="mb-4 text-[#00F5D4] animate-spin">
            <i data-lucide="loader-2" class="w-10 h-10"></i>
        </div>
        <h3 class="text-lg heading-font font-bold mb-1 text-white">Fetching Telemetry...</h3>
        <p class="text-sm text-gray-400 max-w-sm">Loading session data from FastF1. This may take 20–60 seconds on first load.</p>
    `;
    lucide.createIcons();
    hideAllPanels();

    const d1 = document.getElementById("driver1").value;
    const d2 = document.getElementById("driver2").value;

    try {
        const url = `${API_BASE}/analysis?year=${activeSession.year}&location=${activeSession.location}&session_type=${activeSession.session_type}&d1=${d1}&d2=${d2}`;
        const res = await fetch(url);
        const data = await res.json();

        document.getElementById("kpiTopSpeed").innerHTML = `${data.top_speed.toFixed(1)} <span class="text-xs text-gray-400">km/h</span>`;
        document.getElementById("kpiFastestLap").innerText = data.fastest_lap;
        document.getElementById("kpiTyreLife").innerHTML = `${data.tyre_life} <span class="text-xs text-gray-400">laps</span>`;

        const prob = data.pit_probability;
        const pitEl = document.getElementById("kpiPitProb");
        const pitBar = document.getElementById("kpiPitBar");
        pitEl.innerText = `${prob}%`;
        let pitColor = '#00F5D4';
        if (prob >= 55) pitColor = '#FFBE0B';
        if (prob >= 75) pitColor = '#FF006E';
        pitEl.style.color = pitColor;
        pitBar.style.width = `${Math.min(prob, 100)}%`;
        pitBar.style.background = pitColor;

        if (data.cliff_detected) {
            const alertEl = document.getElementById("cliffAlert");
            alertEl.innerText = `🚨 THEORETICAL PERFORMANCE CLIFF DETECTED EXPONENTIALLY ON LAP ${data.cliff_lap} FOR DRIVER OBJECTIVE ${d1}`;
            alertEl.classList.remove("hidden");
        } else {
            document.getElementById("cliffAlert").classList.add("hidden");
        }

        renderStrategicCharts(data);
        renderTelemetryCharts(data, d1, d2);
        renderMLCharts(data);

        ph.innerHTML = `
            <div class="mb-4 text-purple-400 animate-bounce">
                <i data-lucide="radio" class="w-10 h-10"></i>
            </div>
            <h3 class="text-lg heading-font font-bold mb-1 text-white">System Standby Matrix</h3>
            <p class="text-sm text-gray-400 max-w-sm">Synchronize the mission telemetry profile on the sidebar command panel to activate standard execution channels.</p>
        `;
        lucide.createIcons();
        ph.classList.add("hidden");
        switchTab(currentTab);

    } catch(e) {
        alert("Error compilation analytical logs: " + e);
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(`tab-${tabId}`).classList.add("active");
    if (!activeSession) return;
    hideAllPanels();
    document.getElementById(`panel-${tabId}`).classList.remove("hidden");
}

function hideAllPanels() {
    ["strategic", "telemetry", "ml"].forEach(p => {
        document.getElementById(`panel-${p}`).classList.add("hidden");
    });
}

function destroyChart(id) {
    if (chartInstances[id]) { chartInstances[id].destroy(); }
}

function renderStrategicCharts(data) {
    destroyChart("chartTyreDeg");
    chartInstances["chartTyreDeg"] = new Chart(document.getElementById("chartTyreDeg"), {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Lap Degradation Node',
                data: data.tyre_deg_data,
                backgroundColor: '#00F5D4',
                borderColor: '#00F5D4',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Tyre Age (Laps)', color: '#A0A0A0' }, ticks: { color: '#FFF' } },
                y: { title: { display: true, text: 'Lap Duration (Seconds)', color: '#A0A0A0' }, ticks: { color: '#FFF' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    destroyChart("chartGridDelta");
    chartInstances["chartGridDelta"] = new Chart(document.getElementById("chartGridDelta"), {
        type: 'bar',
        data: {
            labels: data.delta_matrix.map(d => d.driver),
            datasets: [{
                data: data.delta_matrix.map(d => d.gained),
                backgroundColor: data.delta_matrix.map(d => d.gained >= 0 ? 'rgba(0, 245, 212, 0.6)' : 'rgba(255, 0, 110, 0.6)'),
                borderColor: data.delta_matrix.map(d => d.gained >= 0 ? '#00F5D4' : '#FF006E'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            scales: {
                x: { ticks: { color: '#FFF' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#FFF' }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    destroyChart("chartRaceTrace");
    const trDatasets = Object.keys(data.race_trace).map((driver, idx) => {
        const colors = ['#00F5D4', '#FF006E', '#7B2CBF', '#FFBE0B', '#3A86FF'];
        return {
            label: driver,
            data: data.race_trace[driver].map(pt => ({ x: pt.lap, y: pt.delta })),
            borderColor: colors[idx % colors.length],
            borderWidth: 2, pointRadius: 0, fill: false, tension: 0.1
        };
    });
    chartInstances["chartRaceTrace"] = new Chart(document.getElementById("chartRaceTrace"), {
        type: 'line',
        data: { datasets: trDatasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Lap Map Target Index', color: '#A0A0A0' }, ticks: { color: '#FFF' } },
                y: { title: { display: true, text: 'Relative Gap Metric (Secs)', color: '#A0A0A0' }, ticks: { color: '#FFF' } }
            },
            plugins: { legend: { labels: { color: '#FFF' } } }
        }
    });
}

function renderTelemetryCharts(data, d1, d2) {
    destroyChart("chartSpatialTrack");
    chartInstances["chartSpatialTrack"] = new Chart(document.getElementById("chartSpatialTrack"), {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Track Vector Path',
                data: data.spatial_map.map(p => ({ x: p.x, y: p.y })),
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: '#7B2CBF',
                showLine: true, pointRadius: 0, borderWidth: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { display: false }, y: { display: false } },
            plugins: { legend: { display: false } }
        }
    });

    const distAxisD1 = data.overlay_d1.map(p => p.dist);
    const buildSubChartDef = (canvasId, labelY, d1Data, d2Data) => {
        destroyChart(canvasId);
        chartInstances[canvasId] = new Chart(document.getElementById(canvasId), {
            type: 'line',
            data: {
                labels: distAxisD1,
                datasets: [
                    { label: d1, data: d1Data, borderColor: '#00F5D4', borderWidth: 1.5, pointRadius: 0, fill: false },
                    { label: d2, data: d2Data, borderColor: '#FF006E', borderWidth: 1.5, pointRadius: 0, fill: false }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { display: canvasId === "subChartBrake", ticks: { color: '#FFF' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { title: { display: true, text: labelY, color: '#A0A0A0' }, ticks: { color: '#FFF' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: { legend: { display: canvasId === "subChartSpeed", labels: { color: '#FFF' } } }
            }
        });
    };

    buildSubChartDef("subChartSpeed",    "Velocity (km/h)",    data.overlay_d1.map(p => p.speed),    data.overlay_d2.map(p => p.speed));
    buildSubChartDef("subChartRPM",      "Engine RPM",         data.overlay_d1.map(p => p.rpm),      data.overlay_d2.map(p => p.rpm));
    buildSubChartDef("subChartThrottle", "Throttle %",         data.overlay_d1.map(p => p.throttle), data.overlay_d2.map(p => p.throttle));
    buildSubChartDef("subChartBrake",    "Brake Matrix (T/F)", data.overlay_d1.map(p => p.brake),    data.overlay_d2.map(p => p.brake));
}

function renderMLCharts(data) {
    destroyChart("chartKMeans");
    const colorPaletteZones = ['#7B2CBF', '#3A86FF', '#FFBE0B'];
    const datasetsML = [0, 1, 2].map(z => ({
        label: `Domain State Group [Zone ${z}]`,
        data: data.cluster_samples.filter(p => p.zone === z).map(p => ({ x: p.speed, y: p.rpm })),
        backgroundColor: colorPaletteZones[z],
        pointRadius: 4
    }));
    chartInstances["chartKMeans"] = new Chart(document.getElementById("chartKMeans"), {
        type: 'scatter',
        data: { datasets: datasetsML },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Velocity Baseline (km/h)', color: '#A0A0A0' }, ticks: { color: '#FFF' } },
                y: { title: { display: true, text: 'Engine RPM Rotation Scale', color: '#A0A0A0' }, ticks: { color: '#FFF' } }
            },
            plugins: { legend: { labels: { color: '#FFF' } } }
        }
    });

    document.getElementById("clusterInterpretFrame").innerHTML = `
        <div class="p-3 rounded-lg border border-[#7B2CBF]/30 bg-[#7B2CBF]/5">
            <span class="font-bold block text-[#7B2CBF] uppercase mb-1">🟣 Cluster Zone 0</span>
            <p class="text-[11px] text-gray-300 font-medium">${data.zone_mappings["0"] || "Heavy Braking Core Vector Mode Active"}</p>
        </div>
        <div class="p-3 rounded-lg border border-[#3A86FF]/30 bg-[#3A86FF]/5">
            <span class="font-bold block text-[#3A86FF] uppercase mb-1">🔵 Cluster Zone 1</span>
            <p class="text-[11px] text-gray-300 font-medium">${data.zone_mappings["1"] || "Kinetic Corner Tracking Apex Segment Node"}</p>
        </div>
        <div class="p-3 rounded-lg border border-[#FFBE0B]/30 bg-[#FFBE0B]/5">
            <span class="font-bold block text-[#FFBE0B] uppercase mb-1">🟡 Cluster Zone 2</span>
            <p class="text-[11px] text-gray-300 font-medium">${data.zone_mappings["2"] || "Full Deployment Straightaway Maximum Vector Boundary"}</p>
        </div>
    `;
}