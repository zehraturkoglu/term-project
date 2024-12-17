const fs = require('fs');
const readline = require('readline');

// Ayarlar ve takım bilgilerini yükleme
const ayarlar = JSON.parse(fs.readFileSync('./data/ayarlar.json', 'utf-8'));
const takimlar = JSON.parse(fs.readFileSync('./data/takimlar.json', 'utf-8'));

// Takım bilgilerini başlangıç değerleriyle oluşturma
const puanDurumu = takimlar.map(takim => ({
    takimKisaAdi: takim.takimKisaAdi,
    takimAdi: takim.takimAdi,
    oynananMac: 0,
    galibiyet: 0,
    beraberlik: 0,
    maglubiyet: 0,
    attigiGol: 0,
    yedigiGol: 0,
    averaj: 0,
    puan: 0
}));

// Maçları takip etmek için veri yapısı
const oynananMaclar = new Set();

// Maç sonucunu işleyen fonksiyon
function macIsle(evSahibi, evSahibiGol, misafir, misafirGol) {
    const evTakim = puanDurumu.find(t => t.takimKisaAdi === evSahibi);
    const misafirTakim = puanDurumu.find(t => t.takimKisaAdi === misafir);

    if (!evTakim || !misafirTakim) {
        console.error('Hatalı takım ismi girildi.');
        return;
    }

    if (oynananMaclar.has(`${evSahibi}-${misafir}`)) {
        console.log('Bu maç daha önce oynandı. İşlenmedi.');
        return;
    }

    oynananMaclar.add(`${evSahibi}-${misafir}`);

    // Maç istatistiklerini güncelle
    evTakim.oynananMac++;
    misafirTakim.oynananMac++;
    evTakim.attigiGol += evSahibiGol;
    evTakim.yedigiGol += misafirGol;
    misafirTakim.attigiGol += misafirGol;
    misafirTakim.yedigiGol += evSahibiGol;

    if (evSahibiGol > misafirGol) {
        evTakim.galibiyet++;
        evTakim.puan += ayarlar.galibiyetPuan;
        misafirTakim.maglubiyet++;
        misafirTakim.puan += ayarlar.maglubiyetPuan;
    } else if (evSahibiGol < misafirGol) {
        misafirTakim.galibiyet++;
        misafirTakim.puan += ayarlar.galibiyetPuan;
        evTakim.maglubiyet++;
        evTakim.puan += ayarlar.maglubiyetPuan;
    } else {
        evTakim.beraberlik++;
        misafirTakim.beraberlik++;
        evTakim.puan += ayarlar.beraberlikPuan;
        misafirTakim.puan += ayarlar.beraberlikPuan;
    }

    // Averajı güncelle
    evTakim.averaj = evTakim.attigiGol - evTakim.yedigiGol;
    misafirTakim.averaj = misafirTakim.attigiGol - misafirTakim.yedigiGol;
}

// Klavyeden maç girişi
async function klavyedenMacGirisi() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    for await (const line of rl) {
        if (line.toLowerCase() === 'exit') {
            rl.close();
            break;
        }

        const [evSahibi, evGol, misafir, misafirGol] = line.split(' ');
        macIsle(evSahibi, parseInt(evGol), misafir, parseInt(misafirGol));
        puanDurumuYazdir();
    }
}

// Dosyadan maç girişi
function dosyadanMacGirisi(dosyaAdi) {
    const maclar = fs.readFileSync(dosyaAdi, 'utf-8').trim().split('\n');
    maclar.forEach(mac => {
        const [evSahibi, evGol, misafir, misafirGol] = mac.split(' ');
        macIsle(evSahibi, parseInt(evGol), misafir, parseInt(misafirGol));
    });
    puanDurumuYazdir();
}

// Puan durumu yazdırma
function puanDurumuYazdir() {
    console.log('\nPuan Durumu:');
    console.table(puanDurumu);
}

// Programın başlangıç noktası
function main() {
    console.log('Lig Fikstürü Yönetim Sistemi');
    console.log('Klavyeden maç girişi yapmak için maç bilgisi girin. Çıkmak için "exit" yazın.');
    console.log('Dosyadan maç girişi yapmak için "dosya <dosya adı>" komutunu kullanın.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', line => {
        if (line.startsWith('dosya ')) {
            const dosyaAdi = line.split(' ')[1];
            dosyadanMacGirisi(dosyaAdi);
        } else if (line.toLowerCase() === 'exit') {
            rl.close();
        } else {
            const [evSahibi, evGol, misafir, misafirGol] = line.split(' ');
            macIsle(evSahibi, parseInt(evGol), misafir, parseInt(misafirGol));
            puanDurumuYazdir();
        }
    });
}

main();