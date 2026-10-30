/* BrightPlay – constants and sample games */
window.BP = window.BP || {};

BP.SUBJECTS = [
  { id: 'Maths', icon: '🔢', color: '#3a86ff' },
  { id: 'English', icon: '📖', color: '#ff5c93' },
  { id: 'Science', icon: '🔬', color: '#2ec4b6' },
  { id: 'Geography', icon: '🌍', color: '#3bb273' },
  { id: 'History', icon: '🏰', color: '#b5651d' },
  { id: 'Languages', icon: '🗣️', color: '#9b5de5' },
  { id: 'Art & Music', icon: '🎨', color: '#ff9f1c' },
  { id: 'General', icon: '⭐', color: '#f15bb5' },
  { id: 'Other', icon: '🧩', color: '#6c757d' }
];

BP.DIFFICULTIES = [
  { id: 'easy', label: 'Easy', icon: '🌱' },
  { id: 'medium', label: 'Medium', icon: '🌟' },
  { id: 'hard', label: 'Hard', icon: '🔥' }
];

BP.TYPES = {
  quiz: {
    id: 'quiz', name: 'Quiz', icon: '❓', color: '#6c4cf5',
    blurb: 'Multiple-choice questions with four answers.',
    itemName: 'question'
  },
  match: {
    id: 'match', name: 'Matching Pairs', icon: '🧩', color: '#ff9f1c',
    blurb: 'Match words with meanings, pictures or answers.',
    itemName: 'pair'
  },
  spell: {
    id: 'spell', name: 'Spelling', icon: '🔤', color: '#2ec4b6',
    blurb: 'Read a clue or see a picture, then type the word.',
    itemName: 'word'
  }
};

BP.CARD_COLORS = ['#6c4cf5', '#ff5c93', '#ff9f1c', '#2ec4b6', '#3a86ff', '#3bb273', '#ef476f', '#9b5de5', '#f4a300', '#00a6d6'];

BP.ICONS = ['⭐', '🚀', '🦁', '🐠', '🌈', '🍎', '🔢', '📖', '🔬', '🌍', '🏰', '🎨', '🎵', '🧠', '🦋', '🐶', '🌻', '⚽', '🍕', '🎈', '🦖', '🪐', '✏️', '🏆'];

BP.SAMPLE_GAMES = [
  {
    id: 'sample-times-tables',
    type: 'quiz',
    title: 'Times Tables Challenge',
    description: 'Practise your 2, 5 and 10 times tables. How fast can you go?',
    subject: 'Maths', topic: 'Multiplication', difficulty: 'easy',
    icon: '🔢', color: '#3a86ff',
    settings: { shuffle: true, shuffleAnswers: true },
    items: [
      { q: 'What is 2 × 3?', emoji: '', image: '', answers: ['6', '5', '8', '9'], correct: 0 },
      { q: 'What is 5 × 4?', emoji: '', image: '', answers: ['15', '20', '25', '9'], correct: 1 },
      { q: 'What is 10 × 7?', emoji: '', image: '', answers: ['17', '700', '70', '77'], correct: 2 },
      { q: 'What is 2 × 9?', emoji: '', image: '', answers: ['11', '16', '29', '18'], correct: 3 },
      { q: 'What is 5 × 5?', emoji: '', image: '', answers: ['25', '10', '55', '20'], correct: 0 },
      { q: 'What is 10 × 10?', emoji: '', image: '', answers: ['20', '100', '1000', '110'], correct: 1 },
      { q: 'What is 2 × 6?', emoji: '', image: '', answers: ['8', '14', '12', '26'], correct: 2 },
      { q: 'What is 5 × 8?', emoji: '', image: '', answers: ['13', '35', '45', '40'], correct: 3 }
    ]
  },
  {
    id: 'sample-planets',
    type: 'quiz',
    title: 'Our Solar System',
    description: 'Blast off and test what you know about the planets and space!',
    subject: 'Science', topic: 'Space', difficulty: 'medium',
    icon: '🪐', color: '#6c4cf5',
    settings: { shuffle: true, shuffleAnswers: true },
    items: [
      { q: 'Which planet do we live on?', emoji: '🌍', image: '', answers: ['Earth', 'Mars', 'Venus', 'Jupiter'], correct: 0 },
      { q: 'Which planet is known as the Red Planet?', emoji: '🔴', image: '', answers: ['Saturn', 'Mars', 'Neptune', 'Mercury'], correct: 1 },
      { q: 'What is the biggest planet in our Solar System?', emoji: '🪐', image: '', answers: ['Earth', 'Uranus', 'Jupiter', 'Venus'], correct: 2 },
      { q: 'What is the Sun?', emoji: '☀️', image: '', answers: ['A planet', 'A moon', 'A comet', 'A star'], correct: 3 },
      { q: 'Which planet has beautiful bright rings?', emoji: '💍', image: '', answers: ['Saturn', 'Mars', 'Mercury', 'Earth'], correct: 0 },
      { q: 'Which planet is closest to the Sun?', emoji: '🔥', image: '', answers: ['Neptune', 'Mercury', 'Earth', 'Jupiter'], correct: 1 }
    ]
  },
  {
    id: 'sample-capitals',
    type: 'quiz',
    title: 'Capital Cities of Europe',
    description: 'Can you name the capital city of each country?',
    subject: 'Geography', topic: 'Countries & Capitals', difficulty: 'hard',
    icon: '🌍', color: '#3bb273',
    settings: { shuffle: true, shuffleAnswers: true },
    items: [
      { q: 'What is the capital of France?', emoji: '🇫🇷', image: '', answers: ['Paris', 'Lyon', 'Nice', 'Marseille'], correct: 0 },
      { q: 'What is the capital of Spain?', emoji: '🇪🇸', image: '', answers: ['Barcelona', 'Madrid', 'Seville', 'Valencia'], correct: 1 },
      { q: 'What is the capital of Italy?', emoji: '🇮🇹', image: '', answers: ['Milan', 'Venice', 'Rome', 'Naples'], correct: 2 },
      { q: 'What is the capital of Germany?', emoji: '🇩🇪', image: '', answers: ['Munich', 'Hamburg', 'Frankfurt', 'Berlin'], correct: 3 },
      { q: 'What is the capital of the United Kingdom?', emoji: '🇬🇧', image: '', answers: ['London', 'Manchester', 'Edinburgh', 'Cardiff'], correct: 0 },
      { q: 'What is the capital of Ireland?', emoji: '🇮🇪', image: '', answers: ['Cork', 'Dublin', 'Galway', 'Belfast'], correct: 1 },
      { q: 'What is the capital of Portugal?', emoji: '🇵🇹', image: '', answers: ['Porto', 'Faro', 'Lisbon', 'Braga'], correct: 2 }
    ]
  },
  {
    id: 'sample-animal-babies',
    type: 'match',
    title: 'Animal Babies',
    description: 'Match each animal picture with the name of its baby.',
    subject: 'Science', topic: 'Animals', difficulty: 'easy',
    icon: '🐶', color: '#ff9f1c',
    settings: { shuffle: true },
    items: [
      { left: 'Cat', emoji: '🐱', image: '', right: 'Kitten' },
      { left: 'Dog', emoji: '🐶', image: '', right: 'Puppy' },
      { left: 'Cow', emoji: '🐮', image: '', right: 'Calf' },
      { left: 'Sheep', emoji: '🐑', image: '', right: 'Lamb' },
      { left: 'Frog', emoji: '🐸', image: '', right: 'Tadpole' },
      { left: 'Chicken', emoji: '🐔', image: '', right: 'Chick' }
    ]
  },
  {
    id: 'sample-shapes',
    type: 'match',
    title: 'Shape Match',
    description: 'Match each shape with how many sides it has.',
    subject: 'Maths', topic: 'Shapes', difficulty: 'easy',
    icon: '🔺', color: '#ef476f',
    settings: { shuffle: true },
    items: [
      { left: 'Triangle', emoji: '🔺', image: '', right: '3 sides' },
      { left: 'Square', emoji: '🟥', image: '', right: '4 equal sides' },
      { left: 'Pentagon', emoji: '⬟', image: '', right: '5 sides' },
      { left: 'Hexagon', emoji: '⬢', image: '', right: '6 sides' },
      { left: 'Circle', emoji: '🔵', image: '', right: 'No straight sides' }
    ]
  },
  {
    id: 'sample-opposites',
    type: 'match',
    title: 'Opposites',
    description: 'Find the word that means the opposite.',
    subject: 'English', topic: 'Vocabulary', difficulty: 'medium',
    icon: '↔️', color: '#ff5c93',
    settings: { shuffle: true },
    items: [
      { left: 'Hot', emoji: '', image: '', right: 'Cold' },
      { left: 'Happy', emoji: '', image: '', right: 'Sad' },
      { left: 'Big', emoji: '', image: '', right: 'Small' },
      { left: 'Fast', emoji: '', image: '', right: 'Slow' },
      { left: 'Up', emoji: '', image: '', right: 'Down' },
      { left: 'Open', emoji: '', image: '', right: 'Closed' },
      { left: 'Day', emoji: '', image: '', right: 'Night' }
    ]
  },
  {
    id: 'sample-fruit-spelling',
    type: 'spell',
    title: 'Fruity Spelling',
    description: 'Look at the picture and spell the fruit.',
    subject: 'English', topic: 'Spelling – Food', difficulty: 'easy',
    icon: '🍎', color: '#3bb273',
    settings: { shuffle: true, showLength: true, allowSpeak: true },
    items: [
      { word: 'apple', clue: 'A crunchy fruit that can be red or green.', emoji: '🍎', image: '' },
      { word: 'banana', clue: 'A long yellow fruit that monkeys love.', emoji: '🍌', image: '' },
      { word: 'grapes', clue: 'Small round fruits that grow in bunches.', emoji: '🍇', image: '' },
      { word: 'lemon', clue: 'A sour yellow fruit.', emoji: '🍋', image: '' },
      { word: 'pear', clue: 'A green fruit, thin at the top and round at the bottom.', emoji: '🍐', image: '' },
      { word: 'cherry', clue: 'A small red fruit with a stone inside.', emoji: '🍒', image: '' }
    ]
  },
  {
    id: 'sample-tricky-words',
    type: 'spell',
    title: 'Tricky Words',
    description: 'Read the clue and spell the tricky word correctly.',
    subject: 'English', topic: 'Common Exception Words', difficulty: 'medium',
    icon: '✏️', color: '#9b5de5',
    settings: { shuffle: true, showLength: true, allowSpeak: true },
    items: [
      { word: 'because', clue: 'A word we use to give a reason: "I smiled ____ I was happy."', emoji: '🤔', image: '' },
      { word: 'friend', clue: 'Someone you like to play with.', emoji: '🤝', image: '' },
      { word: 'people', clue: 'More than one person.', emoji: '👨‍👩‍👧', image: '' },
      { word: 'school', clue: 'The place where you go to learn.', emoji: '🏫', image: '' },
      { word: 'beautiful', clue: 'Very pretty or lovely to look at.', emoji: '🌸', image: '' },
      { word: 'answer', clue: 'What you give when someone asks a question.', emoji: '💬', image: '' }
    ]
  },
  {
    id: 'sample-animals-spelling',
    type: 'spell',
    title: 'Animal Spelling Safari',
    description: 'Spot the animal in the picture and spell its name.',
    subject: 'Science', topic: 'Animals', difficulty: 'hard',
    icon: '🦁', color: '#f4a300',
    settings: { shuffle: true, showLength: false, allowSpeak: true },
    items: [
      { word: 'elephant', clue: 'A huge grey animal with a long trunk.', emoji: '🐘', image: '' },
      { word: 'giraffe', clue: 'The tallest animal, with a very long neck.', emoji: '🦒', image: '' },
      { word: 'crocodile', clue: 'A big reptile with lots of sharp teeth.', emoji: '🐊', image: '' },
      { word: 'penguin', clue: 'A black and white bird that swims but cannot fly.', emoji: '🐧', image: '' },
      { word: 'butterfly', clue: 'An insect with big, colourful wings.', emoji: '🦋', image: '' }
    ]
  }
];
