#!/usr/bin/env node

// console.log('hello world')
// return

//const shell = require("shelljs")
const program = require('commander')
const path = require("path");
const fs = require('fs-extra')
const json = require('jsonfile')
const hash = require('hash.js')
const trim = require('trim-character')
const IPFS = require('ipfs')
const csv = require('papaparse')
const Tag = require("en-pos").Tag
const pixelWidth = require('string-pixel-width')

const { exec } = require('child_process')

var server = require('http').createServer().listen(8080)
//const Gun = require({web: server})

const product_hash = hash256('http://linker.com/chadananda_language_flashcards')






program
  .version('0.0.1')
  .option('-i, --import', 'Import Deck to Corpus')
  .option('-d, --deck <folderpath>', "Path to deck export folder. JSON file should be named deck.json")
  .parse(process.argv)

  program.deck = trim((program.deck || __dirname), '/')
  var sourceFile = program.deck + '/deck.json'
  var outputFile = path.resolve(program.deck,'..') + '/'+program.deck.split('/').pop() +'.json'
  var outputFile_csv = path.resolve(program.deck,'..') + '/farsi-1623-ipfs.csv'

//console.log('checking ', sourceFile)
if (!fs.existsSync(sourceFile)) {
  console.error('Deck import JSON should be named "deck.json" and be inside the source folder: \n   ', sourceFile)
  process.exit(1)
}

//console.log('* Loading cards from: "'+sourceFile+'"')
var cards = json.readFileSync(sourceFile)
//console.log('* Loaded', cards.length, 'cards')

const node = new IPFS()
var promises = []

node.on('ready', () => {
  if (fs.existsSync(outputFile)) {
    var cards = json.readFileSync(outputFile, 'utf8')
    console.log('Cards loaded: ', cards.length)
    CSV_merge(cards)
    process.exit(0)
  } else {
    cards.forEach((card, i) => {
      card.files.aud.forEach((file, j) => {
        if (file) promises.push(fs.readFile(program.deck +'/'+ file).then(data => {
          return new Promise(function(resolve, reject) {
            node.files.add(data, function (err, files) {
              cards[i].files.aud[j] = files[0].path
              exec(`ipfs pin add ${files[0].path}`) // ipfs pin add ipfs-path
              setTimeout(resolve, 50)
            })
          })
        })
        )
      })
    })
    Promise.all(promises).then(values => {
      json.writeFileSync(outputFile, cards, 'utf8')
      CSV_merge(cards)
      process.exit(0)
    })
  }
})

function fingerprint(l1,l2) {
  let str = l1+' '+l2
  let newStr = str.split(' ').filter(s=> s && s.indexOf('(')<0).join(' ').toLowerCase().replace(/\!\?\:\.\"/g, '')
  let hashStr =  hash.sha256().update('lang_flashcard'+newStr).digest('hex').slice(0,10)
  return 'crd'+hashStr
}
function oldfp(l1,l2) {
  let str = l1+l2
  let _hash = (str) => hash.sha256().update(str).digest('hex')
  let result = _hash('lang_flashcard'+str).slice(0,10)
  return result
}

function load_csv_cards(csv_file, allCards = {}) {
  if (fs.existsSync(csv_file)) {
    let data = csv.parse(fs.readFileSync(csv_file, "utf8"), {header: true}).data
    data.forEach(card =>  allCards[card.id] = card )
    console.log(`Loaded ${Object.values(allCards).length} cards.`)
   }
  return allCards
}
function sorted_csv_array(cards) {
  return Object.values(cards)
  .sort((c1,c2) => Math.round(c1.level*100) - Math.round(c2.level*100))
  .filter(c => (c.id && c.word1 && c.word2))
}
function save_csv_cards(cards, csv_file) {
  let sorted_array = sorted_csv_array(cards)
  fs.writeFileSync(csv_file, csv.unparse(sorted_array), "utf8")
  console.log(`${sorted_array.length} cards saved.`)
}
function new_csv_card(word1,word2,lang1,lang2,audio1,audio2, tag='') {
  let count =  word1.split(' ').filter(c=>c.indexOf('(')<0)
    .filter(c=>c.toLowerCase()!='the').filter(c=>c != '/').length
  let pos = ''
  if (count===1) {
    let word = word1.split(' ').filter(c=>c.indexOf('(')<0).join(' ')
    pos = new Tag([word]).initial().smooth().tags[0] // pretty sure smoothing does nothing here
  }
  let l2length = word1.split(' ').filter(c=>c.indexOf('(')<0).join(' ').length
  let l2wordCount = word2.split(' ').filter(c=>c.indexOf('(')<0).length
  let difficulty = ((l2wordCount-1) * 10)  + l2length
  if (pos.slice(0,2)!='NN') difficulty+=10
  let newCard = {
    id: fingerprint(word1,word2),
    level: difficulty,
    word1: word1,
    word2: word2,
    pos: pos ? pos : 'phrase',
    wordcount: count,
    lang1: lang1,
    lang2: lang2,
    size1: pixelWidth(word1),
    size2: pixelWidth(word2),
    audio1: audio1,
    audio2: audio2,
    old_id: oldfp(word1, word2),
    tag: tag
  }
  return newCard
}

function CSV_merge(cards_new) {
  var allCards = load_csv_cards(outputFile_csv)  // create keyed object
  cards_new.forEach(card => {
    let newCard = new_csv_card(card.content.words[0],card.content.words[1],
      card.content.lang[0],card.content.lang[1],
      card.files.aud[0],card.files.aud[1])
    if (newCard) allCards[newCard.id] = newCard
  })
  save_csv_cards(allCards, outputFile_csv)
}

function hash256(str) {
  return hash.sha256().update(str).digest('hex')
}



