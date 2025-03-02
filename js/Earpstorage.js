/* jshint esversion: 6 */
const questions = [
  {
    question: "What is the physical component where data is stored in a HDD?",
    options: ["A. Read/write head", "B. Platter", "C. Sector", "D. Cluster"],
    correctAnswer: "B. Platter",
  },
  {
	question: "Which of the following is not one of the three major components of a hard disk drive system?",
	options: ["A. Drive interface", "B. Controller", "C. Hard disk", "D.Host adapter"],
	correctAnswer: "A. Drive interface",
  },
  {
    question: "What is the largest NTFS volume size supported, assuming a 64KB cluster size as maximum?",
    options: ["A. 256GB", "B. 2TB", "C. 128TB", "D. 256TB"],
    correctAnswer: "C. 128TB",
  },
  {
    question: "Which technology is based on flash memory and is intended eventually to replace conventional hard disk drives that have moving discs and other mechanisms?",
    options: ["A. USB flash drives", "B. Memory cards", "C. Solid-state drives", "D. Optical drives"],
    correctAnswer: "C. Solid-state drives",
  },
  {
    question: "A client is looking for a desktop drive technology that saves money over SSDs but offers performance increases over HDDs and can be used to house the operating system. Which of the following is the best to recommend?",
    options: ["A. Dual-drive technology", "B. SSHD", "C. eMMC", "D. Magnetic-only drive"],
    correctAnswer: "B. SSHD",
  },
  {
    question: "Which optical disc format supports a data capacity of 25GB?",
    options: ["A. Double-sided, double-layer DVD+R", "B. Single-sided, single-layer Blu-ray disc", "C. Double-sided, single-layer DVD-R", "D. Double-sided, single-layer DVD+R"],
    correctAnswer: "B. Single-sided, single-layer Blu-ray disc",
  },
  {
    question: "Which of the following best describes the concept of hot-swappable devices?",
    options: ["A. Power does not need to be turned off before the device is inserted or removed.", "B. The device can be removed with power applied after it is properly stopped in the operating system.", "C. Care must be taken when swapping the device because it can be hot to the touch.", "D. The device can be swapped while still hot, immediately after powering down the system."],
    correctAnswer: "A. Power does not need to be turned off before the device is inserted or removed.",
  },
  {
    question: "Of the following voltage pairings, which one accurately represents the input and output, respectively, of power supplies and AC adapters?",
    options: ["A. AC in, AC out", "B. DC in, DC out", "C. AC in, DC out", "D. DC in, AC out"],
    correctAnswer: "C. AC in, DC out",
  },
  {
    question: "What are the output voltages that have been commonly produced by PC power supplies over the years? (Choose five.)",
    options: ["A. +3.3VDC", "B. –3.3VDC", "C. +5VDC", "D. –5VDC", "E. +12VDC", "F. –12VDC", "G. +110VAC", "H. –110VAC"],
    correctAnswer: "A. +3.3VDC, C. +5VDC, E. +12VDC, F. –12VDC, D. –5VDC",
  },
  {
    question: "Which of the following statements about power supplies is true?",
    options: ["A. You must make sure that the voltage selector switch on the back of the power supply is switched to the lower setting if the computer is going to be used in Europe.", "B. SATA hard drives most often use the same type of power connector that PATA hard drives use.", "C. Power supplies supply power to ATX-based motherboards with connectors known commonly as P8 and P9.", "D. Power supplies convert AC input to DC output."],
    correctAnswer: "D. Power supplies convert AC input to DC output.",
  },
  {
    question: "Which of the following is not a consideration when installing an internal storage device?",
    options: ["A. You should match the form factor of the drive or adapt it to an available drive bay or slot.", "B. You should secure the drive with at least two screws on one side and preferably two on each side.", "C. Due to the high revolutions at which modern hard drives spin, you must secure an external power source because the internal power supplies do not have the capacity.", "D. You need to be sure that the routing of the drive’s ribbon cable, if applicable, does not obstruct the engineered flow of air across internal components."],
    correctAnswer: "C. Due to the high revolutions at which modern hard drives spin, you must secure an external power source because the internal power supplies do not have the capacity.",
  },
  {
    question: "What kind of media is most commonly used when large amounts of data need to be archived on a regular basis?",
    options: ["A. Tape", "B. Optical disc", "C. External hard drive", "D. Network share"],
    correctAnswer: "A. Tape",
  },
  {
    question: "What does the e stand for in eMMC?",
    options: ["A. Embedded", "B. Enhanced", "C. Extended", "D. External"],
    correctAnswer: "A. Embedded",
  },
  {
    question: "Which of the following platter spin rates is not commonly associated with conventional magnetic hard disk drives?",
    options: ["A. 5400 rpm", "B. 7200 rpm", "C. 10,000 rpm", "D. 12,000 rpm"],
    correctAnswer: "D. 12,000 rpm",
  },
  {
    question: "Which of the following is not a consideration when upgrading power supplies?",
    options: ["A. You might find that you do not have a matching motherboard connector on your new power supply.", "B. You might find that your case has a nonremovable power supply.", "C. You might find that your power rating is not adequate on the new power supply.", "D. You might find that you do not have enough of the appropriate connectors coming from the power supply for the devices that you have installed."],
    correctAnswer: "B. You might find that your case has a nonremovable power supply.",
  },
  {
    question: "What does the red stripe on a ribbon cable indicate?",
    options: ["A. Pin 16", "B. Pin 1", "C. The manufacturer’s trademark", "D. Parity"],
    correctAnswer: "B. Pin 1",
  },
  {
    question: "Which of the following statements about dual-rail power supplies is LEAST true?",
    options: ["A. Dual-rail power supplies have electrically separate 12VDC connections.", "B. Dual-rail power supplies typically support more cumulative amperage than single-rail supplies.", "C. Dual-rail power supplies are less likely to be overdrawn by connected components.", "D. Dual-rail power supplies feature most of the same connections as a single-rail supply."],
    correctAnswer: "B. Dual-rail power supplies typically support more cumulative amperage than single-rail supplies.",
  },
  {
    question: "Which of the following best describes a hybrid drive?",
    options: ["A. A drive that has a SATA interface as well as one other", "B. A drive that has both HDD and SSD components", "C. A drive that can be used with Windows or Mac OS", "D. A drive that is partially internal and partially external"],
    correctAnswer: "B. A drive that has both HDD and SSD components",
  },
  {
    question: "Which of the following is a concept that applies only to conventional magnetic hard disk drives and not newer solid-state drives?",
    options: ["A. Storage capacity", "B. External attachment", "C. Access time", "D. 7200 rpm"],
    correctAnswer: "D. 7200 rpm",
  },
  {
    question: "When replacing a power supply, which of the following tends to vary among power supplies and must be chosen properly to support all connected devices?",
    options: ["A. Wattage", "B. Voltage", "C. Amperage", "D. Resistance"],
    correctAnswer: "A. Wattage",
  },
];

let currentQuestion = null;

// Function to get a random question
function getRandomQuestion() {
  const randomIndex = Math.floor(Math.random() * questions.length); // Random index
  currentQuestion = questions[randomIndex];

  // Display question and options
  displayQuestion(currentQuestion);
}

// Function to display the question and options
function displayQuestion(question) {
  const questionText = document.getElementById('questionText');
  const answerChoices = document.getElementById('answerChoices');
  const feedback = document.getElementById('feedback');

  // Clear previous feedback
  feedback.textContent = '';

  // Set the question
  questionText.textContent = question.question;

  // Clear previous answer choices
  answerChoices.innerHTML = '';

  // Create and display answer choices as draggable elements
  question.options.forEach(option => {
    const optionElement = document.createElement('div');
    optionElement.textContent = option;
    optionElement.classList.add('draggable');
    optionElement.setAttribute('draggable', 'true');
    optionElement.setAttribute('id', `choice-${option}`);
    answerChoices.appendChild(optionElement);
  });

  // Add drag event listeners for the newly created draggable elements
  addDragEventListeners();
}

// Add event listeners to draggable elements
function addDragEventListeners() {
  const draggables = document.querySelectorAll('.draggable');
  
  draggables.forEach(draggable => {
    draggable.addEventListener('dragstart', (e) => {
      // Store the id of the dragged element
      e.dataTransfer.setData('text', e.target.id);
    });
  });
}

// Handling the drag and drop functionality
const dropbox = document.getElementById('dropbox');

// Prevent the default handling of the event (allow drop)
dropbox.addEventListener('dragover', (e) => {
  e.preventDefault();
});

// Handle the drop event
dropbox.addEventListener('drop', (e) => {
  e.preventDefault();
  const draggedId = e.dataTransfer.getData('text');
  const draggedElement = document.getElementById(draggedId);

  // Append the dragged element to the dropbox
  dropbox.appendChild(draggedElement);

  // Check if the dragged answer is correct or incorrect
  const feedback = document.getElementById('feedback');
  if (draggedElement.textContent === currentQuestion.correctAnswer) {
    dropbox.innerHTML = `<p>Correct! You chose: ${draggedElement.textContent}</p>`;
    dropbox.style.backgroundColor = "green";  // Change background color to green for correct
    feedback.textContent = "Correct!";
    feedback.style.color = "green";  // Green text for correct answer
  } else {
    dropbox.innerHTML = `<p>Incorrect choice. Try again!</p>`;
    dropbox.style.backgroundColor = "red";  // Change background color to red for incorrect
    feedback.textContent = `Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`;
    feedback.style.color = "red";  // Red text for incorrect answer
  }

  // Optionally, wait a few seconds before loading a new question
  setTimeout(getRandomQuestion, 1500);
});

window.onload = function() {
  getRandomQuestion(); // Load the first random question when the page loads
};
