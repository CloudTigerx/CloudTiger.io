document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit-btn');
    const nextButton = document.getElementById('next-question-btn');
    const explanationDiv = document.getElementById('explanation');
    const explanationText = document.getElementById('explanation-text');
    const flashcardQuestion = document.getElementById('flashcard-question');
    const flashcardOptions = document.querySelector('.flashcard-options');
    const feedback = document.getElementById('feedback');
    const levelDisplay = document.getElementById('level');
    const xpDisplay = document.getElementById('current-xp');
    const xpProgress = document.getElementById('xp-progress');

    let currentQuestionIndex = parseInt(localStorage.getItem('currentQuestionIndex')) || 0;
    let currentXP = parseInt(localStorage.getItem('userXP')) || 0;
    let level = parseInt(localStorage.getItem('level')) || 1;
    let xpToLevelUp = (level * 50);
    let xpPerCorrectAnswer = 5;
    let xpPerIncorrectAnswer = 1;

    const questions = [
    {
      question: "Which computer component serves as the central hub that houses all the necessary circuitry for communication between other components and devices?",
      correctAnswer: "C",
      explanation: "The motherboard is the main circuit board that holds the CPU, memory, and connects all components for communication.",
      options: {
        A: "Expansion bus",
        B: "Hard drive",
        C: "Motherboard",
        D: "Adapter card"
      }
    },
    {
      question: "Which type of packaging is commonly used for DDR SDRAM memory modules?",
      correctAnswer: "C",
      explanation: "The 184-pin connector was introduced for DDR memory, whereas newer memory types like DDR2, DDR3, and DDR4 use different pin counts (for example, DDR3 uses 240-pins)",
      options: {
        A: "168-pin DIMM",
        B: "240-pin DIMM",
        C: "184-pin DIMM",
        D: "72-pin SIMM"
      }
    },
    {
      question: "Which type of memory chips are typically found on a PC3-16000 module?",
      correctAnswer: "C",
      explanation: "PC3-16000 refers to DDR3 memory that is rated for a bandwidth of 16000 MB/s (or 16GB/s). The correct answer, DDR3-16000, indicates the type of memory used on this module. The other options refer to different types or speeds of memory, making them incorrect for PC3-16000.",
      options: {
        A: "DDR3-2000",
        B: "DDR-2000",
        C: "DDR3-16000",
        D: "PC3-2000"
      }
    },
    {
      question: "Which motherboard design is known for its smaller size and lower power consumption?",
      correctAnswer: "D",
      explanation: "The ITX motherboard is designed to be compact and energy-efficient, making it ideal for smaller PCs or low-power systems. While ATX and Micro ATX are also used in many systems, they tend to be larger and less power-efficient compared to ITX.",
      options: {
        A: "ATX",
        B: "AT",
        C: "Micro ATX",
        D: "ITX"
      }
    },
    {
      question: "Which socket type is required for the Intel Core i7-9xx desktop series?",
      correctAnswer: "A",
      explanation: "The Intel Core i7-9xx desktop series requires the LGA 1366 socket. This socket type is specifically designed for Intel's high-performance processors in the Core i7 series.",
      options: {
        A: "LGA 1366",
        B: "LGA 1156",
        C: "LGA 1155",
        D: "LGA 775"
      }
    },
    {
      question: "Which socket technology is designed to make it easier to insert modern CPUs?",
      correctAnswer: "B",
      explanation: "ZIF (Zero Insertion Force) technology is designed to ease the process of inserting modern CPUs without applying force, ensuring the CPU is securely connected without risk of damage.",
      options: {
        A: "Socket 1366",
        B: "ZIF",
        C: "LPGA",
        D: "SPGA"
      }
    },
    {
      question: "Which of the following is not controlled by the Northbridge?",
      correctAnswer: "B",
      explanation: "The Northbridge controls communication with high-speed devices like PCIe, AGP, and cache memory. However, the SATA controller is typically handled by the Southbridge, not the Northbridge.",
      options: {
        A: "PCIe",
        B: "SATA",
        C: "AGP",
        D: "Cache memory"
      }
    },
    {
      question: "Which of the following is used to store data and programs for repeated use, does not lose data when power is removed, and allows for adding and deleting data?",
      correctAnswer: "A",
      explanation: "The hard drive is used for long-term data storage, where programs and files are stored for repeated use. It retains data even when power is turned off.",
      options: {
        A: "Hard drive",
        B: "RAM",
        C: "Internal cache memory",
        D: "ROM"
      }
    },
    {
      question: "Which socket type is required for an AMD Phenom II that uses DDR3 RAM?",
      correctAnswer: "C",
      explanation: "The AMD Phenom II processors that use DDR3 RAM require the AM3 socket. AM3 supports DDR3 memory, while AM2 and AM2+ support DDR2.",
      options: {
        A: "AM2",
        B: "AM2+",
        C: "AM3",
        D: "Socket 940"
      }
    },
    {
      question: "When you press the front power button on a computer and the system boots, then press it briefly to hibernate, press it again to resume, and hold it to shut down, what is this feature called?",
      correctAnswer: "B",
      explanation: "This is an example of Soft Power, a feature that allows the system to manage power states (booting, hibernating, resuming, and shutting down) through a software-controlled interface.",
      options: {
        A: "Programmable power",
        B: "Soft power",
        C: "Relay power",
        D: "Hot power"
      }
    },
    {
      question: "Which of the following are the numbers of pins that can be found on DIMM modules used in desktop motherboards?",
      correctAnswer: ["B"],
      explanation: "DIMM modules used in desktop motherboards can have 184 pins (for DDR SDRAM) and 240 pins (for DDR2 and DDR3 SDRAM). Other pin counts are used in different memory types or form factors.",
      options: {
        A: "180 and 200",
        B: "184 and 240",
        C: "200 and 204",
        D: "204 and 240",
        E: "232 and 184",
        F: "240 and 180"
      }

    },
    {
      question: "To avoid software-based virtualization, which two components need to support hardware-based virtualization?",
      correctAnswer: ["C"],
      explanation: "Hardware-based virtualization requires both the CPU and BIOS to support the feature. Without this support, the system would rely on software-based virtualization, which is less efficient.",
      options: {
        A: "Memory and Power Supply",
        B: "Hard drive and SSD",
        C: "CPU and BIOS",
        D: "BIOS and Flash"
      }
    },
    {
      question: "You find out that a disgruntled ex-employee’s computer has a boot password that must be entered before the operating system is loaded. There is also a password preventing your access to the BIOS utility. Which of the following motherboard components can most likely be used to return the computer to a state that will allow you to boot the system without knowing the password?",
      correctAnswer: "D",
      explanation: "The jumper can be used to clear the CMOS, which will reset the BIOS settings and remove any passwords that are preventing you from accessing the system or BIOS.",
      options: {
        A: "Cable header",
        B: "Power supply connector",
        C: "Expansion slot",
        D: "Jumper"
      }
    },
    {
      question: "Your Core i5 fan has a four-pin connector, but your motherboard only has a single three-pin header with the CPU_FAN label. Which of the following will be the easiest solution to get the necessary cooling for your CPU?",
      correctAnswer: "A",
      explanation: "The four-pin connector can be plugged into the three-pin header, as the extra fourth pin is for PWM (Pulse Width Modulation), which controls fan speed, but the fan will still function with the three-pin header, just without PWM control.",
      options: {
        A: "Plug the four-pin connector into the three-pin header.",
        B: "Buy an adapter.",
        C: "Leave the plug disconnected and just use the heat sink.",
        D: "Add an extra chassis fan."
      }
    },
    {
      question: "What is the combined total speed of a PCIe 2.0 x16 slot?",
      correctAnswer: "D",
      explanation: "A PCIe 2.0 x16 slot provides a maximum theoretical speed of 16 GBps (gigabytes per second), as each lane can transfer data at up to 500 MBps, and a x16 slot has 16 lanes.",
      options: {
        A: "500MBps",
        B: "16Gbps",
        C: "8GBps",
        D: "16GBps"
      }
    },
    {
      question: "Which of the following allows you to perform the most complete restart of the computer without removing power?",
      correctAnswer: "C",
      explanation: "The reset button allows for a complete restart of the system, bypassing the need to power off and back on. It performs a hard reset of the system.",
      options: {
        A: "Start ➢ Restart",
        B: "Start ➢ Hibernate",
        C: "Reset button",
        D: "Power button"
      }
    },
    {
      question: "Which of the following is most helpful when flashing the BIOS on a desktop computer system?",
      correctAnswer: "B",
      explanation: "An uninterruptible power supply (UPS) ensures that the system has constant power during the BIOS update process, preventing potential power failure that could corrupt the BIOS.",
      options: {
        A: "Floppy diskette drive",
        B: "Uninterruptible power supply",
        C: "An Internet connection",
        D: "The Windows administrator password"
      }
    },
    {
      question: "Intel and AMD have integrated which of the following into their Atom and APU processor lines that had not been integrated before?",
      correctAnswer: "A",
      explanation: "Intel and AMD have integrated GPUs (Graphics Processing Units) into their Atom and APU processors, allowing for better graphics performance without a dedicated graphics card.",
      options: {
        A: "A GPU",
        B: "A math coprocessor",
        C: "The frontside bus",
        D: "The memory controller"
      }
    },
    {
      question: "You have just purchased a motherboard that has an LGA775 socket for an Intel Pentium 4 processor. What type of memory modules will you most likely need for this motherboard?",
      correctAnswer: "D",
      explanation: "LGA775 sockets are typically used with DDR2 or DDR3 memory, which requires DIMM (Dual Inline Memory Module) modules. DIMMs are the standard form factor for modern desktop memory.",
      options: {
        A: "DIP",
        B: "SIMM",
        C: "RIMM",
        D: "DIMM"
      }
    },
    {
      question: "What type of expansion slot is preferred today for high-performance graphics adapters?",
      correctAnswer: "B",
      explanation: "PCIe (PCI Express) is the most common and preferred expansion slot for high-performance graphics cards. It offers much higher data transfer speeds compared to older technologies like AGP or PCI.",
      options: {
        A: "AGP",
        B: "PCIe",
        C: "PCI",
        D: "ISA"
      }
    }
  ];

    function shuffleQuestions() {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }

    // Shuffle questions before displaying
    shuffleQuestions();
    currentQuestionIndex = 0; 
    localStorage.setItem('currentQuestionIndex', currentQuestionIndex);

    function updateXP() {
      const xpPercentage = (currentXP / xpToLevelUp) * 100;
      xpProgress.style.width = `${xpPercentage}%`;
      xpDisplay.textContent = `${currentXP} / ${xpToLevelUp}`;
      localStorage.setItem('userXP', currentXP);
    }

    function updateLevel() {
      level = Math.floor(currentXP / 50) + 1;
      xpToLevelUp = level * 50;
      levelDisplay.textContent = `Level: ${level}`;
      xpDisplay.textContent = `${currentXP} / ${xpToLevelUp}`;
      localStorage.setItem('level', level);
      localStorage.setItem('userXP', currentXP);
    }

    function displayQuestion() {
      const question = questions[currentQuestionIndex];
      flashcardQuestion.textContent = question.question;
      flashcardOptions.innerHTML = "";
      
      Object.entries(question.options).forEach(([key, value]) => {
        const optionLabel = document.createElement('label');
        const optionInput = document.createElement('input');
        optionInput.type = "radio";
        optionInput.name = "answer";
        optionInput.value = key;

        optionLabel.appendChild(optionInput);
        optionLabel.appendChild(document.createTextNode(`${key}. ${value}`));
        flashcardOptions.appendChild(optionLabel);
        flashcardOptions.appendChild(document.createElement('br'));
      });

      feedback.textContent = "";
      explanationDiv.style.display = 'none';
      nextButton.style.display = 'none';
      submitButton.disabled = false;
    }

    updateXP();
    updateLevel();
    displayQuestion();

    submitButton.addEventListener('click', function() {
      const selectedOption = document.querySelector('input[name="answer"]:checked');
      if (!selectedOption) {
        feedback.textContent = "Please select an answer.";
        feedback.style.color = 'red';
        return;
      }

      const selectedAnswer = selectedOption.value;
      const currentQuestion = questions[currentQuestionIndex];

      explanationText.textContent = currentQuestion.explanation;
      explanationDiv.style.display = 'block';
      nextButton.style.display = 'inline-block';
      submitButton.disabled = true;

      if (selectedAnswer === currentQuestion.correctAnswer) {
        feedback.textContent = "Correct!";
        feedback.style.color = 'green';
        currentXP += xpPerCorrectAnswer;
      } else {
        feedback.textContent = "Incorrect!";
        feedback.style.color = 'red';
        currentXP += xpPerIncorrectAnswer;
      }

      updateXP();
      updateLevel();
    });

    nextButton.addEventListener('click', function() {
      currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
      localStorage.setItem('currentQuestionIndex', currentQuestionIndex);
      displayQuestion();
    });

    // Drag and Drop (if used, ensure these elements exist)
    const dragItem = document.querySelector(".draggable");
    const dropBox = document.querySelector(".dropbox");

    if (dragItem && dropBox) {
      dragItem.addEventListener("dragstart", (event) => {
          event.dataTransfer.setData("text", event.target.id);
      });

      dropBox.addEventListener("dragover", (event) => {
          event.preventDefault();
      });

      dropBox.addEventListener("drop", (event) => {
          event.preventDefault();
          const draggedItemId = event.dataTransfer.getData("text");
          const draggedItem = document.getElementById(draggedItemId);
          dropBox.appendChild(draggedItem);
      });
    }
});
