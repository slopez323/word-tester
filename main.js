// local storage
const played = {
    TOTAL_STARS: 'lifetime stars',
    TOTAL_GAMES: 'lifetime games',
    LAST_PLAYED: 'last play date',
    GAME_CLUES: 'current day clues',
    GAME_RESULT: 'current day result',
    GAME_STARS: 'score today',
    GAME_LETTERS: 'current day revealed indices'
}

// variables
const clues = document.getElementsByClassName('clues');
const wordInput = document.getElementById('inputSpan');

const dateToday = new Date();
const firstDay = new Date('03/07/2022');
const wordToday = Math.floor((dateToday.getTime() - firstDay.getTime()) / (1000 * 3600 * 24));

let correctWord;
let dailyWords;
let clueList;

let cluesShown;
let stars;
let totalGames;
let totalStars;
let revealed;
let lettersShown;

let remainingStars;

let shareMessage = '';

// handlers
window.addEventListener('keyup', nextInputBox);
$(document).click(function (e) {
    if (e.target.id === 'help' || e.target.id === 'submit' || e.target.id === 'next' || e.target.id === 'letter' || e.target.id === 'statBtn' || e.target.id === 'yes' || e.target.id === 'no') return false;
    if ($(e.target).closest('.instructions').length != 0) return false;
    if ($(e.target).closest('.standard-popup').length != 0) return false;
    $('.popup').hide();
});
document.addEventListener("touchstart", function () { }, false);

$('.exitBtn').click(function () { $('.popup').hide() });
$('#help').click(function () { $('.popup-instructions').show() });
$('#statBtn').click(showStatPopup);
$('#yes').click(checkGuess);
$('#no').click(function () { $('.popup').hide() });
$('#next').click(showNextClue);
$('#submit').click(confirmSubmission);
$('#letter').click(addLetter);


// functions

$(document).ready(function() {getWord(function(p) {
    dailyWords = p
    correctWord = dailyWords[wordToday].word; 
    clueList = dailyWords[wordToday].clueList;
    startup();
});
});

function startup() {
    setUpWordOfDay();
    getTodaysState();
    updateRunningStars();
    if (revealed.length === 0) showSomeLetters();
    if (localStorage.getItem(played.GAME_RESULT) == 'won') {
        for (let i = 0; i < correctWord.length; i++) {
            $(`.inputs:nth-child(${i + 1})`).val(`${correctWord.substring(i, i + 1)}`);
            $(`.inputs:nth-child(${i + 1})`).attr('disabled', 'disabled');
        };
        $('#next').off();
        $('#submit').off();
        $('#letter').off();
        displayWin(localStorage.getItem(played.GAME_STARS));
    } else if (localStorage.getItem(played.GAME_RESULT) == 'lost') {
        $(`.inputs`).attr('disabled', 'disabled');
        $('#next').off();
        $('#submit').off();
        $('#letter').off();
        displayLost();
    } else {
        $('.popup-instructions').show();
    };
    for (let i = 0; i < cluesShown; i++) {
        clues[i].textContent = clueList[i].toUpperCase();
    };
    for (let i = 0; i < correctWord.length; i++) {
        if (revealed.includes(i)) {
            $(`.inputs:nth-child(${i + 1})`).val(`${correctWord.substring(i, i + 1)}`);
            $(`.inputs:nth-child(${i + 1})`).attr('disabled', 'disabled');
        };
    };
};

function getWord(cb) {
    $.getJSON("./s2rl3s.json", function(data){
        cb(data.dailyWords)
    }).fail(function(){
        console.log("An error has occurred.")
    });
};

function setUpWordOfDay() {
    for (let i = 0; i < correctWord.length; i++) {
        $(wordInput).append(`<input type="text" maxlength="1" class="inputs"></input>`);
    };
};

function showNextClue() {
    if (remainingStars <= 0.5) {
        $('.popup-error p').text(`You don't have enough stars to reveal another clue.`);
        $('.popup-error').show();
        return;
    } else if (cluesShown < 5) {
        clues[cluesShown].textContent = clueList[cluesShown].toUpperCase();
        cluesShown++;
        localStorage.setItem(played.GAME_CLUES, cluesShown);
        updateRunningStars();
    };
};


function nextInputBox(e) {
    let available = [];
    let index = $('.inputs').index(e.target);
    for (let i = 0; i < correctWord.length; i++) {
        available.push(i);
    };
    available = available.filter(x => !revealed.includes(x));
    if (e.keyCode == 8 && available.indexOf(index) > 0) {
        $(`.inputs:nth-child(${available[available.indexOf(index) - 1] + 1})`).val('');
        $(`.inputs:nth-child(${available[available.indexOf(index) - 1] + 1})`).focus();
    } else if (e.keyCode !== 8) {
        if (available.indexOf(index) < available.length - 1) {
            $(`.inputs:nth-child(${available[available.indexOf(index) + 1] + 1})`).focus();
        };
    };
};

function confirmSubmission() {
    let guess = '';
    for (let i = 0; i < correctWord.length; i++) {
        guess += $(`.inputs:nth-child(${i + 1})`).val();
    };
    if (guess.length < correctWord.length) {
        $('.popup-error p').text('You missed some blanks.  Try again!');
        $('.popup-error').show();
        return;
    } else {
        $('.popup-confirm').show();
        return;
    };
};

function checkGuess() {
    $('.popup-confirm').hide();
    let guess = '';
    for (let i = 0; i < correctWord.length; i++) {
        guess += $(`.inputs:nth-child(${i + 1})`).val();
    };

    if (guess.toUpperCase() === correctWord.toUpperCase()) {
        stars = 5 - (cluesShown - 1) * .5 - (lettersShown - Math.floor(correctWord.length * .2));
        totalGames++;
        totalStars += stars;

        $('#next').off();
        $('#submit').off();
        $('#letter').off();

        $(`.inputs`).attr('disabled', 'disabled');

        localStorage.setItem(played.TOTAL_GAMES, totalGames);
        localStorage.setItem(played.TOTAL_STARS, totalStars);
        localStorage.setItem(played.GAME_RESULT, 'won');
        localStorage.setItem(played.GAME_STARS, stars);
        displayWin(stars);
    } else {
        totalGames++;
        totalStars += stars;

        $('#next').off();
        $('#submit').off();
        $('#letter').off();
        $(`.inputs`).attr('disabled', 'disabled');

        localStorage.setItem(played.TOTAL_GAMES, totalGames);
        localStorage.setItem(played.TOTAL_STARS, totalStars);
        localStorage.setItem(played.GAME_RESULT, 'lost');

        displayLost();
    };

};

function displayLost() {
    shareMessage = `I couldn't guess today's Word! Try guessing it! `;

    $('.popup-result h1').text('Awww sorry');
    $('#showWord').text(correctWord.toUpperCase());
    $('.stars').remove();
    $('.popup-result').show();

    showStats();
    countdown();
}

function displayWin(stars) {
    shareMessage = `I guessed today's Word! and got ${stars}⭐️. Wanna challenge me? `;

    $('.popup-result h1').text(`Yasss!`);
    $('#lostText').remove();
    $('#showWord').remove();
    for (let i = 1; i <= stars; i++) {
        $('.stars').append('<i class="fa fa-solid fa-star" style ="font-size:50px"></i>');
    };
    for (let i = 0; i < Math.ceil(stars % 1); i++) {
        $('.stars').append('<i class="fa fa-solid fa-star-half" style ="font-size:50px"></i>');
    };
    $('.popup-result').show();

    showStats();
    countdown();
};

function countdown() {
    setInterval(function () {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        let total
        if(getTodaysDt() !== localStorage.getItem(played.LAST_PLAYED)) {
            total = 0;
        } else {
            total = Date.parse(tomorrow) - Date.parse(today);
        };

        const seconds = ('0' + Math.floor((total / 1000) % 60)).slice(-2);
        const minutes = ('0' + Math.floor((total / 1000 / 60) % 60)).slice(-2);
        const hours = ('0' + Math.floor((total / (1000 * 60 * 60)) % 24)).slice(-2);

        $('#hours').text(hours);
        $('#minutes').text(minutes);
        $('#seconds').text(seconds);

        if (total = 0) {
            clearInterval(countdown);
            location.reload();
        };
    });
};


function getTodaysDt() {
    const dt = new Date();
    return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
};

function getTodaysState() {
    const lastPlayed = localStorage.getItem(played.LAST_PLAYED);
    const todaysDt = getTodaysDt();
    if (lastPlayed != todaysDt) {
        localStorage.setItem(played.LAST_PLAYED, todaysDt);
        localStorage.removeItem(played.GAME_CLUES);
        localStorage.removeItem(played.GAME_RESULT);
        localStorage.removeItem(played.GAME_STARS);
        localStorage.removeItem(played.GAME_LETTERS);
    };

    cluesShown = +localStorage.getItem(played.GAME_CLUES) || 1;
    stars = 0;
    totalGames = +localStorage.getItem(played.TOTAL_GAMES) || 0;
    totalStars = +localStorage.getItem(played.TOTAL_STARS) || 0;
    revealed = localStorage.getItem(played.GAME_LETTERS) || [];
    if (revealed.length > 0) {
        revealed = revealed.split(',');
        revealed = revealed.map(x => +x);
    };
    lettersShown = revealed.length;

    remainingStars = 5 - (cluesShown - 1) * .5 - (lettersShown - Math.floor(correctWord.length * .2));
};

function showSomeLetters() {
    let letterClues = Math.floor(correctWord.length * .2);
    let random = new Date().getDay();
    for (let i = 0; i < letterClues; i++) {
        if (i * 7 + random > correctWord.length) {
            revealed.push(i * 7 + random - correctWord.length);
        } else {
            revealed.push(i * 7 + random);
        };
    };
    for (let i = 0; i < letterClues; i++) {
        $(`.inputs:nth-child(${revealed[i] + 1})`).val(`${correctWord.substring(revealed[i], revealed[i] + 1)}`);
        $(`.inputs:nth-child(${revealed[i] + 1})`).attr('disabled', 'disabled');
    };
    lettersShown += letterClues;
    localStorage.setItem(played.GAME_LETTERS, revealed);
}

function addLetter() {
    let added = lettersShown - Math.floor(correctWord.length * .2);
    if (lettersShown < Math.ceil(correctWord.length / 2)) {
        if (remainingStars <= 1) {
            $('.popup-error p').text(`You don't have enough stars to reveal another letter.`);
            $('.popup-error').show();
            return;
        } else {
            let random = [3, 1, 4, 2];
            let available = [];
            let newReveal;
            for (let i = 0; i < correctWord.length; i++) {
                available.push(i);
            };
            available = available.filter(x => !revealed.includes(x));
            if (random[added] > available.length) {
                newReveal = Math.floor(random[added] % available.length);
            } else {
                newReveal = random[added];
            };
            revealed.push(available[newReveal])
            $(`.inputs:nth-child(${revealed[revealed.length - 1] + 1})`).val(`${correctWord.substring(revealed[revealed.length - 1], revealed[revealed.length - 1] + 1)}`);
            $(`.inputs:nth-child(${revealed[revealed.length - 1] + 1})`).attr('disabled', 'disabled');

            lettersShown++;
            localStorage.setItem(played.GAME_LETTERS, revealed);
            updateRunningStars();
        };
    } else {
        $('.popup-error p').text('Maximum possible letters already revealed.');
        $('.popup-error').show();
        return;
    }
}

function updateRunningStars() {
    remainingStars = 5 - (cluesShown - 1) * .5 - (lettersShown - Math.floor(correctWord.length * .2));
    $('.counter').empty();
    let num;
    for (num = 2; num <= remainingStars + 1; num++) {
        $(`.counter:nth-child(${num})`).append(`<i class="fa fa-solid fa-circle"></i>`);
    }
    if (remainingStars % 1 !== 0) {
        $(`.counter:nth-child(${num})`).append('<i class="fa fa-solid fa-circle-half-stroke"></i>');
        num++;
    };
    if (num <= 6) {
        for (let i = num; i <= 6; i++) {
            $(`.counter:nth-child(${i})`).append('<i class="fa fa-regular fa-circle"></i>');
        };
    };
};

function showStats() {
    let statGames = localStorage.getItem(played.TOTAL_GAMES);
    let statStars = localStorage.getItem(played.TOTAL_STARS);
    let statAve = (localStorage.getItem(played.TOTAL_STARS) / localStorage.getItem(played.TOTAL_GAMES)).toFixed(1);
    if (!statGames) statGames = 0;
    if (!statStars) statStars = 0;
    if (isNaN(statAve)) statAve = 0;
    $('.game-box span').text(statGames);
    $('.stars-box span').text(statStars);
    $('.ave-box span').text(statAve);
};

function showStatPopup() {
    showStats();
    $('.popup-stats').show();
};


if (navigator.share) {
    $('.shareresult').append(`<button class="share" id="share-result">Share <i class="fa fa-solid fa-share-from-square"></i></button>`);
    if (localStorage.getItem(played.TOTAL_GAMES) > 0) {
        $('.sharestat').append(`<button class="share" id="share-stat">Share <i class="fa fa-solid fa-share-from-square"></i></button>`);
    };
} else $('.sharediv').remove();

$('.shareresult').on('click', '#share-result', function () {
    navigator.share({
        title: 'Play Word!',
        url: 'https://word.dailybrainplay.com/',
        text: `${shareMessage}`
    }).then(() => {
        console.log('Thanks for sharing!');
    })
        .catch(console.error);
});

$('.sharestat').on('click', '#share-stat', function () {
    navigator.share({
        title: 'Play Word!',
        url: 'https://word.dailybrainplay.com/',
        text: `I've won a total of ${localStorage.getItem(played.TOTAL_STARS)}⭐️ after playing ${localStorage.getItem(played.TOTAL_GAMES)} game/s on Word!  Try it too! `
    }).then(() => {
        console.log('Thanks for sharing!');
    })
        .catch(console.error);
});

document.addEventListener('contextmenu', event => event.preventDefault());

document.onkeydown = function (e) {
    if (event.keyCode == 123) {
        return false;
    }
    if (e.metaKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'i'.charCodeAt(0))) {
        return false;
    }
    if (e.metaKey && e.shiftKey && (e.keyCode == 'C'.charCodeAt(0) || e.keyCode == 'c'.charCodeAt(0))) {
        return false;
    }
    if (e.metaKey && e.shiftKey && (e.keyCode == 'J'.charCodeAt(0) || e.keyCode == 'j'.charCodeAt(0))) {
        return false;
    }
    if (e.metaKey && (e.keyCode == 'U'.charCodeAt(0) || e.keyCode == 'u'.charCodeAt(0))) {
        return false;
    }
    if (e.metaKey && (e.keyCode == 'S'.charCodeAt(0) || e.keyCode == 's'.charCodeAt(0))) {
        return false;
    }
    if (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'i'.charCodeAt(0))) {
        return false;
    }
    if (e.ctrlKey && e.shiftKey && (e.keyCode == 'C'.charCodeAt(0) || e.keyCode == 'c'.charCodeAt(0))) {
        return false;
    }
    if (e.ctrlKey && e.shiftKey && (e.keyCode == 'J'.charCodeAt(0) || e.keyCode == 'j'.charCodeAt(0))) {
        return false;
    }
    if (e.ctrlKey && (e.keyCode == 'U'.charCodeAt(0) || e.keyCode == 'u'.charCodeAt(0))) {
        return false;
    }
    if (e.ctrlKey && (e.keyCode == 'S'.charCodeAt(0) || e.keyCode == 's'.charCodeAt(0))) {
        return false;
    }
}