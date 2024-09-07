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
    let labels = [];
    let dataImpression = [];
    let dataQ3_1 = [];
    let dataQ3_2 = [];

    let chartImpression, chartQ3_1, chartQ3_2;

   // 保存しているデータを逆順で表示するために、初めに取得する必要があります
   onChildAdded(dbRef, function(snapshot) {
    const response = snapshot.val();
    const timestamp = response.timestamp;
    const impression = response.impression;
    const q3_1 = response.careerimpact;
    const q3_2 = response.solve;
    const options = response.options || [];
    const q2_2 = response.q2_2 || '';

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
    }

    const date = formatTimestamp(timestamp);

    const scoreImpression = scores[impression] !== undefined ? scores[impression] : null;
    const scoreQ3_1 = scores[q3_1] !== undefined ? scores[q3_1] : null;
    const scoreQ3_2 = scores[q3_2] !== undefined ? scores[q3_2] : null;

    if (date && scoreImpression !== null && scoreQ3_1 !== null && scoreQ3_2 !== null) {
        labels.push(date);
        dataImpression.push(scoreImpression);
        dataQ3_1.push(scoreQ3_1);
        dataQ3_2.push(scoreQ3_2);

        createOrUpdateChartImpression(labels, dataImpression);
        createOrUpdateChartQ3_1(labels, dataQ3_1);
        createOrUpdateChartQ3_2(labels, dataQ3_2);
    }

    // Update the table with data
    updateTableWithFirebaseData(date, options, q2_2);
});

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

function updateTableWithFirebaseData(date, options, q2_2) {
    // 表の tbody に新しいデータを追加
    $('#data-table tbody').prepend(`
        <tr>
            <td>${date}</td>
            <td>${options.join(', ')}</td>
            <td>${q2_2}</td>
            <td>${q2_2}</td>
        </tr>
    `);
}
});