<?php
/**
 * POTAL Magento Block — Display estimated duties on product page
 */
namespace Potal\LandedCost\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magento\Catalog\Model\Product;
use Potal\LandedCost\Helper\Data as PotalHelper;

class DutyDisplay extends Template
{
    protected $_template = 'Potal_LandedCost::duty-display.phtml';
    private PotalHelper $potalHelper;

    public function __construct(
        Context $context,
        PotalHelper $potalHelper,
        array $data = []
    ) {
        $this->potalHelper = $potalHelper;
        parent::__construct($context, $data);
    }

    public function getProductPrice(): float
    {
        $product = $this->getData('product');
        if ($product instanceof Product) {
            return (float) $product->getFinalPrice();
        }
        return 0;
    }

    /**
     * Returns the server-side proxy URL (no API key exposed to browser)
     */
    public function getProxyUrl(): string
    {
        return $this->getUrl('potal/api/calculate');
    }
}
