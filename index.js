#!/usr/bin/env node

// console.log('hello world')
// return

//const shell = require("shelljs")
const program = require('commander')
const path = require("path");
const fs = require('fs-extra')
const json = require('jsonfile')
//const hash = require('hash.js')
const trim = require('trim-character')
const IPFS = require('ipfs')

const { exec } = require('child_process')

//const Gun = require('gun')
//var gun = Gun()



program
  .version('0.0.1')
  .option('-i, --import', 'Import Deck to Corpus')
  .option('-d, --deck <folderpath>', "Path to deck export folder. JSON file should be named deck.json")
  .parse(process.argv)

  program.deck = trim((program.deck || __dirname), '/')
  var sourceFile = program.deck + '/deck.json'
  var outputFile = path.resolve(program.deck,'..') + '/'+program.deck.split('/').pop() +'.json'


  console.log(outputFile)
  process.exit(0)


if (!fs.existsSync(sourceFile)) {
  console.error('Deck import JSON should be named "deck.json" and be inside the source folder: \n   ', sourceFile)
  process.exit(1)
}

console.log('* Loading cards from: "'+sourceFile+'"')
var cards = json.readFileSync(sourceFile)
console.log('* Loaded', cards.length, 'cards')

const node = new IPFS()
var promises = []

node.on('ready', () => {
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
    console.log('All done here')
    json.writeFileSync(outputFile, cards)
    // let's loop through this bad boy and add everything to gundb

    process.exit(0)
  })
})



