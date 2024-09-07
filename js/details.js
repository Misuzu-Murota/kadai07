import { firebaseConfig } from "./firebase.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
    getDatabase, ref, onValue, push, set, remove, update, onChildAdded, onChildChanged, onChildRemoved, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db,"shindan");

// geminiを設定
import { model } from "./firebase.js";

// スコアのマッピング
const scores = {
    "うまく回っている": 4,
    "まあまあうまく回っている": 3,
    "あまりうまく回っていない": 2,
    "全くうまくいっていない": 1
};

$(document).ready(function() {
    let labels = [];
    let dataImpression = [];

    let chart;  // グローバル変数としてChartオブジェクトを保持

    // Firebaseからデータを取得し、グラフを更新する関数
    onChildAdded(dbRef, function(snapshot) {
        const response = snapshot.val();
        console.log("Response:", response);

        const timestamp = response.timestamp;  // タイムスタンプ
        const impression = response.impression;  // impressionのデータ（スコアにマッピング可能な値）

        // タイムスタンプを日付に変換する関数
        function formatTimestamp(timestamp) {
            const date = new Date(timestamp);
            return date.toISOString().split('T')[0];  // YYYY-MM-DD形式
        }

        const date = formatTimestamp(timestamp);  // 日付に変換

        // impressionからq1_1のデータを取得
        // impressionが文字列でスコアにマッピング可能であることを前提にしています
        const q1_1 = impression;

        console.log("Date:", date);
        console.log("Impression:", q1_1);

        // Q1-1のデータをスコアにマッピング
        const score = scores[q1_1] !== undefined ? scores[q1_1] : null;

        if (date && score !== null) {
            labels.push(date);
            dataImpression.push(score);

            // グラフを作成または更新
            createOrUpdateChart(labels, dataImpression);
        }
    });

    // グラフを生成または更新する関数
    function createOrUpdateChart(labels, dataImpression) {
        if (!chart) {
            var ctx = $('#resultChart');
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Impressionスコア',
                            data: dataImpression,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            fill: false
                        }
                    ]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                suggestedMin: 1,
                                suggestedMax: 4
                            }
                        }
                    }
                }
            });
        } else {
            chart.data.labels = labels;
            chart.data.datasets.forEach((dataset) => {
                dataset.data = dataImpression;
            });
            chart.update();  // グラフを再描画
        }
    }
});