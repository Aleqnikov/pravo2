import React, { useState, useEffect, useMemo } from 'react';
import { Plus, BarChart3, FileText, Trash2, Download, Upload } from 'lucide-react';

const QuizManagerApp = () => {
  const [view, setView] = useState('testList'); // testList, createTest, takeTest, results, stats
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [testResults, setTestResults] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [allStats, setAllStats] = useState([]);

  // Загрузка данных из localStorage при монтировании
  useEffect(() => {
    const savedTests = localStorage.getItem('quizTests');
    const savedStats = localStorage.getItem('quizStats');
    
    if (savedTests) {
      try {
        setTests(JSON.parse(savedTests));
      } catch (e) {
        console.error('Ошибка загрузки тестов:', e);
      }
    }
    
    if (savedStats) {
      try {
        setAllStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Ошибка загрузки статистики:', e);
      }
    }
  }, []);

  // Сохранение тестов в localStorage
  useEffect(() => {
    if (tests.length > 0) {
      localStorage.setItem('quizTests', JSON.stringify(tests));
    }
  }, [tests]);

  // Сохранение статистики в localStorage
  useEffect(() => {
    if (allStats.length > 0) {
      localStorage.setItem('quizStats', JSON.stringify(allStats));
    }
  }, [allStats]);

  const handleCreateTest = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      // Валидация формата
      if (!parsed.title || !Array.isArray(parsed.questions)) {
        alert('Неверный формат! Требуются поля: title, questions');
        return;
      }

      const newTest = {
        id: Date.now(),
        title: parsed.title,
        description: parsed.description || '',
        questions: parsed.questions,
        createdAt: new Date().toISOString()
      };

      setTests(prev => [...prev, newTest]);
      setJsonInput('');
      setView('testList');
      alert('Тест успешно создан!');
    } catch (e) {
      alert('Ошибка парсинга JSON: ' + e.message);
    }
  };

  const handleDeleteTest = (testId) => {
    if (confirm('Удалить этот тест?')) {
      setTests(prev => prev.filter(t => t.id !== testId));
      setAllStats(prev => prev.filter(s => s.testId !== testId));
    }
  };

  const handleStartTest = (test) => {
    setCurrentTest(test);
    setUserAnswers({});
    setTestResults(null);
    setView('takeTest');
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const checkAnswer = (userAnswer, correctAnswer) => {
    if (Array.isArray(correctAnswer)) {
      if (!Array.isArray(userAnswer)) return false;
      if (userAnswer.length !== correctAnswer.length) return false;
      return userAnswer.every(ans => correctAnswer.includes(ans));
    }
    return userAnswer === correctAnswer;
  };

  const handleSubmitTest = () => {
    const results = currentTest.questions.map(q => {
      const userAnswer = userAnswers[q.id];
      const isCorrect = checkAnswer(userAnswer, q.answer);
      
      return {
        questionId: q.id,
        userAnswer,
        isCorrect
      };
    });

    const correctCount = results.filter(r => r.isCorrect).length;
    const percentage = ((correctCount / currentTest.questions.length) * 100).toFixed(1);

    const statEntry = {
      testId: currentTest.id,
      testTitle: currentTest.title,
      date: new Date().toISOString(),
      score: correctCount,
      total: currentTest.questions.length,
      percentage: parseFloat(percentage)
    };

    setAllStats(prev => [...prev, statEntry]);
    setTestResults(results);
    setView('results');
  };

  const handleExportTest = (test) => {
    const dataStr = JSON.stringify(test, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test_${test.id}.json`;
    link.click();
  };

  const formatAnswer = (answer, options) => {
    if (!answer) return 'Не отвечено';
    if (Array.isArray(answer)) {
      return answer.map(a => `${a.toUpperCase()}. ${options[a]}`).join('; ');
    }
    return `${answer.toUpperCase()}. ${options[answer]}`;
  };

  const isTestComplete = useMemo(() => {
    if (!currentTest) return false;
    return currentTest.questions.every(q => {
      const answer = userAnswers[q.id];
      if (q.type === 'multiple') {
        return Array.isArray(answer) && answer.length > 0;
      }
      return !!answer;
    });
  }, [userAnswers, currentTest]);

  // Рендер списка тестов
  const TestListView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Мои тесты</h2>
        <button
          onClick={() => setView('createTest')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Создать тест
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Нет созданных тестов</p>
          <p className="text-sm">Создайте свой первый тест!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map(test => {
            const testStats = allStats.filter(s => s.testId === test.id);
            const avgScore = testStats.length > 0
              ? (testStats.reduce((sum, s) => sum + s.percentage, 0) / testStats.length).toFixed(1)
              : null;

            return (
              <div key={test.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{test.title}</h3>
                    {test.description && (
                      <p className="text-gray-600 text-sm mt-1">{test.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Вопросов: {test.questions.length}</span>
                      <span>Создан: {new Date(test.createdAt).toLocaleDateString('ru-RU')}</span>
                      {avgScore && (
                        <span className="text-green-600 font-medium">
                          Средний балл: {avgScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportTest(test)}
                      className="p-2 text-gray-600 hover:text-blue-600"
                      title="Экспорт"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="p-2 text-gray-600 hover:text-red-600"
                      title="Удалить"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleStartTest(test)}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Начать тест
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Рендер создания теста
  const CreateTestView = () => {
    const exampleJson = {
      title: "Название теста",
      description: "Описание теста (опционально)",
      questions: [
        {
          id: 1,
          text: "Вопрос с одним ответом?",
          type: "single",
          options: {
            a: "Вариант A",
            b: "Вариант B",
            c: "Вариант C"
          },
          answer: "a"
        },
        {
          id: 2,
          text: "Вопрос с несколькими ответами?",
          type: "multiple",
          options: {
            a: "Вариант A",
            b: "Вариант B",
            c: "Вариант C",
            d: "Вариант D"
          },
          answer: ["a", "c"]
        }
      ]
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">Создать новый тест</h2>
          <button
            onClick={() => setView('testList')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Назад
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Формат JSON:</h3>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(exampleJson, null, 2)}
          </pre>
        </div>

        <div>
          <label className="block font-semibold mb-2">Введите JSON теста:</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-96 p-3 border rounded-lg font-mono text-sm"
            placeholder="Вставьте JSON..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCreateTest}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Создать тест
          </button>
          <button
            onClick={() => setJsonInput(JSON.stringify(exampleJson, null, 2))}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            Загрузить пример
          </button>
        </div>
      </div>
    );
  };

  // Рендер прохождения теста
  const TakeTestView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-700">{currentTest.title}</h2>
          {currentTest.description && (
            <p className="text-gray-600 mt-1">{currentTest.description}</p>
          )}
        </div>
        <button
          onClick={() => setView('testList')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Назад
        </button>
      </div>

      {currentTest.questions.map((q, index) => {
        const isMultiple = q.type === 'multiple';
        const optionsKeys = Object.keys(q.options);

        return (
          <div key={q.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="font-semibold mb-3">
              {index + 1}. {q.text}
              {isMultiple && <span className="text-red-600 ml-2">(несколько ответов)</span>}
            </div>
            <div className="space-y-2">
              {optionsKeys.map(key => {
                const isChecked = isMultiple
                  ? (Array.isArray(userAnswers[q.id]) && userAnswers[q.id].includes(key))
                  : userAnswers[q.id] === key;

                return (
                  <label
                    key={key}
                    className="flex items-start gap-3 p-2 rounded hover:bg-blue-50 cursor-pointer"
                  >
                    <input
                      type={isMultiple ? 'checkbox' : 'radio'}
                      name={`question-${q.id}`}
                      checked={isChecked}
                      onChange={() => {
                        if (isMultiple) {
                          const current = userAnswers[q.id] || [];
                          const newAnswer = current.includes(key)
                            ? current.filter(a => a !== key)
                            : [...current, key];
                          handleAnswerChange(q.id, newAnswer);
                        } else {
                          handleAnswerChange(q.id, key);
                        }
                      }}
                      className="mt-1"
                    />
                    <span>{key.toUpperCase()}. {q.options[key]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="sticky bottom-0 bg-white border-t pt-4 mt-6">
        <button
          onClick={handleSubmitTest}
          disabled={!isTestComplete}
          className={`w-full py-3 rounded-lg font-semibold ${
            isTestComplete
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Завершить тест ({Object.keys(userAnswers).length} из {currentTest.questions.length})
        </button>
      </div>
    </div>
  );

  // Рендер результатов
  const ResultsView = () => {
    const correctCount = testResults.filter(r => r.isCorrect).length;
    const totalCount = currentTest.questions.length;
    const percentage = ((correctCount / totalCount) * 100).toFixed(1);
    const errorList = testResults.filter(r => !r.isCorrect);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-blue-700">Результаты: {currentTest.title}</h2>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-700 mb-2">{percentage}%</div>
            <div className="text-lg">
              Правильных ответов: <span className="font-semibold">{correctCount}</span> из {totalCount}
            </div>
          </div>
        </div>

        <button
          onClick={() => setView('testList')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          К списку тестов
        </button>

        {errorList.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-red-600 mb-4">
              Ошибки ({errorList.length})
            </h3>
            <div className="space-y-4">
              {errorList.map((error, index) => {
                const q = currentTest.questions.find(q => q.id === error.questionId);
                return (
                  <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                    <p className="font-semibold mb-2">{q.text}</p>
                    <p className="text-red-700">
                      Ваш ответ: {formatAnswer(error.userAnswer, q.options)}
                    </p>
                    <p className="text-green-700 font-semibold mt-1">
                      Правильный ответ: {formatAnswer(q.answer, q.options)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Рендер статистики
  const StatsView = () => {
    const groupedStats = tests.map(test => ({
      test,
      attempts: allStats.filter(s => s.testId === test.id)
    })).filter(item => item.attempts.length > 0);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">Статистика</h2>
          <button
            onClick={() => setView('testList')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Назад
          </button>
        </div>

        {groupedStats.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
            <p>Нет данных для отображения</p>
            <p className="text-sm">Пройдите хотя бы один тест</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedStats.map(({ test, attempts }) => {
              const avgScore = (attempts.reduce((sum, s) => sum + s.percentage, 0) / attempts.length).toFixed(1);
              const bestScore = Math.max(...attempts.map(s => s.percentage)).toFixed(1);
              
              return (
                <div key={test.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">{test.title}</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-blue-700">{attempts.length}</div>
                      <div className="text-sm text-gray-600">Попыток</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-green-700">{avgScore}%</div>
                      <div className="text-sm text-gray-600">Средний балл</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-purple-700">{bestScore}%</div>
                      <div className="text-sm text-gray-600">Лучший результат</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700">История попыток:</h4>
                    {attempts.map((stat, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <span>{new Date(stat.date).toLocaleString('ru-RU')}</span>
                        <span className={`font-semibold ${stat.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.score}/{stat.total} ({stat.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h1 className="text-3xl font-bold text-blue-700">Менеджер тестов</h1>
            <button
              onClick={() => setView('stats')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <BarChart3 size={24} />
              Статистика
            </button>
          </div>

          {view === 'testList' && <TestListView />}
          {view === 'createTest' && <CreateTestView />}
          {view === 'takeTest' && <TakeTestView />}
          {view === 'results' && <ResultsView />}
          {view === 'stats' && <StatsView />}
        </div>
      </div>
    </div>
  );
};

export default QuizManagerApp;
