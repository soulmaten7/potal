<?php
/**
 * POTAL Magento Block — Display estimated duties on product page
 */
namespace Potal\LandedCost\Block;

use Magento\Framework\View\Element\Template;
use Magento\Catalog\Model\Product;

class DutyDisplay extends Template
{
    protected $_template = 'Potal_LandedCost::duty-display.phtml';

    public function getProductPrice()
    {
        $product = $this->getData('product');
        if ($product instanceof Product) {
            return $product->getFinalPrice();
        }
        return 0;
    }

    public function getApiKey()
    {
        return getenv('POTAL_API_KEY') ?: '';
    }

    public function getApiUrl()
    {
        return 'https://www.potal.app/api/v1/calculate';
    }
}
