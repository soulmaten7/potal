#!/bin/bash
clear
echo ""
echo "  POTAL — Total Landed Cost API"
echo "  ================================="
echo ""
sleep 1
echo "  Calculating import cost: Cotton T-shirt, China -> US"
echo ""
sleep 1
echo '  $ curl https://www.potal.app/api/v1/calculate \'
echo '      -H "X-API-Key: pk_live_***" \'
echo '      -d {"productName":"cotton t-shirt","origin":"CN","destination":"US","price":25}'
echo ""
sleep 1
echo "  Calculating..."
sleep 1
echo ""
echo "  Response:"
echo "  +-------------------------------------+"
echo "  |  Product:      Cotton T-shirt       |"
echo "  |  Origin:       China (CN)           |"
echo "  |  Destination:  United States (US)   |"
echo "  |-------------------------------------|"
echo "  |  HS Code:      6109.10              |"
echo "  |  Duty Rate:    16.5%                |"
echo "  |  Duty:         \$4.13               |"
echo "  |  MPF:          \$2.00               |"
echo "  |  VAT/Tax:      \$0.00               |"
echo "  |-------------------------------------|"
echo "  |  Product:      \$25.00              |"
echo "  |  Shipping:     \$8.50               |"
echo "  |  Total Landed: \$39.63              |"
echo "  +-------------------------------------+"
echo ""
sleep 2
echo "  240 countries | 113M+ tariff records | Free: 200 calls/month"
echo "  potal.app"
echo ""
sleep 3
