let currentPart = 'part1';
let questions = [];
let currentQuestionIndex = 0;
let timer;
let timeLeft;
let selectedPart2Topic = null;



// 添加语音合成功能
let speechSynthesis = window.speechSynthesis;
let speaking = false;
let voices = [];

// 添加录音相关变量
let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let recordingStartTime = null;
let isRecording = false;

// 初始化语音系统
async function initSpeech() {
    try {
        // 如果浏览器不支持语音合成，直接返回
        if (!window.speechSynthesis) {
            console.warn('浏览器不支持语音合成');
            return;
        }

        // 等待语音列表加载
        await new Promise((resolve) => {
            if (speechSynthesis.getVoices().length) {
                resolve();
            } else {
                speechSynthesis.onvoiceschanged = () => resolve();
            }
        });

        // 获取可用的语音
        voices = speechSynthesis.getVoices();
        console.log('可用的语音:', voices.map(v => `${v.name} (${v.lang})`));
    } catch (error) {
        console.error('初始化语音系统失败:', error);
    }
}

// 语音合成状态
let currentUtterance = null;

// 执行语音合成
function speakText(text) {
    return new Promise((resolve, reject) => {
        try {
            // 如果浏览器不支持语音合成，直接完成
            if (!window.speechSynthesis) {
                resolve();
                return;
            }

            // 取消当前正在播放的语音
            if (currentUtterance) {
                speechSynthesis.cancel();
            }

            // 创建新的语音实例
            const utterance = new SpeechSynthesisUtterance(text);
            currentUtterance = utterance;

            // 设置语音参数
            utterance.lang = 'en-GB';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            // 选择语音
            const englishVoice = voices.find(voice => 
                voice.name.includes('English') || 
                voice.lang.startsWith('en-')
            );
            
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            // 设置回调
            utterance.onend = () => {
                currentUtterance = null;
                resolve();
            };

            utterance.onerror = (event) => {
                console.warn('语音合成错误:', event);
                currentUtterance = null;
                // 对于中断错误，我们认为是正常的（可能是用户切换了页面）
                if (event.error === 'interrupted') {
                    resolve();
                } else {
                    reject(event);
                }
            };

            // 开始播放
            speechSynthesis.speak(utterance);

            // 设置超时保护
            setTimeout(() => {
                if (speechSynthesis.speaking && currentUtterance === utterance) {
                    speechSynthesis.cancel();
                    currentUtterance = null;
                    resolve();
                }
            }, 10000);

        } catch (error) {
            console.error('语音合成执行错误:', error);
            currentUtterance = null;
            resolve(); // 出错时也继续执行
        }
    });
}

// 语音队列处理
let speechQueue = [];
let isSpeaking = false;

async function processSpeechQueue() {
    if (isSpeaking || speechQueue.length === 0) return;
    
    isSpeaking = true;
    const { text, callback } = speechQueue[0];
    
    try {
        await speakText(text);
        if (callback) {
            setTimeout(callback, 200);
        }
    } catch (error) {
        console.warn('语音队列处理错误:', error);
    } finally {
        speechQueue.shift();
        isSpeaking = false;
        processSpeechQueue();
    }
}

function speak(text, callback) {
    // 如果浏览器不支持语音合成，直接调用回调
    if (!window.speechSynthesis) {
        if (callback) setTimeout(callback, 500);
        return;
    }
    
    speechQueue.push({ text, callback });
    processSpeechQueue();
}

const introductions = {
    part1: {
        title: "Part 1 - Introduction and Interview",
        text: [
            "My name is Sarah Wilson and I'm your examiner today.",
            "Could you please show me your identification?",
            "Can you confirm your full name for me?",
            "Now, in this first part, I'd like to ask you some questions about yourself."
        ]
    },
    part2: {
        title: "Part 2",
        text: [
            "Now, I'm going to give you a topic and I'd like you to talk about it for one to two minutes.",
            "Before you talk, you'll have one minute to think about what you're going to say.",
            "You can make some notes if you wish.",
        ]
    },
    part3: {
        title: "Part 3",
        text: [
            "Now, let's talk about some more general questions related to this topic.",
            "I'd like to discuss your views and opinions on several aspects of this subject."
        ]
    }
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function selectRandomQuestions(allQuestions) {
    console.log('开始选择随机题目');
    console.log('当前部分：', currentPart);
    console.log('收到的题目数量：', allQuestions ? allQuestions.length : 0);
    
    if (!Array.isArray(allQuestions)) {
        console.error('题目数据格式错误');
        return [];
    }

    let selectedQuestions = [];

    if (currentPart === 'part1') {
        // 获取前62题
        const first62Questions = allQuestions.filter(q => q.id <= 62);
        console.log('前62题数量：', first62Questions.length);
        
        // 从前62题中随机选择4题
        const shuffledFirst62 = shuffleArray([...first62Questions]);
        const selectedFirst4 = shuffledFirst62.slice(0, 3);
        console.log('从前62题中选择的4题：', selectedFirst4.map(q => q.id));
        
        // 获取剩余题目（ID大于62的题目）
        const remainingQuestions = allQuestions.filter(q => q.id > 62);
        console.log('剩余题目数量：', remainingQuestions.length);
        
        // 从剩余题目中随机选择7题
        const shuffledRemaining = shuffleArray([...remainingQuestions]);
        const selectedRemaining7 = shuffledRemaining.slice(0, 7);
        console.log('从剩余题目中选择的7题：', selectedRemaining7.map(q => q.id));
        
        // 合并选中的题目
        selectedQuestions = [
            ...selectedFirst4,
            ...selectedRemaining7
        ];
        
        console.log('最终选择的题目：', selectedQuestions.map(q => ({
            id: q.id,
            topic: q.topic,
            question: q.question
        })));
    } 
   
   
   
    else if (currentPart === 'part2') {
        if (allQuestions.length === 0) {
            console.error('Part 2 没有可用的题目');
            return [];
        }
        // 随机选择一个题目的索引
        const randomIndex = Math.floor(Math.random() * allQuestions.length);

        // 将选中的题目放入数组
        selectedQuestions = [allQuestions[randomIndex]];

        // 这里有一个问题：将 question 而不是 topic 存为 selectedPart2Topic
        selectedPart2Topic = allQuestions[randomIndex].topic;
        
        console.log('选择的 Part 2 话题：', selectedPart2Topic);
    }
    else if (currentPart === 'part3') {
        if (!selectedPart2Topic) {
            console.error('未找到 Part 2 话题，无法选择相关的 Part 3 问题');
            return [];
        }
        
        // 直接使用 Part 2 的话题来筛选 Part 3 题目
        const relatedQuestions = allQuestions.filter(q => q.topic === selectedPart2Topic);
        console.log('找到相关的 Part 3 题目：', relatedQuestions.length);
        
        // 从匹配的题目中随机抽取3道
        const selectedQuestions = [];
        const questionCount = Math.min(3, relatedQuestions.length); // 确保不超过可用题目数量
        
        while (selectedQuestions.length < questionCount) {
            const randomIndex = Math.floor(Math.random() * relatedQuestions.length);
            const question = relatedQuestions[randomIndex];
            
            // 确保不重复选择同一道题
            if (!selectedQuestions.includes(question)) {
                selectedQuestions.push(question);
            }
        }
        
        console.log('随机选择的 Part 3 题目数量：', selectedQuestions.length);
        return selectedQuestions;
    }

    return selectedQuestions;
}

async function selectPart(part) {
    try {
        currentPart = part;
        console.log('切换到部分:', part);
        
        // 直接从 questions.json 加载题目
        const response = await fetch('questions/questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const allQuestions = data[part] || [];
        console.log('加载到的题目数量:', allQuestions.length);
        
        // 选择随机题目
        questions = selectRandomQuestions(allQuestions);
        currentQuestionIndex = 0;
        
        // 显示内容区域
        const contentDiv = document.getElementById('question-content');
        contentDiv.style.display = 'flex';
        
        // 调整照片大小
        const examinerPhoto = document.querySelector('.examiner-photo');
        if (examinerPhoto) {
            examinerPhoto.classList.toggle('large', part !== 'part2');
        }
        
        // 重置计时器和状态
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        timeLeft = 0;
        updateTimerDisplay();
        
        // 显示引导语
        await showIntroduction();
        
    } catch (error) {
        console.error('Error:', error);
        const topicDiv = document.getElementById('topic');
        const questionDiv = document.getElementById('question');
        if (topicDiv) topicDiv.textContent = 'Error';
        if (questionDiv) questionDiv.textContent = error.message;
    }
}

async function showIntroduction() {
    // 获取引导语内容
    const intro = introductions[currentPart];
    if (!intro) {
        console.error('未找到引导语:', currentPart);
        return;
    }
    
    let currentLine = 0;
    
    // 获取DOM元素
    const questionText = document.getElementById('question');
    const topicText = document.getElementById('topic');
    const cueCard = document.getElementById('cue-card');
    
    // Part 2 直接显示问题和提示卡
    if (currentPart === 'part2' && questions && questions.length > 0) {
        const question = questions[currentQuestionIndex];
        
        // 显示话题和问题
        if (topicText) topicText.textContent = question.topic || '';
        if (questionText) questionText.textContent = question.question;
        
        // 显示提示卡
        if (cueCard && question.cue_card && question.cue_card.length > 0) {
            cueCard.style.display = 'block';
            const cuePoints = document.getElementById('cue-points');
            if (cuePoints) {
                cuePoints.innerHTML = question.cue_card
                    .map(point => `<li>${point}</li>`)
                    .join('');
            }
        }
        
        // 朗读引导语后直接开始计时
        return new Promise((resolve) => {
            let introIndex = 0;
            function speakNextIntro() {
                if (introIndex < intro.text.length) {
                    speak(intro.text[introIndex], () => {
                        introIndex++;
                        setTimeout(speakNextIntro, 300);
                    });
                } else {
                    startQuestionTimer();
                    resolve();
                }
            }
            speakNextIntro();
        });
    }
    
    // 其他部分保持原有逻辑
    // 隐藏提示卡
    if (cueCard) {
        cueCard.style.display = 'none';
    }
    
    // 显示标题
    if (topicText) {
        topicText.textContent = intro.title;
    }
    
    // 创建一个Promise来处理引导语的显示
    return new Promise((resolve) => {
        async function displayNextLine() {
            if (currentLine < intro.text.length) {
                // 显示当前行
                const line = intro.text[currentLine];
                if (questionText) {
                    questionText.textContent = line;
                }
                
                try {
                    await new Promise(resolve => speak(line, resolve));
                    currentLine++;
                    setTimeout(displayNextLine, 1000);
                } catch (error) {
                    console.error('语音合成错误:', error);
                    currentLine++;
                    setTimeout(displayNextLine, 1000);
                }
            } else {
                setTimeout(() => {
                    if (questions && questions.length > 0) {
                        const question = questions[currentQuestionIndex];
                        
                        // 更新显示
                        if (topicText) topicText.textContent = question.topic || '';
                        if (questionText) questionText.textContent = question.question;
                        
                        // 只在非 Part 2 时朗读问题
                        if (currentPart !== 'part2') {
                            speak(question.question, () => {
                                startQuestionTimer();
                            });
                        } else {
                            startQuestionTimer();
                        }
                    }
                    resolve();
                }, 1000);
            }
        }
        
        setTimeout(displayNextLine, 1000);
    });
}

function showQuestion() {
    // 检查是否有问题可以显示
    if (!questions || !questions.length || currentQuestionIndex >= questions.length) {
        console.error('没有可显示的问题:', {
            hasQuestions: !!questions,
            questionsLength: questions ? questions.length : 0,
            currentIndex: currentQuestionIndex
        });
        return;
    }
    
    // 获取当前问题
    const question = questions[currentQuestionIndex];
    console.log('显示问题:', question);
    
    // 获取DOM元素
    const topicText = document.getElementById('topic');
    const questionText = document.getElementById('question');
    const cueCard = document.getElementById('cue-card');
    const cuePoints = document.getElementById('cue-points');
    
    if (!topicText || !questionText) {
        console.error('未找到必要的DOM元素');
        return;
    }
    
    // 根据不同部分显示内容
    if (currentPart === 'part2') {
        // Part 2显示话题和问题
        topicText.textContent = question.topic || '';
        questionText.textContent = question.question;
        
        // 显示提示卡（如果有）
        if (cueCard && cuePoints && question.cue_card && question.cue_card.length > 0) {
            cueCard.style.display = 'block';
            cuePoints.innerHTML = question.cue_card
                .map(point => `<li>${point}</li>`)
                .join('');
                
            // 先朗读问题，然后朗读提示卡
            speak(question.question, () => {
                // 等待提示卡朗读
                setTimeout(() => {
                    speak(question.cue_card.join('. '), () => {
                        startQuestionTimer();
                    });
                }, 100);
            });
        } else {
            if (cueCard) cueCard.style.display = 'none';
            // 只朗读问题
            speak(question.question, () => {
                startQuestionTimer();
            });
        }
    } else {
        // Part 1和Part 3只显示问题
        topicText.textContent = question.topic || '';
        questionText.textContent = question.question;
        if (cueCard) cueCard.style.display = 'none';
        
        // 朗读问题
        speak(question.question, () => {
            startQuestionTimer();
        });
    }
}

function startQuestionTimer() {
    // 清除之前的计时器
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
        console.error('没有当前问题，无法启动计时器');
        return;
    }
    
    // 设置不同部分的计时
    switch(currentPart) {
        case 'part1':
            timeLeft = currentQuestion.time || 30;
            break;
        case 'part2':
            if (!currentQuestion.preparation_started) {
                timeLeft = 60; // 准备时间60秒
                // 在准备时间开始时朗读问题和提示卡
                if (currentQuestion.cue_card && currentQuestion.cue_card.length > 0) {
                    speak(currentQuestion.question, () => {
                        setTimeout(() => {
                            speak(currentQuestion.cue_card.join('. '));
                        }, 200);
                    });
                } else {
                    speak(currentQuestion.question);
                }
            } else {
                timeLeft = 125; // 回答时间125秒
            }
            break;
        case 'part3':
            timeLeft = 60; // Part 3 每题答题时间设为60秒
            break;
        default:
            console.error('未知的部分:', currentPart);
            return;
    }
    
    // 更新按钮状态
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    
    // 启动计时器
    updateTimerDisplay();
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            stopTimer();
            
            if (currentPart === 'part2') {
                if (!currentQuestion.preparation_started) {
                    console.log('准备时间结束，朗读引导语');
                    const questionText = document.getElementById('question');
                    const originalText = questionText.textContent;
                    
                    // 显示并朗读引导语
                    questionText.textContent = "Now, please begin your answer.";
                    speak("Now, please begin your answer.", () => {
                        // 恢复原来的问题文本
                        questionText.textContent = originalText;
                        setTimeout(() => {
                            currentQuestion.preparation_started = true;
                            startQuestionTimer();
                        }, 200);
                    });
                } else {
                    console.log('Part 2答题时间结束，进入Part 3');
                    setTimeout(() => selectPart('part3'), 1000);
                }
            } else {
                console.log('时间到，准备下一题');
                setTimeout(autoAdvance, 1000);
            }
        }
    }, 1000);
}

function autoAdvance() {
    console.log('自动前进:', {
        currentPart: currentPart,
        currentQuestionIndex: currentQuestionIndex,
        totalQuestions: questions ? questions.length : 0
    });

    if (currentQuestionIndex < questions.length - 1) {
        // 还有下一题，显示引导语后进入下一题
        currentQuestionIndex++;
        
        // 根据不同部分显示不同的引导语
        const questionText = document.getElementById('question');
        const originalQuestion = questions[currentQuestionIndex].question;
        
        if (currentPart === 'part1') {
            questionText.textContent = "Fine.";
            speak("Fine.", () => {
                setTimeout(() => {
                    questionText.textContent = originalQuestion;
                    showQuestion();
                }, 200);
            });
        } else if (currentPart === 'part3') {
            questionText.textContent = "Let's move on to the next question.";
            speak("Let's move on to the next question.", () => {
                setTimeout(() => {
                    questionText.textContent = originalQuestion;
                    showQuestion();
                }, 200);
            });
        } else {
            showQuestion();
        }
    } else {
        // 当前部分已完成，进入下一部分
        console.log('当前部分完成，准备切换到下一部分');
        if (currentPart === 'part1') {
            selectPart('part2');
        } else if (currentPart === 'part2') {
            selectPart('part3');
        } else {
            // Part 3结束，考试完成
            finishExam();
        }
    }
}
function finishExam() {
    console.log('考试完成');
    stopTimer();
    
    const contentDiv = document.getElementById('question-content');
    const topicDiv = document.getElementById('topic');
    const questionDiv = document.getElementById('question');
    
    if (contentDiv) contentDiv.style.display = 'none';
    if (topicDiv) topicDiv.textContent = 'Exam Completed';
    if (questionDiv) {
        questionDiv.textContent = 'Thank you for taking the test. Your responses have been saved.';
        speak(questionDiv.textContent);
    }
    
    // 重置状态
    currentQuestionIndex = 0;
    questions = [];
    selectedPart2Topic = null;
    
    // 启用所有部分选择按钮
    const buttons = document.querySelectorAll('.part-selector button');
    buttons.forEach(button => button.disabled = false);
}

function startTimer() {
    // 开始按钮只用于开始整个考试
    document.getElementById('start-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;
    // 不再调用showIntroduction，因为selectPart已经会调用它
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    document.getElementById('start-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer');
    if (!timerDisplay) {
        console.error('未找到计时器显示元素');
        return;
    }
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    timerDisplay.textContent = display;
}

// 移除手动next按钮的点击事件，改为自动进入下一题
document.getElementById('next-btn').style.display = 'none';

// 初始化录音功能
async function initRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await saveRecording(audioBlob);
            audioChunks = [];
        };
        
        // 设置录音按钮事件
        const recordBtn = document.getElementById('record-btn');
        const recordingStatus = document.getElementById('recording-status');
        const statusText = recordingStatus.querySelector('.status-text');
        const recordingTime = recordingStatus.querySelector('.recording-time');
        
        recordBtn.addEventListener('click', () => {
            if (!isRecording) {
                startRecording();
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = '<span class="record-icon"></span>Stop Recording';
                statusText.textContent = 'Recording...';
                document.getElementById('save-status').textContent = '';
            } else {
                stopRecording();
                recordBtn.classList.remove('recording');
                recordBtn.innerHTML = '<span class="record-icon"></span>Start Recording';
                statusText.textContent = 'Not Recording';
                recordingTime.textContent = '00:00';
            }
            isRecording = !isRecording;
        });
        
    } catch (error) {
        console.error('Error initializing recording:', error);
        alert('无法访问麦克风。请确保已授予麦克风访问权限。');
    }
}

function startRecording() {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
        mediaRecorder.start();
        recordingStartTime = Date.now();
        updateRecordingTime();
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        clearInterval(recordingTimer);
    }
}

function updateRecordingTime() {
    const recordingTime = document.querySelector('.recording-time');
    recordingTimer = setInterval(() => {
        const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

async function saveRecording(audioBlob) {
    try {
        // 生成带时间戳的文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording_${currentPart}_${timestamp}.wav`;
        
        // 创建下载链接并触发下载
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        document.getElementById('save-status').textContent = '录音已下载到本地';
    } catch (error) {
        console.error('Error saving recording:', error);
        document.getElementById('save-status').textContent = '保存录音失败: ' + error.message;
    }
}

// 在页面加载完成后初始化录音功能
document.addEventListener('DOMContentLoaded', () => {
    initSpeech();
    initRecording();
});

// Load Part 1 when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 初始化语音系统
        await initSpeech();
        
        // 设置按钮状态
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const nextBtn = document.getElementById('next-btn');
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        nextBtn.style.display = 'none';
        
        // 添加开始按钮的点击事件
        startBtn.addEventListener('click', () => {
            selectPart('part1');
        });
    } catch (error) {
        console.error('初始化失败:', error);
    }
});

function updateProgressBar(currentPart) {
    // 检查元素是否存在
    const progressItems = document.querySelectorAll('.progress-item');
    if (!progressItems || progressItems.length === 0) {
        console.warn('Progress bar elements not found');
        return;  // 如果元素不存在，直接返回
    }

    progressItems.forEach(item => {
        const part = item.getAttribute('data-part');
        item.className = `progress-item ${part === currentPart ? 'active' : ''}`;
    });
} 
