<?php
/**
 * POTAL Magento Observer — Record landed cost metadata on order placement
 */
namespace Potal\LandedCost\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Potal\LandedCost\Helper\Data as PotalHelper;
use Psr\Log\LoggerInterface;

class OrderPlaceBefore implements ObserverInterface
{
    private PotalHelper $potalHelper;
    private LoggerInterface $logger;

    public function __construct(
        PotalHelper $potalHelper,
        LoggerInterface $logger
    ) {
        $this->potalHelper = $potalHelper;
        $this->logger = $logger;
    }

    public function execute(Observer $observer)
    {
        if (!$this->potalHelper->isEnabled()) {
            return;
        }

        $order = $observer->getEvent()->getOrder();
        $shippingAddress = $order->getShippingAddress();
        if (!$shippingAddress) {
            return;
        }

        $destination = $shippingAddress->getCountryId();
        $subtotal = (float) $order->getSubtotal();
        $shipping = (float) $order->getShippingAmount();

        try {
            $result = $this->potalHelper->callApi('/calculate', [
                'price' => $subtotal,
                'shippingPrice' => $shipping,
                'destinationCountry' => $destination,
                'originCountry' => $this->potalHelper->getOriginCountry(),
            ]);

            if ($result && isset($result['importDuty'])) {
                $order->addCommentToStatusHistory(
                    sprintf(
                        'POTAL Landed Cost: Duty $%.2f, %s $%.2f, Total $%.2f (to %s)',
                        $result['importDuty'] ?? 0,
                        $result['vatLabel'] ?? 'VAT',
                        $result['vat'] ?? 0,
                        $result['totalLandedCost'] ?? 0,
                        $destination
                    )
                );
            }
        } catch (\Exception $e) {
            $this->logger->warning('POTAL: Failed to record landed cost on order', [
                'error' => $e->getMessage(),
                'order_id' => $order->getIncrementId(),
                'destination' => $destination,
            ]);
        }
    }
}
