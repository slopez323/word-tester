// words
const dailyWords = [
    { word: 'FIELD', clueList: ['SPORTS', 'LAND', 'CORN', 'WRIGLEY', 'SALLY'] },
    { word: 'HUDDLE', clueList: ['TOGETHER', 'FOOTBALL', 'PLAY', 'INSTRUCTIONS', 'GATHER'] },
    { word: 'PULSE', clueList: ['HEARTBEAT', 'RATE', 'TAKE', 'WRIST', 'COUNT'] },
    { word: 'PASSWORD', clueList: ['SECRET', 'ACCESS', 'PROTECT', 'COMPUTER', 'CONFIDENTIAL'] },
    { word: 'QUACK', clueList: ['DUCK', 'NOISE', 'WADDLE', 'AFLAC', 'DOCTOR'] },
    { word: 'SHOULDER', clueList: ['ARM', 'JOINT', 'CRY', 'DISLOCATE', 'COLD'] },
    { word: 'BARGAIN', clueList: ['SALE', 'CHEAP', 'PRICE', 'HAGGLE', 'DEAL'] },
    { word: 'DREAM', clueList: ['SLEEP', 'IMAGE', 'R.E.M.', 'HAGGLE', 'DEAL'] },
    { word: 'STEPMOTHER', clueList: ['SPOUSE', 'FATHER', 'MARRY', 'EVIL', 'PARENT'] },
    { word: 'ASTEROID', clueList: ['SPACE', 'BELT', 'METEOR', 'ARMAGEDDON', 'BRUCE WILLIS'] },
    { word: 'TUMBLER', clueList: ['DRINKING', 'GLASS', 'ACROBAT', 'GYMNAST', 'LOCK'] },
    { word: 'KENNEL', clueList: ['DOGS', 'BOARD', 'CANINE', 'HOTEL', 'KEEP'] },
    { word: 'TABLET', clueList: ['PAD', 'PAPER', 'PILL', 'MOSES', 'IPAD'] },
    { word: 'CHIROPRACTOR', clueList: ['BACK', 'SPINE', 'MANIPULATE', 'ADJUST', 'TREAT'] },
    { word: 'INFINITY', clueList: ['FOREVER', 'ETERNAL', 'NEVERENDING', 'LUXURY', 'CAR'] },
    { word: 'BLING', clueList: ['SHINY', 'JEWELRY', 'GLITTER', 'FLASHY', 'SLANG'] },
    { word: 'TREADMILL', clueList: ['WALK', 'GYM', 'MACHINE', 'STEP', 'FAST'] },
    { word: 'CRUISE', clueList: ['SAIL', 'LEISURE', 'PENELOPE', 'MISSILE', 'TOM'] },
    { word: 'POLYGAMY', clueList: ['WED', 'PLURAL', 'WIVES', 'MORMON', 'BIG LOVE'] },
    { word: 'CHUCK', clueList: ['MEAT', 'HAMBURGER', 'WAGON', 'THROW', 'NORRIS'] },
];

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
const remainingGuess = document.getElementsByClassName('counter');

const dateToday = new Date();
const firstDay = new Date('03/07/2022');
const wordToday = Math.floor((dateToday.getTime() - firstDay.getTime()) / (1000 * 3600 * 24));

let correctWord = dailyWords[wordToday].word;

let cluesShown = +localStorage.getItem(played.GAME_CLUES) || 1;
let stars = 0;
let totalGames = +localStorage.getItem(played.TOTAL_GAMES) || 0;
let totalStars = +localStorage.getItem(played.TOTAL_STARS) || 0;
let revealed = localStorage.getItem(played.GAME_LETTERS) || [];
if (revealed.length > 0) {
    revealed = revealed.split(',');
    revealed = revealed.map(x => +x)
}
let lettersShown = revealed.length;

let remainingStars = 5 - (cluesShown - 1) * .5 - (lettersShown - Math.floor(correctWord.length * .2));

// handlers
$(document).ready(function () { refreshAt(0, 0, 0); });
$(document).ready(startup);
window.addEventListener('keyup', nextInputBox);
$(document).click(function (e) {
    if (e.target.id === 'help' || e.target.id === 'submit' || e.target.id === 'next' || e.target.id === 'letter' || e.target.id === 'statBtn' || e.target.id === 'yes' || e.target.id === 'no') return false;
    if ($(e.target).closest('.instructions').length != 0) return false;
    if ($(e.target).closest('.content').length != 0) return false;
    $('.popup').hide();
    $('.popup-error').hide();
});
document.addEventListener("touchstart", function () { }, false);

$('#help').click(function () { $('.popup').show() })
$('#statBtn').click(showStatPopup)
$('#inst-exit').click(function () { $('.popup').hide() })
$('.content').on('click', '#yes', checkGuess)
$('.content').on('click', '#no', function () { $('.popup-error').hide() })


// functions
function startup() {
    setUpWordOfDay()
    getTodaysState()
    updateRunningStars()
    if (revealed.length === 0) showSomeLetters()
    if (localStorage.getItem(played.GAME_RESULT) == 'won') {
        for (let i = 0; i < correctWord.length; i++) {
            $(`.inputs:nth-child(${i + 1})`).val(`${correctWord.substring(i, i + 1)}`)
            $(`.inputs:nth-child(${i + 1})`).attr('disabled', 'disabled')
        }
        displayWin(localStorage.getItem(played.GAME_STARS))
    } else if (localStorage.getItem(played.GAME_RESULT) == 'lost') {
        $(`.inputs`).attr('disabled', 'disabled');
        displayLost()
    } else {
        $('.popup').show()
        $('#inst-exit').click(function () {
            $('.popup').hide();
        });
        $('#next').click(showNextClue);
        $('#submit').click(confirmSubmission);
        $('#letter').click(addLetter);
    }
    for (let i = 0; i < cluesShown; i++) {
        clues[i].textContent = dailyWords[wordToday].clueList[i].toUpperCase();
    }
    for (let i = 0; i < correctWord.length; i++) {
        if (revealed.includes(i)) {
            $(`.inputs:nth-child(${i + 1})`).val(`${correctWord.substring(i, i + 1)}`)
            $(`.inputs:nth-child(${i + 1})`).attr('disabled', 'disabled')
        }
    }
}


function showNextClue() {
    if (remainingStars <= 0.5) {
        $('#textdisplay h1').text(`Whoops!`)
        $('#textdisplay span').text(`You don't have enough stars to reveal another clue.`)
        $('.stats').hide()
        $('#clockdiv').hide()
        $('.confirmOptions').hide()
        $('.popup-error').show()
        $('#exitBtn').click(function () { $('.popup-error').hide() })
        return;
    } else if (cluesShown < 5) {
        clues[cluesShown].textContent = dailyWords[wordToday].clueList[cluesShown].toUpperCase()
        cluesShown++
        localStorage.setItem(played.GAME_CLUES, cluesShown)
        updateRunningStars()
    }
};

function setUpWordOfDay() {
    for (let i = 0; i < correctWord.length; i++) {
        $(wordInput).append(`<input type="text" maxlength="1" class="inputs"></input>`)
    }
}



function nextInputBox(e) {
    let available = []
    let index = $('.inputs').index(e.target)
    for (let i = 0; i < correctWord.length; i++) {
        available.push(i)
    }
    available = available.filter(x => !revealed.includes(x))
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
    let guess = ''
    for (let i = 0; i < correctWord.length; i++) {
        guess += $(`.inputs:nth-child(${i + 1})`).val()
    }
    if (guess.length < correctWord.length) {
        $('#textdisplay h1').text('Whoops!')
        $('#textdisplay span').text('You missed some blanks.  Try again!')
        $('.stats').hide()
        $('#clockdiv').hide()
        $('.confirmOptions').hide()
        $('.popup-error').show()
        $('#exitBtn').click(function () { $('.popup-error').hide() })
        return;
    } else {
        $('#textdisplay h1').text(`Sure?`)
        $('#textdisplay span').text(`You only get 1 chance to guess the word per day so guess wisely!`)
        $('.stats').hide()
        $('.stars').hide()
        $('.content>p').hide()
        $('#clockdiv').hide()
        if (!$('.confirmOptions').length) {
            $('.content').append(`<div class="confirmOptions"></div>`)
            $('.confirmOptions').append(`<button id="yes">So sure!</button>`)
            $('.confirmOptions').append(`<button id="no">Lemme think about it again!</button`)
        }
        $('.popup-error').show()

        $('#exitBtn').click(function () { $('.popup-error').hide() })
        return;
    }
}



function checkGuess() {
    let guess = ''
    for (let i = 0; i < correctWord.length; i++) {
        guess += $(`.inputs:nth-child(${i + 1})`).val()
    }

    if (guess.toUpperCase() === correctWord.toUpperCase()) {
        stars = 5 - (cluesShown - 1) * .5 - (lettersShown - Math.floor(correctWord.length * .2))
        totalGames++
        totalStars += stars

        $('#next').off();
        $('#submit').off();
        $('#letter').off();

        $(`.inputs`).attr('disabled', 'disabled');

        localStorage.setItem(played.TOTAL_GAMES, totalGames)
        localStorage.setItem(played.TOTAL_STARS, totalStars)
        localStorage.setItem(played.GAME_RESULT, 'won')
        localStorage.setItem(played.GAME_STARS, stars)
        displayWin(stars)
    } else {
        totalGames++
        totalStars += stars

        $('#next').off();
        $('#submit').off();
        $('#letter').off();
        $(`.inputs`).attr('disabled', 'disabled');

        localStorage.setItem(played.TOTAL_GAMES, totalGames)
        localStorage.setItem(played.TOTAL_STARS, totalStars)
        localStorage.setItem(played.GAME_RESULT, 'lost')

        displayLost();
    };

};

function displayLost() {
    $('#textdisplay h1').text('Awww sorry').css('margin', 0)
    $('#textdisplay span').text('The word you were looking for was')
    $('#showWord').text(correctWord.toUpperCase()).show()
    showStats()
    // $('#clockdiv').before('<p>Play again in:</p>')
    $('.confirmOptions').hide()
    $('.popup-error').show()
    $('#exitBtn').click(function () { $('.popup-error').hide() })
    countdown()
}

function displayWin(stars) {
    $('#textdisplay h1').text(`Yasss!`)
    $('#textdisplay span').hide()
    $('#showWord').remove()
    for (let i = 1; i <= stars; i++) {
        $('.stars').append('<i class="fa fa-solid fa-star" style ="font-size:50px"></i>')
    }
    for (let i = 0; i < Math.ceil(stars % 1); i++) {
        $('.stars').append('<i class="fa fa-solid fa-star-half" style ="font-size:50px"></i>')
    }
    $('.stars').show()
    showStats()
    // $('#clockdiv').before('<p>Play again in:</p>')
    $('.confirmOptions').hide()
    $('.popup-error').show()
    $('#exitBtn').click(function () { $('.popup-error').hide() })
    countdown()
}

function countdown() {
    $('#clockdiv').before('<p>Play again in:</p>')
    $('#clockdiv').show()
    setInterval(function () {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        const total = Date.parse(tomorrow) - Date.parse(today);
        const seconds = ('0' + Math.floor((total / 1000) % 60)).slice(-2);
        const minutes = ('0' + Math.floor((total / 1000 / 60) % 60)).slice(-2);
        const hours = ('0' + Math.floor((total / (1000 * 60 * 60)) % 24)).slice(-2);

        $('#hours').text(hours)
        $('#minutes').text(minutes)
        $('#seconds').text(seconds)

        if (total <= 0) {
            clearInterval(countdown)
            startup()
        }
    })
}


function getTodaysDt() {
    const dt = new Date()
    return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`
}

function getTodaysState() {
    const lastPlayed = localStorage.getItem(played.LAST_PLAYED)
    const todaysDt = getTodaysDt()
    if (lastPlayed != todaysDt) {
        localStorage.setItem(played.LAST_PLAYED, todaysDt)
        localStorage.removeItem(played.GAME_CLUES)
        localStorage.removeItem(played.GAME_RESULT)
        localStorage.removeItem(played.GAME_STARS)
        localStorage.removeItem(played.GAME_LETTERS)
    }
}

function showSomeLetters() {
    let letterClues = Math.floor(correctWord.length * .2)
    let random = new Date().getDay()
    for (let i = 0; i < letterClues; i++) {
        if (i * 7 + random > correctWord.length) {
            revealed.push(i * 7 + random - correctWord.length)
        } else {
            revealed.push(i * 7 + random)
        }
    }
    for (let i = 0; i < letterClues; i++) {
        $(`.inputs:nth-child(${revealed[i] + 1})`).val(`${correctWord.substring(revealed[i], revealed[i] + 1)}`)
        $(`.inputs:nth-child(${revealed[i] + 1})`).attr('disabled', 'disabled')
    }
    lettersShown += letterClues
    localStorage.setItem(played.GAME_LETTERS, revealed)
}

function addLetter() {
    let added = lettersShown - Math.floor(correctWord.length * .2)
    if (lettersShown < Math.ceil(correctWord.length / 2)) {
        if (remainingStars <= 1) {
            $('#textdisplay h1').text(`Whoops!`)
            $('#textdisplay span').text(`You don't have enough stars to reveal another letter.`)
            $('.stats').hide()
            $('#clockdiv').hide()
            $('.confirmOptions').hide()
            $('.popup-error').show()
            $('#exitBtn').click(function () { $('.popup-error').hide() })
            return;
        } else {
            let random = [3, 1, 4, 2]
            let available = []
            let newReveal
            for (let i = 0; i < correctWord.length; i++) {
                available.push(i)
            }
            available = available.filter(x => !revealed.includes(x))
            if (random[added] > available.length) {
                newReveal = Math.floor(random[added] % available.length)
            } else {
                newReveal = random[added]
            }
            revealed.push(available[newReveal])
            $(`.inputs:nth-child(${revealed[revealed.length - 1] + 1})`).val(`${correctWord.substring(revealed[revealed.length - 1], revealed[revealed.length - 1] + 1)}`)
            $(`.inputs:nth-child(${revealed[revealed.length - 1] + 1})`).attr('disabled', 'disabled')

            lettersShown++
            localStorage.setItem(played.GAME_LETTERS, revealed)
            updateRunningStars()
        }
    } else {
        $('#textdisplay h1').text('Whoops!')
        $('#textdisplay span').text('Maximum possible letters already revealed.')
        $('.stats').hide()
        $('#clockdiv').hide()
        $('.confirmOptions').hide()
        $('.popup-error').show()
        $('#exitBtn').click(function () { $('.popup-error').hide() })
        return;
    }
}

function updateRunningStars() {
    remainingStars = 5 - (cluesShown - 1) * .5 - (lettersShown - Math.floor(correctWord.length * .2))
    $('.counter').empty();
    let num
    for (num = 2; num <= remainingStars + 1; num++) {
        $(`.counter:nth-child(${num})`).append(`<i class="fa fa-solid fa-circle"></i>`)
    }
    if (remainingStars % 1 !== 0) {
        $(`.counter:nth-child(${num})`).append('<i class="fa fa-solid fa-circle-half-stroke"></i>')
        num++
    }
    if (num <= 6) {
        for (let i = num; i <= 6; i++) {
            $(`.counter:nth-child(${i})`).append('<i class="fa fa-regular fa-circle"></i>')
        }
    }
}

function showStats() {
    let statGames = localStorage.getItem(played.TOTAL_GAMES);
    let statStars = localStorage.getItem(played.TOTAL_STARS);
    let statAve = (localStorage.getItem(played.TOTAL_STARS) / localStorage.getItem(played.TOTAL_GAMES)).toFixed(1)
    $('.stats').show()
    if (!statGames) statGames = 0
    if (!statStars) statStars = 0
    if (isNaN(statAve)) statAve = 0
    $('#game-box span').text(statGames)
    $('#stars-box span').text(statStars)
    $('#ave-box span').text(statAve)

}

function showStatPopup() {
    $('#textdisplay h1').text('Stats').css('margin', 0)
    showStats()
    $('.stars').hide()
    $('.content>p').hide()
    $('#clockdiv').hide()
    $('.confirmOptions').hide()
    $('.popup-error').show()
    $('#exitBtn').click(function () { $('.popup-error').hide() })
}

function refreshAt(hours, minutes, seconds) {
    var now = new Date();
    var then = new Date();

    if (now.getHours() > hours ||
        (now.getHours() == hours && now.getMinutes() > minutes) ||
        now.getHours() == hours && now.getMinutes() == minutes && now.getSeconds() >= seconds) {
        then.setDate(now.getDate() + 1);
    }
    then.setHours(hours);
    then.setMinutes(minutes);
    then.setSeconds(seconds);

    var timeout = (then.getTime() - now.getTime());
    setTimeout(function () { window.location.reload(true); }, timeout);
};


var time = new Date().getTime();
$(document.body).bind("mousemove keypress touchmove keydown", function () {
    time = new Date().getTime();
});

setInterval(function() {
    if (new Date().getTime() - time >= 600000) {
        window.location.reload(true);
    }
}, 1000);

$('#share').click(function() {
    if (navigator.share) {
      navigator.share({
        title: 'Play Word!',
        url: 'https://slopez323.github.io/word-tester/'
      }).then(() => {
        console.log('Thanks for sharing!');
      })
      .catch(console.error);
    } else {
      // fallback
    }
  });

// document.addEventListener('contextmenu', event => event.preventDefault());

// document.onkeydown = function (e) {
//     if (event.keyCode == 123) {
//         return false;
//     }
//     if (e.metaKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'i'.charCodeAt(0))) {
//         return false;
//     }
//     if (e.metaKey && e.shiftKey && (e.keyCode == 'C'.charCodeAt(0) || e.keyCode == 'c'.charCodeAt(0))) {
//         return false;
//     }
//     if (e.metaKey && e.shiftKey && (e.keyCode == 'J'.charCodeAt(0) || e.keyCode == 'j'.charCodeAt(0))) {
//         return false;
//     }
//     if (e.metaKey && (e.keyCode == 'U'.charCodeAt(0) || e.keyCode == 'u'.charCodeAt(0))) {
//         return false;
//     }
//     if (e.metaKey && (e.keyCode == 'S'.charCodeAt(0) || e.keyCode == 's'.charCodeAt(0))) {
//         return false;
//     }
//     if (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'i'.charCodeAt(0))) {
//         return false;
//     }
//     if (e.ctrlKey && e.shiftKey && (e.keyCode == 'C'.charCodeAt(0) || e.keyCode == 'c'.charCodeAt(0))) {
//         return false;
//     }
//     if (e.ctrlKey && e.shiftKey && (e.keyCode == 'J'.charCodeAt(0) || e.keyCode == 'j'.charCodeAt(0))) {
//         return false;
//     }
//     if (e.ctrlKey && (e.keyCode == 'U'.charCodeAt(0) || e.keyCode == 'u'.charCodeAt(0))) {
//         return false;
//     }
//     if (e.ctrlKey && (e.keyCode == 'S'.charCodeAt(0) || e.keyCode == 's'.charCodeAt(0))) {
//         return false;
//     }
// }