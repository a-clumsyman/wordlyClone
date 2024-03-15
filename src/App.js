import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const maxTries = 6;
const initialLetterStatus = Object.fromEntries(
  Array.from("abcdefghijklmnopqrstuvwxyz").map((letter) => [letter, ""])
);

function Keyboard({ onKeyPress, letterStatus }) {
  const keys = [
    'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
    'z', 'x', 'c', 'v', 'b', 'n', 'm'
  ];

  return (
    <div className="keyboard">
      {keys.map((key) => (
        <button
          key={key}
          className={`key ${letterStatus[key]}`}
          onClick={() => onKeyPress(key)}
        >
          {key.toUpperCase()}
        </button>
      ))}
    </div>
  );
}



function App() {
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState(Array(maxTries).fill(""));
  const [currentGuess, setCurrentGuess] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [letterStatus, setLetterStatus] = useState(initialLetterStatus);
  const inputRef = useRef(null);
  
 
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && currentGuess.length === 5 && !gameOver) {
        event.preventDefault();

        handleSubmit();
        return;
      }
      if (event.key === 'Backspace' && !gameOver) {
        setCurrentGuess(currentGuess.slice(0, -1));
        event.preventDefault();
        return;
      }
      if (/^[a-z]$/i.test(event.key) && currentGuess.length < 5 && !gameOver) {
        handleKeyPress(event.key.toLowerCase());
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentGuess, gameOver]);

  useEffect(() => {
    fetchWord();
  }, []);
// New function to fetch a word and reset game state
const fetchWord = () => {
  fetch('https://random-word-api.herokuapp.com/word?length=5')
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        setTargetWord(data[0]);
        setGameOver(false); // Resetting gameOver to false for new game
        setGuesses(Array(maxTries).fill(""));
        setCurrentGuess("");
        setAttempt(0);
        setLetterStatus(initialLetterStatus);
      }
    })
    .catch(error => console.error('Error fetching the target word:', error));
};



  useEffect(() => {
    if (attempt === maxTries && !guesses.includes(targetWord)) {
      setGameOver(true);
    }
  }, [attempt, guesses, targetWord]);

  const handleKeyPress = (key) => {
    if (currentGuess.length < 5 && !gameOver) {
      setCurrentGuess(currentGuess + key);
    }
  };

  const handleChange = (event) => {
    let value = event.target.value;
    
    // Convert to lowercase
    value = value.toLowerCase();
    
    // Filter out non-alphabetical characters
    value = value.replace(/[^a-z]/gi, '');
  
    // Limit the length to 5 characters
    if (value.length <= 5) {
      setCurrentGuess(value);
    }
  };
  
  
  

  const handleSubmit = () => {
    if (currentGuess.length !== 5) {
      alert("Guesses must be 5 letters long.");
      return;
    }
    if (guesses.includes(currentGuess)) {
      alert("You've already tried this word.");
      return;
    }
    // Verify if the guess is a real word
    fetch(`https://api.datamuse.com/words?sp=${currentGuess}&md=d&max=1`)
      .then(response => response.json())
      .then(data => {
        if (data.length > 0 && data[0].word === currentGuess && data[0].defs) {
          // Word is valid, proceed with updating guesses and checking win/lose condition
          const newGuesses = [...guesses];
          newGuesses[attempt] = currentGuess;
          setGuesses(newGuesses);
  
          updateLetterStatuses(currentGuess);
  
          if (currentGuess === targetWord) {
            setGameOver(true);
            alert(`Congratulations! The word was ${targetWord.toUpperCase()}.`);
          } else if (attempt + 1 >= maxTries) {
            setGameOver(true);
            alert(`Out of attempts! The word was ${targetWord.toUpperCase()}.`);
          }
          setAttempt(attempt + 1);
          setCurrentGuess("");
        } else {
          alert("This is not a valid word. Please try again.");
        }
      })
      .catch(error => {
        console.error('Error verifying the word:', error);
        alert("There was an error verifying your word. Please try again.");
      });
  };
  

  const updateLetterStatuses = (guess) => {
    const newStatuses = { ...letterStatus };
    Array.from(guess).forEach((char) => {
      if (targetWord.includes(char)) {
        newStatuses[char] = targetWord.indexOf(char) === guess.indexOf(char) ? "correct" : "misplaced";
      } else if (!newStatuses[char]) {
        newStatuses[char] = "incorrect";
      }
    });
    setLetterStatus(newStatuses);
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
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          ref={inputRef} // Attach the ref to the input
          type="text"
          value={currentGuess}
          onChange={handleChange}
          maxLength="5"
          autoComplete="off"
          disabled={gameOver}
        />
        <button onClick={handleSubmit} disabled={gameOver || currentGuess.length !== 5}>Submit</button>
      </form>
      <div className="guessGrid">
        {guesses.map((guess, rowIndex) => (
          <div key={rowIndex} className="guessRow">
            {Array.from(guess.padEnd(5, ' ')).map((char, charIndex) => (
              <div key={charIndex} className={`guessBox ${getLetterClass(guess, charIndex, targetWord)}`}>
                {char.toUpperCase()}
              </div>
            ))}
          </div>
        ))}
      </div>
      <Keyboard onKeyPress={handleKeyPress} letterStatus={letterStatus} />
      {gameOver && (
        <>
          <p className="revealWord">The word was: {targetWord.toUpperCase()}</p>
          <button onClick={() => fetchWord()} className="restartButton">Restart Game</button>
        </>
      )}
    </div>
  );
}

export default App;