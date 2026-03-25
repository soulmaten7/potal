<?php
/**
 * POTAL Landed Cost — Quote Total Collector
 *
 * Adds import duty + tax to the Magento checkout total when DDP is enabled.
 * This makes the landed cost visible in cart, checkout, and order summary.
 */
namespace Potal\LandedCost\Model\Total;

use Magento\Quote\Model\Quote;
use Magento\Quote\Api\Data\ShippingAssignmentInterface;
use Magento\Quote\Model\Quote\Address\Total;
use Magento\Quote\Model\Quote\Address\Total\AbstractTotal;
use Potal\LandedCost\Helper\Data as PotalHelper;
use Psr\Log\LoggerInterface;

class LandedCost extends AbstractTotal
{
    private PotalHelper $potalHelper;
    private LoggerInterface $logger;

    public function __construct(
        PotalHelper $potalHelper,
        LoggerInterface $logger
    ) {
        $this->potalHelper = $potalHelper;
        $this->logger = $logger;
        $this->setCode('potal_landed_cost');
    }

    public function collect(
        Quote $quote,
        ShippingAssignmentInterface $shippingAssignment,
        Total $total
    ): self {
        parent::collect($quote, $shippingAssignment, $total);

        if (!$this->potalHelper->isEnabled() || !$this->potalHelper->isDdpEnabled()) {
            return $this;
        }

        $address = $shippingAssignment->getShipping()->getAddress();
        $destination = $address->getCountryId();
        if (!$destination) {
            return $this;
        }

        $subtotal = (float) $total->getTotalAmount('subtotal');
        $shipping = (float) $total->getTotalAmount('shipping');

        if ($subtotal <= 0) {
            return $this;
        }

        try {
            $result = $this->potalHelper->callApi('/calculate', [
                'price' => $subtotal,
                'shippingPrice' => $shipping,
                'destinationCountry' => $destination,
                'originCountry' => $this->potalHelper->getOriginCountry(),
            ]);

            if ($result && isset($result['importDuty'])) {
                $duty = (float) ($result['importDuty'] ?? 0);
                $tax = (float) ($result['vat'] ?? 0);
                $landedCostFee = $duty + $tax;

                if ($landedCostFee > 0) {
                    $total->setTotalAmount('potal_landed_cost', $landedCostFee);
                    $total->setBaseTotalAmount('potal_landed_cost', $landedCostFee);
                    $total->setGrandTotal($total->getGrandTotal() + $landedCostFee);
                    $total->setBaseGrandTotal($total->getBaseGrandTotal() + $landedCostFee);

                    $quote->setData('potal_duty', $duty);
                    $quote->setData('potal_tax', $tax);
                    $quote->setData('potal_landed_cost', $landedCostFee);
                }
            }
        } catch (\Exception $e) {
            $this->logger->warning('POTAL: Landed cost calculation failed during checkout', [
                'error' => $e->getMessage(),
                'destination' => $destination,
            ]);
        }

        return $this;
    }

    public function fetch(Quote $quote, Total $total): array
    {
        $amount = (float) $quote->getData('potal_landed_cost');
        if ($amount <= 0) {
            return [];
        }

        return [
            'code' => $this->getCode(),
            'title' => 'Import Duties & Taxes (DDP)',
            'value' => $amount,
        ];
    }

    public function getLabel(): string
    {
        return 'Import Duties & Taxes (DDP)';
    }
}
