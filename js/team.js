import { firebaseConfig } from "./firebase.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
    getDatabase, ref, onValue, push, set, remove, update, onChildAdded, onChildChanged, onChildRemoved, serverTimestamp,get
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db,"shindan");

// geminiを設定
import { model } from './firebase.js';


const scores = {
    "うまく回っている": 4,
    "まあまあうまく回っている": 3,
    "あまりうまく回っていない": 2,
    "全くうまくいっていない": 1,
    "大いに影響する": 4,
    "多少影響する": 3,
    "あまり影響しない": 2,
    "全く影響しない": 1,
    "どんな形であっても改善に向けた活動をしたい": 4,
    "できる範囲で改善に向けた活動をしたい": 3,
    "業務指示であれば、対応する": 2,
    "あまり気乗りしない": 1
};

// 色のマッピングを作成
const colorMap = {};

// ランダムな色を生成する関数
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 社員番号に基づく色を取得する関数
async function getColorForEmployee(employeeId) {
    if (!colorMap[employeeId]) {
        const colorRef = ref(db, `colors/${employeeId}`);
        const snapshot = await get(colorRef);
        if (snapshot.exists()) {
            // データベースからカラーを取得
            colorMap[employeeId] = snapshot.val();
        } else {
            // カラーが存在しない場合は新しいカラーを生成して保存
            colorMap[employeeId] = getRandomColor();
            await set(colorRef, colorMap[employeeId]);
        }
    }
    return colorMap[employeeId];
}

$(document).ready(async function() {
    // グローバルスコープで変数を宣言
    let labels = []; // 時系列のラベル（例: 日付）
    let employeeData = {}; // 社員番号ごとのデータを格納するオブジェクトとしてここで宣言
    let busho = ""; // busho の値を格納する変数

    const dataString = localStorage.getItem('employeeData');
  
    if (dataString) {
        const data = JSON.parse(dataString);
        console.log("取得したデータ:", data);

        // data の中から busho を探して取得
        for (const key in data) {
            if (data[key] && data[key].busho) {
                busho = data[key].busho;
                break; // 最初に見つけた busho を使う
            }
        }

        // データを処理する関数
        processData(data);
  
        // グラフを作成または更新
        await createOrUpdateChart(); // 非同期処理にする
    } else {
        console.log("データが指定されていません。");
    }

    // 「busho」の値が存在する場合、teamname要素に設定
    if (busho) {
        $('#teamname').text(busho);
    } else {
        $('#teamname').text('組織名が指定されていません');
    }

    function processData(data) {
        labels = [];
        employeeData = {}; // 社員番号ごとのデータを格納するためにリセット
  
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const record = data[key];
                const employeeId = record.shainno; // 社員番号
                const timestamp = record.timestamp;
                const impression = record.impression;
                const q3_1 = record.careerimpact;
                const q3_2 = record.solve;

                console.log(`Processing record:`, { employeeId, timestamp, impression, q3_1, q3_2 });

                const date = formatTimestamp(timestamp);
                const scoreImpression = scores[impression] !== undefined ? scores[impression] : null;
                const scoreQ3_1 = scores[q3_1] !== undefined ? scores[q3_1] : null;
                const scoreQ3_2 = scores[q3_2] !== undefined ? scores[q3_2] : null;
  
                if (date && scoreImpression !== null) {
                    // 時系列のラベルに日付を追加
                    if (!labels.includes(date)) {
                        labels.push(date);
                    }
                    // 社員番号ごとにデータを管理
                    if (!employeeData[employeeId]) {
                        employeeData[employeeId] = [];
                    }
  
                    // 社員番号ごとのデータ配列にスコアを追加
                    employeeData[employeeId].push({ date, scoreImpression, scoreQ3_1, scoreQ3_2 });
                }
            }
        }
        // ラベル（日付）をソートする
        labels.sort();
    }

    async function createOrUpdateChart() {
        const datasetsImpression = [];
        const datasetsQ3_1 = [];
        const datasetsQ3_2 = [];

        console.log('labels:', labels);
        console.log('datasetsImpression:', datasetsImpression);
        console.log('datasetsQ3_1:', datasetsQ3_1);
        console.log('datasetsQ3_2:', datasetsQ3_2);

        for (const employeeId in employeeData) {
            if (employeeData.hasOwnProperty(employeeId)) {
                const dataPoints = employeeData[employeeId];
    
                const scoresImpressionByDate = labels.map(label => {
                    const dataPoint = dataPoints.find(point => point.date === label);
                    return dataPoint ? dataPoint.scoreImpression : null;
                });
    
                const scoresQ3_1ByDate = labels.map(label => {
                    const dataPoint = dataPoints.find(point => point.date === label);
                    return dataPoint ? dataPoint.scoreQ3_1 : null;
                });
    
                const scoresQ3_2ByDate = labels.map(label => {
                    const dataPoint = dataPoints.find(point => point.date === label);
                    return dataPoint ? dataPoint.scoreQ3_2 : null;
                });
    
                const color = await getColorForEmployee(employeeId); // 非同期で色を取得
    
                datasetsImpression.push({
                    label: ` ${employeeId}`,
                    data: scoresImpressionByDate,
                    fill: false,
                    borderColor: color,
                    tension: 0.1
                });
    
                datasetsQ3_1.push({
                    label: ` ${employeeId}`,
                    data: scoresQ3_1ByDate,
                    fill: false,
                    borderColor: color,
                    tension: 0.1
                });
    
                datasetsQ3_2.push({
                    label: `${employeeId}`,
                    data: scoresQ3_2ByDate,
                    fill: false,
                    borderColor: color,
                    tension: 0.1
                });
            }
        }
    
        // グラフを描画
        drawChart('impressionChart', datasetsImpression, '所属する組織に対する評価');
        drawChart('q3_1Chart', datasetsQ3_1, 'キャリアに与える影響 (Q3_1)');
        drawChart('q3_2Chart', datasetsQ3_2, '問題解決への影響 (Q3_2)');
    }
      
    function drawChart(canvasId, datasets, title) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 5,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
  
    // タイムスタンプを日付に変換する関数
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // コメント生成のためのプロンプトを作成
    generateCommentAndSave();
    async function generateCommentAndSave() {
        const dataString = localStorage.getItem('employeeData');
        console.log("取得したデータ:", dataString);
    
        if (dataString) {
            let data = JSON.parse(dataString);
    
            if (typeof data === 'object' && !Array.isArray(data)) {
                data = Object.values(data);
            }
    
            if (Array.isArray(data)) {
                // 社員ごとにデータをグループ化
                const groupedData = data.reduce((acc, record) => {
                    const employeeId = record.shainno;
                    if (!acc[employeeId]) {
                        acc[employeeId] = [];
                    }
                    acc[employeeId].push(record);
                    return acc;
                }, {});
    
                for (const [employeeId, records] of Object.entries(groupedData)) {
                    // 最新のデータと過去のデータを分ける
                    const latestRecord = records[records.length - 1];
                    const historicalRecords = records.slice(0, -1);
    
                    const latestImpression = latestRecord.impression;
                    const latestQ3_1 = latestRecord.careerimpact;
                    const latestQ3_2 = latestRecord.solve;
    
                    const historicalImpression = historicalRecords.map(r => r.impression);
                    const historicalQ3_1 = historicalRecords.map(r => r.careerimpact);
                    const historicalQ3_2 = historicalRecords.map(r => r.solve);
    
                    const prompt = ` ${employeeId} の最近のフィードバックは、Impression が「${latestImpression}」、Q3-1（キャリアに対する影響）が「${latestQ3_1}」、Q3-2（問題解決への影響）が「${latestQ3_2}」です。過去のデータでは、Impression が「${historicalImpression.join(', ')}」、Q3-1 が「${historicalQ3_1.join(', ')}」、Q3-2 が「${historicalQ3_2.join(', ')}」です。この情報を基に、最近の傾向や変化、所属組織に対するエンゲージメントを簡潔に3行で分析してください。`;
                    console.log(prompt)
                    const comment = await requestAIComment(prompt);
                    displayComment(employeeId, comment);
                }
            }
        }
    
    }
    console.log(model)
    async function requestAIComment(prompt) {
        try {
            // モデルの正しいメソッドを使用してコメントを生成
            const response = await model.generateContent({
                prompt: prompt,
                max_tokens: 100 // 3行程度のコメント生成に必要なトークン数
            });
    
            // レスポンスの内容を確認
            console.log(response);
    
            // 正しいプロパティにアクセス
            const comment = response.choices[0].text.trim();
            return comment;
        } catch (error) {
            console.error('AI APIリクエストエラー:', error);
            return 'コメント生成に失敗しました';
        }
    }

    function displayComment(employeeId, commentText) {
        let commentElement = $(`#ai-comment-${employeeId}`);
        if (commentElement.length === 0) {
            $('#commentsContainer').append(`<div id="ai-comment-${employeeId}" class="comment"></div>`);
            commentElement = $(`#ai-comment-${employeeId}`);
        }
        commentElement.text(commentText);
    }

    generateCommentAndSave();
});