
// SIMPAN DATA & GENERATE BARCODE (USER)
let currentTicketID = "";

const ticketForm = document.getElementById('ticketForm');
if (ticketForm) {
    ticketForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        currentTicketID = "HUT33-" + Math.floor(Math.random() * 1000000);
        const dataBaru = {
            id: currentTicketID,
            nama: document.getElementById('nama').value,
            kelas: document.getElementById('kelas').value,
            wa: document.getElementById('wa').value,
            status: "Belum Bayar",
            waktu: new Date().toLocaleString()
        };

        let daftarTiket = JSON.parse(localStorage.getItem('tiketData')) || [];
        daftarTiket.push(dataBaru);
        localStorage.setItem('tiketData', JSON.stringify(daftarTiket));
        console.log('Data tiket disimpan:', daftarTiket);

        tampilkanTiket(dataBaru);
        
        // Cek status setiap 2 detik
        setInterval(cekStatusPembayaran, 2000);
    });
}

function tampilkanTiket(data) {
    ticketForm.style.display = "none";
    document.getElementById('ticketResult').style.display = "block";
    
    const statusEl = document.getElementById('statusUser');
    statusEl.innerText = data.status;
    statusEl.className = data.status === "Lunas" ? "status-badge text-success" : "status-badge text-danger";

    if(data.status === "Lunas") {
        document.getElementById('congratsMessage').style.display = "block";
        document.getElementById('paymentSection').style.display = "none";
    }

    JsBarcode("#barcode", data.id, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 40,
        displayValue: true
    });
}

function cekStatusPembayaran() {
    let daftarTiket = JSON.parse(localStorage.getItem('tiketData')) || [];
    const dataTerbaru = daftarTiket.find(t => t.id === currentTicketID);
    
    if (dataTerbaru && dataTerbaru.status === "Lunas") {
        tampilkanTiket(dataTerbaru);
    }
}

// LOGIKA ADMIN
const adminTableBody = document.getElementById('adminTableBody');
if (adminTableBody) {
    const muatData = () => {
        let daftarTiket = JSON.parse(localStorage.getItem('tiketData')) || [];
        console.log('Data tiket dimuat:', daftarTiket);
        adminTableBody.innerHTML = '';
        
        daftarTiket.forEach((item, index) => {
            const statusClass = item.status === "Lunas" ? "text-blue" : "text-danger";
            adminTableBody.innerHTML += `
                <tr>
                    <td class="text-white">${index + 1}</td>
                    <td class="text-white">${item.nama}</td>
                    <td class="text-white">${item.id}</td>
                    <td class="${statusClass}">${item.status}</td>
                    <td>
                        <button onclick="konfirmasiLunas('${item.id}')" class="btn-primary" style="padding: 5px 10px; font-size: 12px;">Set Lunas</button>
                    </td>
                </tr>
            `;
        });
    };

    window.konfirmasiLunas = (id) => {
        let daftarTiket = JSON.parse(localStorage.getItem('tiketData')) || [];
        const index = daftarTiket.findIndex(t => t.id === id);
        if (index !== -1) {
            daftarTiket[index].status = "Lunas";
            localStorage.setItem('tiketData', JSON.stringify(daftarTiket));
            muatData();
            alert(`Selamat ${daftarTiket[index].nama}! Pembayaran Anda telah dikonfirmasi.`);
        }
    };

    window.scanTicket = () => {
        const input = document.getElementById('scanInput').value;
        let daftarTiket = JSON.parse(localStorage.getItem('tiketData')) || [];
        const data = daftarTiket.find(t => t.id === input);

        if (data) {
            alert(`DATA DITEMUKAN!\nNama: ${data.nama}\nStatus: ${data.status.toUpperCase()}`);
            if(data.status !== "Lunas") {
                if(confirm("User belum bayar. Bayar cash sekarang?")) {
                    konfirmasiLunas(data.id);
                }
            }
        } else {
            alert("Tiket Tidak Valid!");
        }
    };

    window.clearData = () => {
        if(confirm("Yakin hapus semua data?")) {
            localStorage.removeItem('tiketData');
            muatData();
        }
    };

    muatData();
}

// Fungsi bantu user
window.showQR = () => {
    document.getElementById('qrisImage').style.display = 'block';
};

window.goBack = () => {
    document.getElementById('ticketResult').style.display = 'none';
    document.getElementById('ticketForm').style.display = 'block';
};

// Fungsi scan dengan kamera
window.scanWithCamera = () => {
    const interactive = document.getElementById('interactive');
    interactive.style.display = 'block';

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: interactive,
            constraints: {
                width: 640,
                height: 480,
                facingMode: "environment" // Gunakan kamera belakang
            },
        },
        locator: {
            patchSize: "medium",
            halfSample: true,
        },
        numOfWorkers: 2,
        decoder: {
            readers: ["code_128_reader"] // Sesuai dengan format barcode yang digunakan
        },
        locate: true,
    }, function (err) {
        if (err) {
            console.log(err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function (result) {
        const code = result.codeResult.code;
        document.getElementById('scanInput').value = code;
        Quagga.stop();
        interactive.style.display = 'none';
        alert('Barcode terdeteksi: ' + code + '. Klik Scan untuk proses.');
        // scanTicket(); // Hapus auto scan, biar user klik manual
    });
};

// Fungsi scan dari gambar upload
window.scanFromImage = () => {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('Pilih gambar terlebih dahulu.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        Quagga.decodeSingle({
            decoder: {
                readers: ["code_128_reader"]
            },
            locate: true,
            src: e.target.result
        }, function(result) {
            if (result.codeResult) {
                const code = result.codeResult.code;
                document.getElementById('scanInput').value = code;
                alert('Barcode dari gambar terdeteksi: ' + code + '. Klik Scan untuk proses.');
            } else {
                alert('Barcode tidak ditemukan di gambar.');
            }
        });
    };
    reader.readAsDataURL(file);
};
