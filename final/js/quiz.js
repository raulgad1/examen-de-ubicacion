/* global sendResultsEmail */

// Quiz Application State
const quizState = {
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    userData: {
        name: '',
        email: '',
        phone: ''
    },
    levelScores: [],
    finalLevel: 0,
    isLoading: false
};

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const quizScreen = document.getElementById('quizScreen');
const resultsScreen = document.getElementById('resultsScreen');
const loadingOverlay = document.getElementById('loadingOverlay');

const userForm = document.getElementById('userForm');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const currentLevel = document.getElementById('currentLevel');
const questionNumber = document.getElementById('questionNumber');
const totalQuestions = document.getElementById('totalQuestions');
const currentQuestionNum = document.getElementById('currentQuestionNum');
const progressBar = document.getElementById('progressBar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    userForm.addEventListener('submit', handleFormSubmit);
    prevBtn.addEventListener('click', goToPreviousQuestion);
    nextBtn.addEventListener('click', goToNextQuestion);
    restartBtn.addEventListener('click', restartQuiz);
}

// Load questions from JSON file
async function loadQuestions() {
    showLoading(true);
    try {
        const response = await fetch('./questions/quiz_questions.json');
        if (!response.ok) {
            throw new Error('Failed to load questions');
        }
        const data = await response.json();
        
        // Flatten all questions from all levels into a single array
        quizState.questions = [];
        data.levels.forEach(level => {
            level.questions.forEach(question => {
                quizState.questions.push({
                    ...question,
                    level: level.level,
                    levelDescription: level.description
                });
            });
        });
        
        // Initialize user answers array
        quizState.userAnswers = new Array(quizState.questions.length).fill(null);
        
        totalQuestions.textContent = quizState.questions.length;
        showLoading(false);
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error al cargar las preguntas del examen. Por favor recarga la página e intenta nuevamente.');
        showLoading(false);
    }
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    
    if (!name || !email || !phone) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }
    
    quizState.userData = { name, email, phone };
    startQuiz();
}

// Start the quiz
function startQuiz() {
    quizState.currentQuestionIndex = 0;
    showScreen('quiz');
    displayQuestion();
}

// Display current question
function displayQuestion() {
    const question = quizState.questions[quizState.currentQuestionIndex];
    
    if (!question) {
        console.error('Question not found');
        return;
    }
    
    questionText.textContent = question.question;
    currentLevel.textContent = `Level ${question.level} - ${question.levelDescription}`;
    
    const questionNum = quizState.currentQuestionIndex + 1;
    questionNumber.textContent = questionNum;
    currentQuestionNum.textContent = questionNum;
    
    const progress = (questionNum / quizState.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    displayOptions(question);
    updateNavigationButtons();
}

// Display answer options
function displayOptions(question) {
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        
        const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];
        if (userAnswer !== null && userAnswer === index) {
            optionElement.classList.add('selected');
        }
        
        optionElement.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionElement);
    });
}

// Handle option selection
function selectOption(optionIndex) {
    quizState.userAnswers[quizState.currentQuestionIndex] = optionIndex;
    
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach((option, index) => {
        if (index === optionIndex) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    nextBtn.disabled = false;
}

// Update navigation buttons state
function updateNavigationButtons() {
    prevBtn.disabled = quizState.currentQuestionIndex === 0;
    
    const hasAnswer = quizState.userAnswers[quizState.currentQuestionIndex] !== null;
    nextBtn.disabled = !hasAnswer;
    
    if (quizState.currentQuestionIndex === quizState.questions.length - 1) {
        nextBtn.textContent = 'Finalizar';
    } else {
        nextBtn.textContent = 'Siguiente';
    }
}

// Go to previous question
function goToPreviousQuestion() {
    if (quizState.currentQuestionIndex > 0) {
        quizState.currentQuestionIndex--;
        displayQuestion();
    }
}

// Go to next question
function goToNextQuestion() {
    const currentIndex = quizState.currentQuestionIndex;
    const questionsPerLevel = 10;
    
    if ((currentIndex + 1) % questionsPerLevel === 0) {
        const currentLevel = Math.floor(currentIndex / questionsPerLevel) + 1;
        const levelStartIndex = (currentLevel - 1) * questionsPerLevel;
        const levelEndIndex = currentLevel * questionsPerLevel;
        
        let correctCount = 0;
        for (let i = levelStartIndex; i < levelEndIndex; i++) {
            const question = quizState.questions[i];
            const userAnswer = quizState.userAnswers[i];
            if (userAnswer === question.correctAnswer) {
                correctCount++;
            }
        }
        
        if (correctCount < 7) {
            finishQuiz();
            return;
        }
    }
    
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
        quizState.currentQuestionIndex++;
        displayQuestion();
    } else {
        finishQuiz();
    }
}

// Calculate scores and determine recommended level (cambio clave aquí)
function calculateResults() {
    const results = {
        levelScores: [],
        totalCorrect: 0,
        totalQuestions: 0,
        finalLevel: 0,
        finalLevelDescription: ''
    };
    
    const questionsPerLevel = 10;
    const totalLevels = 8;
    
    const lastAnsweredIndex = quizState.userAnswers.findLastIndex(answer => answer !== null);
    const levelsAttempted = lastAnsweredIndex >= 0 ? Math.floor(lastAnsweredIndex / questionsPerLevel) + 1 : 0;
    
    let highestPassedLevel = 0;
    
    for (let level = 1; level <= levelsAttempted; level++) {
        const startIndex = (level - 1) * questionsPerLevel;
        const endIndex = startIndex + questionsPerLevel;
        
        let correctCount = 0;
        let questionsAnswered = 0;
        
        for (let i = startIndex; i < endIndex && i < quizState.questions.length; i++) {
            if (quizState.userAnswers[i] !== null) {
                questionsAnswered++;
                const question = quizState.questions[i];
                const userAnswer = quizState.userAnswers[i];
                
                if (userAnswer === question.correctAnswer) {
                    correctCount++;
                    results.totalCorrect++;
                }
            }
        }
        
        results.totalQuestions += questionsAnswered;
        const passed = correctCount >= 7;
        
        results.levelScores.push({
            level: level,
            description: quizState.questions[startIndex].levelDescription,
            correct: correctCount,
            total: questionsAnswered,
            passed: passed
        });
        
        if (passed) {
            highestPassedLevel = level;
        }
    }
    
    // Lógica de nivel recomendado: siguiente al último aprobado
    let recommendedLevel = highestPassedLevel + 1;
    
    if (highestPassedLevel === 0) {
        recommendedLevel = 1;  // No aprobó nada → empieza en 1
    }
    
    if (recommendedLevel > totalLevels) {
        recommendedLevel = totalLevels;
        const maxStartIndex = (totalLevels - 1) * questionsPerLevel;
        results.finalLevelDescription = quizState.questions[maxStartIndex].levelDescription + " (Nivel Máximo)";
    } else {
        const nextStartIndex = (recommendedLevel - 1) * questionsPerLevel;
        if (nextStartIndex < quizState.questions.length) {
            results.finalLevelDescription = quizState.questions[nextStartIndex].levelDescription;
        } else {
            results.finalLevelDescription = "Nivel Avanzado / Experto";
        }
    }
    
    results.finalLevel = recommendedLevel;
    
    return results;
}

// Finish quiz and show results + send email
function finishQuiz() {
    const results = calculateResults();
    quizState.levelScores = results.levelScores;
    quizState.finalLevel = results.finalLevel;

    displayResults(results);
    showScreen('results');

    const levelBreakdownText = results.levelScores
        .map(ls => `Nivel ${ls.level} (${ls.description}): ${ls.correct}/${ls.total} ${ls.passed ? '(Aprobado)' : '(No aprobado)'}`)
        .join('\n');

    const emailPayload = {
        userName: quizState.userData.name,
        userEmail: quizState.userData.email,
        userPhone: quizState.userData.phone,

        finalLevel: `Nivel ${results.finalLevel} (Recomendado)`,
        levelDescription: results.finalLevelDescription,

        overallScore: `${Math.round((results.totalCorrect / results.totalQuestions) * 100)}% (${results.totalCorrect}/${results.totalQuestions})`,
        levelBreakdown: levelBreakdownText,
        testDate: new Date().toLocaleString(),

        totalCorrect: results.totalCorrect,
        totalQuestions: results.totalQuestions
    };

    sendResultsEmail(emailPayload);
}

// Display results on results screen
function displayResults(results) {
    const finalLevelElement = document.getElementById('finalLevel');
    const levelDescriptionElement = document.getElementById('levelDescription');
    
    finalLevelElement.textContent = `Nivel ${results.finalLevel} (Recomendado)`;
    levelDescriptionElement.textContent = results.finalLevelDescription;
    
    const levelBreakdownElement = document.getElementById('levelBreakdown');
    levelBreakdownElement.innerHTML = '';
    
    results.levelScores.forEach(levelScore => {
        const levelResultElement = document.createElement('div');
        levelResultElement.className = `level-result ${levelScore.passed ? 'passed' : 'failed'}`;
        
        levelResultElement.innerHTML = `
            <div>
                <span class="level-name">Nivel ${levelScore.level} - ${levelScore.description}</span>
            </div>
            <div>
                <span class="level-score">${levelScore.correct}/${levelScore.total}</span>
            </div>
        `;
        
        levelBreakdownElement.appendChild(levelResultElement);
    });
    
    document.getElementById('totalAnswered').textContent = results.totalQuestions;
    document.getElementById('totalCorrect').textContent = results.totalCorrect;
    
    const overallPercentage = Math.round((results.totalCorrect / results.totalQuestions) * 100);
    document.getElementById('overallScore').textContent = `${overallPercentage}%`;
}

// Show/hide screens
function showScreen(screenName) {
    welcomeScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    
    switch (screenName) {
        case 'welcome':
            welcomeScreen.classList.add('active');
            break;
        case 'quiz':
            quizScreen.classList.add('active');
            break;
        case 'results':
            resultsScreen.classList.add('active');
            break;
    }
}

// Show/hide loading overlay
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

// Restart quiz
function restartQuiz() {
    quizState.currentQuestionIndex = 0;
    quizState.userAnswers = new Array(quizState.questions.length).fill(null);
    quizState.levelScores = [];
    quizState.finalLevel = 0;
    
    userForm.reset();
    showScreen('welcome');
}

// Export quiz state for email functionality
window.quizState = quizState;
