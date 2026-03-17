<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Księgowy Stripe</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>

    <style>
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] summary ~ * { animation: sweep .3s ease-in-out; }
        @keyframes sweep {
            0%    {opacity: 0; transform: translateY(-5px)}
            100%  {opacity: 1; transform: translateY(0)}
        }
        .chevron { transition: transform 0.3s ease; }
        details[open] summary .chevron { transform: rotate(180deg); }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 font-sans pb-20 selection:bg-indigo-200">

    <script>
        const manifest = {
            name: "Stripe Raporty PWA", short_name: "StripeRaport", display: "standalone",
            background_color: "#f8fafc", theme_color: "#4f46e5",
            icons: [{ src: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg", sizes: "192x192", type: "image/svg+xml" }]
        };
        const blob = new Blob([JSON.stringify(manifest)], {type: 'application/json'});
        const link = document.createElement('link'); link.rel = 'manifest'; link.href = URL.createObjectURL(blob);
        document.head.appendChild(link);
    </script>

    <header class="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div class="flex items-center gap-2 font-bold text-lg">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Księgowy Stripe
        </div>
        <button id="btnToggleConfig" class="p-2 bg-indigo-500 rounded-full hover:bg-indigo-400 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
    </header>

    <main class="max-w-3xl mx-auto p-4 space-y-6">
        
        <div id="configPanel" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 class="text-lg font-semibold mb-2">Klucz API Stripe</h2>
            <p class="text-sm text-slate-500 mb-4">Wpisz "test" aby zobaczyć podgląd demo nowego układu.</p>
            <input type="password" id="inputApiKey" placeholder="sk_live_..." class="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-3">
            <button id="btnSaveConfig" class="w-full bg-slate-900 text-white font-medium p-3 rounded-xl hover:bg-slate-800 transition">Zapisz w telefonie</button>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex bg-slate-100 p-1 rounded-xl mb-5">
                <button id="tabMonth" class="flex-1 py-2 rounded-lg text-sm font-medium transition bg-white shadow-sm text-indigo-600">Miesiąc</button>
                <button id="tabCustom" class="flex-1 py-2 rounded-lg text-sm font-medium transition text-slate-500">Zakres dat</button>
            </div>

            <div id="modeMonth">
                <label class="block text-sm font-medium text-slate-700 mb-1">Wybierz miesiąc</label>
                <select id="selectMonth" class="w-full p-3 border border-slate-300 rounded-xl bg-white outline-none"></select>
            </div>

            <div id="modeCustom" class="hidden flex gap-3">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Od</label>
                    <input type="date" id="inputStartDate" class="w-full p-3 border border-slate-300 rounded-xl outline-none">
                </div>
                <div class="flex-1">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Do</label>
                    <input type="date" id="inputEndDate" class="w-full p-3 border border-slate-300 rounded-xl outline-none">
                </div>
            </div>

            <button id="btnGenerate" class="w-full mt-5 bg-indigo-600 text-white font-medium p-3 rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2 transition disabled:opacity-70">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Pobierz transakcje
            </button>
        </div>

        <div id="errorMessage" class="hidden bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm"></div>
        <div id="loadingMessage" class="hidden text-center text-indigo-600 font-medium py-4">Łączenie ze Stripe...</div>

        <div id="resultsContainer" class="hidden space-y-4">
            <div class="flex justify-between items-center mb-2 px-1">
                <h2 class="text-xl font-bold">Raport Zgodności</h2>
                <button id="btnExportPdf" class="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 flex items-center gap-2 transition shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Pobierz PDF
                </button>
            </div>
            <div id="payoutsList" class="space-y-4"></div>
        </div>
    </main>

    <script>
        let currentData = [];
        let dateMode = 'month';

        const configPanel = document.getElementById('configPanel');
        const btnToggleConfig = document.getElementById('btnToggleConfig');
        const inputApiKey = document.getElementById('inputApiKey');
        const btnSaveConfig = document.getElementById('btnSaveConfig');
        const tabMonth = document.getElementById('tabMonth');
        const tabCustom = document.getElementById('tabCustom');
        const modeMonth = document.getElementById('modeMonth');
        const modeCustom = document.getElementById('modeCustom');
        const selectMonth = document.getElementById('selectMonth');
        const inputStartDate = document.getElementById('inputStartDate');
        const inputEndDate = document.getElementById('inputEndDate');
        const btnGenerate = document.getElementById('btnGenerate');
        const errorMessage = document.getElementById('errorMessage');
        const loadingMessage = document.getElementById('loadingMessage');
        const resultsContainer = document.getElementById('resultsContainer');
        const payoutsList = document.getElementById('payoutsList');
        const btnExportPdf = document.getElementById('btnExportPdf');

        document.addEventListener('DOMContentLoaded', () => {
            for (let i = 0; i < 12; i++) {
                const d = new Date(); d.setMonth(d.getMonth() - i);
                const val = d.toISOString().slice(0, 7);
                selectMonth.add(new Option(val, val));
            }
            selectMonth.value = selectMonth.options[1].value;
            const savedKey = localStorage.getItem('stripe_api_key');
            if (savedKey) { inputApiKey.value = savedKey; configPanel.classList.add('hidden'); }
        });

        btnToggleConfig.addEventListener('click', () => configPanel.classList.toggle('hidden'));
        btnSaveConfig.addEventListener('click', () => {
            const key = inputApiKey.value.trim();
            if (key) { localStorage.setItem('stripe_api_key', key); configPanel.classList.add('hidden'); }
        });

        tabMonth.addEventListener('click', () => {
            dateMode = 'month';
            tabMonth.className = "flex-1 py-2 rounded-lg text-sm font-medium transition bg-white shadow-sm text-indigo-600";
            tabCustom.className = "flex-1 py-2 rounded-lg text-sm font-medium transition text-slate-500";
            modeMonth.classList.remove('hidden'); modeCustom.classList.add('hidden'); modeCustom.classList.remove('flex');
        });

        tabCustom.addEventListener('click', () => {
            dateMode = 'custom';
            tabCustom.className = "flex-1 py-2 rounded-lg text-sm font-medium transition bg-white shadow-sm text-indigo-600";
            tabMonth.className = "flex-1 py-2 rounded-lg text-sm font-medium transition text-slate-500";
            modeCustom.classList.remove('hidden'); modeCustom.classList.add('flex'); modeMonth.classList.add('hidden');
        });

        const formatCurrency = (amount, currency = 'PLN') => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: currency.toUpperCase() }).format(amount);
        const formatDateTime = (timestamp) => new Date(timestamp * 1000).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
        const formatDate = (timestamp) => new Date(timestamp * 1000).toLocaleDateString('pl-PL');

        btnGenerate.addEventListener('click', async () => {
            errorMessage.classList.add('hidden'); resultsContainer.classList.add('hidden');
            const apiKey = inputApiKey.value.trim();
            if(!apiKey) { errorMessage.textContent = 'Brak klucza API'; return errorMessage.classList.remove('hidden'); }

            let start, end;
            if (dateMode === 'month') {
                const val = selectMonth.value;
                if (!val) return;
                const [year, month] = val.split('-');
                start = new Date(year, parseInt(month) - 1, 1).toISOString().split('T')[0];
                end = new Date(year, parseInt(month), 0).toISOString().split('T')[0];
            } else {
                start = inputStartDate.value; end = inputEndDate.value;
                if (!start || !end) return;
            }

            btnGenerate.disabled = true; loadingMessage.classList.remove('hidden');

            if (apiKey.toLowerCase() === 'test') {
                setTimeout(() => {
                    currentData = generateMockData(start);
                    renderResults(currentData);
                    btnGenerate.disabled = false; loadingMessage.classList.add('hidden');
                }, 1000);
                return;
            }

            try {
                const response = await fetch('/.netlify/functions/stripe-api', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey, startDate: start, endDate: end })
                });
                if (!response.ok) {
                    if (response.status === 404) throw new Error('Brak backendu na Netlify. Odpal z kluczem "test".');
                    const errData = await response.json(); throw new Error(errData.error || 'Błąd ze Stripe');
                }
                currentData = await response.json();
                renderResults(currentData);
            } catch (err) {
                errorMessage.textContent = err.message; errorMessage.classList.remove('hidden');
            } finally {
                btnGenerate.disabled = false; loadingMessage.classList.add('hidden');
            }
        });

        function renderResults(data) {
            payoutsList.innerHTML = '';
            
            if (data.length === 0) {
                payoutsList.innerHTML = '<p class="text-slate-500 text-center py-10">Brak wypłat w tym okresie.</p>';
            } else {
                data.forEach(payout => {
                    // SUMA KONTROLNA (Suma BB vs AA)
                    const sumBB = payout.transactions.reduce((sum, t) => sum + t.net, 0);
                    // Omijamy problemy zaokrągleń w JS
                    const sumBBFixed = Math.round(sumBB * 100) / 100;
                    const amountAAFixed = Math.round(payout.amount * 100) / 100;
                    const isMatch = sumBBFixed === amountAAFixed;

                    const details = document.createElement('details');
                    details.className = "bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group";
                    details.open = true; // Domyślnie otwarte, żeby było widać strukturę
                    
                    let txHtml = '';
                    payout.transactions.forEach((t, i) => {
                        txHtml += `
                            <div class="grid grid-cols-12 gap-1 px-4 py-3 text-sm hover:bg-slate-50 border-t border-slate-100 items-center">
                                <div class="col-span-1 text-slate-300 font-mono text-xs">BB${i+1}</div>
                                <div class="col-span-2 text-slate-600 text-xs">${formatDateTime(t.created)}</div>
                                <div class="col-span-3 truncate text-xs" title="${t.description}">${t.description}</div>
                                <div class="col-span-2 text-right text-slate-500">${formatCurrency(t.amount, payout.currency)}</div>
                                <div class="col-span-2 text-right text-red-400 text-xs">${formatCurrency(Math.abs(t.fee), payout.currency)}</div>
                                <div class="col-span-2 text-right font-semibold text-indigo-600">${formatCurrency(t.net, payout.currency)}</div>
                            </div>
                        `;
                    });

                    details.innerHTML = `
                        <summary class="p-4 bg-indigo-50 cursor-pointer flex justify-between items-center outline-none border-b border-indigo-100">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Wypłata na konto</span>
                                    ${isMatch 
                                        ? '<span class="text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50">ZGODNOŚĆ 100%</span>' 
                                        : '<span class="text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 bg-red-50">BŁĄD SUMY</span>'
                                    }
                                </div>
                                <p class="text-2xl font-black text-slate-800">${formatCurrency(payout.amount, payout.currency)} <span class="text-sm font-normal text-slate-400 ml-1">(Suma AA)</span></p>
                                <p class="text-sm text-slate-600 mt-1">Data wpłynięcia przelewu: <span class="font-medium text-slate-800">${formatDate(payout.arrivalDate)}</span></p>
                            </div>
                            <div class="bg-white p-2 rounded-full border border-indigo-100 shadow-sm">
                                <svg class="w-5 h-5 text-indigo-400 chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </summary>
                        
                        <div class="p-0 bg-white">
                            <div class="bg-slate-100 text-slate-500 text-xs grid grid-cols-12 gap-1 px-4 py-2 font-semibold uppercase tracking-wider">
                                <div class="col-span-1">Ref</div>
                                <div class="col-span-2">Data Transakcji</div>
                                <div class="col-span-3">Opis</div>
                                <div class="col-span-2 text-right">Kwota (Brutto)</div>
                                <div class="col-span-2 text-right">Prowizja</div>
                                <div class="col-span-2 text-right text-indigo-600">Dla Ciebie (BB)</div>
                            </div>
                            <div class="max-h-96 overflow-y-auto pl-2 border-l-4 border-indigo-100 ml-2 my-2">
                                ${txHtml}
                            </div>
                            <div class="bg-slate-50 p-3 text-right text-sm border-t border-slate-200">
                                <span class="text-slate-500 mr-4">Suma wszystkich wpłat (BB1 + BB2...): </span>
                                <span class="font-bold ${isMatch ? 'text-emerald-600' : 'text-red-600'}">${formatCurrency(sumBBFixed, payout.currency)}</span>
                            </div>
                        </div>
                    `;
                    payoutsList.appendChild(details);
                });
            }
            resultsContainer.classList.remove('hidden');
        }

        btnExportPdf.addEventListener('click', () => {
            if (!currentData || currentData.length === 0) return;

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'pt', 'a4');
            let yPos = 40;

            doc.setFontSize(20);
            doc.text("Szczegolowy Raport Wyplat Stripe", 40, yPos);
            yPos += 20;

            doc.setFontSize(10);
            const rangeText = dateMode === 'month' ? `Miesiac: ${selectMonth.value}` : `Okres: ${inputStartDate.value} do ${inputEndDate.value}`;
            doc.text(rangeText, 40, yPos);
            yPos += 30;

            currentData.forEach((payout, index) => {
                const sumBB = payout.transactions.reduce((sum, t) => sum + t.net, 0);
                const sumBBFixed = Math.round(sumBB * 100) / 100;
                const isMatch = sumBBFixed === Math.round(payout.amount * 100) / 100;

                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(79, 70, 229); 
                doc.text(`Przelew na konto (AA): ${formatCurrency(payout.amount, payout.currency)}`, 40, yPos);
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0);
                yPos += 15;
                doc.text(`Data wplywu: ${formatDate(payout.arrivalDate)} | Zgodnosc: ${isMatch ? 'OK' : 'BLAD'}`, 40, yPos);
                yPos += 10;

                const tableData = payout.transactions.map((t, i) => [
                    `BB${i+1}`,
                    formatDate(t.created),
                    t.description.substring(0, 30),
                    formatCurrency(t.amount, payout.currency),
                    formatCurrency(Math.abs(t.fee), payout.currency),
                    formatCurrency(t.net, payout.currency)
                ]);

                // Dodanie wiersza podsumowującego BB
                tableData.push([
                    '', '', '', '', 'SUMA (BB):', formatCurrency(sumBBFixed, payout.currency)
                ]);

                doc.autoTable({
                    startY: yPos + 5,
                    head: [['Ref', 'Data Transakcji', 'Opis', 'Kwota Trans.', 'Prowizja', 'Kwota Wyp. (BB)']],
                    body: tableData,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105] }, // Szary header dla transakcji
                    margin: { left: 50, right: 40 }, // Wcięcie od lewej dla tabeli transakcji!
                    didParseCell: function (data) {
                        // Pogrubienie ostatniego wiersza z sumą
                        if (data.row.index === tableData.length - 1) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.textColor = [79, 70, 229];
                        }
                    }
                });

                yPos = doc.lastAutoTable.finalY + 40;

                if (yPos > 700 && index < currentData.length - 1) {
                    doc.addPage();
                    yPos = 40;
                }
            });

            doc.save(`Stripe_Szczegoly_${dateMode === 'month' ? selectMonth.value : inputStartDate.value}.pdf`);
        });

        function generateMockData(baseDateStr) {
            const baseTime = new Date(baseDateStr || new Date()).getTime() / 1000;
            return [
                {
                    payoutId: "po_1", amount: 4536.50, currency: "pln", arrivalDate: baseTime + 86400 * 5,
                    transactions: [
                        { id: "txn_1", type: "charge", amount: 2000, fee: 35.50, net: 1964.50, created: baseTime, description: "Zakup usługi Premium - Jan Kowalski" },
                        { id: "txn_2", type: "charge", amount: 1500, fee: 28.00, net: 1472.00, created: baseTime + 3600, description: "Konsultacje - Anna Nowak" },
                        { id: "txn_3", type: "charge", amount: 1100, fee: 0, net: 1100.00, created: baseTime + 7200, description: "Przelew dotpay" }
                    ]
                },
                {
                    payoutId: "po_2", amount: 1250.00, currency: "pln", arrivalDate: baseTime + 86400 * 12,
                    transactions: [
                        { id: "txn_4", type: "charge", amount: 800, fee: 18.50, net: 781.50, created: baseTime + 86400*7, description: "Audyt SEO - Firma XYZ" },
                        { id: "txn_5", type: "charge", amount: 489.20, fee: 20.70, net: 468.50, created: baseTime + 86400*8, description: "Dostęp do kursu" }
                    ]
                }
            ];
        }
    </script>
</body>
</html>


