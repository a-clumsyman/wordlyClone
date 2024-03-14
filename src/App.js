import React, { useState, useEffect } from 'react';
import './App.css';

const maxTries = 6;

function App() {
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState(Array(maxTries).fill(""));
  const [currentGuess, setCurrentGuess] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [gameOver, setGameOver] = useState(false);

// New function to fetch a word and reset game state
const fetchWord = () => {
  fetch('https://random-word-api.herokuapp.com/word?length=5')
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        setTargetWord(data[0]);
        setGameOver(false); // Resetting gameOver to false for new game
        setGuesses(Array(maxTries).fill("")); // Resetting guesses
        setAttempt(0); // Resetting attempt count
      }
    })
    .catch(error => console.error('Error fetching the target word:', error));
};

// UseEffect to fetch word on component mount
useEffect(() => {
  fetchWord();
}, []);


  useEffect(() => {
    if (attempt === maxTries && !guesses.includes(targetWord)) {
      setGameOver(true);
    }
  }, [attempt, guesses, targetWord]);

  const handleChange = (event) => {
    const value = event.target.value.toLowerCase();
    const alphaOnlyValue = value.replace(/[^a-z]/gi, ''); // Allow alphabetic characters only
    if (alphaOnlyValue.length <= 5) {
      setCurrentGuess(alphaOnlyValue);
    }
  };
  

  const handleSubmit = (event) => {
    event.preventDefault();
    if (currentGuess.length !== 5 || /\s/.test(currentGuess)) {
      alert("Guesses must be 5 letters long and cannot include spaces.");
      return;
    }
    // Verify if the guess is a real word
    fetch(`https://api.datamuse.com/words?sp=${currentGuess}&md=d&max=1`)
      .then(response => response.json())
      .then(data => {
        if (data.length > 0 && data[0].word === currentGuess && data[0].defs) {
          const newGuesses = [...guesses];
          newGuesses[attempt] = currentGuess;
          setGuesses(newGuesses);
          setCurrentGuess("");
          if (currentGuess === targetWord || attempt + 1 >= maxTries) {
            setGameOver(true);
            alert(`Game Over. The word was ${targetWord.toUpperCase()}.`);
          } else {
            setAttempt(attempt + 1);
          }
        } else {
          alert("This is not a valid word. Please try again.");
        }
      })
      .catch(error => {
        console.error('Error verifying the word:', error);
        alert("There was an error verifying your word. Please try again.");
      });
  };

 

  
  const restartGame = () => {
    fetchWord(); // This resets the game
  };


  const getLetterClass = (guess, index) => {
    if (targetWord[index] === guess[index]) {
      return "correct"; // Correct letter in the correct position
    } else if (targetWord.includes(guess[index])) {
      return "misplaced"; // Correct letter in the wrong position
    }
    return ""; // Incorrect letter
  };

  if (!targetWord) return <div>Loading...</div>;

  return (
    <div className="App">
      <h1>Wordle Clone</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" value={currentGuess} onChange={handleChange} maxLength="5" autoComplete="off" />
        <button type="submit" disabled={gameOver}>Guess</button>
      </form>
      <div className="guessGrid">
        {guesses.map((guess, rowIndex) => (
          <div key={rowIndex} className="guessRow">
            {Array.from(guess.padEnd(5)).map((char, charIndex) => (
              <div key={charIndex} className={`guessBox ${getLetterClass(guess, charIndex)}`}>
                {char.toUpperCase()}
              </div>
            ))}
          </div>
        ))}
      </div>
      {gameOver && <>
        <p className="revealWord">The word was: {targetWord.toUpperCase()}</p>
        <button onClick={restartGame}>Restart Game</button>
      </>}
    </div>
  );
}

export default App;
