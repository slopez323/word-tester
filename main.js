const played = {
  TOTAL_STARS: "lifetime stars",
  TOTAL_GAMES: "lifetime games",
  LAST_PLAYED: "last play date",
  GAME_CLUES: "current day clues",
  GAME_RESULT: "current day result",
  GAME_STARS: "score today",
  GAME_LETTERS: "current day revealed indices",
  GAME_GUESS: "current day user guess",
};

const analytics = {
  START_NEW: "start_new_game",
  ADD_LETTER: "added_letter",
  SUBMIT_CLICK: "clicked_submit",
  MAX_LETTERS: "maxed_out_letters",
  MAX_STARS: "maxed_out_stars",
  MAX_CLUES: "maxed_out_clues",
  ADD_CLUE: "added_clue",
  CANCEL_SUBMIT: "cancelled_submit",
  WIN_GAME: "won_info",
  LOSE_GAME: "lost_info",
  INFO_CLICK: "clicked_info_icon",
  STAT_CLICK: "clicked_stat_icon",
  MENU_CLICK: "clicked_menu_icon",
  SHARE_GAME_CLICK: "share_end_game",
  SHARE_STAT_CLICK: "share_stats",
};

const screenshotContainer = document.querySelector("#screenshotContainer");
const clues = document.getElementsByClassName("clues");
const wordInput = document.getElementById("inputSpan");

const dateToday = new Date();
const firstDay = new Date("03/07/2022");
const wordToday = Math.floor(daysBetween(firstDay, dateToday));

function treatAsUTC(date) {
  var result = new Date(date);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result;
}

function daysBetween(startDate, endDate) {
  var millisecondsPerDay = 24 * 60 * 60 * 1000;
  return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}

let correctWord;
let dailyWords;
let clueList;

let cluesShown;
let totalGames;
let totalStars;
let revealed;
let lettersShown;
let guessArr;

let remainingStars;

window.addEventListener("keyup", nextInputBox);
$(document).click(function (e) {
  if (
    e.target.id === "menu" ||
    e.target.id === "help" ||
    e.target.id === "submit" ||
    e.target.id === "next" ||
    e.target.id === "letter" ||
    e.target.id === "statBtn" ||
    e.target.id === "yes" ||
    e.target.id === "no"
  )
    return false;
  if ($(e.target).closest(".instructions").length != 0) return false;
  if ($(e.target).closest(".standard-popup").length != 0) return false;
  $(".popup").hide();
  $(".nav-list").removeClass("visible");
});
document.addEventListener("touchstart", function () {}, false);

$(".exitBtn").click(function () {
  $(".popup").hide();
});
$("#menu").click(function () {
  $(".nav-list").toggleClass("visible");
  sendEvent(analytics.MENU_CLICK);
});
$("#help").click(function () {
  $(".popup-instructions").show();
  sendEvent(analytics.INFO_CLICK);
});
$("#statBtn").click(showStatPopup);
$("#yes").click(checkGuess);
$("#no").click(function () {
  $(".popup").hide();
  sendEvent(analytics.CANCEL_SUBMIT);
});
$("#next").click(showNextClue);
$("#submit").click(confirmSubmission);
$("#letter").click(addLetter);

$(document).ready(function () {
  getWord(function (p) {
    dailyWords = p;
    correctWord = dailyWords[wordToday % dailyWords.length].word;
    clueList = dailyWords[wordToday % dailyWords.length].clueList;
    startup();
  });
});

function getWord(cb) {
  $.getJSON("./s2rl3s.json", function (data) {
    cb(data.dailyWords);
  }).fail(function () {
    console.log("An error has occurred.");
  });
}

function startup() {
  setUpWordOfDay();
  getTodaysState();
  updateRunningStars();
  if (revealed.length === 0) showSomeLetters();
  if (localStorage.getItem(played.GAME_RESULT) == "won") {
    for (let i = 0; i < correctWord.length; i++) {
      $(`.inputs:nth-child(${i + 1})`).val(
        `${correctWord.substring(i, i + 1)}`
      );
      $(`.inputs:nth-child(${i + 1})`).attr("disabled", "disabled");
    }
    revealRemainingClues();
    $("#next").off();
    $("#submit").off();
    $("#letter").off();
    displayWin(localStorage.getItem(played.GAME_STARS));
  } else if (localStorage.getItem(played.GAME_RESULT) == "lost") {
    for (let i = 0; i < correctWord.length; i++) {
      $(`.inputs:nth-child(${i + 1})`).val(
        `${guessArr[guessArr.length - 1].substring(i, i + 1)}`
      );
      // $(`.inputs:nth-child(${i + 1})`).val(`${localStorage.getItem(played.GAME_GUESS).substring(i, i + 1)}`);
      $(`.inputs:nth-child(${i + 1})`).attr("disabled", "disabled");
    }
    revealRemainingClues();
    $("#next").off();
    $("#submit").off();
    $("#letter").off();
    displayLost();
  } else {
    $(".popup-instructions").show();
    for (let i = 0; i < correctWord.length; i++) {
      if (revealed.includes(i)) {
        $(`.inputs:nth-child(${i + 1})`).val(
          `${correctWord.substring(i, i + 1)}`
        );
        $(`.inputs:nth-child(${i + 1})`).attr("disabled", "disabled");
      }
    }
  }
  for (let i = 0; i < cluesShown; i++) {
    clues[i].textContent = clueList[i].toUpperCase();
  }
}

function setUpWordOfDay() {
  for (let i = 0; i < correctWord.length; i++) {
    $(wordInput).append(
      `<input type="text" maxlength="1" class="inputs"></input>`
    );
  }
}

function getTodaysDt() {
  const dt = new Date();
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}

function getTodaysState() {
  const lastPlayed = localStorage.getItem(played.LAST_PLAYED);
  const todaysDt = getTodaysDt();
  if (lastPlayed != todaysDt) {
    localStorage.setItem(played.LAST_PLAYED, todaysDt);
    localStorage.removeItem(played.GAME_CLUES);
    localStorage.removeItem(played.GAME_RESULT);
    localStorage.removeItem(played.GAME_STARS);
    localStorage.removeItem(played.GAME_LETTERS);
    localStorage.removeItem(played.GAME_GUESS);
    sendEvent(analytics.START_NEW, {
      day: new Date().getDay(),
      hour: new Date().getHours(),
    });
  }

  cluesShown = +localStorage.getItem(played.GAME_CLUES) || 1;
  totalGames = +localStorage.getItem(played.TOTAL_GAMES) || 0;
  totalStars = +localStorage.getItem(played.TOTAL_STARS) || 0;
  guessArr = localStorage.getItem(played.GAME_GUESS) || [];
  if (guessArr.length > 1) guessArr = guessArr.split(",");

  revealed = localStorage.getItem(played.GAME_LETTERS) || [];
  if (revealed.length > 0) {
    revealed = revealed.split(",");
    revealed = revealed.map((x) => +x);
  }
  lettersShown = revealed.length;

  if (localStorage.getItem(played.GAME_RESULT) == "lost") {
    remainingStars = 0;
  } else if (lettersShown > 0) {
    remainingStars =
      5 -
      (cluesShown - 1) * 0.5 -
      (lettersShown - Math.floor(correctWord.length * 0.2)) -
      guessArr.length * 2;
  } else {
    remainingStars = 5;
  }
}

function updateRunningStars() {
  $(".counter").empty();
  let num;
  if (remainingStars === 0) num = 0;
  for (num = 2; num <= remainingStars + 1; num++) {
    $(`.counter:nth-child(${num})`).append(
      `<i class="fa fa-solid fa-circle"></i>`
    );
  }
  if (remainingStars % 1 !== 0) {
    $(`.counter:nth-child(${num})`).append(
      '<i class="fa fa-solid fa-circle-half-stroke"></i>'
    );
    num++;
  }
  if (num <= 6) {
    for (let i = num; i <= 6; i++) {
      $(`.counter:nth-child(${i})`).append(
        '<i class="fa fa-regular fa-circle"></i>'
      );
    }
  }
}

function showSomeLetters() {
  let letterClues = Math.floor(correctWord.length * 0.2);
  let random = new Date().getDay();
  for (let i = 0; i < letterClues; i++) {
    if (i * 7 + random > correctWord.length - 1) {
      revealed.push(i * 7 + random - correctWord.length);
    } else {
      revealed.push(i * 7 + random);
    }
  }
  for (let i = 0; i < letterClues; i++) {
    $(`.inputs:nth-child(${revealed[i] + 1})`).val(
      `${correctWord.substring(revealed[i], revealed[i] + 1)}`
    );
    $(`.inputs:nth-child(${revealed[i] + 1})`).attr("disabled", "disabled");
  }
  lettersShown += letterClues;
  localStorage.setItem(played.GAME_LETTERS, revealed);
}

function showNextClue() {
  if (remainingStars <= 0.5) {
    $(".popup-error p").text(
      `You don't have enough stars to reveal another clue.`
    );
    $(".popup-error").show();
    sendEvent(analytics.MAX_STARS);
    return;
  } else if (cluesShown < 5) {
    clues[cluesShown].textContent = clueList[cluesShown].toUpperCase();
    cluesShown++;
    localStorage.setItem(played.GAME_CLUES, cluesShown);
    remainingStars -= 0.5;
    updateRunningStars();
    sendEvent(analytics.ADD_CLUE);
  } else if (cluesShown === 5) {
    $(".popup-error p").text(`You've already revealed all 5 clues.`);
    $(".popup-error").show();
    sendEvent(analytics.MAX_CLUES);
  }
}

function addLetter() {
  let added = lettersShown - Math.floor(correctWord.length * 0.2);
  if (lettersShown < Math.ceil(correctWord.length / 2)) {
    if (remainingStars <= 1) {
      $(".popup-error p").text(
        `You don't have enough stars to reveal another letter.`
      );
      $(".popup-error").show();
      sendEvent(analytics.MAX_STARS);
      return;
    } else {
      let random = [3, 1, 4, 2];
      let available = [];
      let newReveal;
      for (let i = 0; i < correctWord.length; i++) {
        available.push(i);
      }
      available = available.filter((x) => !revealed.includes(x));
      if (random[added] >= available.length) {
        newReveal = Math.floor(random[added] % available.length);
      } else {
        newReveal = random[added];
      }
      revealed.push(available[newReveal]);
      $(`.inputs:nth-child(${revealed[revealed.length - 1] + 1})`).val(
        `${correctWord.substring(
          revealed[revealed.length - 1],
          revealed[revealed.length - 1] + 1
        )}`
      );
      $(`.inputs:nth-child(${revealed[revealed.length - 1] + 1})`).attr(
        "disabled",
        "disabled"
      );

      lettersShown++;
      localStorage.setItem(played.GAME_LETTERS, revealed);
      remainingStars--;
      updateRunningStars();
    }
    sendEvent(analytics.ADD_LETTER);
  } else {
    $(".popup-error p").text(`You've already revealed half the word length.`);
    $(".popup-error").show();
    sendEvent(analytics.MAX_LETTERS);
    return;
  }
}

function nextInputBox(e) {
  let available = [];
  let index = $(".inputs").index(e.target);
  for (let i = 0; i < correctWord.length; i++) {
    available.push(i);
  }
  available = available.filter((x) => !revealed.includes(x));
  if (e.keyCode == 8 && available.indexOf(index) > 0) {
    $(`.inputs:nth-child(${available[available.indexOf(index) - 1] + 1})`).val(
      ""
    );
    $(
      `.inputs:nth-child(${available[available.indexOf(index) - 1] + 1})`
    ).focus();
  } else if (e.keyCode !== 8) {
    if (available.indexOf(index) < available.length - 1) {
      $(
        `.inputs:nth-child(${available[available.indexOf(index) + 1] + 1})`
      ).focus();
    }
  }
}

function confirmSubmission() {
  sendEvent(analytics.SUBMIT_CLICK);
  let guess = "";
  for (let i = 0; i < correctWord.length; i++) {
    guess += $(`.inputs:nth-child(${i + 1})`).val();
  }
  if (guess.length < correctWord.length) {
    $(".popup-error p").text("You missed some blanks.  Try again!");
    $(".popup-error").show();
    return;
  } else {
    if (remainingStars > 2) {
      $(".popup-confirm p").text(
        "A wrong guess is worth 2 stars so guess wisely!"
      );
      $(".popup-confirm").show();
      return;
    } else {
      $(".popup-confirm p").text(
        "You only have enough stars for 1 final guess."
      );
      $(".popup-confirm").show();
      return;
    }
  }
}

function checkGuess() {
  $(".popup-confirm").hide();
  let guess = "";
  for (let i = 0; i < correctWord.length; i++) {
    guess += $(`.inputs:nth-child(${i + 1})`).val();
  }

  if (guess.toUpperCase() === correctWord.toUpperCase()) {
    totalGames++;
    totalStars += remainingStars;

    revealRemainingClues();

    $("#next").off();
    $("#submit").off();
    $("#letter").off();

    $(`.inputs`).attr("disabled", "disabled");

    localStorage.setItem(played.TOTAL_GAMES, totalGames);
    localStorage.setItem(played.TOTAL_STARS, totalStars);
    localStorage.setItem(played.GAME_RESULT, "won");
    localStorage.setItem(played.GAME_STARS, remainingStars);
    sendEvent(analytics.WIN_GAME, {
      stars: localStorage.getItem(played.GAME_STARS),
      user_guess: guessArr,
      word: correctWord,
      number: wordToday,
      total_games: localStorage.getItem(played.TOTAL_GAMES),
    });
    displayWin(remainingStars);
  } else {
    guessArr.push(guess);
    localStorage.setItem(played.GAME_GUESS, guessArr);

    if (remainingStars > 2) {
      $(".popup-error p").text(`That's not it.  Try again!`);
      $(".popup-error").show();
      for (let i = 0; i < correctWord.length; i++) {
        if (!revealed.includes(i)) {
          $(`.inputs:nth-child(${i + 1})`).val("");
        }
      }
      remainingStars -= 2;
      updateRunningStars();
    } else {
      totalGames++;
      remainingStars = 0;
      updateRunningStars();
      totalStars += remainingStars;

      revealRemainingClues();

      $("#next").off();
      $("#submit").off();
      $("#letter").off();
      $(`.inputs`).attr("disabled", "disabled");

      localStorage.setItem(played.TOTAL_GAMES, totalGames);
      localStorage.setItem(played.TOTAL_STARS, totalStars);
      localStorage.setItem(played.GAME_RESULT, "lost");
      sendEvent(analytics.LOSE_GAME, {
        user_guess: guessArr,
        word: correctWord,
        number: wordToday,
        total_games: localStorage.getItem(played.TOTAL_GAMES),
      });

      displayLost();
    }
  }
}

function revealRemainingClues() {
  if (cluesShown < 5) {
    for (let i = cluesShown; i < 5; i++) {
      clues[i].textContent = clueList[i].toUpperCase();
      clues[i].style.color = "#F0F0F0";
    }
  }
}

function displayLost() {
  $(".popup-result h1").text("Awww sorry");
  $("#showWord").text(correctWord.toUpperCase());
  $(".stars").remove();
  $(".popup-result").show();

  showStats();
  countdown();
}

function displayWin(remainingStars) {
  $(".popup-result h1").text(`Yasss!`);
  $("#lostText").remove();
  $("#showWord").remove();
  for (let i = 1; i <= remainingStars; i++) {
    $(".stars").append(
      '<i class="fa fa-solid fa-star" style ="font-size:50px"></i>'
    );
  }
  for (let i = 0; i < Math.ceil(remainingStars % 1); i++) {
    $(".stars").append(
      '<i class="fa fa-solid fa-star-half" style ="font-size:50px"></i>'
    );
  }
  $(".popup-result").show();

  showStats();
  countdown();
}

function countdown() {
  setInterval(function () {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    let total;
    if (getTodaysDt() !== localStorage.getItem(played.LAST_PLAYED)) {
      total = 0;
    } else {
      total = Date.parse(tomorrow) - Date.parse(today);
    }

    const seconds = ("0" + Math.floor((total / 1000) % 60)).slice(-2);
    const minutes = ("0" + Math.floor((total / 1000 / 60) % 60)).slice(-2);
    const hours = ("0" + Math.floor((total / (1000 * 60 * 60)) % 24)).slice(-2);

    $("#hours").text(hours);
    $("#minutes").text(minutes);
    $("#seconds").text(seconds);

    if ((total = 0)) {
      clearInterval(countdown);
      // location.reload();
    }
  });
}

function showStats() {
  let statGames = localStorage.getItem(played.TOTAL_GAMES);
  let statStars = localStorage.getItem(played.TOTAL_STARS);
  let statAve = (
    localStorage.getItem(played.TOTAL_STARS) /
    localStorage.getItem(played.TOTAL_GAMES)
  ).toFixed(1);
  if (!statGames) statGames = 0;
  if (!statStars) statStars = 0;
  if (isNaN(statAve)) statAve = 0;
  $(".game-box span").text(statGames);
  $(".stars-box span").text(statStars);
  $(".ave-box span").text(statAve);
}

function showStatPopup() {
  sendEvent(analytics.STAT_CLICK);
  showStats();
  $(".popup-stats").show();
}

setInterval(function () {
  if (localStorage.getItem(played.LAST_PLAYED) !== getTodaysDt()) {
    window.location.reload(true);
  }
}, 2000);

if (navigator.share) {
  $(".shareresult").append(
    `<button class="share" id="share-result">Share <i class="fa fa-solid fa-share-from-square"></i></button>`
  );
} else $(".sharediv").remove();

async function share() {
  if (!("share" in navigator)) {
    return;
  }
  const canvas = await html2canvas(screenshotContainer);

  canvas.toBlob(async function (blob) {
    const files = [new File([blob], "image.png", { type: blob.type })];
    const shareData = {
      // title: 'Word! | Daily Brain Play',
      files,
    };
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err.name, err.message);
        }
      }
    } else {
      console.warn("Sharing not supported", shareData);
    }
  });
}

$(".shareresult").on("click", "#share-result", function () {
  sendEvent(analytics.SHARE_GAME_CLICK);
  if (localStorage.getItem(played.GAME_RESULT) == "won") {
    $("#shareText").text(`Woot! 🙌🏼 Guessed the Word! today and got`);
  } else if (localStorage.getItem(played.GAME_RESULT) == "lost") {
    $("#shareText").text(`Couldn't guess the Word! today 😖`);
    $(".stars").hide();
  }
  showStats();
  $(".popup-share").show();
  share();
  $(".popup-share").hide();
  $(".popup-result").show();
});

function sendEvent(action, values) {
  if (window.gtag) {
    gtag("event", action, { data: JSON.stringify(values) });
  }
}

document.addEventListener("contextmenu", (event) => event.preventDefault());

document.onkeydown = function (e) {
  if (event.keyCode == 123) {
    return false;
  }
  if (
    e.metaKey &&
    e.shiftKey &&
    (e.keyCode == "I".charCodeAt(0) || e.keyCode == "i".charCodeAt(0))
  ) {
    return false;
  }
  if (
    e.metaKey &&
    e.shiftKey &&
    (e.keyCode == "C".charCodeAt(0) || e.keyCode == "c".charCodeAt(0))
  ) {
    return false;
  }
  if (
    e.metaKey &&
    e.shiftKey &&
    (e.keyCode == "J".charCodeAt(0) || e.keyCode == "j".charCodeAt(0))
  ) {
    return false;
  }
  if (
    e.metaKey &&
    (e.keyCode == "U".charCodeAt(0) || e.keyCode == "u".charCodeAt(0))
  ) {
    return false;
  }
  if (
    e.metaKey &&
    (e.keyCode == "S".charCodeAt(0) || e.keyCode == "s".charCodeAt(0))
  ) {
    return false;
  }
  if (
    e.ctrlKey &&
    e.shiftKey &&
    (e.keyCode == "I".charCodeAt(0) || e.keyCode == "i".charCodeAt(0))
  ) {
    return false;
  }
  if (
    e.ctrlKey &&
    e.shiftKey &&
    (e.keyCode == "C".charCodeAt(0) || e.keyCode == "c".charCodeAt(0))
  ) {
    return false;
  }
  if (
    e.ctrlKey &&
    e.shiftKey &&
    (e.keyCode == "J".charCodeAt(0) || e.keyCode == "j".charCodeAt(0))
  ) {
    return false;
  }
  if (
    e.ctrlKey &&
    (e.keyCode == "U".charCodeAt(0) || e.keyCode == "u".charCodeAt(0))
  ) {
    return false;
  }
  if (
    e.ctrlKey &&
    (e.keyCode == "S".charCodeAt(0) || e.keyCode == "s".charCodeAt(0))
  ) {
    return false;
  }
};
