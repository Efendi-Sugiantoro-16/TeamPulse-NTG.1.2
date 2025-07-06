// history-new.js - versi sederhana dan robust

(function() {
// history-new.js - versi sederhana dan robust

document.addEventListener('DOMContentLoaded', async function() {
    // Auto-detect database availability and set storage mode
    if (window.hybridStorage && typeof window.hybridStorage.checkDatabaseAvailability === 'function') {
        try {
            const dbAvailable = await window.hybridStorage.checkDatabaseAvailability();
            if (dbAvailable) {
                await window.hybridStorage.setStorageMode('database');
                if (document.getElementById('storageModeSelect')) {
                    document.getElementById('storageModeSelect').value = 'database';
                }
            } else {
                await window.hybridStorage.setStorageMode('local');
                if (document.getElementById('storageModeSelect')) {
                    document.getElementById('storageModeSelect').value = 'local';
                }
                console.log('[HISTORY] Database not available, fallback to local storage.');
            }
        } catch (e) {
            await window.hybridStorage.setStorageMode('local');
            if (document.getElementById('storageModeSelect')) {
                document.getElementById('storageModeSelect').value = 'local';
            }
            console.log('[HISTORY] Error checking database, fallback to local:', e);
        }
    }
    await loadHistoryData();
    // Refresh button
    const refreshBtn = document.getElementById('refreshTable');
    if (refreshBtn) refreshBtn.addEventListener('click', loadHistoryData);
    // Storage Mode Selector
    const storageModeSelect = document.getElementById('storageModeSelect');
    if (storageModeSelect && window.hybridStorage) {
        // Set initial value sesuai mode aktif
        window.hybridStorage.getStorageMode().then(mode => {
            storageModeSelect.value = mode;
        });
        storageModeSelect.addEventListener('change', async function(e) {
            const newMode = e.target.value;
            storageModeSelect.disabled = true;
            try {
                await window.hybridStorage.setStorageMode(newMode);
                // Optional: tampilkan notifikasi sukses
                if (window.dashboard && window.dashboard.showSuccess) {
                    window.dashboard.showSuccess(`✅ Mode penyimpanan diubah ke ${newMode}`);
                } else {
                    alert('Mode penyimpanan diubah ke: ' + newMode);
                }
                // Reload data
                if (typeof loadHistoryData === 'function') {
                    await loadHistoryData();
                } else {
                    location.reload();
                }
            } catch (error) {
                // Optional: tampilkan notifikasi error
                if (window.dashboard && window.dashboard.showError) {
                    window.dashboard.showError('Gagal mengubah mode penyimpanan: ' + error.message);
                } else {
                    alert('Gagal mengubah mode penyimpanan: ' + error.message);
                }
                // Kembalikan ke mode sebelumnya
                const currentMode = await window.hybridStorage.getStorageMode();
                storageModeSelect.value = currentMode;
            } finally {
                storageModeSelect.disabled = false;
            }
        });
    }
    // Event listener untuk tombol Delete Selected dan Delete All
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) deleteSelectedBtn.onclick = deleteSelectedEntriesWithConfirm;
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) deleteAllBtn.onclick = deleteAllEntriesWithConfirm;
    // Pastikan tombol Bulk Actions juga memanggil handler dengan konfirmasi
    const bulkBtn = document.getElementById('bulkActions');
    if (bulkBtn) bulkBtn.onclick = deleteSelectedEntriesWithConfirm;
});

let currentPage = 1;
let pageSize = 25;
let allData = [];

function updateTotalEntries(total) {
    const el = document.getElementById('totalEntries');
    if (el) el.textContent = total;
}

async function loadHistoryData() {
    const storage = window.hybridStorage || window.dataStorage;
    let data = [];
    let storageType = 'Unknown';
    let hasAdd = false, hasGet = false, hasDelete = false;

    try {
        if (storage && typeof storage.getEmotionData === 'function') {
            data = await storage.getEmotionData({ sortBy: 'timestamp', sortOrder: 'desc' });
        } else if (window.localStorage) {
            // Fallback: langsung dari localStorage
            const raw = localStorage.getItem('aiEmotionData');
            data = raw ? JSON.parse(raw) : [];
        }
    } catch (err) {
        console.error('[HISTORY] Error loading data:', err);
        data = [];
    }

    // Info storage
    if (storage) {
        if (storage.constructor && storage.constructor.name) {
            storageType = storage.constructor.name;
        } else if (storage.storageType) {
            storageType = storage.storageType;
        }
        hasAdd = typeof storage.addEmotionData === 'function' || typeof storage.saveEmotionData === 'function';
        hasGet = typeof storage.getEmotionData === 'function';
        hasDelete = typeof storage.deleteEmotionData === 'function';
    }

    updateStorageInfo(data, storageType, hasAdd, hasGet, hasDelete);
    updateTotalEntries(data.length);
    updateTableData(data);
}

function updateStorageInfo(data, storageType, hasAdd, hasGet, hasDelete) {
    const el = document.getElementById('storageInfo');
    if (!el) return;
    const total = data && Array.isArray(data) ? data.length : 0;
    el.innerHTML = `
        <b>Storage Info:</b> &nbsp; 
        <span>Total Entries: <b>${total}</b></span> &nbsp; | &nbsp;
        <span>Storage Type: <b>${storageType}</b></span> &nbsp; | &nbsp;
        <span>Add Data: ${hasAdd ? '✅' : '❌'}</span> &nbsp; | &nbsp;
        <span>Get Data: ${hasGet ? '✅' : '❌'}</span> &nbsp; | &nbsp;
        <span>Delete Data: ${hasDelete ? '✅' : '❌'}</span>
    `;
}

function renderPagination(total, pageSize, currentPage) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    const totalPages = Math.ceil(total / pageSize);
    let html = '';
    html += `<div class="pagination-info">Showing <span id="startIndex">${(total === 0 ? 0 : ((currentPage-1)*pageSize+1))}</span> to <span id="endIndex">${Math.min(currentPage*pageSize, total)}</span> of <span id="totalItems">${total}</span> entries</div>`;
    html += '<div class="pagination-controls">';
    html += `<button ${currentPage===1?'disabled':''} onclick="goToPage(1)">&laquo;</button>`;
    html += `<button ${currentPage===1?'disabled':''} onclick="goToPage(${currentPage-1})">&lsaquo;</button>`;
    for(let i=Math.max(1,currentPage-2);i<=Math.min(totalPages,currentPage+2);i++){
        html += `<button ${i===currentPage?'class=active':''} onclick="goToPage(${i})">${i}</button>`;
    }
    html += `<button ${currentPage===totalPages||totalPages===0?'disabled':''} onclick="goToPage(${currentPage+1})">&rsaquo;</button>`;
    html += `<button ${currentPage===totalPages||totalPages===0?'disabled':''} onclick="goToPage(${totalPages})">&raquo;</button>`;
    html += '</div>';
    html += `<div class="pagination-size">Show: <select id="pageSizeSelect" onchange="changePageSize(this.value)">
        <option value="10">10</option>
        <option value="25" selected>25</option>
        <option value="50">50</option>
        <option value="100">100</option>
    </select> entries per page</div>`;
    container.innerHTML = html;
    document.getElementById('pageSizeSelect').value = pageSize;
}

window.goToPage = function(page) {
    const totalPages = Math.ceil(allData.length / pageSize);
    if(page < 1) page = 1;
    if(page > totalPages) page = totalPages;
    currentPage = page;
    updateTableData(allData);
    renderPagination(allData.length, pageSize, currentPage);
}

window.changePageSize = function(size) {
    pageSize = parseInt(size);
    currentPage = 1;
    updateTableData(allData);
    renderPagination(allData.length, pageSize, currentPage);
}

function getEmotionBadgeClass(emotion) {
    if (!emotion) return 'emotion-badge neutral';
    const e = emotion.toLowerCase();
    if (['happy', 'joy'].includes(e)) return 'emotion-badge happy';
    if (['sad'].includes(e)) return 'emotion-badge sad';
    if (['angry', 'anger'].includes(e)) return 'emotion-badge angry';
    if (['neutral'].includes(e)) return 'emotion-badge neutral';
    if (['surprised', 'surprise'].includes(e)) return 'emotion-badge surprised';
    if (['fearful', 'fear'].includes(e)) return 'emotion-badge fearful';
    return 'emotion-badge';
}

function getStatusBadgeClass(status) {
    if (!status) return 'status-badge info';
    const s = status.toLowerCase();
    if (s.includes('success') || s.includes('completed')) return 'status-badge success';
    if (s.includes('warning') || s.includes('review')) return 'status-badge warning';
    if (s.includes('fail') || s.includes('danger')) return 'status-badge danger';
    return 'status-badge info';
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getEmotionEmoji(emotion) {
    if (!emotion) return '❓';
    const e = emotion.toLowerCase();
    if (['happy', 'joy'].includes(e)) return '😊';
    if (['sad'].includes(e)) return '😢';
    if (['angry', 'anger'].includes(e)) return '😠';
    if (['neutral'].includes(e)) return '😐';
    if (['surprised', 'surprise'].includes(e)) return '😲';
    if (['fearful', 'fear'].includes(e)) return '😨';
    return '❓';
}

async function deleteEntryByIndex(index) {
    const entry = allData[index];
    if (!entry) return;
    if (!confirm('Are you sure you want to delete this entry?')) return;
    // Hapus dari storage
    const storage = window.hybridStorage || window.dataStorage;
    if (storage && typeof storage.deleteEmotionData === 'function' && entry.id) {
        await storage.deleteEmotionData(entry.id);
    } else {
        // Fallback: hapus dari localStorage
        let data = allData.slice();
        data.splice(index, 1);
        localStorage.setItem('aiEmotionData', JSON.stringify(data));
    }
    await loadHistoryData();
}

// Bulk delete
async function deleteSelectedEntries() {
    const checkboxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkboxes.length === 0) return alert('No entries selected.');
    const storage = window.hybridStorage || window.dataStorage;
    let idsToDelete = [];
    checkboxes.forEach(cb => {
        const idx = parseInt(cb.getAttribute('data-index'));
        if (allData[idx] && allData[idx].id) idsToDelete.push(allData[idx].id);
    });
    if (storage && typeof storage.deleteEmotionData === 'function') {
        for (const id of idsToDelete) {
            await storage.deleteEmotionData(id);
        }
    } else {
        // Fallback: hapus dari localStorage
        let data = allData.filter((entry, idx) => !checkboxes.some(cb => parseInt(cb.getAttribute('data-index')) === idx));
        localStorage.setItem('aiEmotionData', JSON.stringify(data));
    }
    await loadHistoryData();
}

function updateTableData(data) {
    allData = data;
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!data || !Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No history data available.</td></tr>';
        renderPagination(0, pageSize, 1);
        return;
    }
    // Sort terbaru di atas
    data.sort((a, b) => new Date(b.timestamp || b.createdAt || b.date || 0) - new Date(a.timestamp || a.createdAt || a.date || 0));
    const startIdx = (currentPage-1)*pageSize;
    const endIdx = Math.min(startIdx+pageSize, data.length);
    for(let i=startIdx;i<endIdx;i++){
        const entry = data[i];
        const dateRaw = entry.timestamp || entry.createdAt || entry.date || Date.now();
        let dateObj;
        try { dateObj = new Date(dateRaw); } catch { dateObj = new Date(); }
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString();
        const emotion = entry.emotion || entry.dominantEmotion || entry.feeling || entry.mood || '-';
        const confidence = (entry.confidence !== undefined && entry.confidence !== null) ? ((entry.confidence * 100).toFixed(1) + '%') : (entry.score !== undefined ? ((entry.score * 100).toFixed(1) + '%') : '-');
        const source = entry.source || entry.inputType || entry.type || '-';
        const notes = entry.notes || entry.comment || entry.text || '';
        const status = entry.status || entry.state || 'Recorded';
        const row = document.createElement('tr');
        row.className = 'fade-in-row';
        row.innerHTML = `
            <td style="vertical-align:middle;"><input type="checkbox" class="row-checkbox" data-index="${i}"></td>
            <td style="vertical-align:middle;"><div class="datetime-cell"><div class="date">${dateStr}</div><div class="time">${timeStr}</div></div></td>
            <td style="vertical-align:middle;"><span class="emoji-badge">${getEmotionEmoji(emotion)}</span><span class="${getEmotionBadgeClass(emotion)}">${capitalizeFirst(emotion)}</span></td>
            <td style="vertical-align:middle;">${confidence}</td>
            <td style="vertical-align:middle;">${capitalizeFirst(source)}</td>
            <td style="vertical-align:middle;">${notes}</td>
            <td style="vertical-align:middle;"><span class="${getStatusBadgeClass(status)}">${capitalizeFirst(status)}</span></td>
            <td class="action-buttons" style="vertical-align:middle;">
                <button class="btn btn-sm btn-outline" title="View details" data-index="${i}"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-outline delete-btn" title="Delete entry" data-index="${i}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    }
    // Event listener untuk tombol delete
    setTimeout(() => {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(btn.getAttribute('data-index'));
                deleteEntryByIndex(idx);
            };
        });
    }, 10);
    renderPagination(data.length, pageSize, currentPage);
}

// Tambahkan event listener untuk update otomatis setelah import
if ('BroadcastChannel' in window) {
    const importChannel = new BroadcastChannel('emotion-data');
    importChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'new-emotion') {
            loadHistoryData();
            // Optional: tampilkan notifikasi
            if (window.showNotification) window.showNotification('Data emosi baru berhasil diimpor!', 'success');
        }
    };
}

// Event listener untuk perubahan mode penyimpanan
window.addEventListener('storageModeChanged', function(e) {
    loadHistoryData();
});

async function deleteSelectedEntriesWithConfirm() {
    const checkboxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkboxes.length === 0) return alert('No entries selected.');
    if (!confirm('Are you sure you want to delete all selected entries?')) return;
    await deleteSelectedEntries();
    alert('Selected entries deleted.');
    await loadHistoryData();
}

async function deleteAllEntriesWithConfirm() {
    if (!confirm('Are you sure you want to delete ALL entries? This action cannot be undone!')) return;
    const storage = window.hybridStorage || window.dataStorage;
    if (storage && typeof storage.deleteEmotionData === 'function') {
        for (const entry of allData) {
            if (entry.id) await storage.deleteEmotionData(entry.id);
        }
    } else {
        // Fallback: hapus semua dari localStorage
        localStorage.setItem('aiEmotionData', '[]');
    }
    alert('All entries deleted.');
    await loadHistoryData();
}

// Prevent duplicate dashboard success messages in history page
if (window.dashboard && window.dashboard.showSuccess) {
    window.dashboard.showSuccess = (function(orig) {
        let lastMsg = '';
        return function(msg) {
            if (msg === lastMsg) return; // suppress duplicate
            lastMsg = msg;
            orig.call(this, msg);
        };
    })(window.dashboard.showSuccess);
}

})();
