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

$(document).ready(function() {
    // グローバルスコープで変数を宣言
    let labels = [];
    let dataImpression = [];
    let dataQ3_1 = [];
    let dataQ3_2 = [];

    let chartImpression, chartQ3_1, chartQ3_2;

    const dataString = localStorage.getItem('employeeData');
    
    if (dataString) {
        const data = JSON.parse(dataString);

        console.log("取得したデータ:", data);

        // データを処理するための関数
        processData(data);

        // データが存在する場合、グラフを作成または更新する
        createOrUpdateCharts();
    } else {
        console.log("データが指定されていません。");
    }

    function processData(data) {
        labels = [];
        dataImpression = [];
        dataQ3_1 = [];
        dataQ3_2 = [];

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const record = data[key];
                const timestamp = record.timestamp;
                const impression = record.impression;
                const q3_1 = record.careerimpact;
                const q3_2 = record.solve;
                const q2_2 = record.q2_2;
                const q2_3 = record.q2_3;
                const options = record.options || []; // optionsがある場合のみ設定
    
                const date = formatTimestamp(timestamp);
    
                const scoreImpression = scores[impression] !== undefined ? scores[impression] : null;
                const scoreQ3_1 = scores[q3_1] !== undefined ? scores[q3_1] : null;
                const scoreQ3_2 = scores[q3_2] !== undefined ? scores[q3_2] : null;
    
                if (date && scoreImpression !== null && scoreQ3_1 !== null && scoreQ3_2 !== null) {
                    labels.push(date);
                    dataImpression.push(scoreImpression);
                    dataQ3_1.push(scoreQ3_1);
                    dataQ3_2.push(scoreQ3_2);
    
                    // 表にデータを追加
                    updateTableWithFirebaseData(date, options, q2_2, q2_3);
                }
            }
        }
    }

    // グラフを作成または更新する関数
    function createOrUpdateCharts() {
        createOrUpdateChartImpression(labels, dataImpression);
        createOrUpdateChartQ3_1(labels, dataQ3_1);
        createOrUpdateChartQ3_2(labels, dataQ3_2);
    }

    function createOrUpdateChartImpression(labels, dataImpression) {
        if (!chartImpression) {
            var ctx = $('#resultChartImpression')[0].getContext('2d');
            chartImpression = new Chart(ctx, {
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
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: '所属する組織に対する評価',
                            font: {
                                size: 16
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    size: 14
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
                                    size: 14
                                }
                            }
                        }
                    }
                }
            });
        } else {
            chartImpression.data.labels = labels;
            chartImpression.data.datasets[0].data = dataImpression;
            chartImpression.update();
        }
    }

    function createOrUpdateChartQ3_1(labels, dataQ3_1) {
        if (!chartQ3_1) {
            var ctx = $('#resultChartQ3_1')[0].getContext('2d');
            chartQ3_1 = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Q3-1スコア (careerimpact)',
                            data: dataQ3_1,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            fill: false
                        }
                    ]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: '組織課題の今後のキャリアへの影響度',
                            font: {
                                size: 16
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    size: 14
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
                                    size: 14
                                }
                            }
                        }
                    }
                }
            });
        } else {
            chartQ3_1.data.labels = labels;
            chartQ3_1.data.datasets[0].data = dataQ3_1;
            chartQ3_1.update();
        }
    }

    function createOrUpdateChartQ3_2(labels, dataQ3_2) {
        if (!chartQ3_2) {
            var ctx = $('#resultChartQ3_2')[0].getContext('2d');
            chartQ3_2 = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Q3-2スコア (solve)',
                            data: dataQ3_2,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            fill: false
                        }
                    ]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: '組織課題の解決意欲',
                            font: {
                                size: 16
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    size: 14
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
                                    size: 14
                                }
                            }
                        }
                    }
                }
            });
        } else {
            chartQ3_2.data.labels = labels;
            chartQ3_2.data.datasets[0].data = dataQ3_2;
            chartQ3_2.update();
        }
    }

    // コメント生成のためのプロンプトを作成
    generateCommentAndSave();
    async function generateCommentAndSave() {
          // 変数の定義（例として初期値を設定）
    const latestImpression = dataImpression[dataImpression.length - 1];
    const latestQ3_1 = dataQ3_1[dataQ3_1.length - 1];
    const latestQ3_2 = dataQ3_2[dataQ3_2.length - 1];

    // 過去のデータも取得
    const historicalImpression = dataImpression.slice(0, -1); // 最新データを除く
    const historicalQ3_1 = dataQ3_1.slice(0, -1);
    const historicalQ3_2 = dataQ3_2.slice(0, -1);

    // プロンプトの作成
    const prompt = `
過去の所属組織に対する評価、組織課題の今後のキャリアへの影響度、組織課題の解決意欲の結果に基づき、経年変化の傾向、最近のトレンドやパターン、具体的な変化を分析してください。
過去のデータ: 所属組織に対する評価: ${historicalImpression}, 組織課題の今後のキャリアへの影響度: ${historicalQ3_1}, 組織課題の解決意欲: ${historicalQ3_2}
最新のデータ: 所属組織に対する評価: ${latestImpression}, 組織課題の今後のキャリアへの影響度: ${latestQ3_1}, 組織課題の解決意欲: ${latestQ3_2}
この分析を基に、最近の傾向について200字以内でコメントを生成してください。
`;
try {
    const result = await model.generateContent(prompt);
    console.log("生成結果:", result);

    const response = await result.response;
    console.log("レスポンス:", response);
    
    const text = await response.text();
    console.log("生成されたコメント:", text);

    // コメントをページ上に表示
    $('#ai-comment').text(text);

    const formData = {
        generatedComment: text
    };

    const newPostRef = push(dbRef);
    await set(newPostRef, formData);
    console.log("データがFirebaseに保存されました");
} catch (error) {
    console.error("コメント生成または保存中にエラーが発生しました:", error);
}
}

    function updateTableWithFirebaseData(date, options, q2_2, q2_3) {
         // 表の tbody をクリア

        // 表の tbody に新しいデータを追加
        $('#data-table tbody').prepend(`
            <tr>
                <td class="date">${date}</td>
                <td>${Array.isArray(options) ? options.join('<br>') : options}</td>
                <td>${q2_2}</td>
                <td>${q2_3}</td>
            </tr>
        `);
    }

    // タイムスタンプをISO形式の日付文字列に変換する関数
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
    }

    // 処理が終わったらlocalStorageのデータをクリア
    localStorage.removeItem('employeeData');
});