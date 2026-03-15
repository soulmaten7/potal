<?php
/**
 * POTAL Magento Observer — Calculate landed cost before order placement
 */
namespace Potal\LandedCost\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;

class OrderPlaceBefore implements ObserverInterface
{
    private $apiKey;
    private $apiUrl = 'https://www.potal.app/api/v1/calculate';

    public function __construct()
    {
        $this->apiKey = getenv('POTAL_API_KEY') ?: '';
    }

    public function execute(Observer $observer)
    {
        if (empty($this->apiKey)) return;

        $order = $observer->getEvent()->getOrder();
        $shippingAddress = $order->getShippingAddress();
        if (!$shippingAddress) return;

        $destination = $shippingAddress->getCountryId();
        $subtotal = $order->getSubtotal();
        $shipping = $order->getShippingAmount();

        $payload = json_encode([
            'price' => (float)$subtotal,
            'shippingPrice' => (float)$shipping,
            'destinationCountry' => $destination,
        ]);

        $ch = curl_init($this->apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if (isset($data['data'])) {
                $result = $data['data'];
                // Store landed cost data as order comment
                $order->addCommentToStatusHistory(
                    sprintf(
                        'POTAL Landed Cost: Duty $%.2f, %s $%.2f, Total $%.2f',
                        $result['importDuty'] ?? 0,
                        $result['vatLabel'] ?? 'VAT',
                        $result['vat'] ?? 0,
                        $result['totalLandedCost'] ?? 0
                    )
                );
            }
        }
    }
}
