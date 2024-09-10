import { firebaseConfig } from "./firebase.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
    getDatabase, ref, push, set, remove, update, onChildAdded, onChildChanged, onChildRemoved, serverTimestamp, get 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db,"shindan");

// geminiを設定
import { model } from "./firebase.js";

$(document).ready(function() {
    $(".error-message").hide();

    

 // 「前回データを読み込む」ボタンの処理
 $('#button0').on('click', function() {
    console.log("「前回データを読み込む」ボタンがクリックされました。");
    const shainno = $("#shainno").val();
    if (shainno) {
        console.log("社員番号:", shainno);
        const queryRef = ref(db, 'shindan');
        get(queryRef).then((snapshot) => {
            console.log("データ取得成功");
            let dataFound = false;
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                console.log("取得したデータ:", data);
                if (data.shainno === shainno) {
                    $('#gender').val(data.gender);
                    $('#age').val(data.age);
                    $('#busho').val(data.busho);
                    $('#yakushoku').val(data.yakushoku);
                    $('#year').val(data.year);
                    dataFound = true;
                    return;
                }
            });
            if (!dataFound) {
                alert("指定された社員番号のデータが見つかりません。");
            }
        }).catch((error) => {
            console.error('過去データの読み込みに失敗しました:', error);
        });
    } else {
        alert("社員番号を入力してください。");
    }
});

    $('#button1').on('click', async function(e) {
        e.preventDefault();  // デフォルトのフォーム送信を防ぐ

        // エラーメッセージを初期化
        $(".error-message").hide();
        
    
        let isValid = true;

        // 必須項目のチェック
     // 社員番号のチェック（6桁かどうか）
     const shainno = $("#shainno").val();
    if (shainno.length !== 6) {
        $("#shainno-error").show();  // エラーメッセージを表示
        isValid = false;
    }

        const busho = $("#busho").val();
        if (!busho) {
            $("#busho-error").show();
            isValid = false;
        }
    
        const yakushoku = $("#yakushoku").val();
        if (!yakushoku) {
            $("#yakushoku-error").show();
            isValid = false;
        }
    
        const year = $("#year").val();
        if (!year) {
            $("#year-error").show();
            isValid = false;
        }
    
        const gender = $("#gender").val();
        if (!gender) {
            $("#gender-error").show();
            isValid = false;
        }
    
        const age = $("#age").val();
        if (!age) {
            $("#age-error").show();
            isValid = false;
        }
    
        const impression = $("#impression").val();
        if (!impression) {
            $("#impression-error").show();
            isValid = false;
        }
    
        const careerimpact = $("#careerimpact").val();
        if (!careerimpact) {
            $("#careerimpact-error").show();
            isValid = false;
        }
    
        const solve = $("#solve").val();
        if (!solve) {
            $("#solve-error").show();
            isValid = false;
        }
    
        // 入力漏れがある場合にアラートを表示
        if (!isValid) {
            alert("入力漏れがあります。すべての項目を入力してください。");
            return;  // フォームの送信を中止
        }

// フォームデータの収集
    let formData = {
        shainno: $('#shainno').val(),
        gender: $('#gender').val(),
        busho: $('#busho').val(),
        age: $('#age').val(),
        yakushoku: $('#yakushoku').val(),
        year: $('#year').val(),
        impression: $('#impression').val(),
        q1: $('#q1').val(),
        options: $('input[name="options"]:checked').map(function() {
            return this.value;
        }).get(),
        q2_2: $('#q2-2').val(),
        q2_3: $('#q2-3').val(),
        careerimpact: $('#careerimpact').val(),
        solve: $('#solve').val(),
        timestamp: serverTimestamp()  // サーバータイムスタンプを追加
    };

   // コメント生成のためのプロンプトを作成
    const prompt = `入力された全ての項目を考慮し、特に年齢: ${formData.age}、役職: ${formData.yakushoku}、性別: ${formData.gender}を踏まえて、本人が所属する組織の課題: ${formData.q2_2}と原因:${formData.q2_3}に対する解決方法を行動経済学的な観点で行動変容を促すアドバイスを5行以内で生成してください。年齢: ${formData.age}、役職: ${formData.yakushoku}、性別: ${formData.gender}はコメントに書かず、組織の課題の解決にフォーカスをあててください。性別: ${formData.gender}が女性である場合は寄り添う形でエンパワーメントという方向性でアドバイスをしてください。役職: ${formData.yakushoku}が一般社員の方には今目の前の業務としてできること、それ以外の役職の人には組織運営という観点でアドバイスをしてください。`;

    try {
    // コメント生成のリクエスト
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // 生成されたコメントをフォームデータに追加
    formData.generatedComment = text;

           // Firebaseにデータを保存
           try {
            const newEntryRef = push(dbRef);  // データベースの新しい参照を生成
            await set(newEntryRef, formData);  // フォームデータとコメントを保存
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
        }

        displayResults(text);  // 結果を画面に表示

        // 「AIのアドバイス」と「過去のアドバイス」セクションを表示
        $("#view").show();
        $("#preresults").show();

        // 社員番号で過去のコメントを取得して表示
        displayPastComments(shainno);

         // フォーム内容をクリア
         $('#shainno').val('');
         $('#busho').val('');
         $('#yakushoku').val('');
         $('#year').val('');
         $('#gender').val('');
         $('#age').val('');
         $('#impression').val('');
         $('#careerimpact').val('');
         $('#solve').val('');
         $('input[name="options"]').prop('checked', false);  // チェックボックスのリセット
         $('#q2-2').val('');
         $('#q2-3').val('');


        } catch (error) {
            console.error('コメント生成に失敗しました:', error);
        }
    });
    
    // Firebaseから過去のコメントを取得して表示
    function displayPastComments(shainno) {
        const queryRef = ref(db, 'shindan');
        onChildAdded(queryRef, (snapshot) => {
            const data = snapshot.val();
            if (data.shainno === shainno) {
                const date = new Date(data.timestamp);
                const year = date.getFullYear();
                const month = ('0' + (date.getMonth() + 1)).slice(-2);  // 月は0から始まるので+1
                const day = ('0' + date.getDate()).slice(-2);

                $('#past-comments-container').append(`
                    <div>
                        <p>チェックした日付: ${year}年${month}月${day}日</p>
                        <p><img src="imgs/robot-icon.jpeg" alt="AI コメント" class="ai-icon"> ${data.generatedComment}</p>
                        <hr>  <!-- 区切り線 -->
                    </div>
                `);
            }
        });
    }

    // 結果を表示する関数
    function displayResults(text) {
        // 正規表現で「** **」を取り除く
        const cleanText = text.replace(/\*\*.*?\*\*/g, (match) => match.replace(/\*\*/g, ''));

        $('#view').html(`
            <h3>今回のアドバイス</h3>
            <p>${cleanText}</p>
        `);
    }

    $('#button2').on('click', async function() {
        const shainno = $('#shainno').val(); // 社員番号を取得
        if (shainno) {
            try {
                // Firebaseから全データを取得
                const queryRef = ref(db, 'shindan'); // 'shindan'は文字列として指定
                const snapshot = await get(queryRef);
                let dataToSend = {};
    
                // 社員番号に基づいてデータをフィルタリング
                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    if (data.shainno === shainno) {
                        // shainnoに基づいたデータをdataToSendに格納
                        dataToSend[childSnapshot.key] = data;
                    }
                });
    
                // データが見つかった場合にlocalStorageに保存し、details.htmlを開く
                if (Object.keys(dataToSend).length > 0) {
                    // データをJSON文字列に変換してlocalStorageに保存
                    const dataString = JSON.stringify(dataToSend);
                    localStorage.setItem('employeeData', dataString);
    
                    // 新しいタブで "details.html" ページを開く
                    window.open('details.html', '_blank');
                } else {
                    alert("指定された社員番号のデータが見つかりません。");
                }
            } catch (error) {
                console.error('データの取得に失敗しました:', error);
            }
        } else {
            alert("社員番号を入力してください");
        }
    });

    $('#button3').on('click', async function() {
        const busho = $('#busho').val(); // 社員番号を取得
        if (busho) {
            try {
                // Firebaseから全データを取得
                const queryRef = ref(db, 'shindan'); // 'shindan'は文字列として指定
                const snapshot = await get(queryRef);
                let dataToSend = {};
    
                // 部署に基づいてデータをフィルタリング
                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    if (data.busho === busho) {
                        // bushoに基づいたデータをdataToSendに格納
                        dataToSend[childSnapshot.key] = data;
                    }
                });
    
                // データが見つかった場合にlocalStorageに保存し、details.htmlを開く
                if (Object.keys(dataToSend).length > 0) {
                    // データをJSON文字列に変換してlocalStorageに保存
                    const dataString = JSON.stringify(dataToSend);
                    localStorage.setItem('employeeData', dataString);
    
                    // 新しいタブで "details.html" ページを開く
                    window.open('team.html', '_blank');
                } else {
                    alert("指定された社員番号のデータが見つかりません。");
                }
            } catch (error) {
                console.error('データの取得に失敗しました:', error);
            }
        } else {
            alert("部署を入力してください");
        }
    });






    });


