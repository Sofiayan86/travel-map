// --- 設定與資料 ---

// 這個佔位符將在 GitHub Actions 部署過程中被替換成真實的 API 金鑰
const API_KEY = '__GOOGLE_API_KEY__';

// 範例旅遊地點資料
const travelSpots = [
    { position: { lat: 48.8584, lng: 2.2945 }, title: '艾菲爾鐵塔', year: 2022, country: 'France', embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.991625694205!2d2.292292615674384!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sEiffel%20Tower!5e0!3m2!1sen!2sfr!4v1678886' },
    { position: { lat: 35.6895, lng: 139.6917 }, title: '東京鐵塔', year: 2023, country: 'Japan', embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3241.383182851239!2d139.7432442152584!3d35.66693398019748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188b0d01b13b71%3A0x7d68a33fee753833!2sTokyo%20Tower!5e0!3m2!1sen!2sjp!4v1678886' },
    { position: { lat: 40.7484, lng: -73.9857 }, title: '帝國大廈', year: 2024, country: 'USA', embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.536437500122!2d-73.98785368459395!3d40.74844047932827!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9a9a9a9a9%3A0x5a8f4a1b65e2d6b3!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1678886' },
    { position: { lat: -33.8568, lng: 151.2153 }, title: '雪梨歌劇院', year: 2023, country: 'Australia', embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3312.915118413985!2d151.2131089152101!3d-33.85678438065749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b12ae665e892fdd%3A0x317376748a85f6e!2sSydney%20Opera%20House!5e0!3m2!1sen!2sau!4v1678886' }
];

// --- 全域變數 ---
let map, infoWindow;
const markers = [];
let visibleSpots = [];

/**
 * 動態載入 Google Maps API 的主函式
 * 這是所有地圖功能開始的起點
 */
function loadGoogleMapsAPI() {
    // 檢查佔位符是否已被替換，若無，則顯示錯誤訊息
    if (API_KEY === 'GOOGLE_API_KEY') {
        console.error("API 金鑰未被替換。請確保 GitHub Actions 工作流程已成功執行。");
        document.body.innerHTML = '<div style="color:red; text-align:center; padding-top: 50px; font-size: 20px;">錯誤：網站設定不正確。<br>API 金鑰遺失。</div>';
        return;
    }

    // 建立一個 <script> 標籤來載入 Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap&libraries=maps,marker,core&v=beta`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

/**
 * Map 初始化函式，這個函式會在 Google Maps API 載入完成後被自動呼叫
 */
window.initMap = async function() {
    // 從 google.maps API 中非同步載入所需的功能模組
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    
    // 建立地圖實例
    map = new Map(document.getElementById("map"), {
        center: { lat: 10, lng: 100 },
        zoom: 2,
        mapId: 'DEMO_MAP_ID', // 可替換成你自己的地圖樣式 ID
        disableDefaultUI: true, // 隱藏預設的地圖 UI
        zoomControl: true, // 僅顯示縮放控制項
        streetViewControl: false,
        mapTypeControl: false,
    });

    // 建立一個共用的資訊視窗
    infoWindow = new google.maps.InfoWindow();
    
    // 設定 UI 互動元素 (如下拉選單、按鈕等)
    setupUI(AdvancedMarkerElement);
    // 根據預設值更新地圖上的標記
    updateMarkers();
}

/**
 * 設定所有使用者介面 (UI) 的事件監聽與初始狀態
 * @param {google.maps.marker.AdvancedMarkerElement} AdvancedMarkerElement - 地圖標記的建構函式
 */
function setupUI(AdvancedMarkerElement) {
    const yearSelect = document.getElementById('year-select');
    
    // 從 `travelSpots` 中提取不重複的年份並排序，用來生成下拉選單選項
    const years = [...new Set(travelSpots.map(spot => spot.year))].sort((a, b) => b - a);
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
    // 當下拉選單的值改變時，更新地圖標記
    yearSelect.addEventListener('change', updateMarkers);
    
    // 遍歷所有地點資料，為每個地點建立一個地圖標記
    travelSpots.forEach(spot => {
        const marker = new AdvancedMarkerElement({ position: spot.position, title: spot.title });
        
        // 為每個標記加上點擊事件
        marker.addListener('click', () => {
            // 資訊視窗的內容，包含嵌入的 Google Maps 和 AI 功能按鈕
            const content = `
                <div style="width: 300px; height: 320px; display: flex; flex-direction: column;">
                    <div style="flex-grow: 1; border:0;">
                        <iframe width="100%" height="100%" style="border:0;" loading="lazy" allowfullscreen src="${spot.embedUrl}"></iframe>
                    </div>
                    <div style="padding: 10px; background: #f9f9f9;">
                        <button onclick="getAiInsights('${spot.title}')" class="w-full bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-2">
                            <span class="text-md">✨</span> 獲取 AI 景點洞察
                        </button>
                    </div>
                </div>`;
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
        });
        markers.push({ marker, spot });
    });
    
    // 綁定按鈕的點擊事件
    document.getElementById('generate-story-btn').addEventListener('click', generateAiStory);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('gemini-modal').addEventListener('click', (e) => {
        // 點擊彈出視窗的背景時，關閉視窗
        if (e.target.id === 'gemini-modal') closeModal();
    });
}

/**
 * 根據年份篩選器的選擇，更新地圖上顯示的標記
 */
function updateMarkers() {
    const selectedYear = document.getElementById('year-select').value;
    const bounds = new google.maps.LatLngBounds(); // 用來計算所有可見標記的邊界
    visibleSpots = [];

    // 遍歷所有標記，決定是否顯示
    markers.forEach(({ marker, spot }) => {
        const isVisible = selectedYear === 'all' || spot.year.toString() === selectedYear;
        marker.map = isVisible ? map : null; // 如果可見，則設定其 map 屬性，否則設為 null 來隱藏
        if (isVisible) {
            bounds.extend(spot.position); // 將可見標記的位置加入邊界計算
            visibleSpots.push(spot);
        }
    });

    // 如果有可見的標記，則自動縮放地圖以包含所有標記
    if (visibleSpots.length > 0) {
        map.fitBounds(bounds);
        // 避免在只有單一標記時縮放得太近
        if (map.getZoom() > 15) map.setZoom(15);
    } else {
        // 如果沒有可見標記，則重置地圖視角到世界地圖
        map.setCenter({ lat: 10, lng: 100 });
        map.setZoom(2);
    }
}

/**
 * 呼叫 Gemini API 來生成文字內容
 * @param {string} prompt - 要傳送給 AI 的指令
 */
async function callGemini(prompt) {
    showModal(true); // 顯示載入中動畫
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'AI 服務發生錯誤');
        }
        
        const result = await response.json();
        const text = result.candidates[0]?.content?.parts[0]?.text;
        if (text) {
            showModal(false, text); // 顯示 AI 生成的內容
        } else {
            throw new Error('AI 未能生成有效內容。');
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        showModal(false, `發生錯誤：\n${error.message}\n\n請檢查 API 金鑰是否正確、已啟用 Generative Language API，並且已設定正確的 HTTP 參照位址限制。`);
    }
}

/**
 * 生成 AI 旅行故事
 */
function generateAiStory() {
    if (visibleSpots.length === 0) {
        alert('請先篩選出至少一個地點，才能生成故事！');
        return;
    }
    const locationNames = visibleSpots.map(spot => spot.title).join(', ');
    const prompt = `我是一位熱愛探險的旅行家，請你根據我曾去過的這些地點：${locationNames}，用第一人稱、生動活潑的語氣，為我撰寫一篇 150-200 字的短篇旅行故事，將這些地點巧妙地串連起來。`;
    callGemini(prompt);
}

/**
 * 獲取 AI 對特定景點的介紹 (此函式被掛載到 window 上，才能被 HTML 中的 onclick 呼叫)
 * @param {string} locationTitle - 景點名稱
 */
window.getAiInsights = function(locationTitle) {
    const prompt = `請為我介紹「${locationTitle}」這個景點。請提供 3 個最有趣的冷知識或歷史故事，用條列式的方式呈現，讓我可以快速了解它的獨特之處。`;
    callGemini(prompt);
}

/**
 * 顯示或隱藏彈出視窗
 * @param {boolean} isLoading - 是否顯示載入中狀態
 * @param {string} [content=''] - 要顯示的文字內容
 */
function showModal(isLoading, content = '') {
    const modal = document.getElementById('gemini-modal');
    const outputDiv = document.getElementById('gemini-output');
    
    if (isLoading) {
        outputDiv.innerHTML = '<div class="flex justify-center items-center h-48"><div class="loader"></div></div>';
    } else {
        // 將純文字內容轉換為 HTML，保留換行符
        outputDiv.textContent = content;
    }
    
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.querySelector('.modal-content').classList.remove('scale-95');
}

/**
 * 關閉彈出視窗
 */
function closeModal() {
    const modal = document.getElementById('gemini-modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.querySelector('.modal-content').classList.add('scale-95');
}

/**
 * 監聽視窗大小改變事件，以重新調整地圖視角
 */
window.addEventListener('resize', () => {
    if (map && visibleSpots.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        visibleSpots.forEach(spot => bounds.extend(spot.position));
        map.fitBounds(bounds);
    }
});

/**
 * 當整個 HTML DOM 載入完成後，開始執行我們的程式
 */
document.addEventListener('DOMContentLoaded', loadGoogleMapsAPI);
