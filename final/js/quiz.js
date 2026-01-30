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
    
    // Update question text
    questionText.textContent = question.question;
    
    // Update level indicator
    currentLevel.textContent = `Level ${question.level} - ${question.levelDescription}`;
    
    // Update question counter
    const questionNum = quizState.currentQuestionIndex + 1;
    questionNumber.textContent = questionNum;
    currentQuestionNum.textContent = questionNum;
    
    // Update progress bar
    const progress = (questionNum / quizState.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Display options
    displayOptions(question);
    
    // Update navigation buttons
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
        
        // Check if this option was previously selected
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
    // Store the answer
    quizState.userAnswers[quizState.currentQuestionIndex] = optionIndex;
    
    // Update UI
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach((option, index) => {
        if (index === optionIndex) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    // Enable next button
    nextBtn.disabled = false;
}

// Update navigation buttons state
function updateNavigationButtons() {
    // Previous button
    prevBtn.disabled = quizState.currentQuestionIndex === 0;
    
    // Next button
    const hasAnswer = quizState.userAnswers[quizState.currentQuestionIndex] !== null;
    nextBtn.disabled = !hasAnswer;
    
    // Change next button text on last question
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
    // Check if we just completed a level (every 10 questions)
    const currentIndex = quizState.currentQuestionIndex;
    const questionsPerLevel = 10;
    
    // If we're at the end of a level (questions 9, 19, 29, etc.)
    if ((currentIndex + 1) % questionsPerLevel === 0) {
        const currentLevel = Math.floor(currentIndex / questionsPerLevel) + 1;
        const levelStartIndex = (currentLevel - 1) * questionsPerLevel;
        const levelEndIndex = currentLevel * questionsPerLevel;
        
        // Calculate score for the just-completed level
        let correctCount = 0;
        for (let i = levelStartIndex; i < levelEndIndex; i++) {
            const question = quizState.questions[i];
            const userAnswer = quizState.userAnswers[i];
            if (userAnswer === question.correctAnswer) {
                correctCount++;
            }
        }
        
        // If score is below 7, end the quiz immediately
        if (correctCount < 7) {
            finishQuiz();
            return;
        }
    }
    
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
        quizState.currentQuestionIndex++;
        displayQuestion();
    } else {
        // Quiz completed
        finishQuiz();
    }
}

// Calculate scores and determine final level
function calculateResults() {
    const results = {
        levelScores: [],
        totalCorrect: 0,
        totalQuestions: 0,
        finalLevel: 0,
        finalLevelDescription: ''
    };
    
    // Calculate score for each level (10 questions per level)
    const questionsPerLevel = 10;
    const totalLevels = 8;
    
    // Determine how many levels were actually attempted
    const lastAnsweredIndex = quizState.userAnswers.findLastIndex(answer => answer !== null);
    const levelsAttempted = lastAnsweredIndex >= 0 ? Math.floor(lastAnsweredIndex / questionsPerLevel) + 1 : 0;
    
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
        
        // Update final level (highest level with 7+ correct answers)
        if (passed) {
            results.finalLevel = level;
            results.finalLevelDescription = quizState.questions[startIndex].levelDescription;
        }
    }
    
    // If user didn't pass any level, they are at level 0 (below A1)
    if (results.finalLevel === 0) {
        results.finalLevelDescription = 'Pre-A1';
    }
    
    return results;
}

// Finish quiz and show results
function finishQuiz() {
    const results = calculateResults();
    quizState.levelScores = results.levelScores;
    quizState.finalLevel = results.finalLevel;

    displayResults(results);
    showScreen('results');

    // ✅ Construir detalle por nivel: "Nivel 1 (A1): 10/10"
    const levelBreakdownText = results.levelScores
        .map(ls => `Nivel ${ls.level} (${ls.description}): ${ls.correct}/${ls.total}`)
        .join('\n');

    // ✅ Enviar email con datos del alumno + resultados
    const emailPayload = {
        userName: quizState.userData.name,
        userEmail: quizState.userData.email,
        userPhone: quizState.userData.phone,

        finalLevel: results.finalLevel === 0 ? 'Pre-A1' : `Level ${results.finalLevel}`,
        levelDescription: results.finalLevelDescription,

        overallScore: `${Math.round((results.totalCorrect / results.totalQuestions) * 100)}% (${results.totalCorrect}/${results.totalQuestions})`,
        levelBreakdown: levelBreakdownText,
        testDate: new Date().toLocaleString(),

        // opcionales por si los usas luego
        totalCorrect: results.totalCorrect,
        totalQuestions: results.totalQuestions
    };

    sendResultsEmail(emailPayload);
}

// Display results on results screen
function displayResults(results) {
    // Display final level
    const finalLevelElement = document.getElementById('finalLevel');
    const levelDescriptionElement = document.getElementById('levelDescription');
    
    if (results.finalLevel === 0) {
        finalLevelElement.textContent = 'Pre-A1';
        levelDescriptionElement.textContent = results.finalLevelDescription;
    } else {
        finalLevelElement.textContent = `Level ${results.finalLevel}`;
        levelDescriptionElement.textContent = results.finalLevelDescription;
    }
    
    // Display level breakdown
    const levelBreakdownElement = document.getElementById('levelBreakdown');
    levelBreakdownElement.innerHTML = '';
    
    results.levelScores.forEach(levelScore => {
        const levelResultElement = document.createElement('div');
        levelResultElement.className = `level-result ${levelScore.passed ? 'passed' : 'failed'}`;
        
        levelResultElement.innerHTML = `
            <div>
                <span class="level-name">Level ${levelScore.level} - ${levelScore.description}</span>
            </div>
            <div>
                <span class="level-score">${levelScore.correct}/${levelScore.total}</span>
            </div>
        `;
        
        levelBreakdownElement.appendChild(levelResultElement);
    });
    
    // Display summary
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
    // Reset state
    quizState.currentQuestionIndex = 0;
    quizState.userAnswers = new Array(quizState.questions.length).fill(null);
    quizState.levelScores = [];
    quizState.finalLevel = 0;
    
    // Reset form
    userForm.reset();
    
    // Show welcome screen
    showScreen('welcome');
}

// Export quiz state for email functionality
window.quizState = quizState;
