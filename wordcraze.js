/**
 
 @Author: leogps [Paul Gundarapu] (https://github.com/leogps)
 
 @License: http://creativecommons.org/licenses/by/4.0/legalcode
 
**/

/**
###
##### @Title: wordcraze.js
###
##### @Desciption: Classic timed anagram solver game (as seen on old nokia mobiles).
###
**/


/**
**  Represents Word object to hold arbitrary info.
 
** @Attributes: { word, fiveLetteredCorrectWords, fourLetteredCorrectWords, threeLetteredCorrectWords, pickedWord, totalWords, 
                  recognized3s, recognized4s, recognized5s }
**/
var Word = function(word, fiveLetteredCorrectWords, fourLetteredCorrectWords, threeLetteredCorrectWords, pickedWord) {
    this.word = word;
    this.fiveLetteredCorrectWords = fiveLetteredCorrectWords;
    this.fourLetteredCorrectWords = fourLetteredCorrectWords;
    this.threeLetteredCorrectWords = threeLetteredCorrectWords;
    this.totalWords = fiveLetteredCorrectWords.length + fourLetteredCorrectWords.length + threeLetteredCorrectWords.length;
    
    this.recognized3s = [];
    for(var i in threeLetteredCorrectWords) {
        this.recognized3s[threeLetteredCorrectWords[i]] = false;
    }
    
    this.recognized4s = [];
    for(var i in fourLetteredCorrectWords) {
        this.recognized4s[fourLetteredCorrectWords[i]] = false;
    }
    
    this.recognized5s = [];
    for(var i in fiveLetteredCorrectWords) {
        this.recognized5s[fiveLetteredCorrectWords[i]] = false;
    }
    
    this.pickedWord = pickedWord;
};


/**
 ** Represents (Countdown) Timer object that takes a default timeout with an _onTimeout function that gets executed upon timeout.
 **
 
 ** @Attributes: { timeout, @internal : { _timerRef } }
 
 ** @Functions: { start(), reset(), @internal : { _countdown() } }
 
 ** @Usage: 
        timer t = new timer(90, function(){_doOnTimeout()});
        t.start(function(time){ // current time value.
            _doOnCountdown(); // use time value
        })
 **
 **
**/
var timer = function(timeout, _onTimeout) {
    this._timerRef = [];
    this.timeout = new Number(timeout);
    this.resettableTimeout = new Number(timeout);
    this._onTimeout = _onTimeout || function(){};
    
    this.start = function(_onCountdown) {
        this._onCountdown = _onCountdown || function(){};
        this._countdown();
    };
    
    this.reset = function() {
        if(this._timerRef) {
            clearTimeout(this._timerRef);
        }
        this.timeout = this.resettableTimeout;
        this._onCountdown = function(){};
    };
    
    this._countdown = function() {
        if(this.timeout >= 0) {
            
            if(jQuery.isFunction(this._onCountdown)) {
                this._onCountdown(this.timeout);
            }
        
            var __countdown = this._countdown;
            --this.timeout;
            var __context = this;
            
            this._timerRef = setTimeout(
                    function() {
                        __countdown.apply(__context);
                    }, 1000);
        } else {
            if(jQuery.isFunction(this._onTimeout)) {
                this._onTimeout();
            }
        }
    };
};


/**
 ** Represents Game object.
 
 ** @Attributes: score, currentWord [@type:Word], timer [@type:timer].
 
 ** @Functions: newWord, reset, addToScore.
 
**/
var Game = function() {
    this.PLAYED_WORDS = [];
    this.score = 0;
    this.currentWord = null;
    this.timer = new timer(90, // 90sec timer.
        function() {
            var counts = wordcraze._updateCounts();
            if(counts["3s"] > 0 && counts["4s"] > 0 && counts["5s"] > 0) {
                wordcraze.CACHE.$table.hide();
                wordcraze.writeMessage("Game Over!! You did not finish atleast one of the word categories. :(");
            } else {
                wordcraze.play();
            }
            
        });
    
    this.newWord = function(word, fiveLetteredCorrectWords, fourLetteredCorrectWords, threeLetteredCorrectWords, pickedWord) {
        if(this.currentWord) {
            // Pushing last word into Played_Words.
            this.PLAYED_WORDS.push(this.currentWord);
        }
        this.currentWord = new Word(word, fiveLetteredCorrectWords, fourLetteredCorrectWords, threeLetteredCorrectWords, pickedWord);
    };
    
    this.reset = function() {
        this.PLAYED_WORDS = [];
        this.score = 0;
        this.currentWord = null;
    };
    
    this.addToScore = function(addableScore) {
        if(!isNaN(addableScore)) {
            this.score += addableScore;
            wordcraze.writeMessage("New Score: " + this.score);
        }
    };
    
    
};


/**
 ** wordcraze.
**/
var wordcraze = {
    
    /**
     * gameData : [@type: Game]
    **/
    gameData : new Game(),
    
    /**
     ** Holds cached references of jQuery objects that represent DOM objects.
     **
     ** Also holds Mapversions of the dictionary to speed up the game. Most of the heavy lifting takes place when the cache is initialized on page load.
    **/
    CACHE : {
        $table : undefined,
        $buttonRow : undefined,
        $inputRow : undefined,
        $clearButton : undefined,
        $submitButton : undefined,
        $messageDiv : undefined,
        $scoreSpan : undefined,
        $min : undefined,
        $sec : undefined,
        
        // {'word': true} // {'junk' : undefined}
        threeLetteredWordMap : [],
        fourLetteredWordMap : [],
        fiveLetteredWordMap : []
    },
    
    _initCache : function() {
        wordcraze.CACHE.$table = jQuery("table#theTable");
        wordcraze.CACHE.$buttonRow = wordcraze.CACHE.$table.find("tr#buttonRow");
        wordcraze.CACHE.$inputRow = wordcraze.CACHE.$table.find("tr#inputRow");
        wordcraze.CACHE.$clearButton = wordcraze.CACHE.$table.find("input[type='button'][id='clearButton']");
        wordcraze.CACHE.$submitButton = wordcraze.CACHE.$table.find("input[type='button'][id='submitButton']");
        wordcraze.CACHE.$messageDiv = jQuery("div#messageBox");
        wordcraze.CACHE.$scoreSpan = jQuery("span#score");
        wordcraze.CACHE.$minSpan = jQuery("span.min");
        wordcraze.CACHE.$secSpan = jQuery("span.sec");
        
        wordcraze.dictionary.isBuilt = false;
        var threeLWs = wordcraze.dictionary.getThreeLetteredWords();
        for(var i in threeLWs ) {
            if(typeof i === "string") {
                wordcraze.CACHE.threeLetteredWordMap[threeLWs[i]] = true;
                wordcraze.dictionary.addWord(threeLWs[i]);
            }
        }
        
        var fourLWs = wordcraze.dictionary.getFourLetteredWords();
        for(var i in fourLWs ) {
            if(typeof i === "string") {
                wordcraze.CACHE.fourLetteredWordMap[fourLWs[i]] = true;
                wordcraze.dictionary.addWord(fourLWs[i]);
            }
        }
        
        var fiveLWs = wordcraze.dictionary.getFiveLetteredWords();
        for(var i in fiveLWs ) {
            if(typeof i === "string") {
                wordcraze.CACHE.fiveLetteredWordMap[fiveLWs[i]] = true;
                wordcraze.dictionary.addWord(fiveLWs[i]);
            }
        }
        wordcraze.dictionary.isBuilt = true;
        
    },
    
    /**
     * Writes status message.
     *
    **/
    writeMessage : function(msg) {
        wordcraze.CACHE.$messageDiv
            .removeClass('red-text')
            .addClass('green-text')
            .text(msg);
        wordcraze.utils.flash(wordcraze.CACHE.$messageDiv);
    },
    
    /**
     * Writes status message with error highlight.
     *
     **/
    writeErrorMessage : function(msg) {
        wordcraze.CACHE.$messageDiv
        .removeClass('green-text')
        .addClass('red-text')
        .text(msg);
        wordcraze.utils.flash(wordcraze.CACHE.$messageDiv);
    },
    
    /**
     * Initializes the wordcraze.CACHE, game assets, attaches user events on DOM objects and starts the game conditionally.
     *
     **/
    init : function(dontPlay) {
        
        wordcraze._initCache();
        
        wordcraze._reset();
        
        // Attaching clear button event listener.
        wordcraze.CACHE.$clearButton
            .on("click", function(evt) {
                evt.preventDefault();
                    wordcraze._resetButtons(true);
                    wordcraze._resetSelections();
                    wordcraze.writeMessage(" ");
            });
        
        // Attaching submit button event listener.
        wordcraze.CACHE.$submitButton
            .on("click", function(evt) {
                evt.preventDefault();
                
                // User should select atleast 3 letters.
                if($(wordcraze.CACHE.$inputRow.find("input")[2]).val() != '') {
                    var usersWord = wordcraze.utils.fetchUsersWord();
                
                    if(usersWord.length == 3 && wordcraze.utils.isIn(usersWord,
                                                                     wordcraze.gameData.currentWord.threeLetteredCorrectWords)) {
                        if(!(wordcraze.gameData.currentWord.recognized3s[usersWord] === true)) {
                            wordcraze.gameData.currentWord.recognized3s[usersWord] = true;
                            wordcraze.gameData.addToScore(30);
                            wordcraze.writeMessage("Sweet!! Last word: " + usersWord);
                        } else {
                            wordcraze.writeMessage("Word already entered: " + usersWord);
                        }
                    }
                    else if(usersWord.length == 4 && wordcraze.utils.isIn(usersWord,
                                                                          wordcraze.gameData.currentWord.fourLetteredCorrectWords)) {
                        if(!(wordcraze.gameData.currentWord.recognized4s[usersWord] === true)) {
                            wordcraze.gameData.currentWord.recognized4s[usersWord] = true;
                            wordcraze.gameData.addToScore(40);
                            wordcraze.writeMessage("Sweet!! Last word: " + usersWord);
                        } else {
                            wordcraze.writeMessage("Word already entered: " + usersWord);
                        }
                    }
                    else if(usersWord.length == 5 && wordcraze.utils.isIn(usersWord,
                                                                          wordcraze.gameData.currentWord.fiveLetteredCorrectWords)) {
                        if(!(wordcraze.gameData.currentWord.recognized5s[usersWord] === true)) {
                            wordcraze.gameData.currentWord.recognized5s[usersWord] = true;
                            wordcraze.gameData.addToScore(50);
                            wordcraze.writeMessage("Sweet!! Last word: " + usersWord);
                        } else {
                            wordcraze.writeMessage("Word already entered: " + usersWord);
                        }
                    } else {
                        wordcraze.writeErrorMessage("Not a valid word: " + usersWord);
                    }
                } else {
                    wordcraze.writeErrorMessage("Make 3, 4 or 5 lettered word. That ain't no desired word!!");
                }
                
                var counts = wordcraze._updateCounts();
                wordcraze._updateScore();
                wordcraze._resetButtons(true);
                wordcraze._resetSelections();
                
                if(counts["3s"] == 0 && counts["4s"] == 0 && counts["5s"] == 0) {
                    wordcraze.play();
                }
                
            });
        
        // Attaching input buttons event listeners.
        wordcraze.CACHE.$buttonRow.find("input[type='button']")
            .on('click',
                function(evt) {
                    evt.preventDefault();
                    var $this = jQuery(this);
                    wordcraze.utils.flash($this);
                    if(!$this.data('isUsed')) {
                        var value = $this.val();
                        var nextAvailableInput = wordcraze.utils.fetchNextAvaialbleInput();
                        if(nextAvailableInput) {
                            nextAvailableInput.val(value);
                            wordcraze.utils.flash(nextAvailableInput);
                            $this.data('isUsed', true);
                        }
                        wordcraze.writeMessage(wordcraze.utils.fetchUsersWord());
                    } else {
                        wordcraze.writeErrorMessage("Letter already used!!");
                    }
                });
        
        if(dontPlay != true) {
            wordcraze.play();
        }
    },
    
    /**
     * Starts the game. This must be preceded by initialization. Calling this subsequently, fetches the next word by skipping the current word.
     *
    **/
    play : function() {
        var word = wordcraze.wordfetcher.fetchRandomWord();
        //console.log("Random word fetched: " + word);
        var fiveLetteredPermutations = wordcraze.permutator.generatePermutations(word);
        var randomIndex = Math.round(Math.random() * (fiveLetteredPermutations.length -1));
        //console.log(randomIndex);
        var pickedWord = fiveLetteredPermutations[randomIndex];
        //console.log("Picked word: " + pickedWord);
        
        var fourLetteredPermutations = wordcraze.permutator.generatePermutations(word, 4);
        var threeLetteredPermutations = wordcraze.permutator.generatePermutations(word, 3);
        
        var fiveLetteredCorrectWords = wordcraze.utils.fetchCorrectWords(fiveLetteredPermutations, wordcraze.CACHE.fiveLetteredWordMap);
        var fourLetteredCorrectWords = wordcraze.utils.fetchCorrectWords(fourLetteredPermutations, wordcraze.CACHE.fourLetteredWordMap);
        var threeLetteredCorrectWords = wordcraze.utils.fetchCorrectWords(threeLetteredPermutations, wordcraze.CACHE.threeLetteredWordMap);
        
        wordcraze.gameData.newWord(word,
                                   fiveLetteredCorrectWords,
                                   fourLetteredCorrectWords,
                                   threeLetteredCorrectWords,
                                   pickedWord);
        
        wordcraze.CACHE.$buttonRow.find("input[type='button']")
            .each(function(index) {
                  jQuery(this).val(pickedWord.charAt(index));
            });
        
        wordcraze._updateCounts();
        
        wordcraze.CACHE.$clearButton.click();
        
        wordcraze.gameData.timer.reset();
        wordcraze.gameData.timer.start(
            function(time) {
                wordcraze.CACHE.$minSpan.text( wordcraze.utils.prependZeros( Math.floor(time / 60 ) ), 2);
                wordcraze.CACHE.$secSpan.text( wordcraze.utils.prependZeros( time < 60 ? time : (time - 60) ), 2 );
                wordcraze.utils.flash(wordcraze.CACHE.$minSpan);
                wordcraze.utils.flash(wordcraze.CACHE.$secSpan)
            });
    },
    
    /**
     * Updates the left over word counts in the DOM and also returns an object holding the corresponding counts.
     * counts["3s"], counts["4s"], counts["5s"]
     *
    **/
    _updateCounts : function() {
        var counts = {};
        
        counts["3s"] = wordcraze._getUpdateCount(wordcraze.gameData.currentWord.threeLetteredCorrectWords,
                                              wordcraze.gameData.currentWord.recognized3s);
        
        jQuery("span#noOf3s").html(counts["3s"]);
        
        counts["4s"] = wordcraze._getUpdateCount(wordcraze.gameData.currentWord.fourLetteredCorrectWords,
                                              wordcraze.gameData.currentWord.recognized4s);
        jQuery("span#noOf4s").html(counts["4s"]);
        
        counts["5s"] = wordcraze._getUpdateCount(wordcraze.gameData.currentWord.fiveLetteredCorrectWords,
                                              wordcraze.gameData.currentWord.recognized5s);
        jQuery("span#noOf5s").html(counts["5s"]);
        
        return counts;
    },
    
    /**
     * Reads the current score value and updates the DOM.
    **/
    _updateScore : function() {
        wordcraze.CACHE.$scoreSpan.text(wordcraze.gameData.score);
    },
    
    _getUpdateCount : function(allWords, recognizedValues) {
        var count = 0;
        for(var i in allWords) {
            if(!recognizedValues[allWords[i]]) {
                count++;
            }
        }
        return count;
    },
    
    /**
     * Resets Game.
     *
    **/
    _reset : function() {
        wordcraze.gameData.reset();
        wordcraze._resetButtons();
        wordcraze._resetSelections();
    },
    
    /**
     * Resets buttons and their values.
     *
    **/
    _resetButtons : function(doNotResetValues) {
        wordcraze.CACHE.$buttonRow.find("input[type='button']")
            .each(function() {
                  var $this = jQuery(this);
                  if(!doNotResetValues) {
                    $this.val('');
                  }
                  $this.data('isUsed', false);
                });
    },
    
    /**
     * Resets user letter selections.
     *
     **/
    _resetSelections : function() {
        wordcraze.CACHE.$inputRow.find("input[type='text']").val('');
    },
    
    /**
     * Utility function holder.
     *
    **/
    utils : {
        
        /**
         * Tests for the object {@param: i} not available in the @param: array.
        **/
        notIn : function(i, array) {
            for(var index = 0; index < array.length; index++) {
                if(i == array[index]) {
                    return false;
                }
            }
            
            return true;
        },
        
        /**
         * Tests for the value @param: str is in the array @param: strArr.
         *
        **/
        isIn : function(str, strArr) {
            for(var index = 0; index < strArr.length; index++) {
                if(strArr[index] == str) {
                    return true;
                }
            }
            return false;
        },
        
        /**
         * Returns the next available text input.
         *
         **/
        fetchNextAvaialbleInput : function() {
            var ret;
            jQuery.each(wordcraze.CACHE.$inputRow.find("input"),
                        function() {
                            var $this =jQuery(this);
                            if($this.val() == '') {
                                ret = $this;
                                return false;
                            }
                        });
            return ret;
        },
        
        /**
         * Forms word with the user's letter selection order and returns it.
         *
         **/
        fetchUsersWord : function() {
            var inputs = wordcraze.CACHE.$inputRow.find("input");
            var word = '';
            jQuery.each(inputs, function() {
                       word += jQuery(this).val();
                       });
            return word;
        },
        
        /**
         * Compares @param: wordArr with the correct words map @param: map. No Duplicates allowed.
         *
         **/
        fetchCorrectWords : function(wordArr, map) {
            var correctWordArr = [];
            for(var i in wordArr) {
                if( wordcraze.utils.notIn(wordArr[i], correctWordArr) && (wordArr[i] in map) ) {
                    correctWordArr.push(wordArr[i]);
                }
            }
            return correctWordArr;
        },
        
        /**
         * Highlights the DOM @element by giving it a flashing effect.
         *
         **/
        flash : function(elem, times) {
            if(times < 0) {
                return;
            }
            var $elem = jQuery(elem);
            $elem.addClass('yellow-bg');
                window.setTimeout(
                              function() {
                                  $elem.removeClass('yellow-bg');
                              },
                                  300);
        },
        
        /**
         * Prepends zeros to the given value @param: val if it does not meet the @param: minLength restriction.
         *
         **/
        prependZeros : function(val, minLength) {
            var str = String(val);
            if( str && str.length < 2) {
                return "0" + str;
            }
            return val;
        }
    },
    
    /**
     *
     * Word Fetcher.
    **/
    wordfetcher : {
        
        /**
         * Fetches random 5 lettered word from the five lettered words array.
         *
         *
        **/
        fetchRandomWord : function() {
            var limit = wordcraze.dictionary.getFiveLetteredWords().length - 1;
            var randIndex = Math.round(limit * Math.random());
            //console.log("Random Index generated: " + randIndex);
            return wordcraze.dictionary.getFiveLetteredWords()[randIndex];
        }
        
    },

    /**
    * Permutator: Contains core logic to permutate the 5 lettered word into 5, 4 and 3 lettered words.
    *
    *
    **/
    permutator: {


        Indices : function() {
            this.add = function(index) {
                this[String(index)] = true;
            }

            this.contains = function(index) {
                return this[String(index)];
            }

            this.copy = function() {
                var copy = {};
                for(var k in this) {
                    copy[k] = this[k];
                }
                return copy;
            }
        },

        WordHolder : function(word, indices) {
            this.word = word;
            this.indices = indices;
        },

        /***
         *
         * Generates permutations of the @param: word with the corresponding @param: wordLength and returns them in a list.
         * This takes generate all words approach and is not suitable to use with longer words.
         *
         * @Note Employs non-recursive fashion to generate the permutations.
         **/
        generatePermutations : function(word, length) {
            var stack = [],
                generatedWords = [],
                generateWordValues = [];

            if(!length || length < 1) {
                length = word.length;
            } else if(length > word.length) {
                length = value.length;
            }

            for(var j = 0; j < word.length; j++) {
                var indices = new wordcraze.permutator.Indices();
                indices.add(j);
                var letter = word.charAt(j);
                var letteredWord = new wordcraze.permutator.WordHolder(letter, indices);
                stack.push(letteredWord);

                if(letter.length == length) {
                    generatedWords.push(letteredWord);
                    generateWordValues.push(letteredWord.word)
                }

                while(stack.length > 0) {
                    var fixedWord = stack.pop();

                    for(var i = 0; i < word.length; i++) {

                        var fixedWordIndices = fixedWord.indices;
                        if(!(fixedWordIndices.contains(i))) {
                            var newWordVal = fixedWord.word + word.charAt(i);

                            var copiedIndices = fixedWord.indices.copy();
                            copiedIndices.add(i);

                            var newWord = new wordcraze.permutator.WordHolder(newWordVal, copiedIndices);

                            if(newWordVal.length == length) {
                                generatedWords.push(newWord);
                                generateWordValues.push(newWord.word)
                            }

                            stack.push(newWord);
                        }
                    }
                }
            }
            return generateWordValues;
        },
    
        /**
         * @deprecated Use the non-recursive function.
        *
         * Generates permutations of the @param: word with the corresponding @param: wordLength and returns them in a list.
        * This takes generate all words approach and is not suitable to use with longer words.
        *
        * @Note: Do not use a word of length 50, it will take a few years to complete.
        **/
        generatePermutationsRecursive : function(word, wordLength) {
        
            if(isNaN(wordLength)) {
                wordLength = word.length;
            }
        
            var generatedList = [];
            wordcraze.permutator._doGeneratePermutations(word, generatedList, wordLength);
            //console.log("Strings generated: " + generatedList.length);
        
            return generatedList;
        },

        _doGeneratePermutations : function(word, generatedList, wordLength) {
            for(var i = 0; i < word.length; i++) {
                wordcraze.permutator._doDoGeneratePermutations(word, [i], generatedList, wordLength);
            }
        },
    
        _doDoGeneratePermutations : function(word, fixedWordIndices, generatedList, wordLength) {
            fixedWord = wordcraze.permutator._buildFixedWord(word, fixedWordIndices);
            
            if(fixedWord.length == wordLength) {
                generatedList.push(fixedWord);
                //console.log("Generated word: " + fixedWord);
                return;
            }
            
            for(var i = 0; i < word.length; i++) {
                if(wordcraze.utils.notIn(i, fixedWordIndices)) {
                    var newWordIndices = wordcraze.permutator._appendToArray(fixedWordIndices, i);
                    
                    if(newWordIndices.length <= wordLength) {
                        wordcraze.permutator._doDoGeneratePermutations(word, newWordIndices, generatedList,
                                                                       wordLength);
                    } else {
                        break;
                    }
                    
                }
            }
            
        },

        /**
         * Generates words using the dictionary.
         * <br/>
         * i.e., This will not compute all the permutations of the word. Instead, when making the permutations of the word, it uses
         * dictionary to lookup the partially permutated word and if the dictionary's index contains the word, only then continues
         * with the word's further permuatation.
         *
         * E.g:
         * Dict Index for word 'camel':
         * ['c'] -> ['camel', 'candy', .....]
         * ['ca'] -> ['camel', 'camera', ....]
         * ['cam'] -> ['camel', 'camera', .....]
         * ['came'] -> ['camel', 'camera', .....]
         * ['camel'] -> ['camel', 'camels', .....]
         *
         * If @param word : camel
         *
         * When 'ml' is generated, it is looked up in the Dictionary index above and as there won't be any words with 'ml' in the index,
         * subsequent permutations of mle, mlc, .... will not be traversed. This saves some serious computation.
         *
         *
         * @param word
         * @param wordLength
         * @returns {Array}
         */
        generatePermutationsUsingDict : function(word, wordLength) {
            if(isNaN(wordLength)) {
                wordLength = word.length;
            }

            var generatedList = [];
            wordcraze.permutator._doGeneratePermutationsUsingDict(word, generatedList, wordLength);
            //console.log("Strings generated: " + generatedList.length);

            return generatedList;
        },

        _doGeneratePermutationsUsingDict : function(word, generatedList, wordLength) {
            for(var i = 0; i < word.length; i++) {
                wordcraze.permutator._doDoGeneratePermutationsUsingDict(word, [i], generatedList, wordLength);
            }
        },

        _doDoGeneratePermutationsUsingDict : function(word, fixedWordIndices, generatedList, wordLength) {
            fixedWord = wordcraze.permutator._buildFixedWord(word, fixedWordIndices);
            if(!wordcraze.dictionary.index[fixedWord]) {
                return;
            }

            if(fixedWord.length == wordLength) {
                generatedList.push(fixedWord);
                //console.log("Generated word: " + fixedWord);
                return;
            }

            for(var i = 0; i < word.length; i++) {
                if(wordcraze.utils.notIn(i, fixedWordIndices)) {
                    var newWordIndices = wordcraze.permutator._appendToArray(fixedWordIndices, i);

                    if(newWordIndices.length <= wordLength) {
                        wordcraze.permutator._doDoGeneratePermutationsUsingDict(word, newWordIndices, generatedList,
                            wordLength);
                    } else {
                        break;
                    }

                }
            }

        },
        
        _appendToArray : function(fixedWordIndices, i) {
            var retArr = [];
            for(var j = 0; j < fixedWordIndices.length; j++) {
                retArr.push(fixedWordIndices[j]);
            }
            retArr.push(i);
            return retArr;
        },
        
        _buildFixedWord : function(word, fixedWordIndices) {
            var fixedWord = '';
            for(var index in fixedWordIndices) {
                fixedWord += word.charAt(fixedWordIndices[index]);
            }
            
            return fixedWord;
            
        }
    
    },
    
    /**
     * Dictionary of words that are used to play the game.
     *
    **/
    dictionary : {

        /**
         * This is the Dictionary's index. The basic indexing in the dictionary is extended to hold a complete index of the word.
         * This index is updated every time wordcraze.dictionary.addWord(word) is invoked.
         *
         * <br/>
         *
         * When the wordcraze.dictionary.addWord('camel') is added, the index will be updated likewise:
         * index['c'] -> [camel,...]
         * index['ca'] -> [camel,...]
         * index['cam'] -> [camel,...]
         * index['came'] -> [camel,...]
         * index['camel'] -> [camel,...]
         *
         * E.g: End result after processing all words with 'c'.
         * Dict Index for word 'camel':
         * ['c'] -> ['camel', 'candy', .....]
         * ['ca'] -> ['camel', 'camera', ....]
         * ['cam'] -> ['camel', 'camera', .....]
         * ['came'] -> ['camel', 'camera', .....]
         * ['camel'] -> ['camel', 'camels', .....]
         */
        index : [],

        /**
         * Represents state of the dictionary. Is it completely built or not?
         */
        isBuilt : false,

        /**
         * Indexes the word and adds it to the dictionary.
         *
         * @param word
         */
        addWord : function(word) {
            // sanity check.
            if(word && typeof word === "string") {
                
                // Indexing word with all lengths.
                for(var i = 0; i <= word.length; i++) {
                    
                    var _indexWord = String(word.substring(0, i));
                    //console.log(wordcraze.dictionary.index[_indexWord])
                    
                    if(!wordcraze.dictionary.index[_indexWord] ||
                       typeof wordcraze.dictionary.index[_indexWord] != typeof Array()) {
                        wordcraze.dictionary.index[_indexWord] = [];
                    }
                    wordcraze.dictionary.index[_indexWord].push(word);
                }
            }
        },
        
        getThreeLetteredWords : function() {
            // Three Lettered words array. As it can be seen, this does not contain all the dictionary words for obvious reasons.
            return  [
                                           "ait", "alb", "ace", "act", "add", "aft", "age", "ago",
                                           "aid", "ail", "aim", "air", "aka", "all", "alp", "and", "ant",
                                           "any", "ape", "apt", "arc", "ark", "arm", "art", "ash", "ask",
                                           "ass", "ate", "axe", "are", "alt", "ard", "awn", "bad", "bag",
                                           "ban", "bat", "bay", "bed", "beg", "bel", "bet", "bid", "big",
                                           "bin", "bio", "bit", "bob", "bog", "bow", "box", "boy", "bra",
                                           "bug", "bum", "bun", "but", "buy", "bye", "bar", "bee", "bot",
                                           "cab", "cad", "can", "cap", "car", "cat", "cay", "cly", "cob",
                                           "cod", "cop", "cot", "cow", "coy", "cry", "cub", "cue", "cum",
                                           "cup", "cut", "cog", "col", "dab", "dam", "dan", "daw", "day",
                                           "den", "dew", "die", "dig", "dim", "dip", "dog", "don", "dot",
                                           "dry", "dub", "due", "duo", "dye", "dal", "dap", "dop", "ear",
                                           "eat", "eco", "eel", "egg", "ego", "elf", "elm", "end", "era",
                                           "erk", "eve", "eye", "eft", "eke", "ere", "fag", "fan",
                                           "far", "fat", "fax", "fay", "few", "fin", "fit", "fix", "flu",
                                           "fly", "fog", "for", "fox", "foy", "fro", "fry", "fun", "fur",
                                           "fid", "fie", "fub", "fug", "gag", "gap", "gas", "gay", "gee",
                                           "gel", "gem", "geo", "get", "gin", "gob", "god", "got", "goy",
                                           "gun", "gus", "gut", "guy", "gym", "gat", "gib", "gig", "had",
                                           "ham", "has", "hat", "hay", "hen", "her", "hew", "hid", "him",
                                           "hip", "his", "hit", "hog", "hop", "hot", "how", "hub", "hug",
                                           "hum", "hut", "ice", "icy", "ill", "imp", "ink", "inn", "ion",
                                           "ire", "irk", "its", "ivy", "iff", "ivi", "jab", "jam", "jar",
                                           "jaw", "jet", "jew", "jin", "job", "jog", "jot", "joy", "jut",
                                           "jib", "jow", "jug", "keg", "ket", "key", "kid", "kin", "kip",
                                           "kow", "kit", "lab", "lad", "lag", "lap", "law", "lay", "led",
                                           "leg", "let", "lew", "lid", "lie", "lin", "lip", "lit", "lob",
                                           "log", "lop", "lor", "lot", "low", "loy", "lea", "mad", "man",
                                           "map", "mat", "may", "mel", "men", "met", "mix", "mob", "mud",
                                           "mug", "mut", "mew", "mim", "mow", "nap", "net", "new", "nib",
                                           "nid", "nil", "nip", "nob", "nod", "non", "nor", "not", "now",
                                           "nun", "nut", "nim", "oak", "oat", "odd", "off", "oft", "oil",
                                           "oke", "old", "ole", "olm", "one", "opt", "orb", "ore", "our",
                                           "out", "owe", "owl", "own", "pad", "pal", "pan", "par", "pat",
                                           "paw", "pay", "pea", "peg", "pen", "pep", "pet", "pie", "pig",
                                           "pin", "pip", "pit", "ply", "pod", "pop", "pot", "pro", "pub",
                                           "put", "pug", "qis", "qat", "rad", "rag", "ram", "ran", "rap",
                                           "rat", "raw", "ray", "red", "rew", "rib", "rid", "rig", "rim",
                                           "rip", "rob", "rod", "rot", "row", "rub", "rum", "run", "rut",
                                           "rye", "ret", "sad", "sat", "sea", "see", "set", "sew", "sex",
                                           "she", "shy", "sib", "sin", "sip", "sir", "sit", "six", "ski",
                                           "sky", "sly", "sob", "son", "sow", "soy", "spa", "sue", "sum",
                                           "sun", "sye", "sal", "saw", "say", "tab", "tag", "tan", "tap",
                                           "tar", "tax", "tea", "ten", "thy", "tie", "tig", "tin", "tip",
                                           "taj", "taw", "ton", "tot", "tow", "toe", "too", "top", "toy",
                                           "try", "tub", "two", "urn", "urp", "use", "ure", "van", "veg",
                                           "vet", "vex", "via", "vig", "voe", "vow", "vis", "wag", "was",
                                           "wax", "way", "web", "wed", "wet", "who", "why", "wig", "win",
                                           "woe", "won", "yaw", "yes", "yew", "you", "yad", "zag", "zig",
                                           "zap", "zip", "zoo"
                                           ];
        },
        
        getFourLetteredWords : function() {
                // Four Lettered Words. As it can be seen, this does not contain all the dictionary words for obvious reasons.
            return [
                    "able", "aced", "aces", "ache", "achy", "acid", "acme",
                    "acne", "acts", "adds", "aged", "ages", "aids", "ails", "aims",
                    "airs", "airy", "alas", "alms", "also", "alts", "amid", "anal",
                    "anti", "ants", "anus", "apes", "apex", "aqua", "arch", "arcs",
                    "area", "arid", "aril", "arks", "arms", "army", "arts", "asks",
                    "atom", "auto", "aunt", "avid", "away", "awns", "axed", "axel",
                    "axis", "babe", "baby", "back", "bade", "bags", "bail", "bait",
                    "bake", "bald", "bale", "ball", "balm", "band", "bane", "bang",
                    "bank", "bans", "barb", "bard", "bare", "barf", "bark", "barn",
                    "bars", "base", "bash", "bask", "bass", "bate", "bath", "bats",
                    "bead", "beak", "beam", "bean", "bear", "beat", "beds", "beef",
                    "been", "beep", "beer", "bees", "begs", "bell", "belt", "bend",
                    "bent", "berg", "best", "beta", "bets", "bide", "bids", "bike",
                    "bill", "bind", "bird", "bite", "bits", "blew", "blob", "blot",
                    "blow", "blue", "blur", "boar", "boat", "body", "boil", "bold",
                    "boll", "bolt", "bomb", "bond", "bone", "boob", "book", "boom",
                    "boot", "bore", "born", "boss", "both", "bowl", "bows", "boys",
                    "bran", "brat", "buck", "buds", "bugs", "bulb", "bulk", "bull",
                    "bums", "bunk", "buns", "burp", "bush", "bust", "busy", "buys",
                    "byte", "cabs", "cafe", "cage", "cake", "calf", "call", "calm",
                    "came", "camp", "cans", "caps", "card", "care", "cars", "cart",
                    "cash", "cast", "cats", "cave", "cell", "cent", "chat", "chef",
                    "chew", "chin", "chip", "chop", "cite", "city", "clap", "claw",
                    "clay", "clip", "clot", "club", "clue", "coal", "coat", "cock",
                    "code", "cogs", "coil", "coin", "cold", "coma", "comb", "cook",
                    "cool", "cope", "cops", "copy", "core", "cork", "corn", "cost",
                    "cots", "cows", "crab", "cram", "crap", "crew", "crop", "crow",
                    "cube", "cubs", "cues", "cult", "cups", "curd", "cure", "cute",
                    "cuts", "dace", "daft", "dame", "damn", "damp", "dams", "dare",
                    "dark", "dart", "dash", "data", "date", "dawn", "days", "dead",
                    "deaf", "deal", "dean", "dear", "debt", "deck", "deed", "deep",
                    "deer", "defy", "demo", "dens", "deny", "desk", "dews", "dial",
                    "dibs", "dice", "dick", "died", "dies", "diet", "digs", "dine",
                    "dire", "dirk", "dirt", "disc", "dish", "disk", "diva", "dive",
                    "dock", "does", "dogs", "doll", "dome", "doom", "door", "dope",
                    "dorm", "dose", "dote", "doth", "dots", "dove", "down", "drag",
                    "draw", "drew", "drop", "drug", "drum", "drys", "dual", "duct",
                    "duel", "dues", "dull", "dumb", "dump", "dung", "dusk", "dust",
                    "duty", "dyes", "each", "earn", "ears", "ease", "east", "easy",
                    "eats", "echo", "edge", "edit", "eels", "eggs", "ells", "else",
                    "emit", "ends", "envy", "epic", "etch", "even", "ever", "eves",
                    "evil", "exam", "exit", "eyed", "eyes", "face", "fact", "fade",
                    "fags", "fail", "fain", "fair", "fake", "fall", "fame", "fans",
                    "fare", "farm", "fast", "fate", "fats", "fawn", "fear", "feat",
                    "feed", "feel", "fees", "feet", "fell", "felt", "fern", "file",
                    "fill", "film", "find", "fine", "fire", "firm", "fish", "fist",
                    "fits", "five", "flam", "flap", "flat", "flaw", "flee", "flew", "flip",
                    "flop", "flow", "foam", "foil", "fold", "folk", "fond", "font",
                    "food", "fool", "foot", "ford", "fork", "form", "foul", "free",
                    "frog", "from", "fuel", "full", "fume", "fund", "furs", "fury",
                    "fuse", "gags", "gain", "gait", "gala", "game", "gape", "gaps",
                    "gasp", "gave", "gear", "gels", "gems", "gene", "germ", "gets",
                    "ghee", "gibe", "gift", "gild", "gill", "gird", "girl", "give", "glad",
                    "glib", "glow", "glue", "goad", "goal", "goat", "gods", "goes",
                    "gold", "golf", "gone", "good", "goon", "gore", "grab", "gram",
                    "grew", "grey", "grid", "grim", "grip", "grow", "gull", "gulp",
                    "gums", "guns", "gush", "guts", "guys", "hack", "hade", "haft",
                    "hags", "hail", "hair", "hake", "hale", "half", "hall", "halo",
                    "halt", "hand", "hang", "hard", "hare", "hark", "harm", "harp",
                    "hate", "hats", "have", "hawk", "head", "heal", "heap", "hear",
                    "heat", "heed", "heel", "held", "hell", "help", "hens", "herb",
                    "herd", "here", "hero", "hide", "high", "hike", "hill", "hilt",
                    "hint", "hips", "hire", "hits", "hive", "hoar", "hogs", "hold",
                    "hole", "holy", "home", "hook", "hope", "hops", "horn", "host",
                    "hour", "hove", "huge", "hugs", "hump", "hung", "hunt", "hurt",
                    "husk", "huts", "hype", "icon", "idea", "idle", "idol", "inch",
                    "inks", "inns", "into", "ions", "irks", "iron", "itch", "item",
                    "jail", "jars", "java", "jaws", "jays", "jazz", "jeep", "jibe",
                    "jive", "jobs", "jogs", "join", "joke", "jots", "joys", "jump",
                    "junk", "jury", "just", "keen", "keep", "kept", "kern", "keys",
                    "kick", "kids", "kill", "kind", "king", "kiss", "kite", "kits",
                    "knee", "knew", "knit", "knob", "knot", "know", "labs", "lace",
                    "lack", "lads", "lady", "lags", "laid", "lair", "lake", "lamb",
                    "lamp", "land", "lane", "last", "late", "lava", "lawn", "laws",
                    "lays", "lazy", "lead", "leaf", "leak", "lean", "leap", "left",
                    "legs", "lend", "lens", "lent", "less", "lest", "lets", "liar",
                    "lice", "lick", "lied", "lies", "lift", "like", "limb", "lime",
                    "limp", "line", "link", "lion", "lips", "lire", "lisp", "list",
                    "live", "load", "loaf", "loam", "loan", "lobe", "lock", "loft",
                    "logo", "logs", "long", "look", "loot", "lord", "lore", "lose",
                    "loss", "lost", "lots", "loud", "love", "lows", "luck", "lump",
                    "lung", "lure", "lurk", "lust", "lute", "lyre", "made", "maid",
                    "mail", "main", "make", "male", "mall", "malt", "many", "maps",
                    "mark", "mars", "mart", "mask", "mass", "mate", "mats", "meal",
                    "mean", "meat", "meet", "mend", "menu", "mere", "mesh", "mild",
                    "milk", "mill", "mind", "mine", "mint", "miss", "mist", "mite",
                    "moan", "moat", "mobs", "mock", "mode", "mold", "mole", "mood",
                    "moon", "mops", "more", "most", "move", "mown", "much", "mule",
                    "muse", "mush", "musk", "must", "mute", "myth", "nail", "name",
                    "naps", "nave", "navy", "near", "neat", "neck", "need", "nerd",
                    "nest", "nets", "news", "next", "nice", "nine", "nits", "node",
                    "nods", "none", "noon", "nope", "norm", "nose", "note", "noun",
                    "nude", "numb", "nuts", "oaks", "oars", "oath", "oats", "obey",
                    "odds", "oils", "oily", "olds", "omit", "once", "ones", "only",
                    "onto", "ooze", "open", "opts", "oral", "ores", "ours", "oust",
                    "outs", "oval", "oven", "over", "owed", "owes", "owls", "owns",
                    "oxen", "pace", "pack", "pads", "page", "paid", "pail", "pain",
                    "pair", "pale", "palm", "pals", "pane", "pans", "pant", "park",
                    "part", "pass", "past", "path", "pats", "pave", "pawn", "paws",
                    "pays", "peak", "peal", "pear", "peas", "peck", "peek", "peel",
                    "peen", "peep", "peer", "pees", "pegs", "pens", "perk", "pets",
                    "pies", "pigs", "pile", "pimp", "pine", "pink", "pins", "pint",
                    "pipe", "pith", "pits", "pity", "plan", "play", "plea", "plot",
                    "plug", "plus", "poem", "poet", "pole", "poll", "pond", "pool",
                    "poor", "pork", "porn", "port", "pose", "posh", "post", "pots",
                    "pour", "pray", "prey", "puff", "puke", "pull", "pulp", "pump",
                    "pure", "push", "puts", "quit", "quiz", "race", "rack", "raft",
                    "rage", "rags", "raid", "rail", "rain", "ramp", "rams", "rank",
                    "rant", "rape", "raps", "rapt", "rate", "rats", "rave", "rays",
                    "read", "real", "reap", "rear", "reel", "rent", "rest", "ribs",
                    "rice", "rich", "ride", "rigs", "rims", "ring", "riot", "ripe",
                    "rips", "rise", "risk", "road", "roam", "roar", "robe", "robs",
                    "rock", "rode", "rods", "role", "roll", "roof", "room", "root",
                    "rope", "rose", "rots", "rove", "rows", "rubs", "ruby", "rude",
                    "ruin", "rule", "rung", "runs", "rush", "rust", "ruts", "sack",
                    "safe", "sage", "said", "sail", "sake", "sale", "salt", "same",
                    "sand", "sang", "sank", "save", "sawn", "says", "scam", "scan",
                    "scar", "scum", "seal", "seam", "seas", "seat", "sect", "seed",
                    "seek", "seem", "seen", "sees", "self", "sell", "semi", "send",
                    "sent", "sets", "sewn", "sews", "sexy", "shed", "shin", "ship",
                    "shoe", "shot", "show", "shut", "sick", "side", "sign", "silk",
                    "sing", "sink", "sins", "sips", "sirs", "site", "sits", "size",
                    "skew", "skid", "skin", "skip", "skis", "slab", "slam", "slap",
                    "slay", "sled", "slew", "slid", "slim", "slip", "slit", "slot",
                    "slow", "slut", "snap", "snip", "snit", "soak", "soap", "soar",
                    "sobs", "sock", "soda", "sofa", "soft", "soil", "sold", "sole",
                    "solo", "some", "song", "sons", "soon", "sore", "sort", "soul",
                    "soup", "sour", "sown", "sows", "spam", "span", "spat", "spin",
                    "spit", "spot", "spun", "stab", "stag", "star", "stay", "stem",
                    "step", "stir", "stop", "such", "suck", "sued", "sues", "suit",
                    "sums", "sung", "sunk", "suns", "sure", "surf", "swam", "swap",
                    "sway", "swim", "sync", "tabs", "tact", "tags", "tail", "take",
                    "tale", "talk", "tall", "tame", "tank", "tape", "taps", "task",
                    "taxi", "teak", "team", "tear", "teen", "tell", "tend", "tens",
                    "term", "test", "text", "than", "that", "them", "then", "they",
                    "thin", "this", "thug", "thus", "tick", "tide", "tidy", "tied",
                    "tier", "ties", "tile", "till", "tilt", "time", "tins", "tint",
                    "tiny", "tips", "tire", "tits", "toad", "toes", "toil", "told",
                    "toll", "tomb", "tone", "took", "tool", "tops", "tore", "torn",
                    "tour", "tout", "town", "toys", "trap", "tray", "tree", "trim",
                    "trip", "trod", "true", "tube", "tubs", "tuck", "tune", "turf",
                    "turn", "twin", "type", "ugly", "undo", "unit", "unto", "upon",
                    "urea", "urge", "urns", "used", "user", "uses", "vain", "vamp",
                    "vans", "vary", "vast", "veil", "vein", "vent", "verb", "very",
                    "vest", "vibe", "view", "vile", "vote", "vows", "wage", "wait",
                    "wake", "walk", "wall", "want", "ward", "warm", "wars", "wart",
                    "wary", "wash", "wave", "ways", "weak", "wear", "webs", "weds",
                    "weed", "weep", "well", "welt", "went", "wept", "were", "west",
                    "wets", "what", "when", "whet", "whip", "whom", "wide", "wife",
                    "wigs", "wild", "wile", "will", "wind", "wine", "wing", "wink",
                    "wins", "wipe", "wire", "wise", "wish", "with", "wits", "woke",
                    "wolf", "womb", "wood", "wool", "wore", "worm", "worn", "wrap",
                    "wren", "yaks", "yank", "yard", "yarn", "yawn", "yaws", "year",
                    "yell", "yews", "yoke", "your", "zaps", "zeal", "zero", "zest",
                    "zips", "zone", "zoom", "zoon"
                    ];
            
        },
        
        
        getFiveLetteredWords : function() {
            //Five Lettered Words Array. As it can be seen, this does not contain all the dictionary words for obvious reasons.
            return [
                    "abhor",

                    "abide",

                    "ables",

	"abort",

	"about",

	"above",

	"abuse",

	"abyss",

	"acids",

	"acorn",

	"acted",

	"actor",

	"acute",

	"adage",

	"adapt",

	"added",

	"adder",

	"admit",

	"adopt",

	"adore",

	"adult",

	"affix",

	"after",

	"again",

	"agent",

	"agony",

	"agree",

	"ahead",

	"aided",

	"ailed",

	"aimed",

	"aired",

	"aisle",

	"alarm",

	"alert",

	"alias",

	"alien",

	"align",

	"alike",

	"alive",

	"alley",

	"allot",

	"allow",

	"alone",

	"along",

	"aloof",

	"alter",

	"among",

	"angel",

	"anger",

	"angle",

	"angry",

	"apart",

	"apple",

	"apply",

	"apron",

	"aptly",

	"arena",

	"ariel",

	"arise",

	"armed",

	"array",

	"arrow",

	"ashes",

	"aside",

	"asked",

	"asset",

	"atoms",

	"attic",

	"audio",

	"audit",

	"aunts",

	"aunty",

	"avoid",

	"await",

	"awake",

	"award",

	"aware",

	"awful",

	"awoke",

	"babes",

	"badge",

	"badly",

	"bails",

	"baits",

	"baked",

	"baker",

	"bakes",

	"baldy",

	"balls",

	"bally",

	"banal",

	"bands",

	"bangs",

	"banks",

	"barks",

	"barns",

	"based",

	"bases",

	"basic",

	"basin",

	"basis",

	"batch",

	"bates",

	"baths",

	"bazar",

	"beach",

	"beams",

	"beans",

	"beard",

	"beast",

	"beats",

	"beers",

	"began",

	"begin",

	"begun",

	"being",

	"below",

	"belts",

	"bench",

	"berth",

	"bikes",

	"binds",

	"bingo",

	"birds",

	"birks",

	"birth",

	"bises",

	"bison",

	"bitch",

	"biter",

	"bites",

	"black",

	"blade",

	"blame",

	"blank",

	"blare",

	"blast",

	"blate",

	"blats",

	"bleak",

	"blend",

	"bless",

	"blind",

	"blink",

	"bliss",

	"block",

	"blood",

	"bloom",

	"blown",

	"blows",

	"blues",

	"bluff",

	"board",

	"boast",

	"boats",

	"bogus",

	"boils",

	"bolds",

	"bolls",

	"bombs",

	"bonds",

	"bones",

	"bonus",

	"boobs",

	"books",

	"boost",

	"booth",

	"boots",

	"booty",

	"bored",

	"borne",

	"bosom",

	"bound",

	"bowed",

	"bowls",

	"boxed",

	"boxes",

	"braid",

	"brail",

	"brain",

	"brake",

	"brand",

	"brass",

	"brats",

	"brave",

	"brawl",

	"brawn",

	"bread",

	"break",

	"breed",

	"brews",

	"bribe",

	"brick",

	"bride",

	"brief",

	"brine",

	"bring",

	"brink",

	"brisk",

	"broad",

	"broke",

	"brown",

	"brush",

	"brusk",

	"bucks",

	"buddy",

	"bugle",

	"build",

	"built",

	"bulbs",

	"bulks",

	"bulky",

	"bulls",

	"bully",

	"bumpy",

	"bunch",

	"bunny",

	"burns",

	"burnt",

	"burps",

	"burst",

	"buses",

	"busks",

	"busts",

	"busty",

	"buyer",

	"bytes",

	"cabin",

	"cache",

	"caddy",

	"cadet",

	"cadge",

	"caged",

	"cages",

	"cakes",

	"calls",

	"calms",

	"camel",

	"camps",

	"canal",

	"candy",

	"canes",

	"caped",

	"carbs",

	"cards",

	"cared",

	"cares",

	"cargo",

	"carol",

	"carom",

	"carry",

	"carts",

	"carve",

	"cased",

	"cases",

	"caste",

	"casts",

	"catch",

	"cause",

	"cease",

	"celeb",

	"cello",

	"cells",

	"chair",

	"chalk",

	"champ",

	"chaos",

	"charm",

	"chart",

	"chase",

	"chats",

	"cheap",

	"cheat",

	"check",

	"cheek",

	"cheer",

	"chefs",

	"chess",

	"chest",

	"chews",

	"chewy",

	"chick",

	"chief",

	"child",

	"chill",

	"choir",

	"choke",

	"chord",

	"chose",

	"cigar",

	"cites",

	"claim",

	"clamp",

	"claps",

	"class",

	"claws",

	"clays",

	"clean",

	"clear",

	"clerk",

	"click",

	"cliff",

	"climb",

	"cling",

	"clips",

	"clits",

	"clock",

	"clomb",

	"clone",

	"close",

	"cloth",

	"clots",

	"cloud",

	"clove",

	"clown",

	"clubs",

	"clues",

	"clung",

	"coach",

	"coact",

	"coals",

	"coast",

	"coats",

	"cobra",

	"cocks",

	"codec",

	"coded",

	"coden",

	"coder",

	"codes",

	"coins",

	"colds",

	"color",

	"combo",

	"comes",

	"comet", "comic",

	"comma",

	"coned",

	"cones",

	"cooks",

	"cools",

	"coped",

	"copes",

	"coral",

	"cords",

	"cored",

	"corks",

	"costs",

	"couch",

	"cough",

	"could",

	"count",

	"court",

	"cover",

	"covet",

	"crabs",

	"crack",

	"craft",

	"cramp",

	"crane",

	"crank",

	"crash",

	"crate",

	"crave",

	"crawl",

	"craws",

	"craze",

	"crazy",

	"cream",

	"creed",

	"creep",

	"crept",

	"crest",

	"cried",

	"cries",

	"crime",

	"crisp",

	"cross",

	"crowd",

	"crown",

	"crows",

	"crude",

	"cruel",

	"crush",

	"crust",

	"crypt",

	"cubed",

	"cubes",

	"cubic",

	"cunts",

	"cupid",

	"curds",

	"cured",

	"cures",

	"curls",

	"curly",

	"curry",

	"curse",

	"curve",

	"curvy",

	"cuter",

	"cutie",

	"cycle",

	"cyder",

	"cylix",

	"cyton",

	"daces",

	"daddy",

	"daily",

	"dairy",

	"daisy",

	"dales",

	"damns",

	"damps",

	"dance",

	"dared",

	"dares",

	"darks",

	"darns",

	"darts",

	"dated",

	"dates",

	"daunt",

	"dauts",

	"dawed",

	"dawns",

	"dazed",

	"deals",

	"dealt",

	"death",

	"debit",

	"debts",

	"debug",

	"debut",

	"decay",

	"decks",

	"decor",

	"decoy",

	"deeds",

	"deeps",

	"deers",

	"defer",

	"delay",

	"delis",

	"delta",

	"demob",

	"denes",

	"denim",

	"dense",

	"dents",

	"depth",

	"deray",

	"derma",

	"derms",

	"desks",

	"deter",

	"detox",

	"deuce",

	"devil",

	"dewan",

	"dewed",

	"dials",

	"diary",

	"diced",

	"dices",

	"dicks",

	"dicty",

	"diets",

	"digit",

	"diked",

	"dikes",

	"dildo",

	"dimly",

	"diner",

	"dines",

	"diode",

	"dirts",

	"dirty",

	"disco",

	"discs",

	"disks",

	"ditch",

	"dites",

	"ditto",

	"divas",

	"dived",

	"dives",

	"docks",

	"dodge",

	"doing",

	"doled",

	"dolls",

	"donor",

	"doors",

	"doped",

	"dopes",

	"dosed",

	"doses",

	"doubt",

	"dowry",

	"dozen",

	"draft",

	"drags",

	"drail",

	"drain",

	"drama",

	"drape",

	"drawn",

	"dread",

	"dream",

	"dress",

	"dried",

	"dries",

	"drift",

	"drill",

	"drink",

	"drive",

	"droll",

	"drops",

	"drove",

	"drown",

	"drugs",

	"drums",

	"drunk",

	"dryer",

	"ducks",

	"ducts",

	"dudes",

	"duels",

	"duets",

	"dummy",

	"dumps",

	"duped",

	"dusky",

	"dusty",

	"dwarf",

	"dwell",

	"dwelt",

	"dying",

	"eager",

	"eagle",

	"eared",

	"early",

	"earns",

	"earth",

	"eased",

	"eases",

	"eaten",

	"ebony",

	"echos",

	"edges",

	"edify",

	"edits",

	"eight",

	"eject",

	"elate",

	"elbow",

	"elder",

	"elect",

	"embed",

	"emits",

	"empty",

	"enact",

	"ended",

	"enemy",

	"enjoy",

	"enrol",

	"enter",

	"entry",

	"enzym",

	"epics",

	"equal",

	"equip",

	"erase",

	"erect",

	"erode",

	"error",

	"erupt",

	"essay",

	"ethic",

	"evade",

	"evens",

	"event",

	"every",

	"evils",

	"exact",

	"exalt",

	"exams",

	"excel",

	"exert",

	"exile",

	"exist",

	"exits",

	"expel",

	"extol",

	"extra",

	"exude",

	"fable",

	"faced",

	"faces",

	"facet",

	"facts",

	"faded",

	"fades",

	"fagot",

	"fails",

	"faint",

	"fairs",

	"fairy",

	"faith",

	"faked",

	"fakes",

	"falls",

	"false",

	"fancy",

	"fangs",

	"fared",

	"fares",

	"farle",

	"farms",

	"farts",

	"fatal",

	"fates",

	"faugh",

	"fauld",

	"fault",

	"fauna",

	"favor",

	"fawns",

	"fears",

	"feast",

	"feats",

	"feeds",

	"feels",

	"fells",

	"felon",

	"felts", "fence",

	"fends",

	"ferns",

	"fetch",

	"feuds",

	"fever",

	"fewer",

	"fiber",

	"fibre",

	"fifth",

	"fifty",

	"fight",

	"filed",

	"files",

	"fills",

	"films",

	"filmy",

	"filth",

	"final",

	"finds",

	"fines",

	"fired",

	"fires",

	"firms",

	"firns",

	"first",

	"fiscs",

	"fishy",

	"fists",

	"fixed",

	"fixer",

	"fixes",

	"flack",

	"flags",

	"flair",

	"flake",

	"flame",

	"flaps",

	"flare",

	"flash",

	"flask",

	"flats",

	"flaws",

	"fleet",

	"flesh",

	"flews",

	"flick",

	"flies",

	"fling",

	"flips",

	"flirt",

	"float",

	"flock",

	"flood",

	"floor",

	"flops",

	"flour",

	"flout",

	"flown",

	"flows",

	"flues",

	"fluid",

	"fluke",

	"flush",

	"flute",

	"fluty",

	"flyer",

	"foams",

	"foamy",

	"focal",

	"focus",

	"foils",

	"folds",

	"folks",

	"fonds",

	"fonts",

	"foods",

	"fools",

	"foots",

	"foray",

	"force",

	"forks",

	"forms",

	"forty",

	"forum",

	"fouls",

	"found",

	"foxes",

	"frail",

	"frame",

	"frank",

	"fraud",

	"freak",

	"freed",

	"frees",

	"fresh",

	"fried",

	"fries",

	"frisk",

	"frock",

	"frogs",

	"front",

	"frost",

	"frown",

	"fruit",

	"fuels",

	"fully",

	"fumed",

	"fumes",

	"funds",

	"fungi",

	"funny",

	"fused",

	"fuses",

	"gains",

	"gales",

	"galop",

	"gamer",

	"games",

	"gamma",

	"gangs",

	"gapes",

	"gasps",

	"gates",

	"gauge",

	"gazed",

	"gazes",

	"gears",

	"geeks",

	"genes",

	"genre",

	"gents",

	"germs",

	"ghost",

	"giant",

	"gifts",

	"gilds",

	"gills",

	"girds",

	"girls",

	"girly",

	"gists",

	"given",

	"giver",

	"gives",

	"gizmo",

	"glade",

	"glair",

	"gland",

	"glare",

	"glass",

	"glide",

	"globe",

	"glory",

	"goals",

	"goats",

	"godly",

	"going",

	"golfs",

	"goods",

	"goody",

	"goons",

	"goose",

	"gored",

	"gowns",

	"grabs",

	"grace",

	"grade",

	"grain",

	"grams",

	"grand",

	"grant",

	"grape",

	"graph",

	"grasp",

	"grass",

	"grate",

	"grave",

	"graze",

	"great",

	"greed",

	"green",

	"greet",

	"grief",

	"grind",

	"grips",

	"groan",

	"groom",

	"gross",

	"group",

	"grove",

	"grown",

	"grunt",

	"guard",

	"guess",

	"guest",

	"guild",

	"guilt",

	"gulps",

	"gushy",

	"habit",

	"hacks",

	"hails",

	"hairs",

	"hairy",

	"haled",

	"hales",

	"halls",

	"halts",

	"hands",

	"handy",

	"hangs",

	"hanky",

	"happy",

	"hared",

	"hares",

	"harsh",

	"haste",

	"hatch",

	"hated",

	"hates",

	"haunt",

	"haven",

	"havoc",

	"heads",

	"heals",

	"heaps",

	"heard",

	"hears",

	"heart",

	"heath",

	"heats",

	"heavy",

	"hedge",

	"heeds",

	"heels",

	"hefty",

	"heirs",

	"helix",

	"hello",

	"helps",

	"hence", "herbs",

	"herds",

	"hides",

	"highs",

	"hiked",

	"hikes",

	"hills",

	"hilly",

	"hinds",

	"hinge",

	"hints",

	"hired",

	"hires",

	"hitch",

	"hived",

	"hives",

	"hoard",

	"hoars",

	"hobby",

	"holds",

	"holed",

	"holes",

	"homes",

	"honor",

	"hoods",

	"hooks",

	"hoped",

	"hopes",

	"horns",

	"horny",

	"horse",

	"hosts",

	"hotel",

	"hound",

	"hours",

	"house",

	"hover",

	"hubby",

	"human",

	"humor",

	"humps",

	"hunks",

	"hunts",

	"hurry",

	"hurts",

	"husks",

	"husky",

	"hymen",

	"hymns",

	"hyped",

	"icons",

	"ideal",

	"ideas",

	"idiom",

	"idiot",

	"idled",

	"idles",

	"idols",

	"igloo",

	"image",

	"impel",

	"imply",

	"inane",

	"inapt",

	"index",

	"inlet",

	"inner",

	"input",

	"inset",

	"inter",

	"intro",

	"ionic",

	"irked",

	"issue",

	"itchy",

	"items",

	"ivory",

	"jager",

	"jails",

	"jeans",

	"jeeps",

	"jeers",

	"jerks",

	"jibed",

	"jibes",

	"jived",

	"joins",

	"joint",

	"joked",

	"joker",

	"jokes",

	"jolly",

	"judge",

	"juice",

	"juicy",

	"jumbo",

	"jumps",

	"junks",

	"karts",

	"keens",

	"keeps",

	"kerns",

	"keyed",

	"kicks",

	"kills",

	"kinds",

	"kings",

	"kinky",

	"kited",

	"kites",

	"knack",

	"kneel",

	"knees",

	"knife",

	"knits",

	"knobs",

	"knock",

	"knots",

	"known",

	"knows",

	"kraft",

	"krone",

	"kudus",

	"label",

	"laced",

	"laces",

	"lacks",

	"lakes",

	"lambs",

	"lamed",

	"lames",

	"lamps",

	"lands",

	"lanes",

	"lapse",

	"large",

	"larks",

	"larva",

	"laser",

	"lasts",

	"latch",

	"later",

	"lauds",

	"laugh",

	"lawns",

	"layer",

	"leach",

	"leads",

	"leafs",

	"leafy",

	"leaks",

	"leaky",

	"leans",

	"leaps",

	"learn",

	"lease",

	"least",

	"leave",

	"ledge",

	"lefts",

	"legal",

	"lemon",

	"lends",

	"level",

	"lever",

	"liars",

	"licks",

	"lifts",

	"light",

	"liked",

	"likes",

	"limbs",

	"limit",

	"limps",

	"lines",

	"links",

	"lions",

	"lisps",

	"liter",

	"litre",

	"lived", "liver",

	"lives",

	"loads",

	"loafs",

	"loans",

	"local",

	"locks",

	"locus",

	"lodge",

	"lofts",

	"lofty",

	"logic",

	"logos",

	"longs",

	"looks",

	"loops",

	"loopy",

	"loose",

	"loots",

	"lords",

	"lorry",

	"loser",

	"loses",

	"lossy",

	"lotus",

	"lousy",

	"loved",

	"lover",

	"loves",

	"lower",

	"loyal",

	"lucid",

	"lucks",

	"lucky",

	"lumps",

	"lunar",

	"lunch",

	"lungs",

	"lured",

	"lures",

	"lusts",

	"lying",

	"lymph",

	"maced",

	"macer",

	"maces",

	"macho",

	"macro",

	"madam",

	"madly",

	"magic",

	"maids",

	"mails",

	"mains",

	"major",

	"maker",

	"makes",

	"males",

	"malts",

	"malty",

	"maned",

	"manes",

	"mango",

	"manly",

	"maple",

	"march",

	"marks",

	"marry",

	"marsh",

	"marts",

	"masks",

	"mason",

	"match",

	"mated",

	"mates",

	"meals",

	"means",

	"meant",

	"meats",

	"medal",

	"media",

	"meets",

	"melon",

	"melts",

	"mends",

	"menus",

	"mercy",

	"merit",

	"meshy",

	"metal",

	"meter",

	"metre",

	"metro",

	"micro",

	"midst",

	"might",

	"miles",

	"milky",

	"mills",

	"mimic",

	"minds",

	"mined",

	"mines",

	"minor",

	"mints",

	"minus",

	"mirks",

	"miser",

	"mists",

	"misty",

	"mites",

	"mixed",

	"mixer",

	"mixes",

	"moans",

	"mocks",

	"model",

	"modes",

	"moist",

	"molds",

	"moles",

	"money",

	"monks",

	"month",

	"moods",

	"moody",

	"moral",

	"moron",

	"motel",

	"moths",

	"motif",

	"motor",

	"mould",

	"mouse",

	"mouth",

	"moved",

	"moves",

	"movie",

	"mufti",

	"mules",

	"mummy",

	"mumps",

	"munch",

	"music",

	"musts",

	"muted",

	"mutes",

	"myths",

	"nails",

	"naive",

	"naked",

	"named",

	"names",

	"nares",

	"nasal",

	"nasty",

	"naval",

	"navel",

	"necks",

	"needs",

	"needy",

	"nerds",

	"nerve",

	"nests",

	"never",

	"newer",

	"newly",

	"nicer",

	"niche",

	"niece",

	"nifty",

	"night",

	"nills",

	"nines",

	"ninth",

	"nites",

	"noble",

	"nodal",

	"nodes",

	"noirs",

	"noisy",

	"nomad",

	"nones",

	"norms",

	"north",

	"nosed",

	"noses",

	"notch",

	"noted",

	"notes",

	"nouns",

	"novel",

	"nudes",

	"nudge",

	"nuked",

	"nulls",

	"numbs",

	"nurse",

	"nylon",

	"nymph",

	"oared",

	"oasis",

	"oasts",

	"oaths",

	"obese",

	"obeys",

	"occur",

	"ocean",

	"octal",

	"octet",

	"oddly",

	"odors",

	"odour",

	"offer",

	"often",

	"oiled",

	"olden",

	"older",

	"olive",

	"omits",

	"onion",

	"oozed",

	"oozes",

	"opens",

	"opera",

	"opted",

	"orals",

	"orbit",

	"order",

	"organ",

	"other",

	"ought",

	"ounce",

	"ousts",

	"outer",

	"ovals",

	"ovary",

	"overs",

	"ovule",

	"owing",

	"owned",

	"owner", "ozone",

	"paced",

	"pacer",

	"paces",

	"packs",

	"paddy",

	"paged",

	"pager",

	"pages",

	"pails",

	"pains",

	"paint",

	"pairs",

	"pales",

	"palms",

	"panda",

	"panel",

	"pangs",

	"panic",

	"pants",

	"panty",

	"paper",

	"parks",

	"parse",

	"parts",

	"party",

	"pasts",

	"patch",

	"paved",

	"paves",

	"peace",

	"peach",

	"peaks",

	"pearl",

	"pears",

	"pecks",

	"pedal",

	"peeks",

	"peels",

	"peeps",

	"peers",

	"penal",

	"penis",

	"peril",

	"perks",

	"perky",

	"petal",

	"phase",

	"phone",

	"photo",

	"picks",

	"piece",

	"piled",

	"pills",

	"pilot",

	"pimps",

	"pinch",

	"pined",

	"pines",

	"pints",

	"piped",

	"pipes",

	"pitch",

	"piths",

	"pithy",

	"pivot",

	"pixel",

	"pizza",

	"place",

	"plain",

	"plane",

	"plank",

	"plans",

	"plant",

	"plate",

	"plays",

	"plaza",

	"plead",

	"pleas",

	"plier",

	"plots",

	"pluck",

	"plumb",

	"plume",

	"plump",

	"poems",

	"poets",

	"point",

	"poise",

	"poked",

	"poker",

	"polar",

	"poles",

	"polls",

	"pools",

	"pored",

	"porks",

	"porky",

	"porno",

	"porns",

	"porny",

	"posed",

	"poses",

	"pouch",

	"pound",

	"pours",

	"power",

	"prank",

	"prawn",

	"prays",

	"press",

	"preys",

	"price",

	"prick",

	"pride",

	"prill",

	"print",

	"prior",

	"prize",

	"probe",

	"proms",

	"prone",

	"proof",

	"proud",

	"prove",

	"proxy",

	"prune",

	"psalm",

	"pubic",

	"puked",

	"pukes",

	"pulls",

	"pulps",

	"pulpy",

	"pulse",

	"pumps",

	"punch",

	"pupil",

	"purse",

	"pussy",

	"quack",

	"quads",

	"quail",

	"quake",

	"quant",

	"quest",

	"queue",

	"quick",

	"quiet",

	"raced",

	"racer",

	"races",

	"racks",

	"radar",

	"radii",

	"radio",

	"rafts",

	"raged",

	"raids",

	"rails",

	"rains",

	"rainy",

	"raise",

	"raked",

	"rakes",

	"rally",

	"ramps",

	"ranks",

	"rants",

	"raped",

	"raper",

	"rapes",

	"rapid",

	"rarer",

	"rated",

	"rates",

	"raved",

	"react",

	"reads",

	"ready",

	"realm",

	"reals",

	"reams",

	"reaps",

	"rears",

	"rebel",

	"recap",

	"redly",

	"reeds",

	"reefs",

	"reels",

	"refer",

	"rehab",

	"reign",

	"relax",

	"relay",

	"relic",

	"remix",

	"renew",

	"rents",

	"repay",

	"repel",

	"reply",

	"reset",

	"rests",

	"retry",

	"reuse",

	"rhyme",

	"riced",

	"rices",

	"rider",

	"rides",

	"ridge",

	"rifle",

	"right",

	"rigid",

	"riley",

	"rings",

	"riots",

	"riped",

	"ripes",

	"risen",

	"rises",

	"risks",

	"rival",

	"river",

	"roads",

	"roams",

	"roars",

	"roast",

	"robed",

	"robes",

	"robot",

	"rocks",

	"rocky",

	"roger",

	"rogue",

	"roles",

	"rolls",

	"roofs",

	"rooms",

	"roots",

	"roped",

	"ropes",

	"roses",

	"rotor",

	"rouge",

	"rough",

	"round",

	"roups",

	"rowed",

	"royal",

	"ruins",

	"ruled",

	"ruler",

	"rules",

	"rumor",

	"rural",

	"rusts",

	"rusty",

	"sable",

	"sabot",

	"sacks",

	"sades",

	"sadly",

	"safer",

	"sages",

	"sails",

	"saint",

	"sakes",

	"salad",

	"sales",

	"salts",

	"salty",

	"sands",

	"saree",

	"sassy",

	"sauce",

	"saucy",

	"sauna",

	"saved",

	"saver",

	"saves",

	"savor",

	"sawed",

	"scale",

	"scalp",

	"scams",

	"scans",

	"scare",

	"scars",

	"scary",

	"scene",

	"scent",

	"scold",

	"scoop",

	"scope",

	"score",

	"scrap",

	"screw",

	"scrub",

	"seals", "seats",

	"sects",

	"seeds",

	"seeks",

	"seems",

	"seize",

	"selfs",

	"sells",

	"semen",

	"sends",

	"sense",

	"serum",

	"serve",

	"setup",

	"seven",

	"sever",

	"sewed",

	"sexes",

	"shack",

	"shade",

	"shaft",

	"shake",

	"shall",

	"shalt",

	"shame",

	"shape",

	"share",

	"shark",

	"sharn",

	"sharp",

	"shave",

	"shawn",

	"sheds",

	"sheep",

	"sheer",

	"sheet",

	"shelf",

	"shell",

	"sherd",

	"shift",

	"shine",

	"shiny",

	"ships",

	"shirk",

	"shirt",

	"shits",

	"shive",

	"shock",

	"shoes",

	"shook",

	"shoot",

	"shops",

	"shore",

	"short",

	"shots",

	"shout",

	"shove",

	"shown",

	"shows",

	"shred",

	"shrub",

	"shunt",

	"shuts",

	"sicks",

	"sided",

	"sides",

	"sighs",

	"sight",

	"signs",

	"silks",

	"silky",

	"silly",

	"since",

	"sinks",

	"siren",

	"sited",

	"sites",

	"sixes",

	"sixth",

	"sixty",

	"sized",

	"sizes",

	"skate",

	"skees",

	"skews",

	"skids",

	"skier",

	"skies",

	"skill",

	"skims",

	"skins",

	"skips",

	"skirt",

	"skull",

	"slabs",

	"slack",

	"slags",

	"slams",

	"slang",

	"slant",

	"slaps",

	"slate",

	"slave",

	"slays",

	"sleek",

	"sleep",

	"sleet",

	"slept",

	"slice",

	"slick",

	"slide",

	"slims",

	"sling",

	"slink",

	"slips",

	"slits",

	"sloop",

	"slope",

	"sloth",

	"slots",

	"slows",

	"slums",

	"slung",

	"slurp",

	"slush",

	"sluts",

	"smack",

	"small",

	"smart",

	"smear",

	"smell",

	"smelt",

	"smile",

	"smirk",

	"smoke",

	"smoky",

	"snack",

	"snail",

	"snake",

	"snaps",

	"snare",

	"snark",

	"sneak",

	"sneer",

	"snell",

	"snipe",

	"snips",

	"snits",

	"snobs",

	"snore",

	"snowy",

	"snubs",

	"soaks",

	"soaps",

	"soapy",

	"soars",

	"soave",

	"sober",

	"socks",

	"sofas",

	"softs",

	"softy",

	"soils",

	"solar",

	"soled",

	"soles",

	"solid",

	"solve",

	"songs",

	"sooth",

	"soots",

	"soppy",

	"sorer",

	"sores",

	"sorry",

	"sorts",

	"souls",

	"sound",

	"soups",

	"soupy",

	"sours",

	"south",

	"sowed",

	"space",

	"spacy",

	"spade",

	"spail",

	"spait",

	"spake",

	"spale",

	"spams",

	"spang",

	"spank",

	"spare",

	"spark",

	"spate",

	"spawn",

	"speak",

	"spear",

	"speck",

	"specs",

	"speed",

	"speer",

	"spell",

	"spelt",

	"spend",

	"spent",

	"sperm",

	"spice",

	"spicy",

	"spies",

	"spike",

	"spill",

	"spilt",

	"spine",

	"spins",

	"spite",

	"spits",

	"splat",

	"split",

	"spoil",

	"spoke",

	"spoof",

	"spoon",

	"sport",

	"spots",

	"spout",

	"spray",

	"spree",

	"spurs",

	"squad",

	"stabs",

	"stack",

	"staff",

	"stags",

	"staid",

	"staig",

	"stain",

	"stair",

	"stake",

	"stale",

	"stalk", "stall",

	"stamp",

	"stand",

	"stane",

	"stank",

	"stare",

	"stark",

	"stars",

	"start",

	"stash",

	"state",

	"stats",

	"stays",

	"stead",

	"steak",

	"steal",

	"steam",

	"steel",

	"steep",

	"stems",

	"steps",

	"stern",

	"stich",

	"stick",

	"stied",

	"stiff",

	"still",

	"sting",

	"stink",

	"stirp",

	"stirs",

	"stock",

	"stoke",

	"stole",

	"stone",

	"stood",

	"stool",

	"stoop",

	"stops",

	"store",

	"storm",

	"story",

	"stout",

	"stove",

	"stows",

	"strap",

	"straw",

	"stray",

	"strip",

	"stubs",

	"stuck",

	"studs",

	"study",

	"stuff",

	"stums",

	"stunt",

	"style",

	"sucks",

	"sugar",

	"suing",

	"suite",

	"suits",

	"sulks",

	"sunny",

	"super",

	"surer",

	"surfs",

	"surge",

	"swage",

	"swail",

	"swale",

	"swamp",

	"swang",

	"swank",

	"swans",

	"swaps",

	"sware",

	"swarm",

	"swear",

	"sweat",

	"sweep",

	"sweet",

	"swell",

	"swept",

	"swift",

	"swigs",

	"swims",

	"swine",

	"swing",

	"swink",

	"swipe",

	"swirl",

	"swish",

	"sword",

	"swore",

	"sworn",

	"swung",

	"syren",

	"syrup",

	"table",

	"taces",

	"tacet",

	"tacts",

	"tails",

	"taint",

	"taken",

	"taker",

	"takes",

	"talcs",

	"tales",

	"talks",

	"talky",

	"tamed",

	"tames",

	"tanks",

	"taped",

	"tapes",

	"tarot",

	"tasks",

	"taste",

	"tasty",

	"taunt",

	"tauts",

	"taxed",

	"taxes",

	"teach",

	"teals",

	"teams",

	"tears",

	"tease",

	"teats",

	"teels",

	"teens",

	"teeth",

	"tells",

	"tempt",

	"tends",

	"tense",

	"tenth",

	"tents",

	"terms",

	"terns",

	"terse",

	"tests",

	"testy",

	"texts",

	"thank",

	"thaws",

	"theft",

	"their",

	"theme",

	"there",

	"therm",

	"these",

	"thick",

	"thief",

	"thigh",

	"thine",

	"thing",

	"think",

	"thins",

	"third",

	"thong",

	"thorn",

	"thorp",

	"those",

	"thraw",

	"three",

	"threw",

	"throb",

	"throw",

	"thugs",

	"thumb",

	"thump",

	"ticks",

	"tidal",

	"tided",

	"tides",

	"tiers",

	"tiger",

	"tight", "tiled",

	"tiler",

	"tiles",

	"tilth",

	"tilts",

	"timed",

	"timer",

	"times",

	"timid",

	"tinct",

	"tints",

	"tired",

	"tires",

	"toads",

	"toast",

	"today",

	"toils",

	"toits",

	"token",

	"tolls",

	"tombs",

	"toned",

	"toner",

	"tones",

	"tonic",

	"tools",

	"toons",

	"tooth",

	"toper",

	"topic",

	"torch",

	"torot",

	"total",

	"touch",

	"tough",

	"tours",

	"touts",

	"towel",

	"tower",

	"towns",

	"toxic",

	"toxin",

	"trace",

	"track",

	"tract",

	"trade",

	"trail",

	"train",

	"trait",

	"tramp",

	"trams",

	"trank",

	"traps",

	"trash",

	"trays",

	"tread",

	"treat",

	"trees",

	"trend",

	"triad",

	"trial",

	"tribe",

	"trick",

	"tried",

	"tries",

	"trims",

	"tripe",

	"trips",

	"truck",

	"trues",

	"trunk",

	"trust",

	"truth",

	"tubed",

	"tubes",

	"tucks",

	"tummy",

	"tumor",

	"tuned",

	"tuner",

	"tunes",

	"turbo",

	"turfs",

	"turks",

	"turns",

	"tutor",

	"twain",

	"tweak",

	"twice",

	"twigs",

	"twill",

	"twine",

	"twins",

	"twirl",

	"twist",

	"tyers",

	"typed",

	"types",

	"tyred",

	"tyres",

	"ulcer",

	"ultra",

	"uncle",

	"uncut",

	"under",

	"undue",

	"unfit",

	"unfix",

	"unify",

	"union",

	"unite",

	"units",

	"unity",

	"untie",

	"until",

	"unzip",

	"updry",

	"upper",

	"upset",

	"urate",

	"urban",

	"ureas",

	"urine",

	"usage",

	"users",

	"using",

	"usual",

	"utter",

	"uveal",

	"vague",

	"vails",

	"vales",

	"valet",

	"valid",

	"valor",

	"value",

	"valve",

	"vapor",

	"vasts",

	"vatic",

	"vatus",

	"vault",

	"vaunt",

	"veals",

	"vegie",

	"veils",

	"veins",

	"venom",

	"vents",

	"venue",

	"verbs",

	"verse",

	"verve",

	"vests",

	"vexed",

	"vexil",

	"vibes",

	"video",

	"views",

	"vigil",

	"vigor",

	"villa",

	"vinyl",

	"viper",

	"viral",

	"virus",

	"vised",

	"visit",

	"vital",

	"vivid",

	"vocal",

	"vodka",

	"vogue",

	"voice",

	"volts",

	"vomit",

	"voted",

	"voter",

	"votes",

	"vowed",

	"vowel",

	"vroom",

	"wacks",

	"wacky",

	"wafer",

	"wafts",

	"waged",

	"wages",

	"wagon",

	"waist",

	"waits",

	"waken",

	"wakes",

	"wales",

	"walks",

	"walls",

	"wards",

	"wared",

	"warms",

	"washy",

	"waste",

	"watch",

	"water",

	"watts",

	"waved",

	"waver",

	"waves",

	"wears",

	"weary",

	"weave",

	"weeds",

	"weeks",

	"weeps",

	"weepy",

	"weigh",

	"weird",

	"weirs",

	"wells",

	"wests",

	"whack",

	"whale",

	"wharf",

	"wheat",

	"wheel",

	"where",

	"which",

	"while",

	"whims",

	"whips",

	"whirl",

	"whisk",

	"white",

	"whore",

	"whose",

	"wider",

	"wides",

	"widow",

	"width",

	"wield",

	"wilds",

	"wiled",

	"wiles", "wimps",

	"winds",

	"wines",

	"wings",

	"winks",

	"wiped",

	"wiper",

	"wipes",

	"wired",

	"wires",

	"wised",

	"wiser",

	"witch",

	"witty",

	"wives",

	"woken",

	"wolfs",

	"woman",

	"wombs",

	"women",

	"woods",

	"woody",

	"wooed",

	"wools",

	"words",

	"world",

	"worms",

	"worry",

	"worse",

	"worst",

	"worth",

	"would",

	"wound",

	"woven",

	"wraps",

	"wrath",

	"wreck",

	"wrest",

	"wrist",

	"write",

	"wrong",

	"wrote",

	"xerox",

	"xylan",

	"xysts",

	"yacht",

	"yacks",

	"yager",

	"yangs",

	"yanks",

	"yapok",

	"yapon",

	"yappy",

	"yards",

	"yarer",

	"yarns",

	"yeans",

	"yearn",

	"years",

	"yeast",

	"yells",

	"yelps",

	"yetis",

	"yield",

	"yirth",

	"yocks",

	"yodle",

	"yogis",

	"yoked",

	"yokes",

	"yolks",

	"young",

	"yours",

	"youth",

	"yules",

	"zaire",

	"zamia",

	"zappy",

	"zarfs",

	"zaxes",

	"zayin",

	"zazen",

	"zeals",

	"zebra",

	"zeins",

	"zerks",

	"zeros",

	"zests",

	"zincs",

	"zings",

	"zippy",

	"zlote",

	"zoeal",

	"zombi",

	"zoned",

	"zoner",

	"zones",

	"zonks",

	"zooms",

	"zoons",

	"zooty",

	"zoris",

	"zowie",

	"zymes"
                      ];
        }
}
    
};

/**
 * Test methods holder.
 *
**/
var wordcrazeTester = {
    /**
     * Tests if words do not contain multiples.
     *
     **/
    checkForMultiples : function() {
        var noErrors = true;
        noErrors = noErrors && wordcrazeTester._doCheckForMultiples(wordcraze.dictionary.getThreeLetteredWords());
        noErrors = noErrors && wordcrazeTester._doCheckForMultiples(wordcraze.dictionary.getFourLetteredWords());
        noErrors = noErrors && wordcrazeTester._doCheckForMultiples(wordcraze.dictionary.getFiveLetteredWords());
        return noErrors;
    },
    
    _doCheckForMultiples : function(arr) {
        var noErrors = true;
        var p = [];
        for(key in arr) {
            var str = arr[key];
            if(!(p[str] === true)) {
                p[str] = true;
            } else {
                console.log("Duplicates exists for words: " + str);
                noErrors = false;
            }
        }
        return noErrors;
    },
    
    /**
     * Tests if word lengths in the corresponding arrays are accurate.
     *
     **/
    testWordLengths : function() {
        var noErrors = true;
        noErrors = noErrors && wordcrazeTester._doTestWordLengths(wordcraze.dictionary.getThreeLetteredWords(), 3);
        noErrors = noErrors && wordcrazeTester._doTestWordLengths(wordcraze.dictionary.getFourLetteredWords(), 4);
        noErrors = noErrors && wordcrazeTester._doTestWordLengths(wordcraze.dictionary.getFiveLetteredWords(), 5);
        return noErrors;
    },
    
    _doTestWordLengths : function(arr, expectedLength) {
        var noErrors = true;
        for(key in arr) {
            var str = arr[key];
            if(str.length != expectedLength) {
                console.log("The word length is not as expected: " + str + "; expected length: " + expectedLength)
                ;
                noErrors = false;
            }
        }
        return noErrors;
    }
    
};

(function() {
 jQuery(document)
    .ready( function() {
           var noErrors = true;
           try {
            noErrors = noErrors && wordcrazeTester.checkForMultiples();
            noErrors = noErrors && wordcrazeTester.testWordLengths();
           } finally {
              if(console && console.log) {
                console.log("noErrors found? " + noErrors);
              }
           }
           
           if(noErrors || (confirm("Some errors found with the existing word dictionary. Do you want to continue to play the game? See console for errors."))) {
            wordcraze.init();
           } else {
            wordcraze.init(true);
            wordcraze.writeErrorMessage("You have chosen not to play game because of errors in the dictionary. Reload to change your decision.");
           }
    });
})();

