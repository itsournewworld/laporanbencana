document.addEventListener('DOMContentLoaded', () => {
    const disasterForm = document.getElementById('disasterForm');
    const reportsContainer = document.getElementById('reportsContainer');
    const getLocButton = document.getElementById('getLocButton');
    const locationInput = document.getElementById('location');
    
    // --- Bagian Peta Leaflet ---
    // Inisialisasi peta
    const map = L.map('map').setView([-6.2088, 106.8456], 10); // Koordinat default (Jakarta)

    // Tambahkan layer tile (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let currentMarker = null;

    // Fungsi untuk menambahkan marker laporan ke peta
    function addReportMarker(report) {
        if (report.latitude && report.longitude) {
            const marker = L.marker([report.latitude, report.longitude]).addTo(map);
            marker.bindPopup(`<b>${report.disasterType}</b><br>${report.description}`).openPopup();
            return marker;
        }
        return null;
    }

    // Fungsi klik pada peta untuk mengisi input lokasi
    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lon = e.latlng.lng.toFixed(6);
        locationInput.value = `${lat}, ${lon}`;

        // Hapus marker sebelumnya dan tambahkan marker baru di lokasi klik
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        currentMarker = L.marker(e.latlng).addTo(map);
        currentMarker.bindPopup("Lokasi yang dipilih").openPopup();
    });

    // --- Bagian Geolocation (Mendapatkan Lokasi Saat Ini) ---
    getLocButton.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(6);
                    const lon = position.coords.longitude.toFixed(6);
                    locationInput.value = `${lat}, ${lon}`;
                    
                    // Update peta dan marker
                    map.setView([lat, lon], 14); 
                    if (currentMarker) {
                        map.removeLayer(currentMarker);
                    }
                    currentMarker = L.marker([lat, lon]).addTo(map);
                    currentMarker.bindPopup("Lokasi Anda saat ini").openPopup();
                },
                (error) => {
                    alert('Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan. Error: ' + error.message);
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            alert('Browser Anda tidak mendukung Geolocation.');
        }
    });

    // --- Bagian Pengelolaan Laporan (Local Storage) ---
    let reports = JSON.parse(localStorage.getItem('disasterReports')) || [];
    let mapMarkers = [];

    // Fungsi untuk merender daftar laporan dan marker peta
    function renderReports() {
        reportsContainer.innerHTML = ''; // Kosongkan daftar
        mapMarkers.forEach(marker => map.removeLayer(marker)); // Hapus marker lama
        mapMarkers = []; // Reset array marker

        // Tampilkan laporan terbaru di awal
        reports.slice().reverse().forEach(report => {
            // 1. Tambahkan ke Daftar
            const listItem = document.createElement('li');
            const reporter = report.reporterName || 'Anonim';
            listItem.innerHTML = `
                <strong>${report.disasterType}</strong><br>
                Lokasi: ${report.location}<br>
                Deskripsi: ${report.description}<br>
                Pelapor: ${reporter} (<em>${new Date(report.timestamp).toLocaleString()}</em>)
            `;
            reportsContainer.appendChild(listItem);

            // 2. Tambahkan Marker ke Peta
            const marker = addReportMarker(report);
            if(marker) {
                mapMarkers.push(marker);
            }
        });
    }

    // --- Bagian Submit Formulir ---
    disasterForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const disasterType = document.getElementById('disasterType').value;
        const location = locationInput.value;
        const description = document.getElementById('description').value;
        const reporterName = document.getElementById('reporterName').value;

        // Mendapatkan koordinat dari input lokasi jika formatnya Lat, Lon
        let lat, lon;
        const coordsMatch = location.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
        if (coordsMatch) {
            lat = parseFloat(coordsMatch[1]);
            lon = parseFloat(coordsMatch[2]);
        }

        const newReport = {
            id: Date.now(),
            disasterType,
            location,
            latitude: lat,
            longitude: lon,
            description,
            reporterName,
            timestamp: new Date().toISOString()
        };

        // Simpan laporan
        reports.push(newReport);
        localStorage.setItem('disasterReports', JSON.stringify(reports));

        alert('Laporan bencana berhasil dikirim!');
        disasterForm.reset();
        
        // Hapus marker setelah lapor
        if (currentMarker) {
            map.removeLayer(currentMarker);
            currentMarker = null;
        }

        renderReports(); // Perbarui tampilan
    });

    // Panggil fungsi renderReports saat pertama kali load
    renderReports();
});