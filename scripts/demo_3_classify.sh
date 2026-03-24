#!/bin/bash
clear
echo ""
echo "  POTAL — HS Code Classification"
echo "  ===================================="
echo ""
sleep 1
echo '  $ curl https://www.potal.app/api/v1/classify \'
echo '      -d {"productName":"cotton t-shirt","material":"cotton","category":"apparel"}'
echo ""
sleep 1
echo "  Classification Result:"
echo "  +-----------------------------------------+"
echo "  |  Product:    Cotton T-shirt             |"
echo "  |  Material:   Cotton                     |"
echo "  |  Category:   Apparel                    |"
echo "  |-----------------------------------------|"
echo "  |  Section:    XI  Textiles               |"
echo "  |  Chapter:    61  Knitted apparel        |"
echo "  |  Heading:    6109  T-shirts, singlets   |"
echo "  |  HS Code:    6109.10                    |"
echo "  |  Confidence: 100%                       |"
echo "  +-----------------------------------------+"
echo ""
sleep 2
echo "  9-field input -> 100% accuracy"
echo "  WCO GRI rules — not AI guessing"
echo "  5,371 HS codes | 592 codified rules"
echo ""
sleep 2
echo "  potal.app"
echo ""
sleep 3
