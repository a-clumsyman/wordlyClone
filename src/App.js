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
  // Using the Datamuse API to get a list of words that match the pattern (5-letter words)
  fetch('https://api.datamuse.com/words?sp=?????&max=200')
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        // Filter the results to get only 5-letter words
        const fiveLetterWords = data.filter(word => word.word.length === 5);
        if (fiveLetterWords.length > 0) {
          // Randomly select a word from the list of 5-letter words
          const randomIndex = Math.floor(Math.random() * fiveLetterWords.length);
          setTargetWord(fiveLetterWords[randomIndex].word);
          setGameOver(false);
          setGuesses(Array(maxTries).fill(""));
          setCurrentGuess("");
          setAttempt(0);
          setLetterStatus(initialLetterStatus);
        } else {
          // No 5-letter words found in the data
          console.error('No 5-letter words found in the API response.');
        }
      } else {
        // No words were returned by the API
        console.error('No words found from the API.');
      }
    })
    .catch(error => {
      // Handle any errors during the fetch operation
      console.error('Error fetching the target word:', error);
    });
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
            // alert(`Congratulations! The word was ${targetWord.toUpperCase()}.`);
          } else if (attempt + 1 >= maxTries) {
            setGameOver(true);
            // alert(`Out of attempts! The word was ${targetWord.toUpperCase()}.`);
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

  
 


  const getLetterClass = (guess, index, targetWord) => {
    const letter = guess[index];
    // Create arrays to track the status of each letter in the guess.
    const correctIndices = [];
    const misplacedIndices = [];
  
    // First, identify all correctly positioned letters.
    for (let i = 0; i < targetWord.length; i++) {
      if (guess[i] === targetWord[i]) {
        correctIndices.push(i);
      }
    }
  
    // Then, identify misplaced letters that are not already marked as correct.
    for (let i = 0; i < targetWord.length; i++) {
      if (targetWord.includes(guess[i]) && !correctIndices.includes(i)) {
        // A letter is misplaced if it's in the target word and not in its correct position.
        // It shouldn't be marked misplaced if another instance of the same letter is correct.
        const targetLetterOccurrences = targetWord.split(guess[i]).length - 1;
        const guessLetterCorrectOccurrences = correctIndices.filter(idx => guess[idx] === guess[i]).length;
        const guessLetterMisplacedOccurrences = misplacedIndices.filter(idx => guess[idx] === guess[i]).length;
        if ((guessLetterCorrectOccurrences + guessLetterMisplacedOccurrences) < targetLetterOccurrences) {
          misplacedIndices.push(i);
        }
      }
    }
  
    // Determine the class for the current letter.
    if (correctIndices.includes(index)) {
      return 'correct';
    } else if (misplacedIndices.includes(index)) {
      return 'misplaced';
    } else {
      return 'incorrect';
    }
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
              <div key={charIndex} className={`guessBox ${getLetterClass(guess, charIndex, targetWord, guesses.slice(0, rowIndex))}`}>
                {char.toUpperCase()}
              </div>
            ))}
          </div>
        ))}
     </div>
      <Keyboard onKeyPress={handleKeyPress} letterStatus={letterStatus} />
      {gameOver && (
        <>
          {guesses.includes(targetWord) ? (
      <p className="revealWord">Congratulations! The word was: {targetWord.toUpperCase()}.</p>
    ) : (
      <p className="revealWord">Better luck next time! The word was: {targetWord.toUpperCase()}.</p>
    )}

          <button onClick={fetchWord} className="restartButton">Restart Game</button>
        </>
      )}
    </div>
  );
}

export default App;