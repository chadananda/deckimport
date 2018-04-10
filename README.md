# Deckimport -- Flashcard Deck Importer

One-off tool for pushing flashcard decks to Gun.db and audio assets to IPFS -- our flashcard corpus.

TODO: create a small Vue-based UI for managing and editing corpus.
TODO: import flashcards from corpus by difficulty
TODO: re-impolement flashcard tool in Quasar, export to phonegap for Android/iOS and PWA
TODO: add English audio so the cards work both directions, let the user select primary direction based on desired starting language.



## to use

* clone this repository
* ```npm install -g``` to add deckimport command globally
* cd to a deck folder (should contain audio and deck.json)
* type import command: ```deckimport```
* audio files will be added to IPFS and pinned locally
* cards will be added to Gun.db
* table of all cards will be output to disk for review



